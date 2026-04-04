# Hedsup - Private Invoice Factoring on Flare + Hedera

## Project Context

Invoice factoring platform migrated from Flare to Flare TEE + Hedera HTS for ETHGlobal Cannes 2026.

### Architecture
- **Flare TEE** (Confidential Compute): Private invoice data, AI scoring inside TEE
- **Hedera HTS** (SDK only, no Solidity): Attestation NFTs, Receipt NFTs, HBAR transfers
- **Only Solidity**: `tee-extension/contract/InvoiceInstructionSender.sol` on Flare Coston2

### Bounties
- **Main Track ($5K/$2K/$1K)**: Build with TEE Extensions and/or Smart Accounts
- **Bonus Track ($1K x2)**: Best Smart Account App

### Key Requirements
- Must implement TEE extension OR use Flare Smart Accounts (or both)
- Must address real-world problems
- Add feedback in README about building on Flare experience

## Network Config
- **Flare**: Coston2 testnet, chain ID 114, RPC: `https://coston2-api.flare.network/ext/C/rpc`
- **Hedera**: Testnet, SDK-only (no Solidity)
- **EVM version**: `cancun` for all Flare contracts

## Key Files
- `src/lib/contracts.ts` — Flare viem client
- `src/lib/hedera.ts` — Hedera HTS SDK client
- `tee-extension/` — Flare TEE extension (handlers, contract)
- `src/app/api/` — Next.js API routes
- `supabase/schema.sql` — Database schema

## Flare Skills
Custom skills in `.claude/skills/`:
- `flare-network` — Network config, RPCs, contract addresses
- `flare-tee-extensions` — TEE/FCE extension development
- `flare-smart-accounts` — XRPL-to-Flare account abstraction
- `flare-ftso` — Price feed oracle
- `flare-fdc` — Cross-chain data verification
- `flare-fassets` — Bridged assets
- `flare-secure-random` — On-chain randomness

## Support
- Flare team at hackathon booth
- Telegram: https://t.me/+KAp2qGOMywE3MGRh
