"use client";

import { useEffect, useState } from "react";
import EmptyStateGuide from "@/components/EmptyStateGuide";
import HelpTooltip from "@/components/HelpTooltip";
import { useAgentStore } from "@/store/agentStore";

interface DoctorPayload {
  runtimes: Record<string, { available: boolean; version: string | null }>;
  detected_hosts: Record<string, boolean>;
  host_sync: { checked: boolean; in_sync: boolean; missing: string[]; drifted: string[]; reason?: string };
  hooks: Array<{ event: string; matcher: string; command: string }>;
  status_line: string | null;
}

interface RoutingPayload {
  available: boolean;
  default_tier: string;
  agents: Array<{
    name: string;
    file: string | null;
    description: string;
    tier: string;
    escalate_to: string | null;
    reason: string;
    providers: Record<string, string>;
  }>;
}

const CHECK_LABELS: Record<string, string> = {
  latency_p95_ms: "Latencia p95 (ms)",
  error_rate: "Tasa de error",
  cost_per_run_usd: "Costo por corrida (USD)",
  abstention_rate: "Tasa de abstención",
};

const READINESS_LABELS: Record<string, string> = {
  ready: "Listo (100% operativo)",
  degraded: "Degradado (funciona con servicios parciales)",
  unavailable: "No disponible",
};

const TIER_STYLES: Record<string, string> = {
  fast: "border-cyan-800 bg-cyan-950/40 text-cyan-300",
  balanced: "border-blue-800 bg-blue-950/40 text-blue-300",
  reasoning: "border-purple-800 bg-purple-950/40 text-purple-300",
};

