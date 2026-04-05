/**
 * Server-side OTP helpers for PDF invoice approval.
 *
 * Dynamic.xyz handles wallet auth client-side. This module provides a
 * lightweight server-initiated OTP flow for the debtor email verification
 * used in the PDF approval process.
 *
 * Codes are 6-digit, expire after 10 minutes, and are stored in-memory.
 * On send the code is logged to the console for demo/testing.
 */

import crypto from "crypto";

interface OtpEntry {
  code: string;
  expiresAt: number;
}

// In-memory OTP store keyed by email
const otpStore = new Map<string, OtpEntry>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function cleanExpired() {
  const now = Date.now();
  for (const [email, entry] of otpStore) {
    if (entry.expiresAt < now) otpStore.delete(email);
  }
}

/** Generate and store a one-time passcode for the given email. */
export async function dynamicSendEmailOtp(email: string): Promise<void> {
  cleanExpired();
  const code = generateOtp();
  otpStore.set(email, { code, expiresAt: Date.now() + OTP_TTL_MS });

  // Send OTP via Cloudflare email worker
  console.log(`[OTP] Sending code to ${email}`);
  const res = await fetch("https://cloudflare.philosanjay5.workers.dev", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: email,
      subject: "Access Your Invoice — Finvoice",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="460" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Finvoice</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Invoice Verification</p>
        </td></tr>
        <tr><td style="padding:36px 40px 20px;">
          <p style="margin:0 0 8px;color:#374151;font-size:16px;">Hi there,</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">Use the code below to access and approve your invoice. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f8f7ff;border:2px dashed #6366f1;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#4f46e5;">${code}</span>
          </div>
          <p style="margin:0 0 4px;color:#9ca3af;font-size:13px;text-align:center;">Do not share this code with anyone.</p>
        </td></tr>
        <tr><td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #f3f4f6;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">Powered by Finvoice &mdash; Private Invoice Factoring</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`[OTP] Email send failed: ${errText}`);
    throw new Error("Failed to send OTP email.");
  }
  console.log(`[OTP] Email sent to ${email}`);
}

/** Verify an email OTP. Returns a session token on success. */
export async function dynamicVerifyEmailOtp(
  email: string,
  code: string,
): Promise<string> {
  cleanExpired();
  const entry = otpStore.get(email);

  if (!entry) {
    throw new Error("No OTP found for this email — it may have expired.");
  }

  if (entry.code !== code) {
    throw new Error("Invalid OTP code.");
  }

  // OTP is single-use
  otpStore.delete(email);

  // Return a signed session token
  const token = crypto
    .createHmac("sha256", process.env.DYNAMIC_AUTH_TOKEN ?? "finvoice-secret")
    .update(`${email}:${Date.now()}`)
    .digest("hex");

  return token;
}
