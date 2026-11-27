"use client";

import Console from "@/components/Console";
import LiveTrace from "@/components/LiveTrace";
import { useAgentStore } from "@/store/agentStore";

export default function Dashboard() {
  const { agentDir, summary, evaluation, services, profile, specs, error } = useAgentStore();

  const approvedSpecs = specs.filter((s) => s.status.toUpperCase() === "APROBADO").length;
  const p95 = summary?.latency_p95_ms !== null && summary?.latency_p95_ms !== undefined ? `${summary.latency_p95_ms} ms` : "SIN_DATOS";
  const errRate = summary?.error_rate !== null && summary?.error_rate !== undefined ? `${(summary.error_rate * 100).toFixed(1)}%` : "SIN_DATOS";
  const cost = summary ? `$${summary.total_cost_usd.toFixed(4)}` : "$0.0000";
  const savedTokens = summary?.tokens_saved_by_hooks_est ?? 0;

  return (
    <div className="space-y-6 h-full flex flex-col">
      {error && (
        <div className="p-3 rounded-lg border border-red-800 bg-red-950/40 text-xs font-mono text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Latencia p95</span>
          <span className="text-2xl font-black text-cyan-400 mt-2">{p95}</span>
          <span className="text-[11px] text-zinc-500 font-mono mt-1">
            {summary?.measured_runs ?? 0} ejecuciones medidas
          </span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Tasa de Error</span>
          <span className={`text-2xl font-black mt-2 ${(summary?.errors ?? 0) > 0 ? "text-red-400" : "text-green-400"}`}>
            {errRate}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono mt-1">
            {summary?.errors ?? 0} errores / {summary?.abstentions ?? 0} abstenciones
          </span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Costo y Ahorro</span>
          <span className="text-2xl font-black text-purple-400 mt-2">{cost}</span>
          <span className="text-[11px] text-zinc-500 font-mono mt-1">
            Hooks ahorraron ~{savedTokens} tokens
          </span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">Estado Umbrales</span>
          <span
            className={`text-2xl font-black mt-2 ${
              evaluation?.status === "ALERTA"
                ? "text-red-400"
                : evaluation?.status === "OK"
                  ? "text-green-400"
                  : "text-zinc-400"
            }`}
          >
            {evaluation?.status || "SIN_DATOS"}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono mt-1">
            Specs aprobadas: {approvedSpecs}/{specs.length}
          </span>
        </div>
      </div>

      {evaluation && evaluation.breaches.length > 0 && (
        <div className="p-4 rounded-lg border border-red-800 bg-red-950/30 text-xs font-mono text-red-300 space-y-1">
          <div className="font-bold uppercase">Umbrales superados</div>
          {evaluation.breaches.map((b, i) => (
            <div key={i}>• {b}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 flex flex-col">
          <LiveTrace />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
          <h3 className="text-sm font-bold text-zinc-300 tracking-wide uppercase">System Summary</h3>
          <div className="space-y-3 flex-1 overflow-y-auto text-xs font-mono text-zinc-400">
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg">
              <span className="text-zinc-500">Agent Dir:</span> {agentDir || "—"}
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg">
              <span className="text-zinc-500">Last Event:</span> {summary?.last_event_at || "sin eventos"}
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg">
              <span className="text-zinc-500">Valkey:</span>{" "}
              {services.valkey
                ? services.valkey.connected
                  ? `connected (${services.valkey.latency_ms}ms)`
                  : `disconnected (${services.valkey.error || "unreachable"})`
                : "checking…"}
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg">
              <span className="text-zinc-500">PostgreSQL:</span>{" "}
              {services.postgres
                ? services.postgres.connected
                  ? `connected (${services.postgres.latency_ms}ms)`
                  : `disconnected (${services.postgres.error || "unreachable"})`
                : "checking…"}
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg">
              <span className="text-zinc-500">Profile:</span>{" "}
              {Object.keys(profile).length > 0 ? JSON.stringify(profile) : "default (all rules apply)"}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
        <Console />
      </div>
    </div>
  );
}
