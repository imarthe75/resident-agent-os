import { NextRequest, NextResponse } from "next/server";
import { getPaths } from "@/lib/agentData";
import { readVerifiersReport, runVerifiersNow } from "@/lib/workspaceInspector";

export const dynamic = "force-dynamic";

export async function GET() {
  const { workspaceRoot, agentDir, dataDir } = getPaths();
  return NextResponse.json(readVerifiersReport(workspaceRoot, agentDir, dataDir));
}

export async function POST(request: NextRequest) {
  const { workspaceRoot, agentDir, dataDir } = getPaths();
  let withNetwork = false;
  try {
    const body = await request.json().catch(() => ({}));
    withNetwork = Boolean(body?.with_network === true);
  } catch (err) {
    console.error("[api/verifiers] malformed POST body:", err);
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  const out = runVerifiersNow(workspaceRoot, agentDir, dataDir, withNetwork);
  if (!out.ok) {
    return NextResponse.json({ error: out.error, ...out.report }, { status: 500 });
  }
  return NextResponse.json(out.report);
}
