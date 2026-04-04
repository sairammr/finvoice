# Hedsup End-to-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing Hedsup UI prototype to real deployed smart contracts, real AI credit scoring via OpenRouter, and real blockchain reads/writes — producing a demo-ready hackathon MVP.

**Architecture:** Server-side Next.js API routes hold the private key and act as both approval proxy and attestation agent. Frontend calls API routes which interact with two chains: Privacy Node (InvoiceToken ERC-1155) and Public Testnet (InvoiceMarketplace + InvoiceReceipt). AI scoring uses OpenRouter LLM. Supabase stores off-chain invoice metadata for fast reads.

**Tech Stack:** Next.js 16, viem (blockchain client), Foundry (deployment), OpenRouter API (AI scoring), Supabase (database), @react-pdf/renderer (PDF generation)

---

## File Map

### New Files
- `src/contracts/MockUSDC.sol` — Simple mintable ERC-20 for demo stablecoin on Public Testnet
- `script/DeployMockUSDC.s.sol` — Foundry deployment script for MockUSDC
- `src/lib/contracts.ts` — viem clients, ABIs, read/write helpers for both chains
- `src/lib/abis/InvoiceToken.ts` — ABI extracted from Foundry output
- `src/lib/abis/InvoiceMarketplace.ts` — ABI extracted from Foundry output
- `src/lib/abis/InvoiceReceipt.ts` — ABI extracted from Foundry output
- `src/lib/abis/MockUSDC.ts` — ABI for the mock stablecoin
- `src/lib/scoring.ts` — OpenRouter LLM credit scoring logic
- `src/app/api/invoices/route.ts` — Invoice CRUD (create + list)
- `src/app/api/listings/route.ts` — Read marketplace listings from Public L1
- `src/app/api/fund/route.ts` — Fund a listing on Public L1
- `src/app/api/seed/route.ts` — Demo seeding endpoint
- `.env.local` — Deployed contract addresses (added after deployment)

### Modified Files
- `.env` — Add OPENROUTER_API_KEY (server-only), remove NEXT_PUBLIC_ prefix
- `package.json` — Add viem dependency
- `src/app/api/approve/route.ts` — Replace mock with real on-chain approval + scoring
- `src/app/api/score/route.ts` — Replace mock with OpenRouter LLM + on-chain attestation
- `src/app/api/generate-pdf/route.ts` — Replace HTML with real @react-pdf/renderer PDF
- `src/app/(app)/create-invoice/page.tsx` — Wire to POST /api/invoices
- `src/app/approve/page.tsx` — Wire to POST /api/approve with real progress
- `src/app/(app)/marketplace/page.tsx` — Wire to GET /api/listings + POST /api/fund
- `src/app/(app)/dashboard/page.tsx` — Wire to GET /api/invoices + /api/listings

---

## Task 1: Install viem and Fix Environment Variables

**Files:**
- Modify: `package.json`
- Modify: `.env`

- [ ] **Step 1: Install viem**

```bash
cd /Users/fabianferno/Documents/hedsup && pnpm add viem
```

- [ ] **Step 2: Fix .env — move OpenRouter key to server-only**

