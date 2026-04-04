import { NextRequest, NextResponse } from "next/server";
import { dynamicVerifyEmailOtp } from "@/lib/dynamic-server";
import { storePdfSession } from "@/lib/pdf-sessions";

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
  const invoiceId  = params.get("invoiceId")  ?? "";
  const debtorEmail = params.get("debtorEmail") ?? "";
  const otpCode    = params.get("otpCode")    ?? "";

  console.log(`[pdf-auth/verify-otp] invoiceId=${invoiceId} email=${debtorEmail} ts=${new Date().toISOString()}`);

  if (!debtorEmail || !otpCode) {
    return fdf({ authToken: "", status: "Error: email or OTP missing." });
  }

  try {
    const dynamicToken = await dynamicVerifyEmailOtp(debtorEmail, otpCode);
    // Store session so /api/approve can validate it
    await storePdfSession(dynamicToken, invoiceId, debtorEmail);
    console.log(`[pdf-auth/verify-otp] authorised — invoiceId=${invoiceId} email=${debtorEmail}`);
    return fdf({
      authToken: dynamicToken,
      status: "Authorised! You can now approve this invoice.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[pdf-auth/verify-otp] failed:`, msg);
    return fdf({ authToken: "", status: "Invalid OTP — please try again." });
  }
}
