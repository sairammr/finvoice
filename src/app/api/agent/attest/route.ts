import { NextRequest, NextResponse } from "next/server";
import { scoreInvoice } from "@/lib/scoring";
import { getInvoice, getInvoices, updateInvoice } from "@/lib/db";
import {
  flareWalletClient,
  flarePublicClient,
  addresses,
  hashString,
  InvoiceInstructionSenderABI,
} from "@/lib/contracts";
import { toHex } from "viem";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { invoiceId, scan } = body;

  if (scan) return handleScan();
  if (invoiceId) return handleInvoiceAttestation(invoiceId);
  return NextResponse.json({ error: "Provide invoiceId or scan:true" }, { status: 400 });
}

async function handleScan() {
  const invoices = await getInvoices({
    status: { $in: ["approved", "scoring"] },
    hedera_attestation_serial: { $eq: null },
  });

  if (!invoices.length) {
    return NextResponse.json({ message: "No unattested invoices found", results: [] });
  }

  const results = [];
  for (const invoice of invoices) {
    try {
      results.push(await attestInvoice(invoice));
    } catch (err: any) {
      results.push({ invoiceId: invoice.id, status: "failed", error: err.message });
    }
  }

  return NextResponse.json({
    message: `Scanned ${invoices.length} invoices`,
    attested: results.filter((r) => r.status === "success").length,
    results,
  });
}

async function handleInvoiceAttestation(invoiceId: string) {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  try {
    return NextResponse.json(await attestInvoice(invoice));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

interface ScoringData {
  riskGrade: "A" | "B" | "C" | "D";
  discountBps: number;
  yieldBps: number;
  confidenceScore: number;
  reasoning: string;
  source: "tee" | "server-fallback";
  teeSignature?: string;
}

async function attestInvoice(invoice: any) {
  let scoring: ScoringData;
  let flareTxHash: string | null = null;

  // PATH 1: Try Flare TEE scoring
  try {
    const invoiceIdBytes = toHex(
      new TextEncoder().encode(JSON.stringify({ invoiceId: invoice.id }))
    );
    const hash = await flareWalletClient.writeContract({
      address: addresses.instructionSender,
      abi: InvoiceInstructionSenderABI,
      functionName: "scoreInvoice",
      args: [invoiceIdBytes],
      value: BigInt(1000000000000),
    });
    flareTxHash = hash;
    await flarePublicClient.waitForTransactionReceipt({ hash });

    const teeResult = await pollTeeResult(hash);
    if (teeResult) {
      scoring = {
        riskGrade: teeResult.riskGrade,
        discountBps: teeResult.discountBps,
        yieldBps: teeResult.yieldBps,
        confidenceScore: teeResult.confidenceScore,
        reasoning: "[TEE-scored] Private scoring inside Flare Confidential Compute",
        source: "tee",
        teeSignature: teeResult.signature,
      };
    } else {
      throw new Error("TEE result polling timed out");
    }
  } catch (err: any) {
    // PATH 2: Fallback to server-side scoring
    console.warn("TEE scoring unavailable, using server fallback:", err.message);
    const serverScoring = await scoreInvoice({
      invoiceId: invoice.id,
      debtorName: invoice.debtor_name,
      faceValue: invoice.face_value,
      dueDate: invoice.due_date,
      terms: invoice.terms,
      jurisdiction: invoice.jurisdiction,
      paymentHistory: invoice.payment_history,
      supplierName: invoice.supplier_name,
    });
    scoring = { ...serverScoring, source: "server-fallback" };
  }

  const attestationHash = hashString(
    `${invoice.id}-${scoring.riskGrade}-${scoring.discountBps}-${scoring.confidenceScore}`
  );
  const pdfHash = hashString(
    `${invoice.id}-${invoice.debtor_name}-${invoice.face_value}`
  );

  // Mint Attestation NFT on Hedera (SDK only)
  let hederaTxId: string | null = null;
  let attestationSerial: number | null = null;

  try {
    const compactMeta = `${invoice.id}|${scoring.riskGrade}|${scoring.discountBps}|${scoring.yieldBps}|${scoring.confidenceScore}|${attestationHash.slice(0, 20)}`;
    const { TokenMintTransaction } = await import("@hashgraph/sdk");
    const { client: hederaClient, operatorKey, attestationTokenId } = await import("@/lib/hedera");

    const mintTx = await new TokenMintTransaction()
      .setTokenId(attestationTokenId)
      .addMetadata(Buffer.from(compactMeta.slice(0, 100)))
      .freezeWith(hederaClient);
    const signTx = await mintTx.sign(operatorKey);
    const txResponse = await signTx.execute(hederaClient);
    const receipt = await txResponse.getReceipt(hederaClient);

    attestationSerial = receipt.serials[0].toNumber();
    hederaTxId = txResponse.transactionId.toString();
  } catch (err: any) {
    console.error("Hedera attestation NFT mint failed:", err.message);
  }

  await updateInvoice(invoice.id, {
    status: "listed",
    risk_grade: scoring.riskGrade,
    discount_bps: scoring.discountBps,
    yield_bps: scoring.yieldBps,
    confidence_score: scoring.confidenceScore,
    hedera_attestation_serial: attestationSerial,
    flare_tx_hash: flareTxHash || invoice.flare_tx_hash,
  });

  return {
    status: "success",
    invoiceId: invoice.id,
    scoring: {
      riskGrade: scoring.riskGrade,
      discountBps: scoring.discountBps,
      yieldBps: scoring.yieldBps,
      confidenceScore: scoring.confidenceScore,
      reasoning: scoring.reasoning,
      source: scoring.source,
      teeSignature: scoring.teeSignature || null,
    },
    flareTxHash,
    hederaTxId,
    attestationSerial,
  };
}

interface TeeScoreResult {
  riskGrade: "A" | "B" | "C" | "D";
  discountBps: number;
  yieldBps: number;
  confidenceScore: number;
  attestationHash: string;
  signature: string;
}

async function pollTeeResult(instructionTxHash: string): Promise<TeeScoreResult | null> {
  const TEE_PROXY_URL = process.env.TEE_PROXY_URL || "http://localhost:6676";
  for (let i = 0; i < 30; i++) {
    try {
      const resp = await fetch(`${TEE_PROXY_URL}/result/${instructionTxHash}`);
      if (resp.ok) {
        const result = await resp.json();
        if (result.status === 1 && result.data) {
          const dataHex = result.data.replace(/^0x/, "");
          return JSON.parse(Buffer.from(dataHex, "hex").toString());
        }
        if (result.status === 0) return null;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}
