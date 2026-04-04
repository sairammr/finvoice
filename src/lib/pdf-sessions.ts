/**
 * PDF session management — re-exports from db.ts (MongoDB-backed).
 * TTL: 30 minutes via MongoDB TTL index on expires_at field.
 */
export {
  storePdfSession,
  validatePdfSession,
  validatePdfSessionByInvoiceId,
} from "@/lib/db";