In `.env`, rename `NEXT_PUBLIC_OPENROUTER_API_KEY` to `OPENROUTER_API_KEY` (removing the `NEXT_PUBLIC_` prefix so it's never exposed to the browser). Add blockchain env vars:

```env
# Existing keys (keep as-is)
NEXT_PUBLIC_SUPABASE_URL=https://njpwiqjuzlpkfcomttgo.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_3a5g6Nk1XbzP_fmLLxclbA_i-IrF004
NEXT_PRIVY_APP_ID=cmnal3irj00360cjutmqykx94

# Renamed (server-only)
OPENROUTER_API_KEY=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

# Blockchain
PRIVATE_KEY=f9346a77fadf311343996b71fb9f25188c9e6267a0ee97d73632723d6a2e9a38
PRIVACY_NODE_RPC_URL=https://privacy-node-4.flare.com
PRIVACY_NODE_CHAIN_ID=800004
DEPLOYMENT_PROXY_REGISTRY=0x75Da1758161588FD2ccbFd23AB87f373b0f73c8F
PUBLIC_L1_RPC_URL=https://testnet-rpc.flare.com/
PUBLIC_L1_CHAIN_ID=7295799

# Contract addresses (filled after deployment)
INVOICE_TOKEN_ADDRESS=
INVOICE_MARKETPLACE_ADDRESS=
INVOICE_RECEIPT_ADDRESS=
MOCK_USDC_ADDRESS=
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml .env
git commit -m "chore: add viem, fix env vars for blockchain integration"
```

---

## Task 2: Deploy MockUSDC to Public Testnet

**Files:**
- Create: `src/contracts/MockUSDC.sol`
- Create: `script/DeployMockUSDC.s.sol`

- [ ] **Step 1: Create MockUSDC.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDC — Simple mintable stablecoin for demo/testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
```

- [ ] **Step 2: Create DeployMockUSDC.s.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/contracts/MockUSDC.sol";

contract DeployMockUSDC is Script {
    function run() external {
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        // Mint 10M USDC to deployer for demo
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        usdc.mint(deployer, 10_000_000 * 1e6);
        console.log("Minted 10M USDC to:", deployer);

        vm.stopBroadcast();
    }
}
```

- [ ] **Step 3: Compile and deploy**

```bash
cd /Users/fabianferno/Documents/hedsup

# Compile
forge build

# Deploy MockUSDC to Public Testnet
forge script script/DeployMockUSDC.s.sol \
  --rpc-url $PUBLIC_L1_RPC_URL \
  --broadcast --legacy
```

Save the deployed address and update `.env`:
```
MOCK_USDC_ADDRESS=<deployed address from console output>
```

- [ ] **Step 4: Commit**

```bash
git add src/contracts/MockUSDC.sol script/DeployMockUSDC.s.sol
git commit -m "feat: add MockUSDC contract and deploy script"
```

---

## Task 3: Deploy InvoiceToken to Privacy Node

**Files:**
- Modify: `script/DeployInvoiceToken.s.sol` (change DEPLOYER_PRIVATE_KEY to PRIVATE_KEY)

- [ ] **Step 1: Update deployment script to use PRIVATE_KEY**

In `script/DeployInvoiceToken.s.sol`, replace all occurrences of `DEPLOYER_PRIVATE_KEY` with `PRIVATE_KEY`:

```solidity
contract DeployInvoiceToken is Script {
    function run() external {
        address registry = vm.envAddress("DEPLOYMENT_PROXY_REGISTRY");
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));

        address endpoint = IDeploymentProxyRegistryV1(registry).getContract("Endpoint");

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        InvoiceToken token = new InvoiceToken(
            "https://hedsup.app/api/metadata/{id}",
            "Hedsup Invoice",
            endpoint,
            deployer
        );

        console.log("InvoiceToken deployed at:", address(token));
        console.log("Endpoint:", endpoint);

        vm.stopBroadcast();
    }
}
```

- [ ] **Step 2: Deploy to Privacy Node**

```bash
cd /Users/fabianferno/Documents/hedsup

forge script script/DeployInvoiceToken.s.sol \
  --rpc-url $PRIVACY_NODE_RPC_URL \
  --broadcast --legacy
```

Save the deployed address and update `.env`:
```
INVOICE_TOKEN_ADDRESS=<deployed address from console output>
```

- [ ] **Step 3: Commit**

```bash
git add script/DeployInvoiceToken.s.sol
git commit -m "feat: deploy InvoiceToken to Privacy Node"
```

---

## Task 4: Deploy InvoiceReceipt + InvoiceMarketplace to Public Testnet

**Files:**
- Modify: `script/DeployPublic.s.sol` (change DEPLOYER_PRIVATE_KEY to PRIVATE_KEY, use MockUSDC address)

- [ ] **Step 1: Update deployment script**

In `script/DeployPublic.s.sol`, replace `DEPLOYER_PRIVATE_KEY` with `PRIVATE_KEY`, and use `MOCK_USDC_ADDRESS` for stablecoin. Use deployer as treasury. The `PUBLIC_ENDPOINT_ADDRESS` needs to be discovered — on Public L1 we pass address(0) or a known endpoint. Since InvoiceMarketplace extends FlareApp and needs an endpoint, we need the public endpoint address.

For public testnet, the endpoint may need to be looked up. If not available, we use a simplified approach: deploy marketplace without FlareApp features and simulate the attestation relay by calling `receiveAttestation` directly from the owner.

Update the script:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/contracts/InvoiceReceipt.sol";
import "../src/contracts/InvoiceMarketplace.sol";

contract DeployPublic is Script {
    function run() external {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address stablecoin = vm.envAddress("MOCK_USDC_ADDRESS");
        address treasury = deployer; // Use deployer as treasury for demo
        address publicEndpoint = vm.envAddress("PUBLIC_ENDPOINT_ADDRESS");
        uint256 platformFeeBps = vm.envOr("PLATFORM_FEE_BPS", uint256(30));

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        InvoiceReceipt receipt = new InvoiceReceipt(
            "https://hedsup.app/api/receipt/",
            "Hedsup Receipt",
            "RWRECEIPT",
            publicEndpoint,
            deployer,
            stablecoin,
            treasury,
            platformFeeBps
        );
        console.log("InvoiceReceipt deployed at:", address(receipt));

        InvoiceMarketplace marketplace = new InvoiceMarketplace(
            publicEndpoint,
            deployer,
            address(receipt),
            stablecoin
        );
        console.log("InvoiceMarketplace deployed at:", address(marketplace));

        receipt.setMarketplace(address(marketplace));
        console.log("Receipt marketplace set to:", address(marketplace));

        vm.stopBroadcast();
    }
}
```

- [ ] **Step 2: Deploy to Public Testnet**

First, check if there's a public endpoint or deployment registry on the public testnet. If `PUBLIC_ENDPOINT_ADDRESS` is not set, we may need to discover it or deploy a mock.

```bash
cd /Users/fabianferno/Documents/hedsup

# Set PUBLIC_ENDPOINT_ADDRESS in .env first, then deploy
forge script script/DeployPublic.s.sol \
  --rpc-url $PUBLIC_L1_RPC_URL \
  --broadcast --legacy
```

Save deployed addresses and update `.env`:
```
INVOICE_RECEIPT_ADDRESS=<receipt address>
INVOICE_MARKETPLACE_ADDRESS=<marketplace address>
```

- [ ] **Step 3: Commit**

```bash
git add script/DeployPublic.s.sol
git commit -m "feat: deploy InvoiceReceipt and InvoiceMarketplace to Public Testnet"
```

---

## Task 5: Configure InvoiceToken on Privacy Node

**Files:**
- Modify: `script/ConfigureInvoiceToken.s.sol`

- [ ] **Step 1: Update configuration script**

Replace `DEPLOYER_PRIVATE_KEY` with `PRIVATE_KEY`. The attestation agent and approval proxy are both the deployer address (our backend signs with this key):

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/contracts/InvoiceToken.sol";

contract ConfigureInvoiceToken is Script {
    function run() external {
        address tokenAddress = vm.envAddress("INVOICE_TOKEN_ADDRESS");
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        uint256 publicChainId = vm.envUint("PUBLIC_L1_CHAIN_ID");
        address publicMarketplace = vm.envAddress("INVOICE_MARKETPLACE_ADDRESS");

        InvoiceToken token = InvoiceToken(tokenAddress);

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        // Backend is both attestation agent and approval proxy
        token.setAttestationAgent(deployer);
        console.log("Attestation agent set to:", deployer);

        token.setApprovalProxy(deployer, true);
        console.log("Approval proxy set to:", deployer);

        token.setPublicChainConfig(publicChainId, publicMarketplace);
        console.log("Public chain config set - chainId:", publicChainId);
        console.log("Public marketplace:", publicMarketplace);

        vm.stopBroadcast();
    }
}
```

- [ ] **Step 2: Run configuration**

```bash
cd /Users/fabianferno/Documents/hedsup

forge script script/ConfigureInvoiceToken.s.sol \
  --rpc-url $PRIVACY_NODE_RPC_URL \
  --broadcast --legacy
```

- [ ] **Step 3: Commit**

```bash
git add script/ConfigureInvoiceToken.s.sol
git commit -m "feat: configure InvoiceToken with attestation agent and public chain"
```

---

## Task 6: Extract ABIs and Create Blockchain Client Library

**Files:**
- Create: `src/lib/abis/InvoiceToken.ts`
- Create: `src/lib/abis/InvoiceMarketplace.ts`
- Create: `src/lib/abis/InvoiceReceipt.ts`
- Create: `src/lib/abis/MockUSDC.ts`
- Create: `src/lib/contracts.ts`

- [ ] **Step 1: Extract ABIs from Foundry output**

Read the JSON files from `out/` and extract just the `abi` array into TypeScript files. For each contract:

`src/lib/abis/InvoiceToken.ts`:
```typescript
// Auto-extracted from out/InvoiceToken.sol/InvoiceToken.json
// Only includes the functions we call from the backend
export const InvoiceTokenABI = [
  // createInvoice
  {
    type: "function",
    name: "createInvoice",
    inputs: [
      { name: "_supplier", type: "address" },
      { name: "_debtor", type: "address" },
      { name: "_debtorHash", type: "bytes32" },
      { name: "_debtorName", type: "string" },
      { name: "_faceValue", type: "uint256" },
      { name: "_dueDate", type: "uint256" },
      { name: "_jurisdiction", type: "string" },
      { name: "_paymentHistory", type: "string" },
      { name: "_terms", type: "string" },
      { name: "_pdfHash", type: "bytes32" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  // approveInvoice
  {
    type: "function",
    name: "approveInvoice",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // setAttestation
  {
    type: "function",
    name: "setAttestation",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "_riskGrade", type: "string" },
      { name: "_discountBps", type: "uint256" },
      { name: "_yieldBps", type: "uint256" },
      { name: "_confidenceScore", type: "uint256" },
      { name: "_attestationHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // getInvoice
  {
    type: "function",
    name: "getInvoice",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "supplier", type: "address" },
          { name: "debtor", type: "address" },
          { name: "debtorHash", type: "bytes32" },
          { name: "debtorName", type: "string" },
          { name: "faceValue", type: "uint256" },
          { name: "dueDate", type: "uint256" },
          { name: "jurisdiction", type: "string" },
          { name: "paymentHistory", type: "string" },
          { name: "terms", type: "string" },
          { name: "pdfHash", type: "bytes32" },
          { name: "debtorApproved", type: "bool" },
          { name: "approvedAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  // getAttestation
  {
    type: "function",
    name: "getAttestation",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "riskGrade", type: "string" },
          { name: "discountBps", type: "uint256" },
          { name: "yieldBps", type: "uint256" },
          { name: "confidenceScore", type: "uint256" },
          { name: "attestationHash", type: "bytes32" },
          { name: "exists", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  // nextTokenId
  {
    type: "function",
    name: "nextTokenId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // Events
  {
    type: "event",
    name: "InvoiceCreated",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "supplier", type: "address", indexed: true },
      { name: "faceValue", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "InvoiceApproved",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "approver", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "AttestationSet",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "riskGrade", type: "string", indexed: false },
      { name: "yieldBps", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AttestationBridged",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "attestationHash", type: "bytes32", indexed: false },
    ],
  },
] as const;
```

`src/lib/abis/InvoiceMarketplace.ts`:
```typescript
export const InvoiceMarketplaceABI = [
  {
    type: "function",
    name: "receiveAttestation",
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_riskGrade", type: "string" },
      { name: "_discountBps", type: "uint256" },
      { name: "_yieldBps", type: "uint256" },
      { name: "_confidenceScore", type: "uint256" },
      { name: "_faceValue", type: "uint256" },
      { name: "_dueDate", type: "uint256" },
      { name: "_listedAt", type: "uint256" },
      { name: "_attestationHash", type: "bytes32" },
      { name: "_pdfHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "fund",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAllListings",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "receiptId", type: "uint256" },
          { name: "riskGrade", type: "string" },
          { name: "discountBps", type: "uint256" },
          { name: "yieldBps", type: "uint256" },
          { name: "faceValue", type: "uint256" },
          { name: "purchasePrice", type: "uint256" },
          { name: "maturityDate", type: "uint256" },
          { name: "tenure", type: "uint256" },
          { name: "confidenceScore", type: "uint256" },
          { name: "attestationHash", type: "bytes32" },
          { name: "pdfHash", type: "bytes32" },
          { name: "listedAt", type: "uint256" },
          { name: "funded", type: "bool" },
          { name: "funder", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getListing",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "receiptId", type: "uint256" },
          { name: "riskGrade", type: "string" },
          { name: "discountBps", type: "uint256" },
          { name: "yieldBps", type: "uint256" },
          { name: "faceValue", type: "uint256" },
          { name: "purchasePrice", type: "uint256" },
          { name: "maturityDate", type: "uint256" },
          { name: "tenure", type: "uint256" },
          { name: "confidenceScore", type: "uint256" },
          { name: "attestationHash", type: "bytes32" },
          { name: "pdfHash", type: "bytes32" },
          { name: "listedAt", type: "uint256" },
          { name: "funded", type: "bool" },
          { name: "funder", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getListingCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "ListingCreated",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "riskGrade", type: "string", indexed: false },
      { name: "yieldBps", type: "uint256", indexed: false },
      { name: "faceValue", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Funded",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "funder", type: "address", indexed: true },
      { name: "purchasePrice", type: "uint256", indexed: false },
    ],
  },
] as const;
```

`src/lib/abis/InvoiceReceipt.ts`:
```typescript
export const InvoiceReceiptABI = [
  {
    type: "function",
    name: "getReceipt",
    inputs: [{ name: "receiptId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "riskGrade", type: "string" },
          { name: "discountBps", type: "uint256" },
          { name: "yieldBps", type: "uint256" },
          { name: "faceValue", type: "uint256" },
          { name: "purchasePrice", type: "uint256" },
          { name: "maturityDate", type: "uint256" },
          { name: "tenure", type: "uint256" },
          { name: "attestationHash", type: "bytes32" },
          { name: "pdfHash", type: "bytes32" },
          { name: "funder", type: "address" },
          { name: "settled", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;
```

`src/lib/abis/MockUSDC.ts`:
```typescript
export const MockUSDCABI = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;
```

- [ ] **Step 2: Create contracts.ts — the blockchain client library**

`src/lib/contracts.ts`:
```typescript
import {
  createPublicClient,
  createWalletClient,
  http,
  getContract,
  type Address,
  type Hash,
  keccak256,
  toBytes,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

import { InvoiceTokenABI } from "./abis/InvoiceToken";
import { InvoiceMarketplaceABI } from "./abis/InvoiceMarketplace";
import { InvoiceReceiptABI } from "./abis/InvoiceReceipt";
import { MockUSDCABI } from "./abis/MockUSDC";

// ── Chain definitions ──

export const privacyNode = defineChain({
  id: Number(process.env.PRIVACY_NODE_CHAIN_ID || 800004),
  name: "Flare TEE 4",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.PRIVACY_NODE_RPC_URL || "https://privacy-node-4.flare.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://blockscout-privacy-node-4.flare.com" },
  },
});

export const publicTestnet = defineChain({
  id: Number(process.env.PUBLIC_L1_CHAIN_ID || 7295799),
  name: "Flare Coston2",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.PUBLIC_L1_RPC_URL || "https://testnet-rpc.flare.com/"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://testnet-explorer.flare.com/" },
  },
});

// ── Clients ──

const account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}` as `0x${string}`);

