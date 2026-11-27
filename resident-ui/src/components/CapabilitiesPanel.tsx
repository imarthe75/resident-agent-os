"use client";

import { useEffect, useState } from "react";
import HelpTooltip from "@/components/HelpTooltip";

interface CapabilitiesPayload {
  skills_source: string | null;
  counts: { skills: number; commands: number; path_rules: number };
  skills: Array<{ name: string; description: string; path: string }>;
  commands: Array<{ command: string; title: string; summary: string; path: string }>;
  path_rules: Array<{ id: string; severity: string; globs: string[]; instructions: string }>;
}

type TabKey = "skills" | "commands" | "path_rules";

export default function CapabilitiesPanel() {
  const [data, setData] = useState<CapabilitiesPayload | null>(null);
  const [tab, setTab] = useState<TabKey>("skills");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/capabilities", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => {
        console.error("[CapabilitiesPanel] failed loading capabilities:", err);
        setError("No se pudo cargar el catálogo de capacidades.");
      });
  }, []);

  const q = query.trim().toLowerCase();
  const skills = (data?.skills || []).filter(
    (s) => !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  );
  const commands = (data?.commands || []).filter(
    (c) =>
      !q ||
      c.command.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q)
  );
  const pathRules = (data?.path_rules || []).filter(
    (r) =>
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.instructions.toLowerCase().includes(q) ||
      r.globs.some((g) => g.toLowerCase().includes(q))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-100">Catálogo de Capacidades</h1>
            <HelpTooltip
              title="Catálogo de Capacidades"
              text="Guía viva en solo lectura de todo lo que sabe hacer el agente en este proyecto: sus Skills especializadas, los comandos rápidos con barra (/spec, /review, etc.) y las reglas automáticas según la carpeta que edites."
            />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Descubre qué skills están instaladas, qué comando slash usar y qué reglas quirúrgicas se activan por carpeta.
          </p>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar skill, comando o ruta…"
          aria-label="Buscar en el catálogo de capacidades"
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-green-500 w-72"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-800 bg-red-950/40 text-xs font-mono text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <div
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition ${
            tab === "skills" ? "bg-green-600 text-white" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          <button type="button" onClick={() => setTab("skills")} className="cursor-pointer">
            Skills ({data?.counts.skills ?? 0})
          </button>
          <HelpTooltip
            title="¿Qué son las Skills?"
            text="Manuales especializados que el agente carga cuando trabaja en una tecnología o tarea concreta (seguridad, PostgreSQL, Spring, Angular, pruebas). Leídas de .agents/skills/ o skills/."
          />
        </div>

        <div
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition ${
            tab === "commands" ? "bg-green-600 text-white" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          <button type="button" onClick={() => setTab("commands")} className="cursor-pointer">
            Comandos Slash ({data?.counts.commands ?? 0})
          </button>
          <HelpTooltip
            title="¿Qué son los Comandos Slash?"
            text="Atajos de flujo completo definidos en commands/*.md (como /review, /audit, /adversarial o /demo) que le indican al agente exactamente qué pasos seguir."
          />
        </div>

        <div
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition ${
            tab === "path_rules" ? "bg-green-600 text-white" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          <button type="button" onClick={() => setTab("path_rules")} className="cursor-pointer">
            Reglas por Ruta ({data?.counts.path_rules ?? 0})
          </button>
          <HelpTooltip
            title="¿Qué son las Reglas por Ruta?"
            text="Reglas definidas en .agent/path-rules.json que se activan automáticamente solo cuando tocas ciertos archivos o carpetas (por ejemplo, migraciones SQL o controladores de API)."
          />
        </div>

        {data?.skills_source && tab === "skills" && (
          <span className="ml-auto text-[11px] font-mono text-zinc-400">
            Fuente: {data.skills_source}
          </span>
        )}
      </div>

      {tab === "skills" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.length === 0 ? (
            <div className="col-span-full p-5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400">
              No se encontraron skills que coincidan con la búsqueda.
            </div>
          ) : (
            skills.map((s) => (
              <div key={s.name} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-sm font-mono font-bold text-green-400">{s.name}</div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{s.description || "Sin descripción."}</p>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 pt-2 border-t border-zinc-800/70 truncate">
                  {s.path}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "commands" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commands.length === 0 ? (
            <div className="col-span-full p-5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400">
              No se encontraron comandos slash en commands/.
            </div>
          ) : (
            commands.map((c) => (
              <div key={c.command} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-mono font-bold text-cyan-300">{c.command}</span>
                  <span className="text-[10px] font-mono text-zinc-500">{c.path}</span>
                </div>
                <div className="text-xs font-semibold text-zinc-200">{c.title}</div>
                <p className="text-xs text-zinc-400 leading-relaxed">{c.summary || "Sin resumen."}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "path_rules" && (
        <div className="space-y-3">
          {pathRules.length === 0 ? (
            <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400">
              No hay reglas por ruta definidas en .agent/path-rules.json.
            </div>
          ) : (
            pathRules.map((r) => (
              <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-zinc-100">{r.id}</span>
                  <span className="px-2 py-0.5 rounded border border-yellow-800 bg-yellow-950/30 text-yellow-300 text-[10px]">
                    {r.severity}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.globs.map((g, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-cyan-300 text-[11px]">
                      {g}
                    </span>
                  ))}
                </div>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">{r.instructions}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
