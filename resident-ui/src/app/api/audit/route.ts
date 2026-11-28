import { NextRequest, NextResponse } from "next/server";
import { getPaths } from "@/lib/agentData";
import { readMicroAuditReport, runMicroAuditNow } from "@/lib/workspaceInspector";

export const dynamic = "force-dynamic";

export async function GET() {
  const { workspaceRoot, dataDir } = getPaths();
  return NextResponse.json(readMicroAuditReport(workspaceRoot, dataDir));
}

export async function POST(request: NextRequest) {
  const { workspaceRoot, dataDir } = getPaths();
  let withNetwork = false;
  let withTools = true;
  try {
    const body = await request.json().catch(() => ({}));
    withNetwork = Boolean(body?.with_network === true);
    withTools = body?.with_tools !== false;
  } catch (err) {
    console.error("[api/audit] malformed POST body:", err);
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  const out = runMicroAuditNow(workspaceRoot, dataDir, { withNetwork, withTools });
  if (!out.ok) {
    return NextResponse.json({ error: out.error, ...out.report }, { status: 500 });
  }
  return NextResponse.json(out.report);
}
