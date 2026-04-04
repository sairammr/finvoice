/**
 * Set up Hedera Testnet: create account + NFT collections
 * Usage: bun run scripts/setup-hedera.ts
 *
 * If HEDERA_OPERATOR_ID is not set, generates a new testnet account via portal.
 * Then creates Attestation + Receipt NFT collections.
 */
import {
  Client,
  AccountId,
  PrivateKey,
  Hbar,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  AccountBalanceQuery,
} from "@hashgraph/sdk";

async function main() {
  let operatorId: string;
  let operatorKey: PrivateKey;

  if (process.env.HEDERA_OPERATOR_ID && process.env.HEDERA_OPERATOR_KEY) {
    operatorId = process.env.HEDERA_OPERATOR_ID;
    operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY);
    console.log("Using existing Hedera operator:", operatorId);
  } else {
    // Generate new key pair — user needs to create account at portal.hedera.com
    const newKey = PrivateKey.generateED25519();
    console.log("=== New Hedera Testnet Key Generated ===");
    console.log("Private Key (ED25519):", newKey.toStringRaw());
    console.log("Public Key:", newKey.publicKey.toStringRaw());
    console.log("\nTo get a testnet account:");
    console.log("1. Go to https://portal.hedera.com/register");
    console.log("2. Create a testnet account");
    console.log("3. Fund it with testnet HBAR");
    console.log("4. Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in .env");
    console.log("5. Run this script again\n");
    console.log("Or use the Hedera Developer Portal to create testnet accounts.");
    console.log("\nAdd to .env:");
    console.log(`HEDERA_OPERATOR_KEY=${newKey.toStringRaw()}`);
    return;
  }

  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(operatorId), operatorKey);

  // Check balance
  const balanceQuery = await new AccountBalanceQuery()
    .setAccountId(AccountId.fromString(operatorId))
    .execute(client);
  console.log("Balance:", balanceQuery.hbars.toString());

  if (balanceQuery.hbars.toBigNumber().toNumber() < 10) {
    console.log("Insufficient balance. Fund the account first.");
    return;
  }

  // Create Attestation NFT collection
  console.log("\nCreating 'Invoice Attestations' NFT collection...");
  const attTx = await new TokenCreateTransaction()
    .setTokenName("Hedsup Invoice Attestations")
    .setTokenSymbol("RATTEST")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(10000)
    .setTreasuryAccountId(AccountId.fromString(operatorId))
    .setInitialSupply(0)
    .setAdminKey(operatorKey.publicKey)
    .setSupplyKey(operatorKey.publicKey)
    .setWipeKey(operatorKey.publicKey)
    .setTokenMemo("Invoice factoring attestation NFTs - Flare TEE scored")
    .freezeWith(client);

  const attSigned = await attTx.sign(operatorKey);
  const attResponse = await attSigned.execute(client);
  const attReceipt = await attResponse.getReceipt(client);
  const attestationTokenId = attReceipt.tokenId!.toString();
  console.log("Attestation Token ID:", attestationTokenId);

  // Create Receipt NFT collection
  console.log("\nCreating 'Invoice Receipts' NFT collection...");
  const recTx = await new TokenCreateTransaction()
    .setTokenName("Hedsup Invoice Receipts")
    .setTokenSymbol("RRECEIPT")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(10000)
    .setTreasuryAccountId(AccountId.fromString(operatorId))
    .setInitialSupply(0)
    .setAdminKey(operatorKey.publicKey)
    .setSupplyKey(operatorKey.publicKey)
    .setWipeKey(operatorKey.publicKey)
    .setTokenMemo("Invoice factoring receipt NFTs - funder proof of investment")
    .freezeWith(client);

  const recSigned = await recTx.sign(operatorKey);
  const recResponse = await recSigned.execute(client);
  const recReceipt = await recResponse.getReceipt(client);
  const receiptTokenId = recReceipt.tokenId!.toString();
  console.log("Receipt Token ID:", receiptTokenId);

  console.log("\n=== DONE ===");
  console.log("Add to .env:");
  console.log(`ATTESTATION_TOKEN_ID=${attestationTokenId}`);
  console.log(`RECEIPT_TOKEN_ID=${receiptTokenId}`);
  console.log(`HEDERA_TREASURY_ID=${operatorId}`);

  console.log("\nHashScan links:");
  console.log(`Attestation: https://hashscan.io/testnet/token/${attestationTokenId}`);
  console.log(`Receipt: https://hashscan.io/testnet/token/${receiptTokenId}`);
}

main().catch(console.error);
