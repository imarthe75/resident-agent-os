"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HelpTooltip from "@/components/HelpTooltip";
import { useAgentStore } from "@/store/agentStore";

const NAV_ITEMS = [
  {
    name: "🤖 Núcleo del Agente",
    path: "/dashboard",
    helpTitle: "Núcleo del Agente",
    helpText:
      "Tablero principal: muestra en vivo la velocidad, errores, ahorro de tokens, el paso a paso del ciclo del agente y los últimos eventos registrados. Si todo está en verde o SIN_DATOS, no hay alertas.",
  },
  {
    name: "🛰 Monitor de Flota",
    path: "/fleet",
    helpTitle: "Monitor de Flota",
    helpText:
      "Vista general de todos los proyectos que usan este framework. Te dice de un vistazo qué repositorios están al día y cuáles tienen reglas desactualizadas o verificadores en rojo.",
  },
  {
    name: "🛡️ Compuertas y Verificadores",
    path: "/gates",
    helpTitle: "Compuertas y Verificadores",
    helpText:
      "Ejecuta y revisa las comprobaciones automáticas del código (UUIDs, seguridad, sin TODOs, observabilidad), las rutas públicas justificadas, las compuertas de etapa y la salud de dependencias.",
  },
  {
    name: "🔎 Auditoría Local",
    path: "/audit",
    helpTitle: "Auditoría Local (Micro-Centinela)",
    helpText:
      "Indica qué módulo, archivo y línea incumple estándares de Seguridad, Desarrollo/BD, Accesibilidad WCAG, Documentación y Manuales, CMMI v3.0, ISO 27001 y Estándares CASMARTS (si el kit está instalado).",
  },
  {
    name: "📚 Catálogo de Capacidades",
    path: "/capabilities",
    helpTitle: "Catálogo de Capacidades",
    helpText:
      "Explora y busca las Skills instaladas, los comandos slash (/spec, /review, /audit…) y las reglas automáticas por carpeta que conoce el agente en este proyecto.",
  },
  {
    name: "📝 Archivos del Espacio",
    path: "/editor",
    helpTitle: "Archivos del Espacio",
    helpText:
      "Explorador de solo lectura para consultar los archivos clave del agente (.agent/, rules/, changes/ y DECISIONS/) sin riesgo de modificarlos por accidente.",
  },
  {
    name: "📜 Especificaciones",
    path: "/specs",
    helpTitle: "Especificaciones (SPECS.md)",
    helpText:
      "Contratos que describen qué debe construir el agente antes de tocar código. Aquí puedes revisar su estado (APROBADO o borrador) y editar .agent/SPECS.md de forma segura.",
  },
  {
    name: "🧠 Memoria Semántica",
    path: "/memory",
    helpTitle: "Memoria Semántica",
    helpText:
      "Muestra lo que el agente recuerda: su caché rápida temporal (Valkey) y sus recuerdos o lecciones guardadas a largo plazo (PostgreSQL + pgvector) filtrables por proyecto.",
  },
  {
    name: "🔍 Depuración y Reglas",
    path: "/debug",
    helpTitle: "Depuración y Reglas",
    helpText:
      "Diagnóstico técnico: comprueba si los servicios están listos (/api/health/ready), lista los errores recientes, evalúa los límites de alerta y muestra las reglas heurísticas activas.",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { services } = useAgentStore();

  const renderService = (label: string, svc: typeof services.valkey) => {
    if (!svc) return <div className="text-zinc-400">{label}: comprobando…</div>;
    return (
      <div className={svc.connected ? "text-green-400" : "text-red-400"} title={svc.error || ""}>
        {label}: {svc.connected ? `activo (${svc.port})` : `desconectado (${svc.port})`}
      </div>
    );
  };

  return (
    <aside className="w-68 bg-zinc-900 border-r border-zinc-800 p-5 flex flex-col justify-between h-full shrink-0">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-black tracking-wider text-green-400">RESIDENT OS</h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">Observabilidad y Control</p>
        </div>
        <nav aria-label="Navegación principal" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            return (
              <div
                key={item.path}
                className={`rounded-lg transition-all duration-200 flex items-center justify-between pr-2 ${
                  isActive
                    ? "bg-green-600 text-white font-bold shadow-md shadow-green-900/30"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Link href={item.path} className="flex-1 p-3 text-sm font-medium truncate">
                  {item.name}
                </Link>
                <HelpTooltip title={item.helpTitle} text={item.helpText} />
              </div>
            );
          })}
        </nav>
      </div>
      <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-xs font-mono space-y-1.5">
        <div className="flex items-center justify-between text-zinc-300">
          <span>Entorno: Local Soberano</span>
          <HelpTooltip
            title="Entorno Local Soberano"
            text="Todo corre en tu propia máquina o red interna (sin enviar código ni recuerdos a servicios externos). Verde significa servicio en línea; rojo indica que falta levantarlo."
            preferSide="top"
          />
        </div>
        {renderService("Valkey", services.valkey)}
        {renderService("PostgreSQL", services.postgres)}
      </div>
    </aside>
  );
}
