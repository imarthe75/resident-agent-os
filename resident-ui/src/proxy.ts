import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const requestId =
    request.headers.get("x-request-id") ||
    request.headers.get("traceparent") ||
    crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);

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
  matcher: ["/api/:path*"],
};
