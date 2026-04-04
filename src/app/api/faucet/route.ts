import { NextRequest, NextResponse } from "next/server";

// Flare Coston2 faucet - redirect users to the official faucet
export async function POST(request: NextRequest) {
  const { address } = await request.json();

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  return NextResponse.json({
    message: "Use the Flare Coston2 faucet to get test C2FLR tokens",
    faucetUrl: `https://faucet.flare.network/coston2`,
    address,
  });
}
