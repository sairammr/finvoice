---
name: flare-tee-extensions
description: Use when building Flare Confidential Compute (FCC/FCE) TEE extensions, deploying custom off-chain logic in trusted execution environments, creating secure signing services, integrating Web2 APIs via TEE, or working with the TeeExtensionRegistry on Flare.
---

# Flare TEE Extensions (Flare Confidential Compute)

## Overview

Flare Confidential Compute (FCC) brings Trusted Execution Environments (TEEs) to Flare. TEE extensions run custom code inside secure hardware -- the TEE proves code integrity and keeps data private. Extensions receive on-chain instructions, process them off-chain, and return signed results.

## Architecture

```
User -> InstructionSender.sol (on-chain)
     -> TeeExtensionRegistry.sendInstructions()
     -> ext-proxy (watches chain via DB indexer)
     -> TEE Node (verifies, forwards)
     -> Your Extension Handler (POST /action)
     -> Returns ActionResult -> proxy -> chain
```

Three services in Docker:
1. **redis** -- cache (port 6383)
2. **ext-proxy** -- bridges blockchain to TEE (ports 6675 internal, 6676 external)
3. **extension-tee** -- your code + tee-node (ports 8882 sign, 8883 extension)

## Starter Repos

- **Key Signing**: `https://github.com/flare-foundation/fce-sign` (Go/Python/TypeScript)
- **Weather API**: `https://github.com/flare-foundation/fce-weather-api` (Go/Python)

Both support Go, Python, TypeScript. Clone one as your starting point.

## Project Structure

```
your-extension/
  contract/
    InstructionSender.sol       # Your on-chain contract
    interface/
      ITeeExtensionRegistry.sol
      ITeeMachineRegistry.sol
  go/                           # OR python/ OR typescript/
    internal/
      app/                      # YOUR CODE - modify this
        config.go               # OpType/OpCommand constants, version
        handlers.go             # Handler functions (core logic)
        types.go                # Request/response types
        abi.go                  # ABI encoding helpers
        crypto.go               # Crypto utilities
      base/                     # FRAMEWORK - do NOT modify
        server.go, types.go, crypto.go, encoding.go
    tools/
      cmd/
        deploy-contract/        # Deploy InstructionSender
        register-extension/     # Register with TeeExtensionRegistry
        allow-tee-version/      # Whitelist Docker image hash
        register-tee/           # Register TEE machine
        run-test/               # End-to-end test
  config/
    coston2/deployed-addresses.json
    proxy/extension_proxy.toml.example
  docker-compose.yaml
```

## Handler Protocol

Every handler has this signature:

```go
// Go
func handler(msg string) (data *string, status int, err error)

// Python
def handler(msg: str) -> tuple[str | None, int, str | None]

// TypeScript
handler(msg: string): Promise<[string | null, number, string | null]>
```

- `msg` = hex-encoded original message from the Solidity contract
- `status 0` = error, `status 1` = success, `status >= 2` = pending
- `data` = hex-encoded result (or null on error)

## Handler Registration

```go
// go/internal/app/handlers.go
func Register(f *base.Framework) {
    f.RegisterHandler(OpTypeConfig, OpCommandRegisterAPIKey, handleRegisterAPIKey)
    f.RegisterHandler(OpTypeWeather, OpCommandGetCurrent, handleGetCurrentWeather)
}
```

```python
# python/app/handlers.py
def register(framework):
    framework.register_handler(OP_TYPE_CONFIG, OP_COMMAND_REGISTER_API_KEY, handle_register_api_key)
    framework.register_handler(OP_TYPE_WEATHER, OP_COMMAND_GET_CURRENT, handle_get_current_weather)
```

```typescript
// typescript/src/app/handlers.ts
export function register(framework: Framework): void {
    framework.registerHandler(OP_TYPE_CONFIG, OP_COMMAND_REGISTER_API_KEY, handleRegisterAPIKey);
    framework.registerHandler(OP_TYPE_WEATHER, OP_COMMAND_GET_CURRENT, handleGetCurrentWeather);
}
```

## Smart Contract Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./interface/ITeeExtensionRegistry.sol";
import "./interface/ITeeMachineRegistry.sol";

