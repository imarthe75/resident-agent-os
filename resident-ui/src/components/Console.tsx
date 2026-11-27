"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HelpTooltip from "@/components/HelpTooltip";
import { useAgentStore } from "@/store/agentStore";

export default function Console() {
  const { events } = useAgentStore();
  const consoleRef = useRef<HTMLDivElement>(null);
  const [levelFilter, setLevelFilter] = useState<string>("TODOS");
  const [phaseFilter, setPhaseFilter] = useState<string>("TODAS");
  const [search, setSearch] = useState("");
  const [paused, setPaused] = useState(false);

  const phases = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      if (ev.phase) set.add(ev.phase);
    }
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((ev) => {
      const lv = (ev.level || "INFO").toUpperCase();
      if (levelFilter !== "TODOS") {
        if (levelFilter === "ERROR" && lv !== "ERROR" && ev.outcome !== "error" && ev.outcome !== "syntax_error") {
          return false;
        }
        if (levelFilter === "WARN" && lv !== "WARN" && lv !== "WARNING" && ev.outcome !== "degraded") {
          return false;
        }
        if (levelFilter === "INFO" && lv !== "INFO") {
          return false;
        }
      }
      if (phaseFilter !== "TODAS" && (ev.phase || "-") !== phaseFilter) return false;
      if (!q) return true;
      const hay = `${ev.event} ${ev.source} ${ev.phase || ""} ${ev.skill || ""} ${ev.outcome || ""} ${ev.session_id || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [events, levelFilter, phaseFilter, search]);

  useEffect(() => {
    if (!paused && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [filtered, paused]);

  const handleExport = () => {
    const content = filtered.map((ev) => JSON.stringify(ev)).join("\n") + (filtered.length ? "\n" : "");
    const blob = new Blob([content], { type: "application/x-ndjson;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resident-telemetry-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.jsonl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-64">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-zinc-200">
            ⚡ Flujo de Telemetría ({filtered.length}/{events.length} eventos)
          </span>
          <HelpTooltip
            title="Flujo de Telemetría"
            text="Bitácora cronológica en vivo de .agent/telemetry/events.jsonl. Filtra por nivel (INFO/WARN/ERROR), fase o texto libre, pausa el desplazamiento automático para leer con calma o exporta en formato JSONL."
            preferSide="top"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <select
            aria-label="Filtrar por nivel"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200 cursor-pointer"
          >
            <option value="TODOS">Nivel: TODOS</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

          <select
            aria-label="Filtrar por fase"
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-200 cursor-pointer"
          >
            <option value="TODAS">Fase: TODAS</option>
            {phases.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar texto…"
            aria-label="Buscar en eventos de telemetría"
            className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-100 placeholder:text-zinc-500 w-36 focus:outline-none focus:border-green-500"
          />

          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className={`px-2.5 py-1 rounded border cursor-pointer transition ${
              paused
                ? "border-yellow-700 bg-yellow-950/40 text-yellow-200"
                : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            }`}
          >
            {paused ? "▶ Reanudar scroll" : "⏸ Pausar scroll"}
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-100 cursor-pointer transition"
          >
            ⬇ Exportar JSONL
          </button>
        </div>
      </div>

      <div
        ref={consoleRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-xs text-green-400 space-y-1 bg-black"
      >
        {filtered.length === 0 ? (
          <div className="text-zinc-400">
            {events.length === 0
              ? "Sin eventos de telemetría registrados aún."
              : "Ningún evento coincide con los filtros seleccionados."}
          </div>
        ) : (
          filtered.map((ev, i) => {
            const ts = ev.timestamp ? ev.timestamp.slice(11, 19) : "--:--:--";
            const color =
              ev.outcome === "error" || ev.outcome === "syntax_error" || ev.level === "ERROR"
                ? "text-red-400"
                : ev.outcome === "degraded" || ev.level === "WARN" || ev.level === "WARNING"
                  ? "text-yellow-400"
                  : "text-green-400";
            const extra = [
              ev.skill ? `skill=${ev.skill}` : "",
              typeof ev.duration_ms === "number" ? `${ev.duration_ms}ms` : "",
              ev.tokens_saved_est ? `ahorro~${ev.tokens_saved_est}tok` : "",
              ev.cost_usd ? `$${ev.cost_usd}` : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={i} className={`leading-relaxed ${color}`}>
                <span className="text-zinc-500 mr-2">[{ts}]</span>
                <span className="text-zinc-300 mr-2">[{ev.source}:{ev.phase || "-"}]</span>
                <span>{ev.event}</span>
                <span className="text-zinc-400 ml-2">({ev.outcome || "ok"})</span>
                {extra && <span className="text-zinc-400 ml-2">{extra}</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
