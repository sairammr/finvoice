# Finvoice E2E Test Report

**Date:** 2026-04-04T17:42:04.473Z
**Invoice:** `INV-E2E-1775324511832`

---

## Balances

| Chain | Account | Balance |
|-------|---------|---------|
| Flare Coston2 | [`0x4e9Ff472Ce73a46b91E42f06B940F34F1BDBb83f`](https://coston2-explorer.flare.network/address/0x4e9Ff472Ce73a46b91E42f06B940F34F1BDBb83f) | 99.999999999998468006 C2FLR |
| Hedera Testnet | `0.0.5864744` | 938.88552704 ℏ |
| Flare spent | — | 0 C2FLR |

---

## Flare Transactions

| Step | Tx Hash | Explorer |
|------|---------|----------|
| Deploy Contract | — | [0x616c83ff35d0a9572efb02246ee712a8d062f44b](https://coston2-explorer.flare.network/address/0x616c83ff35d0a9572efb02246ee712a8d062f44b) |
| Create Invoice | reverted (TEE not registered) | — |
| Approve Invoice | reverted (expected) | — |

---

## Hedera Transactions (SDK only, zero Solidity)

| Step | Tx ID | Explorer |
|------|-------|----------|
| Mint Attestation NFT #4 | `0.0.5864744@1775324508.718918377` | [View](https://hashscan.io/testnet/transaction/0.0.5864744@1775324508.718918377) |
| Mint Receipt NFT #4 | `0.0.5864744@1775324512.869238953` | [View](https://hashscan.io/testnet/transaction/0.0.5864744@1775324512.869238953) |
| Burn Receipt NFT #4 | `0.0.5864744@1775324513.014920876` | [View](https://hashscan.io/testnet/transaction/0.0.5864744@1775324513.014920876) |

---

## Hedera Token Collections

| Token | ID | Type | Supply | Explorer |
|-------|----|------|--------|----------|
| Invoice Attestations | `0.0.8509042` | NFT (HTS) | 4 | [View](https://hashscan.io/testnet/token/0.0.8509042) |
| Invoice Receipts | `0.0.8509043` | NFT (HTS) | 0 | [View](https://hashscan.io/testnet/token/0.0.8509043) |

---

## Attestation NFT #4

- **Token:** [0.0.8509042/4](https://hashscan.io/testnet/token/0.0.8509042/4)
- **Owner:** `0.0.5864744`
- **Metadata:** `INV-E2E-1775324511832|A|150|1356|95|0xf5bd7993ce98329823`
- **Decoded:**
  - Invoice: `INV-E2E-1775324511832`
  - Risk Grade: **A**
  - Discount: 150 bps
  - Yield: 1356 bps
  - Confidence: 95/100
  - Attestation Hash: `0xf5bd7993ce98329823...`

---

## AI Scoring Result

| Field | Value |
|-------|-------|
| Risk Grade | **A** |
| Discount | 150 bps (1.50%) |
| Yield (APY) | 1356 bps (13.56%) |
| Confidence | 95/100 |
| Source | GPT-4o-mini |

**Reasoning:**
> The debtor, Confidential Debtor Inc, has an excellent payment history with a AAA rating and has consistently paid on time for 15 years. The jurisdiction of Brazil is considered moderate risk, but the overall risk is mitigated by the debtor's strong track record. The invoice has a face value of $75,000 USDC and a maturity of 41 days beyond the net-30 terms, resulting in a minor adjustment to the discount rate.

---

## Financial Summary

| Metric | Value |
|--------|-------|
| Face Value | $75,000 |
| Purchase Price | $73,875 |
| Discount | $1,125 (1.50%) |
| Platform Fee | $375 (0.5%) |
| Funder Payout | $74,625 |
| **Funder Profit** | **$750** |

---

## Privacy Verification

| Data | Location | On-chain? |
|------|----------|-----------|
| Debtor name: "Confidential Debtor Inc" | MongoDB only | **NO** |
| Debtor email: "secret@debtor.com" | MongoDB only | **NO** |
| Payment history | MongoDB only | **NO** |
| Jurisdiction: "Brazil" | MongoDB only | **NO** |
| AI reasoning | Server/TEE only | **NO** |
| Risk grade: A | Hedera NFT | Yes (public) |
| Yield: 1356 bps | Hedera NFT | Yes (public) |
| Attestation hash | Hedera NFT | Yes (public) |

---

## MongoDB Final Document

```json
{
  "_id": "69d14d603d1aa65efbe13412",
  "id": "INV-E2E-1775324511832",
  "supplier_name": "Finvoice Test Corp",
  "supplier_address": "0x4e9Ff472Ce73a46b91E42f06B940F34F1BDBb83f",
  "debtor_name": "Confidential Debtor Inc",
  "debtor_email": "secret@debtor.com",
  "face_value": 75000,
  "currency": "USDC",
  "terms": "net-30",
  "due_date": "2026-05-15",
  "line_items": [
    {
      "description": "Consulting Services Q2",
      "quantity": 1,
      "unitPrice": 75000
    }
  ],
  "jurisdiction": "Brazil",
  "payment_history": "Excellent payment history, AAA rated, 15 years on time",
  "status": "settled",
  "pdf_hash": "0x4e6b4bf9044811c05337db0abd276934c74370754ddaf355fc47c5b22c37b39f",
  "flare_tx_hash": null,
  "created_at": "2026-04-04T17:41:52.003Z",
  "approved_at": "2026-04-04T17:41:52.403Z",
  "attestation_hash": "0xf5bd7993ce983298236d34c66476ddfd26f94ea60dfc4e0c598420c7423aa38f",
  "confidence_score": 95,
  "discount_bps": 150,
  "hedera_attestation_serial": 4,
  "risk_grade": "A",
  "yield_bps": 1356,
  "funded_at": "2026-04-04T17:41:59.772Z",
  "funder_hedera_id": "0.0.5864744",
  "hedera_receipt_serial": 4,
  "purchase_price": 73875
}
```

---

## Architecture Summary

```
Supplier → Next.js API → Flare TEE (private scoring) → Hedera HTS (public NFTs)
                ↓                                              ↓
           MongoDB Atlas                              HashScan Explorer
        (private data store)                    (only risk grades + hashes)
```

- **Flare Coston2**: InvoiceInstructionSender contract for TEE instructions
- **Hedera Testnet**: HTS NFTs for attestation + receipt (SDK only, zero Solidity)
- **MongoDB Atlas**: Private invoice data (debtor identity, payment history)
- **Privacy**: Debtor PII never appears on any blockchain
