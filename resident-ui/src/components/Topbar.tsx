"use client";

import { useEffect } from "react";
import HelpTooltip from "@/components/HelpTooltip";
import { useAgentStore } from "@/store/agentStore";

const STATUS_LABELS: Record<string, string> = {
  connected: "Conectado",
  degraded: "Degradado",
  error: "Error",
  loading: "Cargando",
};

export default function Topbar() {
  const {
    loading,
    error,
    sseConnected,
    machineState,
    evaluation,
    services,
    memoryProject,
    availableProjects,
    setMemoryProject,
    fetchMemory,
    refreshAll,
    fetchState,
    appendLiveEvent,
    setSseConnected,
  } = useAgentStore();

  useEffect(() => {
    void refreshAll();
    const es = new EventSource("/api/events");
    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    es.addEventListener("telemetry", (evt) => {
      try {
        appendLiveEvent(JSON.parse((evt as MessageEvent).data));
        void fetchState();
      } catch (err) {
        console.error("[Topbar] malformed SSE event:", err);
      }
    });
    return () => {
      es.close();
      setSseConnected(false);
    };
  }, [appendLiveEvent, fetchState, refreshAll, setSseConnected]);

  const phase = typeof machineState?.current_phase === "string" ? machineState.current_phase : "sin sesión activa";
  const sessionId = typeof machineState?.session_id === "string" ? machineState.session_id.slice(0, 8) : "—";
  const alertStatus = evaluation?.status || "SIN_DATOS";

  const bothUp = Boolean(services.valkey?.connected && services.postgres?.connected);
  const overallStatus = error
    ? "error"
    : loading
      ? "loading"
      : bothUp
        ? "connected"
        : "degraded";

  const statusBadgeClass = (s: string) => {
    switch (s) {
      case "connected":
        return "text-green-300 bg-green-950 border-green-700";
      case "degraded":
        return "text-yellow-300 bg-yellow-950 border-yellow-700";
      case "error":
        return "text-red-300 bg-red-950 border-red-700";
      default:
        return "text-zinc-300 bg-zinc-950 border-zinc-700";
    }
  };

  const alertBadgeClass = (s: string) => {
    if (s === "ALERTA") return "text-red-300 bg-red-950 border-red-700";
    if (s === "OK") return "text-green-300 bg-green-950 border-green-700";
    return "text-zinc-300 bg-zinc-950 border-zinc-700";
  };

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-3.5 flex flex-wrap gap-3 justify-between items-center text-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-zinc-400 font-mono text-xs">ENTORNO:</span>
          <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${statusBadgeClass(overallStatus)}`}>
            ● {STATUS_LABELS[overallStatus] || overallStatus}
          </span>
          <HelpTooltip
            title="Estado del Entorno"
            text="Indica si las bases locales del agente (Valkey y PostgreSQL) responden. 'Conectado' significa que todo está listo; 'Degradado' significa que falta algún servicio opcional; 'Error' indica fallo al consultar el panel."
          />
        </div>
        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
        <div className="flex items-center space-x-2">
          <span className="text-zinc-400 font-mono text-xs">SESIÓN:</span>
          <span className="font-semibold text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-mono text-xs">
            {sessionId}
          </span>
          <HelpTooltip
            title="Identificador de Sesión"
            text="Código corto de la ejecución más reciente registrada en .agent/STATE.md. Sirve para rastrear qué acciones pertenecen a la misma corrida del agente. Si muestra '—', aún no hay sesión registrada."
          />
        </div>
        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
        <div className="flex items-center space-x-2">
          <span className="text-zinc-400 font-mono text-xs">FASE:</span>
          <span className="font-semibold text-zinc-200 uppercase tracking-wide text-xs font-mono">
            {phase}
          </span>
          <HelpTooltip
            title="Fase Actual"
            text="Paso exacto del ciclo cognitivo en el que se quedó o está trabajando el agente (por ejemplo: verificar, planificar o actualizar estado)."
          />
        </div>
        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
        <div className="flex items-center space-x-2">
          <span className="text-zinc-400 font-mono text-xs">UMBRALES:</span>
          <span className={`px-2 py-0.5 rounded border text-xs font-mono font-semibold ${alertBadgeClass(alertStatus)}`}>
            {alertStatus}
          </span>
          <HelpTooltip
            title="Estado de Umbrales"
            text="Compara los errores, tiempos y costos del agente contra los límites escritos en .agent/thresholds.json. 'OK' todo bajo control; 'ALERTA' se superó algún límite; 'SIN_DATOS' aún no hay suficientes eventos."
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-1.5">
          <label htmlFor="global-project-select" className="text-zinc-400 font-mono text-xs">
            PROYECTO:
          </label>
          <select
            id="global-project-select"
            value={memoryProject}
            onChange={(e) => {
              const next = e.target.value;
              setMemoryProject(next);
              void fetchMemory(next);
            }}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono text-zinc-100 focus:outline-none focus:border-green-500 cursor-pointer"
          >
            <option value="">Todos los proyectos</option>
            {availableProjects.map((proj) => (
              <option key={proj} value={proj}>
                {proj}
              </option>
            ))}
          </select>
          <HelpTooltip
            title="Selector global de proyecto (project_id)"
            text="Filtra la memoria semántica y los resúmenes de sesión guardados en PostgreSQL por proyecto (arquitectura Hub-and-Spoke) sin editar la URL manualmente."
          />
        </div>
        <div className="flex items-center space-x-1.5">
          <span className={`text-[11px] font-mono ${sseConnected ? "text-green-400" : "text-zinc-400"}`}>
            Eventos en vivo (SSE): {sseConnected ? "en línea" : "desconectado"}
          </span>
          <HelpTooltip
            title="Eventos en vivo (SSE)"
            text="Conexión abierta con el servidor (/api/events) para recibir cada evento nuevo del agente en tiempo real sin tener que recargar la página."
          />
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer"
          >
            ↻ Actualizar
          </button>
          <HelpTooltip
            title="Actualizar Datos"
            text="Vuelve a leer en este instante el estado local (.agent/), la memoria (Valkey y PostgreSQL), el reporte de flota y la sonda de salud."
          />
        </div>
      </div>
    </header>
  );
}
