/**
 * Data layer — backed by Hedera Consensus Service (HCS).
 * Re-exports from hcs-store.ts so no API route imports need to change.
 */
export {
  insertInvoice,
  getInvoice,
  getInvoices,
  updateInvoice,
  storePdfSession,
  validatePdfSession,
  validatePdfSessionByInvoiceId,
} from "./hcs-store";