export default function DebugPanel() {
  const { summary, heuristics, evaluation, readiness, events, fetchReadiness } = useAgentStore();
  const [doctor, setDoctor] = useState<DoctorPayload | null>(null);
  const [routing, setRouting] = useState<RoutingPayload | null>(null);

  const fetchDiagnostics = async () => {
    const [docRes, rtRes] = await Promise.all([
      fetch("/api/doctor", { cache: "no-store" }),
      fetch("/api/routing", { cache: "no-store" }),
    ]);
    return {
      doctor: docRes.ok ? ((await docRes.json()) as DoctorPayload) : null,
      routing: rtRes.ok ? ((await rtRes.json()) as RoutingPayload) : null,
    };
  };

  const loadDiagnostics = async () => {
    try {
      const next = await fetchDiagnostics();
      if (next.doctor) setDoctor(next.doctor);
      if (next.routing) setRouting(next.routing);
    } catch (err) {
      console.error("[DebugPanel] failed loading doctor/routing:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchDiagnostics()
      .then((next) => {
        if (cancelled) return;
        if (next.doctor) setDoctor(next.doctor);
        if (next.routing) setRouting(next.routing);
      })
      .catch((err) => {
        console.error("[DebugPanel] failed loading doctor/routing:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const trace = summary?.phase_trace || [];
  const checks = evaluation?.checks ? Object.entries(evaluation.checks) : [];
  const recentErrors = events
    .filter((ev) => ev.outcome === "error" || ev.outcome === "syntax_error" || ev.level === "ERROR")
    .slice(-10)
    .reverse();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
      case "OK":
      case "ready":
        return "text-green-300 bg-green-950/30 border-green-800";
      case "running":
        return "text-blue-300 bg-blue-950/30 border-blue-800";
      case "degraded":
        return "text-yellow-300 bg-yellow-950/30 border-yellow-800";
      case "failed":
      case "ALERTA":
      case "unavailable":
        return "text-red-300 bg-red-950/30 border-red-800";
      default:
        return "text-zinc-300 bg-zinc-950/30 border-zinc-800";
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-zinc-100">Depuración, Diagnóstico y Ruteo de Modelos</h1>
          <HelpTooltip
            title="Depuración y Reglas"
            text="Centro de diagnóstico técnico: revisa la sonda de salud (/api/health/ready), herramientas y hosts de IA detectados (ros doctor), ruteo de modelos por subagente, errores recientes y reglas heurísticas."
          />
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">
          Comprueba el entorno local, detecta deriva en .claude/, inspecciona el ruteo de modelos y consulta las reglas heurísticas activas.
        </p>
      </div>

      {/* Sonda de salud */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
              Sonda de salud y preparación (/api/health/ready)
            </h2>
            <HelpTooltip
              title="Sonda de salud (/api/health/ready)"
              text="Comprueba en tiempo real tres requisitos: que la carpeta .agent/ sea legible, que Valkey responda y que PostgreSQL responda. Si todo está en verde, el entorno está listo; si falta alguno, indica cuál falló."
            />
          </div>
          <button
            type="button"
            onClick={() => {
              void fetchReadiness();
              void loadDiagnostics();
            }}
            className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
          >
            ↻ Re-diagnosticar
          </button>
        </div>

        {!readiness ? (
          <div className="text-xs font-mono text-zinc-400">Consultando /api/health/ready…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className={`p-3 border rounded-lg ${getStatusColor(readiness.status)}`}>
              <div className="text-[10px] uppercase opacity-80">Estado global</div>
              <div className="font-bold mt-1">{READINESS_LABELS[readiness.status] || readiness.status}</div>
            </div>
            <div className={`p-3 border rounded-lg ${getStatusColor(readiness.dependencies.agent_dir.ok ? "OK" : "ALERTA")}`}>
              <div className="text-[10px] uppercase opacity-80">Carpeta .agent</div>
              <div className="font-bold mt-1">{readiness.dependencies.agent_dir.ok ? "Legible" : "No accesible"}</div>
              <div className="text-[10px] opacity-80 truncate">{readiness.dependencies.agent_dir.path}</div>
            </div>
            <div className={`p-3 border rounded-lg ${getStatusColor(readiness.dependencies.valkey.ok ? "OK" : "degraded")}`}>
              <div className="text-[10px] uppercase opacity-80">Valkey</div>
              <div className="font-bold mt-1">
                {readiness.dependencies.valkey.ok
                  ? `Conectado (${readiness.dependencies.valkey.latency_ms ?? 0}ms)`
                  : "Desconectado"}
              </div>
              {readiness.dependencies.valkey.error && (
                <div className="text-[10px] opacity-80 truncate">{readiness.dependencies.valkey.error}</div>
              )}
            </div>
            <div className={`p-3 border rounded-lg ${getStatusColor(readiness.dependencies.postgres.ok ? "OK" : "degraded")}`}>
              <div className="text-[10px] uppercase opacity-80">PostgreSQL</div>
              <div className="font-bold mt-1">
                {readiness.dependencies.postgres.ok
                  ? `Conectado (${readiness.dependencies.postgres.latency_ms ?? 0}ms)`
                  : "Desconectado"}
              </div>
              {readiness.dependencies.postgres.error && (
                <div className="text-[10px] opacity-80 truncate">{readiness.dependencies.postgres.error}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Diagnóstico del Entorno (ros doctor) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
            Diagnóstico del Entorno (ros doctor)
          </h2>
          <HelpTooltip
            title="Diagnóstico del Entorno"
            text="Equivalente visual a 'ros doctor': muestra qué herramientas están instaladas (Python, Node, Git, psql), qué asistentes de IA tienen configuración lista, si .claude/ está sincronizado y qué hooks están activos."
          />
        </div>

        {!doctor ? (
          <div className="text-xs font-mono text-zinc-400">Cargando diagnóstico desde /api/doctor…</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              {Object.entries(doctor.runtimes).map(([name, rt]) => (
                <div
                  key={name}
                  className={`p-3 rounded-lg border ${
                    rt.available
                      ? "border-green-800 bg-green-950/20 text-green-300"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400"
                  }`}
                >
                  <div className="uppercase font-bold">{name}</div>
                  <div className="text-[11px] mt-1 truncate">{rt.available ? rt.version : "no instalado"}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 uppercase">
                <span>Hosts de IA detectados</span>
                <HelpTooltip
                  title="Hosts de IA detectados"
                  text="Asistentes que ya tienen su archivo de configuración o servidor MCP presente en el proyecto (verde = detectado, gris = sin configurar todavía)."
                />
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {Object.entries(doctor.detected_hosts).map(([host, active]) => (
                  <span
                    key={host}
                    className={`px-2.5 py-1 rounded-full border ${
                      active
                        ? "border-green-700 bg-green-950/40 text-green-300 font-semibold"
                        : "border-zinc-800 bg-zinc-950 text-zinc-500"
                    }`}
                  >
                    {active ? "✔ " : "○ "}
                    {host}
                  </span>
                ))}
              </div>
            </div>

            {/* Estado SSOT .agents -> .claude */}
            {doctor.host_sync.checked && !doctor.host_sync.in_sync ? (
              <EmptyStateGuide
                title={`Deriva detectada en .claude/ (${doctor.host_sync.drifted.length} modificados, ${doctor.host_sync.missing.length} faltantes)`}
                explanation="La proyección .claude/ está desincronizada respecto a las fuentes canónicas (agents/, commands/, .agents/skills/). Ejecuta el comando de sincronización para alinearla:"
                command="python3 -m agent sync-hosts --target ."
                helpText="Nunca edites .claude/agents ni .claude/skills a mano; sync-hosts los regenera e inyecta automáticamente el modelo correcto por subagente."
              />
            ) : (
              <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 text-xs font-mono text-zinc-300 flex items-center justify-between gap-2">
                <span>
                  Sincronización SSOT (.agents/ → .claude/):{" "}
                  <strong className="text-green-400">
                    {doctor.host_sync.checked ? "Al día (0 deriva)" : doctor.host_sync.reason || "Sin proyecciones locales"}
                  </strong>
                </span>
                <HelpTooltip
                  title="Sincronización SSOT"
                  text="Comprueba que .claude/ coincida byte a byte con agents/, commands/ y .agents/skills/. Si hay deriva, aparecerá un aviso con el comando 'ros sync-hosts'."
                />
              </div>
            )}

            {/* Hooks configurados */}
            {doctor.hooks.length > 0 && (
              <details className="border border-zinc-800 rounded-lg bg-zinc-950/40">
                <summary className="px-4 py-2.5 text-xs font-mono font-semibold text-zinc-200 cursor-pointer">
                  Hooks configurados en .claude/settings.json ({doctor.hooks.length})
                  {doctor.status_line ? " + statusLine activo" : ""}
                </summary>
                <div className="px-4 pb-3 space-y-1.5 font-mono text-xs border-t border-zinc-800 pt-2">
                  {doctor.hooks.map((h, i) => (
                    <div key={i} className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 break-all">
                      <span className="text-cyan-300 font-bold">[{h.event}]</span>{" "}
                      <span className="text-zinc-400">matcher={h.matcher}</span> → <span>{h.command}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Tabla de Ruteo de Subagentes y Modelos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
            Ruteo de Subagentes y Modelos (.agent/model-routing.json)
          </h2>
          <HelpTooltip
            title="¿Para qué sirve el ruteo por niveles?"
            text="Usa modelos económicos (fast) en tareas mecánicas o búsquedas, modelos equilibrados (balanced) en lógica normal y modelos de razonamiento profundo (reasoning) solo en arquitectura o seguridad. Así ahorras costo sin sacrificar calidad."
          />
        </div>

        {!routing || !routing.available ? (
          <EmptyStateGuide
            title="Sin archivo .agent/model-routing.json"
            explanation="Genera la tabla agnóstica de modelos ejecutando init-host en tu proyecto:"
            command="python3 -m agent init-host --host all --target ."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-950 text-zinc-300 uppercase border-b border-zinc-800">
                <tr>
                  <th className="p-2.5">Subagente</th>
                  <th className="p-2.5">Nivel</th>
                  <th className="p-2.5">Claude</th>
                  <th className="p-2.5">Antigravity</th>
                  <th className="p-2.5">Gemini</th>
                  <th className="p-2.5">Codex</th>
                  <th className="p-2.5">Escala a / Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {routing.agents.map((ag) => (
                  <tr key={ag.name} className="hover:bg-zinc-800/40">
                    <td className="p-2.5 font-bold text-zinc-100">{ag.name}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${TIER_STYLES[ag.tier] || "border-zinc-700 text-zinc-300"}`}>
                        {ag.tier}
                      </span>
                    </td>
                    <td className="p-2.5 text-zinc-200">{ag.providers.claude || "—"}</td>
                    <td className="p-2.5 text-zinc-200">{ag.providers.antigravity || "—"}</td>
                    <td className="p-2.5 text-zinc-200">{ag.providers.gemini || "—"}</td>
                    <td className="p-2.5 text-zinc-200">{ag.providers.codex || "—"}</td>
                    <td className="p-2.5 text-zinc-400 font-sans text-xs">
                      {ag.escalate_to ? <span className="text-yellow-300 font-mono mr-1.5">↑ {ag.escalate_to}</span> : null}
                      {ag.reason || ag.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Umbrales, Errores Recientes y Heurísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
                Umbrales de alerta y errores recientes
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Evaluación contra .agent/thresholds.json y eventos de error
              </p>
            </div>
            <HelpTooltip
              title="Umbrales y errores recientes"
              text="Arriba ves si cada señal (latencia, errores, costo, abstenciones) está por debajo de su tope. Abajo aparecen los últimos errores registrados en telemetría para saber qué falló y en qué fase."
            />
          </div>
          <div className="space-y-2 font-mono text-xs">
            {checks.map(([name, item]) => (
              <div key={name} className={`p-3 border rounded-lg flex items-center justify-between gap-2 ${getStatusColor(item.status)}`}>
                <span>{CHECK_LABELS[name] || name}</span>
                <span>
                  medido={item.measured ?? "—"} / umbral={item.threshold ?? "—"} [{item.status}]
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 uppercase">
              <span>Errores recientes ({recentErrors.length})</span>
              <HelpTooltip
                title="Cómo leer los errores recientes"
                text="Cada línea muestra la hora, el origen (hook o agente), la fase donde ocurrió y el motivo. Si no hay errores aquí, las ejecuciones recientes terminaron limpias."
              />
            </div>
            {recentErrors.length === 0 ? (
              <div className="p-3 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400">
                Sin errores registrados en la telemetría reciente.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-xs">
                {recentErrors.map((ev, idx) => (
                  <div key={idx} className="p-2.5 border border-red-900 bg-red-950/30 rounded-lg text-red-200">
                    <span className="text-zinc-400 mr-2">[{ev.timestamp?.slice(11, 19) || "--:--:--"}]</span>
                    <span className="font-bold mr-2">[{ev.source}:{ev.phase || "-"}]</span>
                    <span>{ev.event} ({ev.outcome || ev.level})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-3 space-y-2 overflow-y-auto flex-1 font-mono text-xs">
            <div className="text-xs font-mono font-bold text-zinc-300 uppercase">Última traza de fases</div>
            {trace.map((t) => (
              <div key={t.step} className={`p-2.5 border rounded-lg flex items-center justify-between ${getStatusColor(t.status)}`}>
                <span>{t.step}</span>
                <span className="text-[10px] uppercase font-bold">
                  {t.duration_ms !== null ? `${t.duration_ms}ms · ` : ""}
                  {t.outcome || t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
                Motor de Reglas Heurísticas ({heuristics.length})
              </h2>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Reglas activas cargadas de .agent/heuristics.json
              </p>
            </div>
            <HelpTooltip
              title="¿Qué son las reglas heurísticas?"
              text="Son frenos automáticos escritos en .agent/heuristics.json para evitar que el agente entre en bucles infinitos o desperdicie recursos (por ejemplo, escalar a una persona tras 3 reintentos fallidos). P1 es máxima prioridad."
            />
          </div>
          <div className="space-y-2.5 overflow-y-auto flex-1">
            {heuristics.length === 0 ? (
              <div className="p-3 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400">
                No se cargaron reglas de .agent/heuristics.json.
              </div>
            ) : (
              heuristics.map((h) => (
                <div key={h.id} className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg text-xs font-mono space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 font-bold">
                      {h.id} · Prioridad P{h.priority}
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase">{h.category}</span>
                  </div>
                  <div className="text-cyan-300">➔ {h.action}</div>
                  <div className="text-zinc-300 text-[11px]">{h.description}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
