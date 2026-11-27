import { NextResponse } from "next/server";
import { getPaths } from "@/lib/agentData";
import { readDependenciesHealth } from "@/lib/workspaceInspector";

export const dynamic = "force-dynamic";

export async function GET() {
  const { agentDir, dataDir } = getPaths();
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    ...readDependenciesHealth(agentDir, dataDir),
  });
}
