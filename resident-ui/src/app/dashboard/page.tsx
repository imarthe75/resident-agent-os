"use client";

import { useState } from "react";
import Console from "@/components/Console";
import EmptyStateGuide from "@/components/EmptyStateGuide";
import HelpTooltip from "@/components/HelpTooltip";
import LiveTrace from "@/components/LiveTrace";
import { useAgentStore } from "@/store/agentStore";

export default function Dashboard() {
  const { agentDir, summary, evaluation, services, profile, specs, sessionSummaries, error } = useAgentStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  const approvedSpecs = specs.filter((s) => s.status.toUpperCase() === "APROBADO").length;
  const p95 = summary?.latency_p95_ms !== null && summary?.latency_p95_ms !== undefined ? `${summary.latency_p95_ms} ms` : "SIN_DATOS";
  const errRate = summary?.error_rate !== null && summary?.error_rate !== undefined ? `${(summary.error_rate * 100).toFixed(1)}%` : "SIN_DATOS";
  const cost = summary ? `$${summary.total_cost_usd.toFixed(4)}` : "$0.0000";
  const savedTokens = summary?.tokens_saved_by_hooks_est ?? 0;

  const sessionsHistory = summary?.sessions_history || [];
  const activeSession =
    selectedSessionId ? sessionsHistory.find((s) => s.session_id === selectedSessionId) || null : sessionsHistory[0] || null;
  const hookSavings = summary?.hook_savings;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-lg font-bold text-zinc-100">Núcleo del Agente</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Resumen en tiempo real de salud, rendimiento, ahorro por hooks, historial de sesiones y telemetría de tu agente residente.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-800 bg-red-950/40 text-xs font-mono text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-400 font-mono text-xs uppercase tracking-wider">Latencia p95</span>
            <HelpTooltip
              title="Latencia p95"
              text="Tiempo máximo que tarda el 95% de las ejecuciones del agente (en milisegundos). Sirve para detectar lentitud real sin que un caso aislado distorsione el promedio. Si sube por encima del umbral configurado, se marca alerta."
            />
          </div>
          <span className="text-2xl font-black text-cyan-400 mt-2">{p95}</span>
          <span className="text-[11px] text-zinc-400 font-mono mt-1">
            {summary?.measured_runs ?? 0} ejecuciones medidas
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-400 font-mono text-xs uppercase tracking-wider">Tasa de error</span>
            <HelpTooltip
              title="Tasa de error y abstenciones"
              text="Porcentaje de corridas que terminaron con fallo. Las abstenciones son veces en que el agente decidió no adivinar por falta de certeza (eso es sano). En verde (0%) está perfecto; en rojo conviene revisar Depuración y Reglas."
            />
          </div>
          <span className={`text-2xl font-black mt-2 ${(summary?.errors ?? 0) > 0 ? "text-red-400" : "text-green-400"}`}>
            {errRate}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono mt-1">
            {summary?.errors ?? 0} errores / {summary?.abstentions ?? 0} abstenciones
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-400 font-mono text-xs uppercase tracking-wider">Costo y ahorro</span>
            <HelpTooltip
              title="Costo y ahorro por hooks"
              text="Costo acumulado estimado de las llamadas al modelo en dólares y cuántos tokens ahorraron los filtros automáticos al compactar salidas largas de terminal sin perder errores."
            />
          </div>
          <span className="text-2xl font-black text-purple-400 mt-2">{cost}</span>
          <span className="text-[11px] text-zinc-400 font-mono mt-1">
            Los hooks ahorraron ~{savedTokens} tokens
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-400 font-mono text-xs uppercase tracking-wider">Estado de umbrales</span>
            <HelpTooltip
              title="Estado de umbrales"
              text="Veredicto global al comparar latencia, errores, costo y abstenciones contra .agent/thresholds.json. 'OK' todo dentro de límite; 'ALERTA' requiere revisión; 'SIN_DATOS' aún faltan eventos."
            />
          </div>
          <span
            className={`text-2xl font-black mt-2 ${
              evaluation?.status === "ALERTA"
                ? "text-red-400"
                : evaluation?.status === "OK"
                  ? "text-green-400"
                  : "text-zinc-300"
            }`}
          >
            {evaluation?.status || "SIN_DATOS"}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono mt-1">
            Especificaciones aprobadas: {approvedSpecs}/{specs.length}
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

      {/* Ahorro real por hooks + Historial de sesiones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">
                Ahorro real de tokens por hooks
              </h2>
              <HelpTooltip
                title="Ahorro por hooks"
                text="Compara cuántos tokens se habrían enviado en bruto al modelo frente a lo que realmente pasó tras los filtros automáticos (compress-output.js, run-filtered.js, codebase-map.js). Si no hay eventos aún, declara SIN_DATOS."
              />
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {hookSavings?.available ? `${hookSavings.total_events} eventos` : "SIN_DATOS"}
            </span>
          </div>

          {!hookSavings?.available ? (
            <EmptyStateGuide
              title="Sin datos de ahorro por hooks todavía"
              explanation="Este bloque se llena automáticamente cuando corren los hooks (compress-output.js, run-filtered.js, codebase-map.js) y escriben en .agent/telemetry/events.jsonl. Puedes probar la salud del entorno con:"
              command="python3 -m agent doctor && python3 -m agent thresholds"
            />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-zinc-400">Brutos est.</div>
                  <div className="text-lg font-black text-zinc-100 mt-1">{hookSavings.tokens_raw_est}</div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-zinc-400">Filtrados est.</div>
                  <div className="text-lg font-black text-blue-300 mt-1">{hookSavings.tokens_filtered_est}</div>
                </div>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div className="text-zinc-400">Ahorrados</div>
                  <div className="text-lg font-black text-green-400 mt-1">{hookSavings.tokens_saved_est}</div>
                </div>
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {hookSavings.by_hook.map((row) => (
                  <div key={row.hook} className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-zinc-200 font-semibold truncate">{row.hook}</span>
                    <span className="text-zinc-400 shrink-0">
                      {row.events} ev · <span className="text-green-400">~{row.tokens_saved_est} tok</span> ({row.chars_saved} chars)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">
                Historial de sesiones
              </h2>
              <HelpTooltip
                title="Historial de sesiones y límite ECC"
                text="Permite elegir cualquier sesión registrada en events.jsonl (y ver resúmenes de PostgreSQL si está conectado) para inspeccionar su traza, duración, fases fallidas y si alcanzó el límite ECC de 3 reintentos."
              />
            </div>

            {sessionsHistory.length > 0 && (
              <select
                aria-label="Seleccionar sesión histórica"
                value={selectedSessionId || sessionsHistory[0]?.session_id || ""}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-100 cursor-pointer"
              >
                {sessionsHistory.map((s) => (
                  <option key={s.session_id} value={s.session_id}>
                    {s.session_id.slice(0, 12)} ({s.total_events} ev · {s.outcome})
                  </option>
                ))}
              </select>
            )}
          </div>

          {!activeSession && sessionSummaries.length === 0 ? (
            <EmptyStateGuide
              title="Aún no hay sesiones registradas"
              explanation="Cada corrida del agente o de los hooks crea un session_id en .agent/telemetry/events.jsonl y guarda resúmenes en PostgreSQL cuando está conectado."
              command="python3 -m agent verify --path ."
            />
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {activeSession && (
                <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-green-400 font-bold">Sesión {activeSession.session_id.slice(0, 16)}</span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${
                        activeSession.ecc_limit_breached
                          ? "border-red-800 bg-red-950/40 text-red-300"
                          : activeSession.failed_phases.length > 0
                            ? "border-yellow-800 bg-yellow-950/40 text-yellow-200"
                            : "border-green-800 bg-green-950/40 text-green-300"
                      }`}
                    >
                      {activeSession.ecc_limit_breached
                        ? "Límite ECC (≥3 reintentos)"
                        : activeSession.outcome}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-zinc-300">
                    <div>Duración: <span className="text-zinc-100">{activeSession.duration_ms} ms</span></div>
                    <div>Reintentos: <span className="text-zinc-100">{activeSession.retries}/3</span></div>
                    <div>Eventos: <span className="text-zinc-100">{activeSession.total_events}</span></div>
                  </div>
                  {activeSession.failed_phases.length > 0 && (
                    <div className="text-red-300">
                      Fases con fallo: {activeSession.failed_phases.join(", ")}
                    </div>
                  )}
                </div>
              )}

              {sessionSummaries.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  <div className="text-[11px] text-zinc-400 uppercase">Resúmenes persistidos en PostgreSQL ({sessionSummaries.length})</div>
                  {sessionSummaries.slice(0, 3).map((s) => (
                    <div key={s.id} className="p-2.5 rounded bg-zinc-950/50 border border-zinc-800 text-zinc-300 truncate" title={s.summary}>
                      [{s.session_id.slice(0, 8)}] {s.summary}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2 flex flex-col">
          <LiveTrace
            traceOverride={activeSession ? activeSession.phase_trace : null}
            sessionLabel={activeSession ? activeSession.session_id.slice(0, 12) : null}
          />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">Resumen del sistema</h3>
            <HelpTooltip
              title="Resumen del sistema"
              text="Muestra de dónde está leyendo los archivos el panel y si las bases locales (Valkey y PostgreSQL) están respondiendo."
            />
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto text-xs font-mono text-zinc-300">
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg flex items-start justify-between gap-2">
              <div className="break-all">
                <span className="text-zinc-400">Carpeta .agent (Agent Dir):</span> {agentDir || "—"}
              </div>
              <HelpTooltip
                title="Carpeta .agent (Agent Dir)"
                text="Ubicación exacta donde viven el estado, las especificaciones, las reglas heurísticas y la telemetría del proyecto que está observando este panel."
              />
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg flex items-start justify-between gap-2">
              <div>
                <span className="text-zinc-400">Último evento:</span> {summary?.last_event_at || "sin eventos"}
              </div>
              <HelpTooltip
                title="Último evento"
                text="Fecha y hora de la última línea registrada en .agent/telemetry/events.jsonl. Te ayuda a confirmar si el agente estuvo activo recientemente."
              />
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg flex items-start justify-between gap-2">
              <div>
                <span className="text-zinc-400">Valkey:</span>{" "}
                {services.valkey
                  ? services.valkey.connected
                    ? `conectado (${services.valkey.latency_ms}ms)`
                    : `desconectado (${services.valkey.error || "no alcanzable"})`
                  : "comprobando…"}
              </div>
              <HelpTooltip
                title="Valkey (memoria de corto plazo)"
                text="Caché en memoria muy rápida donde el agente guarda datos temporales de la sesión actual. Es opcional; si aparece desconectado, el panel sigue funcionando pero sin caché."
              />
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg flex items-start justify-between gap-2">
              <div>
                <span className="text-zinc-400">PostgreSQL:</span>{" "}
                {services.postgres
                  ? services.postgres.connected
                    ? `conectado (${services.postgres.latency_ms}ms)`
                    : `desconectado (${services.postgres.error || "no alcanzable"})`
                  : "comprobando…"}
              </div>
              <HelpTooltip
                title="PostgreSQL + pgvector (memoria de largo plazo)"
                text="Base de datos local donde el agente almacena recuerdos, lecciones aprendidas y resúmenes de sesión por proyecto para consultarlos en futuros trabajos."
              />
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg flex items-start justify-between gap-2">
              <div className="break-all">
                <span className="text-zinc-400">Perfil (PROFILE.json):</span>{" "}
                {Object.keys(profile).length > 0 ? JSON.stringify(profile) : "por defecto (aplican todas las reglas)"}
              </div>
              <HelpTooltip
                title="Perfil del proyecto"
                text="Configuración opcional (.agent/PROFILE.json) que indica el tipo de proyecto para activar o ajustar reglas aplicables. Si no existe, se aplican todas las reglas estándar."
              />
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
