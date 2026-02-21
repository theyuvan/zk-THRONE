// ============================================================================
// ATTESTATION SIGNING SERVICE (PRODUCTION SAFE)
// ============================================================================

const { Keypair } = require("@stellar/stellar-sdk");
const crypto = require("crypto");

if (!process.env.BACKEND_SECRET) {
  throw new Error("BACKEND_SECRET not set in environment variables");
}

const backendKeypair = Keypair.fromSecret(process.env.BACKEND_SECRET);

console.log("🔑 Backend Public Key:", backendKeypair.publicKey());

/**
 * Sign attestation after proof verification
 * Message format MUST match the contract's verify_signature function:
 * SHA256(roundId_u32_be + player_string + solutionHash_bytes + nonce_u64_be)
 */
function signAttestation(roundId, player, solutionHash, nonce) {
  // Create the message to sign (matching Soroban contract format)
  const buffer = Buffer.alloc(4 + player.length + 32 + 8);
  let offset = 0;

  // Add roundId (u32, big-endian, 4 bytes)
  buffer.writeUInt32BE(roundId, offset);
  offset += 4;

  // Add player address (string bytes)
  Buffer.from(player, 'utf8').copy(buffer, offset);
  offset += player.length;

  // Add solution hash (32 bytes)
  // Remove "0x" if present and convert hex to bytes
  const hashHex = solutionHash.startsWith('0x') ? solutionHash.slice(2) : solutionHash;
  Buffer.from(hashHex, 'hex').copy(buffer, offset);
  offset += 32;

  // Add nonce (u64, big-endian, 8 bytes)
  buffer.writeBigUInt64BE(BigInt(nonce), offset);

  // Hash the entire message with SHA-256
  const message = crypto.createHash("sha256").update(buffer).digest();

  // Sign with Ed25519
  const signature = backendKeypair.sign(message);

  return signature.toString("base64");
}

module.exports = { signAttestation, backendKeypair };