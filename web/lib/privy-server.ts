/**
 * Privy server-side API proxy helpers.
 * Uses Basic auth: base64(appId:appSecret)
 */

const PRIVY_BASE = "https://auth.privy.io";
const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const APP_SECRET = process.env.PRIVY_APP_SECRET ?? "";

function privyHeaders() {
  const creds = Buffer.from(`${APP_ID}:${APP_SECRET}`).toString("base64");
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${creds}`,
    "privy-app-id": APP_ID,
  };
}

/** Send a one-time passcode to the given email via Privy. */
export async function privySendEmailOtp(email: string): Promise<void> {
  const res = await fetch(`${PRIVY_BASE}/api/v1/passwordless/init`, {
    method: "POST",
    headers: privyHeaders(),
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Privy OTP init failed (${res.status}): ${body}`);
  }
}

/** Verify a Privy email OTP. Returns the Privy access token on success. */
export async function privyVerifyEmailOtp(
  email: string,
  code: string
): Promise<string> {
  const res = await fetch(`${PRIVY_BASE}/api/v1/passwordless/authenticate`, {
    method: "POST",
    headers: privyHeaders(),
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Privy OTP verify failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  // Privy returns { token, identity_token, refresh_token, user, ... }
  const token: string = data.token ?? data.access_token ?? "";
  if (!token) throw new Error("Privy returned no token");
  return token;
}
