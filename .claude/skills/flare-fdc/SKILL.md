---
name: flare-fdc
description: Use when integrating Flare Data Connector (FDC) to verify cross-chain data, attest EVM transactions, verify payments on Bitcoin/XRP/DOGE, fetch Web2 API data on-chain, or build cross-chain dApps with Merkle proof verification on Flare.
---

# Flare Data Connector (FDC)

## Overview

FDC enables smart contracts on Flare to securely access and verify data from other blockchains (BTC, XRP, DOGE, ETH) and Web2 APIs. Data providers reach consensus on external data, publish Merkle roots on-chain, and users verify proofs against them.

## Supported Sources

**Blockchains:** Bitcoin, Dogecoin, XRP Ledger, Ethereum, Songbird, Flare (+ testnets)

**Attestation Types:**

| Type | Hex (bytes32) | Purpose |
|------|---------------|---------|
| EVMTransaction | `0x45564d5472616e73616374696f6e...` | Verify EVM chain transactions |
| Payment | `0x5061796d656e74...` | Verify payment on any supported chain |
| AddressValidity | `0x41646472657373...` | Validate address format |
| Web2Json | `0x576562324a736f6e...` | Fetch and verify Web2 API data |

## Five-Step Attestation Flow

### Step 1: Identify the Data

Find the transaction hash, payment, or API endpoint you want to attest.

### Step 2: Prepare Attestation Request

```typescript
const VERIFIER_URL = "https://fdc-verifiers-testnet.flare.network";
const API_KEY = "00000000-0000-0000-0000-000000000000"; // Public testnet key

// EVM Transaction example
const prepareResponse = await fetch(
  `${VERIFIER_URL}/verifier/eth/EVMTransaction/prepareRequest`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": API_KEY,
    },
    body: JSON.stringify({
      attestationType: "0x45564d5472616e73616374696f6e000000000000000000000000000000000000",
      sourceId: "0x7465737445544800000000000000000000000000000000000000000000000000", // "testETH"
      requestBody: {
        transactionHash: "0x4e636c6590b22d8dcdade7ee3b5ae5572f42edb1878f09b3034b2f7c3362ef3c",
        requiredConfirmations: "1",
        provideInput: true,
        listEvents: true,
        logIndices: [],
      },
    }),
  }
);

const { status, abiEncodedRequest } = await prepareResponse.json();
// status should be "VALID"
```

### Step 3: Submit to FDC Hub

```typescript
import { createWalletClient, http } from "viem";
import { flareTestnet } from "viem/chains";

const FDC_HUB = "0x1c78A073E3BD2aCa4cc327d55FB0cD4f0549B55b"; // Coston2

const fdcHubAbi = [{
  name: "requestAttestation",
  type: "function",
  stateMutability: "payable",
  inputs: [{ name: "_data", type: "bytes" }],
  outputs: [{ name: "", type: "bool" }],
}] as const;

const hash = await walletClient.writeContract({
  address: FDC_HUB,
  abi: fdcHubAbi,
  functionName: "requestAttestation",
  args: [abiEncodedRequest],
  value: parseEther("0.5"), // Attestation fee
});

// Calculate round ID
const FIRST_VOTING_START = 1658429955n;
const EPOCH_DURATION = 90n;
const blockTimestamp = BigInt(Math.floor(Date.now() / 1000));
const roundId = (blockTimestamp - FIRST_VOTING_START) / EPOCH_DURATION;
// Finalization takes 90-180 seconds
```

### Step 4: Get Proof from DA Layer

```typescript
const DA_LAYER_URL = "https://ctn2-data-availability.flare.network";

// Wait for finalization, then fetch proof
const proofResponse = await fetch(
  `${DA_LAYER_URL}/api/v0/fdc/get-proof-round-id-bytes`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": "12345",
    },
    body: JSON.stringify({
      roundId: roundId.toString(),
      requestBytes: abiEncodedRequest,
    }),
  }
);

const { response, proof } = await proofResponse.json();
// response = full attestation data
// proof = Merkle proof array
```

### Step 5: Verify and Use On-Chain

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {IFdcVerification} from "@flarenetwork/flare-periphery-contracts/coston2/IFdcVerification.sol";
import {IEVMTransaction} from "@flarenetwork/flare-periphery-contracts/coston2/IEVMTransaction.sol";

