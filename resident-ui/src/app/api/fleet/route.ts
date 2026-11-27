import { NextResponse } from "next/server";
import { getPaths, readFleetReport } from "@/lib/agentData";

export const dynamic = "force-dynamic";

export async function GET() {
  const { fleetReportPath } = getPaths();
  return NextResponse.json(readFleetReport(fleetReportPath));
}
