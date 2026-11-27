"use client";

import Editor, { loader } from "@monaco-editor/react";
import { useEffect, useState } from "react";
import HelpTooltip from "@/components/HelpTooltip";

// Cargar Monaco Editor 100% en local desde /vs (sin peticiones a CDNs externos)
loader.config({ paths: { vs: "/vs" } });

export default function EditorPanel() {
  const [files, setFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/files", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.files) ? data.files : [];
        setFiles(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch((err) => {
        console.error("[EditorPanel] failed to list files:", err);
        setError("No se pudieron listar los archivos del espacio de trabajo.");
      });
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/files?path=${encodeURIComponent(selected)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.content === "string") {
          setContent(data.content);
          setError(null);
        } else {
          setError(data.error || "No se pudo leer el archivo.");
        }
      })
      .catch((err) => {
        console.error("[EditorPanel] failed to read file:", err);
        setError("Error de red leyendo el archivo.");
      });
  }, [selected]);

  const lang = selected.endsWith(".json")
    ? "json"
    : selected.endsWith(".yml") || selected.endsWith(".yaml")
      ? "yaml"
      : "markdown";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col space-y-2 overflow-y-auto max-h-[620px]">
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-zinc-800">
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase">
            Archivos ({files.length})
          </span>
          <HelpTooltip
            title="Carpetas visibles aquí"
            text="Solo lista archivos de gobierno del agente: .agent/ (estado, umbrales y configuración), rules/ (reglas técnicas obligatorias), changes/ (especificaciones de cambios) y DECISIONS/ (decisiones de arquitectura o ADRs)."
          />
        </div>
        {files.length === 0 ? (
          <div className="text-xs font-mono text-zinc-400 p-2">
            No se encontraron archivos en las carpetas permitidas.
          </div>
        ) : (
          files.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelected(f)}
              className={`text-left px-2.5 py-1.5 rounded text-xs font-mono truncate cursor-pointer ${
                selected === f ? "bg-green-600 text-white font-semibold" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
              title={f}
            >
              {f}
            </button>
          ))
        )}
      </div>

      <div className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full shadow-lg">
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-zinc-200 truncate">
            {selected || "Sin archivo seleccionado"}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-zinc-300 font-mono">
              {lang} (solo lectura)
            </span>
            <HelpTooltip
              title="Vista de solo lectura (100% local)"
              text="Por seguridad, aquí solo se inspeccionan archivos sin alterarlos por accidente (para editar especificaciones usa la pestaña Especificaciones). El visor Monaco carga desde /vs en este mismo servidor, sin conexión a internet."
            />
          </div>
        </div>
        {error && <div className="p-3 text-xs font-mono text-red-400">{error}</div>}
        <div className="flex-1 min-h-[480px]">
          <Editor
            height="100%"
            language={lang}
            value={content}
            theme="vs-dark"
            loading={
              <div className="p-4 text-xs font-mono text-zinc-400">
                Cargando visor local de código…
              </div>
            }
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              padding: { top: 12 },
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
