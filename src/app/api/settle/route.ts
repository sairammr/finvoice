import { NextRequest, NextResponse } from "next/server";
import { getInvoice, updateInvoice } from "@/lib/db";
import { burnReceiptNFT } from "@/lib/hedera";
import { createPublicClient, http } from "viem";

const hederaClient = createPublicClient({
  transport: http(process.env.NEXT_PUBLIC_HEDERA_RPC_URL  ?? "https://296.rpc.thirdweb.com"),
});

const PLATFORM_FEE_BPS = 50;

export async function POST(request: NextRequest) {
  const { invoiceId, txHash, settlerAddress } = await request.json();
  if (!invoiceId || !txHash || !settlerAddress) {
    return NextResponse.json({ error: "invoiceId, txHash, and settlerAddress required" }, { status: 400 });
  }

  const invoice = await getInvoice(invoiceId);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "settled") return NextResponse.json({ error: "Already settled" }, { status: 400 });
  if (invoice.status !== "funded") return NextResponse.json({ error: "Invoice not yet funded" }, { status: 400 });

  const faceValue = Number(invoice.face_value);
  const platformFee = (faceValue * PLATFORM_FEE_BPS) / 10000;
  const funderPayout = faceValue - platformFee;

  // Verify on-chain transaction
  let receipt;
  try {
    receipt = await hederaClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 60_000,
    });
  } catch (err: any) {
    console.error("Settlement tx verification failed:", err.message);
    return NextResponse.json({ error: "Transaction not confirmed: " + err.message }, { status: 400 });
  }

  if (receipt.status !== "success") {
    return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });
  }

  // Verify sender and that payment goes to funder
  try {
    const tx = await hederaClient.getTransaction({ hash: txHash as `0x${string}` });

    if (tx.from.toLowerCase() !== settlerAddress.toLowerCase()) {
      return NextResponse.json({ error: "Transaction sender does not match settler" }, { status: 401 });
    }

    const funderAddress = invoice.funder_hedera_id;
    if (funderAddress && tx.to?.toLowerCase() !== funderAddress.toLowerCase()) {
      return NextResponse.json({ error: "Payment was not sent to the funder" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Transaction fetch failed:", err.message);
    return NextResponse.json({ error: "Could not verify transaction" }, { status: 400 });
  }

  // Burn receipt NFT
  let burnTxId: string | null = null;
  try {
    if (invoice.hedera_receipt_serial) {
      burnTxId = await burnReceiptNFT(invoice.hedera_receipt_serial);
    }
  } catch (err: any) {
    console.error("Receipt burn failed:", err.message);
    // Non-fatal — still mark as settled since payment was verified
  }

  await updateInvoice(invoiceId, {
    status: "settled",
    settled_at: new Date().toISOString(),
    settlement_tx_hash: txHash,
  });

  return NextResponse.json({ success: true, invoiceId, funderPayout, platformFee, burnTxId, settlementTxHash: txHash });
}
