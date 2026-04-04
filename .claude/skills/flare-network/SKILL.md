---
name: flare-network
description: Use when building on Flare Network, configuring networks, deploying contracts, or setting up development environments for Flare, Coston, or Coston2. Covers RPC endpoints, chain IDs, faucets, explorers, tooling, and starter kits.
---

# Flare Network Development

## Overview

Flare is the blockchain for data -- an EVM-compatible smart contract platform with decentralized oracles built into the network. EVM version must be set to `cancun` for all Flare contracts.

## Network Configuration

| Property | Coston (Testnet) | Coston2 (Testnet) | Flare (Mainnet) |
|----------|-----------------|-------------------|-----------------|
| Chain ID | 16 | 114 | 14 |
| Asset | CFLR | C2FLR | FLR |
| Public RPC | `https://coston-api.flare.network/ext/C/rpc` | `https://coston2-api.flare.network/ext/C/rpc` | `https://flare-api.flare.network/ext/C/rpc` |
| WebSocket | `wss://coston-api.flare.network/ext/C/ws` | `wss://coston2-api.flare.network/ext/C/ws` | `wss://flare-api.flare.network/ext/C/ws` |
| Explorer | `https://coston-explorer.flare.network` | `https://coston2-explorer.flare.network` | `https://flare-explorer.flare.network` |
| Faucet | `https://faucet.flare.network/coston` | `https://faucet.flare.network/coston2` | N/A |
| DA Layer | `https://ctn-data-availability.flare.network/api-doc` | `https://ctn2-data-availability.flare.network/api-doc` | `https://flr-data-availability.flare.network/api-doc` |

## Key Flare Products

| Product | Description | Docs |
|---------|-------------|------|
| **FCC (TEE Extensions)** | Trusted Execution Environments for secure off-chain compute | `https://dev.flare.network/fcc/overview` |
| **Smart Accounts** | XRPL users perform Flare actions via XRPL payments | `https://dev.flare.network/smart-accounts/overview` |
| **FTSO** | Decentralized price feeds from ~100 data providers | `https://dev.flare.network/ftso/getting-started` |
| **FDC** | Verify cross-chain and Web2 data on-chain | `https://dev.flare.network/fdc/getting-started` |
| **FAssets** | Trustless bridge: XRP/BTC/DOGE/LTC to Flare as ERC-20 | `https://dev.flare.network/fassets/overview` |
| **Secure Random** | On-chain random numbers every 90 seconds | `https://dev.flare.network/network/guides/secure-random-numbers` |

## Starter Kits

- **Hardhat**: `https://github.com/flare-foundation/flare-hardhat-starter`
- **Foundry**: `https://github.com/flare-foundation/flare-foundry-starter`
- **TEE Sign Extension**: `https://github.com/flare-foundation/fce-sign`
- **TEE Weather API Extension**: `https://github.com/flare-foundation/fce-weather-api`
- **Smart Accounts (Viem)**: `https://github.com/flare-foundation/flare-smart-accounts-viem`

## NPM Packages

```bash
npm install @flarenetwork/flare-periphery-contracts          # Solidity interfaces
npm install @flarenetwork/flare-periphery-contract-artifacts  # ABIs + addresses
npm install @flarenetwork/smart-accounts-encoder              # Smart account encoding
```

## Hardhat Configuration (Coston2)

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.25",
    settings: { evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    coston2: {
      url: "https://coston2-api.flare.network/ext/C/rpc",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 114,
    },
    flare: {
      url: "https://flare-api.flare.network/ext/C/rpc",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 14,
    },
  },
  etherscan: {
    apiKey: { coston2: "any-string-works", flare: "any-string-works" },
    customChains: [
      {
        network: "coston2",
        chainId: 114,
        urls: {
          apiURL: "https://coston2-explorer.flare.network/api",
          browserURL: "https://coston2-explorer.flare.network",
        },
      },
    ],
  },
};
export default config;
```

## Viem Configuration

```typescript
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { flareTestnet } from "viem/chains"; // Coston2

export const publicClient = createPublicClient({
  chain: flareTestnet,
  transport: http(),
});
export const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
export const walletClient = createWalletClient({
  chain: flareTestnet,
  transport: http(),
  account,
});
```

## Foundry Configuration

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
evm_version = "cancun"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
coston2 = "https://coston2-api.flare.network/ext/C/rpc"
flare = "https://flare-api.flare.network/ext/C/rpc"
```

## Contract Registry

All Flare system contracts are discoverable via `ContractRegistry`:

```solidity
import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";

// Examples:
IFtsoV2 ftsoV2 = ContractRegistry.getFtsoV2();           // Production (payable)
IFtsoV2 testFtso = ContractRegistry.getTestFtsoV2();      // Testing (view, free)
RandomNumberV2Interface random = ContractRegistry.getRandomNumberV2();
```

## Key Contract Addresses (Coston2)

| Contract | Address |
|----------|---------|
| FlareContractRegistry | `0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019` |
| TeeExtensionRegistry | `0x3d478d43426081BD5854be9C7c5c183bfe76C981` |
| TeeMachineRegistry | `0x5918Cd58e5caf755b8584649Aa24077822F87613` |
| TeeVerification | `0x4D504e6717C63931F3FC36502EFdDAddc6Ce80A8` |
| FdcHub | `0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b` |
| RandomNumberV2 | `0x5CdF9eAF3EB8b44fB696984a1420B56A7575D250` |
| Relay | `0xa10B672D1c62e5457b17af63d4302add6A99d7dE` |
| FlareSystemsManager | `0xA90Db6D10F856799b10ef2A77EBCbF460aC71e52` |

## FDC Verifier Endpoints (Testnet)

| Chain | URL |
|-------|-----|
| EVM | `https://fdc-verifiers-testnet.flare.network/verifier/api-doc` |
| BTC | `https://fdc-verifiers-testnet.flare.network/verifier/btc/api-doc` |
| XRP | `https://fdc-verifiers-testnet.flare.network/verifier/xrp/api-doc` |
| DOGE | `https://fdc-verifiers-testnet.flare.network/verifier/doge/api-doc` |
| Web2 JSON | `https://jq-verifier-test.flare.rocks/` |

## Environment Template

```bash
# .env
PRIVATE_KEY=0x...                    # Funded wallet private key
FLARE_RPC_API_KEY=                   # Optional: bypasses rate limits
FLARE_EXPLORER_API_KEY=any-string    # Blockscout accepts any non-empty string

# FDC
VERIFIER_URL_TESTNET=https://fdc-verifiers-testnet.flare.network
VERIFIER_API_KEY_TESTNET=00000000-0000-0000-0000-000000000000
COSTON2_DA_LAYER_URL=https://ctn2-data-availability.flare.network
X_API_KEY=12345

# XRPL (for Smart Accounts)
XRPL_SECRET=s...
XRPL_TESTNET_RPC_URL=wss://testnet.xrpl-labs.com
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
```

## Wallet & Auth Tooling

- **Web3Auth**: `https://web3auth.io/docs/connect-blockchain/evm/flare/`
- **WAGMI + RainbowKit**: `https://wagmi.sh/react/chains` / `https://www.rainbowkit.com/docs/introduction`
- **EtherSpot (AA)**: `https://etherspot.fyi/introduction`

## Common Mistakes

- Forgetting `evmVersion: "cancun"` -- all Flare contracts require it
- Using `ContractRegistry.getFtsoV2()` in tests -- use `getTestFtsoV2()` (free, view functions)
- Not checking `isSecure` flag on random numbers before using them
- Public RPCs are rate-limited -- get API key from Flare team for hackathons
