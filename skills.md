# Rayls Blockchain Ecosystem -- Comprehensive Skills Reference

## 1. Ecosystem Overview

Rayls is an EVM (Ethereum Virtual Machine) blockchain system designed to unite Traditional Finance (TradFi) and Decentralized Finance (DeFi). The name combines "rail" (financial infrastructure) and "ray" (light, representing speed). It targets bringing $100T of TradFi liquidity and 6 billion banked users into DeFi.

Rayls is described as "like a Platypus" -- it combines elements found only in public permissionless chains with elements found only in private permissioned chains. It is the first EVM permissioned system that simultaneously provides Privacy, Scalability, and Interoperability.

### Core Value Propositions
- **Privacy**: Institutions transact with full confidentiality using Zero-Knowledge (ZK) proofs and Homomorphic Encryption
- **Scalability**: Each Privacy Node processes 10,000+ transactions per second
- **Interoperability**: Seamless cross-chain asset and message transfer between private and public environments
- **Compliance**: Built-in governance, token freezing, user approval, and audit mechanisms
- **EVM Compatibility**: Full compatibility with Ethereum tooling (Ethers.js, Web3.js, Foundry, Solidity)

### Real-World Adoption
- Central Bank of Brazil deployed Rayls for the DREX CBDC pilot
- Nuclea (largest FMI in the Southern Hemisphere) tokenizes 10,000+ commercial receivables weekly with $50M+ settled on-chain

---

## 2. Architecture

Rayls comprises four primary components:

### 2.1 Rayls Public Chain
- Ethereum L1 public permissionless blockchain
- Anyone can view activity and participate
- Where bridged tokens become publicly visible and tradeable
- Uses USDR as native gas token

### 2.2 Rayls Privacy Node
- A sovereign, gasless, single-node EVM blockchain
- Each participating institution operates its own Privacy Node
- Only authorized participants can see transactions and balances
- Contains its own ledger (Privacy Ledger) with complete data isolation
- High-performance: 10,000+ TPS per node
- Full EVM compatibility: supports Solidity smart contracts, Ethers.js, Web3.js

### 2.3 Rayls Private Networks (VEN - Value Exchange Network)
- Permissioned EVM networks formed by connecting multiple Privacy Nodes
- Uses Zero-Knowledge and Homomorphic Cryptography for full transaction privacy
- Institutions create their own VEN for multi-party collaboration
- Components:
  - **Privacy Nodes**: Independent EVM chains per institution
  - **Private Network Hub**: Decentralized hub chain connecting participant nodes
  - **Operator**: Manages network governance and compliance rules

### 2.4 Rayls Token ($RLS)
- Governance and utility token uniting the ecosystem

### High-Level Architecture Diagram

```
+---------------------------+                          +---------------------------+
|     PRIVACY NODE          |                          |     PUBLIC CHAIN          |
|                           |                          |                           |
|  Your Token               |    +----------------+    |  Mirror Token             |
|  (RaylsErc20Handler)      |<-->|    RELAYER      |<-->|  (PublicChainERC20)       |
|                           |    |    (Go svc)     |    |  [auto-deployed]          |
|  EndpointV1               |    +----------------+    |  PublicRNEndpointV1       |
|  RNTokenGovernanceV1      |                          |  RNMessageExecutorV1      |
|  RNUserGovernanceV1       |                          |                           |
|  DeploymentProxyRegistry  |                          |                           |
+---------------------------+                          +---------------------------+
```

---

## 3. Core Infrastructure Components

### 3.1 Endpoint
- Pivotal smart contract deployed on each Privacy Node
- The sole contract through which dApps engage in cross-chain transactions
- Implements EIP-5164 standard for cross-chain communication
- Dual operational model:
  - **Dispatcher**: Routes outgoing messages to other Privacy Nodes via the Hub
  - **Executor**: Receives and processes incoming cross-chain messages
- Key interface methods:
  - `send(dstChainId, destination, payload)` -- send message to address
  - `sendToResourceId(dstChainId, resourceId, payload)` -- send message to resource
  - `sendBatch(requests)` -- send multiple messages
  - `getChainId()` -- get current chain ID
  - `getCommitChainId()` -- get commit chain ID
  - `isTrustedExecutor(address)` -- verify executor authorization
  - `registerResourceId(resourceId, address)` -- associate resource to address
  - `getAddressByResourceId(resourceId)` -- resolve resource address

