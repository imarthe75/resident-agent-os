import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { getPaths, probePostgres, probeValkey } from "@/lib/agentData";

export const dynamic = "force-dynamic";

/** Readiness probe: checks .agent filesystem, Valkey, and PostgreSQL; returns 503 when unavailable. */
export async function GET(request: NextRequest) {
  const strict = request.nextUrl.searchParams.get("strict") === "1";
  const { agentDir } = getPaths();
  const agentDirReadable = fs.existsSync(agentDir);
  const [valkey, postgres] = await Promise.all([probeValkey(false), probePostgres(false)]);

  const degraded = !valkey.connected || !postgres.connected;
  const ready = agentDirReadable && (!strict || !degraded);

  return NextResponse.json(
    {
      status: ready ? (degraded ? "degraded" : "ready") : "unavailable",
      service: "resident-ui",
      timestamp: new Date().toISOString(),
      dependencies: {
        agent_dir: { ok: agentDirReadable, path: agentDir },
        valkey: { ok: valkey.connected, host: valkey.host, port: valkey.port, latency_ms: valkey.latency_ms, error: valkey.error },
        postgres: { ok: postgres.connected, host: postgres.host, port: postgres.port, database: postgres.database, latency_ms: postgres.latency_ms, error: postgres.error },
      },
    },
    { status: ready ? 200 : 503 }
  );
}
