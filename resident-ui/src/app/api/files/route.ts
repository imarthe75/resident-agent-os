import { NextRequest, NextResponse } from "next/server";
import { getPaths, listWorkspaceFiles, readWorkspaceFile } from "@/lib/agentData";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { workspaceRoot, agentDir } = getPaths();
  const requested = request.nextUrl.searchParams.get("path");
  if (!requested) {
    return NextResponse.json({ files: listWorkspaceFiles(workspaceRoot, agentDir) });
  }
  const file = readWorkspaceFile(workspaceRoot, agentDir, requested);
  if (!file) {
    return NextResponse.json({ error: "File not found or outside allowed directories" }, { status: 404 });
  }
  return NextResponse.json(file);
}