contract InstructionSender {
    ITeeExtensionRegistry public immutable teeExtensionRegistry;
    ITeeMachineRegistry public immutable teeMachineRegistry;
    uint256 public _extensionId;
    address[] public _teeIds;

    // Define your operation types and commands as bytes32
    bytes32 public constant OP_TYPE_CONFIG = bytes32("CONFIG");
    bytes32 public constant OP_COMMAND_REGISTER = bytes32("REGISTER");
    bytes32 public constant OP_TYPE_ACTION = bytes32("ACTION");
    bytes32 public constant OP_COMMAND_EXECUTE = bytes32("EXECUTE");

    constructor(address _registry, address _machineRegistry) {
        teeExtensionRegistry = ITeeExtensionRegistry(_registry);
        teeMachineRegistry = ITeeMachineRegistry(_machineRegistry);
    }

    function setExtensionId() external {
        uint256 counter = teeExtensionRegistry.extensionsCounter();
        for (uint256 i = 1; i <= counter; i++) {
            if (teeExtensionRegistry.getTeeExtensionInstructionsSender(i) == address(this)) {
                _extensionId = i;
                return;
            }
        }
    }

    function sendRegister(bytes calldata _encryptedData) external payable returns (bytes32) {
        _teeIds = teeMachineRegistry.getRandomTeeIds(_extensionId, 1);

        ITeeExtensionRegistry.TeeInstructionParams memory params = ITeeExtensionRegistry
            .TeeInstructionParams({
                opType: OP_TYPE_CONFIG,
                opCommand: OP_COMMAND_REGISTER,
                message: _encryptedData,
                cosigners: new address[](0),
                cosignersThreshold: 0,
                claimBackAddress: address(0)
            });

        return teeExtensionRegistry.sendInstructions{value: msg.value}(_teeIds, params);
    }

    function sendExecute(bytes calldata _message) external payable returns (bytes32) {
        require(_teeIds.length > 0, "Register first");

        ITeeExtensionRegistry.TeeInstructionParams memory params = ITeeExtensionRegistry
            .TeeInstructionParams({
                opType: OP_TYPE_ACTION,
                opCommand: OP_COMMAND_EXECUTE,
                message: _message,
                cosigners: new address[](0),
                cosignersThreshold: 0,
                claimBackAddress: address(0)
            });

        return teeExtensionRegistry.sendInstructions{value: msg.value}(_teeIds, params);
    }
}
```

## TEE Node API (localhost:8882)

Available to your extension handler for crypto operations:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /sign` | Sign data with TEE's private key |
| `POST /decrypt` | ECIES decrypt with TEE's private key |
| `POST /result` | Post async ActionResult back |
| `GET /key-info/{walletID}/{keyID}` | Check key existence |

**All byte arrays use base64 encoding** (not hex) in JSON payloads:

```go
// Decrypt example
type DecryptRequest struct {
    EncryptedMessage []byte `json:"encryptedMessage"` // base64
}
type DecryptResponse struct {
    DecryptedMessage []byte `json:"decryptedMessage"` // base64
}

// POST http://localhost:8882/decrypt
resp, _ := http.Post("http://localhost:"+signPort+"/decrypt",
    "application/json", bytes.NewReader(jsonPayload))
```

## Data Flow Detail

**Action** (incoming POST /action to your handler):
```json
{
  "data": {
    "id": "...",
    "type": "...",
    "submissionTag": "...",
    "message": "0x<hex of DataFixed>"
  }
}
```

**DataFixed** (decoded from message):
```json
{
  "instructionId": "0x...",
  "opType": "0x4b455900...00",          // bytes32("KEY") right-padded
  "opCommand": "0x5550444154...00",     // bytes32("UPDATE") right-padded
  "originalMessage": "0x..."            // your actual payload
}
```

**ActionResult** (your response):
```json
{
  "id": "...",
  "submissionTag": "...",
  "status": 1,
  "log": "ok",
  "opType": "0x...",
  "opCommand": "0x...",
  "version": "0x...",
  "data": "0x..."
}
```

## ECIES Encryption Pattern

Users encrypt secrets with TEE's public key before sending on-chain:

```typescript
// Client-side: encrypt API key for TEE
import { encrypt } from "eciesjs";

// 1. Get TEE's public key from proxy
const proxyInfo = await fetch(`${PROXY_URL}/info`);
const teePublicKey = proxyInfo.publicKey;

// 2. ECIES encrypt
const ciphertext = encrypt(teePublicKey, Buffer.from(apiKey));

// 3. Send on-chain
await contract.sendRegister(ciphertext, { value: FEE_WEI });
```

```go
// Handler-side: decrypt in TEE
func handleRegister(msg string) (*string, int, error) {
    ciphertext, _ := hex.DecodeString(msg[2:]) // strip 0x
    plaintext, err := decryptViaNode(ciphertext)
    if err != nil {
        return nil, 0, err
    }
    // Store decrypted secret in memory
    apiKey = string(plaintext)
    return nil, 1, nil
}

func decryptViaNode(ciphertext []byte) ([]byte, error) {
    req := DecryptRequest{EncryptedMessage: ciphertext}
    body, _ := json.Marshal(req)
    resp, _ := http.Post("http://localhost:"+signPort+"/decrypt",
        "application/json", bytes.NewReader(body))
    var result DecryptResponse
    json.NewDecoder(resp.Body).Decode(&result)
    return result.DecryptedMessage, nil
}
```

## Web2 API Integration Pattern (Weather Example)

