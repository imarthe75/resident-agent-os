"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";

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
        setError("No se pudieron listar los archivos del workspace.");
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
        <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Workspace Files ({files.length})</div>
        {files.map((f) => (
          <button
            key={f}
            onClick={() => setSelected(f)}
            className={`text-left px-2.5 py-1.5 rounded text-xs font-mono truncate cursor-pointer ${
              selected === f ? "bg-green-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
            title={f}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full shadow-lg">
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-300">{selected || "Sin archivo seleccionado"}</span>
          <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded text-zinc-400 font-mono">
            {lang} (solo lectura)
          </span>
        </div>
        {error && <div className="p-3 text-xs font-mono text-red-400">{error}</div>}
        <div className="flex-1 min-h-[480px]">
          <Editor
            height="100%"
            language={lang}
            value={content}
            theme="vs-dark"
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
