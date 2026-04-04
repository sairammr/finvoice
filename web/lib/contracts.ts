import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const defaultLocalRpc = "http://127.0.0.1:8545";
const rpcUrl =
  process.env.PRIVACY_NODE_RPC_URL ??
  process.env.NEXT_PUBLIC_PRIVACY_NODE_RPC_URL ??
  defaultLocalRpc;

const chainId = Number(process.env.PRIVACY_NODE_CHAIN_ID ?? "31337");

const chain = defineChain({
  id: chainId,
  name: "Privacy Node",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: [rpcUrl] } },
});

/**
 * Deployed InvoiceToken (or mock) address. Override via env in production.
 */
export const addresses = {
  invoiceToken: (process.env.NEXT_PUBLIC_INVOICE_TOKEN_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
};

/**
 * Minimal ABI for `approve` route: read invoice tuple and approve.
 */
export const InvoiceTokenABI = [
  {
    type: "function",
    name: "invoices",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "supplier", type: "address" },
          { name: "debtor", type: "address" },
          { name: "faceValue", type: "uint256" },
          { name: "currency", type: "string" },
          { name: "dueDate", type: "uint256" },
          { name: "terms", type: "string" },
          { name: "metadataUri", type: "string" },
          { name: "mintedAt", type: "uint256" },
          { name: "supplierApproved", type: "bool" },
          { name: "factorApproved", type: "bool" },
          { name: "debtorApproved", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "approveInvoice",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
] as const;

export const privacyNodePublicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

function resolveSignerAccount() {
  const pk = process.env.PRIVACY_NODE_PRIVATE_KEY;
  if (pk?.startsWith("0x") && pk.length === 66) {
    return privateKeyToAccount(pk as `0x${string}`);
  }
  // Local dev only: first Anvil/Hardhat default account. Set PRIVACY_NODE_PRIVATE_KEY in production.
  if (process.env.NODE_ENV !== "production") {
    return privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );
  }
  throw new Error("PRIVACY_NODE_PRIVATE_KEY is required in production");
}

export const privacyNodeWalletClient = createWalletClient({
  account: resolveSignerAccount(),
  chain,
  transport: http(rpcUrl),
});
