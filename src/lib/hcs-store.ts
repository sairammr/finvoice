/**
 * HCS-backed data store — replaces MongoDB entirely.
 *
 * Every invoice lifecycle event is an HCS message on the Invoice Topic.
 * On startup, replays all messages to rebuild in-memory state.
 * Writes submit an HCS message and update the in-memory Map.
 *
 * HCS messages are publicly readable — private fields (debtor name, email,
 * payment history) are encrypted with the operator's Flare key before submission.
 */

import {
  Client,
  AccountId,
  PrivateKey,
  TopicId,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
} from "@hashgraph/sdk";
import { encryptForFlare, decryptForFlare, deriveEncryptionPublicKey } from "./crypto";

// ── Hedera client ──

const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID || "0.0.0");
const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY || "");
const client = Client.forTestnet();
client.setOperator(operatorId, operatorKey);

const invoiceTopicId = TopicId.fromString(process.env.HCS_INVOICE_TOPIC_ID || "0.0.0");
const sessionTopicId = TopicId.fromString(process.env.HCS_SESSION_TOPIC_ID || "0.0.0");

// Encryption key for private fields (use Flare key for secp256k1 ECIES)
const ENCRYPTION_KEY = process.env.FLARE_PRIVATE_KEY || "";
const ENCRYPTION_PUB_KEY = ENCRYPTION_KEY ? deriveEncryptionPublicKey(ENCRYPTION_KEY) : "";

// ── In-memory state ──

const invoices = new Map<string, any>();
const sessions = new Map<string, any>();
let initialized = false;
let initPromise: Promise<void> | null = null;

// Private fields that get encrypted before HCS submission
const PRIVATE_FIELDS = ["debtor_name", "debtor_email", "payment_history", "debtor_name", "debtorName", "debtorEmail", "paymentHistory"];

// ── HCS Message Types ──

interface HcsInvoiceMessage {
  type: "invoice_created" | "invoice_updated";
  id: string;
  data?: Record<string, any>;
  updates?: Record<string, any>;
  ts: number;
}

interface HcsSessionMessage {
  type: "session_created";
  token: string;
  invoice_id: string;
  email: string;
  expires_at: string;
}

// ── Encrypt/Decrypt private fields ──

function encryptPrivateFields(obj: Record<string, any>): Record<string, any> {
  if (!ENCRYPTION_PUB_KEY) return obj;
  const result = { ...obj };
  for (const field of PRIVATE_FIELDS) {
    if (result[field] && typeof result[field] === "string") {
      result[`_enc_${field}`] = encryptForFlare(ENCRYPTION_PUB_KEY, result[field]);
      delete result[field];
    }
  }
  return result;
}

function decryptPrivateFields(obj: Record<string, any>): Record<string, any> {
  if (!ENCRYPTION_KEY) return obj;
  const result = { ...obj };
  for (const field of PRIVATE_FIELDS) {
    const encKey = `_enc_${field}`;
    if (result[encKey]) {
      try {
        result[field] = decryptForFlare(ENCRYPTION_KEY, result[encKey]).toString();
        delete result[encKey];
      } catch {
        // Decryption failed — leave encrypted
      }
    }
  }
  return result;
}

// ── Submit message to HCS ──

async function submitToTopic(topicId: TopicId, message: any): Promise<string> {
  const msgStr = JSON.stringify(message);
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(msgStr)
    .freezeWith(client);

  const signed = await tx.sign(operatorKey);
  const resp = await signed.execute(client);
  const receipt = await resp.getReceipt(client);
  return resp.transactionId.toString();
}

// ── Initialize: replay HCS messages into memory ──

async function replayTopic(topicId: TopicId, handler: (msg: string) => void): Promise<number> {
  return new Promise((resolve) => {
    let count = 0;
    let timeoutHandle: ReturnType<typeof setTimeout>;

    const resetTimeout = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      timeoutHandle = setTimeout(() => {
        resolve(count);
      }, 5000); // 5s of no messages = done replaying
    };

    resetTimeout();

    new TopicMessageQuery()
      .setTopicId(topicId)
      .setStartTime(0)
      .subscribe(client, (message) => {
        const content = Buffer.from(message.contents).toString("utf8");
        handler(content);
        count++;
        resetTimeout();
      });
  });
}

