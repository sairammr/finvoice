# Finvoice

**Private invoice factoring powered by Flare TEE + Hedera HTS + HCS**

> _Three trillion dollar market. One click._

Invoice factoring — where businesses sell unpaid invoices for immediate cash — is a **$3.1 trillion market** still running on faxed PDFs and blind trust. Legacy platforms tokenize invoices without debtor consent, leak private business relationships on-chain, and force users through MetaMask flows nobody wants.

**Finvoice fixes all three.** Suppliers create invoices, debtors approve via a one-click PDF (no wallet needed), an AI agent scores credit risk privately inside a Flare TEE, and funders earn yield on a public marketplace — all while debtor identities remain completely private.

Here's the judge-ready pitch:

---

**Finvoice** tackles one of the most overlooked inefficiencies in global finance: small businesses sitting on unpaid invoices, unable to access the capital they're already owed — because traditional invoice factoring demands full transparency into their customer relationships. Handing over debtor names, payment histories, and financials to a bank or middleman is a dealbreaker for most SMBs. Finvoice eliminates that tradeoff entirely.

The core innovation is a fully private invoice factoring pipeline built across two blockchains. Debtor identity is ECIES-encrypted client-side before anything touches a ledger. Credit scoring runs inside a **Flare TEE** (Trusted Execution Environment) — meaning an AI model evaluates the invoice using real debtor data, inside a cryptographic enclave, and the identity never escapes. What comes out is a signed, TEE-attested risk grade (A–D) and yield rate, minted as an **Attestation NFT on Hedera**. Funders see the grade. Nobody sees the debtor.

The architecture is just as bold as the privacy model. There is no traditional database — zero Postgres, zero MongoDB. All application state lives on **Hedera Consensus Service topics** as encrypted append-only event logs, replayed into memory on startup. Invoices and receipts are tokenized as Hedera NFTs using pure `@hashgraph/sdk`. Debtors approve via a one-click PDF email link — no wallet, no blockchain knowledge required. Auth is handled by Dynamic.xyz, bridging EVM and Hedera wallets in a single session across Flare Coston2 and Hedera Testnet.

Finvoice proves that real-world asset tokenization doesn't have to sacrifice privacy. The entire invoice lifecycle — creation, debtor approval, AI scoring, marketplace listing, funding, and settlement — runs with cryptographic guarantees at every step, on live deployed infrastructure, with zero traditional backend. It's a complete, production-grade DeFi primitive for a $3.5 trillion market that's never had a privacy-preserving alternative.

## How It Works

1. **Supplier** creates an invoice with line items, debtor details, and payment terms
2. **Debtor** receives a PDF and clicks "Approve on Flare" — OTP-verified, no wallet, no dApp
3. **AI Agent** scores credit risk privately inside a Flare Trusted Execution Environment (TEE)
4. **Attestation NFT** is minted on Hedera with only the risk grade (A-D), yield, and confidence — no debtor PII
5. **Funder** browses the marketplace, funds an invoice with HBAR, receives a Receipt NFT
6. **At maturity**, the debtor pays face value, funder receives payout, Receipt NFT is burned

The primitive: **PDF onramp.** That one click tokenizes the invoice on-chain and kicks off the entire pipeline. TradFi UX, DeFi rails.

## Architecture

