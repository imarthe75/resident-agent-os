import { NextRequest, NextResponse } from "next/server";
import { probePostgres, probeValkey } from "@/lib/agentData";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const project = request.nextUrl.searchParams.get("project");
  const [valkey, postgres] = await Promise.all([probeValkey(true), probePostgres(true, project)]);
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    project: project || "all",
    valkey,
    postgres,
  });
}
