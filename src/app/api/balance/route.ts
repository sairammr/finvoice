import { createPublicClient, http, formatEther } from "viem";
import { NextRequest, NextResponse } from "next/server";

const client = createPublicClient({
  transport: http(process.env.HEDERA_RPC_URL || "https://296.rpc.thirdweb.com"),
});

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const balance = await client.getBalance({
      address: address as `0x${string}`,
    });

    return NextResponse.json({
      balance: balance.toString(),
      formatted: formatEther(balance),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 });
  }
}
