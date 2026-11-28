"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyStateGuide from "@/components/EmptyStateGuide";
import HelpTooltip from "@/components/HelpTooltip";

interface AuditFinding {
  id: string;
  rule: string;
  pillar: string;
  standard: string;
  severity: "CRITICA" | "ALTA" | "MEDIA" | "BAJA";
  module: string;
  file: string | null;
  line: number | null;
  snippet: string;
  title: string;
  remediation: string;
  fix_prompt: string;
  source: string;
  diff_status: "NUEVO" | "PERSISTE" | "SIN_BASE";
}

interface AuditPayload {
  available: boolean;
  runner_available: boolean;
  generated_at: string | null;
  repo: string | null;
  scanned_files: number;
  with_network: boolean;
  with_tools: boolean;
  summary: {
    total_findings: number;
    by_severity: Record<string, number>;
    by_pillar: Record<string, number>;
    modules_affected: number;
    controls_cumple: number;
    controls_no_cumple: number;
    controls_no_evaluado: number;
    baseline_compared: boolean;
    new_findings: number;
    persisted_findings: number;
    resolved_since_previous: number;
  } | null;
  modules: Array<{
    module: string;
    total: number;
    critica: number;
    alta: number;
    media: number;
    baja: number;
    pillars: string[];
  }>;
  standards_matrix: Array<{
    framework: string;
    control_id: string;
    name: string;
    status: "CUMPLE" | "NO_CUMPLE" | "NO_EVALUADO";
    evidence: string;
  }>;
  documentation_audit: {
    total_documents: number;
    broken_links: number;
    draft_markers: number;
    checks: Array<{ id: string; name: string; status: string; evidence: string }>;
    documents: Array<{
      path: string;
      kind: string;
      format: string;
      size_bytes: number;
      has_h1: boolean | null;
      has_draft_marker: boolean;
      broken_links: string[];
    }>;
  } | null;
  casmarts_profile: {
    detected: boolean;
    profile: string;
    markers: string[];
  } | null;
  findings: AuditFinding[];
  external_tools: Array<{
    tool: string;
    description: string;
    status: string;
    findings: number;
    hint: string | null;
  }>;
  imported_sources: Array<{ source: string; status: string; findings?: number; error?: string }>;
  preflight: {
    configured: boolean;
    available: boolean;
    asset?: string;
    known_asset?: boolean;
    last_audit?: string | null;
    engines_seen?: string[];
    findings: Array<Record<string, unknown>>;
    reason?: string | null;
  } | null;
  scope_notice: string;
  command: string;
}

type AuditTab = "modules" | "findings" | "docs" | "standards" | "engines";

const PILLAR_LABELS: Record<string, string> = {
  seguridad: "Seguridad",
  desarrollo: "Desarrollo / BD",
  accesibilidad: "Accesibilidad (WCAG)",
  documentacion: "Documentación y Manuales",
  casmarts: "Estándares CASMARTS",
  cmmi: "CMMI v3.0",
  iso27001: "ISO 27001",
  dependencias: "Dependencias / Versiones",
};

const SEV_STYLES: Record<string, string> = {
  CRITICA: "border-red-700 bg-red-950/60 text-red-200",
  ALTA: "border-orange-700 bg-orange-950/50 text-orange-200",
  MEDIA: "border-yellow-700 bg-yellow-950/40 text-yellow-200",
  BAJA: "border-blue-800 bg-blue-950/40 text-blue-200",
};

const CONTROL_STYLES: Record<string, string> = {
  CUMPLE: "border-green-800 bg-green-950/40 text-green-300",
  NO_CUMPLE: "border-red-800 bg-red-950/40 text-red-300",
  NO_EVALUADO: "border-zinc-700 bg-zinc-900 text-zinc-400",
};

