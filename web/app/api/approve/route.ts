import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { validatePdfSessionByInvoiceId } from "@/lib/pdf-sessions";
import {
  privacyNodeWalletClient,
  privacyNodePublicClient,
  addresses,
  InvoiceTokenABI,
} from "@/lib/contracts";

// ── Helpers from upstream ─────────────────────────────────────────────────────

/** Viem puts revert reasons on shortMessage/details; message alone may omit "Already approved". */
function isAlreadyApprovedRevert(err: unknown): boolean {
  const parts = [
    err instanceof Error ? err.message : "",
    typeof err === "object" && err !== null && "shortMessage" in err
      ? String((err as { shortMessage?: string }).shortMessage)
      : "",
    typeof err === "object" && err !== null && "details" in err
      ? String((err as { details?: string }).details)
      : "",
  ];
  return parts.some((p) => p.includes("Already approved"));
}

async function markInvoiceApprovedInDb(invoiceId: string) {
  await supabase.from("invoices").update({
    status: "approved",
    approved_at: new Date().toISOString(),
  }).eq("id", invoiceId);
}

function readDebtorApproved(raw: unknown): boolean {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    if ("debtorApproved" in raw) {
      return Boolean((raw as { debtorApproved: boolean }).debtorApproved);
    }
  }
  if (Array.isArray(raw) && raw.length > 10) {
    return Boolean(raw[10]);
  }
  return false;
}

// ── FDF response (for Adobe Acrobat PDF form submissions) ─────────────────────

function fdfResponse(fields: Record<string, string>) {
  const fieldEntries = Object.entries(fields)
    .map(([name, value]) => `<</T(${name})/V(${value})>>`)
    .join("\n");
  const fdf = `%FDF-1.2\n1 0 obj\n<</FDF<</Fields[\n${fieldEntries}\n]>>>>\nendobj\ntrailer\n<</Root 1 0 R>>\n%%EOF`;
  return new NextResponse(fdf, {
    headers: { "Content-Type": "application/vnd.fdf" },
  });
}

// ── Core approval logic ───────────────────────────────────────────────────────

async function runApproval(invoiceId: string, request: NextRequest) {
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) return { success: false, error: "Invoice not found" };
  if (invoice.token_id === null) return { success: false, error: "Invoice not yet tokenized" };

  const tokenId = BigInt(invoice.token_id);
  let approveTxHash: string | null = null;

  try {
    const inv = await privacyNodePublicClient.readContract({
      address: addresses.invoiceToken,
      abi: InvoiceTokenABI,
      functionName: "invoices",
      args: [tokenId],
    });

    if (!readDebtorApproved(inv)) {
      const hash = await privacyNodeWalletClient.writeContract({
        address: addresses.invoiceToken,
        abi: InvoiceTokenABI,
        functionName: "approveInvoice",
        args: [tokenId],
      });
      approveTxHash = hash;
      await privacyNodePublicClient.waitForTransactionReceipt({ hash });
    }

    await markInvoiceApprovedInDb(invoiceId);
  } catch (err: unknown) {
    console.error("On-chain approval failed:", err);
    if (isAlreadyApprovedRevert(err)) {
      await markInvoiceApprovedInDb(invoiceId);
    } else {
      return {
        success: false,
        error: "Approval failed: " + (err instanceof Error ? err.message : String(err)),
      };
    }
  }

  let scoringResult = null;
  try {
    await supabase.from("invoices").update({ status: "scoring" }).eq("id", invoiceId);
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
    tokenId: invoice.token_id,
    approveTxHash,
    scoring: scoringResult?.scoring || null,
    message: "Invoice approved and scored on Privacy Node",
  };
}

// ── Route handlers ────────────────────────────────────────────────────────────

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
  const source = isFormEncoded ? "pdf-button" : "api";
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  let invoiceId: string;
  if (isFormEncoded) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    invoiceId = params.get("invoiceId") ?? "";
  } else {
    const body = await request.json();
    invoiceId = body.invoiceId;
  }

  console.log(`[approve] click received — source=${source} invoiceId=${invoiceId || "MISSING"} ip=${ip} ua="${userAgent}" ts=${new Date().toISOString()}`);

  if (!invoiceId) {
    console.warn(`[approve] rejected — missing invoiceId from source=${source}`);
    if (isFormEncoded) return fdfResponse({ status: "Error: missing invoiceId" });
    return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
  }

  if (isFormEncoded) {
    // Validate that the debtor completed OTP verification for this invoice
    if (!await validatePdfSessionByInvoiceId(invoiceId)) {
      console.warn(`[approve] unauthorised PDF attempt — invoiceId=${invoiceId}`);
      return fdfResponse({ status: "Not authorised. Please verify your OTP first." });
    }

    // Respond to Acrobat immediately — blockchain ops can take 30-120s and would time out
    runApproval(invoiceId, request).then((result) => {
      if (result.success) {
        console.log(`[approve] background success — invoiceId=${invoiceId} txHash=${result.approveTxHash ?? "already-approved"}`);
      } else {
        console.error(`[approve] background failed — invoiceId=${invoiceId} error="${result.error}"`);
      }
    }).catch((err) => {
      console.error(`[approve] background exception — invoiceId=${invoiceId}`, err);
    });

    console.log(`[approve] pdf response sent immediately — invoiceId=${invoiceId} approval processing in background`);
    return fdfResponse({ status: `Approval submitted for ${invoiceId}. Check dashboard for status.` });
  }

  const result = await runApproval(invoiceId, request);

  if (result.success) {
    console.log(`[approve] success — invoiceId=${invoiceId} txHash=${result.approveTxHash ?? "already-approved"} source=${source}`);
  } else {
    console.error(`[approve] failed — invoiceId=${invoiceId} error="${result.error}" source=${source}`);
  }

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
