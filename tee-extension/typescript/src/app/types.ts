// Private invoice data — stored only in TEE memory, never leaves the enclave
export interface PrivateInvoice {
  invoiceId: string;
  supplierName: string;
  supplierAddress: string;
  debtorName: string;
  debtorEmail: string;
  faceValue: number;
  dueDate: string;
  terms: string;
  jurisdiction: string;
  paymentHistory: string;
  pdfHash: string;
  approved: boolean;
  approvedAt: number | null;
  scored: boolean;
}

// Create invoice request (decrypted from ECIES payload)
export interface CreateInvoiceRequest {
  invoiceId: string;
  supplierName: string;
  supplierAddress: string;
  debtorName: string;
  debtorEmail: string;
  faceValue: number;
  dueDate: string;
  terms: string;
  jurisdiction: string;
  paymentHistory: string;
  pdfHash: string;
}

// Scoring result returned by TEE (public-safe data only)
export interface ScoringResult {
  riskGrade: "A" | "B" | "C" | "D";
  discountBps: number;
  yieldBps: number;
  confidenceScore: number;
  attestationHash: string;
  signature: string;
}

// Decrypt request/response for TEE node API
export interface DecryptRequest {
  encryptedMessage: string; // base64
}

export interface DecryptResponse {
  decryptedMessage: string; // base64
}

// Sign request/response for TEE node API
export interface SignRequest {
  message: string; // base64
}

export interface SignResponse {
  signature: string; // base64
}
