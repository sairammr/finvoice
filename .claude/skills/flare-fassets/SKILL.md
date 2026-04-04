---
name: flare-fassets
description: Use when working with FAssets on Flare -- minting FXRP/FBTC/FDOGE, bridging non-smart-contract assets (XRP, BTC, DOGE, LTC) to Flare as ERC-20 tokens, integrating FAssets in DeFi, or building with the FAssets collateral/redemption system.
---

# FAssets on Flare

## Overview

FAssets is a trustless, over-collateralized bridge connecting non-smart-contract networks (XRP, BTC, DOGE, LTC) to Flare. Wrapped tokens (FXRP, FBTC, FDOGE) are standard ERC-20 tokens on Flare, fully redeemable for the original assets. Relies on FTSO (price feeds) and FDC (transaction verification).

## Supported Assets

| Underlying | FAsset | Network |
|------------|--------|---------|
| XRP | FXRP | XRP Ledger |
| BTC | FBTC | Bitcoin |
| DOGE | FDOGE | Dogecoin |
| LTC | FLTC | Litecoin |

## Three-Stage Lifecycle

### 1. Minting
1. User selects an agent and reserves collateral
2. User sends underlying asset (e.g., XRP) to agent's custody address
3. FDC verifies the transaction on the source chain
4. Equivalent FAssets are minted as ERC-20 on Flare

### 2. Usage
- Trade on Flare DEXes
- Use as DeFi collateral
- Bridge to other chains via LayerZero
- Deposit into yield vaults (Upshift, Firelight)

### 3. Redemption
- Burn FAssets on Flare
- Receive original underlying assets on source chain

## Collateral Model

Each FAsset is backed by:
- **Vault collateral**: Stablecoins/ETH provided by agents
- **Pool collateral**: FLR/SGB from community collateral pools
- Both must exceed minimum ratios (the "backing factor")

## System Participants

| Role | Description |
|------|-------------|
| **Agents** | Manage custody, collateral, and redemptions |
| **Collateral Providers** | Supply FLR to agent pools, earn minting fees |
| **Liquidators** | Burn FAssets when collateral drops below minimum |
| **Challengers** | Monitor for illegal agent transactions |

## Integration with Smart Accounts

FAssets are the primary use case for Flare Smart Accounts. XRPL users can mint FXRP and interact with Flare DeFi entirely from their XRPL wallet:

```typescript
import { FXRPCollateralReservationInstruction } from "@flarenetwork/smart-accounts-encoder";

// Mint FXRP via Smart Account
const instruction = new FXRPCollateralReservationInstruction({
  walletId: 0,
  value: 1,           // XRP amount
  agentVaultId: 1,
});
// Send as XRPL payment memo to operator
```

See the **flare-smart-accounts** skill for the complete flow.

## Reading FAsset Data On-Chain

```solidity
import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";

// Get AssetManager address from FlareContractRegistry
// AssetManagerFXRP, AssetManagerFBTC, etc.
```

```typescript
import * as coston2 from "@flarenetwork/flare-wagmi-periphery-package/coston2";

// Get FXRP token address
const assetManagerAddr = await getContractAddress("AssetManagerFXRP");
const fxrpAddress = await publicClient.readContract({
  address: assetManagerAddr,
  abi: coston2.iAssetManagerAbi,
  functionName: "fAsset",
  args: [],
});

// Read FXRP balance (standard ERC-20)
const balance = await publicClient.readContract({
  address: fxrpAddress,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [userAddress],
});

// Get FXRP decimals
const decimals = await publicClient.readContract({
  address: fxrpAddress,
  abi: erc20Abi,
  functionName: "decimals",
  args: [],
});
```

## Cross-Chain with LayerZero (OFT)

FAssets can bridge to other chains using LayerZero's OFT standard:

```typescript
// Coston2 addresses
const COSTON2_COMPOSER = "0x5051E8db650E9e0E2a3f03010Ee5c60e79CF583E";
const SEPOLIA_FXRP_OFT = "0x81672c5d42F3573aD95A0bdfBE824FaaC547d4E6";
const HYPEREVM_FXRP_OFT = "0x14bfb521e318fc3d5e92A8462C65079BC7d4284c";
```

## DeFi Integration Patterns

### Vault Deposits (Upshift/Firelight)

```typescript
import { UpshiftCollateralReservationAndDepositInstruction } from "@flarenetwork/smart-accounts-encoder";

// Mint FXRP and deposit into vault in one step
const instruction = new UpshiftCollateralReservationAndDepositInstruction({
  walletId: 0,
  value: 1,
  agentVaultId: 1,
  vaultId: 2,    // from getVaults()
});
```

### Custom DeFi via Custom Instructions

```typescript
// Approve FXRP spending + deposit as collateral in one batch
const customInstructions = [
  {
    targetContract: fxrpAddress,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [lendingContract, amount],
    }),
  },
  {
    targetContract: lendingContract,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: lendingAbi,
      functionName: "depositCollateral",
      args: [fxrpAddress, amount],
    }),
  },
];
// Register + send via Smart Account custom instruction
```

## Minting dApps

- `https://fasset.oracle-daemon.com/flare`
- `https://fassets.au.cc`

## Supported Wallets

| Wallet | Flare | XRPL |
|--------|-------|------|
| Bifrost | Yes | Yes |
| Ledger | Yes | Yes |
| Luminite | Yes | Yes |
| MetaMask | Yes | No |
| Xaman | No | Yes |

**Complete minting requires both a Flare-compatible AND an XRPL-compatible wallet** (unless using Smart Accounts).

## Common Mistakes

- Trying to mint without both wallets -- use Smart Accounts to simplify
- Not accounting for minting fees when calculating XRP amount to send
- Forgetting that FAssets are standard ERC-20 -- use normal token interfaces
- Not waiting for FDC verification after sending underlying asset
