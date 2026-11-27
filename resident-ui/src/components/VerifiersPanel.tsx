"use client";

import { useEffect, useState } from "react";
import EmptyStateGuide from "@/components/EmptyStateGuide";
import HelpTooltip from "@/components/HelpTooltip";

interface VerifierItem {
  verifier: string;
  status: string;
  method: string;
  detail: string[];
  checked: number;
}

interface VerifiersPayload {
  available: boolean;
  runner_available: boolean;
  generated_at: string | null;
  with_network: boolean;
  counts: { total: number; cumple: number; no_cumple: number; no_evaluado: number };
  results: VerifierItem[];
  public_routes: {
    exists: boolean;
    path: string;
    entries: Array<{ raw: string; method: string; route: string; reason: string }>;
  };
  gates: Array<{ name: string; content: string }>;
  command: string;
  error?: string;
}

interface DependenciesPayload {
  report_available: boolean;
  generated_at: string | null;
  summary: string | null;
  counts: {
    total: number;
    obsoletas: number;
    mayor: number;
    menor: number;
    parche: number;
    sin_resolver: number;
    al_dia: number;
  };
  dependencies: Array<{
    ecosystem: string;
    file: string;
    name: string;
    current: string | null;
    latest: string | null;
    target: string | null;
    lag: string | null;
    unresolved: string | null;
    note: string;
    deprecated: boolean;
  }>;
  policy_tools: Array<{ name: string; source: string; package: string; channel: string; with: string | null }>;
  command: string;
}

const VERIFIER_HELP: Record<string, { label: string; help: string }> = {
  pk_uuid: {
    label: "Llaves primarias UUID",
    help: "Comprueba que todas las tablas SQL nuevas usen UUID (preferiblemente uuidv7()) en vez de enteros autoincrementales, evitando colisiones y exposición de volúmenes.",
  },
  audit_triggers: {
    label: "Triggers de auditoría",
    help: "Revisa que cada tabla SQL tenga declarados los triggers de auditoría para saber quién creó o modificó cada registro.",
  },
  endpoints_auth: {
    label: "Autenticación en endpoints",
    help: "Verifica que los endpoints que modifican datos tengan protección de acceso (salvo los justificados en .agent/public-routes.txt).",
  },
  versions_current: {
    label: "Plataformas al día",
    help: "Compara las versiones de Node, Python, Java, PostgreSQL, Valkey y frameworks contra las últimas estables compatibles (requiere red).",
  },
  dependencies_current: {
    label: "Dependencias actualizadas",
    help: "Comprueba si existen paquetes obsoletos o atrasados en versión mayor/menor en package.json, pom.xml, Gradle o Python (requiere red).",
  },
  no_stubs: {
    label: "Sin código simulado ni TODOs",
    help: "Detecta funciones vacías (pass), TODOs pendientes o respuestas falsas hardcodeadas en código de aplicación. Garantiza entregas reales.",
  },
  tests_isolated: {
    label: "Pruebas aisladas",
    help: "Verifica que las pruebas no apunten a bases de datos de producción ni dejen datos basura fuera de transacciones desechables.",
  },
  no_silent_except: {
    label: "Sin errores silenciados",
    help: "Detecta bloques try/except o catch vacíos que esconden fallos en lugar de registrarlos o propagarlos.",
  },
  webhooks_fail_closed: {
    label: "Webhooks fail-closed",
    help: "Exige que todo webhook valide su secreto en tiempo constante y rechace con HTTP 401/403 si falta o no coincide la firma.",
  },
  compose_volumes: {
    label: "Persistencia en ./data",
    help: "Comprueba que los servicios con estado (PostgreSQL, Valkey, etc.) guarden datos en carpetas ./data del host para no perderlos al recrear contenedores.",
  },
  spec_traceability: {
    label: "Trazabilidad requisito ↔ prueba",
    help: "Verifica que cada requisito funcional aprobado en una especificación esté citado por al menos una prueba automatizada.",
  },
  observability_min: {
    label: "Observabilidad mínima",
    help: "Comprueba que el backend exponga endpoint de salud (/health) y maneje un identificador de correlación por petición.",
  },
  observability_production: {
    label: "Umbrales de observabilidad",
    help: "Verifica que existan umbrales escritos de alerta (.agent/thresholds.json) y scripts de evaluación de señales de producción.",
  },
};

