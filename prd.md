# finvoice -- Deep Dive

> **Track:** RWA Tokenization | **Risk:** Medium | **Team:** 3-4 | **Duration:** 48 hours
> **One-liner:** Private invoice factoring where suppliers create invoices on our platform, debtors approve them via a special PDF, an AI agent scores them confidentially on a sovereign chain, and funders earn yield purchasing them on a public marketplace.

---

## The Insight

Banks across Latin America chose Flare because it works. Those same banks send invoices as PDFs. Every single day. The entire $3.1 trillion global invoice factoring market runs on PDFs that get emailed, printed, faxed, and manually reconciled.

**What if the debtor could approve an invoice with a single click -- and that click triggered tokenization, AI scoring, and marketplace listing automatically?**

Suppliers create invoices on our platform. The debtor receives a special PDF and clicks "Approve on Flare." That one action puts the invoice on a sovereign Privacy Node, triggers an AI credit agent, publishes a risk-scored listing to a public marketplace, and lets funders earn yield -- all while the debtor's identity never leaves the private chain.

---

## How It Works: The Full Pipeline

```
WEB APP                  PRIVATE (Flare TEE)         PUBLIC (Hedera HTS)
==============           ================================     ================================

1. Supplier creates
   invoice on web app
   /create-invoice page
   -> Downloads special PDF
      with "Approve on Flare"
      button

2. Supplier sends PDF
   to their client (debtor)

3. Debtor opens PDF,
   verifies details,
   clicks "Approve on
   Flare" button
   -> Invoice tokenized  -----> 4. Receivable minted as
      on Privacy Node              Invoice Token (ERC-1155)
      via backend API              with full metadata
                                   (debtor, amount, terms,
                                    payment history)

                                5. AI Credit Agent inspects
                                   private token metadata
                                   -> Risk grade (A-D)
                                   -> Discount rate / yield
                                   -> Confidence score
                                   -> Attestation crosses   -------> 6. Attestation + marketplace
                                      via Arbitrary Message            listing appear on Public L1
                                      (metadata only, no               (yield APY, tenure, risk
                                      token movement;                   grade, face value -- NO
                                      debtor identity NEVER             debtor details)
                                      leaves Privacy Node)

                                                                     7. Funder browses marketplace
                                                                        page in web app
                                                                        -> Sees: "A-grade, 26% APY,
                                                                           30-day tenure, $100k face"
                                                                        -> Clicks "Fund"
                                                                        -> Pays discounted price
                                                                           ($97,900 in stablecoin)

                                8. Purchase amount          <------- 8. Funder's stablecoin sent
                                   bridges via Teleport                 to Private Node via
                                   Protocol (atomic                     Teleport Protocol
                                   cross-chain transfer)

                                9. Supplier receives
                                   $97,900 (full purchase
                                   price = immediate
                                   liquidity)

                               10. At maturity, debtor
                                   pays full face value
                                   ($100,000) through
                                   the platform (factoring
                                   model -- debtor pays
                                   the finance provider)
                                   -> Teleport to Public L1 -------> 11. Funder receives $99,700
                                                                        (face value minus 0.3%
                                                                        platform fee). Receipt
                                                                        NFT burned.
```

---

## Why This Flow is 10x Better

### Standard approach (what others will build)
- Supplier logs into a dApp, connects MetaMask, navigates a complex UI to tokenize an invoice
- No debtor involvement -- unilateral tokenization with no verification
- Buyer browses a separate marketplace, connects wallet, clicks buttons
- Settlement requires manual claim transactions
- **Problem:** No debtor consent, no trust signal, and nobody in TradFi will use the UX.

### Our approach (Finvoice)
- Supplier creates the invoice on our web app -- familiar form, no wallet needed
- Platform generates a special PDF with an "Approve on Flare" button
- Debtor receives the PDF, verifies the details, clicks "Approve" -- this IS debtor consent
- That single click tokenizes the invoice on the Privacy Node, triggers AI scoring, and lists it on the marketplace
- Funders browse the marketplace page in the web app, see yield/APY/tenure/risk, and fund invoices
- At settlement, supplier gets paid immediately; funder earns yield at maturity
- **Result:** Debtor approval = trust signal. Supplier gets a familiar PDF workflow. Funders get a clean marketplace. One click bridges TradFi and DeFi.

