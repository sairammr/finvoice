# finvoice — Hackathon Q&A Prep

Questions judges, sponsors, or technical reviewers might ask during your presentation. Answers align with [`prd.md`](prd.md).

---

## Product & problem

**Why invoice factoring on-chain?**  
The global factoring market runs on PDFs and email; suppliers wait 30–90 days while funders want yield. You connect familiar workflows (invoice + PDF) to liquidity and transparent pricing without forcing TradFi users through wallet-heavy dApp UX.

**What is the “one-liner”?**  
Private invoice factoring: suppliers create invoices on-platform, debtors approve via a special PDF, an AI agent scores confidentially on a sovereign chain, funders earn yield on a public marketplace.

**How is this different from “supplier tokenizes alone”?**  
Debtor approval is the trust signal: it shows the obligation is acknowledged and reduces fraud. Unilateral supplier tokenization does not give that signal.

**Who is the customer?**  
Suppliers (liquidity), funders (yield), and indirectly debtors (single-click consent in a PDF). The marketplace matches priced risk to capital.

---

## Privacy & disclosure

**Why not put everything on a public L1?**  
Debtor identity, payment history, and terms are competitive intelligence. The PRD’s split mirrors institutional logic: private chain holds raw data; public side gets pricing signals (grade, yield, tenure, face value, confidence) — not debtor-identifying fields.

**How does debtor identity stay private on the public marketplace?**  
Listings expose face value, maturity, risk grade, APY, tenure, confidence — not debtor name, jurisdiction, or payment history. The AI acts as a disclosure gate.

**What crosses between Privacy Node and Public L1?**  
- **Data (no token movement):** AI attestation via **Arbitrary Messages** (risk grade, discount, yield, confidence, hashes).  
- **Value:** Stablecoin flows via **Teleport** (funding and settlement).

---

## Technical & Flare

**Why Flare specifically?**  
Sub-second finality for a snappy demo; native **Arbitrary Messages** for attestations without moving the invoice token; **Teleport** for atomic cross-chain stablecoin moves; alignment with LatAm banking use cases mentioned in the PRD.

**Why ERC-1155 on the Privacy Node and ERC-721 receipts on Public L1?**  
Per PRD/Flare guidance: ERC-1155 fits hybrid receivables and batch operations later; ERC-721 represents a unique funded position (receipt) for the funder.

**How does the PDF “talk to the blockchain”?**  
The “Approve on Flare” control is a **URL** to your approval API (e.g. `/api/approve?invoiceId=…&token=…`). The debtor opens the link, confirms on a web page, and the backend drives tokenization — no embedded wallet in the PDF.

**What if the PDF button fails on some readers?**  
Fallback: paste the approval URL into a browser. The critical path is HTTP, not a proprietary PDF plugin.

**How is this different from a private database?**  
A DB is operator-trusted. The Privacy Node gives EVM-level guarantees; attestations and bridges are verifiable on-chain; the public side can trust the pipeline without seeing raw debtor data.

---

## AI & risk

**What does the AI actually do?**  
It reads **private** invoice metadata (history, jurisdiction, terms), outputs a risk grade (A–D), discount/yield, confidence, and keeps full reasoning on the private side. Public output is structured attestation only — no private fields.

**What if the AI scores wrong?**  
The AI is a recommendation engine, not an infallible oracle. Reasoning is auditable on the private side; funders see **confidence** and grade — the market prices uncertainty.

**Could the AI leak PII in the public attestation?**  
The system prompt and pipeline are designed so only grade, basis points, confidence, and hashes cross; private reasoning never goes to Public L1 in the intended design.

**What about sanctions / compliance?**  
The PRD includes compliance screening in the agent’s processing; for the hackathon, emphasize the **design** and any live checks you actually wired.

---

## Economics & settlement

**Who “pays” the yield?**  
Nobody pays extra on top of the invoice. The funder buys future cash flow at a **discount**; the spread vs face value at maturity is the return. The supplier trades a discount for immediate liquidity.

**What does the debtor pay?**  
In the factoring model described, the debtor pays the **face amount** they already owed at maturity; routing through the platform does not change that nominal obligation.

**How does the platform make money?**  
Example in PRD: **0.3% of face value** at settlement to treasury; future premium tiers for institutions.

**What if the debtor defaults?**  
Receipt token represents a claim tied to the invoice; risk grades price default probability. Legal recourse remains in the real world — you are not eliminating credit risk, you are **pricing** and **structuring** it.

---

## Demo & MVP honesty

**What’s real vs simulated for the hackathon?**  
PRD lists must-ship items (web app, PDF, approval API, contracts, AI agent, attestation, marketplace UI, bridge, fund flow) vs deferred items (full auth, TEE, settlement polish, real debtor payment rails). Be ready to say exactly what is live in your build.

**What if the LLM API fails mid-demo?**  
PRD suggests **pre-computed** responses for seeded demo invoices as fallback so the pipeline still completes.

**Can you cut scope if integration is hard?**  
PRD suggests prioritizing **funding** Teleport first; settlement Teleport can be simulated for MVP if needed.

---

## Security & abuse

**How do you stop someone from approving fake invoices?**  
Debtor approval + hashed PDF + on-chain consent timestamp reduce unilateral fraud; AI and confidence scores add another layer. For hackathon depth: mention rate limits, single-use tokens on approval links, and future KYC where relevant.

**Is the approval link safe to email?**  
Design should use **single-use, time-limited** tokens on the approval URL; explain what you implemented.

---

## Competitive & vision

**How do you differ from traditional factoring desks?**  
Faster pipeline, programmable settlement, privacy-preserving disclosure, and global funder access via a marketplace — framed against PDF/email latency and identity leakage to intermediaries.

**What’s the 12-month roadmap after the hack?**  
Reasonable directions from PRD: real auth, richer settlement, Enygma/institutional features, notifications, portfolio dashboards — pick 2–3 credible next steps.

---

## Adversarial quick hits (from PRD)

These are copied in spirit from [`prd.md`](prd.md) § Adversarial Q&A Preparation — rehearse them verbatim if useful.

| Question | Short answer direction |
| -------- | ---------------------- |
| Private DB vs chain? | Cryptographic guarantees, verifiable attestations, trustless bridge — not just a server you trust. |
| AI wrong decision? | Auditable private reasoning; confidence + grade let the market price error risk. |
| Why debtor approval? | Legitimacy + consent; reduces fraud vs supplier-only mint. |
| Debtor doesn’t pay at maturity? | Legal claim on the receivable; default risk already in the grade. |
| How does funder earn yield? | Buy at discount, receive face at maturity — classic factoring math. |
| PDF ↔ blockchain? | URL → web confirmation → backend mints / triggers pipeline. |
| Business model? | Settlement fee + future premium AI tiers. |
| Why Flare / which protocols? | Finality; Arbitrary Messages for data; Teleport for value; ERC-1155 mint on private side. |

---

## Questions to ask yourself before Q&A

- Can I point to **one transaction** on each explorer (Privacy Node + Public L1) for the demo path?
- What **exactly** is on the public listing vs only on the private node?
- What did we **not** ship (auth, full settlement, edge cases) and why is the demo still valid?
- If Teleport or Arbitrary Messages were partial, how did we **simulate** safely without misleading?

---

*Derived from `prd.md` — update this file when the product or demo scope changes.*
