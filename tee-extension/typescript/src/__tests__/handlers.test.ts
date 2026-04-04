import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createServer, type Server as HttpServer } from "http";
import { Server } from "../base/server.js";
import { register, reportState, resetState, setSignPort } from "../app/handlers.js";
import { Version } from "../app/config.js";
import { stringToBytes32Hex } from "../base/encoding.js";

// ── Mock TEE Node ──
// Simulates the tee-node's /decrypt and /sign endpoints

let mockServer: HttpServer;
let mockPort: number;

function startMockNode(): Promise<{ server: HttpServer; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        if (req.url === "/decrypt" && req.method === "POST") {
          // Mock decrypt: just return the input as-is (no real ECIES)
          const parsed = JSON.parse(body);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ decryptedMessage: parsed.encryptedMessage }));
        } else if (req.url === "/sign" && req.method === "POST") {
          // Mock sign: return a fake signature
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ signature: "bW9ja19zaWduYXR1cmU=" })); // "mock_signature" base64
        } else {
          res.writeHead(404);
          res.end();
        }
      });
    });

    server.listen(0, () => {
      const addr = server.address() as any;
      resolve({ server, port: addr.port });
    });
  });
}

// ── Test helpers ──

function makeActionBody(opType: string, opCommand: string, message: string): string {
  const dataFixed = {
    instructionId: "0x0000000000000000000000000000000000000000000000000000000000000001",
    opType: stringToBytes32Hex(opType),
    opCommand: stringToBytes32Hex(opCommand),
    originalMessage: "0x" + Buffer.from(message).toString("hex"),
  };

  const dataFixedHex = "0x" + Buffer.from(JSON.stringify(dataFixed)).toString("hex");

  return JSON.stringify({
    data: {
      id: "test-action-1",
      type: "instruction",
      submissionTag: "test-tag",
      message: dataFixedHex,
    },
  });
}

// ── Tests ──

