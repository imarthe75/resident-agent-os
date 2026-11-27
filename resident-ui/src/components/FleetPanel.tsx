"use client";

import { useAgentStore } from "@/store/agentStore";

export default function FleetPanel() {
  const { fleet, fetchFleet } = useAgentStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-200 uppercase tracking-wide">
            Fleet Monitor — Estado Multi-Repositorio
          </h2>
          <p className="text-xs font-mono text-zinc-500 mt-0.5">
            {fleet?.generated_at ? `Generado: ${fleet.generated_at}` : "Sin reporte cargado"}
          </p>
        </div>
        <button
          onClick={() => void fetchFleet()}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer"
        >
          ↻ Recargar reporte
        </button>
      </div>

      {!fleet || !fleet.available ? (
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 space-y-2">
          <div>{fleet?.message || "Aún no existe un reporte de flota."}</div>
          <div className="text-green-400">
            python scripts/fleet_status.py --parent /ruta/a/repos --out data/fleet-status.json
          </div>
        </div>
      ) : (
        <>
          {fleet.totals && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="text-[11px] font-mono text-zinc-500 uppercase">Repos</div>
                <div className="text-2xl font-black text-zinc-100 mt-1">{fleet.totals.repos ?? fleet.repos.length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="text-[11px] font-mono text-zinc-500 uppercase">Con Deriva</div>
                <div className={`text-2xl font-black mt-1 ${(fleet.totals.drifted ?? 0) > 0 ? "text-yellow-400" : "text-green-400"}`}>
                  {fleet.totals.drifted ?? 0}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="text-[11px] font-mono text-zinc-500 uppercase">Verifiers NO_CUMPLE</div>
                <div className={`text-2xl font-black mt-1 ${(fleet.totals.verifiers_no_cumple ?? 0) > 0 ? "text-red-400" : "text-green-400"}`}>
                  {fleet.totals.verifiers_no_cumple ?? 0}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="text-[11px] font-mono text-zinc-500 uppercase">Alertas Umbral</div>
                <div className={`text-2xl font-black mt-1 ${(fleet.totals.threshold_alerts ?? 0) > 0 ? "text-red-400" : "text-green-400"}`}>
                  {fleet.totals.threshold_alerts ?? 0}
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <div className="text-[11px] font-mono text-zinc-500 uppercase">Tokens Ahorrados</div>
                <div className="text-2xl font-black text-cyan-400 mt-1">
                  {fleet.totals.tokens_saved_by_hooks_est ?? 0}
                </div>
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase border-b border-zinc-800">
                <tr>
                  <th className="p-3">Repositorio</th>
                  <th className="p-3">Framework</th>
                  <th className="p-3">Verificadores</th>
                  <th className="p-3">Deps Atrasadas</th>
                  <th className="p-3">Telemetría / Umbrales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {fleet.repos.map((r) => (
                  <tr key={r.path} className="hover:bg-zinc-800/40">
                    <td className="p-3 font-bold text-zinc-200">{r.name}</td>
                    <td className="p-3">
                      <span className={r.drift ? "text-yellow-400" : "text-green-400"}>
                        {r.drift ? `DESVIADO (${r.framework_version || "none"} vs ${r.expected_version})` : `al día (${r.framework_version})`}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-green-400">{r.verifiers.cumple} OK</span>
                      {" / "}
                      <span className={r.verifiers.no_cumple > 0 ? "text-red-400 font-bold" : "text-zinc-500"}>
                        {r.verifiers.no_cumple} FAIL
                      </span>
                      {" / "}
                      <span className="text-zinc-500">{r.verifiers.no_evaluado} N/E</span>
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
                              : "text-zinc-500"
                        }
                      >
                        {r.telemetry.threshold_status}
                      </span>
                      <span className="text-zinc-500 ml-2">
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