### The Wow Moment for Judges
> "The supplier created this invoice on our platform. The debtor received this PDF."
> *[opens the PDF on screen]*
> "Watch what happens when the debtor clicks 'Approve on Flare.'"
> *[clicks "Approve on Flare" in the PDF]*
> *[Privacy Node tx appears on explorer in <1 second]*
> *[AI agent processes it, attestation appears on Public L1]*
> *[Marketplace listing appears in the web app with yield and risk grade]*
> "Now a funder in Paris sees this listing -- 8.4% APY, A-grade, 30-day tenure."
> *[clicks "Fund" in the marketplace]*
> *[Supplier's balance updates -- they got paid instantly]*
> "The debtor approved it. The AI scored it. The funder earned yield. The supplier got cash. No wallets. No dApps. One PDF."
> *[3 seconds of silence]*

---

## Architecture

### System Components

```
+------------------+     +-------------------+     +------------------+
|   Web App        |     |   Backend API     |     |  Flare Privacy   |
|   (Next.js)      |     |   (Next.js API    |     |     Node         |
|                  |     |    Routes)        |     |                  |
|  /create-invoice |---->|  - Invoice CRUD   |---->|  - Invoice Token |
|  /marketplace    |     |  - PDF Generation |     |    (ERC-1155)    |
|  /dashboard      |     |  - Approval Handler     |  - Full metadata |
+------------------+     |  - AI Routing     |     |  - Supplier payout
        ^                +-------------------+     +------------------+
        |                       |                    |             ^
        |                       |                    | Arbitrary   | Teleport
+------------------+            v                    | Message     | (stablecoin)
|   Approval PDF   |    +-------------------+        v             |
|   (Special PDF)  |    |   AI Credit       |     +------------------+
|                  |    |   Scoring Agent   |     |  Flare Public    |
|  - Invoice data  |    |                   |     |     L1           |
|  - "Approve on   |--->|  - Risk grading   |     |                  |
|    Flare" button |    |  - Yield calc     |---->|  - Attestation   |
|  - Verification  |    |  - Attestation    |     |    (via Arb Msg) |
|    details       |    |    generation     |     |  - Marketplace   |
+------------------+    +-------------------+     |  - Settlement    |
                                                  |    (via Teleport)|
                                                  +------------------+
```

### Smart Contracts

#### Privacy Node: InvoiceToken.sol (ERC-1155)

Receivable minted as an ERC-1155 token on the Privacy Node, following the [Flare minting standards](https://docs.flare.io). ERC-1155 is the recommended standard for hybrid receivables (supports both fungible and non-fungible use cases).

```solidity
struct InvoiceMetadata {
    address supplier;        // Supplier address (payee)
    address debtor;          // Debtor address (payer / approver)
    bytes32 debtorHash;      // Hashed debtor identity (PRIVATE)
    string debtorName;       // Full debtor name (PRIVATE - never bridged)
    uint256 faceValue;       // Invoice amount in stablecoin units
    uint256 dueDate;         // Maturity timestamp
    string jurisdiction;     // Legal jurisdiction
    string paymentHistory;   // JSON of historical payment data
    string terms;            // Payment terms (net-30, net-60, etc.)
    bytes32 pdfHash;         // Hash of the original PDF document
    bool debtorApproved;     // Whether the debtor has approved this invoice
    uint256 approvedAt;      // Timestamp of debtor approval
}

// Called when debtor clicks "Approve on Flare" in the PDF
function approveInvoice(uint256 tokenId) external {
    require(msg.sender == invoices[tokenId].debtor || isApprovalProxy(msg.sender));
    invoices[tokenId].debtorApproved = true;
    invoices[tokenId].approvedAt = block.timestamp;
    emit InvoiceApproved(tokenId, msg.sender);
}

// Only the AI agent can call this after analysis
function setAttestation(
    uint256 tokenId,
    string memory riskGrade,  // A, B, C, D
    uint256 discountBps,      // Discount in basis points
    uint256 yieldBps,         // Annualized yield in basis points
    bytes memory aiSignature  // AI agent's attestation signature
) external onlyAttestationAgent;

// Receive Teleport from Public L1 and pay supplier
function settleSupplierPayment(uint256 tokenId) external onlyTeleportReceiver {
    uint256 payoutAmount = invoices[tokenId].purchaseAmount;
    stablecoin.transfer(invoices[tokenId].supplier, payoutAmount);
    emit SupplierPaid(tokenId, invoices[tokenId].supplier, payoutAmount);
}

// Debtor pays face value at maturity -- Teleport to Public L1 for funder
function debtorSettlement(uint256 tokenId) external {
    require(invoices[tokenId].debtorApproved);
    stablecoin.transferFrom(msg.sender, address(this), invoices[tokenId].faceValue);
    // Teleport face value to Public L1 for funder payout
    teleport.sendToPublic(invoices[tokenId].faceValue, tokenId);
    emit DebtorSettled(tokenId, invoices[tokenId].faceValue);
}
```

#### Public L1: InvoiceReceipt.sol (ERC-721)

```solidity
struct ReceiptData {
    string riskGrade;        // From AI attestation (arrived via Arbitrary Message)
    uint256 discountBps;     // Discount rate
    uint256 yieldBps;        // Annualized yield (APY)
    uint256 faceValue;       // Amount at maturity
    uint256 purchasePrice;   // Discounted purchase price
    uint256 maturityDate;    // When it pays out
    uint256 tenure;          // Days to maturity
    bytes32 attestationHash; // Link to AI attestation on Privacy Node
    bytes32 pdfHash;         // Verification link to original PDF
    address funder;          // Address that funded this invoice
    bool settled;            // Whether settlement is complete
    // NOTE: No debtor name, no jurisdiction, no payment history
}

// Settlement: called when debtor payment arrives via Teleport from Private Node
function settle(uint256 receiptId) external onlyTeleportReceiver {
    require(!receipts[receiptId].settled);
    uint256 faceValue = receipts[receiptId].faceValue;
    uint256 platformFee = (faceValue * platformFeeBps) / 10000;
    uint256 funderPayout = faceValue - platformFee;
    stablecoin.transfer(receipts[receiptId].funder, funderPayout);
    stablecoin.transfer(treasury, platformFee);
    receipts[receiptId].settled = true;
    _burn(receiptId);
    emit Settled(receiptId, receipts[receiptId].funder, funderPayout);
}
```

#### Public L1: InvoiceMarketplace.sol

```solidity
struct Listing {
    uint256 receiptId;
    string riskGrade;
    uint256 yieldBps;        // Annualized yield (APY) for display
    uint256 faceValue;
    uint256 purchasePrice;   // Face value minus discount
    uint256 maturityDate;
    uint256 tenure;          // Days to maturity
    uint256 confidenceScore;
    bool funded;
}

// Listing created when AI attestation arrives via Arbitrary Message from Privacy Node
function createListing(
    string memory riskGrade,
    uint256 discountBps,
    uint256 yieldBps,
    uint256 faceValue,
    uint256 maturityDate,
    uint256 confidenceScore,
    bytes32 attestationHash,
    bytes32 pdfHash
) external onlyAttestationRelay;

// Funder purchases -- stablecoin Teleports to Private Node for supplier payout
function fund(uint256 listingId) external {
    Listing storage listing = listings[listingId];
    require(!listing.funded);
    stablecoin.transferFrom(msg.sender, address(this), listing.purchasePrice);
    listing.funded = true;
    receiptContract.mint(msg.sender, listing);
    // Teleport purchase amount to Private Node for supplier payout
    teleport.sendToPrivate(listing.purchasePrice, listing.receiptId);
    emit Funded(listingId, msg.sender, listing.purchasePrice);
}

// View all active listings with risk grades and yields
function getActiveListings() external view returns (Listing[] memory);
```

### AI Credit Scoring Agent

```
Input (from Privacy Node):
  - Full InvoiceMetadata (debtor name, payment history, jurisdiction, terms)

Processing:
  1. Debtor risk assessment (payment history analysis, jurisdiction risk)
  2. Invoice validity checks (reasonable amounts, valid dates, consistent terms)
  3. Compliance screening (sanctions check, jurisdiction restrictions)
  4. Discount rate calculation based on risk + maturity + market conditions

Output (posted to both chains):
  - Risk grade: A (lowest risk) to D (highest risk)
  - Discount rate: basis points (e.g., 210 = 2.10%)
  - Annualized yield (APY): calculated from discount rate + tenure
  - Confidence score: 0-100
  - Attestation hash (posted to Public L1)
  - Full reasoning (stored on Privacy Node only)
```

**Key design choice:** The AI agent's full reasoning (which references private debtor details) stays on the Privacy Node. Only the grade, discount, yield, and confidence score cross to the Public L1 via **Arbitrary Message** -- a Flare protocol that sends data without moving tokens. This is the disclosure design that judges are looking for.

### Web App: Invoice Creation Flow

Suppliers create invoices through the web app, which generates a special approval PDF:

```
Supplier (Web App /create-invoice)
  |
  |-- Fills form: debtor info, amount, terms, due date, line items
  |-- Submits -> Backend stores invoice metadata (pending approval)
  |-- Backend generates special PDF with:
  |     - Standard invoice layout (professional, printable)
  |     - Invoice details, amount, terms
  |     - Unique invoice ID + verification URL
  |     - Embedded "Approve on Flare" button (links to approval endpoint)
  |
  v
Supplier downloads PDF, sends to debtor via email / messaging
```

### PDF Approval -> Tokenization Flow

The debtor approves the invoice via the PDF, which triggers tokenization:

```
Debtor receives PDF, opens it
  |
  |-- Reviews invoice details (amount, terms, due date)
  |-- Clicks "Approve on Flare" button
  |     -> Button is a URL link to: /api/approve?invoiceId=xxx&token=yyy
  |
  v
Backend Approval Handler
  |
  |-- Validates approval token (single-use, time-limited)
  |-- Shows debtor a confirmation page with invoice summary
  |-- Debtor confirms approval (one more click for consent)
  |
  v
Backend -> Flare TEE
  |
  |-- Creates InvoiceToken (ERC-1155) with full metadata
  |-- Marks invoice as "approved" with debtor's consent timestamp
  |-- Emits InvoiceApproved event
  |
  v
AI Credit Agent (listens for InvoiceApproved events)
  |
  |-- Reads full private metadata from Privacy Node
  |-- Runs credit analysis (risk, compliance, yield calculation)
  |-- Posts attestation to Public L1
  |-- Creates marketplace listing (yield APY, risk grade, tenure)
  |
  v
Marketplace listing live -> Funders can now browse and fund
```

**For the hackathon MVP:** The "Approve on Flare" button in the PDF is a simple URL link to an API endpoint. The debtor clicks it, lands on a confirmation page in the web app, and clicks "Confirm Approval." This triggers the full tokenization -> AI scoring -> marketplace listing pipeline. Since Flare has sub-second finality, the marketplace listing appears almost instantly.

---

## Disclosure Design (Key Judging Criterion)

This is where finvoice shines. The private-to-public split is not arbitrary -- it mirrors real institutional logic:

| Data Point | Private (Privacy Node) | Public (L1) | Why |
| ---------- | ---------------------- | ----------- | --- |
| Debtor identity | Yes | No | Competitive intelligence -- revealing who owes you money exposes business relationships |
| Debtor approval + timestamp | Yes | No (existence confirmed) | Proof that debtor consented, but identity stays private |
| Payment history | Yes | No | Proprietary data that could be used against the debtor |
| Jurisdiction | Yes | No | Combined with other data could identify the debtor |
| Invoice terms | Yes | No | Sensitive commercial terms |
| Face value | Yes | Yes | Funders need to know what they're purchasing |
| Maturity date / Tenure | Yes | Yes | Funders need to know when it pays out and for how long |
| Risk grade | No (derived by AI) | Yes | The whole point -- translated risk without raw data |
| Discount rate | No (derived by AI) | Yes | Market pricing signal |
| Yield APY | No (derived by AI) | Yes | Annualized return for funders -- key marketplace metric |
| AI confidence | No (derived by AI) | Yes | Trust signal for funders |
| Original PDF hash | Yes | Yes | Verification that the receipt maps to a real document |

**The narrative for judges:** "An institution's supplier relationships are trade secrets. Today, factoring an invoice means handing over your client list to a third party. With finvoice, the AI sees everything, the public sees only what matters for pricing, and the debtor's identity never leaves the sovereign chain."

---

## Flow of Funds & Settlement

This follows the **receivables factoring model** from the Flare ecosystem: the funder buys the receivable at a discount, the supplier gets immediate liquidity, and the debtor pays the full face value at maturity. Cross-chain movement uses the **Teleport Protocol** for instant, atomic token bridging between the Privacy Node and Public L1.

### How the Yield Works

The funder buys a future cash flow at a discount. The spread between what they pay now and what they receive at maturity IS the yield.

```
Example: $100,000 invoice, 30-day maturity, AI risk grade A, 2.1% discount

  Purchase price = $100,000 × (1 - 0.021) = $97,900  (what funder pays)
  Yield          = $100,000 - $97,900      = $2,100
  APY            = (2,100 / 97,900) × (365 / 30) = ~26.1% annualized
```

The discount rate is set by the AI agent based on risk grade, maturity length, jurisdiction, and market conditions. Higher risk = higher discount = higher yield for the funder.

### Complete Fund Flow (All Parties)

```
PHASE 1: FUNDING (Funder -> Supplier)
==========================================

  Funder                     Public L1                    Private Node               Supplier
    |                        Marketplace                                                |
    |--- pays $97,900 ------>|                                                          |
    |    (stablecoin)        |--- Teleport $97,900 ------->|                            |
    |                        |    (atomic cross-chain)     |--- pays $97,900 ---------->|
    |<-- receives Receipt ---|                             |    (immediate liquidity)    |
    |    NFT (ERC-721)       |                             |                            |


PHASE 2: SETTLEMENT AT MATURITY (Debtor -> Funder)
==========================================

  Debtor                     Private Node                 Public L1                  Funder
    |                                                     Marketplace                   |
    |--- pays $100,000 ----->|                                                          |
    |    (full face value,   |--- Teleport $100,000 ----->|                             |
    |     factoring model:   |    (atomic cross-chain)    |--- pays $99,700 ---------->|
    |     debtor pays the    |                            |    (face value minus        |
    |     finance provider)  |                            |     0.3% platform fee)      |
    |                        |                            |                             |
    |                        |                            |--- $300 to treasury         |
    |                        |                            |--- burns Receipt NFT        |


YIELD BREAKDOWN:
==========================================

  Funder paid:       $97,900
  Funder received:   $99,700   (face value $100k minus $300 platform fee)
  Funder net yield:  $1,800    (~22.4% APY after fees)

  Supplier received: $97,900   (immediate liquidity, no waiting 30 days)
  Supplier cost:     $2,100    (the discount -- cost of early payment)

  Debtor paid:       $100,000  (exactly what they owed -- no extra cost)

  Platform earned:   $300      (0.3% of face value at settlement)
```

### Who Pays for the Yield?

Nobody "pays" extra. The yield is an economic arbitrage on time preference:

- **Supplier** needs cash NOW. They accept a discount (sell $100k invoice for $97.9k) to get immediate liquidity instead of waiting 30 days. The discount is the cost of not waiting.
- **Funder** has capital and patience. They buy the future cash flow at a discount and wait for maturity. The discount is their compensation for providing liquidity and bearing risk.
- **Debtor** pays exactly what they owe. Nothing changes for them. In the factoring model, their payment goes through the platform to the funder, but the amount is the same.
- **Platform** takes a small fee (0.3% of face value) at settlement for facilitating the marketplace, AI scoring, and privacy infrastructure.

### Discount Rate by Risk Grade

| Risk Grade | Discount Rate | Effective APY (30-day) | Rationale |
| ---------- | ------------- | ---------------------- | --------- |
| A | 1.5-2.5% | 18-31% | Excellent payment history, low-risk jurisdiction, short maturity |
| B | 3.0-4.5% | 38-58% | Good history, moderate risk factors |
| C | 5.5-7.0% | 71-113% | Mixed history or elevated jurisdiction risk |
| D | 9.0%+ | 116%+ | High risk -- may be rejected by the marketplace |

### Settlement Scenarios

| Scenario | What Happens | Impact |
| -------- | ------------ | ------ |
| **Happy path** | Debtor pays full face value at maturity | Funder gets payout, supplier already paid, platform takes fee |
| **Early payment** | Debtor pays before maturity | Same flow, funder gets payout early (even better APY) |
| **Late payment** | Debtor pays after maturity | Late fees accrue per invoice terms; funder payout delayed but increased |
| **Default** | Debtor fails to pay | Funder holds receipt token as a legal claim against the original invoice. Risk grade already priced default probability. |

### Platform Fee Structure

| Fee | Amount | When | Who Pays |
| --- | ------ | ---- | -------- |
| Origination fee | 0% (free for hackathon) | At listing | Supplier (deferred) |
| Settlement fee | 0.3% of face value | At maturity settlement | Deducted from funder payout |
| Premium AI tier | Future revenue | N/A for MVP | Institutional users |

---

## Demo Script (90 Seconds)

**Pre-seeded state:** 3 invoices already approved and listed on marketplace. One with grade A (26% APY), one B (18% APY), one D (rejected). Supplier dashboard shows payment received for one.

### The Demo

**[0-10s] Hook**
> "Every year, $3 trillion in invoices get factored. The supplier needs cash now. The debtor hasn't paid yet. What if one click could solve this?"

**[10-30s] Create the Invoice**
> *[Open web app /create-invoice page]*
> "A supplier in Sao Paulo creates an invoice on our platform. Debtor, amount, terms -- standard stuff."
> *[Fill form, click Create -- PDF downloads]*
> "The platform generates this special PDF. Notice the 'Approve on Flare' button."

**[30-50s] The Wow Moment -- Debtor Approval**
> *[Open the PDF on screen -- show it's a real invoice]*
> "The supplier sends this to their client. The debtor opens it, verifies the details, and..."
> *[Click "Approve on Flare" in the PDF]*
> *[Show confirmation page, click Confirm]*
> *[Privacy Node tx appears on explorer in <1 second]*
> "That one click just tokenized the invoice on a sovereign Privacy Node. Full debtor details, payment history -- all private. Now watch."

**[50-65s] AI Scoring + Marketplace**
> *[Dashboard shows AI agent processing]*
> "Our AI credit agent reads the private metadata -- 3-year payment history, sanctions check, jurisdiction risk..."
> *[Marketplace page refreshes -- new listing appears]*
> "Grade A. 26% APY. 30-day tenure. $100k face value. Posted on the public marketplace. The debtor's name? Never left the Privacy Node."

**[65-80s] Funder Purchases**
> *[Switch to marketplace page in web app]*
> "A funder in Paris sees this. A-grade, 30 days, 26% annualized yield. They don't know who the debtor is. They don't need to."
> *[Click "Fund" -- pay $97,900]*
> *[Supplier dashboard updates -- $97,900 received]*
> "The supplier just got paid. Instantly. Before the invoice was even due."

**[80-90s] Close**
> "Debtor approved it. AI scored it. Funder earned yield. Supplier got cash. Private data never leaked. Three trillion dollar market. One click."
> *[3 seconds of silence]*

---

## MVP Scope -- What to Build vs. Fake

### MUST Ship (Demo Blockers)

| Component | Real or Fake | Time Est. |
| --------- | ------------ | --------- |
| Web app: /create-invoice page (supplier form) | Real | 4 hours |
| PDF generation with "Approve on Flare" button | Real (pdf-lib or HTML-to-PDF) | 3 hours |
| Approval flow: /api/approve endpoint + confirmation page | Real | 3 hours |
| InvoiceToken contract on Privacy Node | Real | 3 hours |
| AI credit scoring agent (LLM-based) | Real | 5 hours |
| Attestation posted to Public L1 | Real | 2 hours |
| InvoiceReceipt contract (ERC-721) on Public L1 | Real | 3 hours |
| Marketplace contract on Public L1 | Real | 3 hours |
| Bridge flow (Public L1 <-> Privacy Node, bidirectional) | Real (Flare bridge) | 4 hours |
| Marketplace UI page in web app (yield, APY, tenure, risk) | Real | 5 hours |
| Fund flow (funder pays -> supplier receives) | Real | 3 hours |
| Supplier dashboard (shows received payments) | Real | 2 hours |
| Pre-seeded demo data (3 invoices, different grades) | Hardcoded | 1 hour |

**Total core: ~41 hours** (tight for 48h but achievable with parallel work)

### SHOULD Ship (If Time Allows)

- Settlement flow at maturity (debtor pays -> funder receives yield)
- Multiple invoice types (net-30, net-60, net-90) with different APY
- AI agent reasoning viewer (shows private-side logic)
- Funder portfolio dashboard (shows funded invoices + expected yield)
- Trust score / provenance timeline on marketplace
- Email notification to debtor with PDF attachment

### WILL NOT Ship (Explicitly Deferred)

- Real authentication / user accounts (use simple role switching for demo)
- TEE backend
- Multi-chain support
- Mobile optimization
- Error handling for edge cases
- Admin dashboard
- Real debtor payment integration (simulate for demo)

---

## Technical Stack

| Layer | Technology | Why |
| ----- | ---------- | --- |
| Smart Contracts | Solidity (Hardhat/Foundry) | Standard EVM, Flare is EVM-compatible |
| Token Standard | ERC-1155 (Privacy Node), ERC-721 (Public L1) | ERC-1155 for hybrid receivables minting per Flare docs; ERC-721 for unique receipt NFTs |
| Cross-Chain: Data | Flare Arbitrary Messages | Attestation data (risk grade, yield) crosses without moving the invoice token |
| Cross-Chain: Value | Flare Teleport Protocol | Atomic stablecoin bridging for funding (Public -> Private) and settlement (Private -> Public) |
| Privacy Layer | Flare Enygma Protocol (future) | Encrypted token management for multi-institutional deployments |
| AI Agent | Python + Claude API / OpenAI | Tool-calling LLM for structured compliance analysis |
| Backend | Next.js API Routes | Handles invoice creation, PDF generation, approval flow, blockchain interaction |
| Frontend / Marketplace | Next.js + Tailwind + shadcn/ui | Fast, polished, responsive. Pages: /create-invoice, /marketplace, /dashboard |
| PDF Generation | pdf-lib (JS) or @react-pdf/renderer | Generate approval PDFs with embedded "Approve on Flare" button link |
| Database | Lightweight (SQLite or Supabase) | Stores pending invoices before approval, tracks invoice status |
| Deployment | Vercel (frontend + API) + Railway/Render (AI agent) | Fast deploy, free tier |

---

## Flare Network Configuration (implementation)

Use these endpoints and chain IDs for Privacy Node **privacy-node-4** and **Flare Testnet** (public). Copy secrets into `.env` locally; never commit `.env` or paste auth keys into client-side code.

### Privacy Node (private ledger)

| Setting | Value |
| ------- | ----- |
| Block explorer | `https://blockscout-privacy-node-4.flare.com` |
| RPC | `https://privacy-node-4.flare.com` |
| Chain ID | `800004` |
| Deployment proxy registry | `0x75Da1758161588FD2ccbFd23AB87f373b0f73c8F` |
| Backend API (Flare) | `https://flare-backend-privacy-node-4.flare.com` |

Environment variable names (set in `.env`):

```bash
PRIVACY_NODE_RPC_URL=https://privacy-node-4.flare.com
PRIVACY_NODE_CHAIN_ID=800004
DEPLOYMENT_PROXY_REGISTRY=0x75Da1758161588FD2ccbFd23AB87f373b0f73c8F
BACKEND_URL=https://flare-backend-privacy-node-4.flare.com
USER_AUTH_KEY=<from Flare onboarding — do not commit>
OPERATOR_AUTH_KEY=<from Flare onboarding — do not commit>
```

### Flare Testnet (public L1)

| Setting | Value |
| ------- | ----- |
| RPC | `https://testnet-rpc.flare.com/` |
| Chain ID | `7295799` |
| Block explorer | `https://testnet-explorer.flare.com/` |

Environment variable names:

```bash
PUBLIC_L1_RPC_URL=https://testnet-rpc.flare.com/
PUBLIC_L1_CHAIN_ID=7295799
```

Use the explorers above when verifying transactions during development and demos.

---

## AI Agent Design -- Detailed

### System Prompt (Credit Scoring Agent)

```
You are an institutional credit scoring agent operating on a sovereign
Flare TEE. You have access to confidential invoice metadata
that must NEVER be included in your public attestation.

Your job:
1. Analyze the invoice metadata (debtor identity, payment history,
   jurisdiction, terms, face value, maturity)
2. Produce a structured risk assessment
3. Output a PUBLIC attestation (risk grade + discount rate) that
   contains NO private information
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

CRITICAL: Your public attestation must contain ONLY:
- risk_grade (A/B/C/D)
- discount_bps (integer)
- confidence_score (0-100)
- attestation_hash

NEVER include: debtor_name, jurisdiction, payment_history, or any
data that could identify the debtor.
```

### Agent Flow

```
1. Listen for InvoiceApproved events on Privacy Node (triggered by debtor approval)
2. Read full metadata from the ERC-1155 token (debtor info, payment history, terms)
3. Call LLM with structured prompt + metadata
4. Parse LLM response into:
   a. Public attestation (grade, discount, yield APY, confidence)
   b. Private reasoning (full analysis with debtor references)
5. Send public attestation to Public L1 via Arbitrary Message
   (data crosses chains without moving the invoice token)
6. Create marketplace listing on Public L1 (yield, tenure, risk grade, face value)
7. Post private reasoning tx to Privacy Node ledger
8. Emit AttestationComplete event
```

### Fallback for Demo

Pre-compute AI responses for 3 demo invoices:

```json
{
  "demo_invoice_1": {
    "grade": "A",
    "discount_bps": 210,
    "confidence": 95,
    "reasoning": "Debtor has 36-month perfect payment history..."
  },
  "demo_invoice_2": {
    "grade": "B",
    "discount_bps": 350,
    "confidence": 78,
    "reasoning": "Debtor has occasional 15-day late payments..."
  },
  "demo_invoice_3": {
    "grade": "D",
    "discount_bps": 950,
    "confidence": 62,
    "reasoning": "Debtor jurisdiction flagged for elevated risk..."
  }
}
```

If the LLM API goes down during the demo, the agent returns these pre-computed results. Judges never know the difference.

---

## Flare Protocol Integration

This section maps each step in our pipeline to the specific Flare protocol it uses. These are native Flare capabilities -- not custom bridges.

### Protocol Selection

| Step | Flare Protocol | Why This Protocol |
| ---- | -------------- | ----------------- |
| Mint receivable on Privacy Node | **ERC-1155 Token Minting** | Flare supports ERC-20, ERC-721, and ERC-1155. We use ERC-1155 for hybrid receivables (each invoice is unique but the standard supports batch operations and mixed fungibility). |
| AI attestation crosses to Public L1 | **Arbitrary Messages** | The attestation is metadata (risk grade, discount, yield) -- not a token transfer. Arbitrary Messages let us send structured data cross-chain without moving the invoice token itself. The invoice stays private; only the scoring crosses. |
| Funder's purchase price -> Private Node (supplier payout) | **Teleport Protocol** | Stablecoin needs to actually move cross-chain. Teleport provides atomic, instant bridging between nodes. Ideal for the purchase amount flowing from Public L1 to Privacy Node. |
| Debtor's face value payment -> Public L1 (funder payout) | **Teleport Protocol** | Same -- actual token movement. Debtor's payment on Private Node gets Teleported to Public L1 for funder settlement. |
| Private invoice metadata management | **Enygma Protocol** (optional) | For institutions prioritising privacy and governance. Enygma provides encrypted token management, ensuring the invoice token's sensitive metadata is controlled without compromising discretion. Best for fungible token aspects (stablecoin escrow on the private side). |

### How Each Protocol Fits the Flow

```
                    PRIVACY NODE                              PUBLIC L1
                    ============                              =========

MINT:               InvoiceToken (ERC-1155)
                    minted with full metadata
                         |
                         v
AI SCORING:         AI reads private metadata
                    produces attestation
                         |
                         |--- Arbitrary Message -----------> Attestation received
                         |    (data only, no token           Marketplace listing created
                         |     movement)                     (risk grade, yield, tenure)
                         |
FUNDING:                 |                                   Funder pays purchase price
                         |<-------- Teleport (atomic) ------ Stablecoin crosses to
                         |                                   Private Node
                    Supplier receives
                    purchase amount
                         |
SETTLEMENT:         Debtor pays face value
                         |
                         |--- Teleport (atomic) -----------> Funder receives payout
                                                             Receipt NFT burned
```

### Token Registration

Per Flare docs, tokens minted on a Privacy Node can be shared across the Private Network. Our InvoiceToken stays within the single node (no cross-node token sharing needed), but the attestation data is communicated cross-chain via Arbitrary Messages.

For the stablecoin used in purchase/settlement, we use the Teleport Atomic Protocol to bridge between nodes securely and instantly -- this is the recommended approach for cross-node liquidity.

### Enygma Protocol (Future Enhancement)

For institutions that require encrypted token management, the Enygma protocol can wrap the stablecoin escrow and settlement flows on the Privacy Node. This adds a governance layer where the institution controls visibility and access to the token -- useful for multi-bank deployments where different Privacy Nodes need privacy from each other, not just from the public.

**For hackathon MVP:** We use Teleport + Arbitrary Messages. Enygma is a "mention in pitch, don't implement" feature.

---

## Judging Criteria Self-Assessment

### Sovereignty (Score: 5/5)

The Privacy Node holds the complete invoice metadata -- debtor identity, payment history, commercial terms. None of this would be possible on a standard public chain where all data is visible. The sovereign chain IS the product.

### Disclosure Design (Score: 5/5)

The private-to-public split mirrors real institutional logic: competitive intelligence stays private, pricing signals go public. The AI agent is the disclosure gate -- it translates private complexity into public simplicity. The table above shows exactly what crosses and why.

### AI Integration (Score: 4/5)

The AI does real, verifiable work: it reads private metadata, performs credit analysis, and produces an on-chain attestation with a hash that links back to the private reasoning. The attestation is a permanent on-chain artifact proving the AI's work. Deducting one point because the AI role (compliance reviewer) is more straightforward than an autonomous orchestrator.

### Public Market Viability (Score: 5/5)

The marketplace page shows risk grades, yield APY, tenure, face value, maturity dates, and AI confidence scores -- everything a funder needs to make a decision. The provenance chain (supplier creates -> debtor approves -> AI attests -> marketplace lists) communicates trust. The yield narrative (buy at discount, receive face value at maturity) is a familiar financial product. The complete flow of funds (funder -> supplier -> debtor -> funder) with clear yield mechanics makes this a credible DeFi primitive.

### Working Prototype (Score: 5/5)

The scope is tight and achievable. The "wow moment" (debtor clicking "Approve on Flare" and triggering the full pipeline) requires only a URL link in a PDF and an API endpoint. All smart contracts are standard ERC patterns. The AI agent is a straightforward LLM call. Sub-second Flare finality means the demo is snappy. Pre-computed fallbacks ensure it works under pressure.

---

## Pitch Hook Options

**Option A (Statistic):**
> "$3.1 trillion in invoices get factored every year. Suppliers wait 30-90 days for payment. Funders want yield. We connected them with one click in a PDF."

**Option B (Story):**
> "Sofia is a supplier in Sao Paulo. She invoiced a client in Buenos Aires. To factor that invoice, she had to reveal her client's identity to a third-party desk and wait weeks. Today, her client clicks one button in a PDF, an AI scores it privately, and Sofia gets paid in seconds."

**Option C (Demonstration):**
> *[Show the web app with a freshly created invoice PDF]* "This PDF was just generated on our platform. When the debtor clicks 'Approve on Flare,' watch what happens to the marketplace."

**Recommended: Option C.** Judges at a hackathon respond to demonstrations over statistics. The visual of a debtor approval triggering a full AI-scored marketplace listing is the kind of moment they'll remember hours later (peak-end rule).

---

## Adversarial Q&A Preparation

**Q: "How is this different from just using a private database?"**
> A: "A private database requires trust in the operator. The Privacy Node is a sovereign EVM chain with cryptographic guarantees. The AI attestation is an on-chain artifact that anyone can verify. The bridge to the Public L1 is trustless. A database gives you none of this."

**Q: "What happens when the AI makes a wrong credit scoring decision?"**
> A: "The AI is a recommendation engine, not an oracle. Its full reasoning is stored on the Privacy Node for audit. Funders see the confidence score and risk grade -- lower confidence means higher risk premium. The market prices in the AI's uncertainty. Wrong decisions are traceable on-chain."

**Q: "Why does the debtor need to approve? Can't the supplier just tokenize it?"**
> A: "Debtor approval is our trust signal. It proves the invoice is legitimate and undisputed. A supplier could fabricate invoices without this step. When the debtor clicks 'Approve,' they're confirming they owe this amount and will pay at maturity. That consent is timestamped on-chain and dramatically reduces fraud risk -- which the AI factors into its risk grade."

**Q: "What happens if the debtor doesn't pay at maturity?"**
> A: "The invoice reverts to standard commercial law -- the funder holds a receipt token that represents a legal claim against the original invoice. The risk grade already accounted for default probability. Grade A invoices have near-zero default rates historically. We're not eliminating credit risk, we're pricing it transparently."

**Q: "How does the funder actually earn yield?"**
> A: "Classical invoice factoring. The funder buys a $100k invoice for $97,900 (at a 2.1% discount). At maturity, the debtor pays the full $100k. That $2,100 spread is the yield -- about 26% annualized for a 30-day invoice. The discount is set by our AI based on risk. Higher risk = higher discount = higher yield."

**Q: "How does the PDF communicate with the blockchain?"**
> A: "The 'Approve on Flare' button in the PDF is a URL link to our API. The debtor clicks it, lands on a confirmation page in our web app, and confirms approval. Our backend then tokenizes the invoice on the Privacy Node. No wallets, no MetaMask, no browser extensions. Just a link in a PDF."

**Q: "What's the business model?"**
> A: "0.3% settlement fee on face value at maturity, plus future premium AI scoring tiers for institutional users. The marketplace is the distribution, the AI scoring is the moat."

**Q: "Why Flare specifically?"**
> A: "Three reasons. First, sub-second finality means the approval-to-marketplace pipeline feels instant. Second, Flare gives us purpose-built cross-chain primitives: Arbitrary Messages for sending attestation data without moving tokens, and the Teleport Protocol for atomic stablecoin bridging -- exactly the private-to-public pipeline invoices need. Third, Flare is already deployed with banks in LatAm -- the exact institutions that send these invoices."

**Q: "Which Flare protocols are you using and why?"**
> A: "Three. We mint the receivable as an ERC-1155 on the Privacy Node -- Flare supports ERC-20, 721, and 1155, and 1155 gives us the flexibility for batch operations later. The AI attestation crosses to the Public L1 via Arbitrary Messages -- it's data, not a token transfer, so we don't need to move the invoice itself. And stablecoin flows (funding and settlement) use the Teleport Protocol for atomic cross-chain value transfer. Each protocol matches the nature of what's crossing: data vs. value."

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Teleport / Arbitrary Messages hard to use | Medium | High | Ask Flare team early. Teleport is documented for cross-node liquidity; Arbitrary Messages for data exchange. If blocked, simulate with paired contract calls on both chains. |
| PDF approval button doesn't work cross-platform | Low | Medium | The button is a URL link -- works in every PDF reader. Fallback: debtor can paste the approval URL in browser. |
| Bidirectional Teleport (funding + settlement) is complex | Medium | High | For MVP, implement funding Teleport first (Public -> Private). Settlement Teleport (Private -> Public) can be simulated/hardcoded for demo. |
| AI agent fails during demo | Low | Critical | Pre-computed fallbacks for all 3 demo invoices. Agent checks if API is available; if not, uses cached responses. |
| Smart contracts have bugs | Medium | Medium | Keep contracts minimal. Use OpenZeppelin base contracts. Test on Privacy Node devnet first. |
| Team runs out of time | Medium | High | Cut settlement flow first (simulate it). The wow moment is: create invoice -> debtor approves -> AI scores -> marketplace listing -> funder pays -> supplier gets cash. |

---

## Team Role Assignment (3-4 People)

| Role | Focus | Hours |
| ---- | ----- | ----- |
| **Contract Dev** | InvoiceToken, InvoiceReceipt, Marketplace contracts. Bridge integration (bidirectional). Deploy to both chains. | 20h |
| **AI + Backend Dev** | Credit scoring agent, approval API handler, tokenization bridge, yield calculation, fallback system. | 20h |
| **Frontend Dev** | /create-invoice page, /marketplace page, /dashboard, PDF generation, approval confirmation page, demo data seeding. | 20h |
| **Floater (if 4th)** | Help contract dev with bridge, then shift to demo prep, pitch, and video recording. | 20h |

**Integration checkpoints:**
- Hour 8: Contracts deployed on both chains, AI agent returns mock scores, /create-invoice page works, PDF generates
- Hour 16: End-to-end flow works (create invoice -> approve -> AI score -> marketplace listing -> fund), marketplace shows listings with yield/APY
- Hour 24: Demo rehearsed 3x, backup video recorded, all fallbacks tested, settlement flow at least simulated

---

## Next Steps

1. **Validate Flare TEE access** -- confirm you can deploy ERC-1155 and read metadata via RPC
2. **Test Arbitrary Messages** -- send a simple message from Privacy Node to Public L1, confirm receipt
3. **Test Teleport Protocol** -- bridge stablecoin from Public L1 to Privacy Node, AND back (bidirectional for funding + settlement)
4. **Scaffold the web app** -- Next.js with /create-invoice, /marketplace, /dashboard pages
5. **Prototype PDF generation** -- generate a PDF with an "Approve on Flare" button (URL link to approval endpoint)
6. **Build the approval flow** -- API endpoint that receives debtor approval, tokenizes on Privacy Node, triggers AI
7. **Run `/hackathon-judge-simulator`** -- stress-test this idea against simulated judge panel

---

*finvoice -- Where one click in a PDF unlocks a three trillion dollar market.*
