"use client";

import Console from "@/components/Console";
import EditorPanel from "@/components/EditorPanel";
import HelpTooltip from "@/components/HelpTooltip";
import LiveTrace from "@/components/LiveTrace";

export default function EditorPage() {
  return (
    <div className="space-y-5 flex flex-col h-full">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-zinc-100">Archivos del Espacio</h1>
          <HelpTooltip
            title="Archivos del Espacio"
            text="Permite inspeccionar en modo solo lectura los archivos de gobierno del agente (.agent/, rules/, changes/ y DECISIONS/) usando el visor local Monaco, junto con la traza del ciclo y la consola de telemetría."
          />
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">
          Consulta reglas, estado, especificaciones de cambio y decisiones arquitectónicas sin riesgo de edición accidental.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-2">
          <EditorPanel />
        </div>
        <div>
          <LiveTrace />
        </div>
      </div>

      <div className="w-full">
        <Console />
      </div>
    </div>
  );
}
