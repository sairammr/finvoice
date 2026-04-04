/**
 * Encrypt/Decrypt utilities for Flare (secp256k1) and Hedera (ED25519) keys.
 *
 * Uses `eciesjs` which supports both curves via Config.
 * - Flare/EVM: secp256k1 ECIES (default)
 * - Hedera ED25519: ed25519 ECIES (converted to x25519 internally)
 *
 * For TEE: encrypt client-side with TEE's public key, TEE decrypts via /decrypt endpoint.
 * For Hedera: encrypt with recipient's public key, decrypt with their private key.
 */

import { encrypt, decrypt, PrivateKey as EciesPrivateKey, PublicKey as EciesPublicKey } from "eciesjs";
import { keccak256, toBytes } from "viem";

// ── Types ──

export type ChainType = "flare" | "hedera";

export interface EncryptedPayload {
  chain: ChainType;
  ciphertext: string; // hex-encoded
  ephemeralPublicKey?: string; // hex, included in ciphertext for ECIES
}

// ── Encrypt for Flare (secp256k1) ──

export function encryptForFlare(
  recipientPublicKeyHex: string,
  plaintext: string | Uint8Array
): string {
  const data = typeof plaintext === "string" ? Buffer.from(plaintext) : Buffer.from(plaintext);
  const pubKeyClean = recipientPublicKeyHex.startsWith("0x")
    ? recipientPublicKeyHex.slice(2)
    : recipientPublicKeyHex;

  const encrypted = encrypt(pubKeyClean, data);
  return "0x" + Buffer.from(encrypted).toString("hex");
}

export function decryptForFlare(
  privateKeyHex: string,
  ciphertextHex: string
): Buffer {
  const privKeyClean = privateKeyHex.startsWith("0x")
    ? privateKeyHex.slice(2)
    : privateKeyHex;
  const cipherBytes = Buffer.from(
    ciphertextHex.startsWith("0x") ? ciphertextHex.slice(2) : ciphertextHex,
    "hex"
  );

  return Buffer.from(decrypt(privKeyClean, cipherBytes));
}

// ── Encrypt for Hedera (ED25519 via eciesjs ed25519 curve) ──

export function encryptForHedera(
  recipientEd25519PublicKeyHex: string,
  plaintext: string | Uint8Array
): string {
  const data = typeof plaintext === "string" ? Buffer.from(plaintext) : Buffer.from(plaintext);
  const pubKeyClean = recipientEd25519PublicKeyHex.startsWith("0x")
    ? recipientEd25519PublicKeyHex.slice(2)
    : recipientEd25519PublicKeyHex;

  // eciesjs supports ed25519 via config
  const { Config } = require("eciesjs");
  const config = new Config();
  config.ellipticCurve = "ed25519";

  const encrypted = encrypt(pubKeyClean, data, config);
  return "0x" + Buffer.from(encrypted).toString("hex");
}

export function decryptForHedera(
  privateKeyHex: string,
  ciphertextHex: string
): Buffer {
  const privKeyClean = privateKeyHex.startsWith("0x")
    ? privateKeyHex.slice(2)
    : privateKeyHex;
  const cipherBytes = Buffer.from(
    ciphertextHex.startsWith("0x") ? ciphertextHex.slice(2) : ciphertextHex,
    "hex"
  );

  const { Config } = require("eciesjs");
  const config = new Config();
  config.ellipticCurve = "ed25519";

  return Buffer.from(decrypt(privKeyClean, cipherBytes, config));
}

// ── Unified encrypt/decrypt ──

export function encryptData(
  recipientPublicKeyHex: string,
  plaintext: string | Uint8Array,
  chain: ChainType = "flare"
): string {
  if (chain === "hedera") {
    return encryptForHedera(recipientPublicKeyHex, plaintext);
  }
  return encryptForFlare(recipientPublicKeyHex, plaintext);
}

export function decryptData(
  privateKeyHex: string,
  ciphertextHex: string,
  chain: ChainType = "flare"
): Buffer {
  if (chain === "hedera") {
    return decryptForHedera(privateKeyHex, ciphertextHex);
  }
  return decryptForFlare(privateKeyHex, ciphertextHex);
}

// ── Hash utilities ──

export function hashData(data: string): string {
  return keccak256(toBytes(data));
}

export function hashJSON(obj: Record<string, any>): string {
  return keccak256(toBytes(JSON.stringify(obj)));
}

// ── Key derivation helpers ──

export function deriveEncryptionPublicKey(privateKeyHex: string): string {
  const privKeyClean = privateKeyHex.startsWith("0x")
    ? privateKeyHex.slice(2)
    : privateKeyHex;
  const sk = new EciesPrivateKey(Buffer.from(privKeyClean, "hex"));
  return sk.publicKey.toHex();
}
