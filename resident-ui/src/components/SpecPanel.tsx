"use client";

import { useState } from "react";
import { useAgentStore } from "@/store/agentStore";

export default function SpecPanel() {
  const { specs, specsMarkdown, saveSpecsMarkdown } = useAgentStore();
  const [draft, setDraft] = useState(specsMarkdown);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  // Cuando SPECS.md cambia en el servidor, el borrador se reinicia durante el render (patrón de React para
  // derivar estado de una prop), no en un efecto: evita un render extra con el borrador viejo.
  const [source, setSource] = useState(specsMarkdown);
  if (specsMarkdown !== source) {
    setSource(specsMarkdown);
    setDraft(specsMarkdown);
  }

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    const res = await saveSpecsMarkdown(draft);
    setSaving(false);
    if (res.ok) setNotice({ kind: "ok", text: "Guardado atómicamente en .agent/SPECS.md" });
    else setNotice({ kind: "err", text: res.error || "No se pudo guardar" });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-300 tracking-wide uppercase">OpenSpec Contracts</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Leídos desde .agent/SPECS.md</p>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1">
          {specs.length === 0 ? (
            <div className="p-3 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-500">
              No hay especificaciones registradas en .agent/SPECS.md.
            </div>
          ) : (
            specs.map((s) => (
              <div
                key={s.id}
                className="p-3 border border-zinc-800 bg-zinc-950/60 rounded-lg flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm text-zinc-200 font-bold">{s.id}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold border ${
                      s.status.toUpperCase() === "APROBADO"
                        ? "bg-green-950 text-green-400 border-green-900"
                        : "bg-yellow-950 text-yellow-400 border-yellow-900"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                {s.title && <span className="text-xs text-zinc-400">{s.title}</span>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-300 tracking-wide uppercase">Specification Editor</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Edición directa de .agent/SPECS.md</p>
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
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-300 focus:outline-none focus:border-green-600 transition resize-none leading-relaxed min-h-[360px]"
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setDraft(specsMarkdown);
                setNotice(null);
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Descartar
            </button>
            <button
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
  );
}
