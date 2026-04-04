export interface Invoice {
  id: string;
  supplier: string;
  supplierAddress: string;
  debtor: string;
  debtorEmail: string;
  amount: number;
  currency: string;
  terms: string;
  dueDate: string;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
  status:
    | "draft"
    | "pending_approval"
    | "approved"
    | "scoring"
    | "listed"
    | "funded"
    | "settled";
  createdAt: string;
  approvedAt?: string;
  pdfHash?: string;
  tokenId?: string;
}

export interface MarketplaceListing {
  id: string;
  invoiceId: string;
  supplierName?: string | null;
  debtorName?: string | null;
  tokenId?: number | null;
  riskGrade: "A" | "B" | "C" | "D";
  yieldBps: number;
  discountBps: number;
  faceValue: number;
  purchasePrice: number;
  maturityDate: string;
  tenure: number;
  confidenceScore: number;
  attestationHash: string;
  txHash?: string | null;
  funded: boolean;
  funder?: string;
  fundedAt?: string;
}

export interface AiScoring {
  invoiceId: string;
  riskGrade: "A" | "B" | "C" | "D";
  discountBps: number;
  yieldBps: number;
  confidenceScore: number;
  reasoning: string;
  factors: {
    paymentHistory: string;
    jurisdictionRisk: string;
    invoiceValidity: string;
    complianceCheck: string;
  };
  attestation?: {
    attestor: string;
    attestedAt: string;
    verified: boolean;
  } | null;
}


export function getRiskGradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return "text-lime-600 bg-lime-50 border-lime-200";
    case "B":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "C":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "D":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
