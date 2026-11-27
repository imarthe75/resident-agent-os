"use client";

import { useAgentStore } from "@/store/agentStore";

export default function MemoryPanel() {
  const { memories, sessionSummaries, valkeyKeys, valkeyDbSize, services, memoryError, fetchMemory } = useAgentStore();

  const getEvidenceStyle = (level: string) => {
    switch ((level || "").toUpperCase()) {
      case "CIERTO":
        return "text-green-400 bg-green-950/40 border-green-800";
      case "PROBABLE":
        return "text-cyan-400 bg-cyan-950/40 border-cyan-800";
      default:
        return "text-yellow-400 bg-yellow-950/40 border-yellow-800";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-zinc-300 tracking-wide uppercase">
              Long-Term Memory (PostgreSQL + pgvector)
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              {services.postgres?.connected
                ? `Conectado a ${services.postgres.host}:${services.postgres.port}/${services.postgres.database}`
                : "DESCONECTADO"}
            </p>
          </div>
          <button
            onClick={() => void fetchMemory()}
            className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
          >
            ↻ Consultar
          </button>
        </div>

        {memoryError.postgres && (
          <div className="p-3 border border-yellow-800 bg-yellow-950/30 rounded-lg text-xs font-mono text-yellow-300">
            PostgreSQL: {memoryError.postgres}
          </div>
        )}

        <div className="space-y-3 overflow-y-auto flex-1">
          {memories.length === 0 ? (
            <div className="p-4 border border-zinc-800 bg-zinc-950/40 rounded-lg text-xs font-mono text-zinc-500">
              Sin registros en memory.agent_memory (o base de datos no conectada).
            </div>
          ) : (
            memories.map((m) => (
              <div key={m.id} className="p-4 border border-zinc-800 bg-zinc-950/40 rounded-lg space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-zinc-700 text-zinc-300">
                    {m.memory_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getEvidenceStyle(m.evidence_level)}`}>
                    {m.evidence_level}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                    imp={m.importance_score}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-mono">{m.content}</p>
              </div>
            ))
          )}

          {sessionSummaries.length > 0 && (
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase">
                Resúmenes de sesión (memory.session_summaries)
              </div>
              {sessionSummaries.map((s) => (
                <div key={s.id} className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg text-xs font-mono text-zinc-400 whitespace-pre-wrap">
                  {s.summary}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-300 tracking-wide uppercase">
            Short-Term Cache (Valkey)
          </h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            {services.valkey?.connected
              ? `Conectado a ${services.valkey.host}:${services.valkey.port} · keys totales: ${valkeyDbSize ?? valkeyKeys.length}`
              : "DESCONECTADO"}
          </p>
        </div>

        {memoryError.valkey && (
          <div className="p-3 border border-red-800 bg-red-950/30 rounded-lg text-xs font-mono text-red-300">
            Valkey: {memoryError.valkey}
          </div>
        )}

        <div className="space-y-2 overflow-y-auto flex-1 font-mono text-xs">
          {valkeyKeys.length === 0 ? (
            <div className="p-4 border border-zinc-800 bg-zinc-950/40 rounded-lg text-zinc-500">
              {services.valkey?.connected
                ? "Valkey conectado, pero sin claves activas en este momento."
                : "Sin conexión a Valkey. Levanta agent-cache con docker compose up -d agent-cache."}
            </div>
          ) : (
            valkeyKeys.map((item) => (
              <div
                key={item.key}
                className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg flex items-center justify-between"
              >
                <span className="text-zinc-300 break-all">{item.key}</span>
                <span className="text-[10px] bg-green-950 text-green-400 border border-green-900 px-2 py-0.5 rounded uppercase ml-2">
                  {item.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
