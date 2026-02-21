// ============================================================================
// CONTRACT SERVICE - Query Soroban Contract State
// ============================================================================

const { Contract, SorobanRpc, Address, xdr } = require("@stellar/stellar-sdk");

const CONTRACT_ID = process.env.CONTRACT_ID || "CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI";
const RPC_URL = process.env.RPC_URL || "https://soroban-testnet.stellar.org";

const server = new SorobanRpc.Server(RPC_URL);
const contract = new Contract(CONTRACT_ID);

/**
 * Get current nonce for a player from the contract
 * @param {string} playerAddress - Stellar public key (G...)
 * @returns {Promise<number>} Current nonce
 */
async function getContractNonce(playerAddress) {
  try {
    const account = Address.fromString(playerAddress);
    
    // Build contract call
    const operation = contract.call(
      "get_nonce",
      account.toScVal()
    );

    // Simulate to get the result (read-only, no transaction)
    const simulateResponse = await server.simulateTransaction(
      operation
    );

    if (simulateResponse.error) {
      console.error("❌ Contract query error:", simulateResponse.error);
      return 0; // Default to 0 if query fails
    }

    // Parse the result
    const resultValue = simulateResponse.result?.retval;
    if (!resultValue) {
      return 0;
    }

    // Convert ScVal to number
    const nonce = Number(resultValue.u64?.toString() || "0");
    console.log(`📊 Contract nonce for ${playerAddress}: ${nonce}`);
    return nonce;
  } catch (error) {
    console.error(`❌ Failed to get contract nonce for ${playerAddress}:`, error.message);
    return 0; // Default to 0 on error
  }
}

module.exports = {
  getContractNonce,
};
