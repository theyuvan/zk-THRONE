// ============================================================================
// NONCE SERVICE (PRODUCTION SAFE - IN MEMORY + OPTIONAL PERSIST)
// ============================================================================

const fs = require("fs");

const NONCE_FILE = "./nonces.json";

let nonces = {};

// Load from disk if exists
if (fs.existsSync(NONCE_FILE)) {
  nonces = JSON.parse(fs.readFileSync(NONCE_FILE, "utf8"));
}

/**
 * Save nonce state to disk
 */
function save() {
  fs.writeFileSync(NONCE_FILE, JSON.stringify(nonces, null, 2));
}

/**
 * Get next nonce
 */
function getNextNonce(player) {
  const current = nonces[player] || 0;
  const next = current + 1;
  nonces[player] = next;
  save();
  return next;
}

/**
 * Get current nonce
 */
function getCurrentNonce(player) {
  return nonces[player] || 0;
}

/**
 * Reset nonce
 */
function resetNonce(player) {
  delete nonces[player];
  save();
  console.log(`🔄 Nonce reset for ${player}`);
}

module.exports = {
  getNextNonce,
  getCurrentNonce,
  resetNonce,
};