export default function VerifiersPanel() {
  const [data, setData] = useState<VerifiersPayload | null>(null);
  const [deps, setDeps] = useState<DependenciesPayload | null>(null);
  const [running, setRunning] = useState(false);
  const [withNetwork, setWithNetwork] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    const [vRes, dRes] = await Promise.all([
      fetch("/api/verifiers", { cache: "no-store" }),
      fetch("/api/dependencies", { cache: "no-store" }),
    ]);
    return {
      verifiers: vRes.ok ? ((await vRes.json()) as VerifiersPayload) : null,
      deps: dRes.ok ? ((await dRes.json()) as DependenciesPayload) : null,
    };
  };

  useEffect(() => {
    let cancelled = false;
    fetchAll()
      .then((next) => {
        if (cancelled) return;
        if (next.verifiers) setData(next.verifiers);
        if (next.deps) setDeps(next.deps);
      })
      .catch((err) => {
        console.error("[VerifiersPanel] failed loading data:", err);
        if (!cancelled) {
          setError("No se pudo cargar el estado de verificadores y dependencias.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRunVerifiers = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/verifiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ with_network: withNetwork }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || `HTTP ${res.status}`);
      }
      if (body && typeof body === "object" && "results" in body) {
        setData(body as VerifiersPayload);
      }
    } catch (err) {
      console.error("[VerifiersPanel] run verifiers failed:", err);
      setError("Error de red al ejecutar los verificadores.");
    } finally {
      setRunning(false);
    }
  };

  const badgeStyle = (status: string) => {
    if (status === "CUMPLE") return "text-green-300 bg-green-950/40 border-green-800";
    if (status === "NO_CUMPLE") return "text-red-300 bg-red-950/40 border-red-800";
    return "text-zinc-300 bg-zinc-900 border-zinc-700";
  };

  const filtered = (data?.results || []).filter((item) => {
    if (statusFilter !== "TODOS" && item.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const meta = VERIFIER_HELP[item.verifier];
    return (
      item.verifier.toLowerCase().includes(q) ||
      (meta?.label.toLowerCase().includes(q) ?? false) ||
      item.detail.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-100">Compuertas, Verificadores y Dependencias</h1>
            <HelpTooltip
              title="Compuertas y Verificadores"
              text="Comprobaciones automáticas sobre el código y la configuración real del repositorio (sin IA ni suposiciones). Si algún verificador sale en NO_CUMPLE (rojo), bloquea la entrega hasta corregirlo."
            />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ejecuta y revisa los verificadores deterministas, las rutas públicas autorizadas, las compuertas de etapa y la salud de dependencias.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={withNetwork}
              onChange={(e) => setWithNetwork(e.target.checked)}
              className="accent-green-500"
            />
            <span>Incluir red (versions/deps)</span>
            <HelpTooltip
              title="Verificadores con red"
              text="Por defecto se ejecutan solo verificadores locales rápidos. Marca esta casilla para incluir también versions_current y dependencies_current consultando registros oficiales públicos."
            />
          </label>
          <button
            type="button"
            disabled={running}
            onClick={() => void handleRunVerifiers()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
          >
            {running ? "Ejecutando verificadores…" : "▶ Ejecutar verificadores"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-800 bg-red-950/40 text-xs font-mono text-red-200">
          {error}
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase">
            <span>CUMPLE</span>
            <HelpTooltip title="CUMPLE" text="Verificadores que pasaron sin hallazgos bloqueantes." />
          </div>
          <div className="text-2xl font-black text-green-400 mt-1">{data?.counts.cumple ?? 0}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase">
            <span>NO_CUMPLE</span>
            <HelpTooltip title="NO_CUMPLE" text="Verificadores con incumplimientos reales que bloquean el cierre del cambio. Despliega cada fila para ver archivo:línea." />
          </div>
          <div className={`text-2xl font-black mt-1 ${(data?.counts.no_cumple ?? 0) > 0 ? "text-red-400" : "text-green-400"}`}>
            {data?.counts.no_cumple ?? 0}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase">
            <span>NO_EVALUADO</span>
            <HelpTooltip title="NO_EVALUADO" text="Controles que no aplican a este repositorio (por ejemplo, endpoints Spring en un proyecto solo Python). Nunca se disfrazan como CUMPLE." />
          </div>
          <div className="text-2xl font-black text-zinc-300 mt-1">{data?.counts.no_evaluado ?? 0}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase">
            <span>Última corrida</span>
            <HelpTooltip title="Fecha de última corrida" text="Momento en que se generó data/verifiers-report.json." />
          </div>
          <div className="text-xs font-mono text-zinc-200 mt-2 break-all">
            {data?.generated_at ? new Date(data.generated_at).toLocaleString("es-MX") : "Sin ejecutar"}
          </div>
        </div>
      </div>

      {/* Tabla de verificadores */}
      {!data || !data.available ? (
        <EmptyStateGuide
          title="¿Cómo genero el reporte de verificadores?"
          explanation="Aún no existe data/verifiers-report.json en este espacio. Puedes pulsar el botón verde 'Ejecutar verificadores' arriba o generar el reporte desde tu terminal:"
          command={data?.command || "python3 verifiers/run.py --path . --json > data/verifiers-report.json"}
          helpText="Los verificadores analizan el código y la configuración en modo solo lectura y guardan un informe JSON verificable."
        />
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {["TODOS", "NO_CUMPLE", "CUMPLE", "NO_EVALUADO"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer transition ${
                    statusFilter === st ? "bg-green-600 text-white font-bold" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar verificador o archivo…"
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-green-500 w-64"
            />
          </div>

          <div className="space-y-2">
            {filtered.map((item) => {
              const info = VERIFIER_HELP[item.verifier] || {
                label: item.verifier,
                help: `Verificador automático '${item.verifier}' ejecutado sobre el repositorio.`,
              };
              const isOpen = Boolean(expanded[item.verifier]);
              return (
                <div key={item.verifier} className="border border-zinc-800 rounded-lg bg-zinc-950/50 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded border font-mono font-bold text-[10px] ${badgeStyle(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="font-semibold text-zinc-100">{info.label}</span>
                      <span className="font-mono text-zinc-400">({item.verifier})</span>
                      <HelpTooltip title={`${info.label} (${item.verifier})`} text={info.help} />
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
                      <span>método: {item.method}</span>
                      <span>revisados: {item.checked}</span>
                      {item.detail.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => ({ ...prev, [item.verifier]: !prev[item.verifier] }))}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                        >
                          {isOpen ? "▲ Ocultar" : `▼ Detalles (${item.detail.length})`}
                        </button>
                      )}
                    </div>
                  </div>
                  {isOpen && item.detail.length > 0 && (
                    <div className="border-t border-zinc-800 bg-black/60 px-4 py-3 font-mono text-xs space-y-1 text-zinc-300">
                      {item.detail.map((line, i) => (
                        <div key={i} className="break-all">
                          • {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-xs font-mono text-zinc-400 p-4 text-center">
                Ningún verificador coincide con el filtro actual.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Salud de Dependencias */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">
              Salud de Dependencias y Política de Versiones
            </h2>
            <HelpTooltip
              title="Dependencias y política de versiones"
              text="Combina .agent/versions-policy.json (canales latest/lts/compatible) con el último reporte de scripts/outdated_dependencies.py. Obsoletas (xx) y saltos mayor (!!) o menor (!) requieren tarea dedicada."
            />
          </div>
          {deps?.generated_at && (
            <span className="text-[11px] font-mono text-zinc-400">
              Reporte: {new Date(deps.generated_at).toLocaleString("es-MX")}
            </span>
          )}
        </div>

        {deps && deps.report_available ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="text-zinc-400">Obsoletas (xx)</div>
                <div className={`text-xl font-black mt-1 ${deps.counts.obsoletas > 0 ? "text-red-400" : "text-green-400"}`}>
                  {deps.counts.obsoletas}
                </div>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="text-zinc-400">Mayor (!!)</div>
                <div className={`text-xl font-black mt-1 ${deps.counts.mayor > 0 ? "text-red-400" : "text-green-400"}`}>
                  {deps.counts.mayor}
                </div>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="text-zinc-400">Menor (!)</div>
                <div className={`text-xl font-black mt-1 ${deps.counts.menor > 0 ? "text-yellow-400" : "text-green-400"}`}>
                  {deps.counts.menor}
                </div>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="text-zinc-400">Parche (.)</div>
                <div className="text-xl font-black text-cyan-400 mt-1">{deps.counts.parche}</div>
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                <div className="text-zinc-400">Al día</div>
                <div className="text-xl font-black text-green-400 mt-1">{deps.counts.al_dia}</div>
              </div>
            </div>
            {deps.summary && <div className="text-xs font-mono text-zinc-300">{deps.summary}</div>}
          </>
        ) : (
          <EmptyStateGuide
            title="¿Cómo genero el reporte de dependencias atrasadas?"
            explanation="Aún no existe data/outdated-dependencies.json. Ejecuta este comando desde la raíz del proyecto para consultar registros oficiales y guardar el reporte:"
            command={deps?.command || "python3 scripts/outdated_dependencies.py --path . --json > data/outdated-dependencies.json"}
          />
        )}

        {deps && deps.policy_tools.length > 0 && (
          <details className="border border-zinc-800 rounded-lg bg-zinc-950/50">
            <summary className="px-4 py-2.5 text-xs font-mono font-semibold text-zinc-200 cursor-pointer">
              Ver política de canales (.agent/versions-policy.json · {deps.policy_tools.length} herramientas)
            </summary>
            <div className="px-4 pb-3 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-2">Herramienta</th>
                    <th className="py-2">Canal</th>
                    <th className="py-2">Fuente</th>
                    <th className="py-2">Compatible con</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70 text-zinc-300">
                  {deps.policy_tools.map((t) => (
                    <tr key={t.name}>
                      <td className="py-1.5 font-bold text-zinc-100">{t.name}</td>
                      <td className="py-1.5 text-cyan-300">{t.channel}</td>
                      <td className="py-1.5">{t.source}</td>
                      <td className="py-1.5 text-zinc-400">{t.with || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
      </div>

      {/* Secciones colapsables: Rutas públicas y Compuertas de etapa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <details className="bg-zinc-900 border border-zinc-800 rounded-lg">
          <summary className="px-5 py-3.5 text-xs font-mono font-bold text-zinc-200 cursor-pointer flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              Rutas públicas autorizadas ({data?.public_routes.entries.length ?? 0})
              <HelpTooltip
                title="Rutas públicas autorizadas"
                text="Lista de endpoints que son públicos a propósito (como login o /health), cada uno con su motivo en .agent/public-routes.txt. Si una ruta pública no está aquí, endpoints_auth la marca como riesgo."
              />
            </span>
          </summary>
          <div className="px-5 pb-4 text-xs font-mono space-y-2 border-t border-zinc-800 pt-3">
            {!data?.public_routes.exists || data.public_routes.entries.length === 0 ? (
              <div className="text-zinc-400">No hay rutas públicas declaradas en .agent/public-routes.txt.</div>
            ) : (
              data.public_routes.entries.map((r, i) => (
                <div key={i} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded">
                  <span className="text-cyan-300 font-bold mr-2">{r.method}</span>
                  <span className="text-zinc-100">{r.route}</span>
                  <div className="text-zinc-400 mt-0.5"># {r.reason}</div>
                </div>
              ))
            )}
          </div>
        </details>

        <details className="bg-zinc-900 border border-zinc-800 rounded-lg">
          <summary className="px-5 py-3.5 text-xs font-mono font-bold text-zinc-200 cursor-pointer flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              Compuertas de cierre de etapa ({data?.gates.length ?? 0})
              <HelpTooltip
                title="Compuertas de etapa (.agent/gates/)"
                text="Archivos YAML que listan los criterios obligatorios que deben cumplirse antes de cerrar una etapa o liberar una versión."
              />
            </span>
          </summary>
          <div className="px-5 pb-4 text-xs font-mono space-y-3 border-t border-zinc-800 pt-3">
            {!data || data.gates.length === 0 ? (
              <div className="text-zinc-400">No hay archivos .yml en .agent/gates/.</div>
            ) : (
              data.gates.map((g) => (
                <div key={g.name} className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-1">
                  <div className="text-green-400 font-bold">{g.name}</div>
                  <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap overflow-x-auto">{g.content}</pre>
                </div>
              ))
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
