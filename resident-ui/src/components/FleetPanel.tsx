"use client";

import EmptyStateGuide from "@/components/EmptyStateGuide";
import HelpTooltip from "@/components/HelpTooltip";
import { useAgentStore } from "@/store/agentStore";

export default function FleetPanel() {
  const { fleet, fetchFleet } = useAgentStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-100">Monitor de Flota — Estado Multi-Repositorio</h1>
            <HelpTooltip
              title="Monitor de Flota"
              text="Concentra la salud de varios proyectos que usan Resident Agent OS en una sola tabla. Lee el archivo data/fleet-status.json generado con el comando 'ros fleet'. Así ves rápido qué repositorio requiere atención."
            />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Supervisa en un solo lugar la sincronización del framework, verificadores, dependencias atrasadas y alertas de todos tus repositorios.
          </p>
          <p className="text-xs font-mono text-zinc-500 mt-1">
            {fleet?.generated_at ? `Reporte generado: ${fleet.generated_at}` : "Sin reporte de flota cargado todavía"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchFleet()}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer"
        >
          ↻ Recargar reporte
        </button>
      </div>

      {!fleet || !fleet.available ? (
        <EmptyStateGuide
          title="¿Cómo genero el reporte de flota?"
          explanation={
            fleet?.message ||
            "Aún no existe data/fleet-status.json en este servidor. Ejecuta este comando indicando la carpeta padre donde viven tus repositorios y después pulsa «Recargar reporte»:"
          }
          command="python3 -m agent fleet --parent /ruta/a/repos --out data/fleet-status.json"
          helpText="El reporte reúne en un JSON la deriva del framework, resultados de verificadores, dependencias y telemetría de cada repositorio."
        />
      ) : (
        <>
          {fleet.totals && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-zinc-400 uppercase">
                  <span>Repositorios</span>
                  <HelpTooltip
                    title="Repositorios analizados"
                    text="Cantidad total de proyectos incluidos en el último escaneo de flota."
                  />
                </div>
                <div className="text-2xl font-black text-zinc-100 mt-1">{fleet.totals.repos ?? fleet.repos.length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-zinc-400 uppercase">
                  <span>Con deriva</span>
                  <HelpTooltip
                    title="Deriva del framework"
                    text="Número de repositorios cuyas reglas, hooks o skills quedaron en una versión anterior o modificados respecto al framework base. En 0 (verde) todos están sincronizados."
                  />
                </div>
                <div className={`text-2xl font-black mt-1 ${(fleet.totals.drifted ?? 0) > 0 ? "text-yellow-400" : "text-green-400"}`}>
                  {fleet.totals.drifted ?? 0}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-zinc-400 uppercase">
                  <span>Verificadores NO_CUMPLE</span>
                  <HelpTooltip
                    title="Verificadores NO_CUMPLE"
                    text="Total de comprobaciones automáticas fallidas (seguridad, llaves UUID, sin código simulado, observabilidad). En 0 (verde) todo cumple; en rojo bloquea la entrega."
                  />
                </div>
                <div className={`text-2xl font-black mt-1 ${(fleet.totals.verifiers_no_cumple ?? 0) > 0 ? "text-red-400" : "text-green-400"}`}>
                  {fleet.totals.verifiers_no_cumple ?? 0}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-zinc-400 uppercase">
                  <span>Alertas de umbral</span>
                  <HelpTooltip
                    title="Alertas de umbral"
                    text="Repositorios cuya telemetría superó los límites de error, latencia o costo definidos en .agent/thresholds.json."
                  />
                </div>
                <div className={`text-2xl font-black mt-1 ${(fleet.totals.threshold_alerts ?? 0) > 0 ? "text-red-400" : "text-green-400"}`}>
                  {fleet.totals.threshold_alerts ?? 0}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center justify-between gap-1 text-[11px] font-mono text-zinc-400 uppercase">
                  <span>Tokens ahorrados</span>
                  <HelpTooltip
                    title="Tokens ahorrados por hooks"
                    text="Ahorro acumulado estimado gracias a los filtros automáticos que acortan salidas largas de terminal antes de enviarlas al modelo de IA."
                  />
                </div>
                <div className="text-2xl font-black text-cyan-400 mt-1">
                  {fleet.totals.tokens_saved_by_hooks_est ?? 0}
                </div>
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-950 text-zinc-300 uppercase border-b border-zinc-800">
                <tr>
                  <th className="p-3">Repositorio</th>
                  <th className="p-3">
                    <span className="inline-flex items-center gap-1.5">
                      Framework (deriva)
                      <HelpTooltip
                        title="Versión y deriva del framework"
                        text="Compara la versión instalada en el proyecto contra la versión vigente de resident-agent-os. 'al día' en verde es lo esperado; 'DESVIADO' en amarillo indica actualizar."
                      />
                    </span>
                  </th>
                  <th className="p-3">
                    <span className="inline-flex items-center gap-1.5">
                      Verificadores
                      <HelpTooltip
                        title="Resultado de verificadores"
                        text="Resumen de 'python3 verifiers/run.py': OK = cumple, FALLO = bloqueante a corregir, N/E = no evaluado porque no aplica a ese stack."
                      />
                    </span>
                  </th>
                  <th className="p-3">
                    <span className="inline-flex items-center gap-1.5">
                      Dependencias atrasadas
                      <HelpTooltip
                        title="Dependencias atrasadas"
                        text="Cantidad de paquetes directos con versión mayor/menor atrasada u obsoleta (cuando el escaneo se corrió con --with-deps). 'NO_EVALUADO' significa que no se consultaron registros."
                      />
                    </span>
                  </th>
                  <th className="p-3">
                    <span className="inline-flex items-center gap-1.5">
                      Telemetría / Umbrales
                      <HelpTooltip
                        title="Telemetría y umbrales por repo"
                        text="Estado de salud del agente en ese proyecto (OK, ALERTA o SIN_DATOS), junto al número de eventos registrados y costo estimado."
                      />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {fleet.repos.map((r) => (
                  <tr key={r.path} className="hover:bg-zinc-800/40">
                    <td className="p-3 font-bold text-zinc-100">{r.name}</td>
                    <td className="p-3">
                      <span className={r.drift ? "text-yellow-400" : "text-green-400"}>
                        {r.drift
                          ? `DESVIADO (${r.framework_version || "sin versión"} vs ${r.expected_version})`
                          : `al día (${r.framework_version})`}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-green-400">{r.verifiers.cumple} OK</span>
                      {" / "}
                      <span className={r.verifiers.no_cumple > 0 ? "text-red-400 font-bold" : "text-zinc-400"}>
                        {r.verifiers.no_cumple} FALLO
                      </span>
                      {" / "}
                      <span className="text-zinc-400">{r.verifiers.no_evaluado} N/E</span>
                    </td>
                    <td className="p-3 text-zinc-300">
                      {r.outdated_dependencies === null ? "NO_EVALUADO" : r.outdated_dependencies}
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          r.telemetry.threshold_status === "ALERTA"
                            ? "text-red-400 font-bold"
                            : r.telemetry.threshold_status === "OK"
                              ? "text-green-400"
                              : "text-zinc-400"
                        }
                      >
                        {r.telemetry.threshold_status}
                      </span>
                      <span className="text-zinc-400 ml-2">
                        ({r.telemetry.total_events} ev · ${r.telemetry.total_cost_usd})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