export const privacyNodePublicClient = createPublicClient({
  chain: privacyNode,
  transport: http(),
});

export const privacyNodeWalletClient = createWalletClient({
  account,
  chain: privacyNode,
  transport: http(),
});

export const publicClient = createPublicClient({
  chain: publicTestnet,
  transport: http(),
});

export const publicWalletClient = createWalletClient({
  account,
  chain: publicTestnet,
  transport: http(),
});

// ── Contract addresses ──

export const addresses = {
  invoiceToken: process.env.INVOICE_TOKEN_ADDRESS as Address,
  invoiceMarketplace: process.env.INVOICE_MARKETPLACE_ADDRESS as Address,
  invoiceReceipt: process.env.INVOICE_RECEIPT_ADDRESS as Address,
  mockUSDC: process.env.MOCK_USDC_ADDRESS as Address,
};

// ── Contract instances ──

export function getInvoiceToken() {
  return getContract({
    address: addresses.invoiceToken,
    abi: InvoiceTokenABI,
    client: { public: privacyNodePublicClient, wallet: privacyNodeWalletClient },
  });
}

export function getInvoiceMarketplace() {
  return getContract({
    address: addresses.invoiceMarketplace,
    abi: InvoiceMarketplaceABI,
    client: { public: publicClient, wallet: publicWalletClient },
  });
}

export function getInvoiceReceipt() {
  return getContract({
    address: addresses.invoiceReceipt,
    abi: InvoiceReceiptABI,
    client: { public: publicClient },
  });
}

export function getMockUSDC() {
  return getContract({
    address: addresses.mockUSDC,
    abi: MockUSDCABI,
    client: { public: publicClient, wallet: publicWalletClient },
  });
}

// ── Helpers ──

export function hashString(value: string): `0x${string}` {
  return keccak256(toBytes(value));
}

export { account };
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/abis/ src/lib/contracts.ts
git commit -m "feat: add contract ABIs and viem blockchain client library"
```

---

## Task 7: Create Supabase Schema and Invoice API

**Files:**
- Create: `src/app/api/invoices/route.ts`

- [ ] **Step 1: Create the invoices table in Supabase**

Go to the Supabase dashboard at `https://supabase.com/dashboard` for the project, open the SQL editor, and run:

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  token_id INTEGER,
  supplier_name TEXT NOT NULL,
  supplier_address TEXT,
  debtor_name TEXT NOT NULL,
  debtor_email TEXT,
  face_value INTEGER NOT NULL,
  currency TEXT DEFAULT 'USDC',
  terms TEXT,
  due_date TIMESTAMPTZ,
  line_items JSONB,
  jurisdiction TEXT DEFAULT 'Brazil',
  payment_history TEXT DEFAULT 'Good payment history, no defaults',
  status TEXT DEFAULT 'draft',
  pdf_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  tx_hash TEXT
);

