import { create } from "zustand";
import type {
  HeuristicRule,
  PhaseTraceItem,
  PostgresMemoryRow,
  SessionSummaryRow,
  SpecEntry,
  TelemetryEvent,
} from "@/lib/agentData";

export interface ServiceStatus {
  connected: boolean;
  host: string;
  port: number;
  database?: string;
  latency_ms: number | null;
  error: string | null;
}

export interface TelemetrySummary {
  total_events: number;
  sessions: number;
  measured_runs: number;
  errors: number;
  error_rate: number | null;
  abstentions: number;
  abstention_rate: number | null;
  latency_avg_ms: number | null;
  latency_p95_ms: number | null;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost_usd: number;
  cost_per_run_usd: number | null;
  chars_saved_by_hooks: number;
  tokens_saved_by_hooks_est: number;
  last_event_at: string | null;
  phase_trace: PhaseTraceItem[];
}

export interface ThresholdCheck {
  status: string;
  measured: number | null;
  threshold: number | null;
}

export interface ThresholdEvaluation {
  status: "OK" | "ALERTA" | "SIN_DATOS" | string;
  breaches: string[];
  checks: Record<string, ThresholdCheck>;
}

export interface FleetRepoRow {
  name: string;
  path: string;
  drift: boolean;
  framework_version: string | null;
  expected_version: string | null;
  missing_files: number;
  modified_files: number;
  verifiers: {
    cumple: number;
    no_cumple: number;
    no_evaluado: number;
    failed_names: string[];
  };
  outdated_dependencies: number | null;
  telemetry: {
    total_events: number;
    errors: number;
    latency_p95_ms: number | null;
    total_cost_usd: number;
    tokens_saved_by_hooks_est: number;
    threshold_status: string;
    breaches: string[];
  };
}

export interface FleetReport {
  available: boolean;
  generated_at: string | null;
  source: string | null;
  totals: Record<string, number> | null;
  repos: FleetRepoRow[];
  message?: string;
}

export interface AgentStoreState {
  loading: boolean;
  error: string | null;
  lastSyncAt: string | null;
  sseConnected: boolean;
  agentDir: string;
  machineState: Record<string, unknown> | null;
  specs: SpecEntry[];
  specsMarkdown: string;
  heuristics: HeuristicRule[];
  profile: Record<string, unknown>;
  events: TelemetryEvent[];
  summary: TelemetrySummary | null;
  evaluation: ThresholdEvaluation | null;
  services: {
    valkey: ServiceStatus | null;
    postgres: ServiceStatus | null;
  };
  valkeyKeys: Array<{ key: string; status: string }>;
  valkeyDbSize: number | null;
  memories: PostgresMemoryRow[];
  sessionSummaries: SessionSummaryRow[];
  memoryError: { valkey: string | null; postgres: string | null };
  fleet: FleetReport | null;

  fetchState: () => Promise<void>;
  fetchMemory: () => Promise<void>;
  fetchFleet: () => Promise<void>;
  refreshAll: () => Promise<void>;
  appendLiveEvent: (ev: TelemetryEvent) => void;
  setSseConnected: (connected: boolean) => void;
  saveSpecsMarkdown: (markdown: string) => Promise<{ ok: boolean; error?: string }>;
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  loading: true,
  error: null,
  lastSyncAt: null,
  sseConnected: false,
  agentDir: "",
  machineState: null,
  specs: [],
  specsMarkdown: "",
  heuristics: [],
  profile: {},
  events: [],
  summary: null,
  evaluation: null,
  services: { valkey: null, postgres: null },
  valkeyKeys: [],
  valkeyDbSize: null,
  memories: [],
  sessionSummaries: [],
  memoryError: { valkey: null, postgres: null },
  fleet: null,

  fetchState: async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({
        loading: false,
        error: null,
        lastSyncAt: data.timestamp || new Date().toISOString(),
        agentDir: data.agentDir || "",
        machineState: data.machineState || null,
        specs: Array.isArray(data.specs) ? data.specs : [],
        specsMarkdown: typeof data.specsMarkdown === "string" ? data.specsMarkdown : "",
        heuristics: Array.isArray(data.heuristics) ? data.heuristics : [],
        profile: data.profile || {},
        events: Array.isArray(data.events) ? data.events : [],
        summary: data.summary || null,
        evaluation: data.evaluation || null,
        services: {
          valkey: data.services?.valkey || null,
          postgres: data.services?.postgres || null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[agentStore] fetchState failed:", err);
      set({ loading: false, error: `Error consultando /api/state: ${message}` });
    }
  },

  fetchMemory: async () => {
    try {
      const res = await fetch("/api/memory", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({
        valkeyKeys: Array.isArray(data.valkey?.keys) ? data.valkey.keys : [],
        valkeyDbSize: typeof data.valkey?.dbsize === "number" ? data.valkey.dbsize : null,
        memories: Array.isArray(data.postgres?.memories) ? data.postgres.memories : [],
        sessionSummaries: Array.isArray(data.postgres?.summaries) ? data.postgres.summaries : [],
        memoryError: {
          valkey: data.valkey?.error || null,
          postgres: data.postgres?.error || null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[agentStore] fetchMemory failed:", err);
      set({ memoryError: { valkey: message, postgres: message } });
    }
  },

  fetchFleet: async () => {
    try {
      const res = await fetch("/api/fleet", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ fleet: data });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[agentStore] fetchFleet failed:", err);
      set({
        fleet: {
          available: false,
          generated_at: null,
          source: null,
          totals: null,
          repos: [],
          message: `Error consultando /api/fleet: ${message}`,
        },
      });
    }
  },

  refreshAll: async () => {
    await Promise.all([get().fetchState(), get().fetchMemory(), get().fetchFleet()]);
  },

  appendLiveEvent: (ev) =>
    set((state) => ({
      events: [...state.events.slice(-199), ev],
      lastSyncAt: new Date().toISOString(),
    })),

  setSseConnected: (sseConnected) => set({ sseConnected }),

  saveSpecsMarkdown: async (markdown: string) => {
    try {
      const res = await fetch("/api/specs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || `HTTP ${res.status}` };
      }
      set({ specsMarkdown: markdown, specs: Array.isArray(data.specs) ? data.specs : get().specs });
      return { ok: true };
    } catch (err) {
      console.error("[agentStore] saveSpecsMarkdown failed:", err);
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
}));
