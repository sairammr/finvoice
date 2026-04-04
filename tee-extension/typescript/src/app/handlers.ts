import { Framework } from "../base/types.js";
import {
  OpTypeInvoice,
  OpCommandCreate,
  OpCommandApprove,
  OpCommandScore,
} from "./config.js";
import type {
  PrivateInvoice,
  CreateInvoiceRequest,
  ScoringResult,
  DecryptRequest,
  DecryptResponse,
  SignRequest,
  SignResponse,
} from "./types.js";

// ── Private state (lives only in TEE memory) ──

const invoices = new Map<string, PrivateInvoice>();

// ── TEE node ports ──

let SIGN_PORT = process.env.SIGN_PORT || "8882";

export function setSignPort(port: string): void {
  SIGN_PORT = port;
}

// ── Register handlers with the framework ──

export function register(f: Framework): void {
  f.registerHandler(OpTypeInvoice, OpCommandCreate, handleCreateInvoice);
  f.registerHandler(OpTypeInvoice, OpCommandApprove, handleApproveInvoice);
  f.registerHandler(OpTypeInvoice, OpCommandScore, handleScoreInvoice);
}

// ── State reporting (GET /state) ──

export function reportState(): { version: string; data: string } {
  const state = {
    invoiceCount: invoices.size,
    invoiceIds: Array.from(invoices.keys()),
    approvedCount: Array.from(invoices.values()).filter(i => i.approved).length,
    scoredCount: Array.from(invoices.values()).filter(i => i.scored).length,
  };
  return {
    version: "0.1.0",
    data: "0x" + Buffer.from(JSON.stringify(state)).toString("hex"),
  };
}

// ── Reset state (for testing) ──

export function resetState(): void {
  invoices.clear();
}

// ── Handler: CREATE ──
// Receives ECIES-encrypted invoice data, decrypts via TEE node, stores privately

async function handleCreateInvoice(
  msg: string
): Promise<[string | null, number, string | null]> {
  try {
    // msg is hex-encoded ECIES ciphertext
    const ciphertextBytes = Buffer.from(msg.replace(/^0x/, ""), "hex");
    const plaintext = await decryptViaNode(ciphertextBytes);
    const data: CreateInvoiceRequest = JSON.parse(plaintext.toString());

    const invoice: PrivateInvoice = {
      invoiceId: data.invoiceId,
      supplierName: data.supplierName,
      supplierAddress: data.supplierAddress,
      debtorName: data.debtorName,
      debtorEmail: data.debtorEmail,
      faceValue: data.faceValue,
      dueDate: data.dueDate,
      terms: data.terms,
      jurisdiction: data.jurisdiction,
      paymentHistory: data.paymentHistory,
      pdfHash: data.pdfHash,
      approved: false,
      approvedAt: null,
      scored: false,
    };

    invoices.set(data.invoiceId, invoice);

    const resultHex =
      "0x" + Buffer.from(JSON.stringify({ invoiceId: data.invoiceId })).toString("hex");
    return [resultHex, 1, null];
  } catch (err: any) {
    return [null, 0, `Create failed: ${err.message}`];
  }
}

// ── Handler: APPROVE ──
// Marks an invoice as approved by the debtor

async function handleApproveInvoice(
  msg: string
): Promise<[string | null, number, string | null]> {
  try {
    const msgBytes = Buffer.from(msg.replace(/^0x/, ""), "hex");
    const { invoiceId } = JSON.parse(msgBytes.toString());

    const invoice = invoices.get(invoiceId);
    if (!invoice) {
      return [null, 0, `Invoice ${invoiceId} not found in TEE`];
    }

    if (invoice.approved) {
      return [null, 0, `Invoice ${invoiceId} already approved`];
    }

    invoice.approved = true;
    invoice.approvedAt = Math.floor(Date.now() / 1000);

    const resultHex =
      "0x" + Buffer.from(JSON.stringify({ invoiceId, approved: true })).toString("hex");
    return [resultHex, 1, null];
  } catch (err: any) {
    return [null, 0, `Approve failed: ${err.message}`];
  }
}

// ── Handler: SCORE ──
// Runs AI credit scoring privately inside TEE, returns public attestation

