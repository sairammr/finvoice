---
name: flare-smart-accounts
description: Use when building with Flare Smart Accounts, enabling XRPL users to interact with Flare without EVM wallets, encoding XRPL payment instructions, minting FXRP, custom instructions, or bridging XRP to Flare via account abstraction.
---

# Flare Smart Accounts

## Overview

Flare Smart Accounts let XRPL users perform actions on Flare by sending XRPL Payment transactions with encoded instructions in the memo field. Each XRPL address gets a deterministic personal account (smart contract) on Flare -- no FLR or EVM wallet needed.

## How It Works

1. **User sends XRPL Payment** to an operator address with encoded instruction as memo
2. **Operator bridges** the payment proof to Flare via FDC
3. **Personal account** on Flare executes the decoded instruction

## Starter Repo

```bash
git clone https://github.com/flare-foundation/flare-smart-accounts-viem.git
cd flare-smart-accounts-viem
npm install
cp .env.example .env
# Set: PRIVATE_KEY, XRPL_SEED, COSTON2_RPC_URL
```

## Dependencies

```bash
npm install viem xrpl @flarenetwork/smart-accounts-encoder @flarenetwork/flare-wagmi-periphery-package
```

## Instruction Encoding Format

32-byte payment reference:
- **Byte 0**: Instruction code = type nibble (4 bits) + command nibble (4 bits)
- **Byte 1**: Wallet identifier (0 unless assigned by Flare Foundation)
- **Bytes 2-31**: Instruction parameters (30 bytes)

### Instruction Types

| Type ID | Category | Commands |
|---------|----------|----------|
| `0x00` | FXRP | `00` collateralReservation, `01` transfer, `02` redeem |
| `0x01` | Firelight | `00` collateralReservationAndDeposit, `01` deposit, `02` redeem, `03` claimWithdraw |
| `0x02` | Upshift | `00` collateralReservationAndDeposit, `01` deposit, `02` requestRedeem, `03` claim |
| `0xff` | Custom | Arbitrary EVM calls via hash |

## Core Utilities

### Client Setup

```typescript
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { flareTestnet } from "viem/chains";

export const publicClient = createPublicClient({
  chain: flareTestnet,
  transport: http(),
});
export const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
export const walletClient = createWalletClient({
  chain: flareTestnet, transport: http(), account,
});
```

### Personal Account Lookup

```typescript
import * as coston2 from "@flarenetwork/flare-wagmi-periphery-package/coston2";

const FLARE_CONTRACT_REGISTRY = "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019";

async function getMasterAccountControllerAddress(): Promise<`0x${string}`> {
  return await publicClient.readContract({
    address: FLARE_CONTRACT_REGISTRY,
    abi: [{ name: "getContractAddressByName", type: "function", stateMutability: "view",
            inputs: [{ name: "_name", type: "string" }],
            outputs: [{ name: "", type: "address" }] }],
    functionName: "getContractAddressByName",
    args: ["MasterAccountController"],
  });
}

async function getPersonalAccountAddress(xrplAddress: string): Promise<`0x${string}`> {
  return await publicClient.readContract({
    address: await getMasterAccountControllerAddress(),
    abi: coston2.iMasterAccountControllerAbi,
    functionName: "getPersonalAccount",
    args: [xrplAddress],
  });
}
```

### Get Operator Addresses & Fees

```typescript
async function getOperatorXrplAddresses(): Promise<string[]> {
  return await publicClient.readContract({
    address: await getMasterAccountControllerAddress(),
    abi: coston2.iMasterAccountControllerAbi,
    functionName: "getXrplProviderWallets",
    args: [],
  });
}

async function getInstructionFee(encodedInstruction: string): Promise<string> {
  const instructionId = encodedInstruction.slice(0, 4); // first 2 bytes
  const fee = await publicClient.readContract({
    address: await getMasterAccountControllerAddress(),
    abi: coston2.iMasterAccountControllerAbi,
    functionName: "getInstructionFee",
    args: [fromHex(instructionId as `0x${string}`, "bigint")],
  });
  return dropsToXrp(Number(fee));
}
```

## Standard Instructions (FXRP)

### Mint FXRP (Collateral Reservation)

```typescript
import {
  FXRPCollateralReservationInstruction,
  FXRPTransferInstruction,
} from "@flarenetwork/smart-accounts-encoder";

// Step 1: Reserve collateral
const reserveInstruction = new FXRPCollateralReservationInstruction({
  walletId: 0,
  value: 1,           // XRP amount
  agentVaultId: 1,    // Get from getAgentVaults()
});
const encoded = reserveInstruction.encode();

// Step 2: Get fee and send XRPL payment
const fee = await getInstructionFee(encoded);
const operators = await getOperatorXrplAddresses();
await sendXrplPayment({
  destination: operators[0],
  amount: fee,
  memos: [{ Memo: { MemoData: encoded.slice(2) } }], // strip 0x
  wallet: xrplWallet,
  client: xrplClient,
});

// Step 3: Wait for CollateralReserved event on Flare
// Step 4: Send XRP to payment address from event
// Step 5: Wait for MintingExecuted event
```

### Transfer FXRP

```typescript
const transferInstruction = new FXRPTransferInstruction({
  walletId: 0,
  value: 10 * 10 ** decimals,                    // Amount in smallest unit
  recipientAddress: recipientAddress.slice(2),     // Strip 0x prefix
});
const encoded = transferInstruction.encode();
// Send as XRPL payment memo
```

### Upshift (Mint + Vault Deposit)