### 3.2 Relayer
- Off-chain Go service bridging Privacy Nodes and the Private Network Hub (or Public Chain)
- A new Relayer instance deploys each time a Privacy Node connects to a different Hub
- Core functions:
  - **Transaction Propagation**: Securely relays encrypted transactions between nodes
  - **Privacy Preservation**: End-to-end encryption; sender/receiver details hidden
  - **Validation**: Cryptographic proof verification, governance compliance checks
  - **Error Handling**: Atomic processing -- transactions complete entirely or revert
  - **Parallel Processing**: Handles multiple simultaneous transactions
- Watches for `MessageDispatched` events and shuttles messages between chains

### 3.3 Private Network Hub (Commit Chain)
- EVM blockchain at the center of each Private Network
- Connects all Privacy Nodes within a VEN
- All on-chain messages and transactions flow between Privacy Nodes via the Hub
- Hosts the **TokenRegistry** contract that tracks token supply changes
- Hosts the **BalanceCommitment** contract for supply integrity

### 3.4 Resource and ResourceId
- A **Resource** is a smart contract whose bytecode is registered on the Private Network Hub
- **resourceId** is a universal 32-byte identifier for a contract across all chains
  - Abstracts away different contract addresses on different Privacy Nodes
  - Provides a single, consistent reference point across the entire network
- Automated deployment: when a token is registered as a Resource, it can be auto-deployed to any Privacy Node by the Relayer/Endpoint without manual intervention
- Essential for cross-chain teleport operations (teleport requires `resourceId != bytes32(0)`)

### 3.5 DeploymentProxyRegistryV1
- On-chain registry on each Privacy Node that stores infrastructure contract addresses
- Used to discover:
  - `"Endpoint"` -- EndpointV1 address
  - `"RNEndpoint"` -- RNEndpointV1 address
  - `"RNUserGovernance"` -- RNUserGovernanceV1 address
  - `"RNTokenGovernance"` -- RNTokenGovernanceV1 address

---

## 4. Rayls Protocol -- Cross-Chain Communication

### 4.1 Message Design Patterns

Three primary patterns for cross-chain messaging:

| Pattern | Flow | Description |
|---------|------|-------------|
| **OWM** (One Way Message) | A -> B | Fire-and-forget. Sender targets a single recipient without expecting a response. |
| **BFM** (Back-and-Forth Message) | A -> B -> A | Ping-pong. Receiver calls `_raylsSend` back to the source. |
| **LMP** (Layering Message Pattern) | A -> B -> BA -> BB | Multi-stage routing. B fans out to multiple downstream recipients. |

Additional specialized patterns:
- **VT20 TELEPORT**: Token teleportation (burn/mint model)
- **AT20**: Atomic teleportation with revert capability

### 4.2 Cross-Chain Transaction Types

1. **Teleport Tokens**: Move tokens between Privacy Nodes (burn on source, mint on destination)
2. **Teleport to Public Chain**: Lock on Privacy Node, mint on Public Chain
3. **Teleport from Public Chain**: Burn on Public Chain, unlock on Privacy Node
4. **Arbitrary Messages**: Send any bytes payload cross-chain
5. **Delivery vs Payment (DvP)**: Atomic settlement of simultaneous asset exchanges
6. **Payment vs Payment (PvP)**: Atomic fiat/currency swaps

### 4.3 Bridging Mechanics

#### Private to Public (Lock & Mint)
1. User calls `teleportToPublicChain(to, value, chainId)`
2. Tokens are **locked** on the Privacy Node (transferred to contract owner)
3. A cross-chain message is dispatched via `RNEndpointV1`
4. Relayer picks up the `MessageDispatched` event
5. Relayer submits the message to the Public Chain
6. Mirror contract **mints** new tokens for the recipient

#### Public to Private (Burn & Unlock)
1. User calls `teleportToPrivacyNode(address, amount, chainId)` on the mirror contract
2. Tokens are **burned** on the Public Chain
3. Message dispatched -> Relayer picks up -> submits to Privacy Node
4. Previously locked tokens are **unlocked** and transferred to recipient

#### Privacy Node to Privacy Node (Burn & Mint)
1. User calls `teleport(to, value, chainId)` on the token contract
2. Tokens are **burned** on the source Privacy Node
3. Message routed through the Private Network Hub
4. Destination contract's `receiveTeleport(to, value)` mints tokens

