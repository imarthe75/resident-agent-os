import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "0.0.0.0",
  "resident-ui",
]);

function normalizeHost(rawHost: string | null): string {
  if (!rawHost) return "";
  const trimmed = rawHost.trim().toLowerCase();
  if (trimmed.startsWith("[")) {
    const end = trimmed.indexOf("]");
    return end !== -1 ? trimmed.slice(0, end + 1) : trimmed;
  }
  const colonIdx = trimmed.indexOf(":");
  return colonIdx !== -1 ? trimmed.slice(0, colonIdx) : trimmed;
}

function getAllowedHosts(): Set<string> {
  const allowed = new Set(DEFAULT_ALLOWED_HOSTS);
  const extra = process.env.ROS_UI_ALLOWED_HOSTS || "";
  for (const item of extra.split(",")) {
    const norm = normalizeHost(item);
    if (norm) allowed.add(norm);
  }
  return allowed;
}

export function isAllowedHost(hostHeader: string | null): boolean {
  const norm = normalizeHost(hostHeader);
  if (!norm) return false;
  return getAllowedHosts().has(norm);
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
};

export function proxy(request: NextRequest) {
  const requestId =
    request.headers.get("x-request-id") ||
    request.headers.get("traceparent") ||
    crypto.randomUUID();

  // DNS-rebinding guard (inspired by Alibaba Open Code Review viewer/hostguard.go).
  const hostHeader = request.headers.get("host");
  if (!isAllowedHost(hostHeader)) {
    const denied = NextResponse.json(
      { error: "Forbidden host header", correlation_id: requestId },
      { status: 403 }
    );
    denied.headers.set("x-request-id", requestId);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
      denied.headers.set(k, v);
    }
    return denied;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(k, v);
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/") && pathname !== "/api/health") {
    console.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "INFO",
        service: "resident-ui",
        correlation_id: requestId,
        method: request.method,
        path: pathname,
      })
    );
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
