import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoice } from "@/lib/db";
import { burnReceiptNFT, transferHbar, treasuryId } from "@/lib/hedera";
import { AccountId } from "@hashgraph/sdk";

const PLATFORM_FEE_BPS = 50;

export async function POST(request: NextRequest) {
  const { invoiceId } = await request.json();
  if (!invoiceId) return NextResponse.json({ error: "invoiceId required" }, { status: 400 });

  const invoice = await getInvoice(invoiceId);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "settled") return NextResponse.json({ error: "Already settled" }, { status: 400 });
  if (invoice.status !== "funded") return NextResponse.json({ error: "Invoice not yet funded" }, { status: 400 });

  const faceValue = Number(invoice.face_value);
  const platformFee = (faceValue * PLATFORM_FEE_BPS) / 10000;
  const funderPayout = faceValue - platformFee;

  let burnTxId: string | null = null;
  let transferTxId: string | null = null;

  try {
    if (invoice.funder_hedera_id) {
      transferTxId = await transferHbar(treasuryId, AccountId.fromString(invoice.funder_hedera_id), funderPayout);
    }
    if (invoice.hedera_receipt_serial) {
      burnTxId = await burnReceiptNFT(invoice.hedera_receipt_serial);
    }
  } catch (err: any) {
    console.error("Settlement failed:", err.message);
    return NextResponse.json({ error: "Settlement failed: " + err.message }, { status: 500 });
  }

  await updateInvoice(invoiceId, { status: "settled" });

  return NextResponse.json({ success: true, invoiceId, funderPayout, platformFee, burnTxId, transferTxId });
}
