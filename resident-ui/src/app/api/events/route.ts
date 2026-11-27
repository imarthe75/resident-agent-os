import fs from "node:fs";
import { NextRequest } from "next/server";
import { getPaths, readTelemetryEvents } from "@/lib/agentData";

export const dynamic = "force-dynamic";

/** Real-time Server-Sent Events stream tailing `.agent/telemetry/events.jsonl`. */
export async function GET(request: NextRequest) {
  const { telemetryPath } = getPaths();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastCount = 0;
      const send = (eventName: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const initial = readTelemetryEvents(telemetryPath, 100);
      lastCount = fs.existsSync(telemetryPath)
        ? fs.readFileSync(telemetryPath, "utf-8").split("\n").filter((l) => l.trim()).length
        : 0;
      send("snapshot", { events: initial });

      const timer = setInterval(() => {
        if (!fs.existsSync(telemetryPath)) return;
        const lines = fs.readFileSync(telemetryPath, "utf-8").split("\n").filter((l) => l.trim());
        if (lines.length > lastCount) {
          const added = lines.slice(lastCount);
          lastCount = lines.length;
          for (const raw of added) {
            try {
              send("telemetry", JSON.parse(raw));
            } catch (err) {
              console.error("[api/events] malformed JSONL line:", err);
            }
          }
        } else {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        }
      }, 2000);

      request.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
