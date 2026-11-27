import { NextResponse } from "next/server";
import {
  getPaths,
  probePostgres,
  probeValkey,
  readHeuristics,
  readProfile,
  readSpecs,
  readStateBlock,
  readTelemetryEvents,
  readThresholds,
  summarizeTelemetry,
} from "@/lib/agentData";

export const dynamic = "force-dynamic";

export async function GET() {
  const { agentDir, telemetryPath } = getPaths();
  const stateBlock = readStateBlock(agentDir);
  const specsData = readSpecs(agentDir);
  const heuristics = readHeuristics(agentDir);
  const profile = readProfile(agentDir);
  const thresholds = readThresholds(agentDir);
  const events = readTelemetryEvents(telemetryPath, 200);
  const { summary, evaluation } = summarizeTelemetry(events, thresholds);
  const [valkey, postgres] = await Promise.all([probeValkey(false), probePostgres(false)]);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    agentDir,
    machineState: stateBlock.machineState,
    stateExists: stateBlock.exists,
    specs: specsData.specs,
    specsMarkdown: specsData.markdown,
    heuristics,
    profile,
    thresholds,
    events: events.slice(-100),
    summary,
    evaluation,
    services: {
      valkey: { connected: valkey.connected, host: valkey.host, port: valkey.port, latency_ms: valkey.latency_ms, error: valkey.error },
      postgres: { connected: postgres.connected, host: postgres.host, port: postgres.port, database: postgres.database, latency_ms: postgres.latency_ms, error: postgres.error },
    },
  });
}
