"use client";

import { useAgentStore } from "@/store/agentStore";

export default function DebugPanel() {
  const { summary, heuristics, evaluation } = useAgentStore();
  const trace = summary?.phase_trace || [];
  const checks = evaluation?.checks ? Object.entries(evaluation.checks) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
      case "OK":
        return "text-green-400 bg-green-950/30 border-green-900";
      case "running":
        return "text-blue-400 bg-blue-950/30 border-blue-900";
      case "failed":
      case "ALERTA":
        return "text-red-400 bg-red-950/30 border-red-900";
      default:
        return "text-zinc-400 bg-zinc-950/30 border-zinc-800";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-300 tracking-wide uppercase">Alert Thresholds & Phase Trace</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Evaluación contra .agent/thresholds.json</p>
        </div>
        <div className="space-y-2 font-mono text-xs">
          {checks.map(([name, item]) => (
            <div key={name} className={`p-3 border rounded-lg flex items-center justify-between ${getStatusColor(item.status)}`}>
              <span>{name}</span>
              <span>
                medido={item.measured ?? "—"} / umbral={item.threshold ?? "—"} [{item.status}]
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-800 pt-3 space-y-2 overflow-y-auto flex-1 font-mono text-xs">
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
        <div>
          <h3 className="text-sm font-bold text-zinc-300 tracking-wide uppercase">
            Active Heuristics Engine ({heuristics.length})
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Reglas reales cargadas de .agent/heuristics.json</p>
        </div>
        <div className="space-y-2.5 overflow-y-auto flex-1">
          {heuristics.length === 0 ? (
            <div className="p-3 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-500">
              No se cargaron reglas de .agent/heuristics.json.
            </div>
          ) : (
            heuristics.map((h) => (
              <div key={h.id} className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg text-xs font-mono space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-green-400 font-bold">
                    {h.id} · P{h.priority}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase">{h.category}</span>
                </div>
                <div className="text-cyan-400">➔ {h.action}</div>
                <div className="text-zinc-400 text-[11px]">{h.description}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
