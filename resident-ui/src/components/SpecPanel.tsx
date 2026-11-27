"use client";

import { useEffect, useState } from "react";
import HelpTooltip from "@/components/HelpTooltip";
import { useAgentStore } from "@/store/agentStore";

interface DecisionsPayload {
  decision_policy: {
    available: boolean;
    thresholds: Record<string, number>;
    questions: Array<{ id: string; type: string; instructions: string; criteria: Record<string, string> }>;
  };
  adrs: Array<{ id: string; title: string; status: string; path: string; excerpt: string; content: string }>;
  doc_specs: Array<{ slug: string; title: string; status: string; path: string; requirements: string[] }>;
}

export default function SpecPanel() {
  const { specs, specsMarkdown, saveSpecsMarkdown } = useAgentStore();
  const [subTab, setSubTab] = useState<"specs" | "adrs">("specs");
  const [decisions, setDecisions] = useState<DecisionsPayload | null>(null);
  const [selectedAdr, setSelectedAdr] = useState<string>("");
  const [draft, setDraft] = useState(specsMarkdown);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [source, setSource] = useState(specsMarkdown);
  if (specsMarkdown !== source) {
    setSource(specsMarkdown);
    setDraft(specsMarkdown);
  }

  useEffect(() => {
    fetch("/api/decisions", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: DecisionsPayload) => {
        setDecisions(d);
        if (d.adrs?.length > 0) setSelectedAdr(d.adrs[0].id);
      })
      .catch((err) => console.error("[SpecPanel] failed loading /api/decisions:", err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    const res = await saveSpecsMarkdown(draft);
    setSaving(false);
    if (res.ok) setNotice({ kind: "ok", text: "Guardado de forma atómica y segura en .agent/SPECS.md" });
    else setNotice({ kind: "err", text: res.error || "No se pudo guardar la especificación." });
  };

  const activeAdr = decisions?.adrs.find((a) => a.id === selectedAdr) || decisions?.adrs[0] || null;

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-100">Especificaciones, Trazabilidad y ADRs</h1>
            <HelpTooltip
              title="¿Qué es una especificación y un ADR?"
              text="La especificación (SPECS.md o docs/specs/) acuerda qué se va a construir antes de programar. Los ADRs (DECISIONS/) registran por qué se tomó cada decisión técnica importante para no reabrir debates."
            />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gestiona .agent/SPECS.md con guardado atómico, revisa requisitos de docs/specs/ y consulta las Decisiones Técnicas (ADRs).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab("specs")}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
              subTab === "specs" ? "bg-green-600 text-white" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            📜 Contratos y Trazabilidad ({specs.length + (decisions?.doc_specs.length ?? 0)})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("adrs")}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold cursor-pointer ${
              subTab === "adrs" ? "bg-green-600 text-white" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            🧭 Decisiones Técnicas / ADRs ({decisions?.adrs.length ?? 0})
          </button>
        </div>
      </div>

      {subTab === "specs" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">Contratos y requisitos</h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">Leídos desde .agent/SPECS.md y docs/specs/</p>
              </div>
              <HelpTooltip
                title="Estados de especificación"
                text="Verde (APROBADO) significa que el requisito está confirmado y listo para implementarse. Amarillo (PENDIENTE/borrador) indica que aún falta revisión humana antes de programar."
              />
            </div>

            <div className="space-y-2 overflow-y-auto flex-1">
              {specs.length === 0 && (!decisions?.doc_specs || decisions.doc_specs.length === 0) ? (
                <div className="p-3 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400">
                  No hay especificaciones registradas en .agent/SPECS.md ni en docs/specs/.
                </div>
              ) : (
                <>
                  {specs.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 border border-zinc-800 bg-zinc-950/60 rounded-lg flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono text-sm text-zinc-100 font-bold">{s.id}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border ${
                            s.status.toUpperCase() === "APROBADO"
                              ? "bg-green-950 text-green-300 border-green-800"
                              : "bg-yellow-950 text-yellow-300 border-yellow-800"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      {s.title && <span className="text-xs text-zinc-300">{s.title}</span>}
                    </div>
                  ))}

                  {decisions?.doc_specs.map((ds) => (
                    <div
                      key={ds.slug}
                      className="p-3 border border-zinc-800 bg-zinc-950/60 rounded-lg flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-mono text-xs text-cyan-300 font-bold">{ds.slug}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border ${
                            ds.status.toUpperCase().includes("APROB")
                              ? "bg-green-950 text-green-300 border-green-800"
                              : "bg-yellow-950 text-yellow-300 border-yellow-800"
                          }`}
                        >
                          {ds.status}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-200">{ds.title}</span>
                      {ds.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {ds.requirements.map((req) => (
                            <span key={req} className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono text-[10px] text-zinc-300">
                              {req}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-zinc-200 tracking-wide uppercase">Editor de especificaciones</h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">Edición directa en Markdown de .agent/SPECS.md</p>
              </div>
              <HelpTooltip
                title="Guardado atómico seguro"
                text="Al pulsar Guardar, el servidor escribe primero en un archivo temporal y luego lo reemplaza en un solo paso. Así .agent/SPECS.md nunca queda a medias ni corrupto si ocurre un corte."
              />
            </div>
            {notice && (
              <div
                className={`p-2.5 rounded border text-xs font-mono ${
                  notice.kind === "ok"
                    ? "border-green-800 bg-green-950/30 text-green-300"
                    : "border-red-800 bg-red-950/30 text-red-300"
                }`}
              >
                {notice.text}
              </div>
            )}
            <div className="flex-1 flex flex-col space-y-3">
              <textarea
                aria-label="Contenido Markdown de .agent/SPECS.md"
                placeholder="# Especificaciones del proyecto&#10;Escribe o actualiza aquí el contenido de .agent/SPECS.md..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-200 focus:outline-none focus:border-green-500 transition resize-none leading-relaxed min-h-[360px]"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(specsMarkdown);
                    setNotice(null);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Descartar cambios
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {saving ? "Guardando…" : "Guardar SPECS.md"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 flex-1 flex flex-col">
          {decisions?.decision_policy.available && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">
                  Política de decisiones tipadas (.agent/decisions.json)
                </h2>
                <HelpTooltip
                  title="Decisiones tipadas (.agent/decisions.json)"
                  text="Preguntas cerradas con umbrales numéricos que el código usa para decidir automáticamente cuándo aplicar un cambio, cuándo marcarlo o cuándo escalar a una persona."
                />
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {Object.entries(decisions.decision_policy.thresholds).map(([k, v]) => (
                  <span key={k} className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-cyan-300">
                    umbral.{k} = {v}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {decisions.decision_policy.questions.map((q) => (
                  <div key={q.id} className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
                    <div className="font-mono font-bold text-green-400">{q.id} ({q.type})</div>
                    <p className="text-zinc-300">{q.instructions}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2 overflow-y-auto max-h-[540px]">
              <div className="text-xs font-mono font-bold text-zinc-300 uppercase pb-1 border-b border-zinc-800">
                ADRs en DECISIONS/ ({decisions?.adrs.length ?? 0})
              </div>
              {!decisions || decisions.adrs.length === 0 ? (
                <div className="text-xs font-mono text-zinc-400 p-2">
                  No se encontraron archivos ADR en DECISIONS/ ni en documentacion/adr/.
                </div>
              ) : (
                decisions.adrs.map((adr) => (
                  <button
                    key={adr.id}
                    type="button"
                    onClick={() => setSelectedAdr(adr.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition cursor-pointer space-y-1 ${
                      activeAdr?.id === adr.id
                        ? "border-green-600 bg-green-950/30 text-white"
                        : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    <div className="font-mono font-bold text-green-400 truncate">{adr.id}</div>
                    <div className="font-semibold line-clamp-2">{adr.title}</div>
                    <div className="text-[10px] font-mono text-zinc-400">{adr.path}</div>
                  </button>
                ))
              )}
            </div>

            <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-3 overflow-y-auto max-h-[540px]">
              {activeAdr ? (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                    <h3 className="text-sm font-bold text-zinc-100">{activeAdr.title}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-700 bg-zinc-950 text-zinc-300">
                      {activeAdr.path}
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {activeAdr.content}
                  </pre>
                </>
              ) : (
                <div className="text-xs font-mono text-zinc-400">
                  Selecciona un ADR a la izquierda para leer su contenido.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
