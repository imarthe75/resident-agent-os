/**
 * Suite E2E real en Chromium (Playwright) para Resident UI.
 *
 * Verifica sobre una instancia viva (por omisión http://127.0.0.1:3000):
 *  - 0 errores de consola del navegador, 0 excepciones no controladas, 0 overlays de Next.js
 *  - 0 peticiones a orígenes externos / CDNs (en particular cdn.jsdelivr.net)
 *  - 0 respuestas HTTP >= 400
 *  - Interfaz en español (<html lang="es">), HelpTooltip accesible dentro del viewport
 *  - Monaco Editor cargado 100% desde /vs/loader.js y montado en el DOM (.monaco-editor)
 *  - Ejecución en vivo de /gates (POST /api/verifiers) con evaluación completa del repositorio
 *  - Datos reales en /dashboard, /fleet, /gates, /capabilities, /editor, /specs, /memory y /debug
 *
 * Uso (con mcr.microsoft.com/playwright):
 *   BASE_URL=http://127.0.0.1:3000 SCREENSHOT_DIR=/tmp/shots node resident-ui/tests/e2e-browser.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || "";
const BASE_ORIGIN = new URL(BASE_URL).origin;

if (SCREENSHOT_DIR) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const ROUTES = [
  { path: "/dashboard", name: "dashboard", expectedText: "Traza del Ciclo Cognitivo" },
  { path: "/fleet", name: "fleet", expectedText: "Monitor de Flota" },
  { path: "/gates", name: "gates", expectedText: "Compuertas y Verificadores" },
  { path: "/audit", name: "audit", expectedText: "Auditoría Local de Estándares" },
  { path: "/capabilities", name: "capabilities", expectedText: "Catálogo de Capacidades" },
  { path: "/editor", name: "editor", expectedText: "Archivos del Espacio" },
  { path: "/specs", name: "specs", expectedText: "Especificaciones" },
  { path: "/memory", name: "memory", expectedText: "Memoria Semántica" },
  { path: "/debug", name: "debug", expectedText: "Depuración y Reglas" },
];

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const httpErrors = [];
const externalRequests = [];
const monacoLocalAssets = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "es-MX" });
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") {
    consoleErrors.push({ url: page.url(), text: msg.text() });
  }
});

page.on("pageerror", (err) => {
  pageErrors.push({ url: page.url(), message: err.message });
});

page.on("request", (req) => {
  const url = req.url();
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("about:")) return;
  try {
    const parsed = new URL(url);
    if (parsed.origin !== BASE_ORIGIN) {
      externalRequests.push({ page: page.url(), url, resourceType: req.resourceType() });
    }
  } catch {
    // Ignorar esquemas no estándar
  }
});

page.on("requestfailed", (req) => {
  const errText = req.failure()?.errorText || "unknown";
  // El stream SSE (/api/events) se aborta de forma normal al navegar a otra ruta
  if (req.url().includes("/api/events") && errText.includes("ERR_ABORTED")) return;
  failedRequests.push({ page: page.url(), url: req.url(), error: errText });
});

page.on("response", (res) => {
  const url = res.url();
  const status = res.status();
  if (url.includes("/vs/")) {
    monacoLocalAssets.push({ url, status });
  }
  if (status >= 400) {
    httpErrors.push({ page: page.url(), url, status });
  }
});

async function saveShot(name) {
  if (!SCREENSHOT_DIR) return;
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true, caret: "initial" });
}

async function checkNoNextOverlay(routeName) {
  const overlayInfo = await page.evaluate(() => {
    const portal = document.querySelector("nextjs-portal");
    if (!portal || !portal.shadowRoot) return { hasError: false, text: "" };
    const sr = portal.shadowRoot;
    const dialog = sr.querySelector("[data-nextjs-dialog], [data-nextjs-error-overlay], [role='dialog']");
    if (dialog) {
      return { hasError: true, text: (dialog.textContent || "").trim().slice(0, 240) };
    }
    const issuesBadge = sr.querySelector("[data-issues-count], [data-next-badge-issues]");
    const badgeText = (issuesBadge?.textContent || "").trim();
    if (badgeText && /\b[1-9]\d*\b/.test(badgeText)) {
      return { hasError: true, text: `Next.js dev indicator issues: ${badgeText}` };
    }
    return { hasError: false, text: "" };
  });
  if (overlayInfo.hasError) {
    throw new Error(`Next.js error overlay detectado en ${routeName}: ${overlayInfo.text}`);
  }
}

const routeSummary = [];

try {
  for (const route of ROUTES) {
    await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("body", { timeout: 10000 });
    await page.waitForTimeout(900);

    const lang = await page.getAttribute("html", "lang");
    if (lang !== "es") {
      throw new Error(`Esperado <html lang="es"> en ${route.path}, recibido: ${lang}`);
    }

    const bodyText = await page.evaluate(() => document.body.innerText);
    if (!bodyText.toLowerCase().includes(route.expectedText.toLowerCase())) {
      throw new Error(
        `Texto esperado "${route.expectedText}" no encontrado en ${route.path}. Muestra: ${bodyText.slice(0, 300)}`
      );
    }

    await checkNoNextOverlay(route.name);

    // Pruebas interactivas específicas por pantalla
    const extra = {};

    if (route.name === "dashboard") {
      const tipBtn = page.locator('button[aria-label^="Ayuda sobre "]').first();
      await tipBtn.waitFor({ state: "visible", timeout: 8000 });
      await tipBtn.click();
      const tooltip = page.locator('[role="tooltip"]').first();
      await tooltip.waitFor({ state: "visible", timeout: 5000 });
      const box = await tooltip.boundingBox();
      const vp = page.viewportSize();
      if (!box || box.x < 0 || box.y < 0 || box.x + box.width > vp.width || box.y + box.height > vp.height) {
        throw new Error(`HelpTooltip recortado fuera del viewport en /dashboard: ${JSON.stringify(box)}`);
      }
      extra.tooltipBox = { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) };
      await saveShot("01-dashboard-tooltip");
      await page.keyboard.press("Escape");
    }

    if (route.name === "gates") {
      const runBtn = page.getByRole("button", { name: /Ejecutar verificadores/i });
      await runBtn.waitFor({ state: "visible", timeout: 8000 });
      const respPromise = page.waitForResponse(
        (res) => res.url().includes("/api/verifiers") && res.request().method() === "POST",
        { timeout: 30000 }
      );
      await runBtn.click();
      const postRes = await respPromise;
      const postJson = await postRes.json();
      await page.waitForTimeout(600);
      if (!postJson.available || (postJson.counts?.cumple ?? 0) < 8 || (postJson.counts?.no_cumple ?? 1) !== 0) {
        throw new Error(
          `Resultado inesperado en POST /api/verifiers (se esperaban >=8 CUMPLE y 0 NO_CUMPLE): ${JSON.stringify(postJson.counts)}`
        );
      }
      // Expandir el primer verificador que tenga botón de detalles
      const detailsBtn = page.getByRole("button", { name: /Detalles/i }).first();
      if (await detailsBtn.isVisible().catch(() => false)) {
        await detailsBtn.click();
        await page.waitForTimeout(300);
      }
      extra.verifiersCounts = postJson.counts;
      await saveShot("02-gates-verifiers");
    }

    if (route.name === "audit") {
      const runAuditBtn = page.getByRole("button", { name: /Ejecutar Auditoría Local/i });
      await runAuditBtn.waitFor({ state: "visible", timeout: 8000 });
      const auditRespPromise = page.waitForResponse(
        (res) => res.url().includes("/api/audit") && res.request().method() === "POST",
        { timeout: 30000 }
      );
      await runAuditBtn.click();
      const auditRes = await auditRespPromise;
      const auditJson = await auditRes.json();
      await page.waitForTimeout(500);
      if (!auditJson.available || !auditJson.documentation_audit || !Array.isArray(auditJson.standards_matrix)) {
        throw new Error(`Resultado inesperado en POST /api/audit: ${JSON.stringify(auditJson.summary)}`);
      }
      await saveShot("09-audit-local");
      const docsTabBtn = page.getByRole("button", { name: /^Documentación y Manuales \(/i });
      await docsTabBtn.click();
      await page.waitForTimeout(400);
      await saveShot("10-audit-docs-manuals");
      extra.auditSummary = {
        totalFindings: auditJson.summary?.total_findings ?? 0,
        docsCount: auditJson.documentation_audit?.total_documents ?? 0,
        standardsControls: auditJson.standards_matrix.length,
      };
    }

    if (route.name === "capabilities") {
      const searchInput = page.locator('input[placeholder*="Buscar"]').first();
      await searchInput.waitFor({ state: "visible", timeout: 8000 });
      await searchInput.fill("security");
      await page.waitForTimeout(300);
      await searchInput.fill("");
      await page.waitForTimeout(200);
      await saveShot("03-capabilities");
    }

    if (route.name === "editor") {
      // Esperar a que Monaco cargue localmente y monte .monaco-editor con líneas visibles
      await page.waitForSelector(".monaco-editor .view-lines", { timeout: 25000 });
      await page.waitForTimeout(800);
      const lineCount = await page.locator(".monaco-editor .view-line").count();
      if (lineCount < 1) {
        throw new Error("Monaco Editor montó pero sin líneas visibles (.view-line)");
      }
      extra.monacoLines = lineCount;
      await saveShot("04-editor-monaco");
    }

    if (route.name === "specs") {
      const adrTab = page.getByRole("button", { name: /Decisiones Técnicas/i });
      await adrTab.waitFor({ state: "visible", timeout: 8000 });
      await adrTab.click();
      await page.waitForTimeout(500);
      await saveShot("05-specs-adrs");
    }

    if (route.name === "debug") {
      await page.waitForFunction(
        () => {
          const t = document.body.innerText.toLowerCase();
          return t.includes("general-purpose") && t.includes("hooks configurados");
        },
        { timeout: 15000 }
      );
      await page.waitForTimeout(300);
      const dbgText = (await page.evaluate(() => document.body.innerText)).toLowerCase();
      if (!dbgText.includes("diagnóstico del entorno") || !dbgText.includes("ruteo de subagentes")) {
        throw new Error("Faltan bloques de Diagnóstico del Entorno o Ruteo de Subagentes en /debug");
      }
      await saveShot("06-debug-doctor-routing");
    }

    if (route.name === "fleet") {
      const repoBtn = page.locator("tbody tr button[aria-expanded]").first();
      if (await repoBtn.isVisible().catch(() => false)) {
        await repoBtn.click();
        await page.waitForTimeout(300);
        const expandedAttr = await repoBtn.getAttribute("aria-expanded");
        if (expandedAttr !== "true") {
          throw new Error("Al hacer clic en el repositorio de /fleet no se expandió el detalle");
        }
        extra.fleetExpanded = true;
      }
      await saveShot("07-fleet");
    }

    if (route.name === "memory") {
      await saveShot("08-memory");
    }

    routeSummary.push({ route: route.path, status: "OK", ...extra });
  }
} finally {
  await browser.close();
}

const loaderLoaded = monacoLocalAssets.some((a) => a.url.includes("/vs/loader.js") && a.status === 200);

const report = {
  baseUrl: BASE_URL,
  routesChecked: routeSummary.length,
  routeSummary,
  consoleErrors,
  pageErrors,
  failedRequests,
  httpErrors,
  externalRequests,
  monacoLocalAssetsCount: monacoLocalAssets.length,
  monacoLoaderHttp200: loaderLoaded,
};

console.log(JSON.stringify(report, null, 2));

const failures = [];
if (consoleErrors.length > 0) failures.push(`consoleErrors=${consoleErrors.length}`);
if (pageErrors.length > 0) failures.push(`pageErrors=${pageErrors.length}`);
if (failedRequests.length > 0) failures.push(`failedRequests=${failedRequests.length}`);
if (httpErrors.length > 0) failures.push(`httpErrors=${httpErrors.length}`);
if (externalRequests.length > 0) failures.push(`externalRequests=${externalRequests.length}`);
if (!loaderLoaded) failures.push("monacoLoaderHttp200=false");

if (failures.length > 0) {
  console.error("E2E BROWSER VERIFICATION FAILED:", failures.join(", "));
  process.exit(1);
}

console.log("E2E BROWSER VERIFICATION PASSED (100%): 0 console errors, 0 overlays, 0 external CDN requests, Monaco local mounted.");