describe("Invoice TEE Handlers", () => {
  beforeEach(async () => {
    resetState();
    if (!mockServer) {
      const mock = await startMockNode();
      mockServer = mock.server;
      mockPort = mock.port;
      setSignPort(String(mockPort));
    }
  });

  afterAll(() => {
    if (mockServer) mockServer.close();
  });

  it("should report empty state initially", async () => {
    const srv = new Server("0", String(mockPort), Version, register, reportState);
    const [status, result] = await srv.handleRequestDirect("GET", "/state", "");
    expect(status).toBe(200);

    const stateData = JSON.parse(Buffer.from(result.data.slice(2), "hex").toString());
    expect(stateData.invoiceCount).toBe(0);
  });

  it("should create an invoice (handler: INVOICE/CREATE)", async () => {
    const srv = new Server("0", String(mockPort), Version, register, reportState);

    const invoiceData = JSON.stringify({
      invoiceId: "INV-TEST-001",
      supplierName: "Acme Corp",
      supplierAddress: "0x1234",
      debtorName: "Wayne Enterprises",
      debtorEmail: "bruce@wayne.com",
      faceValue: 50000,
      dueDate: "2026-06-01",
      terms: "net-30",
      jurisdiction: "Brazil",
      paymentHistory: "Excellent payment history",
      pdfHash: "0xabcdef",
    });

    // Since mock decrypt returns input as-is, we base64 the JSON
    // (in real TEE, this would be ECIES-encrypted)
    const encryptedPayload = Buffer.from(invoiceData).toString("base64");
    const hexPayload = Buffer.from(encryptedPayload, "base64").toString("hex");

    const body = makeActionBody("INVOICE", "CREATE", invoiceData);
    const [status, result] = await srv.handleRequestDirect("POST", "/action", body);

    expect(status).toBe(200);
    expect(result.status).toBe(1);

    // Verify state updated
    const [, stateResult] = await srv.handleRequestDirect("GET", "/state", "");
    const stateData = JSON.parse(Buffer.from(stateResult.data.slice(2), "hex").toString());
    expect(stateData.invoiceCount).toBe(1);
    expect(stateData.invoiceIds).toContain("INV-TEST-001");
  });

  it("should approve an invoice (handler: INVOICE/APPROVE)", async () => {
    const srv = new Server("0", String(mockPort), Version, register, reportState);

    // First create
    const createBody = makeActionBody("INVOICE", "CREATE", JSON.stringify({
      invoiceId: "INV-TEST-002",
      supplierName: "Test",
      supplierAddress: "0x0",
      debtorName: "Debtor",
      debtorEmail: "d@test.com",
      faceValue: 10000,
      dueDate: "2026-07-01",
      terms: "net-60",
      jurisdiction: "US",
      paymentHistory: "Good payment history",
      pdfHash: "0x123",
    }));
    await srv.handleRequestDirect("POST", "/action", createBody);

    // Then approve
    const approveBody = makeActionBody("INVOICE", "APPROVE", JSON.stringify({
      invoiceId: "INV-TEST-002",
    }));
    const [status, result] = await srv.handleRequestDirect("POST", "/action", approveBody);

    expect(status).toBe(200);
    expect(result.status).toBe(1);

    // Verify state
    const [, stateResult] = await srv.handleRequestDirect("GET", "/state", "");
    const stateData = JSON.parse(Buffer.from(stateResult.data.slice(2), "hex").toString());
    expect(stateData.approvedCount).toBe(1);
  });

  it("should reject approval of non-existent invoice", async () => {
    const srv = new Server("0", String(mockPort), Version, register, reportState);

    const body = makeActionBody("INVOICE", "APPROVE", JSON.stringify({
      invoiceId: "INV-NONEXISTENT",
    }));
    const [status, result] = await srv.handleRequestDirect("POST", "/action", body);

    expect(status).toBe(200);
    expect(result.status).toBe(0); // error
    expect(result.log).toContain("not found");
  });

  it("should score an approved invoice (handler: INVOICE/SCORE)", async () => {
    const srv = new Server("0", String(mockPort), Version, register, reportState);

    // Create
    const createBody = makeActionBody("INVOICE", "CREATE", JSON.stringify({
      invoiceId: "INV-TEST-003",
      supplierName: "Supplier",
      supplierAddress: "0x0",
      debtorName: "Big Corp",
      debtorEmail: "big@corp.com",
      faceValue: 100000,
      dueDate: "2026-06-15",
      terms: "net-30",
      jurisdiction: "Brazil",
      paymentHistory: "Excellent payment history, 10 years on time",
      pdfHash: "0xabc",
    }));
    await srv.handleRequestDirect("POST", "/action", createBody);

    // Approve
    const approveBody = makeActionBody("INVOICE", "APPROVE", JSON.stringify({
      invoiceId: "INV-TEST-003",
    }));
    await srv.handleRequestDirect("POST", "/action", approveBody);

    // Score
    const scoreBody = makeActionBody("INVOICE", "SCORE", JSON.stringify({
      invoiceId: "INV-TEST-003",
    }));
    const [status, result] = await srv.handleRequestDirect("POST", "/action", scoreBody);

    expect(status).toBe(200);
    expect(result.status).toBe(1);

    // Parse the scoring result from data
    const dataHex = result.data.replace("0x", "");
    const scoringResult = JSON.parse(Buffer.from(dataHex, "hex").toString());

    expect(scoringResult.riskGrade).toBe("A"); // "Excellent" -> A
    expect(scoringResult.discountBps).toBeGreaterThan(0);
    expect(scoringResult.yieldBps).toBeGreaterThan(0);
    expect(scoringResult.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(scoringResult.attestationHash).toMatch(/^0x/);
    expect(scoringResult.signature).toBeTruthy();

    // Verify state
    const [, stateResult] = await srv.handleRequestDirect("GET", "/state", "");
    const stateData = JSON.parse(Buffer.from(stateResult.data.slice(2), "hex").toString());
    expect(stateData.scoredCount).toBe(1);
  });

  it("should reject scoring of unapproved invoice", async () => {
    const srv = new Server("0", String(mockPort), Version, register, reportState);

    // Create without approving
    const createBody = makeActionBody("INVOICE", "CREATE", JSON.stringify({
      invoiceId: "INV-TEST-004",
      supplierName: "S",
      supplierAddress: "0x0",
      debtorName: "D",
      debtorEmail: "d@d.com",
      faceValue: 5000,
      dueDate: "2026-08-01",
      terms: "net-30",
      jurisdiction: "Brazil",
      paymentHistory: "Good",
      pdfHash: "0x0",
    }));
    await srv.handleRequestDirect("POST", "/action", createBody);

    // Try to score without approval
    const scoreBody = makeActionBody("INVOICE", "SCORE", JSON.stringify({
      invoiceId: "INV-TEST-004",
    }));
    const [status, result] = await srv.handleRequestDirect("POST", "/action", scoreBody);

    expect(status).toBe(200);
    expect(result.status).toBe(0); // error
    expect(result.log).toContain("not yet approved");
  });

  it("should score 'poor' payment history as grade D", async () => {
    const srv = new Server("0", String(mockPort), Version, register, reportState);

    // Create with poor history
    const createBody = makeActionBody("INVOICE", "CREATE", JSON.stringify({
      invoiceId: "INV-TEST-005",
      supplierName: "Risky Supplier",
      supplierAddress: "0x0",
      debtorName: "Bad Debtor",
      debtorEmail: "bad@debtor.com",
      faceValue: 25000,
      dueDate: "2026-06-01",
      terms: "net-90",
      jurisdiction: "Nigeria",
      paymentHistory: "Poor payment history, multiple defaults",
      pdfHash: "0xbad",
    }));
    await srv.handleRequestDirect("POST", "/action", createBody);

    // Approve + Score
    const approveBody = makeActionBody("INVOICE", "APPROVE", JSON.stringify({ invoiceId: "INV-TEST-005" }));
    await srv.handleRequestDirect("POST", "/action", approveBody);

    const scoreBody = makeActionBody("INVOICE", "SCORE", JSON.stringify({ invoiceId: "INV-TEST-005" }));
    const [, result] = await srv.handleRequestDirect("POST", "/action", scoreBody);

    const dataHex = result.data.replace("0x", "");
    const scoring = JSON.parse(Buffer.from(dataHex, "hex").toString());

    expect(scoring.riskGrade).toBe("D");
    expect(scoring.discountBps).toBeGreaterThan(800); // high risk = high discount
    expect(scoring.confidenceScore).toBeLessThan(70);
  });

  it("should ensure debtor data never appears in scoring output", async () => {
    const srv = new Server("0", String(mockPort), Version, register, reportState);

    const secretDebtorName = "SUPER_SECRET_DEBTOR_NAME_12345";

    const createBody = makeActionBody("INVOICE", "CREATE", JSON.stringify({
      invoiceId: "INV-PRIVACY",
      supplierName: "Public Supplier",
      supplierAddress: "0x0",
      debtorName: secretDebtorName,
      debtorEmail: "secret@private.com",
      faceValue: 75000,
      dueDate: "2026-06-01",
      terms: "net-30",
      jurisdiction: "Brazil",
      paymentHistory: "Excellent payment history",
      pdfHash: "0x0",
    }));
    await srv.handleRequestDirect("POST", "/action", createBody);

    const approveBody = makeActionBody("INVOICE", "APPROVE", JSON.stringify({ invoiceId: "INV-PRIVACY" }));
    await srv.handleRequestDirect("POST", "/action", approveBody);

    const scoreBody = makeActionBody("INVOICE", "SCORE", JSON.stringify({ invoiceId: "INV-PRIVACY" }));
    const [, result] = await srv.handleRequestDirect("POST", "/action", scoreBody);

    // The scoring output (what goes public) must NOT contain debtor data
    const outputStr = JSON.stringify(result);
    expect(outputStr).not.toContain(secretDebtorName);
    expect(outputStr).not.toContain("secret@private.com");
  });
});