#### Atomic Teleport
- `teleportAtomic(to, value, chainId)` -- all-or-nothing transfer with 240-second timeout
- Includes revert payloads: if destination fails, source tokens are restored
- Uses lock/unlock on destination instead of direct mint

#### Failure Safety
- Every cross-chain message includes a pre-generated **revert payload**
- If destination execution fails, the Relayer submits the revert payload back to the source chain
- Locked tokens are unlocked (or burned tokens are re-minted)
- **Tokens are never lost**

---

## 5. Rayls SDK

### 5.1 Installation

```bash
npm install @rayls/contracts --save
# or
pnpm add @rayls/contracts
```

### 5.2 Core Contracts

#### RaylsApp (Abstract Base Contract)
The anchor of the Rayls SDK. All contracts needing cross-chain capability must inherit from it.

**Key Methods:**
| Method | Visibility | Description |
|--------|-----------|-------------|
| `_raylsSend(dstChainId, destination, payload)` | internal | Send cross-chain message to an address |
| `_raylsSendToResourceId(dstChainId, resourceId, payload)` | internal | Send cross-chain message to a resourceId |
| `_raylsSendBatch(requests)` | internal | Send multiple messages at once |
| `_raylsSendBatchToResourceId(requests)` | internal | Send multiple messages to resources |
| `_registerResourceId()` | internal | Associate resourceId with this contract's address |
| `getAddressByResourceId(resourceId)` | external view | Resolve a resourceId to an address |

**Key Modifiers:**
| Modifier | Description |
|----------|-------------|
| `receiveMethod` | Restricts function to trusted endpoint executor only |
| `publicEndpointReceiveMethod` | Restricts to Rayls Node endpoint executor |
| `onlyFromCommitChain` | Restricts to calls originating from the commit chain |
| `onlyRegisteredUsers` | Restricts to users approved in UserGovernance |

**Helper Methods (for receive functions):**
- `_getMessageIdOnReceiveMethod()` -- extract message ID from calldata
- `_getFromChainIdOnReceiveMethod()` -- extract source chain ID from calldata
- `_getMsgSenderOnReceiveMethod()` -- extract original sender address

#### RaylsErc20Handler
Combines RaylsApp + ERC20. Base class for fungible tokens with cross-chain capabilities.

**Bridging API (Privacy Node <-> Public Chain):**
| Function | Access | Description |
|----------|--------|-------------|
| `teleportToPublicChain(to, value, chainId)` | `onlyRegisteredUsers` | Lock on Privacy Node, mint on Public Chain |
| `receiveTeleportFromPublicChain(to, value)` | `publicEndpointReceiveMethod` | Unlock tokens returning from Public Chain |
| `revertTeleportToPublicChain(to, value)` | `publicEndpointReceiveMethod` | Restore locked tokens if public-side mint fails |

**Bridging API (Privacy Node <-> Privacy Node):**
| Function | Access | Description |
|----------|--------|-------------|
| `teleport(to, value, chainId)` | public | Burn/mint transfer to another Privacy Node |
| `teleportFrom(from, to, value, chainId)` | public | Third-party teleport with approval |
| `teleportAtomic(to, value, chainId)` | public | Atomic cross-chain transfer with timeout |
| `teleportAtomicFrom(from, to, value, chainId)` | public | Third-party atomic teleport |
| `receiveTeleport(to, value)` | `receiveMethod` | Receive tokens from another Privacy Node |
| `receiveTeleportAtomic(to, value)` | `receiveMethod` | Receive atomic teleport (locked until confirmed) |

**Token Management:**
| Function | Access | Description |
|----------|--------|-------------|
| `mint(to, value)` | `onlyOwner` | Mint tokens and notify commit chain TokenRegistry |
| `burn(from, value)` | `onlyOwner` | Burn tokens and notify commit chain TokenRegistry |
| `getLockedAmount(account)` | view | Check tokens currently locked (bridged to public) |
| `submitTokenRegistration(storageSlot)` | `onlyOwner` | Register token on commit chain TokenRegistry |
| `submitTokenUpdate(updateType, amount)` | `onlyOwner` | Report supply change to commit chain |