contract EVMTransactionVerifier {
    function verifyTransaction(
        IEVMTransaction.Proof calldata _proof
    ) external view returns (bool) {
        IFdcVerification fdcVerification = ContractRegistry.getFdcVerification();
        return fdcVerification.verifyEVMTransaction(_proof);
    }

    function processTransaction(
        IEVMTransaction.Proof calldata _proof
    ) external {
        require(verifyTransaction(_proof), "Invalid proof");

        // Access verified data
        IEVMTransaction.ResponseBody memory body = _proof.data.responseBody;
        address sourceAddress = body.sourceAddress;
        uint256 value = body.value;
        uint8 status = body.status;

        // Process events
        for (uint i = 0; i < body.events.length; i++) {
            IEVMTransaction.Event memory evt = body.events[i];
            address emitter = evt.emitterAddress;
            bytes32 eventSignature = evt.topics[0];
            // e.g., keccak256("Transfer(address,address,uint256)")
        }
    }
}
```

## Web2 JSON Attestation

Fetch and verify any public API data on-chain:

```typescript
// Prepare Web2Json request
const prepareResponse = await fetch(
  `${JQ_VERIFIER_URL}/Web2Json/prepareRequest`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": API_KEY },
    body: JSON.stringify({
      attestationType: "0x576562324a736f6e000000000000000000000000000000000000000000000000",
      sourceId: "0x5745423200000000000000000000000000000000000000000000000000000000",
      requestBody: {
        url: "https://api.example.com/data",
        httpMethod: "GET",
        headers: "{}",
        body: "",
        postprocessJq: ".result.value",  // JQ filter to extract data
        abiSignature: "uint256",          // Expected return type
      },
    }),
  }
);
```

```solidity
import {IWeb2Json} from "@flarenetwork/flare-periphery-contracts/coston2/IWeb2Json.sol";

contract Web2JsonVerifier {
    function verifyApiData(IWeb2Json.Proof calldata _proof) external view returns (bool) {
        return ContractRegistry.getFdcVerification().verifyWeb2Json(_proof);
    }
}
```

## Payment Attestation (XRP/BTC/DOGE)

```typescript
// Verify an XRP payment
const prepareResponse = await fetch(
  `${VERIFIER_URL}/verifier/xrp/Payment/prepareRequest`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": API_KEY },
    body: JSON.stringify({
      attestationType: "0x5061796d656e74000000000000000000000000000000000000000000000000",
      sourceId: "0x7465737458525000000000000000000000000000000000000000000000000000", // "testXRP"
      requestBody: {
        transactionId: "ABC123...",
        inUtxo: "0",
        utxo: "0",
      },
    }),
  }
);
```

## Checking Finalization

```typescript
// Check if a round is finalized
const RELAY = "0xa10B672D1c62e5457b17af63d4302add6A99d7dE";
const FDC_PROTOCOL_ID = 200;

const isFinalized = await publicClient.readContract({
  address: RELAY,
  abi: [{ name: "isFinalized", type: "function", stateMutability: "view",
          inputs: [{ name: "_protocolId", type: "uint256" },
                   { name: "_votingRoundId", type: "uint256" }],
          outputs: [{ name: "", type: "bool" }] }],
  functionName: "isFinalized",
  args: [FDC_PROTOCOL_ID, roundId],
});
```

## Source ID Encoding

Source IDs are human-readable strings right-padded to bytes32:

| Source | String | Hex |
|--------|--------|-----|
| Ethereum Sepolia | `testETH` | `0x7465737445544800...00` |
| XRP Testnet | `testXRP` | `0x7465737458525000...00` |
| BTC Testnet | `testBTC` | `0x7465737442544300...00` |
| DOGE Testnet | `testDOGE` | `0x74657374444f4745...00` |
| Web2 | `WEB2` | `0x5745423200...00` |

## Verifier Endpoints

| Chain | Testnet URL |
|-------|-------------|
| EVM | `https://fdc-verifiers-testnet.flare.network/verifier/eth/` |
| BTC | `https://fdc-verifiers-testnet.flare.network/verifier/btc/` |
| XRP | `https://fdc-verifiers-testnet.flare.network/verifier/xrp/` |
| DOGE | `https://fdc-verifiers-testnet.flare.network/verifier/doge/` |
| Web2 JSON | `https://jq-verifier-test.flare.rocks/` |

**API Key (public testnet):** `00000000-0000-0000-0000-000000000000`

## Round Tracking

Monitor attestation progress at:
`https://coston-systems-explorer.flare.rocks/voting-epoch/{roundId}?tab=fdc`

## Common Mistakes

- Not waiting for round finalization (90-180 seconds) before fetching proof
- Using wrong source ID encoding -- must be right-padded bytes32
- Forgetting attestation fee in `requestAttestation` call value
- Not checking `status: "VALID"` in prepare response before submitting
- Using mainnet verifier URLs with testnet -- they're separate endpoints
