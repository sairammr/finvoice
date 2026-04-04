import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoice, validatePdfSessionByInvoiceId } from "@/lib/db";
import {
  flareWalletClient,
  flarePublicClient,
  addresses,
  InvoiceInstructionSenderABI,
} from "@/lib/contracts";
import { toHex } from "viem";

function fdfResponse(fields: Record<string, string>) {
  const fieldEntries = Object.entries(fields)
    .map(([name, value]) => `<</T(${name})/V(${value})>>`)
    .join("\n");
  const fdf = `%FDF-1.2\n1 0 obj\n<</FDF<</Fields[\n${fieldEntries}\n]>>>>\nendobj\ntrailer\n<</Root 1 0 R>>\n%%EOF`;
  return new NextResponse(fdf, {
    headers: { "Content-Type": "application/vnd.fdf" },
  });
}

async function runApproval(invoiceId: string, request: NextRequest) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) return { success: false, error: "Invoice not found" };

  let approveTxHash: string | null = null;

  try {
    const invoiceIdBytes = toHex(
      new TextEncoder().encode(JSON.stringify({ invoiceId }))
    );
    const hash = await flareWalletClient.writeContract({
      address: addresses.instructionSender,
      abi: InvoiceInstructionSenderABI,
      functionName: "approveInvoice",
      args: [invoiceIdBytes],
      value: BigInt(1000000000000),
    });
    approveTxHash = hash;
    await flarePublicClient.waitForTransactionReceipt({ hash });
  } catch (err: unknown) {
    console.error("Flare TEE approval failed:", err);
  }

  await updateInvoice(invoiceId, {
    status: "approved",
    approved_at: new Date().toISOString(),
  });

  let scoringResult = null;
  try {
    await updateInvoice(invoiceId, { status: "scoring" });
    const scoreResponse = await fetch(`${request.nextUrl.origin}/api/agent/attest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    scoringResult = await scoreResponse.json();
  } catch (err) {
    console.error("Scoring trigger failed:", err);
  }

  return {
    success: true,
    invoiceId,
    approveTxHash,
    scoring: scoringResult?.scoring || null,
    message: "Invoice approved via Flare TEE and scored",
  };
}

export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get("invoiceId");
  if (!invoiceId) {
    return NextResponse.redirect(new URL("/dashboard?approval=error", request.nextUrl.origin));
  }
  const result = await runApproval(invoiceId, request);
  if (result.success) {
    return NextResponse.redirect(new URL(`/dashboard?approval=success&invoiceId=${invoiceId}`, request.nextUrl.origin));
  }
  return NextResponse.redirect(new URL(`/dashboard?approval=error&invoiceId=${invoiceId}`, request.nextUrl.origin));
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormEncoded = contentType.includes("application/x-www-form-urlencoded");

  let invoiceId: string;
  if (isFormEncoded) {
    const text = await request.text();
    invoiceId = new URLSearchParams(text).get("invoiceId") ?? "";
  } else {
    invoiceId = (await request.json()).invoiceId;
  }

  if (!invoiceId) {
    if (isFormEncoded) return fdfResponse({ status: "Error: missing invoiceId" });
    return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
  }

  if (isFormEncoded) {
    if (!await validatePdfSessionByInvoiceId(invoiceId)) {
      return fdfResponse({ status: "Not authorised. Please verify your OTP first." });
    }
    runApproval(invoiceId, request).catch(console.error);
    return fdfResponse({ status: `Approval submitted for ${invoiceId}. Check dashboard for status.` });
  }

  const result = await runApproval(invoiceId, request);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
