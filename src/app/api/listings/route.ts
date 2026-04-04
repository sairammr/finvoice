import { NextResponse } from "next/server";
import { getInvoices } from "@/lib/db";
import { hashString } from "@/lib/contracts";

export async function GET() {
  const invoices = await getInvoices({
    status: { $in: ["listed", "funded", "settled"] },
  });

  const listings = invoices.map((inv: any, index: number) => {
    const discountBps = inv.discount_bps || 0;
    const yieldBps = inv.yield_bps || 0;
    const faceValue = Number(inv.face_value);
    const purchasePrice = faceValue - (faceValue * discountBps) / 10000;

    const maturityDate = new Date(inv.due_date || Date.now() + 30 * 86400000);
    const tenure = isNaN(maturityDate.getTime())
      ? 30
      : Math.max(1, Math.ceil((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    const attestationHash = hashString(
      `${inv.id}-${inv.risk_grade || "B"}-${discountBps}-${inv.confidence_score || 80}`
    );

    return {
      id: `LST-${String(index + 1).padStart(3, "0")}`,
      invoiceId: inv.id,
      tokenId: inv.hedera_attestation_serial,
      riskGrade: (inv.risk_grade || "B") as "A" | "B" | "C" | "D",
      discountBps,
      yieldBps,
      faceValue,
      purchasePrice,
      purchasePriceRaw: String(Math.round(purchasePrice * 1e6)),
      faceValueRaw: String(Math.round(faceValue * 1e6)),
      maturityDate: isNaN(maturityDate.getTime()) ? new Date(Date.now() + 30 * 86400000).toISOString() : maturityDate.toISOString(),
      tenure,
      confidenceScore: inv.confidence_score || 80,
      attestationHash,
      supplierAddress: inv.supplier_address || null,
      txHash: inv.flare_tx_hash || null,
      pdfHash: inv.pdf_hash,
      listedAt: inv.created_at,
      status: inv.status,
      funded: inv.status === "funded" || inv.status === "settled",
      settled: inv.status === "settled",
      funder: inv.funder_hedera_id || null,
      attestation: inv.hedera_attestation_serial
        ? { hederaSerial: inv.hedera_attestation_serial, network: process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet", verified: true }
        : null,
    };
  });

  return NextResponse.json({ listings });
}