export async function initHcsStore(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log("[hcs-store] Initializing — replaying HCS messages...");

    // Replay invoice topic
    const invoiceCount = await replayTopic(invoiceTopicId, (content) => {
      try {
        const msg: HcsInvoiceMessage = JSON.parse(content);
        if (msg.type === "invoice_created" && msg.data) {
          const decrypted = decryptPrivateFields(msg.data);
          invoices.set(msg.id, { ...decrypted, created_at: new Date(msg.ts) });
        } else if (msg.type === "invoice_updated" && msg.updates) {
          const existing = invoices.get(msg.id);
          if (existing) {
            const decrypted = decryptPrivateFields(msg.updates);
            Object.assign(existing, decrypted);
          }
        }
      } catch {}
    });

    // Replay session topic
    const sessionCount = await replayTopic(sessionTopicId, (content) => {
      try {
        const msg: HcsSessionMessage = JSON.parse(content);
        if (msg.type === "session_created") {
          sessions.set(msg.token, {
            token: msg.token,
            invoice_id: msg.invoice_id,
            email: msg.email,
            expires_at: msg.expires_at,
          });
        }
      } catch {}
    });

    initialized = true;
    console.log(`[hcs-store] Ready — ${invoiceCount} invoice events, ${sessionCount} session events replayed`);
    console.log(`[hcs-store] ${invoices.size} invoices, ${sessions.size} sessions in memory`);
  })();

  return initPromise;
}

// ── Ensure initialized before any operation ──

async function ensureInit() {
  if (!initialized) await initHcsStore();
}

// ── Invoice CRUD ──

export async function insertInvoice(invoice: Record<string, any>): Promise<any> {
  await ensureInit();

  const id = invoice.id;
  const encrypted = encryptPrivateFields(invoice);

  const msg: HcsInvoiceMessage = {
    type: "invoice_created",
    id,
    data: encrypted,
    ts: Date.now(),
  };

  await submitToTopic(invoiceTopicId, msg);

  // Optimistic: add to memory immediately
  invoices.set(id, { ...invoice, created_at: new Date() });
  return invoice;
}

export async function getInvoice(id: string): Promise<any | null> {
  await ensureInit();
  return invoices.get(id) || null;
}

export async function getInvoices(
  filter: Record<string, any> = {},
  sort: Record<string, any> = { created_at: -1 }
): Promise<any[]> {
  await ensureInit();

  let results = Array.from(invoices.values());

  // Apply filters
  for (const [key, value] of Object.entries(filter)) {
    if (value && typeof value === "object" && "$in" in value) {
      const allowed = value.$in as any[];
      results = results.filter((inv) => allowed.includes(inv[key]));
    } else if (value && typeof value === "object" && "$eq" in value) {
      results = results.filter((inv) => inv[key] === value.$eq);
    } else if (value && typeof value === "object" && "$regex" in value) {
      const regex = value.$regex instanceof RegExp ? value.$regex : new RegExp(value.$regex, "i");
      results = results.filter((inv) => regex.test(inv[key] || ""));
    } else {
      results = results.filter((inv) => inv[key] === value);
    }
  }

  // Apply sort
  const sortKey = Object.keys(sort)[0] || "created_at";
  const sortDir = sort[sortKey] === -1 ? -1 : 1;
  results.sort((a, b) => {
    const aVal = a[sortKey] instanceof Date ? a[sortKey].getTime() : a[sortKey];
    const bVal = b[sortKey] instanceof Date ? b[sortKey].getTime() : b[sortKey];
    if (aVal < bVal) return -1 * sortDir;
    if (aVal > bVal) return 1 * sortDir;
    return 0;
  });

  return results;
}

export async function updateInvoice(id: string, updates: Record<string, any>): Promise<void> {
  await ensureInit();

  const encrypted = encryptPrivateFields(updates);

  const msg: HcsInvoiceMessage = {
    type: "invoice_updated",
    id,
    updates: encrypted,
    ts: Date.now(),
  };

  await submitToTopic(invoiceTopicId, msg);

  // Optimistic: update memory
  const existing = invoices.get(id);
  if (existing) {
    Object.assign(existing, updates);
  }
}

// ── PDF Session CRUD ──

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function storePdfSession(
  token: string,
  invoiceId: string,
  email: string
): Promise<void> {
  await ensureInit();

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const msg: HcsSessionMessage = {
    type: "session_created",
    token,
    invoice_id: invoiceId,
    email,
    expires_at: expiresAt,
  };

  await submitToTopic(sessionTopicId, msg);

  // Optimistic
  sessions.set(token, { token, invoice_id: invoiceId, email, expires_at: expiresAt });
}

export async function validatePdfSession(
  token: string,
  invoiceId: string
): Promise<boolean> {
  await ensureInit();

  const session = sessions.get(token);
  if (!session) return false;
  if (session.invoice_id !== invoiceId) return false;
  if (new Date(session.expires_at) < new Date()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export async function validatePdfSessionByInvoiceId(
  invoiceId: string
): Promise<boolean> {
  await ensureInit();

  for (const session of sessions.values()) {
    if (
      session.invoice_id === invoiceId &&
      new Date(session.expires_at) > new Date()
    ) {
      return true;
    }
  }
  return false;
}
