import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  keccak256,
  toBytes,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { InvoiceInstructionSenderABI } from "./abis/InvoiceInstructionSender";

// ── Chain definition: Flare Coston2 Testnet ──

export const flareCoston2 = defineChain({
  id: Number(process.env.FLARE_CHAIN_ID || 114),
  name: "Flare Testnet Coston2",
  nativeCurrency: { name: "Coston2 Flare", symbol: "C2FLR", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.FLARE_RPC_URL || "https://coston2-api.flare.network/ext/C/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Coston2 Explorer",
      url: "https://coston2-explorer.flare.network",
    },
  },
});

// ── Account ──

const account = privateKeyToAccount(
  (process.env.FLARE_PRIVATE_KEY?.startsWith("0x")
    ? process.env.FLARE_PRIVATE_KEY
    : `0x${process.env.FLARE_PRIVATE_KEY}`) as `0x${string}`
);

// ── Viem clients (Flare Coston2 only) ──

export const flarePublicClient = createPublicClient({
  chain: flareCoston2,
  transport: http(),
});

export const flareWalletClient = createWalletClient({
  account,
  chain: flareCoston2,
  transport: http(),
});

// ── Contract addresses ──

export const addresses = {
  instructionSender: (process.env.INSTRUCTION_SENDER_ADDRESS || "") as Address,
};

// ── TEE Proxy URL ──

export const TEE_PROXY_URL = process.env.TEE_PROXY_URL || "http://localhost:6676";

// ── Re-export ABI ──

export { InvoiceInstructionSenderABI } from "./abis/InvoiceInstructionSender";

// ── Helpers ──

export function hashString(value: string): `0x${string}` {
  return keccak256(toBytes(value));
}

export { account };
