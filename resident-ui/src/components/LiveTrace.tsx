"use client";

import HelpTooltip from "@/components/HelpTooltip";
import type { PhaseTraceItem } from "@/lib/agentData";
import { useAgentStore } from "@/store/agentStore";

interface PhaseGuide {
  label: string;
  help: string;
}

const PHASE_GUIDES: Record<string, PhaseGuide> = {
  boot: {
    label: "Arranque del agente",
    help: "Enciende la sesión, asigna un identificador único y verifica que la carpeta .agent/ exista y se pueda leer. Si falla, el entorno no está listo para operar.",
  },
  load_context: {
    label: "Carga de contexto",
    help: "Lee las reglas del proyecto y el estado previo (.agent/STATE.md) para no empezar desde cero ni olvidar lo que ya se avanzó.",
  },
  retrieve_memory: {
    label: "Consulta de memoria",
    help: "Busca recuerdos relevantes y lecciones aprendidas en Valkey y PostgreSQL antes de decidir qué hacer, evitando repetir errores pasados.",
  },
  ask_decisions: {
    label: "Consulta de decisiones",
    help: "Revisa si hay decisiones arquitectónicas (ADRs) o dudas abiertas que requieren confirmación humana antes de continuar.",
  },
  apply_heuristics: {
    label: "Reglas heurísticas",
    help: "Aplica protecciones automáticas desde .agent/heuristics.json (como detener bucles después de 3 reintentos fallidos) para evitar gasto innecesario.",
  },
  ensure_spec: {
    label: "Verificación de especificación",
    help: "Comprueba que exista una especificación aprobada en .agent/SPECS.md antes de escribir código. Sin contrato aprobado, el agente no debe improvisar.",
  },
  plan_tasks: {
    label: "Planificación de tareas",
    help: "Divide el objetivo en pasos pequeños, ordenados y verificables para ejecutarlos sin romper otras partes del sistema.",
  },
  execute: {
    label: "Ejecución",
    help: "Realiza el trabajo concreto de la tarea (leer, editar código o correr comandos autorizados). Es donde suele concentrarse el tiempo de ejecución.",
  },
  verify: {
    label: "Verificación",
    help: "Ejecuta pruebas y verificadores reales para demostrar que el cambio funciona antes de declararlo listo. Si falla aquí, el trabajo no se da por cerrado.",
  },
  store_memory: {
    label: "Guardado en memoria",
    help: "Guarda en PostgreSQL + pgvector las lecciones o resultados verificados de la sesión para reutilizarlos en futuras tareas.",
  },
  update_state: {
    label: "Actualización de estado",
    help: "Deja por escrito en .agent/STATE.md qué se logró y qué queda pendiente para que la siguiente sesión continúe sin perder el hilo.",
  },
};

const OUTCOME_LABELS: Record<string, string> = {
  done: "completado",
  running: "en curso",
  failed: "fallido",
  pending: "pendiente",
  ok: "correcto",
  error: "error",
  degraded: "degradado",
};

interface LiveTraceProps {
  traceOverride?: PhaseTraceItem[] | null;
  sessionLabel?: string | null;
}

export default function LiveTrace({ traceOverride = null, sessionLabel = null }: LiveTraceProps = {}) {
  const { summary } = useAgentStore();
  const trace = traceOverride || summary?.phase_trace || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <span className="text-green-400 font-bold mr-2">✔</span>;
      case "running":
        return <span className="text-blue-400 font-bold mr-2">●</span>;
      case "failed":
        return <span className="text-red-400 font-bold mr-2">✘</span>;
      default:
        return <span className="text-zinc-500 mr-2">○</span>;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "done":
        return "text-zinc-200 border-green-800 bg-green-950/20";
      case "running":
        return "text-white border-blue-700 bg-blue-950/20 font-bold";
      case "failed":
        return "text-red-300 border-red-900 bg-red-950/20";
      default:
        return "text-zinc-400 border-zinc-800 bg-zinc-950/10";
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4 h-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">
              Traza del Ciclo Cognitivo
            </h3>
            <HelpTooltip
              title="Traza del Ciclo Cognitivo"
              text="Lista ordenada de los pasos que sigue el agente en cada sesión: desde arrancar y leer reglas hasta ejecutar, verificar con pruebas y guardar su estado final. Verde = hecho, azul = en curso, rojo = falló, gris = pendiente."
            />
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            {sessionLabel
              ? `Inspeccionando sesión ${sessionLabel} en .agent/telemetry/events.jsonl`
              : "Estado real de la última sesión registrada en .agent/telemetry/events.jsonl"}
          </p>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {trace.length === 0 ? (
          <div className="text-xs font-mono text-zinc-400 p-4 border border-zinc-800 rounded-lg">
            Sin eventos registrados todavía. Ejecuta ResidentAgentLoop o un hook para poblar la traza.
          </div>
        ) : (
          trace.map((t) => {
            const guide = PHASE_GUIDES[t.step] || {
              label: t.step,
              help: `Fase '${t.step}' del ciclo interno del agente.`,
            };
            const rawOutcome = t.outcome || t.status;
            const outcomeLabel = OUTCOME_LABELS[rawOutcome] || rawOutcome;
            return (
              <div
                key={t.step}
                className={`flex items-center p-2.5 rounded-lg border text-xs transition ${getStatusClass(t.status)}`}
              >
                {getStatusIcon(t.status)}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-zinc-100 truncate">{guide.label}</span>
                  <span className="font-mono text-[11px] text-zinc-400">({t.step})</span>
                  <HelpTooltip title={`${guide.label} (${t.step})`} text={guide.help} />
                </div>
                <span className="ml-auto flex items-center space-x-3 font-mono text-[10px] pl-2 shrink-0">
                  {t.duration_ms !== null && <span className="text-zinc-300">{t.duration_ms} ms</span>}
                  <span className="uppercase tracking-wider font-semibold opacity-90">
                    {outcomeLabel}
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
