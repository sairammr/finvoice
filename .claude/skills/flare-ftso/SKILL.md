---
name: flare-ftso
description: Use when integrating Flare Time Series Oracle (FTSO) price feeds, reading on-chain prices, building DeFi with FTSO data, consuming FTSOv2 feeds, or working with anchor feeds and Merkle proofs on Flare.
---

# Flare FTSO (Flare Time Series Oracle)

## Overview

FTSOv2 delivers decentralized price feeds from ~100 independent data providers with block-latency updates. Free to use on testnet via `TestFtsoV2Interface`; production calls are `payable`.

## Feed IDs (bytes21)

| Feed | ID |
|------|----|
| FLR/USD | `0x01464c522f55534400000000000000000000000000` |
| BTC/USD | `0x014254432f55534400000000000000000000000000` |
| ETH/USD | `0x014554482f55534400000000000000000000000000` |
| XRP/USD | `0x015852502f55534400000000000000000000000000` |

Format: `0x01` (crypto category) + ASCII feed name right-padded to 20 bytes.

## Price Calculation

```
floating_point_value = feedValue / 10^decimals
// Example: value=6900420, decimals=2 -> $69,004.20
```

## Solidity Integration

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {TestFtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/TestFtsoV2Interface.sol";
import {IFeeCalculator} from "@flarenetwork/flare-periphery-contracts/coston2/IFeeCalculator.sol";

contract PriceConsumer {
    TestFtsoV2Interface internal ftsoV2;

    // Feed IDs
    bytes21 public constant FLR_USD = bytes21(0x01464c522f55534400000000000000000000000000);
    bytes21 public constant BTC_USD = bytes21(0x014254432f55534400000000000000000000000000);
    bytes21 public constant ETH_USD = bytes21(0x014554482f55534400000000000000000000000000);

    constructor() {
        ftsoV2 = ContractRegistry.getTestFtsoV2(); // Free for testing
        // Production: ContractRegistry.getFtsoV2() (payable)
    }

    // Single feed
    function getFlrUsdPrice() external view
        returns (uint256 feedValue, int8 decimals, uint64 timestamp)
    {
        return ftsoV2.getFeedById(FLR_USD);
    }

    // Single feed in 18-decimal wei format
    function getFlrUsdPriceWei() external view
        returns (uint256 value, uint64 timestamp)
    {
        return ftsoV2.getFeedByIdInWei(FLR_USD);
    }

    // Multiple feeds at once
    function getAllPrices() external view
        returns (uint256[] memory values, int8[] memory decimals, uint64 timestamp)
    {
        bytes21[] memory feedIds = new bytes21[](3);
        feedIds[0] = FLR_USD;
        feedIds[1] = BTC_USD;
        feedIds[2] = ETH_USD;
        return ftsoV2.getFeedsById(feedIds);
    }
}
```

## Using Feed Name Converter

```solidity
import {IFtsoFeedIdConverter} from "@flarenetwork/flare-periphery-contracts/coston2/IFtsoFeedIdConverter.sol";

IFtsoFeedIdConverter converter = ContractRegistry.getFtsoFeedIdConverter();
bytes21 feedId = converter.getFeedId(1, "FLR/USD"); // category=1 (crypto)
```

## Anchor Feeds with Merkle Proofs

Anchor feeds provide finalized price data with cryptographic proofs:

```solidity
import {IFtsoV2} from "@flarenetwork/flare-periphery-contracts/coston2/IFtsoV2.sol";

contract AnchorConsumer {
    IFtsoV2 internal ftsoV2;

    struct SavedFeed {
        bytes21 feedId;
        int32 value;
        uint16 turnstileValue;
        int8 decimals;
    }

    mapping(uint32 => SavedFeed[]) public provenFeeds;

    constructor() {
        ftsoV2 = ContractRegistry.getFtsoV2();
    }

    function savePrice(IFtsoV2.FeedDataWithProof calldata _feedData) external {
        // Verifies Merkle proof on-chain
        require(ftsoV2.verifyFeedData(_feedData), "Invalid proof");

        provenFeeds[_feedData.body.votingRoundId].push(SavedFeed({
            feedId: _feedData.body.id,
            value: _feedData.body.value,
            turnstileValue: _feedData.body.turnstileValue,
            decimals: _feedData.body.decimals
        }));
    }
}
```

### Fetching Anchor Feeds from DA Layer

```typescript
// Fetch anchor feed data with proofs
const response = await fetch(
  `${DA_LAYER_URL}/api/v0/ftso/anchor-feeds-with-proof`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify({
      votingRoundId: roundId,
      feedIds: ["0x01464c522f55534400000000000000000000000000"],
    }),
  }
);
const feedsWithProof = await response.json();
// Submit each to your contract's savePrice()
```

## Off-Chain Price Reading (TypeScript)

```typescript
import { createPublicClient, http } from "viem";
import { flareTestnet } from "viem/chains";

const client = createPublicClient({ chain: flareTestnet, transport: http() });

const FTSO_V2_ABI = [{
  name: "getFeedById",
  type: "function",
  stateMutability: "view",
  inputs: [{ name: "_feedId", type: "bytes21" }],
  outputs: [
    { name: "_value", type: "uint256" },
    { name: "_decimals", type: "int8" },
    { name: "_timestamp", type: "uint64" },
  ],
}] as const;

// Get TestFtsoV2 address from ContractRegistry
const ftsoAddress = await client.readContract({
  address: "0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019",
  abi: [{ name: "getContractAddressByName", type: "function", stateMutability: "view",
          inputs: [{ name: "_name", type: "string" }],
          outputs: [{ name: "", type: "address" }] }],
  functionName: "getContractAddressByName",
  args: ["FtsoV2"],
});

const [value, decimals, timestamp] = await client.readContract({
  address: ftsoAddress,
  abi: FTSO_V2_ABI,
  functionName: "getFeedById",
  args: ["0x01464c522f55534400000000000000000000000000"],
});

const price = Number(value) / 10 ** Number(decimals);
console.log(`FLR/USD: $${price} at ${new Date(Number(timestamp) * 1000)}`);
```

## Fast Updates (Real-Time)

```typescript
import { FlareContractRegistryAddress } from "@flarenetwork/flare-periphery-contract-artifacts";

// Get FastUpdater address
const fastUpdaterAddr = await getContractAddress("FastUpdater");

// Fetch all current feeds
const feeds = await client.readContract({
  address: fastUpdaterAddr,
  abi: fastUpdaterAbi,
  functionName: "fetchAllCurrentFeeds",
  args: [],
});

// WebSocket listener for real-time updates
const ws = new WebSocket("wss://coston2-api.flare.network/ext/C/ws");
// Listen for FastUpdateFeedsSubmitted events
```

## Testing vs Production

| Aspect | Testing | Production |
|--------|---------|------------|
| Interface | `TestFtsoV2Interface` | `FtsoV2Interface` |
| Access | `ContractRegistry.getTestFtsoV2()` | `ContractRegistry.getFtsoV2()` |
| Methods | `view` (free) | `payable` (costs gas) |
| Network | Coston2 | Flare mainnet |

## Common Mistakes

- Using `getFtsoV2()` on testnet -- use `getTestFtsoV2()` for free view calls
- Not setting `evmVersion: "cancun"` in compiler settings
- Forgetting to handle decimals -- raw values need division by `10^decimals`
- Feed IDs are `bytes21`, not `bytes32` -- ensure correct type in Solidity
