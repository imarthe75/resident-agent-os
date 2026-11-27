"use client";

import { useAgentStore } from "@/store/agentStore";
import { useEffect, useRef } from "react";

export default function Console() {
  const { events } = useAgentStore();
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-52">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-zinc-400">
          ⚡ Telemetry Stream ({events.length} events)
        </span>
        <span className="text-[10px] font-mono text-zinc-500">.agent/telemetry/events.jsonl</span>
      </div>
      <div
        ref={consoleRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-xs text-green-400 space-y-1 bg-black"
      >
        {events.length === 0 ? (
          <div className="text-zinc-500">Sin eventos de telemetría registrados aún.</div>
        ) : (
          events.map((ev, i) => {
            const ts = ev.timestamp ? ev.timestamp.slice(11, 19) : "--:--:--";
            const color =
              ev.outcome === "error" || ev.outcome === "syntax_error"
                ? "text-red-400"
                : ev.outcome === "degraded"
                  ? "text-yellow-400"
                  : "text-green-400";
            const extra = [
              ev.skill ? `skill=${ev.skill}` : "",
              typeof ev.duration_ms === "number" ? `${ev.duration_ms}ms` : "",
              ev.tokens_saved_est ? `saved~${ev.tokens_saved_est}tok` : "",
              ev.cost_usd ? `$${ev.cost_usd}` : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div key={i} className={`leading-relaxed ${color}`}>
                <span className="text-zinc-600 mr-2">[{ts}]</span>
                <span className="text-zinc-400 mr-2">[{ev.source}:{ev.phase || "-"}]</span>
                <span>{ev.event}</span>
                <span className="text-zinc-400 ml-2">({ev.outcome || "ok"})</span>
                {extra && <span className="text-zinc-500 ml-2">{extra}</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
