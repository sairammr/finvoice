import { NextRequest } from "next/server";

/**
 * /api/score — Legacy endpoint, forwards to /api/agent/attest
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const url = new URL("/api/agent/attest", request.nextUrl.origin);

  return fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