**Constructor Parameters:**
```solidity
constructor(
    string memory _name,        // Token name
    string memory _symbol,      // Token symbol
    address _endpoint,          // EndpointV1 address
    address _raylsNodeEndpoint, // RNEndpointV1 address
    address _userGovernance,    // RNUserGovernanceV1 address
    address _owner,             // Contract owner
    bool _isCustom              // Custom factory flag
)
```

**Important**: Use internal mint functions in constructors (`_mint()` for ERC20/ERC1155, `_safeMint()` for ERC721), and public `mint()` everywhere else. The public `mint()` sends a cross-chain notification to the TokenRegistry, which requires a `resourceId` -- not yet assigned at construction time.

#### RaylsErc721Handler
Base class for NFT tokens with cross-chain capabilities.

| Function | Access | Description |
|----------|--------|-------------|
| `teleportToPublicChain(to, tokenId, chainId)` | `onlyRegisteredUsers` | Lock NFT on Privacy Node, mint on Public Chain |
| `receiveTeleportFromPublicChain(to, tokenId)` | `receiveMethod` | Unlock NFT returning from Public Chain |
| `teleport(to, tokenId, chainId)` | public | Send NFT to another Privacy Node |
| `teleportAtomic(to, tokenId, chainId)` | public | Atomic cross-chain NFT transfer |
| `mint(to, tokenId)` | `onlyOwner` | Mint NFT |
| `burn(tokenId)` | `onlyOwner` | Burn NFT |
| `isTokenLocked(owner, tokenId)` | view | Check if NFT is locked |

#### RaylsErc1155Handler
Base class for multi-token standard with cross-chain capabilities.

| Function | Access | Description |
|----------|--------|-------------|
| `teleportToPublicChain(to, id, amount, chainId, data)` | `onlyRegisteredUsers` | Lock tokens, mint on Public Chain |
| `receiveTeleportFromPublicChain(to, id, amount)` | `receiveMethod` | Unlock tokens from Public Chain |
| `teleport(to, id, amount, chainId, data)` | public | Send to another Privacy Node |
| `teleportAtomic(to, id, amount, chainId, data)` | public | Atomic cross-chain transfer |
| `mint(to, id, amount, data)` | `onlyOwner` | Mint tokens |
| `burn(from, id, amount)` | `onlyOwner` | Burn tokens |
| `getLockedAmount(account, id)` | view | Check locked amount for token ID |

#### Additional SDK Contracts
- **RaylsErc721DvpHandler**: NFT handler with DvP (Delivery vs Payment) support
- **RaylsErc1155DvpHandler**: Multi-token handler with DvP support
- **RaylsEnygmaHandler**: Privacy-enhanced handler using Enygma protocol

### 5.3 Message Structures

```solidity
struct RaylsMessage {
    RaylsMessageMetadata messageMetadata;
    bytes payload;
}

struct BridgedTransferMetadata {
    RaylsBridgeableERC assetType;  // ERC20, ERC721, ERC1155, ENYGMA, etc.
    uint256 id;                     // Token ID (0 for ERC20)
    address from;
    address to;
    address tokenAddress;
    uint256 amount;
}

enum RaylsBridgeableERC {
    CUSTOM, ERC20, ERC721, ERC1155, ENYGMA, DVPERC721, DVPERC1155
}
```

---

## 6. Token Standards and Tokenization

### 6.1 Supported Standards
| Standard | Type | SDK Handler | Use Cases |
|----------|------|------------|-----------|
| **ERC20** | Fungible tokens | `RaylsErc20Handler` | Currencies, stablecoins, CBDCs, utility tokens |
| **ERC721** | Non-fungible tokens (NFTs) | `RaylsErc721Handler` | Unique assets, financial instruments, RWAs |
| **ERC1155** | Multi-token (fungible + non-fungible) | `RaylsErc1155Handler` | Portfolios, fund shares, batch assets |

### 6.2 Token Lifecycle
```
Write Contract -> Deploy -> Register -> Approve -> Mirror Deployed -> Bridgeable
(developer)      (Foundry)  (API call)  (API call)  (Relayer, auto)   (ready!)
```

