"use client";

import { useState } from "react";
import HelpTooltip from "@/components/HelpTooltip";

interface EmptyStateGuideProps {
  title: string;
  explanation: string;
  command: string;
  helpText?: string;
}

/**
 * Tarjeta amigable de estado vacío («¿Cómo genero estos datos?») con botón para copiar el comando CLI.
 */
export default function EmptyStateGuide({
  title,
  explanation,
  command,
  helpText,
}: EmptyStateGuideProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = command;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-zinc-100">{title}</span>
        {helpText && <HelpTooltip title={title} text={helpText} />}
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed">{explanation}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5">
        <code className="text-xs font-mono text-green-400 break-all">{command}</code>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-mono font-semibold transition cursor-pointer shrink-0"
        >
          {copied ? "✔ Copiado" : "📋 Copiar comando"}
        </button>
      </div>
    </div>
  );
}
