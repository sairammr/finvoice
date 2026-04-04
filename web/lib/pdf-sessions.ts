/**
 * Supabase-backed session store for PDF auth tokens.
 * TTL: 30 minutes — long enough for a debtor to open, auth, and approve.
 *
 * Table (run once in Supabase SQL editor):
 *
 *   create table pdf_sessions (
 *     token      text primary key,
 *     invoice_id text        not null,
 *     email      text        not null,
 *     expires_at timestamptz not null
 *   );
 */

import { supabase } from "@/lib/supabase";

const TTL_MS = 30 * 60 * 1000;

export async function storePdfSession(
  token: string,
  invoiceId: string,
  email: string
) {
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  await supabase.from("pdf_sessions").upsert({
    token,
    invoice_id: invoiceId,
    email,
    expires_at: expiresAt,
  });
}

export async function validatePdfSession(
  token: string,
  invoiceId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("pdf_sessions")
    .select("invoice_id, expires_at")
    .eq("token", token)
    .single();

  if (!data) return false;
  if (data.invoice_id !== invoiceId) return false;
  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("pdf_sessions").delete().eq("token", token);
    return false;
  }
  return true;
}

/** Check whether any valid session exists for this invoiceId (used when no token is forwarded). */
export async function validatePdfSessionByInvoiceId(
  invoiceId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("pdf_sessions")
    .select("token, expires_at")
    .eq("invoice_id", invoiceId)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .single();

  return !!data;
}