1. **Write**: Inherit from the appropriate Handler (`RaylsErc20Handler`, etc.)
2. **Deploy**: Deploy to the Privacy Node using Foundry (`forge script`)
3. **Register**: Call backend API to add token to `RNTokenGovernanceV1` (status: INACTIVE)
4. **Approve**: Call backend API to activate it (status: ACTIVE, emits `TokenActivated`)
5. **Mirror Deployed**: Relayer detects `TokenActivated`, deploys mirror on Public Chain, maps addresses
6. **Bridgeable**: `teleportToPublicChain()` works end-to-end

### 6.3 Governance and Compliance
- **Token Freezing**: Governance actors can restrict token movement per participant or globally
- **Token Approval**: Tokens must be explicitly approved before they can be bridged
- **User Registration**: Users must be registered and approved in `RNUserGovernanceV1`
- **Audit View**: Selective disclosure mechanism for designated auditors

---

## 7. Rayls Enygma -- Privacy Layer

Enygma is Rayls' advanced privacy framework for regulated financial operations.

### Cryptographic Foundation
- **Zero-Knowledge Proofs (ZK)**: Verification without data disclosure
- **Homomorphic Encryption (HE)**: Computation on encrypted data
- **Quantum-Private**: Hardened against quantum computing threats
- **Dual-batching and single-proof**: Reduces operational costs for scalability

### Privacy Features
- **Private Payments**: ERC-20 transfers with encrypted addresses, balances, and values
- **Private Asset Exchange (DvP)**: Atomic swaps between ERC-20, ERC-721, ERC-1155 with compliance verification
- **Auditable Compliance**: Audit View mechanism for selective disclosures to designated auditors
- **User Control**: Choose between public or shielded transactions per-transaction

### Compatibility
- Works on any EVM-compatible chain
- Integrates with Rayls Private Networks
- Available on Rayls Public Chain
- Open-sourced under SSPL + Commercial dual license

---

## 8. Access Control System

| Modifier/Role | Description |
|---------------|-------------|
| `onlyRegisteredUsers` | Only users approved in `RNUserGovernanceV1` can call teleport functions. Pass `address(0)` as userGovernance to disable. |
| `onlyOwner` | Only the token deployer/owner can call `mint()` and `burn()`. |
| `receiveMethod` | Only the trusted Endpoint executor can call receive functions (prevents unauthorized minting). |
| `publicEndpointReceiveMethod` | Only the Rayls Node endpoint executor can call public chain receive functions. |
| `onlyFromCommitChain` | Only accepts calls originating from the commit chain. |

### Two-Key Model
| Key | Used By | Purpose |
|-----|---------|---------|
| `DEPLOYER_PRIVATE_KEY` | Deploy scripts, Mint scripts | Foundry wallet. Owns the token contract. Can mint/burn. |
| `REGISTERED_PRIVATE_KEY` | Transfer scripts | Registered private-chain address from onboarding. Required by `onlyRegisteredUsers` modifier. |

---

## 9. Backend API (Custody Light API)

### Authentication
- **User endpoints** (`/api/user/*`): Bearer token `USER_AUTH_KEY`
- **Operator endpoints** (`/api/operator/*`): Bearer token `OPERATOR_AUTH_KEY`

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/onboarding` | POST | Register user, get wallet addresses for both chains |
| `/api/operator/onboarding/status` | PATCH | Approve/reject user address pairs |
| `/api/user/tokens` | POST | Register a deployed token in governance |
| `/api/operator/tokens/status` | PATCH | Activate token (triggers mirror deployment) |
| `/api/user/users/address-pairs` | GET | List address pairs for a user |
| `/api/user/tokens` | GET | List all registered tokens |
| `/api/operator/tokens/pending` | GET | List pending tokens (operator view) |

### User Status Values
- `0` = Pending
- `1` = Approved
- `2` = Rejected

### Token Status Values
- `0` = Inactive
- `1` = Active

### Token Standard Values (API)
- `1` = ERC20
- `2` = ERC721
- `3` = ERC1155

---

## 10. Development Workflow

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `cast`)
- [Node.js](https://nodejs.org/) 18+
- `curl` and `jq` for API calls

### Environment Setup
```bash
git clone <repo>
cd rayls-hackathon-starter
forge install
npm install
cp .env.example .env
```

### Required Environment Variables
```
PRIVACY_NODE_RPC_URL=<provided>
DEPLOYMENT_PROXY_REGISTRY=<provided>
PUBLIC_CHAIN_RPC_URL=<provided>
PUBLIC_CHAIN_ID=<provided>
BACKEND_URL=<provided>
USER_AUTH_KEY=<provided>
OPERATOR_AUTH_KEY=<provided>
DEPLOYER_PRIVATE_KEY=<your Foundry wallet key>
REGISTERED_PRIVATE_KEY=<from onboarding response>
MINT_RECIPIENT=<private_chain_address>
TRANSFER_TO=<public_chain_address>
TOKEN_NAME="My Token"
TOKEN_SYMBOL="MTK"
TOKEN_ADDRESS=<after deployment>

