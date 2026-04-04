import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoice } from "@/lib/db";
import { mintReceiptNFT, type ReceiptMetadata } from "@/lib/hedera";
import { hashString } from "@/lib/contracts";

export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get("invoiceId");
  if (!invoiceId) return NextResponse.json({ error: "invoiceId required" }, { status: 400 });

  const invoice = await getInvoice(invoiceId);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const discountBps = invoice.discount_bps || 0;
  const faceValue = Number(invoice.face_value);
  const purchasePrice = faceValue - (faceValue * discountBps) / 10000;

  return NextResponse.json({
    invoiceId: invoice.id,
    funded: invoice.status === "funded" || invoice.status === "settled",
    purchasePrice,
    faceValue,
    funder: invoice.funder_hedera_id,
    riskGrade: invoice.risk_grade,
  });
}

export async function POST(request: NextRequest) {
  const { invoiceId, funderHederaId } = await request.json();

  if (!invoiceId || !funderHederaId) {
    return NextResponse.json({ error: "invoiceId and funderHederaId required" }, { status: 400 });
  }

  const invoice = await getInvoice(invoiceId);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  if (invoice.status === "funded" || invoice.status === "settled") {
    return NextResponse.json({ error: "Already funded" }, { status: 400 });
  }

  const discountBps = invoice.discount_bps || 0;
  const faceValue = Number(invoice.face_value);
  const purchasePrice = faceValue - (faceValue * discountBps) / 10000;
  const attestationHash = hashString(
    `${invoice.id}-${invoice.risk_grade || "B"}-${discountBps}-${invoice.confidence_score || 80}`
  );

  let receiptSerial: number | null = null;
  let hederaTxId: string | null = null;

  try {
    const receiptMetadata: ReceiptMetadata = {
      invoiceId: invoice.id,
      riskGrade: invoice.risk_grade || "B",
      faceValue,
      purchasePrice,
      yieldBps: invoice.yield_bps || 0,
      maturityDate: invoice.due_date,
      funderHederaId,
      attestationHash,
    };

    const result = await mintReceiptNFT(receiptMetadata);
    receiptSerial = result.serialNumber;
    hederaTxId = result.txId;
  } catch (err: any) {
    console.error("Hedera funding failed:", err.message);
    return NextResponse.json({ error: "Funding failed: " + err.message }, { status: 500 });
  }

  await updateInvoice(invoiceId, {
    status: "funded",
    funder_hedera_id: funderHederaId,
    funded_at: new Date().toISOString(),
    purchase_price: purchasePrice,
    hedera_receipt_serial: receiptSerial,
  });

  return NextResponse.json({ success: true, invoiceId, purchasePrice, receiptSerial, hederaTxId });
}