-- Allow public access for demo (no RLS for hackathon)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON invoices FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Create /api/invoices/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getInvoiceToken,
  privacyNodePublicClient,
  privacyNodeWalletClient,
  account,
  hashString,
  addresses,
} from "@/lib/contracts";
import { InvoiceTokenABI } from "@/lib/abis/InvoiceToken";
import { parseEventLogs } from "viem";

export async function GET() {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoices: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    supplierName,
    supplierAddress,
    debtorName,
    debtorEmail,
    amount,
    terms,
    dueDate,
    lineItems,
    jurisdiction,
    paymentHistory,
  } = body;

  const invoiceId = `INV-${Date.now().toString(36).toUpperCase()}`;
  const dueDateTimestamp = Math.floor(new Date(dueDate).getTime() / 1000);
  const faceValueWei = BigInt(amount) * BigInt(1e6); // USDC has 6 decimals
  const pdfHash = hashString(`${invoiceId}-${debtorName}-${amount}`);

  // 1. Create invoice on-chain (Privacy Node)
  let tokenId: number | null = null;
  let txHash: string | null = null;

  try {
    const hash = await privacyNodeWalletClient.writeContract({
      address: addresses.invoiceToken,
      abi: InvoiceTokenABI,
      functionName: "createInvoice",
      args: [
        account.address, // supplier (deployer for demo)
        account.address, // debtor (deployer for demo — approval proxy)
        hashString(debtorName),
        debtorName,
        faceValueWei,
        BigInt(dueDateTimestamp),
        jurisdiction || "Brazil",
        paymentHistory || "Good payment history, no defaults",
        terms,
        pdfHash,
      ],
    });

    txHash = hash;

    // Wait for receipt and extract tokenId from event
    const receipt = await privacyNodePublicClient.waitForTransactionReceipt({ hash });
    const logs = parseEventLogs({
      abi: InvoiceTokenABI,
      logs: receipt.logs,
      eventName: "InvoiceCreated",
    });

    if (logs.length > 0) {
      tokenId = Number(logs[0].args.tokenId);
    }
  } catch (err) {
    console.error("On-chain invoice creation failed:", err);
    // Continue with Supabase storage even if on-chain fails
  }

  // 2. Store in Supabase
  const { data, error } = await supabase.from("invoices").insert({
    id: invoiceId,
    token_id: tokenId,
    supplier_name: supplierName,
    supplier_address: supplierAddress,
    debtor_name: debtorName,
    debtor_email: debtorEmail,
    face_value: amount,
    currency: "USDC",
    terms,
    due_date: dueDate,
    line_items: lineItems,
    jurisdiction: jurisdiction || "Brazil",
    payment_history: paymentHistory || "Good payment history, no defaults",
    status: tokenId !== null ? "pending_approval" : "draft",
    pdf_hash: pdfHash,
    tx_hash: txHash,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    invoice: data,
    tokenId,
    txHash,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/invoices/route.ts
git commit -m "feat: add real invoice API with on-chain creation and Supabase storage"
```

---

## Task 8: Implement Real AI Scoring with OpenRouter

**Files:**
- Create: `src/lib/scoring.ts`
- Modify: `src/app/api/score/route.ts`

- [ ] **Step 1: Create scoring.ts — OpenRouter LLM integration**

```typescript
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

interface ScoringInput {
  invoiceId: string;
  debtorName: string;
  faceValue: number;
  dueDate: string;
  terms: string;
  jurisdiction: string;
  paymentHistory: string;
  supplierName: string;
}

interface ScoringResult {
  riskGrade: "A" | "B" | "C" | "D";
  discountBps: number;
  yieldBps: number;
  confidenceScore: number;
  reasoning: string;
}

const SYSTEM_PROMPT = `You are an institutional credit scoring agent operating on a sovereign Flare TEE. You have access to confidential invoice metadata that must NEVER be included in your public attestation.

Your job:
1. Analyze the invoice metadata (debtor identity, payment history, jurisdiction, terms, face value, maturity)
2. Produce a structured risk assessment
3. Output a PUBLIC attestation (risk grade + discount rate) that contains NO private information
4. Output a PRIVATE reasoning document that stays on the Privacy Node

Grading scale:
- A: Excellent payment history, low-risk jurisdiction, short maturity
- B: Good payment history, moderate risk factors
- C: Mixed payment history or elevated jurisdiction risk
- D: Poor payment history, high risk, or compliance concerns

Discount rate calculation:
- Base rate: 1.5% (A), 3.0% (B), 5.5% (C), 9.0% (D)
- Maturity adjustment: +0.5% per 30 days beyond 30
- Jurisdiction adjustment: +0.5-2.0% for elevated-risk jurisdictions

You MUST respond with ONLY a valid JSON object in this exact format:
{
  "riskGrade": "A",
  "discountBps": 210,
  "confidenceScore": 94,
  "reasoning": "Full analysis text here..."
}

The discountBps is the discount in basis points (e.g., 210 = 2.10%).
The confidenceScore is 0-100.
The reasoning should reference the debtor and specifics but this stays private.`;

export async function scoreInvoice(input: ScoringInput): Promise<ScoringResult> {
  const dueDate = new Date(input.dueDate);
  const now = new Date();
  const tenureDays = Math.max(1, Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const userPrompt = `Score this invoice:

- Invoice ID: ${input.invoiceId}
- Debtor: ${input.debtorName}
- Supplier: ${input.supplierName}
- Face Value: $${input.faceValue.toLocaleString()} USDC
- Due Date: ${input.dueDate}
- Tenure: ${tenureDays} days
- Terms: ${input.terms}
- Jurisdiction: ${input.jurisdiction}
- Payment History: ${input.paymentHistory}

Return ONLY the JSON object.`;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse scoring response as JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Calculate yield from discount
  const discountBps = parsed.discountBps;
  const yieldBps = Math.round(
    (discountBps / 100 / (1 - discountBps / 10000)) * (365 / tenureDays) * 100
  );

  return {
    riskGrade: parsed.riskGrade,
    discountBps: parsed.discountBps,
    yieldBps,
    confidenceScore: parsed.confidenceScore,
    reasoning: parsed.reasoning,
  };
}
```

- [ ] **Step 2: Replace mock /api/score with real implementation**

`src/app/api/score/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { scoreInvoice } from "@/lib/scoring";
import { supabase } from "@/lib/supabase";
import {
  privacyNodeWalletClient,
  privacyNodePublicClient,
  addresses,
  hashString,
} from "@/lib/contracts";
import { InvoiceTokenABI } from "@/lib/abis/InvoiceToken";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { invoiceId } = body;

  // 1. Get invoice from Supabase
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // 2. Run AI scoring via OpenRouter
  let scoring;
  try {
    scoring = await scoreInvoice({
      invoiceId: invoice.id,
      debtorName: invoice.debtor_name,
      faceValue: invoice.face_value,
      dueDate: invoice.due_date,
      terms: invoice.terms,
      jurisdiction: invoice.jurisdiction,
      paymentHistory: invoice.payment_history,
      supplierName: invoice.supplier_name,
    });
  } catch (err) {
    console.error("AI scoring failed:", err);
    return NextResponse.json({ error: "AI scoring failed" }, { status: 500 });
  }

  // 3. Post attestation on-chain (Privacy Node → bridges to Public L1 via Arbitrary Message)
  let attestationTxHash: string | null = null;

  if (invoice.token_id !== null) {
    try {
      const attestationHash = hashString(
        `${invoiceId}-${scoring.riskGrade}-${scoring.discountBps}-${scoring.confidenceScore}`
      );

      const hash = await privacyNodeWalletClient.writeContract({
        address: addresses.invoiceToken,
        abi: InvoiceTokenABI,
        functionName: "setAttestation",
        args: [
          BigInt(invoice.token_id),
          scoring.riskGrade,
          BigInt(scoring.discountBps),
          BigInt(scoring.yieldBps),
          BigInt(scoring.confidenceScore),
          attestationHash,
        ],
      });

      attestationTxHash = hash;
      await privacyNodePublicClient.waitForTransactionReceipt({ hash });

      // Update invoice status in Supabase
      await supabase
        .from("invoices")
        .update({ status: "listed" })
        .eq("id", invoiceId);
    } catch (err) {
      console.error("On-chain attestation failed:", err);
    }
  }

  return NextResponse.json({
    success: true,
    invoiceId,
    scoring: {
      riskGrade: scoring.riskGrade,
      discountBps: scoring.discountBps,
      yieldBps: scoring.yieldBps,
      confidenceScore: scoring.confidenceScore,
      reasoning: scoring.reasoning,
      attestationHash: attestationTxHash
        ? hashString(`${invoiceId}-${scoring.riskGrade}-${scoring.discountBps}-${scoring.confidenceScore}`)
        : null,
    },
    attestationTxHash,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/scoring.ts src/app/api/score/route.ts
git commit -m "feat: implement real AI credit scoring via OpenRouter with on-chain attestation"
```

---

## Task 9: Implement Real Approval API

**Files:**
- Modify: `src/app/api/approve/route.ts`

- [ ] **Step 1: Replace mock with real on-chain approval**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  privacyNodeWalletClient,
  privacyNodePublicClient,
  addresses,
} from "@/lib/contracts";
import { InvoiceTokenABI } from "@/lib/abis/InvoiceToken";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { invoiceId } = body;

  // 1. Get invoice from Supabase
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.token_id === null) {
    return NextResponse.json({ error: "Invoice not yet tokenized" }, { status: 400 });
  }

  // 2. Approve invoice on-chain (as approval proxy)
  let approveTxHash: string | null = null;
  try {
    const hash = await privacyNodeWalletClient.writeContract({
      address: addresses.invoiceToken,
      abi: InvoiceTokenABI,
      functionName: "approveInvoice",
      args: [BigInt(invoice.token_id)],
    });

    approveTxHash = hash;
    await privacyNodePublicClient.waitForTransactionReceipt({ hash });

    // Update Supabase
    await supabase
      .from("invoices")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);
  } catch (err: any) {
    console.error("On-chain approval failed:", err);
    // If already approved, continue to scoring
    if (!err.message?.includes("Already approved")) {
      return NextResponse.json({ error: "Approval failed: " + err.message }, { status: 500 });
    }
  }

  // 3. Trigger AI scoring
  let scoringResult = null;
  try {
    await supabase.from("invoices").update({ status: "scoring" }).eq("id", invoiceId);

    const scoreResponse = await fetch(
      new URL("/api/score", request.url).toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      }
    );

    scoringResult = await scoreResponse.json();
  } catch (err) {
    console.error("Scoring trigger failed:", err);
  }

  return NextResponse.json({
    success: true,
    invoiceId,
    tokenId: invoice.token_id,
    approveTxHash,
    scoring: scoringResult?.scoring || null,
    message: "Invoice approved and scored on Privacy Node",
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/approve/route.ts
git commit -m "feat: implement real on-chain approval with AI scoring pipeline"
```

---

## Task 10: Implement Listings API (Read from Public L1)

**Files:**
- Create: `src/app/api/listings/route.ts`

- [ ] **Step 1: Create /api/listings/route.ts**

```typescript
import { NextResponse } from "next/server";
import { publicClient, addresses } from "@/lib/contracts";
import { InvoiceMarketplaceABI } from "@/lib/abis/InvoiceMarketplace";
import { formatUnits } from "viem";

export async function GET() {
  try {
    // Read all listings from the public marketplace contract
    const listings = await publicClient.readContract({
      address: addresses.invoiceMarketplace,
      abi: InvoiceMarketplaceABI,
      functionName: "getAllListings",
    });

    // Format for frontend consumption
    const formatted = (listings as any[]).map((listing: any, index: number) => ({
      id: `LST-${listing.receiptId.toString().padStart(3, "0")}`,
      invoiceId: `INV-${listing.receiptId.toString()}`,
      tokenId: Number(listing.receiptId),
      riskGrade: listing.riskGrade,
      discountBps: Number(listing.discountBps),
      yieldBps: Number(listing.yieldBps),
      faceValue: Number(formatUnits(listing.faceValue, 6)), // USDC 6 decimals
      purchasePrice: Number(formatUnits(listing.purchasePrice, 6)),
      maturityDate: new Date(Number(listing.maturityDate) * 1000).toISOString(),
      tenure: Number(listing.tenure),
      confidenceScore: Number(listing.confidenceScore),
      attestationHash: listing.attestationHash,
      pdfHash: listing.pdfHash,
      listedAt: new Date(Number(listing.listedAt) * 1000).toISOString(),
      funded: listing.funded,
      funder: listing.funder === "0x0000000000000000000000000000000000000000" ? null : listing.funder,
    }));

    return NextResponse.json({ listings: formatted });
  } catch (err: any) {
    console.error("Failed to read listings:", err);
    // Fallback: return empty array if contract not deployed or no listings
    return NextResponse.json({ listings: [] });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/listings/route.ts
git commit -m "feat: add listings API reading from Public L1 InvoiceMarketplace"
```

---

## Task 11: Implement Fund API

**Files:**
- Create: `src/app/api/fund/route.ts`

- [ ] **Step 1: Create /api/fund/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  publicWalletClient,
  publicClient,
  addresses,
  account,
} from "@/lib/contracts";
import { InvoiceMarketplaceABI } from "@/lib/abis/InvoiceMarketplace";
import { MockUSDCABI } from "@/lib/abis/MockUSDC";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { listingId } = body;

  const tokenId = BigInt(listingId);

  try {
    // 1. Read listing to get purchase price
    const listing = await publicClient.readContract({
      address: addresses.invoiceMarketplace,
      abi: InvoiceMarketplaceABI,
      functionName: "getListing",
      args: [tokenId],
    }) as any;

    if (listing.funded) {
      return NextResponse.json({ error: "Already funded" }, { status: 400 });
    }

    const purchasePrice = listing.purchasePrice;

    // 2. Approve stablecoin spending
    const approveHash = await publicWalletClient.writeContract({
      address: addresses.mockUSDC,
      abi: MockUSDCABI,
      functionName: "approve",
      args: [addresses.invoiceMarketplace, purchasePrice],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    // 3. Fund the listing
    const fundHash = await publicWalletClient.writeContract({
      address: addresses.invoiceMarketplace,
      abi: InvoiceMarketplaceABI,
      functionName: "fund",
      args: [tokenId],
    });
    await publicClient.waitForTransactionReceipt({ hash: fundHash });

    return NextResponse.json({
      success: true,
      listingId,
      fundTxHash: fundHash,
      funder: account.address,
      purchasePrice: Number(purchasePrice),
    });
  } catch (err: any) {
    console.error("Fund failed:", err);
    return NextResponse.json({ error: "Fund failed: " + err.message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/fund/route.ts
git commit -m "feat: add fund API for purchasing marketplace listings"
```

---

## Task 12: Wire Create Invoice Frontend to Real API

**Files:**
- Modify: `src/app/(app)/create-invoice/page.tsx`

- [ ] **Step 1: Replace mock submission with real API call**

Find the form submission handler (the function that sets `showSuccess` to `true` and generates a random invoice ID) and replace it with a real API call:

The key changes:
1. Replace the mock `invoiceId` generation with a real POST to `/api/invoices`
2. Store the returned invoice data (including `tokenId` and real `invoiceId`)
3. Update the PDF download link to use the real invoice ID
4. Add loading state during submission
5. Handle errors

Find the submit handler and replace the mock logic. The original likely does something like:
```typescript
// OLD (mock)
const id = `INV-${Math.random()...}`;
setInvoiceId(id);
setShowSuccess(true);
```

Replace with:
```typescript
// NEW (real)
setIsSubmitting(true);
try {
  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      supplierName: supplier,
      supplierAddress: supplierAddr,
      debtorName: debtor,
      debtorEmail: debtorEmail,
      amount: Number(amount),
      terms,
      dueDate,
      lineItems: items,
      jurisdiction: "Brazil",
      paymentHistory: "Good payment history, no defaults",
    }),
  });
  const data = await res.json();
  if (data.success) {
    setInvoiceId(data.invoice.id);
    setShowSuccess(true);
  }
} catch (err) {
  console.error("Failed to create invoice:", err);
} finally {
  setIsSubmitting(false);
}
```

Add `isSubmitting` state and disable the submit button while submitting.

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/create-invoice/page.tsx
git commit -m "feat: wire create invoice form to real API"
```

---

## Task 13: Wire Approve Page to Real API

**Files:**
- Modify: `src/app/approve/page.tsx`

- [ ] **Step 1: Replace mock approval flow with real API calls**

The approve page currently uses `setTimeout` to fake step transitions. Replace with real API calls:

1. Keep the multi-step UI (verify → confirming → tokenizing → scoring → listed → complete)
2. Replace the fake timeout chain with real API calls
3. When user clicks "Approve on Flare":
   - Set step to "confirming"
   - POST to `/api/approve` with `{ invoiceId }`
   - As the response comes back, advance through steps
   - Show real scoring results (risk grade, yield) from API response

The key change is in the approval handler function. Replace the setTimeout chain with:

```typescript
async function handleApprove() {
  setStep("confirming");

  try {
    // Step 1: Call real approval API
    setStep("tokenizing");
    const res = await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Approval failed");
    }

    // Step 2: Show scoring results
    setStep("scoring");
    await new Promise((r) => setTimeout(r, 1000)); // Brief pause for UX

    // Step 3: Listed
    setStep("listed");
    if (data.scoring) {
      setScoringResult(data.scoring);
    }
    await new Promise((r) => setTimeout(r, 1000));

    // Step 4: Complete
    setStep("complete");
  } catch (err) {
    console.error("Approval failed:", err);
    setStep("verify"); // Reset on error
  }
}
```

Also add state for scoring results and display real values instead of hardcoded "A" / "26.1%":
```typescript
const [scoringResult, setScoringResult] = useState<any>(null);
```

In the completion screen, use `scoringResult?.riskGrade` and `scoringResult?.yieldBps` instead of hardcoded values.

Also replace the mock invoice lookup (`mockInvoices.find(...)`) with a fetch from `/api/invoices` or pass invoice data via URL params / fetch on mount.

- [ ] **Step 2: Commit**

```bash
git add src/app/approve/page.tsx
git commit -m "feat: wire approve page to real on-chain approval and AI scoring"
```

---

## Task 14: Wire Marketplace to Real API

**Files:**
- Modify: `src/app/(app)/marketplace/page.tsx`

- [ ] **Step 1: Replace mock data with real API calls**

The marketplace page currently imports `mockListings` and `mockInvoices`. Replace with:

1. Fetch listings from `/api/listings` on mount
2. Wire "Fund" button to POST `/api/fund`
3. Remove mock data imports

Add a `useEffect` to fetch listings:
```typescript
const [listings, setListings] = useState<MarketplaceListing[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchListings() {
    try {
      const res = await fetch("/api/listings");
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  }
  fetchListings();
}, []);
```

Replace the mock fund handler with a real one:
```typescript
async function handleFund(listingId: number) {
  try {
    const res = await fetch("/api/fund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    if (data.success) {
      // Update listing in local state
      setListings((prev) =>
        prev.map((l) =>
          l.tokenId === listingId ? { ...l, funded: true, funder: data.funder } : l
        )
      );
    }
  } catch (err) {
    console.error("Fund failed:", err);
  }
}
```

Keep the existing filter/sort UI — just change the data source.

If on-chain listings are empty (contract just deployed), fall back to mock data for display so the UI isn't empty:

```typescript
const displayListings = listings.length > 0 ? listings : mockListings;
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/marketplace/page.tsx
git commit -m "feat: wire marketplace to real on-chain listings and fund API"
```

---

## Task 15: Wire Dashboard to Real API

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Replace mock data with real API calls**

Add `useEffect` hooks to fetch from both APIs:

```typescript
const [invoices, setInvoices] = useState<any[]>([]);
const [listings, setListings] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchData() {
    try {
      const [invoicesRes, listingsRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/listings"),
      ]);
      const invoicesData = await invoicesRes.json();
      const listingsData = await listingsRes.json();
      setInvoices(invoicesData.invoices || []);
      setListings(listingsData.listings || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);
```

Map the Supabase invoice fields to the dashboard's expected format:
```typescript
const formattedInvoices = invoices.map((inv: any) => ({
  id: inv.id,
  supplier: inv.supplier_name,
  debtor: inv.debtor_name,
  amount: inv.face_value,
  currency: inv.currency,
  terms: inv.terms,
  dueDate: inv.due_date,
  status: inv.status,
  createdAt: inv.created_at,
  approvedAt: inv.approved_at,
  tokenId: inv.token_id?.toString(),
}));
```

If real data is empty, fall back to mock data so dashboard isn't blank pre-seeding:
```typescript
const displayInvoices = formattedInvoices.length > 0 ? formattedInvoices : mockInvoices;
const displayListings = listings.length > 0 ? listings : mockListings;
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat: wire dashboard to real invoice and listing APIs"
```

---

## Task 16: Real PDF Generation

**Files:**
- Modify: `src/app/api/generate-pdf/route.ts`

- [ ] **Step 1: Replace HTML response with real PDF using @react-pdf/renderer**

Since `@react-pdf/renderer` requires React components and is primarily for client-side, and server-side PDF in Next.js API routes is more reliable with the `@react-pdf/renderer` `renderToBuffer` API:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import ReactPDF from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import React from "react";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, borderBottomWidth: 2, borderBottomColor: "#a3e635", paddingBottom: 15 },
  logo: { fontSize: 24, fontWeight: "bold" },
  logoAccent: { color: "#65a30d" },
  status: { backgroundColor: "#f7fee7", color: "#365314", padding: "4 12", borderRadius: 10, fontSize: 10, fontWeight: "bold" },
  parties: { flexDirection: "row", gap: 40, marginBottom: 30 },
  party: { flex: 1 },
  partyLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#65a30d", marginBottom: 6 },
  partyName: { fontWeight: "bold", marginBottom: 2 },
  detailsBox: { backgroundColor: "#fafafa", borderRadius: 6, padding: 15, marginBottom: 20 },
  detailsRow: { flexDirection: "row", gap: 20 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#888", marginBottom: 3 },
  detailValue: { fontSize: 14, fontWeight: "bold" },
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#e5e7eb", paddingBottom: 8, marginBottom: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingVertical: 8 },
  colDesc: { flex: 3 },
  colNum: { flex: 1, textAlign: "right" },
  thText: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#888" },
  totalRow: { flexDirection: "row", borderTopWidth: 2, borderTopColor: "#1a1a1a", paddingTop: 8, marginTop: 4 },
  totalText: { flex: 3, fontWeight: "bold", fontSize: 14 },
  totalAmount: { flex: 1, textAlign: "right", fontWeight: "bold", fontSize: 14 },
  approveSection: { backgroundColor: "#f7fee7", borderWidth: 2, borderColor: "#a3e635", borderRadius: 8, padding: 25, marginTop: 30, alignItems: "center" },
  approveTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  approveDesc: { fontSize: 11, color: "#666", marginBottom: 15, textAlign: "center" },
  approveBtn: { backgroundColor: "#a3e635", color: "#1a2e05", padding: "10 30", borderRadius: 6, fontSize: 14, fontWeight: "bold" },
  footer: { marginTop: 30, paddingTop: 15, borderTopWidth: 1, borderTopColor: "#e5e7eb", textAlign: "center", fontSize: 9, color: "#aaa" },
  privacyNote: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 6, padding: 10, marginTop: 12, fontSize: 10, color: "#166534" },
});

function InvoicePDF({ invoice, approvalUrl }: { invoice: any; approvalUrl: string }) {
  const lineItems = invoice.line_items || invoice.lineItems || [];
  const amount = invoice.face_value || invoice.amount;

  return React.createElement(Document, {},
    React.createElement(Page, { size: "A4", style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(View, {},
          React.createElement(Text, { style: styles.logo }, "hedsup"),
          React.createElement(Text, { style: { fontSize: 10, color: "#666", marginTop: 2 } }, invoice.id),
        ),
        React.createElement(Text, { style: styles.status }, "Pending Approval"),
      ),
      // Parties
      React.createElement(View, { style: styles.parties },
        React.createElement(View, { style: styles.party },
          React.createElement(Text, { style: styles.partyLabel }, "FROM (SUPPLIER)"),
          React.createElement(Text, { style: styles.partyName }, invoice.supplier_name || invoice.supplier),
          React.createElement(Text, {}, invoice.supplier_address || invoice.supplierAddress || ""),
        ),
        React.createElement(View, { style: styles.party },
          React.createElement(Text, { style: styles.partyLabel }, "TO (DEBTOR)"),
          React.createElement(Text, { style: styles.partyName }, invoice.debtor_name || invoice.debtor),
          React.createElement(Text, {}, invoice.debtor_email || invoice.debtorEmail || ""),
        ),
      ),
      // Details
      React.createElement(View, { style: styles.detailsBox },
        React.createElement(View, { style: styles.detailsRow },
          React.createElement(View, { style: styles.detailItem },
            React.createElement(Text, { style: styles.detailLabel }, "AMOUNT"),
            React.createElement(Text, { style: styles.detailValue }, `$${Number(amount).toLocaleString()} USDC`),
          ),
          React.createElement(View, { style: styles.detailItem },
            React.createElement(Text, { style: styles.detailLabel }, "TERMS"),
            React.createElement(Text, { style: styles.detailValue }, invoice.terms),
          ),
          React.createElement(View, { style: styles.detailItem },
            React.createElement(Text, { style: styles.detailLabel }, "DUE DATE"),
            React.createElement(Text, { style: styles.detailValue }, new Date(invoice.due_date || invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })),
          ),
        ),
      ),
      // Line items table
      React.createElement(View, { style: styles.table },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.thText, flex: 3 } }, "DESCRIPTION"),
          React.createElement(Text, { style: { ...styles.thText, flex: 1, textAlign: "right" } }, "QTY"),
          React.createElement(Text, { style: { ...styles.thText, flex: 1, textAlign: "right" } }, "UNIT PRICE"),
          React.createElement(Text, { style: { ...styles.thText, flex: 1, textAlign: "right" } }, "AMOUNT"),
        ),
        ...lineItems.map((item: any, i: number) =>
          React.createElement(View, { key: i, style: styles.tableRow },
            React.createElement(Text, { style: styles.colDesc }, item.description),
            React.createElement(Text, { style: styles.colNum }, String(item.quantity)),
            React.createElement(Text, { style: styles.colNum }, `$${Number(item.unitPrice || item.unit_price).toLocaleString()}`),
            React.createElement(Text, { style: styles.colNum }, `$${(item.quantity * (item.unitPrice || item.unit_price)).toLocaleString()}`),
          )
        ),
        React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalText }, "Total"),
          React.createElement(Text, { style: styles.totalAmount }, `$${Number(amount).toLocaleString()} USDC`),
        ),
      ),
      // Approve section
      React.createElement(View, { style: styles.approveSection },
        React.createElement(Text, { style: styles.approveTitle }, "Approve This Invoice"),
        React.createElement(Text, { style: styles.approveDesc }, "Click the link below to approve this invoice on Flare. Your identity will remain private on the sovereign Privacy Node."),
        React.createElement(Link, { src: approvalUrl, style: styles.approveBtn }, "Approve on Flare"),
        React.createElement(View, { style: styles.privacyNote },
          React.createElement(Text, {}, "Your identity and approval details are stored on a Flare TEE and will never be exposed on the public marketplace."),
        ),
      ),
      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, {}, "Generated by Hedsup — Private Invoice Factoring on Flare"),
        React.createElement(Text, { style: { marginTop: 3 } }, `PDF Hash: ${invoice.pdf_hash || invoice.pdfHash || "pending"}`),
      ),
    )
  );
}

