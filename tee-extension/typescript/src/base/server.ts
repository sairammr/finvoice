import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { Framework, type Action, type ActionResult, type DataFixed, type HandlerFn } from "./types.js";
import { bytes32HexToString } from "./encoding.js";

type RegisterFn = (f: Framework) => void;
type ReportStateFn = () => { version: string; data: string };

export class Server {
  private framework: Framework;
  private version: string;
  private extensionPort: string;
  private signPort: string;
  private reportState: ReportStateFn;

  constructor(
    extensionPort: string,
    signPort: string,
    version: string,
    registerFn: RegisterFn,
    reportStateFn: ReportStateFn
  ) {
    this.extensionPort = extensionPort;
    this.signPort = signPort;
    this.version = version;
    this.reportState = reportStateFn;
    this.framework = new Framework();
    registerFn(this.framework);
  }

  listenAndServe(): void {
    const server = createServer((req, res) => this.handleRequest(req, res));
    server.listen(Number(this.extensionPort), () => {
      console.log(`[server] Listening on port ${this.extensionPort}`);
      console.log(`[server] Registered handlers: ${this.framework.getAllKeys().join(", ")}`);
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await readBody(req);

    if (req.method === "POST" && req.url === "/action") {
      const [status, result] = await this.processAction(body);
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === "GET" && req.url === "/state") {
      const state = this.reportState();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(state));
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", version: this.version }));
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  }

  // Exposed for testing — processes action without HTTP
  async handleRequestDirect(
    method: string,
    path: string,
    body: string
  ): Promise<[number, any]> {
    if (method === "POST" && path === "/action") {
      return this.processAction(body);
    }
    if (method === "GET" && path === "/state") {
      return [200, this.reportState()];
    }
    return [404, { error: "Not found" }];
  }

  private async processAction(body: string): Promise<[number, ActionResult | { error: string }]> {
    let action: Action;
    try {
      action = JSON.parse(body);
    } catch {
      return [400, { error: "Invalid JSON" } as any];
    }

    // Decode the DataFixed from the message
    let dataFixed: DataFixed;
    try {
      const msgHex = action.data.message;
      const msgClean = msgHex.startsWith("0x") ? msgHex.slice(2) : msgHex;
      const msgStr = Buffer.from(msgClean, "hex").toString("utf8");
      dataFixed = JSON.parse(msgStr);
    } catch {
      return [400, { error: "Failed to decode DataFixed" } as any];
    }

    const opType = bytes32HexToString(dataFixed.opType);
    const opCommand = bytes32HexToString(dataFixed.opCommand);

    const handler = this.framework.getHandler(opType, opCommand);
    if (!handler) {
      const result: ActionResult = {
        id: action.data.id,
        submissionTag: action.data.submissionTag,
        status: 0,
        log: `No handler for ${opType}:${opCommand}`,
        opType: dataFixed.opType,
        opCommand: dataFixed.opCommand,
        version: this.version,
        data: "0x",
      };
      return [404, result];
    }

    try {
      const [data, status, err] = await handler(dataFixed.originalMessage);

      const result: ActionResult = {
        id: action.data.id,
        submissionTag: action.data.submissionTag,
        status,
        log: err || "ok",
        opType: dataFixed.opType,
        opCommand: dataFixed.opCommand,
        version: this.version,
        data: data || "0x",
      };

      return [200, result];
    } catch (e: any) {
      const result: ActionResult = {
        id: action.data.id,
        submissionTag: action.data.submissionTag,
        status: 0,
        log: e.message,
        opType: dataFixed.opType,
        opCommand: dataFixed.opCommand,
        version: this.version,
        data: "0x",
      };
      return [500, result];
    }
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}
