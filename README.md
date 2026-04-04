# Finvoice

**Private invoice factoring powered by Flare TEE + Hedera HTS + HCS**

Finvoice turns unpaid invoices into instant capital. Suppliers create invoices, debtors approve via a one-click PDF, AI scores them privately inside a Flare TEE, and funders earn yield on a public marketplace — all while debtor identities remain completely private.

## Architecture

```
Supplier → Next.js API → Flare TEE (Coston2) → Hedera HTS + HCS (Testnet)
                ↓               ↓                      ↓
          HCS Event Store   Private AI scoring    Public NFTs + Audit Log
       (encrypted debtor PII)  (inside TEE only)   (risk grade + hash only)
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Privacy** | Flare Confidential Compute (TEE) | Private invoice data, AI credit scoring inside TEE |
| **Tokens** | Hedera Token Service (HTS SDK) | Attestation NFTs, Receipt NFTs — zero Solidity |
| **Storage** | Hedera Consensus Service (HCS) | Decentralized event store replacing traditional DB |
| **Encryption** | ECIES (secp256k1) | Debtor PII encrypted before HCS submission |
| **AI** | GPT-4o-mini | Credit scoring with risk grades A-D |
| **Frontend** | Next.js 16, React 19, Tailwind 4 | Marketplace, dashboard, invoice creation |
| **Auth** | Dynamic.xyz | Wallet connection + social login |

## What Makes It Different

- **No database** — All state lives on Hedera HCS topics. Server rebuilds state from HCS replay on startup.
- **No Solidity on Hedera** — Pure SDK: `TokenCreateTransaction`, `TokenMintTransaction`, `TopicMessageSubmitTransaction`.
- **Only 1 Solidity contract** — `InvoiceInstructionSender.sol` on Flare Coston2, sends instructions to the TEE.
- **Privacy by default** — Debtor name, email, payment history never appear on any blockchain. Only risk grades and hashes are public.
- **TEE-attested scoring** — AI scoring runs inside Flare's Trusted Execution Environment. Results are signed by the TEE key.

## Deployed Infrastructure

| Component | ID / Address | Explorer |
|-----------|-------------|----------|
| Flare Contract | `0x616c83ff35d0a9572efb02246ee712a8d062f44b` | [Coston2 Explorer](https://coston2-explorer.flare.network/address/0x616c83ff35d0a9572efb02246ee712a8d062f44b) |
| TEE Extension | ID 251, PRODUCTION status | — |
| Attestation NFT | `0.0.8509042` | [HashScan](https://hashscan.io/testnet/token/0.0.8509042) |
| Receipt NFT | `0.0.8509043` | [HashScan](https://hashscan.io/testnet/token/0.0.8509043) |
| Invoice HCS Topic | `0.0.8511510` | [HashScan](https://hashscan.io/testnet/topic/0.0.8511510) |
| Session HCS Topic | `0.0.8511512` | [HashScan](https://hashscan.io/testnet/topic/0.0.8511512) |

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

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime
- Funded Flare Coston2 wallet ([faucet](https://faucet.flare.network/coston2))
- Hedera testnet account ([portal](https://portal.hedera.com/))
- OpenAI API key

### Setup

```bash
git clone https://github.com/sairammr/Ethglobal-2026.git
cd Ethglobal-2026
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

## TEE Setup (Optional — for full privacy flow)

The TEE extension runs invoice scoring privately inside Flare's Confidential Compute.

```bash
# Clone the starter and configure
git clone https://github.com/flare-foundation/fce-sign.git /tmp/fce-sign
cd /tmp/fce-sign
# Set PRIVATE_KEY, INITIAL_OWNER, INSTRUCTION_SENDER in .env
# Set DB credentials in config/proxy/extension_proxy.toml

# Register + deploy
cd go/tools
go run ./cmd/register-extension
docker compose up -d
ngrok http 6676
go run ./cmd/allow-tee-version -p http://localhost:6676
go run ./cmd/register-tee -p <ngrok-url> -l
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
| Blockchain (Privacy) | Flare Coston2 — TEE Extensions (Confidential Compute) |
| Blockchain (Tokens) | Hedera Testnet — HTS SDK (zero Solidity) |
| Blockchain (Storage) | Hedera Testnet — HCS Topics (decentralized event store) |
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
- TEE registration is governance-gated — had to use the Go tools, couldn't call `Register()` directly via viem
- FTDC availability check can time out — restarting the proxy to resync signing policies fixed it
- C-chain indexer DB credentials are required for the proxy — needs to be documented more prominently
- No TypeScript tooling for registration (deploy/register/allow-version) — only Go

**Suggestions:**
- Publish a TypeScript version of the registration tools alongside the Go tools
- Add a "hackathon mode" that skips FTDC availability check for faster iteration
- Document the `extension_proxy.toml` DB credential requirement in the README, not just the TG group

## License

Apache-2.0