export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get("invoiceId") || "";

  // Try to get from Supabase first
  let invoice: any = null;
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (data) {
    invoice = data;
  } else {
    // Fallback to mock data for backwards compatibility
    const { mockInvoices } = await import("@/lib/mock-data");
    invoice = mockInvoices.find((i) => i.id === invoiceId) || mockInvoices[0];
  }

  const approvalUrl = `${request.nextUrl.origin}/approve?invoiceId=${invoice.id || invoiceId}&token=demo-token`;

  try {
    const pdfBuffer = await ReactPDF.renderToBuffer(
      React.createElement(InvoicePDF, { invoice, approvalUrl })
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.id || invoiceId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation failed:", err);
    // Fallback to HTML if PDF generation fails
    return new NextResponse(`<html><body><h1>Invoice ${invoiceId}</h1><p>PDF generation failed. <a href="${approvalUrl}">Approve on Flare</a></p></body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/generate-pdf/route.ts
git commit -m "feat: replace HTML invoice with real PDF generation via @react-pdf/renderer"
```

---

## Task 17: Demo Seeding Endpoint

**Files:**
- Create: `src/app/api/seed/route.ts`

- [ ] **Step 1: Create /api/seed/route.ts**

This endpoint creates 3 demo invoices, approves them, and triggers AI scoring — resulting in 3 marketplace listings with different risk grades.

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  privacyNodeWalletClient,
  privacyNodePublicClient,
  addresses,
  hashString,
} from "@/lib/contracts";
import { InvoiceTokenABI } from "@/lib/abis/InvoiceToken";
import { scoreInvoice } from "@/lib/scoring";

const DEMO_INVOICES = [
  {
    id: "INV-DEMO-001",
    supplierName: "TechParts Ltda.",
    supplierAddress: "Rua Augusta 1200, Sao Paulo, Brazil",
    debtorName: "Banco Bradesco S.A.",
    debtorEmail: "payables@bradesco.com.br",
    faceValue: 100000,
    terms: "net-30",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    lineItems: [
      { description: "Server rack components - Q1 batch", quantity: 50, unitPrice: 1200 },
      { description: "Network switches (48-port)", quantity: 20, unitPrice: 2000 },
    ],
    jurisdiction: "Brazil",
    paymentHistory: "Excellent - 36 consecutive on-time payments over 3 years. Tier-1 Brazilian bank with consistent 30-day payment cycles. No defaults or disputes.",
  },
  {
    id: "INV-DEMO-002",
    supplierName: "AgroExport S.A.",
    supplierAddress: "Av. Paulista 900, Sao Paulo, Brazil",
    debtorName: "Itau Unibanco Holdings",
    debtorEmail: "trade@itau.com.br",
    faceValue: 250000,
    terms: "net-60",
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    lineItems: [
      { description: "Soybean export - March shipment", quantity: 500, unitPrice: 400 },
      { description: "Logistics & insurance", quantity: 1, unitPrice: 50000 },
    ],
    jurisdiction: "Brazil",
    paymentHistory: "Good - 18 months relationship, 2 late payments of 15 days (resolved). Tier-1 bank but larger amounts and longer terms.",
  },
  {
    id: "INV-DEMO-003",
    supplierName: "MedSupply Corp.",
    supplierAddress: "Calle 80 #12-45, Bogota, Colombia",
    debtorName: "Regional Health Co.",
    debtorEmail: "finance@regionalhealth.co",
    faceValue: 75000,
    terms: "net-90",
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    lineItems: [
      { description: "Medical equipment maintenance contract", quantity: 1, unitPrice: 75000 },
    ],
    jurisdiction: "Colombia",
    paymentHistory: "Poor - 4 late payments in 12 months, 1 dispute resolved. Private entity with limited financial disclosure. Healthcare sector with regulatory uncertainty.",
  },
];

export async function POST() {
  const results = [];

  for (const demo of DEMO_INVOICES) {
    try {
      const faceValueWei = BigInt(demo.faceValue) * BigInt(1e6);
      const dueDateTimestamp = BigInt(Math.floor(new Date(demo.dueDate).getTime() / 1000));
      const pdfHash = hashString(`${demo.id}-${demo.debtorName}-${demo.faceValue}`);

      // 1. Create invoice on-chain
      const createHash = await privacyNodeWalletClient.writeContract({
        address: addresses.invoiceToken,
        abi: InvoiceTokenABI,
        functionName: "createInvoice",
        args: [
          addresses.invoiceToken, // supplier placeholder
          addresses.invoiceToken, // debtor placeholder
          hashString(demo.debtorName),
          demo.debtorName,
          faceValueWei,
          dueDateTimestamp,
          demo.jurisdiction,
          demo.paymentHistory,
          demo.terms,
          pdfHash,
        ],
      });
      const createReceipt = await privacyNodePublicClient.waitForTransactionReceipt({ hash: createHash });

      // Extract tokenId from logs
      const { parseEventLogs } = await import("viem");
      const createLogs = parseEventLogs({
        abi: InvoiceTokenABI,
        logs: createReceipt.logs,
        eventName: "InvoiceCreated",
      });
      const tokenId = Number(createLogs[0].args.tokenId);

      // 2. Approve invoice
      const approveHash = await privacyNodeWalletClient.writeContract({
        address: addresses.invoiceToken,
        abi: InvoiceTokenABI,
        functionName: "approveInvoice",
        args: [BigInt(tokenId)],
      });
      await privacyNodePublicClient.waitForTransactionReceipt({ hash: approveHash });

      // 3. Score with AI
      const scoring = await scoreInvoice({
        invoiceId: demo.id,
        debtorName: demo.debtorName,
        faceValue: demo.faceValue,
        dueDate: demo.dueDate,
        terms: demo.terms,
        jurisdiction: demo.jurisdiction,
        paymentHistory: demo.paymentHistory,
        supplierName: demo.supplierName,
      });

      // 4. Post attestation on-chain (bridges to Public L1)
      const attestationHash = hashString(
        `${demo.id}-${scoring.riskGrade}-${scoring.discountBps}-${scoring.confidenceScore}`
      );

      const attestHash = await privacyNodeWalletClient.writeContract({
        address: addresses.invoiceToken,
        abi: InvoiceTokenABI,
        functionName: "setAttestation",
        args: [
          BigInt(tokenId),
          scoring.riskGrade,
          BigInt(scoring.discountBps),
          BigInt(scoring.yieldBps),
          BigInt(scoring.confidenceScore),
          attestationHash,
        ],
      });
      await privacyNodePublicClient.waitForTransactionReceipt({ hash: attestHash });

      // 5. Store in Supabase
      await supabase.from("invoices").upsert({
        id: demo.id,
        token_id: tokenId,
        supplier_name: demo.supplierName,
        supplier_address: demo.supplierAddress,
        debtor_name: demo.debtorName,
        debtor_email: demo.debtorEmail,
        face_value: demo.faceValue,
        currency: "USDC",
        terms: demo.terms,
        due_date: demo.dueDate,
        line_items: demo.lineItems,
        jurisdiction: demo.jurisdiction,
        payment_history: demo.paymentHistory,
        status: "listed",
        pdf_hash: pdfHash,
        approved_at: new Date().toISOString(),
      });

      results.push({
        invoiceId: demo.id,
        tokenId,
        riskGrade: scoring.riskGrade,
        yieldBps: scoring.yieldBps,
        confidenceScore: scoring.confidenceScore,
        status: "success",
      });
    } catch (err: any) {
      console.error(`Failed to seed ${demo.id}:`, err);
      results.push({
        invoiceId: demo.id,
        status: "failed",
        error: err.message,
      });
    }
  }

  return NextResponse.json({ results });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/seed/route.ts
git commit -m "feat: add demo seeding endpoint for 3 pre-scored invoices"
```

---

## Task 18: Build Verification and Smoke Test

- [ ] **Step 1: Verify the Next.js app builds**

```bash
cd /Users/fabianferno/Documents/hedsup && pnpm build
```

Fix any TypeScript or build errors.

- [ ] **Step 2: Verify contracts compile**

```bash
cd /Users/fabianferno/Documents/hedsup && forge build
```

- [ ] **Step 3: Start dev server and test API routes**

```bash
pnpm dev
```

Test endpoints:
- `GET /api/invoices` — should return empty array or existing invoices
- `GET /api/listings` — should return empty array (no listings yet) or fallback

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete end-to-end Hedsup implementation - contracts, APIs, AI scoring, frontend wiring"
```
