/**
 * Compile + Deploy InvoiceInstructionSender to Flare Coston2
 * Usage: bun run scripts/deploy-flare.ts
 */
import solc from "solc";
import { readFileSync } from "fs";
import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const PRIVATE_KEY = process.env.FLARE_PRIVATE_KEY as `0x${string}`;
const TEE_EXTENSION_REGISTRY = "0x3d478d43426081BD5854be9C7c5c183bfe76C981";
const TEE_MACHINE_REGISTRY = "0x5918Cd58e5caf755b8584649Aa24077822F87613";

const coston2 = defineChain({
  id: 114,
  name: "Flare Testnet Coston2",
  nativeCurrency: { name: "C2FLR", symbol: "C2FLR", decimals: 18 },
  rpcUrls: { default: { http: ["https://coston2-api.flare.network/ext/C/rpc"] } },
  blockExplorers: { default: { name: "Explorer", url: "https://coston2-explorer.flare.network" } },
});

const account = privateKeyToAccount(PRIVATE_KEY);
const publicClient = createPublicClient({ chain: coston2, transport: http() });
const walletClient = createWalletClient({ account, chain: coston2, transport: http() });

// ── Compile ──

function compile() {
  const contractDir = "tee-extension/contract";

  const input = {
    language: "Solidity",
    sources: {
      "InvoiceInstructionSender.sol": {
        content: readFileSync(`${contractDir}/InvoiceInstructionSender.sol`, "utf8"),
      },
      "interface/ITeeExtensionRegistry.sol": {
        content: readFileSync(`${contractDir}/interface/ITeeExtensionRegistry.sol`, "utf8"),
      },
      "interface/ITeeMachineRegistry.sol": {
        content: readFileSync(`${contractDir}/interface/ITeeMachineRegistry.sol`, "utf8"),
      },
    },
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object"] },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter((e: any) => e.severity === "error");
    if (errors.length > 0) {
      console.error("Compilation errors:");
      errors.forEach((e: any) => console.error(e.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts["InvoiceInstructionSender.sol"]["InvoiceInstructionSender"];
  return {
    abi: contract.abi,
    bytecode: ("0x" + contract.evm.bytecode.object) as `0x${string}`,
  };
}

// ── Deploy ──

async function main() {
  console.log("=== Flare Coston2 Contract Deployment ===\n");
  console.log("Deployer:", account.address);

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", Number(balance) / 1e18, "C2FLR\n");

  console.log("Compiling InvoiceInstructionSender.sol...");
  const { abi, bytecode } = compile();
  console.log("Compiled! ABI functions:", abi.filter((x: any) => x.type === "function").length);
  console.log("Bytecode size:", Math.round(bytecode.length / 2), "bytes\n");

  console.log("Deploying to Coston2...");
  console.log("Constructor args:");
  console.log("  TeeExtensionRegistry:", TEE_EXTENSION_REGISTRY);
  console.log("  TeeMachineRegistry:", TEE_MACHINE_REGISTRY);

  const hash = await walletClient.deployContract({
    abi,
    bytecode,
    args: [TEE_EXTENSION_REGISTRY, TEE_MACHINE_REGISTRY],
  });

  console.log("\nTx hash:", hash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("\n=== DEPLOYED ===");
  console.log("Contract address:", receipt.contractAddress);
  console.log("Block:", receipt.blockNumber.toString());
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Explorer:", `https://coston2-explorer.flare.network/address/${receipt.contractAddress}`);
  console.log("\nAdd to .env:");
  console.log(`INSTRUCTION_SENDER_ADDRESS=${receipt.contractAddress}`);
}

main().catch(console.error);
