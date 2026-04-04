# Finvoice

**Private invoice factoring on Flare** -- tokenize invoices, get AI credit scores, and fund them on a public marketplace, all while keeping debtor identities completely private.

Finvoice bridges TradFi and DeFi using the Flare dual-chain architecture (Privacy Node + Public L1). Suppliers create invoices, debtors approve them via a special PDF (no wallet needed), an AI agent scores the risk, and funders earn yield on a public marketplace -- without ever seeing who the debtor is.


<img width="1466" height="965" alt="Screenshot 2026-03-29 at 4 16 59 PM" src="https://github.com/user-attachments/assets/00ad5de1-fc31-43b8-9e67-98c93a928cab" />


## How It Works

<img width="1358" height="784" alt="Screenshot 2026-03-29 at 4 17 18 PM" src="https://github.com/user-attachments/assets/b2c60afd-858f-434d-95ad-8d2c5c5bfde2" />


## Privacy Model

| Data               | Privacy Node | Public L1 | Rationale                          |
| ------------------- | ------------ | --------- | ---------------------------------- |
| Debtor identity     | Yes          | No        | Competitive intelligence protection |
| Payment history     | Yes          | No        | Proprietary debtor data            |
| Jurisdiction        | Yes          | No        | Could identify debtor if combined  |
| Risk grade (A-D)    | Generated    | Yes       | Translated risk signal for funders |
| Yield APY           | Generated    | Yes       | Funder return metric               |
| Face value          | Yes          | Yes       | Funders need to know amount        |
| Confidence score    | Generated    | Yes       | Trust signal                       |

> An institution's supplier relationships are trade secrets. With Finvoice, the AI sees everything, the public sees only what matters for pricing, and the debtor's identity never leaves the sovereign chain.

<img width="1369" height="923" alt="Screenshot 2026-03-29 at 4 17 33 PM" src="https://github.com/user-attachments/assets/0f6d9d9c-1c42-4b93-b966-c414285a0178" />

<img width="1556" height="948" alt="Screenshot 2026-03-29 at 4 17 54 PM" src="https://github.com/user-attachments/assets/97b8fad3-c0ef-4e0f-9853-dfe3015c6698" />

<img width="1456" height="966" alt="Screenshot 2026-03-29 at 4 18 05 PM" src="https://github.com/user-attachments/assets/35614052-ffa3-473e-bf29-aa31f744e996" />


## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, Framer Motion
- **Auth**: Privy (wallet, email, Google -- embedded wallets for non-crypto users)
- **Database**: Supabase (PostgreSQL)
- **AI Scoring**: Claude Sonnet 4 via OpenRouter
- **Blockchain**: Viem, Flare TEE (chain 800004) + Public L1 Testnet (chain 7295799)
- **PDF**: React PDF Renderer + pdf-lib (interactive approval PDFs)
- **Smart Contracts**: Solidity 0.8.20, Foundry

## Smart Contracts

| Contract               | Chain        | Standard | Purpose                                    |
| ---------------------- | ------------ | -------- | ------------------------------------------ |
| `InvoiceToken.sol`     | Privacy Node | ERC-1155 | Tokenized invoices with full private metadata |
| `InvoiceMarketplace.sol` | Public L1  | --       | Marketplace listings, funder purchases     |
| `InvoiceReceipt.sol`   | Public L1    | ERC-721  | Receipt NFTs for funders (no debtor data)  |
| `MockUSDC.sol`         | Both         | ERC-20   | Stablecoin for payments and settlements    |

## Getting Started

### Prerequisites

- Node.js 20+
- [Foundry](https://book.getfoundry.sh/) (for smart contract development)

### Install

```bash
npm install
```

### Environment Variables

Copy and fill in the required values:

```bash
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=

# Flare RPC
PRIVACY_NODE_RPC_URL=https://privacy-node-4.flare.com
PUBLIC_L1_RPC_URL=https://testnet-rpc.flare.com/

# Smart Contracts
INVOICE_TOKEN_ADDRESS=
INVOICE_MARKETPLACE_ADDRESS=
INVOICE_RECEIPT_ADDRESS=
MOCK_USDC_ADDRESS=
FINVOICE_USDC_ADDRESS=
STABLECOIN_MIRROR_ADDRESS=

# AI Scoring
OPENROUTER_API_KEY=

# Wallet (deployer/operator)
PRIVATE_KEY=
```

### Run

```bash
npm run dev        # Start Next.js dev server
```

### Smart Contracts

```bash
forge build        # Compile contracts
forge test         # Run tests
```

## API Routes

| Method | Route                   | Purpose                          |
| ------ | ----------------------- | -------------------------------- |
| POST   | `/api/invoices`         | Create invoice                   |
| GET    | `/api/invoices`         | List invoices by supplier        |
| GET    | `/api/generate-pdf`     | Generate approval PDF            |
| POST   | `/api/pdf-auth/request-otp` | Send OTP to debtor           |
| POST   | `/api/pdf-auth/verify-otp`  | Verify debtor OTP            |
| GET    | `/api/approve`          | Debtor approval endpoint         |
| POST   | `/api/score`            | Trigger AI credit scoring        |
| GET    | `/api/listings`         | Fetch marketplace listings       |
| POST   | `/api/fund`             | Fund an invoice                  |
| POST   | `/api/settle`           | Execute settlement at maturity   |
| GET    | `/api/invoice-status`   | Check invoice status             |
| GET    | `/api/balance`          | Check wallet balance             |
| POST   | `/api/faucet`           | Request testnet tokens           |

## User Roles

**Supplier** -- Creates invoices, sends approval PDFs to debtors, receives immediate liquidity when funded.

**Debtor** -- Approves invoices via PDF (OTP-verified, no wallet needed). Pays face value at maturity.

**Funder** -- Browses marketplace, funds invoices at a discount, earns yield at maturity. Receives ERC-721 receipt NFTs.

## AI Credit Scoring

The scoring agent analyzes full private metadata on the Privacy Node and produces:

- **Risk Grade** (A-D): Based on payment history, jurisdiction, terms
- **Discount Rate**: Basis points reflecting invoice risk
- **Yield APY**: Annualized return for funders
- **Confidence Score** (0-100): Trust signal

Only the numerical scores cross to the public chain. The reasoning and private data stay on the Privacy Node.

## License

Apache 2.0
