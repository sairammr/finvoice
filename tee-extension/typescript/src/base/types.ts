// ── Action (incoming from proxy via POST /action) ──

export interface Action {
  data: {
    id: string;
    type: string;
    submissionTag: string;
    message: string; // hex-encoded DataFixed JSON
  };
}

export interface DataFixed {
  instructionId: string;
  opType: string;   // bytes32 hex
  opCommand: string; // bytes32 hex
  originalMessage: string; // hex-encoded payload
}

// ── ActionResult (response back to proxy) ──

export interface ActionResult {
  id: string;
  submissionTag: string;
  status: number; // 0=error, 1=success, >=2=pending
  log: string;
  opType: string;
  opCommand: string;
  version: string;
  data: string;
}

// ── State (reported via GET /state) ──

export interface StateVersion {
  version: string;
  data: string;
}

// ── Handler function signature ──

export type HandlerFn = (msg: string) => Promise<[string | null, number, string | null]>;

// ── Framework ──

export class Framework {
  private handlers = new Map<string, HandlerFn>();

  registerHandler(opType: string, opCommand: string, handler: HandlerFn): void {
    const key = `${opType}:${opCommand}`;
    this.handlers.set(key, handler);
  }

  getHandler(opType: string, opCommand: string): HandlerFn | undefined {
    const key = `${opType}:${opCommand}`;
    return this.handlers.get(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.handlers.keys());
  }
}
