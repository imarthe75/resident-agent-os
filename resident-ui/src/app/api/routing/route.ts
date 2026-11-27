import { NextResponse } from "next/server";
import { getPaths } from "@/lib/agentData";
import { readModelRouting } from "@/lib/workspaceInspector";

export const dynamic = "force-dynamic";

export async function GET() {
  const { workspaceRoot, agentDir } = getPaths();
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    ...readModelRouting(workspaceRoot, agentDir),
  });
}
