/**
 * Register TEE Extension on Flare Coston2
 * Steps: Register extension → Allow owners → Add key types → Add TEE version
 *
 * Usage: bun run scripts/register-tee.ts
 */
import { config } from "dotenv";
config();

import {
  createPublicClient, createWalletClient, http, defineChain,
  parseEventLogs, keccak256, toBytes, toHex, encodeAbiParameters,
  type Log,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const FLARE_KEY = process.env.FLARE_PRIVATE_KEY as `0x${string}`;
const INSTRUCTION_SENDER = process.env.INSTRUCTION_SENDER_ADDRESS as `0x${string}`;

// Coston2 TEE contract addresses
const TEE_EXTENSION_REGISTRY = "0x3d478d43426081BD5854be9C7c5c183bfe76C981" as const;
const TEE_OWNER_ALLOWLIST = "0xCb870e753F3f7B58e55A30EF367b6432dCC22835" as const;
const TEE_MACHINE_REGISTRY = "0x5918Cd58e5caf755b8584649Aa24077822F87613" as const;

const coston2 = defineChain({
  id: 114, name: "Coston2",
  nativeCurrency: { name: "C2FLR", symbol: "C2FLR", decimals: 18 },
  rpcUrls: { default: { http: ["https://coston2-api.flare.network/ext/C/rpc"] } },
});

const account = privateKeyToAccount(FLARE_KEY);
const publicClient = createPublicClient({ chain: coston2, transport: http() });
const walletClient = createWalletClient({ account, chain: coston2, transport: http() });

// EVM key type hash
const EVM_KEY_TYPE = keccak256(toBytes("EVM"));

// ── ABIs ──

const TeeExtensionRegistryABI = [
  {
    type: "function", name: "Register",
    inputs: [
      { name: "stateVerifier", type: "address" },
      { name: "instructionsSender", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "AddSupportedKeyTypes",
    inputs: [
      { name: "extensionId", type: "uint256" },
      { name: "keyTypes", type: "bytes32[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "AddTeeVersion",
    inputs: [
      { name: "extensionId", type: "uint256" },
      { name: "version", type: "string" },
      { name: "codeHash", type: "bytes32" },
      { name: "platforms", type: "bytes32[]" },
      { name: "governanceHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "extensionsCounter",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "getTeeExtensionInstructionsSender",
    inputs: [{ name: "extensionId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "IsKeyTypeSupported",
    inputs: [
      { name: "extensionId", type: "uint256" },
      { name: "keyType", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "IsCodeHashPlatformSupported",
    inputs: [
      { name: "extensionId", type: "uint256" },
      { name: "codeHash", type: "bytes32" },
      { name: "platform", type: "bytes32" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event", name: "TeeExtensionRegistered",
    inputs: [{ name: "extensionId", type: "uint256", indexed: true }],
  },
  {
    type: "event", name: "TeeExtensionContractsSet",
    inputs: [
      { name: "extensionId", type: "uint256", indexed: true },
      { name: "stateVerifier", type: "address", indexed: false },
      { name: "instructionsSender", type: "address", indexed: false },
    ],
  },
] as const;

const TeeOwnerAllowlistABI = [
  {
    type: "function", name: "AddAllowedTeeMachineOwners",
    inputs: [
      { name: "extensionId", type: "uint256" },
      { name: "owners", type: "address[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "AddAllowedTeeWalletProjectOwners",
    inputs: [
      { name: "extensionId", type: "uint256" },
      { name: "owners", type: "address[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "IsAllowedTeeMachineOwner",
    inputs: [
      { name: "extensionId", type: "uint256" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function", name: "IsAllowedTeeWalletProjectOwner",
    inputs: [
      { name: "extensionId", type: "uint256" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

function ok(msg: string) { console.log(`  ✓ ${msg}`); }
function info(msg: string) { console.log(`  → ${msg}`); }

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  FINVOICE TEE EXTENSION REGISTRATION — Flare Coston2     ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  console.log(`  Account: ${account.address}`);
  console.log(`  InstructionSender: ${INSTRUCTION_SENDER}\n`);

  // ── Check if already registered ──
  const counter = await publicClient.readContract({
    address: TEE_EXTENSION_REGISTRY,
    abi: TeeExtensionRegistryABI,
    functionName: "extensionsCounter",
  }) as bigint;

  let existingExtensionId: bigint | null = null;
  for (let i = 1n; i <= counter; i++) {
    const sender = await publicClient.readContract({
      address: TEE_EXTENSION_REGISTRY,
      abi: TeeExtensionRegistryABI,
      functionName: "getTeeExtensionInstructionsSender",
      args: [i],
    });
    if ((sender as string).toLowerCase() === INSTRUCTION_SENDER.toLowerCase()) {
      existingExtensionId = i;
      break;
    }
  }

  let extensionId: bigint;

  if (existingExtensionId) {
    extensionId = existingExtensionId;
    ok(`Extension already registered with ID: ${extensionId}`);
  } else {
    // ── Step 1: Register extension ──
    console.log("── Step 1: Register Extension ──\n");

    info("Calling TeeExtensionRegistry.Register()...");
    const hash = await walletClient.writeContract({
      address: TEE_EXTENSION_REGISTRY,
      abi: TeeExtensionRegistryABI,
      functionName: "Register",
      args: [INSTRUCTION_SENDER, INSTRUCTION_SENDER], // stateVerifier = instructionsSender for simplicity
    });

    ok(`Tx: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    ok(`Confirmed in block ${receipt.blockNumber}`);

    // Parse extensionId from event
    const registeredEvents = parseEventLogs({
      abi: TeeExtensionRegistryABI,
      logs: receipt.logs as any[],
      eventName: "TeeExtensionRegistered",
    });

    if (registeredEvents.length > 0) {
      extensionId = (registeredEvents[0] as any).args.extensionId;
      ok(`Extension ID: ${extensionId}`);
    } else {
      // Fallback: read counter again
      const newCounter = await publicClient.readContract({
        address: TEE_EXTENSION_REGISTRY,
        abi: TeeExtensionRegistryABI,
        functionName: "extensionsCounter",
      }) as bigint;
      extensionId = newCounter;
      ok(`Extension ID (from counter): ${extensionId}`);
    }
  }

  // ── Step 2: Allow TEE machine owners ──
  console.log("\n── Step 2: Allow TEE Machine Owners ──\n");

  const isMachineOwner = await publicClient.readContract({
    address: TEE_OWNER_ALLOWLIST,
    abi: TeeOwnerAllowlistABI,
    functionName: "IsAllowedTeeMachineOwner",
    args: [extensionId, account.address],
  });

  if (isMachineOwner) {
    ok("Already allowed as TEE machine owner");
  } else {
    info("Adding as TEE machine owner...");
    const hash = await walletClient.writeContract({
      address: TEE_OWNER_ALLOWLIST,
      abi: TeeOwnerAllowlistABI,
      functionName: "AddAllowedTeeMachineOwners",
      args: [extensionId, [account.address]],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    ok(`Added as machine owner — tx: ${hash}`);
  }

  // ── Step 3: Allow wallet project owners ──
  console.log("\n── Step 3: Allow Wallet Project Owners ──\n");

  const isWalletOwner = await publicClient.readContract({
    address: TEE_OWNER_ALLOWLIST,
    abi: TeeOwnerAllowlistABI,
    functionName: "IsAllowedTeeWalletProjectOwner",
    args: [extensionId, account.address],
  });

  if (isWalletOwner) {
    ok("Already allowed as wallet project owner");
  } else {
    info("Adding as wallet project owner...");
    const hash = await walletClient.writeContract({
      address: TEE_OWNER_ALLOWLIST,
      abi: TeeOwnerAllowlistABI,
      functionName: "AddAllowedTeeWalletProjectOwners",
      args: [extensionId, [account.address]],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    ok(`Added as wallet project owner — tx: ${hash}`);
  }

  // ── Step 4: Add EVM key type support ──
  console.log("\n── Step 4: Add EVM Key Type ──\n");

  const isKeySupported = await publicClient.readContract({
    address: TEE_EXTENSION_REGISTRY,
    abi: TeeExtensionRegistryABI,
    functionName: "IsKeyTypeSupported",
    args: [extensionId, EVM_KEY_TYPE],
  });

  if (isKeySupported) {
    ok("EVM key type already supported");
  } else {
    info("Adding EVM key type...");
    const hash = await walletClient.writeContract({
      address: TEE_EXTENSION_REGISTRY,
      abi: TeeExtensionRegistryABI,
      functionName: "AddSupportedKeyTypes",
      args: [extensionId, [EVM_KEY_TYPE]],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    ok(`EVM key type added — tx: ${hash}`);
  }

  // ── Step 5: Add TEE version (test mode) ──
  console.log("\n── Step 5: Add TEE Version (test mode) ──\n");

  // In local/test mode, we use hardcoded test values
  const TEST_CODE_HASH = keccak256(toBytes("TEST_CODE_HASH"));
  const TEST_PLATFORM = keccak256(toBytes("TEST_PLATFORM"));
  const TEST_GOVERNANCE_HASH = keccak256(toBytes("TEST_GOVERNANCE"));

  const isVersionSupported = await publicClient.readContract({
    address: TEE_EXTENSION_REGISTRY,
    abi: TeeExtensionRegistryABI,
    functionName: "IsCodeHashPlatformSupported",
    args: [extensionId, TEST_CODE_HASH, TEST_PLATFORM],
  });

  if (isVersionSupported) {
    ok("Test TEE version already registered");
  } else {
    info("Adding test TEE version...");
    const hash = await walletClient.writeContract({
      address: TEE_EXTENSION_REGISTRY,
      abi: TeeExtensionRegistryABI,
      functionName: "AddTeeVersion",
      args: [extensionId, "0.1.0", TEST_CODE_HASH, [TEST_PLATFORM], TEST_GOVERNANCE_HASH],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    ok(`Test version added — tx: ${hash}`);
  }

  // ── Done ──
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  REGISTRATION COMPLETE ✓                                ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Extension ID: ${String(extensionId).padEnd(39)}║`);
  console.log(`║  Contract: ${INSTRUCTION_SENDER.slice(0, 20)}...                  ║`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Add to .env:                                           ║");
  console.log(`║  EXTENSION_ID=${String(extensionId).padEnd(40)}║`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Next steps:                                            ║");
  console.log("║  1. docker compose up -d (in tee-extension/)            ║");
  console.log("║  2. cloudflared tunnel --url http://localhost:6676       ║");
  console.log("║  3. bun run scripts/register-tee-node.ts <tunnel-url>   ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
}

main().catch(console.error);
