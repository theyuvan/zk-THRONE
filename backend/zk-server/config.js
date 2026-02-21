// ============================================================================
// CONFIGURATION
// ============================================================================

require("dotenv").config();

module.exports = {
  // Server
  PORT: process.env.PORT || 3030,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Backend keypair (Stellar secret key)
  BACKEND_SECRET: process.env.BACKEND_SECRET,

  // Contract
  CONTRACT_ID: process.env.CONTRACT_ID,
  
  // Stellar network
  STELLAR_NETWORK: process.env.STELLAR_NETWORK || "testnet",
  STELLAR_RPC_URL:
    process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org:443",

  // Barretenberg CLI
  BB_PATH: process.env.BB_PATH || "bb", // Path to bb binary

  // Circuit paths
  CIRCUIT_DIR: process.env.CIRCUIT_DIR || "../noir-circuits/trial_proof",
};
