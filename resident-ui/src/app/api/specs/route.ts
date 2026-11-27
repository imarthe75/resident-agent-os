import { NextRequest, NextResponse } from "next/server";
import { getPaths, readSpecs, saveSpecs } from "@/lib/agentData";

export const dynamic = "force-dynamic";

export async function GET() {
  const { agentDir } = getPaths();
  return NextResponse.json(readSpecs(agentDir));
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body.markdown !== "string" || body.markdown.trim().length === 0) {
      return NextResponse.json({ error: "markdown must be a non-empty string" }, { status: 400 });
    }
    const { agentDir } = getPaths();
    const result = saveSpecs(agentDir, body.markdown);
    return NextResponse.json({ saved: true, specs: result.specs });
  } catch (err) {
    console.error("[api/specs] Failed to save SPECS.md:", err);
    return NextResponse.json({ error: "Failed to save SPECS.md" }, { status: 500 });
  }
}
