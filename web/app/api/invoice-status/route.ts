import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function fdfResponse(fields: Record<string, string>) {
  const fieldEntries = Object.entries(fields)
    .map(([name, value]) => `<</T(${name})/V(${value})>>`)
    .join("\n");
  const fdf = `%FDF-1.2\n1 0 obj\n<</FDF<</Fields[\n${fieldEntries}\n]>>>>\nendobj\ntrailer\n<</Root 1 0 R>>\n%%EOF`;
  return new NextResponse(fdf, {
    headers: { "Content-Type": "application/vnd.fdf" },
  });
}

const STATUS_LABELS: Record<string, string> = {
  pending:   "Pending — awaiting debtor approval.",
  approved:  "Approved — invoice is live.",
  scoring:   "Scoring — AI credit analysis in progress.",
  scored:    "Scored — ready for marketplace listing.",
  listed:    "Listed — available on the marketplace.",
  funded:    "Funded — invoice has been purchased.",
  settled:   "Settled — payment complete.",
};

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  const isFormEncoded = contentType.includes("application/x-www-form-urlencoded");

  let invoiceId: string;
  if (isFormEncoded) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    invoiceId = params.get("invoiceId") ?? "";
  } else {
    const body = await request.json();
    invoiceId = body.invoiceId;
  }

  console.log(`[invoice-status] check — invoiceId=${invoiceId || "MISSING"} ts=${new Date().toISOString()}`);

  if (!invoiceId) {
    if (isFormEncoded) return fdfResponse({ status: "Error: missing invoiceId." });
    return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, status, approved_at")
      .eq("id", invoiceId)
      .single();

    if (error || !data) {
      if (isFormEncoded) return fdfResponse({ status: `Invoice ${invoiceId} not found.` });
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const label = STATUS_LABELS[data.status] ?? `Status: ${data.status}`;
    const detail = data.approved_at
      ? ` (approved ${new Date(data.approved_at).toLocaleString()})`
      : "";

    if (isFormEncoded) return fdfResponse({ status: label + detail });
    return NextResponse.json({ invoiceId, status: data.status, label });
  } catch {
    if (isFormEncoded) return fdfResponse({ status: "Unable to reach server. Try again." });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