```
Supplier → Next.js API → Flare TEE (Coston2) → Hedera HTS + HCS (Testnet)
                ↓               ↓                      ↓
          HCS Event Store   Private AI scoring    Public NFTs + Audit Log
       (encrypted debtor PII)  (inside TEE only)   (risk grade + hash only)
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Private Ledger** | Flare Confidential Compute (TEE) | Private invoice data, AI credit scoring inside hardware enclave |
| **Public Ledger (Tokens)** | Hedera Token Service (HTS SDK) | Attestation NFTs, Receipt NFTs — zero Solidity on Hedera |
| **Public Ledger (Storage)** | Hedera Consensus Service (HCS) | Decentralized event store — no database, state rebuilt from HCS replay |
| **Encryption** | ECIES (secp256k1 + ED25519) | Debtor PII encrypted before HCS submission |
| **AI Scoring** | GPT-4o-mini | Credit scoring with risk grades A-D, discount rates, confidence scores |
| **Auth** | Dynamic.xyz | Wallet connection + social login for all user types |

## What Makes It Different

- **No database** — All state lives on Hedera HCS topics. Server rebuilds state from HCS replay on startup. No MongoDB, no Postgres, no off-chain storage.
- **No Solidity on Hedera** — Pure SDK: `TokenCreateTransaction`, `TokenMintTransaction`, `TopicMessageSubmitTransaction`. Zero smart contracts deployed on Hedera.
- **Only 1 Solidity contract** — `InvoiceInstructionSender.sol` on Flare Coston2, sends instructions to the TEE.
- **Privacy by default** — Debtor name, email, payment history never appear on any blockchain. Only risk grades and hashes are public.
- **TEE-attested scoring** — AI scoring runs inside Flare's Trusted Execution Environment. Results are signed by the TEE key. Private data never leaves the enclave.
- **PDF onramp** — Debtors approve invoices through a regular PDF with OTP verification. No wallet, no dApp, no blockchain knowledge required.

## Deployed Contracts & Infrastructure

### Flare Coston2 (Chain ID: 114)

| Component | Address / ID | Link |
|-----------|-------------|------|
| **InvoiceInstructionSender** | `0x616c83ff35d0a9572efb02246ee712a8d062f44b` | [Coston2 Explorer](https://coston2-explorer.flare.network/address/0x616c83ff35d0a9572efb02246ee712a8d062f44b) |
| **TEE Extension** | ID 251 — PRODUCTION status | Registered via `TeeExtensionRegistry` |
| **TEE Machine** | `0x3910586391288d1Cf5212CAee4956e5087948726` | 442 data provider signatures verified |
| **Operator Wallet** | `0x4e9Ff472Ce73a46b91E42f06B940F34F1BDBb83f` | [Explorer](https://coston2-explorer.flare.network/address/0x4e9Ff472Ce73a46b91E42f06B940F34F1BDBb83f) |

### Hedera Testnet

| Component | Token / Topic ID | Link |
|-----------|-----------------|------|
| **Attestation NFT Collection** | `0.0.8509042` (RATTEST) | [HashScan](https://hashscan.io/testnet/token/0.0.8509042) |
| **Receipt NFT Collection** | `0.0.8509043` (RRECEIPT) | [HashScan](https://hashscan.io/testnet/token/0.0.8509043) |
| **Invoice HCS Topic** | `0.0.8511510` | [HashScan](https://hashscan.io/testnet/topic/0.0.8511510) |
| **Session HCS Topic** | `0.0.8511512` | [HashScan](https://hashscan.io/testnet/topic/0.0.8511512) |
| **Operator Account** | `0.0.5864744` (ED25519) | [HashScan](https://hashscan.io/testnet/account/0.0.5864744) |

### Key Contract Addresses Used (Flare Coston2)

| Contract | Address |
|----------|---------|
| TeeExtensionRegistry | `0x3d478d43426081BD5854be9C7c5c183bfe76C981` |
| TeeMachineRegistry | `0x5918Cd58e5caf755b8584649Aa24077822F87613` |
| TeeVerification | `0x4D504e6717C63931F3FC36502EFdDAddc6Ce80A8` |
| TeeOwnerAllowlist | `0xCb870e753F3f7B58e55A30EF367b6432dCC22835` |

## Invoice Lifecycle

```
1. CREATE    Supplier submits invoice → Flare TEE instruction + HCS event (debtor PII encrypted)
2. APPROVE   Debtor clicks PDF link → Flare TEE instruction + HCS update
3. SCORE     AI scores privately in TEE → Hedera Attestation NFT minted (grade + yield only)
4. LIST      Invoice appears on marketplace (no debtor identity visible)
5. FUND      Funder pays HBAR → Hedera Receipt NFT minted → supplier receives capital
6. SETTLE    At maturity → HBAR paid to funder → Receipt NFT burned
```

## Privacy Model

| Data | On Flare? | On Hedera HCS? | On Hedera NFT? |
|------|-----------|----------------|----------------|
| Debtor name | Encrypted in TEE instruction | **ECIES encrypted** | No |
| Debtor email | Encrypted in TEE instruction | **ECIES encrypted** | No |
| Payment history | Encrypted in TEE instruction | **ECIES encrypted** | No |
| AI reasoning | TEE memory only | No | No |
| Risk grade (A/B/C/D) | TEE result | Plaintext | NFT metadata |
| Yield / discount | TEE result | Plaintext | NFT metadata |
| Face value | Plaintext | Plaintext | NFT metadata |

Private data stays private. Public markets stay liquid. AI agents connect the two.

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Funded Flare Coston2 wallet ([faucet](https://faucet.flare.network/coston2))
- Hedera testnet account ([portal](https://portal.hedera.com/))
- OpenAI API key

### Setup

```bash
git clone https://github.com/sairammr/finvoice.git
cd finvoice
bun install
cp .env.example .env
# Fill in your keys (see .env.example)
```

### Create Hedera tokens and HCS topics (one-time)

```bash
bun run scripts/setup-hedera.ts     # Creates Attestation + Receipt NFT collections
bun run scripts/setup-hcs-topics.ts  # Creates Invoice + Session HCS topics
# Copy the printed IDs into .env
```

### Deploy Flare contract (one-time)

```bash
bun run scripts/deploy-flare.ts
# Copy the printed address into .env as INSTRUCTION_SENDER_ADDRESS
```

### Run

```bash
bun run dev
# → http://localhost:3000
```

### Run E2E test

```bash
bun run scripts/test-live-e2e.ts
```

## Environment Variables

```bash
# Flare (Coston2 Testnet)
FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
FLARE_CHAIN_ID=114
FLARE_PRIVATE_KEY=0x...
INSTRUCTION_SENDER_ADDRESS=0x...
TEE_PROXY_URL=http://localhost:6676