export default function AuditPanel() {
  const [data, setData] = useState<AuditPayload | null>(null);
  const [running, setRunning] = useState(false);
  const [withNetwork, setWithNetwork] = useState(false);
  const [withTools, setWithTools] = useState(true);
  const [tab, setTab] = useState<AuditTab>("modules");
  const [pillarFilter, setPillarFilter] = useState<string>("TODOS");
  const [sevFilter, setSevFilter] = useState<string>("TODAS");
  const [moduleFilter, setModuleFilter] = useState<string>("TODOS");
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/audit", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((payload: AuditPayload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        console.error("[AuditPanel] failed loading /api/audit:", err);
        if (!cancelled) setError("No se pudo cargar el estado de la auditoría local.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRunAudit = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ with_network: withNetwork, with_tools: withTools }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || `HTTP ${res.status}`);
      }
      if (body && typeof body === "object" && "findings" in body) {
        setData(body as AuditPayload);
      }
    } catch (err) {
      console.error("[AuditPanel] POST /api/audit failed:", err);
      setError("Error al ejecutar scripts/micro_audit.py en el contenedor.");
    } finally {
      setRunning(false);
    }
  };

  const handleCopyPrompt = async (finding: AuditFinding) => {
    try {
      await navigator.clipboard.writeText(finding.fix_prompt);
      setCopiedId(finding.id);
      setTimeout(() => setCopiedId((prev) => (prev === finding.id ? null : prev)), 2000);
    } catch (err) {
      console.error("[AuditPanel] clipboard copy failed:", err);
    }
  };

  const filteredFindings = useMemo(() => {
    const items = data?.findings || [];
    const q = query.trim().toLowerCase();
    return items.filter((f) => {
      if (pillarFilter !== "TODOS" && f.pillar !== pillarFilter) return false;
      if (sevFilter !== "TODAS" && f.severity !== sevFilter) return false;
      if (moduleFilter !== "TODOS" && f.module !== moduleFilter) return false;
      if (!q) return true;
      return (
        f.rule.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.standard.toLowerCase().includes(q) ||
        f.module.toLowerCase().includes(q) ||
        (f.file || "").toLowerCase().includes(q) ||
        f.remediation.toLowerCase().includes(q)
      );
    });
  }, [data, pillarFilter, sevFilter, moduleFilter, query]);

  const highOrCrit = (data?.summary?.by_severity?.CRITICA ?? 0) + (data?.summary?.by_severity?.ALTA ?? 0);

  return (
    <div className="space-y-6">
      {/* Encabezado y botón de ejecución */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Auditoría Local de Estándares (Micro-Centinela)</h1>
            <HelpTooltip
              title="¿Qué es la Auditoría Local (Micro-Centinela)?"
              text="Escáner rápido que revisa tu repositorio antes de abrir un Merge Request e indica qué módulo, archivo y línea incumple estándares de Seguridad, Desarrollo/BD, Accesibilidad WCAG, Documentación/Manuales, CMMI v3.0, ISO 27001 y Estándares CASMARTS (si el kit está instalado)."
            />
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Identifica exactamente qué parte del desarrollo no cumple estándares y genera prompts listos para corregir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={withNetwork}
              onChange={(e) => setWithNetwork(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-900 accent-green-500"
            />
            <span>Incluir red (versiones/deps)</span>
            <HelpTooltip
              title="Comprobación con red"
              text="Consulta registros oficiales (npm, PyPI, Maven, Docker) para detectar versiones y dependencias desactualizadas."
            />
          </label>

          <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={withTools}
              onChange={(e) => setWithTools(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-900 accent-green-500"
            />
            <span>Herramientas instaladas</span>
            <HelpTooltip
              title="Herramientas externas opcionales"
              text="Si semgrep, gitleaks o trivy están instalados en el entorno, los ejecuta automáticamente sin descargar nada. Si no están, los reporta como NO_INSTALADO."
            />
          </label>

          <button
            type="button"
            onClick={handleRunAudit}
            disabled={running}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition cursor-pointer"
          >
            {running ? "Auditando repositorio…" : "▶ Ejecutar Auditoría Local"}
          </button>
        </div>
      </div>

      {/* Aviso transparente de alcance y perfil CASMARTS */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-zinc-300 leading-relaxed max-w-4xl">
          <span className="font-mono text-green-400 font-bold mr-2">ALCANCE HONESTO:</span>
          {data?.scope_notice ||
            "Auditoría local shift-left sobre código, documentación y configuración. Los controles fuera del árbol local se declaran explícitamente como NO_EVALUADO."}
        </div>
        {data?.casmarts_profile && (
          <span
            className={`px-2.5 py-1 rounded border font-mono text-[11px] shrink-0 ${
              data.casmarts_profile.detected
                ? "border-green-700 bg-green-950/40 text-green-300"
                : "border-zinc-700 bg-zinc-950 text-zinc-400"
            }`}
          >
            {data.casmarts_profile.profile}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-800 bg-red-950/40 text-xs font-mono text-red-200">{error}</div>
      )}

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase">
            <span>Hallazgos Totales</span>
            <HelpTooltip
              title="Hallazgos totales"
              text="Número real de incumplimientos detectados por los motores locales, verificadores, documentación y reportes importados."
            />
          </div>
          <div className={`text-2xl font-black mt-1 ${(data?.summary?.total_findings ?? 0) > 0 ? "text-yellow-300" : "text-green-400"}`}>
            {data?.summary?.total_findings ?? 0}
          </div>
          {data?.summary?.baseline_compared && (
            <div className="text-[11px] font-mono text-zinc-400 mt-1">
              +{data.summary.new_findings} nuevos · {data.summary.resolved_since_previous} solventados
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase">
            <span>Críticos / Altos</span>
            <HelpTooltip
              title="Hallazgos Críticos y Altos"
              text="Incumplimientos prioritarios (secretos, inyección SQL, endpoints sin autorización, stubs o pruebas no aisladas) que conviene corregir antes de subir un MR."
            />
          </div>
          <div className={`text-2xl font-black mt-1 ${highOrCrit > 0 ? "text-red-400" : "text-green-400"}`}>{highOrCrit}</div>
          <div className="text-[11px] font-mono text-zinc-400 mt-1">
            CRÍTICA: {data?.summary?.by_severity?.CRITICA ?? 0} · ALTA: {data?.summary?.by_severity?.ALTA ?? 0}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase">
            <span>Módulos Afectados</span>
            <HelpTooltip
              title="Partes del desarrollo afectadas"
              text="Cantidad de carpetas o capas del proyecto donde se encontró al menos un incumplimiento. En la pestaña 'Por Módulo' verás cuáles requieren atención."
            />
          </div>
          <div className="text-2xl font-black text-zinc-100 mt-1">{data?.summary?.modules_affected ?? 0}</div>
          <div className="text-[11px] font-mono text-zinc-400 mt-1">{data?.scanned_files ?? 0} archivos escaneados</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase">
            <span>Docs y Manuales</span>
            <HelpTooltip
              title="Documentación y Manuales"
              text="Documentos inventariados en README, docs/, documentacion/, manuales/ y DECISIONS/, junto con conteo de enlaces rotos o marcadores borrador."
            />
          </div>
          <div className="text-2xl font-black text-cyan-300 mt-1">{data?.documentation_audit?.total_documents ?? 0}</div>
          <div className="text-[11px] font-mono text-zinc-400 mt-1">
            enlaces rotos: {data?.documentation_audit?.broken_links ?? 0} · borradores: {data?.documentation_audit?.draft_markers ?? 0}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 uppercase">
            <span>CMMI / ISO / Kit</span>
            <HelpTooltip
              title="Controles de Cumplimiento"
              text="Controles medibles en el repositorio. Verde = CUMPLE, rojo = NO_CUMPLE, gris = NO_EVALUADO (controles organizacionales fuera del código)."
            />
          </div>
          <div className="text-sm font-mono font-bold mt-2 space-x-2">
            <span className="text-green-400">{data?.summary?.controls_cumple ?? 0} OK</span>
            <span className={(data?.summary?.controls_no_cumple ?? 0) > 0 ? "text-red-400" : "text-zinc-500"}>
              {data?.summary?.controls_no_cumple ?? 0} NO
            </span>
            <span className="text-zinc-400">{data?.summary?.controls_no_evaluado ?? 0} N/E</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-500 mt-1 truncate">
            {data?.generated_at ? new Date(data.generated_at).toLocaleString("es-MX") : "Sin ejecutar"}
          </div>
        </div>
      </div>

      {!data || !data.available ? (
        <EmptyStateGuide
          title="¿Cómo ejecuto la Auditoría Local (Micro-Centinela)?"
          explanation="Aún no existe data/micro-audit-report.json en este espacio. Pulsa el botón verde 'Ejecutar Auditoría Local' arriba para auditar el repositorio ahora mismo, o córrelo desde tu terminal:"
          command={data?.command || "python3 scripts/micro_audit.py --path . --out data/micro-audit-report.json"}
          helpText="La auditoría corre en modo solo lectura sobre el repositorio y guarda un informe JSON sin modificar tu código."
        />
      ) : (
        <>
          {/* Sub-pestañas (sin botones anidados) */}
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
            {(
              [
                {
                  id: "modules",
                  label: `Por Módulo (${data.modules.length})`,
                  title: "Incumplimientos por Módulo",
                  help: "Agrupa los hallazgos por carpeta o capa del proyecto para detectar rápidamente qué parte del desarrollo concentra incumplimientos.",
                },
                {
                  id: "findings",
                  label: `Hallazgos Detallados (${data.findings.length})`,
                  title: "Lista completa de hallazgos",
                  help: "Filtra por pilar, severidad o archivo, consulta cómo corregirlo y copia un prompt listo para pedir la corrección al agente.",
                },
                {
                  id: "docs",
                  label: `Documentación y Manuales (${data.documentation_audit?.total_documents ?? 0})`,
                  title: "Auditoría de Documentación y Manuales",
                  help: "Revisa README, manuales de usuario/instalación, ADRs, comentarios SQL COMMENT ON, OpenAPI, enlaces rotos y textos borrador.",
                },
                {
                  id: "standards",
                  label: `CMMI / ISO / CASMARTS (${data.standards_matrix.length})`,
                  title: "Matriz de Estándares",
                  help: "Muestra cada control verificable de CMMI v3.0, ISO/IEC 27001 y Estándares CASMARTS con su evidencia real o estado NO_EVALUADO.",
                },
                {
                  id: "engines",
                  label: "Motores y Centinela",
                  title: "Motores externos y Preflight",
                  help: "Estado real de semgrep/gitleaks/trivy en el entorno, reportes importados (data/hallazgos.json, SARIF) y conexión opcional con Centinela vía PREFLIGHT_URL.",
                },
              ] as Array<{ id: AuditTab; label: string; title: string; help: string }>
            ).map((t) => (
              <div
                key={t.id}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition ${
                  tab === t.id ? "bg-green-600 text-white" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <button type="button" onClick={() => setTab(t.id)} className="cursor-pointer">
                  {t.label}
                </button>
                <HelpTooltip title={t.title} text={t.help} />
              </div>
            ))}
          </div>

          {/* TAB 1: POR MÓDULO / PARTE DEL DESARROLLO */}
          {tab === "modules" && (
            <div className="space-y-4">
              {data.modules.length === 0 ? (
                <div className="bg-zinc-900 border border-green-800/60 rounded-lg p-6 text-sm text-green-300">
                  ✔ Sin incumplimientos detectados en los módulos escaneados ({data.scanned_files} archivos revisados).
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.modules.map((m) => (
                    <div
                      key={m.module}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-mono font-bold text-white">{m.module}</div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {m.pillars.map((p) => (
                              <span
                                key={p}
                                className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-[10px] font-mono text-zinc-300"
                              >
                                {PILLAR_LABELS[p] || p}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-700 font-mono text-xs font-bold text-zinc-100">
                          {m.total} hallazgo(s)
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-[11px] font-mono">
                        <div className="flex items-center gap-2">
                          {m.critica > 0 && <span className="text-red-300 font-bold">CRÍTICA: {m.critica}</span>}
                          {m.alta > 0 && <span className="text-orange-300 font-bold">ALTA: {m.alta}</span>}
                          {m.media > 0 && <span className="text-yellow-300">MEDIA: {m.media}</span>}
                          {m.baja > 0 && <span className="text-blue-300">BAJA: {m.baja}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setModuleFilter(m.module);
                            setTab("findings");
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-green-700 text-zinc-100 cursor-pointer transition"
                        >
                          Ver hallazgos →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HALLAZGOS DETALLADOS */}
          {tab === "findings" && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  aria-label="Filtrar por pilar"
                  value={pillarFilter}
                  onChange={(e) => setPillarFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                >
                  <option value="TODOS">Pilar: TODOS</option>
                  {Object.entries(PILLAR_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label} ({data.summary?.by_pillar?.[k] ?? 0})
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filtrar por severidad"
                  value={sevFilter}
                  onChange={(e) => setSevFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                >
                  <option value="TODAS">Severidad: TODAS</option>
                  <option value="CRITICA">CRÍTICA</option>
                  <option value="ALTA">ALTA</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="BAJA">BAJA</option>
                </select>

                <select
                  aria-label="Filtrar por módulo"
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                >
                  <option value="TODOS">Módulo: TODOS</option>
                  {data.modules.map((m) => (
                    <option key={m.module} value={m.module}>
                      {m.module} ({m.total})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar regla, archivo o remediación…"
                  className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-500 flex-1 min-w-[220px]"
                />
              </div>

              {filteredFindings.length === 0 ? (
                <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-400">
                  No hay hallazgos que coincidan con los filtros seleccionados.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFindings.map((f) => (
                    <div key={f.id} className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${SEV_STYLES[f.severity] || ""}`}>
                            {f.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono text-[10px] text-green-300">
                            {f.rule}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-300">
                            {PILLAR_LABELS[f.pillar] || f.pillar}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-cyan-300">
                            {f.module}
                          </span>
                          {f.diff_status !== "SIN_BASE" && (
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                                f.diff_status === "NUEVO" ? "bg-amber-950 text-amber-300" : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {f.diff_status}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(f)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-green-700 text-zinc-100 text-[11px] font-mono cursor-pointer transition"
                        >
                          {copiedId === f.id ? "✔ Prompt copiado" : "📋 Copiar prompt de corrección"}
                        </button>
                      </div>

                      <div className="text-sm font-semibold text-zinc-100">{f.title}</div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
                        <span>
                          Ubicación:{" "}
                          <strong className="text-zinc-200">
                            {f.file ? (f.line ? `${f.file}:${f.line}` : f.file) : "Repositorio"}
                          </strong>
                        </span>
                        <span>Estándar: {f.standard}</span>
                        <span>Origen: {f.source}</span>
                      </div>

                      {f.snippet && (
                        <pre className="p-2.5 rounded bg-black/70 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                          {f.snippet}
                        </pre>
                      )}

                      <div className="text-xs text-zinc-300 bg-zinc-900/70 border border-zinc-800 rounded p-2.5">
                        <span className="font-mono text-green-400 font-semibold mr-1.5">Cómo corregirlo:</span>
                        {f.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DOCUMENTACIÓN Y MANUALES */}
          {tab === "docs" && (
            <div className="space-y-5">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-200">
                    Controles de Documentación y Manuales
                  </h2>
                  <HelpTooltip
                    title="¿Qué revisa esta pestaña?"
                    text="Comprueba README principal, existencia de manuales de instalación/usuario, sentencias COMMENT ON en SQL, documentación OpenAPI/Swagger en endpoints, enlaces internos rotos y textos borrador (TBD / LOREM IPSUM)."
                  />
                </div>
                <div className="space-y-2">
                  {(data.documentation_audit?.checks || []).map((chk) => (
                    <div
                      key={chk.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${CONTROL_STYLES[chk.status] || ""}`}>
                          {chk.status}
                        </span>
                        <span className="font-semibold text-zinc-100">{chk.name}</span>
                        <span className="font-mono text-zinc-500">({chk.id})</span>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-400">{chk.evidence}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-200">
                  Inventario de Manuales y Documentos ({data.documentation_audit?.documents.length ?? 0})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-zinc-800 text-zinc-400">
                      <tr>
                        <th className="py-2 pr-3">Documento</th>
                        <th className="py-2 pr-3">Tipo</th>
                        <th className="py-2 pr-3">Formato</th>
                        <th className="py-2 pr-3">Tamaño</th>
                        <th className="py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {(data.documentation_audit?.documents || []).map((doc) => {
                        const hasIssue = doc.has_draft_marker || doc.broken_links.length > 0;
                        return (
                          <tr key={doc.path}>
                            <td className="py-2 pr-3 text-zinc-200">{doc.path}</td>
                            <td className="py-2 pr-3 text-cyan-300">{doc.kind}</td>
                            <td className="py-2 pr-3 uppercase text-zinc-400">{doc.format}</td>
                            <td className="py-2 pr-3 text-zinc-400">{(doc.size_bytes / 1024).toFixed(1)} KB</td>
                            <td className="py-2">
                              {hasIssue ? (
                                <span className="text-amber-300">
                                  {doc.broken_links.length > 0 ? `${doc.broken_links.length} enlace(s) roto(s)` : ""}
                                  {doc.broken_links.length > 0 && doc.has_draft_marker ? " · " : ""}
                                  {doc.has_draft_marker ? "marcador borrador" : ""}
                                </span>
                              ) : (
                                <span className="text-green-400">OK</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CMMI / ISO / CASMARTS */}
          {tab === "standards" && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
              {data.casmarts_profile && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5 text-xs font-mono">
                  <div className="text-zinc-200 font-bold">Perfil organizacional: {data.casmarts_profile.profile}</div>
                  {data.casmarts_profile.detected ? (
                    <div className="text-green-400 mt-1">
                      Marcadores detectados: {data.casmarts_profile.markers.join(", ")}
                    </div>
                  ) : (
                    <div className="text-zinc-400 mt-1">
                      Al instalar el Kit CASMARTS en un proyecto, esta sección activa automáticamente las comprobaciones de auditoría SQL CASMART, `@PreAuthorize` y entregables C&A.
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {data.standards_matrix.map((row) => (
                  <div
                    key={`${row.framework}-${row.control_id}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded border font-mono text-[10px] font-bold ${CONTROL_STYLES[row.status] || ""}`}>
                          {row.status}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono text-[10px] text-zinc-300">
                          {row.framework}
                        </span>
                        <span className="font-semibold text-zinc-100">{row.name}</span>
                        <span className="font-mono text-zinc-500">({row.control_id})</span>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-400">{row.evidence}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MOTORES EXTERNOS Y PREFLIGHT CENTINELA */}
          {tab === "engines" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-200">
                  Herramientas Externas Opcionales (Nivel 2)
                </h2>
                <div className="space-y-2">
                  {data.external_tools.map((tool) => (
                    <div
                      key={tool.tool}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div>
                        <div className="text-zinc-100 font-bold">{tool.tool}</div>
                        <div className="text-zinc-400 text-[11px]">{tool.description}</div>
                        {tool.hint && <div className="text-zinc-500 text-[10px] mt-0.5">{tool.hint}</div>}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                          tool.status === "EJECUTADO"
                            ? "border-green-800 bg-green-950/40 text-green-300"
                            : "border-zinc-700 bg-zinc-900 text-zinc-400"
                        }`}
                      >
                        {tool.status}
                        {tool.status === "EJECUTADO" ? ` (${tool.findings})` : ""}
                      </span>
                    </div>
                  ))}
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-300 pt-2">
                  Reportes Importados (`data/hallazgos.json`, `data/*.sarif`, `data/outdated-dependencies.json`)
                </h3>
                {data.imported_sources.length === 0 ? (
                  <div className="text-xs font-mono text-zinc-500">
                    No se encontraron reportes adicionales en `data/`.
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs font-mono">
                    {data.imported_sources.map((src) => (
                      <div key={src.source} className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2">
                        <span className="text-zinc-200">{src.source}</span>
                        <span className="text-green-400">
                          {src.status} ({src.findings ?? 0})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-200">
                  Conexión con Escáner Corporativo (Preflight / Centinela)
                </h2>
                {!data.preflight || !data.preflight.configured ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-xs font-mono text-zinc-400 space-y-2">
                    <div className="text-zinc-200 font-bold">Estado: NO_CONFIGURADO (modo 100% local)</div>
                    <p>{data.preflight?.reason || "PREFLIGHT_URL no está configurado."}</p>
                    <p className="text-zinc-500">
                      Si deseas consultar hallazgos abiertos del servidor de Centinela en paralelo, define `PREFLIGHT_URL` y `PREFLIGHT_TOKEN` en el entorno.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-xs font-mono space-y-2">
                    <div className={data.preflight.available ? "text-green-400 font-bold" : "text-amber-300 font-bold"}>
                      {data.preflight.available
                        ? `Conectado · Activo: ${data.preflight.asset} (${data.preflight.findings.length} hallazgo(s))`
                        : `Sin respuesta: ${data.preflight.reason}`}
                    </div>
                    {data.preflight.last_audit && (
                      <div className="text-zinc-400">Última auditoría en servidor: {data.preflight.last_audit}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
