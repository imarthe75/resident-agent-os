import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness probe: touches no external dependencies (rules/common/observability.md §1). */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "resident-ui",
    timestamp: new Date().toISOString(),
  });
}