```typescript
import { UpshiftCollateralReservationAndDepositInstruction } from "@flarenetwork/smart-accounts-encoder";

const instruction = new UpshiftCollateralReservationAndDepositInstruction({
  walletId: 0,
  value: 1,
  agentVaultId: 1,
  vaultId: 2,        // Get from getVaults()
});
```

## Custom Instructions (Arbitrary EVM Calls)

Custom instructions enable ANY function call on Flare from XRPL:

```typescript
import { encodeFunctionData, toHex } from "viem";

// 1. Define custom instructions
interface CustomInstruction {
  targetContract: `0x${string}`;
  value: bigint;
  data: `0x${string}`;
}

const customInstructions: CustomInstruction[] = [
  {
    targetContract: "0x1234...",  // Your contract
    value: BigInt(0),
    data: encodeFunctionData({
      abi: yourContractAbi,
      functionName: "yourFunction",
      args: [arg1, arg2],
    }),
  },
  // Can batch multiple calls
];

// 2. Register on-chain (one-time EVM transaction)
async function registerCustomInstruction(instructions: CustomInstruction[]): Promise<`0x${string}`> {
  const masterController = await getMasterAccountControllerAddress();
  const hash = await walletClient.writeContract({
    address: masterController,
    abi: coston2.iMasterAccountControllerAbi,
    functionName: "registerCustomInstruction",
    args: [instructions],
  });
  return hash;
}

// 3. Encode for XRPL memo (0xff + walletId + hash[30 bytes])
async function encodeCustomInstruction(
  instructions: CustomInstruction[], walletId: number
): Promise<`0x${string}`> {
  const hash = await getCustomInstructionHash(instructions);
  // Cut off 0x prefix and first 2 bytes to fit 30-byte parameter space
  return ("0xff" + toHex(walletId, { size: 1 }).slice(2) + hash.slice(6)) as `0x${string}`;
}

// 4. Send via XRPL
const encoded = await encodeCustomInstruction(customInstructions, 0);
const fee = await getInstructionFee(encoded);
await sendXrplPayment({
  destination: operators[0],
  amount: fee,
  memos: [{ Memo: { MemoData: encoded.slice(2) } }],
  wallet: xrplWallet,
  client: xrplClient,
});

// 5. Wait for CustomInstructionExecuted event
```

## XRPL Payment Helper

```typescript
import { Client, Wallet, xrpToDrops, dropsToXrp } from "xrpl";

async function sendXrplPayment({
  destination, memos, amount, wallet, client,
}: {
  destination: string;
  memos: any[];
  amount: string;
  wallet: Wallet;
  client: Client;
}) {
  await client.connect();
  const prepared = await client.autofill({
    TransactionType: "Payment",
    Account: wallet.address,
    Amount: xrpToDrops(amount),
    Destination: destination,
    Memos: memos,
  });
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  await client.disconnect();
  return result;
}
```

## Checking Smart Account Status

```typescript
async function isSmartAccount(evmAddress: `0x${string}`): Promise<boolean> {
  try {
    const xrplOwner = await publicClient.readContract({
      address: evmAddress,
      abi: coston2.iPersonalAccountAbi,
      functionName: "xrplOwner",
      args: [],
    });
    return xrplOwner && xrplOwner.length > 0;
  } catch {
    return false;
  }
}
```

## State Lookup

```typescript
// Get vaults
const vaults = await publicClient.readContract({
  address: await getMasterAccountControllerAddress(),
  abi: coston2.iMasterAccountControllerAbi,
  functionName: "getVaults",
  args: [],
}); // Returns: [{id, address, type}]

// Get agent vaults
const agentVaults = await publicClient.readContract({
  address: await getMasterAccountControllerAddress(),
  abi: coston2.iMasterAccountControllerAbi,
  functionName: "getAgentVaults",
  args: [],
}); // Returns: [{id, address}]

// Get FXRP balance
const assetManagerAddr = await getContractAddress("AssetManagerFXRP");
const fxrpAddr = await publicClient.readContract({
  address: assetManagerAddr,
  abi: coston2.iAssetManagerAbi,
  functionName: "fAsset",
  args: [],
});
const balance = await publicClient.readContract({
  address: fxrpAddr,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [personalAccountAddress],
});
```

## Environment Setup

```bash
# .env
PRIVATE_KEY=0x...                              # EVM signer (for registerCustomInstruction)
XRPL_SEED=s...                                 # XRPL wallet seed
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
XRPL_TESTNET_RPC_URL=wss://testnet.xrpl-labs.com
VERIFIER_URL_TESTNET=https://fdc-verifiers-testnet.flare.network/
COSTON2_DA_LAYER_URL=https://ctn2-data-availability.flare.network/
```

## Complete Mint-and-Transfer Flow

1. Get personal account address from XRPL wallet
2. Encode `FXRPCollateralReservationInstruction`
3. Send XRPL payment to operator with instruction memo
4. Wait for `CollateralReserved` event (extract paymentAddress, paymentReference, valueUBA, feeUBA)
5. Send second XRPL payment: amount = `dropsToXrp(valueUBA + feeUBA)`, destination = paymentAddress, memo = paymentReference
6. Wait for `MintingExecuted` event
7. Encode `FXRPTransferInstruction`
8. Send XRPL payment with transfer instruction
9. Wait for `FXrpTransferred` event

## Common Mistakes

- Forgetting to strip `0x` prefix when putting encoded instruction in XRPL memo
- Not registering custom instructions on-chain before sending via XRPL
- Using wrong walletId (use 0 unless assigned by Flare Foundation)
- Custom instruction hash uses only 30 bytes (first 2 bytes of hash are truncated)
- Need both EVM wallet (for registration) AND XRPL wallet (for payments)
- Fee is in XRP drops, convert with `dropsToXrp()` / `xrpToDrops()`
