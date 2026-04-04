import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoice } from "@/lib/db";
import { mintReceiptNFT, type ReceiptMetadata } from "@/lib/hedera";
import { hashString } from "@/lib/contracts";
import { createPublicClient, http } from "viem";

const hederaClient = createPublicClient({
  transport: http(process.env.HEDERA_RPC_URL || "https://296.rpc.thirdweb.com"),
});

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
  const { invoiceId, funderAddress, txHash } = await request.json();

  if (!invoiceId || !funderAddress || !txHash) {
    return NextResponse.json({ error: "invoiceId, funderAddress, and txHash required" }, { status: 400 });
  }

  // Wait for tx to be mined, then verify
  let receipt;
  try {
    receipt = await hederaClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 60_000,
    });
  } catch (err: any) {
    console.error("Transaction receipt wait failed:", err.message);
    return NextResponse.json({ error: "Transaction not confirmed: " + err.message }, { status: 400 });
  }

  if (receipt.status !== "success") {
    return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });
  }

  // Verify sender and recipient
  let tx;
  try {
    tx = await hederaClient.getTransaction({ hash: txHash as `0x${string}` });
    if (tx.from.toLowerCase() !== funderAddress.toLowerCase()) {
      return NextResponse.json({ error: "Transaction sender does not match funder address" }, { status: 401 });
    }
  } catch (err: any) {
    console.error("Transaction fetch failed:", err.message);
    return NextResponse.json({ error: "Could not verify transaction sender" }, { status: 400 });
  }

  const invoice = await getInvoice(invoiceId);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  if (invoice.status === "funded" || invoice.status === "settled") {
    return NextResponse.json({ error: "Already funded" }, { status: 400 });
  }

  // Verify the HBAR was sent to the invoice supplier
  const supplierAddress = invoice.supplier_address;
  if (supplierAddress && tx.to?.toLowerCase() !== supplierAddress.toLowerCase()) {
    return NextResponse.json({ error: "Payment was not sent to the invoice supplier" }, { status: 400 });
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
      funderHederaId: funderAddress,
      attestationHash,
    };

    const result = await mintReceiptNFT(receiptMetadata);
    receiptSerial = result.serialNumber;
    hederaTxId = result.txId;
  } catch (err: any) {
    console.error("Hedera receipt mint failed:", err.message);
    return NextResponse.json({ error: "Receipt NFT mint failed: " + err.message }, { status: 500 });
  }

  await updateInvoice(invoiceId, {
    status: "funded",
    funder_hedera_id: funderAddress,
    funded_at: new Date().toISOString(),
    purchase_price: purchasePrice,
    hedera_receipt_serial: receiptSerial,
    funding_tx_hash: txHash,
  });

  return NextResponse.json({ success: true, invoiceId, purchasePrice, receiptSerial, hederaTxId, fundingTxHash: txHash });
}