# Hedera (Testnet)
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=...
ATTESTATION_TOKEN_ID=0.0.xxxxx
RECEIPT_TOKEN_ID=0.0.xxxxx
HEDERA_TREASURY_ID=0.0.xxxxx

# HCS (Hedera Consensus Service)
HCS_INVOICE_TOPIC_ID=0.0.xxxxx
HCS_SESSION_TOPIC_ID=0.0.xxxxx

# AI Scoring
OPENAI_API_KEY=sk-...

# Auth (Dynamic.xyz)
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=...

# Public
NEXT_PUBLIC_FLARE_EXPLORER_URL=https://coston2-explorer.flare.network
NEXT_PUBLIC_HEDERA_NETWORK=testnet
```

## TEE Setup

The TEE extension runs invoice scoring privately inside Flare's Confidential Compute. Requires Docker + Go + ngrok.

```bash
# Clone the Flare starter and configure
git clone https://github.com/flare-foundation/fce-sign.git /tmp/fce-sign
cd /tmp/fce-sign
# Set PRIVATE_KEY, INITIAL_OWNER, INSTRUCTION_SENDER in .env
# Set DB credentials in config/proxy/extension_proxy.toml (get from Flare team)

# Register + deploy
cd go/tools
go run ./cmd/register-extension      # → Extension ID
docker compose up -d                  # → 3 containers (redis + proxy + tee)
ngrok http 6676                       # → Public tunnel URL
go run ./cmd/allow-tee-version -p http://localhost:6676
go run ./cmd/register-tee -p <ngrok-url> -l   # → TEE in PRODUCTION
```

## Project Structure

```
src/
  lib/
    hcs-store.ts          # HCS-backed data store (replaces traditional DB)
    hedera.ts             # Hedera HTS SDK (NFT mint/burn/transfer)
    crypto.ts             # ECIES encrypt/decrypt for Flare + Hedera keys
    contracts.ts          # Flare Coston2 viem client
    scoring.ts            # GPT-4o-mini AI credit scoring
    db.ts                 # Re-exports from hcs-store.ts
  app/
    api/
      invoices/           # Create + list invoices
      approve/            # Debtor approval (PDF + OTP flow)
      agent/attest/       # AI scoring + Hedera attestation NFT
      listings/           # Marketplace listings
      fund/               # Fund invoice (verify HBAR payment + mint receipt NFT)
      settle/             # Settlement (verify payment + burn receipt NFT)
    (app)/
      create-invoice/     # Supplier invoice form
      marketplace/        # Funder marketplace
      dashboard/          # All-user dashboard
tee-extension/
  contract/
    InvoiceInstructionSender.sol  # Only Solidity contract (Flare Coston2)
  typescript/src/app/
    handlers.ts           # TEE handlers: CREATE, APPROVE, SCORE
scripts/
  deploy-flare.ts         # Deploy contract to Coston2
  setup-hedera.ts         # Create HTS NFT collections
  setup-hcs-topics.ts     # Create HCS topics
  register-tee.ts         # Register TEE extension
  test-live-e2e.ts        # Full lifecycle E2E test
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Bun |
| Framework | Next.js 16 (Turbopack) |
| Frontend | React 19, Tailwind CSS 4, Framer Motion |
| Auth | Dynamic.xyz |
| Blockchain (Private Ledger) | Flare Coston2 — TEE Extensions (Confidential Compute) |
| Blockchain (Public Ledger) | Hedera Testnet — HTS SDK (zero Solidity) + HCS (decentralized storage) |
| Encryption | ECIES via eciesjs (secp256k1 + ED25519) |
| AI | GPT-4o-mini via OpenAI API |
| PDF | React PDF Renderer + pdf-lib |

## Feedback — Building on Flare

**What worked well:**
- The `fce-sign` starter repo is excellent — TypeScript/Go/Python handler options with Docker compose out of the box
- TEE registration via Go tools is reliable once the proxy syncs signing policies
- `MODE=1` (test mode) makes local development possible without real TEE hardware
- The InstructionSender pattern (on-chain → proxy → TEE handler) is clean and intuitive

**Challenges:**
- TEE registration is governance-gated — had to use the Go tools from `fce-sign`, couldn't call `TeeExtensionRegistry.Register()` directly via viem
- FTDC availability check can time out — restarting the proxy to resync signing policies fixed it
- C-chain indexer DB credentials are required for the proxy — these are only available from the Flare team at the hackathon booth or TG group
- No TypeScript tooling for registration (deploy/register/allow-version) — only Go

**Suggestions:**
- Publish a TypeScript version of the registration tools alongside the Go tools
- Add a "hackathon mode" that skips the FTDC availability check for faster iteration
- Document the `extension_proxy.toml` DB credential requirement more prominently in the README

## Team

- **Sairam** — Full Stack Developer
- **Philo Sanjay** — Backend Developer

## License

Apache-2.0
