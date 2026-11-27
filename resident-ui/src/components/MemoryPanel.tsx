"use client";

import EmptyStateGuide from "@/components/EmptyStateGuide";
import HelpTooltip from "@/components/HelpTooltip";
import { useAgentStore } from "@/store/agentStore";

export default function MemoryPanel() {
  const {
    memories,
    sessionSummaries,
    valkeyKeys,
    valkeyDbSize,
    services,
    memoryError,
    memoryProject,
    setMemoryProject,
    fetchMemory,
  } = useAgentStore();

  const getEvidenceStyle = (level: string) => {
    switch ((level || "").toUpperCase()) {
      case "CIERTO":
        return "text-green-300 bg-green-950/40 border-green-800";
      case "PROBABLE":
        return "text-cyan-300 bg-cyan-950/40 border-cyan-800";
      default:
        return "text-yellow-300 bg-yellow-950/40 border-yellow-800";
    }
  };

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-100">Memoria Semántica</h1>
            <HelpTooltip
              title="¿Cómo recuerda el agente?"
              text="Usa dos memorias complementarias: Valkey (memoria rápida de corto plazo para la sesión actual) y PostgreSQL + pgvector (memoria duradera de largo plazo donde guarda lecciones, hechos verificados y resúmenes por proyecto)."
            />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Consulta recuerdos persistentes en PostgreSQL + pgvector y claves activas en la caché temporal de Valkey.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void fetchMemory(memoryProject);
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="memory-project-filter" className="text-xs font-mono text-zinc-400">
            project_id:
          </label>
          <input
            id="memory-project-filter"
            type="text"
            value={memoryProject}
            onChange={(e) => setMemoryProject(e.target.value)}
            placeholder="todos los proyectos"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-green-500 w-44"
          />
          <HelpTooltip
            title="Filtro por proyecto (project_id)"
            text="Cada proyecto guarda sus recuerdos separados por su identificador (project_id) en la arquitectura Hub-and-Spoke. Déjalo vacío para ver todos o escribe el nombre de un repositorio concreto para aislar su memoria."
          />
          <button
            type="submit"
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 cursor-pointer"
          >
            ↻ Consultar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
                  Memoria de largo plazo (PostgreSQL + pgvector)
                </h2>
                <HelpTooltip
                  title="Memoria de largo plazo (PostgreSQL + pgvector)"
                  text="Base de datos permanente donde el agente guarda conocimiento reutilizable entre sesiones y resúmenes finales. Cada recuerdo lleva nivel de evidencia: CIERTO (verificado), PROBABLE o HIPÓTESIS."
                />
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {services.postgres?.connected
                  ? `Conectado a ${services.postgres.host}:${services.postgres.port}/${services.postgres.database}`
                  : "DESCONECTADO"}
              </p>
            </div>
          </div>

          {memoryError.postgres && (
            <div className="p-3 border border-yellow-800 bg-yellow-950/30 rounded-lg text-xs font-mono text-yellow-200">
              PostgreSQL: {memoryError.postgres}
            </div>
          )}

          <div className="space-y-3 overflow-y-auto flex-1">
            {memories.length === 0 ? (
              <EmptyStateGuide
                title="Sin recuerdos en PostgreSQL todavía"
                explanation="La tabla memory.agent_memory aún no tiene registros para este filtro (o PostgreSQL está apagado). Levanta el Hub o consulta el estado de memoria con:"
                command="docker compose up -d agent-db agent-cache && python3 -m agent memory"
              />
            ) : (
              memories.map((m) => (
                <div key={m.id} className="p-4 border border-zinc-800 bg-zinc-950/40 rounded-lg space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-zinc-700 text-zinc-200">
                      {m.memory_type}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getEvidenceStyle(m.evidence_level)}`}>
                      {m.evidence_level}
                    </span>
                    {m.project_id && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        proyecto={m.project_id}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400 font-mono ml-auto">
                      importancia={m.importance_score}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-mono">{m.content}</p>
                </div>
              ))
            )}

            {sessionSummaries.length > 0 && (
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                <div className="text-xs font-mono font-bold text-zinc-300 uppercase">
                  Resúmenes de sesión (memory.session_summaries)
                </div>
                {sessionSummaries.map((s) => (
                  <div key={s.id} className="p-3 border border-zinc-800 bg-zinc-950/40 rounded-lg text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                    {s.summary}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
                Caché de corto plazo (Valkey)
              </h2>
              <HelpTooltip
                title="Caché de corto plazo (Valkey)"
                text="Memoria ultrarrápida y temporal donde el agente guarda resultados recientes o claves de trabajo activo para no repetir consultas costosas. Que esté vacía cuando el agente está en reposo es completamente normal."
              />
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {services.valkey?.connected
                ? `Conectado a ${services.valkey.host}:${services.valkey.port} · claves totales: ${valkeyDbSize ?? valkeyKeys.length}`
                : "DESCONECTADO"}
            </p>
          </div>

          {memoryError.valkey && (
            <div className="p-3 border border-red-800 bg-red-950/30 rounded-lg text-xs font-mono text-red-200">
              Valkey: {memoryError.valkey}
            </div>
          )}

          <div className="space-y-2 overflow-y-auto flex-1 font-mono text-xs">
            {valkeyKeys.length === 0 ? (
              <div className="p-4 border border-zinc-800 bg-zinc-950/40 rounded-lg text-zinc-400">
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
                  <span className="text-zinc-200 break-all">{item.key}</span>
                  <span className="text-[10px] bg-green-950 text-green-300 border border-green-800 px-2 py-0.5 rounded uppercase ml-2">
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
