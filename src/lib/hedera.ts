import {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenBurnTransaction,
  TransferTransaction,
  TokenInfoQuery,
  TokenNftInfoQuery,
  NftId,
  TokenId,
  Hbar,
  TokenAssociateTransaction,
} from "@hashgraph/sdk";

// ── Client setup ──

const operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID || "0.0.0");
const operatorKey = PrivateKey.fromStringED25519(process.env.HEDERA_OPERATOR_KEY || "");

const client = Client.forTestnet();
client.setOperator(operatorId, operatorKey);

export { client, operatorId, operatorKey };

// ── Token IDs from env ──

export const attestationTokenId = TokenId.fromString(
  process.env.ATTESTATION_TOKEN_ID || "0.0.0"
);
export const receiptTokenId = TokenId.fromString(
  process.env.RECEIPT_TOKEN_ID || "0.0.0"
);
export const treasuryId = AccountId.fromString(
  process.env.HEDERA_TREASURY_ID || process.env.HEDERA_OPERATOR_ID || "0.0.0"
);

// ── One-time setup: Create NFT collections ──

export async function createAttestationCollection(): Promise<string> {
  const tx = await new TokenCreateTransaction()
    .setTokenName("Finvoice Invoice Attestations")
    .setTokenSymbol("RATTEST")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(10000)
    .setTreasuryAccountId(operatorId)
    .setInitialSupply(0)
    .setAdminKey(operatorKey.publicKey)
    .setSupplyKey(operatorKey.publicKey)
    .setWipeKey(operatorKey.publicKey)
    .setTokenMemo("Invoice factoring attestation NFTs - Flare TEE scored")
    .freezeWith(client);

  const signTx = await tx.sign(operatorKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  return receipt.tokenId!.toString();
}

export async function createReceiptCollection(): Promise<string> {
  const tx = await new TokenCreateTransaction()
    .setTokenName("Finvoice Invoice Receipts")
    .setTokenSymbol("RRECEIPT")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(10000)
    .setTreasuryAccountId(operatorId)
    .setInitialSupply(0)
    .setAdminKey(operatorKey.publicKey)
    .setSupplyKey(operatorKey.publicKey)
    .setWipeKey(operatorKey.publicKey)
    .setTokenMemo("Invoice factoring receipt NFTs - funder proof of investment")
    .freezeWith(client);

  const signTx = await tx.sign(operatorKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  return receipt.tokenId!.toString();
}

// ── Attestation NFT metadata ──

export interface AttestationMetadata {
  invoiceId: string;
  riskGrade: string;
  discountBps: number;
  yieldBps: number;
  confidenceScore: number;
  faceValue: number;
  dueDate: string;
  attestationHash: string;
  pdfHash: string;
  attestedAt: number;
}

export interface ReceiptMetadata {
  invoiceId: string;
  riskGrade: string;
  faceValue: number;
  purchasePrice: number;
  yieldBps: number;
  maturityDate: string;
  funderHederaId: string;
  attestationHash: string;
}

// ── Mint attestation NFT ──
// HTS NFT metadata is max 100 bytes. We store a compact pipe-delimited string:
// invoiceId|riskGrade|discountBps|yieldBps|confidenceScore|hashPrefix
// Full data lives in HCS. The NFT is proof of attestation existence.

export async function mintAttestationNFT(
  metadata: AttestationMetadata
): Promise<{ serialNumber: number; txId: string }> {
  const compact = [
    metadata.invoiceId,
    metadata.riskGrade,
    metadata.discountBps,
    metadata.yieldBps,
    metadata.confidenceScore,
    metadata.attestationHash.slice(0, 20),
  ].join("|");

  const metadataBytes = Buffer.from(compact);
  if (metadataBytes.length > 100) {
    // Truncate to fit — hash prefix gives enough for verification
    const truncated = compact.slice(0, 100);
    const mintTx = await new TokenMintTransaction()
      .setTokenId(attestationTokenId)
      .addMetadata(Buffer.from(truncated))
      .freezeWith(client);
    const signTx = await mintTx.sign(operatorKey);
    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    return {
      serialNumber: receipt.serials[0].toNumber(),
      txId: txResponse.transactionId.toString(),
    };
  }

  const mintTx = await new TokenMintTransaction()
    .setTokenId(attestationTokenId)
    .addMetadata(metadataBytes)
    .freezeWith(client);

  const signTx = await mintTx.sign(operatorKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  return {
    serialNumber: receipt.serials[0].toNumber(),
    txId: txResponse.transactionId.toString(),
  };
}

// ── Mint receipt NFT ──
// Same 100-byte limit. Compact format:
// invoiceId|grade|faceValue|purchasePrice|funderHederaId

export async function mintReceiptNFT(
  metadata: ReceiptMetadata
): Promise<{ serialNumber: number; txId: string }> {
  const compact = [
    metadata.invoiceId,
    metadata.riskGrade,
    metadata.faceValue,
    metadata.purchasePrice,
    metadata.funderHederaId,
  ].join("|").slice(0, 100);

  const metadataBytes = Buffer.from(compact);

  const mintTx = await new TokenMintTransaction()
    .setTokenId(receiptTokenId)
    .addMetadata(metadataBytes)
    .freezeWith(client);

  const signTx = await mintTx.sign(operatorKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  return {
    serialNumber: receipt.serials[0].toNumber(),
    txId: txResponse.transactionId.toString(),
  };
}

// ── Burn receipt NFT (on settlement) ──

export async function burnReceiptNFT(serialNumber: number): Promise<string> {
  const burnTx = await new TokenBurnTransaction()
    .setTokenId(receiptTokenId)
    .setSerials([serialNumber])
    .freezeWith(client);

  const signTx = await burnTx.sign(operatorKey);
  const txResponse = await signTx.execute(client);
  await txResponse.getReceipt(client);
  return txResponse.transactionId.toString();
}

// ── HBAR transfers ──

export async function transferHbar(
  fromId: AccountId,
  toId: AccountId,
  amount: number
): Promise<string> {
  const tx = await new TransferTransaction()
    .addHbarTransfer(fromId, new Hbar(-amount))
    .addHbarTransfer(toId, new Hbar(amount))
    .freezeWith(client);

  const signTx = await tx.sign(operatorKey);
  const txResponse = await signTx.execute(client);
  await txResponse.getReceipt(client);
  return txResponse.transactionId.toString();
}

// ── Transfer NFT ──

export async function transferNFT(
  tokenId: TokenId,
  serialNumber: number,
  fromId: AccountId,
  toId: AccountId
): Promise<string> {
  const tx = await new TransferTransaction()
    .addNftTransfer(new NftId(tokenId, serialNumber), fromId, toId)
    .freezeWith(client);

  const signTx = await tx.sign(operatorKey);
  const txResponse = await signTx.execute(client);
  await txResponse.getReceipt(client);
  return txResponse.transactionId.toString();
}

// ── Associate token with account ──

export async function associateToken(
  accountId: AccountId,
  tokenId: TokenId,
  accountKey: PrivateKey
): Promise<string> {
  const tx = await new TokenAssociateTransaction()
    .setAccountId(accountId)
    .setTokenIds([tokenId])
    .freezeWith(client);

  const signTx = await tx.sign(accountKey);
  const txResponse = await signTx.execute(client);
  await txResponse.getReceipt(client);
  return txResponse.transactionId.toString();
}

// ── Query NFT info ──

export async function getAttestationNFTInfo(serialNumber: number) {
  const nftId = new NftId(attestationTokenId, serialNumber);
  const nftInfos = await new TokenNftInfoQuery()
    .setNftId(nftId)
    .execute(client);

  if (nftInfos.length === 0) return null;

  const nft = nftInfos[0];
  const raw = Buffer.from(nft.metadata as Uint8Array).toString();
  // Metadata is pipe-delimited: invoiceId|riskGrade|discountBps|yieldBps|confidenceScore|hashPrefix
  const parts = raw.split("|");
  const metadata: AttestationMetadata = {
    invoiceId: parts[0] || "",
    riskGrade: parts[1] || "",
    discountBps: Number(parts[2]) || 0,
    yieldBps: Number(parts[3]) || 0,
    confidenceScore: Number(parts[4]) || 0,
    faceValue: 0,
    dueDate: "",
    attestationHash: parts[5] || "",
    pdfHash: "",
    attestedAt: 0,
  };

  return {
    serialNumber,
    owner: nft.accountId.toString(),
    metadata,
  };
}

// ── Query token info ──

export async function getTokenInfo(tokenId: TokenId) {
  const info = await new TokenInfoQuery()
    .setTokenId(tokenId)
    .execute(client);

  return {
    name: info.name,
    symbol: info.symbol,
    totalSupply: info.totalSupply.toString(),
    maxSupply: info.maxSupply?.toString() || "0",
    treasury: info.treasuryAccountId?.toString(),
  };
}

// ── Setup script (run once) ──

export async function setupHederaTokens() {
  console.log("Creating Attestation NFT collection...");
  const attTokenId = await createAttestationCollection();
  console.log(`Attestation Token ID: ${attTokenId}`);

  console.log("Creating Receipt NFT collection...");
  const recTokenId = await createReceiptCollection();
  console.log(`Receipt Token ID: ${recTokenId}`);

  console.log("\nAdd these to your .env:");
  console.log(`ATTESTATION_TOKEN_ID=${attTokenId}`);
  console.log(`RECEIPT_TOKEN_ID=${recTokenId}`);

  return { attestationTokenId: attTokenId, receiptTokenId: recTokenId };
}
