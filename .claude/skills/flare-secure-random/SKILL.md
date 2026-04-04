---
name: flare-secure-random
description: Use when generating secure random numbers on Flare, building lotteries, games, or any dApp requiring verifiable on-chain randomness from Flare's RandomNumberV2 protocol.
---

# Flare Secure Random Numbers

## Overview

Flare provides secure, uniform random numbers from ~100 independent data providers every 90 seconds. Security guarantee: as long as any single provider generates an honest hidden random value, the result is uniformly random. Free to use.

## Solidity Usage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {RandomNumberV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/RandomNumberV2Interface.sol";

contract RandomConsumer {
    RandomNumberV2Interface internal randomV2;

    constructor() {
        randomV2 = ContractRegistry.getRandomNumberV2();
    }

    function getSecureRandom() external view
        returns (uint256 randomNumber, bool isSecure, uint256 timestamp)
    {
        (randomNumber, isSecure, timestamp) = randomV2.getRandomNumber();
        require(isSecure, "Random number not secure");
    }
}
```

## Lottery Example

```solidity
contract Lottery {
    RandomNumberV2Interface internal randomV2;
    address[] public participants;

    constructor() {
        randomV2 = ContractRegistry.getRandomNumberV2();
    }

    function enter() external { participants.push(msg.sender); }

    function pickWinner() external returns (address winner) {
        require(participants.length > 0, "No participants");
        (uint256 rand, bool isSecure,) = randomV2.getRandomNumber();
        require(isSecure, "Random not secure");
        winner = participants[rand % participants.length];
        delete participants;
    }
}
```

## Off-Chain Reading

```typescript
// TypeScript (viem)
const RANDOM_V2 = "0x5CdF9eAF3EB8b44fB696984a1420B56A7575D250"; // Coston2

const [randomNumber, isSecure, timestamp] = await publicClient.readContract({
  address: RANDOM_V2,
  abi: [{
    name: "getRandomNumber", type: "function", stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "randomNumber", type: "uint256" },
      { name: "isSecureRandom", type: "bool" },
      { name: "randomTimestamp", type: "uint256" },
    ],
  }],
  functionName: "getRandomNumber",
  args: [],
});
```

```python
# Python (web3.py)
from web3 import Web3
w3 = Web3(Web3.HTTPProvider("https://coston2-api.flare.network/ext/C/rpc"))
contract = w3.eth.contract(address="0x5CdF9eAF3EB8b44fB696984a1420B56A7575D250", abi=abi)
random_number, is_secure, timestamp = contract.functions.getRandomNumber().call()
```

## Key Constraints

- **Always check `isSecure == true`** before using the value. If manipulation detected, `isSecure` is false and offenders are penalized.
- Updates every **90 seconds** (one voting round). Don't poll faster.
- `evmVersion` must be `cancun`.
- Free to use -- no gas cost for `view` calls.

## Protocol Details

1. **Commit**: Providers hash `(address, epoch_id, random_number, price_data)`
2. **Reveal**: Providers reveal all inputs
3. **Signing**: Compute weighted median, calculate rewards, package Merkle root
4. **Finalization**: Sufficient signatures gathered

Formula: `R = (sum of all r_i) mod 2^n`
