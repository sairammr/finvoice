# Hedsup End-to-End Implementation Design

## Overview

Wire the existing Hedsup UI prototype to real smart contracts, AI scoring, and blockchain reads/writes. The app has a complete frontend and 3 Solidity contracts — this spec covers deploying, configuring, and connecting everything.

## Architecture

```
Browser (Next.js)
  ├── /create-invoice  → POST /api/invoices (store in Supabase) → generate PDF
  ├── /approve         → POST /api/approve  (call InvoiceToken on Privacy Node)
  ├── /marketplace     → GET  /api/listings (read InvoiceMarketplace on Public L1)
  └── /dashboard       → GET  /api/invoices + /api/listings (both chains)

API Routes (server-side, holds PRIVATE_KEY)
  ├── /api/invoices    → Supabase CRUD + InvoiceToken.createInvoice()
  ├── /api/approve     → InvoiceToken.approveInvoice() → /api/score
  ├── /api/score       → OpenRouter LLM → InvoiceToken.setAttestation() → bridges via Arbitrary Message
  ├── /api/listings    → InvoiceMarketplace.getAllListings() on Public L1
  ├── /api/fund        → InvoiceMarketplace.fund() (for demo, server-side signing)
  └── /api/generate-pdf → @react-pdf/renderer real PDF

Chains
  ├── Privacy Node (800004) — InvoiceToken (ERC-1155)
  └── Public Testnet (7295799) — InvoiceMarketplace + InvoiceReceipt
```

## Phase 1: Contract Deployment

Deploy all 3 contracts using existing Foundry scripts. The deployment scripts use `DEPLOYER_PRIVATE_KEY` — we'll map that to `PRIVATE_KEY` from .env.

1. Deploy InvoiceToken to Privacy Node (chain 800004, gasless, --legacy flag)
2. Deploy InvoiceReceipt + InvoiceMarketplace to Public Testnet (chain 7295799)
3. Configure InvoiceToken: set attestation agent, approval proxy, public chain config

For the public chain deployment, we need a stablecoin address. For MVP/demo we'll deploy a simple MockUSDC ERC-20 on the public testnet. Treasury = deployer address.

### New contract: MockUSDC.sol
Simple ERC-20 with public mint function for demo purposes. Deploy to Public Testnet only.

## Phase 2: Blockchain Client Library

Create `src/lib/contracts.ts` with:
- viem clients for both chains (Privacy Node + Public Testnet)
- Contract ABIs (generated from Foundry compilation)
- Server-side wallet client using PRIVATE_KEY
- Read/write helpers for each contract function

## Phase 3: Real API Routes

### POST /api/invoices
- Store invoice in Supabase `invoices` table
- Call `InvoiceToken.createInvoice()` on Privacy Node
- Return invoice ID + token ID

### POST /api/approve
- Validate invoiceId exists in Supabase
- Call `InvoiceToken.approveInvoice()` on Privacy Node (as approval proxy)
- Trigger scoring: call POST /api/score internally
- Return tx hash + scoring results

### POST /api/score
- Read invoice metadata from Supabase (debtor name, payment history, jurisdiction, terms)
- Call OpenRouter API with credit scoring system prompt from PRD
- Parse LLM response into structured attestation (grade, discount, yield, confidence)
- Call `InvoiceToken.setAttestation()` on Privacy Node — this automatically bridges to Public L1 via Arbitrary Message
- Return scoring results

### GET /api/listings
- Call `InvoiceMarketplace.getAllListings()` on Public L1
- Return formatted listing data

### POST /api/fund
- Call `InvoiceMarketplace.fund()` on Public L1 (server-side for demo)
- First approve stablecoin spending if needed
- Return tx hash

### GET /api/generate-pdf
- Use @react-pdf/renderer to generate actual downloadable PDF
- Include "Approve on Flare" button as a clickable link

## Phase 4: Frontend Wiring

Replace all mock data imports with real API calls:

- **create-invoice/page.tsx**: POST to /api/invoices on submit, download real PDF
- **approve/page.tsx**: POST to /api/approve, show real tx progress
- **marketplace/page.tsx**: GET /api/listings, POST /api/fund on fund button
- **dashboard/page.tsx**: GET /api/invoices + /api/listings for real data

## Phase 5: Demo Seeding

Create a seeding script/API route that:
1. Creates 3 invoices on-chain with different risk profiles
2. Approves them
3. Scores them (triggers AI + attestation bridging)
4. Results in 3 marketplace listings with grades A, B, D

## Supabase Schema

```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  token_id INTEGER,
  supplier_name TEXT,
  supplier_address TEXT,
  debtor_name TEXT,
  debtor_email TEXT,
  face_value INTEGER,
  currency TEXT DEFAULT 'USDC',
  terms TEXT,
  due_date TIMESTAMPTZ,
  line_items JSONB,
  jurisdiction TEXT,
  payment_history TEXT,
  status TEXT DEFAULT 'draft',
  pdf_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  tx_hash TEXT
);
```

## Key Decisions

- **Server-side signing for all contract calls**: The backend holds the private key and acts as both approval proxy and attestation agent. No wallet connection needed for suppliers/debtors (per PRD: "no wallets needed").
- **OpenRouter for AI scoring**: Uses `NEXT_PUBLIC_OPENROUTER_API_KEY` (note: should be server-only, rename to `OPENROUTER_API_KEY`).
- **MockUSDC for demo**: Deploy a mintable ERC-20 for stablecoin on public testnet.
- **Supabase for off-chain state**: Stores invoice metadata for quick reads; on-chain is source of truth.
- **viem over ethers**: Lighter, better TypeScript support, tree-shakeable.

## Out of Scope

- Real authentication (keep role switcher)
- Settlement at maturity (simulate)
- Email notifications
- Wallet connection for end users
- Error recovery / retry logic
