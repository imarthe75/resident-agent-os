"use client";

import { Fragment, useState } from "react";
import EmptyStateGuide from "@/components/EmptyStateGuide";
import HelpTooltip from "@/components/HelpTooltip";
import { FleetRepoRow, useAgentStore } from "@/store/agentStore";

function formatDriftLabel(r: FleetRepoRow): { label: string; className: string } {
  if (r.drift_status === "NO_EVALUADO") {
    return { label: "NO_EVALUADO", className: "text-zinc-400" };
  }
  if (r.drift) {
    return {
      label: `DESVIADO (${r.framework_version || "sin versión"} vs ${r.expected_version || "?"})`,
      className: "text-yellow-400",
    };
  }
  return {
    label: r.framework_version ? `al día (${r.framework_version})` : "al día (sin versión fija)",
    className: "text-green-400",
  };
}

function verifierBadge(status: string): string {
  if (status === "CUMPLE") return "border-green-800 bg-green-950/40 text-green-300";
  if (status === "NO_CUMPLE") return "border-red-800 bg-red-950/50 text-red-300";
  return "border-zinc-700 bg-zinc-900 text-zinc-400";
}

export default function FleetPanel() {
  const { fleet, fetchFleet } = useAgentStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedRepo, setCopiedRepo] = useState<string | null>(null);

  const toggleRepo = (repoPath: string) => {
    setExpanded((prev) => ({ ...prev, [repoPath]: !prev[repoPath] }));
  };

  const handleCopyAuditCmd = async (repoPath: string) => {
    const cmd = `python3 scripts/micro_audit.py --path "${repoPath}" --out data/micro-audit-report.json`;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedRepo(repoPath);
      setTimeout(() => setCopiedRepo((prev) => (prev === repoPath ? null : prev)), 2000);
    } catch (err) {
      console.error("[FleetPanel] clipboard copy failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-100">Monitor de Flota — Estado Multi-Repositorio</h1>
            <HelpTooltip
              title="Monitor de Flota"
              text="Concentra la salud de varios proyectos que usan Resident Agent OS en una sola tabla. Haz clic sobre el nombre de cualquier repositorio para desplegar el detalle completo de verificadores fallidos, deriva, dependencias y telemetría."
            />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Haz clic en el nombre de un repositorio para expandir el detalle de sus verificadores, deriva, dependencias y telemetría.
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
          helpText="El reporte reúne en un JSON la deriva del framework, resultados detallados de verificadores, dependencias y telemetría de cada repositorio."
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
                        text="Compara la versión instalada en el proyecto contra la versión vigente de resident-agent-os. 'al día' en verde es lo esperado; 'DESVIADO' en amarillo indica actualizar; 'NO_EVALUADO' indica que el proyecto no incluye distribute_framework.py."
                      />
                    </span>
                  </th>
                  <th className="p-3">
                    <span className="inline-flex items-center gap-1.5">
                      Verificadores
                      <HelpTooltip
                        title="Resultado de verificadores"
                        text="Resumen de 'python3 verifiers/run.py': OK = cumple, FALLO = bloqueante a corregir, N/E = no evaluado porque no aplica a ese stack. Haz clic en el nombre del repositorio para ver exactamente cuáles fallaron."
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
                {fleet.repos.map((r) => {
                  const isOpen = Boolean(expanded[r.path]);
                  const driftFmt = formatDriftLabel(r);
                  const sortedResults = [...(r.verifiers.results || [])].sort((a, b) => {
                    const order: Record<string, number> = { NO_CUMPLE: 0, CUMPLE: 1, NO_EVALUADO: 2 };
                    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
                  });

                  return (
                    <Fragment key={r.path}>
                      <tr className={`transition ${isOpen ? "bg-zinc-800/50" : "hover:bg-zinc-800/40"}`}>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => toggleRepo(r.path)}
                            aria-expanded={isOpen}
                            className="inline-flex items-center gap-2 font-bold text-zinc-100 hover:text-green-400 cursor-pointer text-left"
                          >
                            <span className="text-[10px] text-zinc-400">{isOpen ? "▼" : "▶"}</span>
                            <span className="underline decoration-zinc-700 underline-offset-4 hover:decoration-green-400">
                              {r.name}
                            </span>
                          </button>
                        </td>
                        <td className="p-3">
                          <span className={driftFmt.className}>{driftFmt.label}</span>
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

                      {isOpen && (
                        <tr className="bg-zinc-950/90">
                          <td colSpan={5} className="p-5">
                            <div className="space-y-4">
                              {/* Cabecera de detalle con ruta y comando copiable */}
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                                <div className="space-y-0.5">
                                  <div className="text-[11px] uppercase text-zinc-400">Ruta del repositorio</div>
                                  <div className="text-xs text-zinc-200 break-all">{r.path}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyAuditCmd(r.path)}
                                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-green-700 text-zinc-100 text-[11px] cursor-pointer transition"
                                >
                                  {copiedRepo === r.path ? "✔ Comando copiado" : "📋 Copiar comando Micro-Auditoría"}
                                </button>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Bloque 1: Detalle de Verificadores */}
                                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 space-y-3">
                                  <div className="text-xs font-bold uppercase text-zinc-200">
                                    Detalle de Verificadores ({r.verifiers.no_cumple} NO_CUMPLE · {r.verifiers.cumple} CUMPLE · {r.verifiers.no_evaluado} N/E)
                                  </div>

                                  {sortedResults.length > 0 ? (
                                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                      {sortedResults.map((v) => (
                                        <div key={v.verifier} className="rounded border border-zinc-800 bg-zinc-950/70 p-2.5 space-y-1.5">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${verifierBadge(v.status)}`}>
                                                {v.status}
                                              </span>
                                              <span className="text-zinc-100 font-semibold">{v.verifier}</span>
                                            </div>
                                            <span className="text-[10px] text-zinc-500">
                                              {v.method} · {v.checked} revisados
                                            </span>
                                          </div>
                                          {v.detail.length > 0 && (
                                            <div className="pl-2 border-l-2 border-zinc-800 space-y-0.5 text-[11px] text-zinc-300">
                                              {v.detail.slice(0, 8).map((line, idx) => (
                                                <div key={idx} className="break-all">
                                                  • {line}
                                                </div>
                                              ))}
                                              {v.detail.length > 8 && (
                                                <div className="text-zinc-500">… y {v.detail.length - 8} hallazgo(s) más</div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : r.verifiers.failed_names.length > 0 ? (
                                    <div className="space-y-2">
                                      <div className="text-[11px] text-red-300">Verificadores con NO_CUMPLE:</div>
                                      <div className="flex flex-wrap gap-1.5">
                                        {r.verifiers.failed_names.map((name) => (
                                          <span
                                            key={name}
                                            className="px-2 py-0.5 rounded border border-red-800 bg-red-950/50 text-red-200 text-[11px]"
                                          >
                                            {name}
                                          </span>
                                        ))}
                                      </div>
                                      <p className="text-[11px] text-zinc-500">
                                        Re-ejecuta `ros fleet --parent ... --out data/fleet-status.json` con la versión vigente para ver cada archivo y línea exacta aquí.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-green-400">Sin verificadores fallidos en este repositorio.</div>
                                  )}
                                </div>

                                {/* Bloque 2: Deriva, Dependencias y Telemetría */}
                                <div className="space-y-4">
                                  {/* Deriva */}
                                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
                                    <div className="text-xs font-bold uppercase text-zinc-200">Sincronización del Framework</div>
                                    <div className="text-[11px] text-zinc-300 space-y-1">
                                      <div>
                                        Estado: <span className={driftFmt.className}>{driftFmt.label}</span>
                                      </div>
                                      {r.drift_reason && <div className="text-zinc-400">Motivo: {r.drift_reason}</div>}
                                      <div>
                                        Archivos faltantes: <strong className="text-zinc-100">{r.missing_files}</strong> · Modificados:{" "}
                                        <strong className="text-zinc-100">{r.modified_files}</strong>
                                      </div>
                                      {(r.missing_paths?.length || 0) > 0 && (
                                        <div className="text-[10px] text-amber-300 break-all">
                                          Faltantes: {r.missing_paths?.slice(0, 8).join(", ")}
                                        </div>
                                      )}
                                      {(r.modified_paths?.length || 0) > 0 && (
                                        <div className="text-[10px] text-yellow-300 break-all">
                                          Modificados: {r.modified_paths?.slice(0, 8).join(", ")}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Dependencias */}
                                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
                                    <div className="text-xs font-bold uppercase text-zinc-200">Dependencias Atrasadas</div>
                                    {r.outdated_dependencies === null ? (
                                      <div className="text-[11px] text-zinc-400">
                                        NO_EVALUADO. Ejecuta `ros fleet --with-deps` para consultar registros oficiales.
                                      </div>
                                    ) : (r.outdated_details?.length || 0) > 0 ? (
                                      <div className="space-y-1 max-h-36 overflow-y-auto text-[11px]">
                                        {r.outdated_details?.map((dep, idx) => (
                                          <div key={`${dep.name}-${idx}`} className="text-amber-300">
                                            • {dep.name} ({dep.current} → {dep.target}) [{dep.deprecated ? "OBSOLETA" : dep.lag}]{" "}
                                            <span className="text-zinc-500">{dep.file}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-green-400">
                                        {r.outdated_dependencies === 0
                                          ? "Todas las dependencias revisadas están vigentes."
                                          : `${r.outdated_dependencies} dependencia(s) atrasada(s).`}
                                      </div>
                                    )}
                                  </div>

                                  {/* Telemetría */}
                                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4 space-y-2">
                                    <div className="text-xs font-bold uppercase text-zinc-200">Telemetría y Umbrales</div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                                      <div>Eventos totales: <strong className="text-zinc-100">{r.telemetry.total_events}</strong></div>
                                      <div>Errores: <strong className={r.telemetry.errors > 0 ? "text-red-400" : "text-green-400"}>{r.telemetry.errors}</strong></div>
                                      <div>Latencia p95: <strong className="text-zinc-100">{r.telemetry.latency_p95_ms !== null ? `${r.telemetry.latency_p95_ms} ms` : "N/D"}</strong></div>
                                      <div>Costo estimado: <strong className="text-zinc-100">${r.telemetry.total_cost_usd}</strong></div>
                                      <div>Tokens ahorrados: <strong className="text-cyan-300">{r.telemetry.tokens_saved_by_hooks_est}</strong></div>
                                      <div>Umbrales: <strong className={r.telemetry.threshold_status === "ALERTA" ? "text-red-400" : "text-green-400"}>{r.telemetry.threshold_status}</strong></div>
                                    </div>
                                    {r.telemetry.breaches.length > 0 && (
                                      <div className="pt-1 border-t border-zinc-800 space-y-1 text-[11px] text-red-300">
                                        {r.telemetry.breaches.map((b, idx) => (
                                          <div key={idx}>⚠ {b}</div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
