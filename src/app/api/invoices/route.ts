import { NextRequest, NextResponse } from "next/server";
import { insertInvoice, getInvoices } from "@/lib/db";
import {
  flareWalletClient,
  flarePublicClient,
  addresses,
  hashString,
  InvoiceInstructionSenderABI,
} from "@/lib/contracts";
import { toHex } from "viem";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  const filter: Record<string, any> = {};
  if (address) {
    filter.supplier_address = { $regex: new RegExp(address, "i") };
  }

  const invoices = await getInvoices(filter);
  return NextResponse.json({ invoices });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    supplierName, supplierAddress, debtorName, debtorEmail,
    amount, terms, dueDate, lineItems, jurisdiction, paymentHistory,
  } = body;

  const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
  const pdfHash = hashString(`${invoiceId}-${debtorName}-${amount}`);

  const privateData = JSON.stringify({
    invoiceId, supplierName, supplierAddress, debtorName, debtorEmail,
    faceValue: amount, dueDate, terms,
    jurisdiction: jurisdiction || "Brazil",
    paymentHistory: paymentHistory || "Good payment history, no defaults",
    pdfHash,
  });

  let flareTxHash: string | null = null;

  try {
    const dataBytes = toHex(new TextEncoder().encode(privateData));
    const hash = await flareWalletClient.writeContract({
      address: addresses.instructionSender,
      abi: InvoiceInstructionSenderABI,
      functionName: "createInvoice",
      args: [dataBytes],
      value: BigInt(1000000000000),
    });
    flareTxHash = hash;
    await flarePublicClient.waitForTransactionReceipt({ hash });
  } catch (err) {
    console.error("Flare TEE instruction failed:", err);
  }

  const invoice = await insertInvoice({
    id: invoiceId,
    token_id: null,
    supplier_name: supplierName,
    supplier_address: supplierAddress,
    debtor_name: debtorName,
    debtor_email: debtorEmail,
    face_value: amount,
    currency: "USDC",
    terms,
    due_date: dueDate,
    line_items: lineItems,
    jurisdiction: jurisdiction || "Brazil",
    payment_history: paymentHistory || "Good payment history, no defaults",
    status: flareTxHash ? "pending_approval" : "draft",
    pdf_hash: pdfHash,
    tx_hash: null,
    flare_tx_hash: flareTxHash,
  });

  return NextResponse.json({ success: true, invoice, flareTxHash });
}
