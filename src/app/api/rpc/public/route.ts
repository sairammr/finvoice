import { NextRequest, NextResponse } from "next/server";

const PUBLIC_L1_RPC = process.env.FLARE_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const res = await fetch(PUBLIC_L1_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32603, message: err.message } },
      { status: 502 }
    );
  }
}
