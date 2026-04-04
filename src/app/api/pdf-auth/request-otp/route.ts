import { NextRequest, NextResponse } from "next/server";
import { dynamicSendEmailOtp } from "@/lib/dynamic-server";

function fdf(fields: Record<string, string>) {
  const entries = Object.entries(fields)
    .map(([k, v]) => `<</T(${k})/V(${v})>>`).join("\n");
  return new NextResponse(
    `%FDF-1.2\n1 0 obj\n<</FDF<</Fields[\n${entries}\n]>>>>\nendobj\ntrailer\n<</Root 1 0 R>>\n%%EOF`,
    { headers: { "Content-Type": "application/vnd.fdf" } }
  );
}

export async function POST(request: NextRequest) {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const invoiceId = params.get("invoiceId") ?? "";
  const debtorEmail = params.get("debtorEmail") ?? "";

  console.log(`[pdf-auth/request-otp] invoiceId=${invoiceId} email=${debtorEmail} ts=${new Date().toISOString()}`);

  if (!debtorEmail) return fdf({ status: "Error: debtor email not found in PDF." });

  try {
    await dynamicSendEmailOtp(debtorEmail);
    console.log(`[pdf-auth/request-otp] OTP sent to ${debtorEmail}`);
    return fdf({ status: `OTP sent to ${debtorEmail} — check your inbox.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[pdf-auth/request-otp] failed:`, msg);
    return fdf({ status: `Failed to send OTP: ${msg}` });
  }
}