# NFT (optional)
NFT_TOKEN_URI=https://example.com/metadata
NFT_NAME="Hackathon NFT"
NFT_SYMBOL="HNFT"
NFT_ADDRESS=<after deployment>
NFT_MINT_TOKEN_ID=1
NFT_TRANSFER_TOKEN_ID=1

# ERC1155 (optional)
MULTI_TOKEN_URI=https://example.com/multi
MULTI_TOKEN_NAME="Hackathon Multi Token"
MULTI_TOKEN_ADDRESS=<after deployment>
MULTI_TOKEN_MINT_ID=1
MULTI_TOKEN_MINT_AMOUNT=500
MULTI_TOKEN_TRANSFER_ID=1
MULTI_TOKEN_TRANSFER_AMOUNT=100

# Public chain contracts (after deployment)
ATTESTATION_ADDRESS=<after deployment>
MARKETPLACE_ADDRESS=<after deployment>
```

### Deployment Commands (all require `--legacy` flag since Privacy Nodes are gasless)

```bash
# Deploy ERC20 token
forge script script/Deploy.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy

# Deploy ERC721 NFT
forge script script/DeployNFT.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy

# Deploy ERC1155 Multi-Token
forge script script/DeployMultiToken.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy

# Deploy Marketplace (on Public Chain -- requires gas)
DEPLOYER_PRIVATE_KEY=<public_chain_private_key> \
  forge script script/DeployMarketplace.s.sol --rpc-url $PUBLIC_CHAIN_RPC_URL --broadcast --legacy
```

### Interaction Commands
```bash
# Mint tokens
forge script script/Mint.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy

# Transfer (bridge) to Public Chain
forge script script/Transfer.s.sol --rpc-url $PRIVACY_NODE_RPC_URL --broadcast --legacy

# Check balance
forge script script/CheckBalance.s.sol --rpc-url $PRIVACY_NODE_RPC_URL

# Transfer back from Public to Private
cast send <PUBLIC_MIRROR_ADDRESS> \
  "teleportToPrivacyNode(address,uint256,uint256)" \
  <PRIVATE_CHAIN_ADDRESS> <AMOUNT> <PRIVACY_NODE_CHAIN_ID> \
  --rpc-url $PUBLIC_CHAIN_RPC_URL --private-key <PUBLIC_CHAIN_PRIVATE_KEY> --legacy
```

### Internal Privacy Node Transactions (Direct EVM)
```javascript
const { ethers } = require('ethers');
const provider = new ethers.providers.JsonRpcProvider('<Privacy-Ledger-Endpoint>');
const wallet = new ethers.Wallet('<Private-Key>', provider);

async function sendTransaction() {
    const tx = { to: '<Recipient>', value: ethers.utils.parseEther('1.0') };
    const transaction = await wallet.sendTransaction(tx);
    await transaction.wait();
}
```

### Debugging
```bash
# Inspect a failed transaction
cast run <TX_HASH> --rpc-url $PRIVACY_NODE_RPC_URL

# Check if mirror contract is deployed
TOKEN_GOV=$(cast call $DEPLOYMENT_PROXY_REGISTRY "getContract(string)(address)" "RNTokenGovernance" --rpc-url $PRIVACY_NODE_RPC_URL)
cast call $TOKEN_GOV "getPublicAddressByPrivateAddress(address)(address)" $TOKEN_ADDRESS --rpc-url $PRIVACY_NODE_RPC_URL