async function handleScoreInvoice(
  msg: string
): Promise<[string | null, number, string | null]> {
  try {
    const msgBytes = Buffer.from(msg.replace(/^0x/, ""), "hex");
    const { invoiceId } = JSON.parse(msgBytes.toString());

    const invoice = invoices.get(invoiceId);
    if (!invoice) {
      return [null, 0, `Invoice ${invoiceId} not found in TEE`];
    }

    if (!invoice.approved) {
      return [null, 0, `Invoice ${invoiceId} not yet approved`];
    }

    // Run AI scoring with private data (all private data stays in TEE)
    const scoring = await runAIScoring(invoice);

    // Compute attestation hash
    const hashInput = `${invoiceId}-${scoring.riskGrade}-${scoring.discountBps}-${scoring.confidenceScore}`;
    const { createHash } = await import("crypto");
    const attestationHash =
      "0x" + createHash("sha256").update(hashInput).digest("hex");

    // Sign the attestation hash with TEE's private key for verification
    const signature = await signViaNode(Buffer.from(attestationHash));

    invoice.scored = true;

    const result: ScoringResult = {
      riskGrade: scoring.riskGrade,
      discountBps: scoring.discountBps,
      yieldBps: scoring.yieldBps,
      confidenceScore: scoring.confidenceScore,
      attestationHash,
      signature,
    };

    const resultHex = "0x" + Buffer.from(JSON.stringify(result)).toString("hex");
    return [resultHex, 1, null];
  } catch (err: any) {
    return [null, 0, `Score failed: ${err.message}`];
  }
}

// ── AI Scoring (runs privately inside TEE) ──

interface InternalScoringResult {
  riskGrade: "A" | "B" | "C" | "D";
  discountBps: number;
  yieldBps: number;
  confidenceScore: number;
}

async function runAIScoring(invoice: PrivateInvoice): Promise<InternalScoringResult> {
  const dueDate = new Date(invoice.dueDate);
  const tenureDays = Math.max(
    1,
    Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  // Deterministic fallback scoring (for hackathon reliability)
  // In production, this would call Claude/GPT inside the TEE
  const history = invoice.paymentHistory.toLowerCase();

  let riskGrade: "A" | "B" | "C" | "D" = "B";
  let baseDiscount = 300;
  let confidence = 80;

  if (history.includes("excellent")) {
    riskGrade = "A";
    baseDiscount = 150;
    confidence = 92;
  } else if (history.includes("good")) {
    riskGrade = "B";
    baseDiscount = 300;
    confidence = 85;
  } else if (history.includes("mixed")) {
    riskGrade = "C";
    baseDiscount = 550;
    confidence = 72;
  } else if (history.includes("poor")) {
    riskGrade = "D";
    baseDiscount = 900;
    confidence = 65;
  }

  // Jurisdiction risk adjustment
  const highRiskJurisdictions = ["nigeria", "venezuela", "iran"];
  const jurisdiction = invoice.jurisdiction.toLowerCase();
  if (highRiskJurisdictions.some((j) => jurisdiction.includes(j))) {
    baseDiscount += 200;
    confidence -= 10;
  }

  // Maturity adjustment: +50bps per 30 days beyond 30
  const maturityAdj = Math.max(0, Math.floor((tenureDays - 30) / 30)) * 50;
  const discountBps = baseDiscount + maturityAdj;

  // Annualized yield
  const discountFrac = discountBps / 10000;
  const yieldBps = Math.round(
    (discountFrac / (1 - discountFrac)) * (365 / tenureDays) * 10000
  );

  return { riskGrade, discountBps, yieldBps, confidenceScore: confidence };
}

// ── TEE Node API helpers ──

async function decryptViaNode(ciphertext: Buffer): Promise<Buffer> {
  const req: DecryptRequest = {
    encryptedMessage: ciphertext.toString("base64"),
  };

  const resp = await fetch(`http://localhost:${SIGN_PORT}/decrypt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const data: DecryptResponse = await resp.json();
  return Buffer.from(data.decryptedMessage, "base64");
}

async function signViaNode(message: Buffer): Promise<string> {
  const req: SignRequest = {
    message: message.toString("base64"),
  };

  const resp = await fetch(`http://localhost:${SIGN_PORT}/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const data: SignResponse = await resp.json();
  return data.signature;
}
