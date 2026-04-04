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
      subject: `Finvoice — Your verification code is ${code}`,
      body: `Your Finvoice invoice approval code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n— Finvoice`,
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