# Check balances
cast call $TOKEN_ADDRESS "balanceOf(address)(uint256)" <ADDRESS> --rpc-url $PRIVACY_NODE_RPC_URL
cast call $TOKEN_ADDRESS "getLockedAmount(address)(uint256)" <ADDRESS> --rpc-url $PRIVACY_NODE_RPC_URL
```

---

## 11. Hackathon Project Structure

```
rayls-hackathon-starter/
+-- src/
|   +-- HackathonToken.sol        # ERC20 bridgeable token (inherits RaylsErc20Handler)
|   +-- HackathonNFT.sol          # ERC721 bridgeable NFT (inherits RaylsErc721Handler)
|   +-- HackathonMultiToken.sol   # ERC1155 bridgeable multi-token (inherits RaylsErc1155Handler)
|   +-- Attestation.sol           # On-chain AI attestation registry
|   +-- Marketplace.sol           # Public chain escrow marketplace
+-- script/
|   +-- Deploy.s.sol              # Deploy ERC20 to Privacy Node
|   +-- DeployNFT.s.sol           # Deploy ERC721 to Privacy Node
|   +-- DeployMultiToken.s.sol    # Deploy ERC1155 to Privacy Node
|   +-- DeployPublic.s.sol        # Deploy contracts to Public Chain
|   +-- DeployMarketplace.s.sol   # Deploy marketplace to Public Chain
|   +-- Mint.s.sol                # Mint ERC20 tokens
|   +-- MintNFT.s.sol             # Mint ERC721 NFTs
|   +-- MintMultiToken.s.sol      # Mint ERC1155 tokens
|   +-- Transfer.s.sol            # Bridge ERC20 to Public Chain
|   +-- TransferNFT.s.sol         # Bridge ERC721 to Public Chain
|   +-- TransferMultiToken.s.sol  # Bridge ERC1155 to Public Chain
|   +-- CheckBalance.s.sol        # Check balances on both chains
+-- agent/                        # AI agent skeleton (TypeScript)
+-- docs/
|   +-- architecture.md           # Architecture overview
|   +-- api-reference.md          # Backend API documentation
+-- node_modules/@rayls/contracts/  # Rayls SDK contracts
```

---

## 12. Challenge Tracks

### RWA Tokenization
- Tokenize real-world assets (bond, invoice, fund share) privately on Privacy Node
- AI compliance agent reviews before public disclosure
- Bridge a clean receipt token to a marketplace
- **AI Role**: Governance compliance reviewer
- **Key contracts**: Token + governance contract for AI recommendations

### Confidential NFT Reveal
- Mint high-value digital assets with fully private metadata
- AI oracle attests existence on-chain without exposing details
- Asset reveals to buyers only after purchase
- **AI Role**: Cross-chain attestation oracle
- **Key contracts**: Token + Attestation.sol on Public Chain

### Autonomous Institution Agent
- AI agent runs entire institutional treasury autonomously
- Detects assets, attests them, submits governance, bridges, and lists
- Humans watch; agent operates
- **AI Role**: Full autonomous orchestration
- **Key contracts**: Token + full five-phase pipeline

### Five-Phase Flow
```
Design Privately -> AI Attestation -> Governance & Approval -> Bridge & Simplify -> List & Trade
  (Privacy Node)    (AI agent)        (AI + human review)     (Rayls bridge)       (Public L1)
