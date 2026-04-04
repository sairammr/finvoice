import { NextResponse } from "next/server";

const FAUCET_BASE = "https://devnet-dapp.flare.com/api";
const DOMAIN = "devnet-dapp.flare.com";
const CHAIN_ID = 7295799;

function buildSiweMessage(address: string, nonce: string): string {
  const now = new Date().toISOString();
  return [
    `${DOMAIN} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "",
    `URI: https://${DOMAIN}`,
    `Version: 1`,
    `Chain ID: ${CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${now}`,
  ].join("\n");
}

export async function POST(req: Request) {
  const body = await req.json();
  const { step } = body;

  // ── Step 1: Get nonce from faucet, build SIWE message ──
  if (step === "prepare") {
    const { address } = body;
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const nonceRes = await fetch(`${FAUCET_BASE}/auth/nonce`, {
      headers: { "user-agent": "Mozilla/5.0" },
    });

    const cookieHeader = nonceRes.headers.get("set-cookie") || "";
    const sid = cookieHeader.match(/connect\.sid=([^;]+)/)?.[1];
    if (!sid) {
      return NextResponse.json(
        { error: "Failed to get faucet session" },
        { status: 502 },
      );
    }

    const nonce = await nonceRes.text();
    const message = buildSiweMessage(address, nonce);

    return NextResponse.json({ message, session: sid });
  }

  // ── Step 2: Verify signature + claim faucet ──
  if (step === "claim") {
    const { message, signature, session } = body;
    if (!message || !signature || !session) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const cookie = `connect.sid=${session}`;

    // Verify SIWE signature with faucet backend
    const verifyRes = await fetch(`${FAUCET_BASE}/auth/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        "user-agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ message, signature }),
    });

    if (!verifyRes.ok) {
      const err: Record<string, string> = await verifyRes
        .json()
        .catch(() => ({}));
      return NextResponse.json(
        { error: err.message || "Faucet verification failed" },
        { status: 400 },
      );
    }

    // Use the cookie from the verify response if it sent a fresh one
    const verifyCookieHeader = verifyRes.headers.get("set-cookie") || "";
    const newSid = verifyCookieHeader.match(/connect\.sid=([^;]+)/)?.[1];
    const finalCookie = newSid ? `connect.sid=${newSid}` : cookie;

    // Request faucet funds
    const faucetRes = await fetch(`${FAUCET_BASE}/faucet/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: finalCookie,
        "user-agent": "Mozilla/5.0",
      },
    });

    if (!faucetRes.ok) {
      // Handle non-JSON responses (e.g. Cloudflare 504 HTML pages)
      const contentType = faucetRes.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const err: Record<string, string> = await faucetRes
          .json()
          .catch(() => ({}));
        return NextResponse.json(
          { error: err.message || "Faucet request failed" },
          { status: faucetRes.status },
        );
      }
      const statusMessages: Record<number, string> = {
        429: "Faucet rate limited — try again later",
        500: "Faucet server error — try again later",
        502: "Faucet is temporarily unavailable",
        503: "Faucet is temporarily unavailable",
        504: "Faucet timed out — the Flare faucet server may be down",
      };
      return NextResponse.json(
        { error: statusMessages[faucetRes.status] || `Faucet returned ${faucetRes.status}` },
        { status: faucetRes.status },
      );
    }

    const data = await faucetRes.json();
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({ error: "Invalid step" }, { status: 400 });
}
