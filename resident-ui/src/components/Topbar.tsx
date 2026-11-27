"use client";

import { useEffect } from "react";
import { useAgentStore } from "@/store/agentStore";

export default function Topbar() {
  const {
    loading,
    error,
    sseConnected,
    machineState,
    evaluation,
    services,
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
        return "text-green-400 bg-green-950 border-green-800";
      case "degraded":
        return "text-yellow-400 bg-yellow-950 border-yellow-800";
      case "error":
        return "text-red-400 bg-red-950 border-red-800";
      default:
        return "text-zinc-400 bg-zinc-950 border-zinc-800";
    }
  };

  const alertBadgeClass = (s: string) => {
    if (s === "ALERTA") return "text-red-400 bg-red-950 border-red-800";
    if (s === "OK") return "text-green-400 bg-green-950 border-green-800";
    return "text-zinc-400 bg-zinc-950 border-zinc-800";
  };

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex justify-between items-center text-sm">
      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-2">
          <span className="text-zinc-500 font-mono text-xs">RUNTIME:</span>
          <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wider ${statusBadgeClass(overallStatus)}`}>
            ● {overallStatus}
          </span>
        </div>
        <div className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center space-x-2">
          <span className="text-zinc-500 font-mono text-xs">SESSION:</span>
          <span className="font-semibold text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-mono text-xs">
            {sessionId}
          </span>
        </div>
        <div className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center space-x-2">
          <span className="text-zinc-500 font-mono text-xs">PHASE:</span>
          <span className="font-semibold text-zinc-300 uppercase tracking-wide text-xs font-mono">
            {phase}
          </span>
        </div>
        <div className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center space-x-2">
          <span className="text-zinc-500 font-mono text-xs">UMBRALES:</span>
          <span className={`px-2 py-0.5 rounded border text-xs font-mono font-semibold ${alertBadgeClass(alertStatus)}`}>
            {alertStatus}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`text-[11px] font-mono ${sseConnected ? "text-green-400" : "text-zinc-500"}`}>
          SSE: {sseConnected ? "live" : "offline"}
        </span>
        <button
          onClick={() => void refreshAll()}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer"
        >
          ↻ Actualizar
        </button>
      </div>
    </div>
  );
}