```

---

## 13. Key Terminology Glossary

| Term | Definition |
|------|-----------|
| **Privacy Node** | Sovereign, gasless, single-node EVM blockchain operated by an institution |
| **Privacy Ledger** | The blockchain ledger within a Privacy Node; contains private state |
| **Public Chain** | Rayls' Ethereum L1 permissionless blockchain |
| **VEN (Value Exchange Network)** | A permissioned network of connected Privacy Nodes |
| **Private Network Hub (Commit Chain)** | Central EVM blockchain connecting Privacy Nodes within a VEN |
| **Endpoint** | Smart contract on each node for cross-chain message dispatch/execution |
| **Relayer** | Off-chain service bridging Privacy Nodes and the Hub/Public Chain |
| **Resource** | A contract registered on the Hub, deployable across all nodes |
| **resourceId** | Universal 32-byte identifier for a contract across all chains |
| **Teleport** | Cross-chain token transfer (burn/mint or lock/unlock model) |
| **Mirror Contract** | Auto-deployed counterpart of a private token on the Public Chain |
| **TokenRegistry** | Commit chain contract tracking token supply changes |
| **DeploymentProxyRegistry** | On-chain registry for discovering infrastructure addresses |
| **RNUserGovernanceV1** | Contract controlling which users can bridge tokens |
| **RNTokenGovernanceV1** | Contract mapping private token addresses to public mirrors |
| **Enygma** | Privacy layer using ZK proofs and homomorphic encryption |
| **DvP (Delivery vs Payment)** | Atomic settlement of simultaneous asset exchanges |
| **PvP (Payment vs Payment)** | Atomic currency/fiat swap |
| **USDR** | Native gas token on the Rayls Public Chain |
| **$RLS** | Rayls governance and utility token |

---

## 14. Common Patterns and Best Practices

### Writing Cross-Chain Contracts
1. Inherit from `RaylsApp` (or a handler like `RaylsErc20Handler`)
2. Use `_raylsSend()` for arbitrary cross-chain messages
3. Use `_raylsSendToResourceId()` when targeting a resource by ID instead of address
4. Mark receive functions with `receiveMethod` modifier
5. Encode payloads with `abi.encodeWithSignature()`

### Sending Arbitrary Messages
```solidity
function sendMessage(uint256 destChainId, address destContract, string memory data) public {
    _raylsSend(
        destChainId,
        destContract,
        abi.encodeWithSignature("receiveMessage(string)", data)
    );
}
```

### Custom Token Example
```solidity
import {RaylsErc20Handler} from "rayls-protocol-sdk/tokens/RaylsErc20Handler.sol";

contract MyToken is RaylsErc20Handler {
    constructor(
        string memory _name,
        string memory _symbol,
        address _endpoint,
        address _raylsNodeEndpoint,
        address _userGovernance
    ) RaylsErc20Handler(_name, _symbol, _endpoint, _raylsNodeEndpoint, _userGovernance, msg.sender, false) {
        _mint(msg.sender, 1_000_000 * 10 ** 18); // Use _mint in constructor
    }
}
```

### Discovering Infrastructure Addresses (in Foundry Scripts)
```solidity
IDeploymentProxyRegistryV1 registry = IDeploymentProxyRegistryV1(registryAddr);
address endpoint = registry.getContract("Endpoint");
address rnEndpoint = registry.getContract("RNEndpoint");
address userGovernance = registry.getContract("RNUserGovernance");
```

### Important Notes
- Privacy Nodes are **gasless** -- always use `--legacy` flag with Foundry
- Privacy Nodes do not support EIP-1559 fee estimation
- Mirror deployment takes ~30-60 seconds after token approval
- Token symbols must be unique across the Privacy Node
- The `_mint()` vs `mint()` distinction is critical for constructors
- All cross-chain teleport operations require the token to have a valid `resourceId`

---

## 15. Sources

- [Rayls Documentation Portal](https://docs.rayls.com/)
- [Rayls High Level Architecture](https://docs.rayls.com/docs/rayls-high-level-architecture)
- [Rayls Protocol](https://docs.rayls.com/docs/rayls-protocol)
- [Endpoint Documentation](https://docs.rayls.com/docs/endpoint)
- [Resource Documentation](https://docs.rayls.com/docs/resource)
- [Rayls Relayer](https://docs.rayls.com/docs/rayls-relayer)
- [Private Network Hub](https://docs.rayls.com/docs/rayls-subnet-hub)
- [Installing the Rayls SDK](https://docs.rayls.com/docs/sdk)
- [RaylsApp Documentation](https://docs.rayls.com/docs/raylsapp)
- [Teleport Tokens](https://docs.rayls.com/docs/teleport-tokens)
- [Sending Teleports](https://docs.rayls.com/docs/sending-teleports)
- [Transfer Arbitrary Messages](https://docs.rayls.com/docs/transfer-arbitrary-messages)
- [Message Design Patterns](https://docs.rayls.com/docs/message-design-patterns)
- [Supported ERC Token Standards](https://docs.rayls.com/docs/supported-erc-token-standards)
- [Sending Internal Transactions](https://docs.rayls.com/docs/sending-internal-transactions)
- [Freezing Tokens](https://docs.rayls.com/docs/freezing-tokens)
- [Rayls Enygma](https://www.rayls.com/products/enygma)
- [Rayls Private Networks](https://www.rayls.com/products/private-network)
- [Rayls Privacy Node](https://www.rayls.com/products/privacy-node)
- [A Warm Introduction to Rayls](https://docs.rayls.com/docs/a-warm-introduction-to-rayls)
