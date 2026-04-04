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
