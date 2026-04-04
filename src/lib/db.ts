import { MongoClient, type Db, type Collection } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "hedsup";

let client: MongoClient;
let db: Db;

async function getDb(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

  // Create indexes on first connection
  const invoices = db.collection("invoices");
  await invoices.createIndex({ status: 1 });
  await invoices.createIndex({ created_at: -1 });
  await invoices.createIndex({ supplier_address: 1 });

  const sessions = db.collection("pdf_sessions");
  await sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

  return db;
}

// ── Invoice operations ──

export async function insertInvoice(invoice: Record<string, any>) {
  const col = (await getDb()).collection("invoices");
  await col.insertOne({ ...invoice, created_at: new Date() });
  return invoice;
}

export async function getInvoice(id: string) {
  const col = (await getDb()).collection("invoices");
  return col.findOne({ id });
}

export async function getInvoices(filter: Record<string, any> = {}, sort: Record<string, any> = { created_at: -1 }) {
  const col = (await getDb()).collection("invoices");
  return col.find(filter).sort(sort).toArray();
}

export async function updateInvoice(id: string, update: Record<string, any>) {
  const col = (await getDb()).collection("invoices");
  await col.updateOne({ id }, { $set: update });
}

// ── PDF session operations ──

export async function storePdfSession(token: string, invoiceId: string, email: string) {
  const col = (await getDb()).collection("pdf_sessions");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min TTL
  await col.updateOne(
    { token },
    { $set: { token, invoice_id: invoiceId, email, expires_at: expiresAt } },
    { upsert: true }
  );
}

export async function validatePdfSession(token: string, invoiceId: string): Promise<boolean> {
  const col = (await getDb()).collection("pdf_sessions");
  const session = await col.findOne({ token, invoice_id: invoiceId, expires_at: { $gt: new Date() } });
  return !!session;
}

export async function validatePdfSessionByInvoiceId(invoiceId: string): Promise<boolean> {
  const col = (await getDb()).collection("pdf_sessions");
  const session = await col.findOne({ invoice_id: invoiceId, expires_at: { $gt: new Date() } });
  return !!session;
}