```go
const (
    OpTypeConfig            = "CONFIG"
    OpTypeWeather           = "WEATHER"
    OpCommandRegisterAPIKey = "REGISTER_API_KEY"
    OpCommandGetCurrent     = "GET_CURRENT"
)

var apiKey string

func handleRegisterAPIKey(msg string) (*string, int, error) {
    ciphertext, _ := hex.DecodeString(msg[2:])
    plaintext, _ := decryptViaNode(ciphertext)
    apiKey = string(plaintext)
    return nil, 1, nil
}

func handleGetCurrentWeather(msg string) (*string, int, error) {
    if apiKey == "" {
        return nil, 0, fmt.Errorf("no API key registered")
    }
    msgBytes, _ := hex.DecodeString(msg[2:])
    var req GetWeatherRequest
    json.Unmarshal(msgBytes, &req) // {"q": "London"}

    resp, _ := http.Get(fmt.Sprintf(
        "http://api.weatherapi.com/v1/current.json?key=%s&q=%s",
        apiKey, req.Query))
    var weather WeatherAPIResponse
    json.NewDecoder(resp.Body).Decode(&weather)

    result := GetWeatherResponse{
        Lat: weather.Location.Lat, Lon: weather.Location.Lon,
        Name: weather.Location.Name, Country: weather.Location.Country,
        TempC: weather.Current.TempC,
    }
    data, _ := json.Marshal(result)
    hexData := "0x" + hex.EncodeToString(data)
    return &hexData, 1, nil
}
```

## Deployment Steps (Coston2)

### Prerequisites
- Funded Coston2 wallet (get C2FLR from `https://faucet.flare.network/coston2`)
- Docker + Docker Compose
- Go 1.21+ (for deployment tools)
- `cloudflared` or `ngrok` (for tunnel)
- C-chain indexer DB credentials (get from Flare team at hackathon booth or TG group)

### Step-by-Step

```bash
# 1. Clone starter repo
git clone https://github.com/flare-foundation/fce-sign.git
cd fce-sign

# 2. Configure environment
cp .env.example .env
# Set: PRIVATE_KEY, INITIAL_OWNER, LANGUAGE (go/python/typescript)

cp config/proxy/extension_proxy.toml.example config/proxy/extension_proxy.toml
# Set: DB host, port, username, password (get from Flare team)

# 3. Deploy InstructionSender contract
cd go/tools && go run ./cmd/deploy-contract
# Save printed address as INSTRUCTION_SENDER in .env

# 4. Register extension
go run ./cmd/register-extension
# Save printed ID as EXTENSION_ID in .env

# 5. Start Docker stack
cd ../.. && docker compose build && docker compose up -d

# 6. Start tunnel
cloudflared tunnel --url http://localhost:6676
# Save URL as TUNNEL_URL in .env

# 7. Allow TEE version
cd go/tools && go run ./cmd/allow-tee-version -p http://localhost:6676

# 8. Register TEE machine
go run ./cmd/register-tee -p http://localhost:6676 -l

# 9. Test
go run ./cmd/run-test -p http://localhost:6676
```

## Key Contract Addresses (Coston2)

| Contract | Address |
|----------|---------|
| TeeExtensionRegistry | `0x3d478d43426081BD5854be9C7c5c183bfe76C981` |
| TeeMachineRegistry | `0x5918Cd58e5caf755b8584649Aa24077822F87613` |
| TeeVerification | `0x4D504e6717C63931F3FC36502EFdDAddc6Ce80A8` |
| TeeOwnerAllowlist | `0xCb870e753F3f7B58e55A30EF367b6432dCC22835` |
| TeeVersionManager | `0x2da0D3bcAB211f59e3f1115B071d088D88C8f8fc` |
| TeeFeeCalculator | `0xb606bdFB43169822622aC9D8A52613888729870b` |

## Proxy Configuration

```toml
# config/proxy/extension_proxy.toml
redis_port = "redis:6379"
chain_id = 114
private_key_variable = "PRIVATE_KEY"
initial_signing_policy_offset = 3
signing_policy_fetch_interval = "20s"

[db]
host = "35.233.36.8"
port = 3306
database = "indexer"
username = "<get-from-flare-team>"
password = "<get-from-flare-team>"

[addresses]
flare_systems_manager = "0xA90Db6D10F856799b10ef2A77EBCbF460aC71e52"
relay = "0xa10B672D1c62e5457b17af63d4302add6A99d7dE"
voter_registry = "0x6a0AF07b7972177B176d3D422555cbc98DfDe914"

[ports]
internal = "6663"
external = "6664"
```

## Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `PRIVATE_KEY` | Funded Coston2 wallet |
| `INITIAL_OWNER` | Owner address from PRIVATE_KEY |
| `EXTENSION_ID` | Assigned after register-extension |
| `INSTRUCTION_SENDER` | Deployed contract address |
| `TUNNEL_URL` | Public URL for ext-proxy |
| `LANGUAGE` | `go`, `python`, or `typescript` |
| `FEE_WEI` | Fee per instruction (default `1000000000000`) |
| `MODE=1` | Test mode (fake attestation for Coston2) |

## Common Mistakes

- Forgetting to get DB credentials from Flare team -- the proxy needs them to read on-chain instructions
- Using hex encoding for TEE node API -- it expects **base64** for byte arrays
- Not running `setExtensionId()` on the contract before sending instructions
- State is in-memory only -- if TEE restarts, secrets must be re-registered
- Minimum fee is 1000 wei per instruction via `msg.value`
- All handler calls are mutex-serialized -- no locking needed but keep handlers fast
