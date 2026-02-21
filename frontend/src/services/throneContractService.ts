// ============================================================================
// THRONE CONTRACT SERVICE
// ============================================================================

import * as StellarSdk from "@stellar/stellar-sdk";
import { walletService } from "./walletService";

const CONFIG = {
  contractId: import.meta.env.VITE_THRONE_CONTRACT_ID,
  networkPassphrase:
    import.meta.env.VITE_TESTNET_PASSPHRASE ||
    "Test SDF Network ; September 2015",
  rpcUrl:
    import.meta.env.VITE_TESTNET_RPC_URL ||
    "https://soroban-testnet.stellar.org",
};

interface Attestation {
  signature: string; // base64
  solutionHash: string; // hex
  nonce: number;
  roundId: number;
  player: string;
}

class ThroneContractService {
  private server: StellarSdk.SorobanRpc.Server;
  private contract: StellarSdk.Contract;

  constructor() {
    this.server = new StellarSdk.SorobanRpc.Server(CONFIG.rpcUrl);
    this.contract = new StellarSdk.Contract(CONFIG.contractId);
  }

  /**
   * Submit proof attestation to contract
   * This is the core function that connects backend → frontend → contract
   */
  async submitProof(attestation: Attestation): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      const publicKey = walletService.getPublicKey();
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      console.log("🔗 Submitting proof to contract...");
      console.log("📝 Attestation:", attestation);

      // STEP 1: Load source account
      const sourceAccount = await this.server.getAccount(publicKey);

      // STEP 2: Convert parameters to Soroban types
      const playerAddress = new StellarSdk.Address(attestation.player);

      // Convert hex solution hash to BytesN<32>
      const solutionHashBytes = Buffer.from(
        attestation.solutionHash.replace("0x", ""),
        "hex"
      );
      if (solutionHashBytes.length !== 32) {
        throw new Error("Solution hash must be 32 bytes");
      }

      // Convert base64 signature to BytesN<64>
      const signatureBytes = Buffer.from(attestation.signature, "base64");
      if (signatureBytes.length !== 64) {
        throw new Error("Signature must be 64 bytes (Ed25519)");
      }

      // STEP 3: Build contract call
      // Convert to fixed-length BytesN types using explicit maxLength
      const solutionHashScVal = StellarSdk.nativeToScVal(solutionHashBytes, {
        type: "bytes",
      });
      const signatureScVal = StellarSdk.nativeToScVal(signatureBytes, {
        type: "bytes",
      });
      
      console.log("📦 ScVal types:", {
        solutionHash: solutionHashScVal,
        signature: signatureScVal,
      });
      
      const operation = this.contract.call(
        "submit_proof",
        playerAddress.toScVal(),
        solutionHashScVal,
        signatureScVal,
        StellarSdk.nativeToScVal(attestation.nonce, { type: "u64" })
      );

      // STEP 4: Build transaction with higher fee for Soroban
      let transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: "10000000", // 1 XLM max fee for Soroban contracts
        networkPassphrase: CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(300)
        .build();

      // STEP 5: Simulate to get auth and prepare
      console.log("🔍 Simulating transaction...");
      const simulated = await this.server.simulateTransaction(transaction);

      console.log("📊 Simulation result:", {
        status: StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated) ? "SUCCESS" : "ERROR",
        cost: simulated.cost,
        restorePreamble: simulated.restorePreamble,
      });

      if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) {
        console.error("❌ Simulation error:", simulated);
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      if (simulated.result) {
        console.log("✅ Simulation successful, result:", simulated.result);
      }

      // STEP 6: Prepare transaction with auth
      transaction = StellarSdk.SorobanRpc.assembleTransaction(
        transaction,
        simulated
      ).build();

      // STEP 7: Sign with wallet
      console.log("✍️  Requesting wallet signature...");
      const signedXdr = await walletService.signTransaction(
        transaction.toXDR()
      );

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        CONFIG.networkPassphrase
      );

      // STEP 8: Submit to network
      console.log("📡 Broadcasting transaction...");
      const result = await this.server.sendTransaction(signedTx);

      // STEP 9: Wait for confirmation
      console.log("⏳ Waiting for confirmation...");
      const txHash = result.hash;
      console.log("📋 Transaction Hash:", txHash);
      console.log(`🔗 View on Stellar Expert: https://stellar.expert/explorer/testnet/tx/${txHash}`);
      
      // Poll for 5 seconds, then check progress as fallback
      // This handles cases where RPC polling fails but transaction succeeded
      let attempts = 0;
      const maxAttempts = 10; // 5 seconds total (10 attempts x 500ms)

      while (attempts < maxAttempts) {
        try {
          const txResponse = await this.server.getTransaction(txHash);
          
          // Check if transaction is successful
          if (txResponse.status === StellarSdk.SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
            console.log("✅ Proof submitted successfully!");
            console.log("🔗 Transaction hash:", txHash);
            return { success: true, txHash };
          }
          
          // Check if transaction failed
          if (txResponse.status === StellarSdk.SorobanRpc.Api.GetTransactionStatus.FAILED) {
            console.error("❌ Transaction failed:", txResponse);
            throw new Error(`Transaction failed`);
          }
          
          // Still pending, continue waiting
          if (attempts === 0 || attempts === 5) {
            console.log(`⏳ Checking transaction status... (${attempts + 1}/${maxAttempts})`);
          }
          
        } catch (error: any) {
          // Any error during polling (not found, network errors, etc) - just keep waiting
          // Only log the first attempt to avoid spam
          if (attempts === 0) {
            console.log(`⏳ Waiting for confirmation...`);
          }
        }

        // Fast polling - 500ms between attempts
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      // After 5 seconds, check progress as fallback
      // This is often more reliable than RPC polling
      console.log("🔍 Checking progress as confirmation...");
      try {
        const currentProgress = await this.getProgress(attestation.player);
        console.log(`📊 Current progress: ${currentProgress}`);
        
        // If progress is > 0, the transaction succeeded
        if (currentProgress > 0) {
          console.log("✅ Transaction confirmed (progress incremented)");
          console.log(`🔗 Verify at: https://stellar.expert/explorer/testnet/tx/${txHash}`);
          return { success: true, txHash };
        }
      } catch (progressError) {
        console.warn("Could not check progress:", progressError);
      }
      
      // Direct user to check Stellar Expert
      console.warn("⚠️ Could not confirm transaction status - check manually:");
      console.warn(`🔗 https://stellar.expert/explorer/testnet/tx/${txHash}`);
      throw new Error(`Transaction confirmation timeout after 2 minutes. Check status at https://stellar.expert/explorer/testnet/tx/${txHash}`);
    } catch (error: any) {
      console.error("❌ Submit proof failed:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Get player progress from contract
   */
  async getProgress(playerAddress: string): Promise<number> {
    try {
      const playerAddr = new StellarSdk.Address(playerAddress);

      const operation = this.contract.call(
        "get_progress",
        playerAddr.toScVal()
      );

      const account = await this.server.getAccount(playerAddress);

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(300)
        .build();

      const simulated = await this.server.simulateTransaction(transaction);

      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as number;
        }
      }

      return 0;
    } catch (error) {
      console.error("Failed to get progress:", error);
      return 0;
    }
  }

  /**
   * Get current king address from contract
   */
  async getKing(): Promise<string | null> {
    try {
      const operation = this.contract.call("get_king");

      // Use a temporary account for read-only call
      const tempKeypair = StellarSdk.Keypair.random();
      const account = new StellarSdk.Account(
        tempKeypair.publicKey(),
        "0"
      );

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(300)
        .build();

      const simulated = await this.server.simulateTransaction(transaction);

      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (!result) {
          return null;
        }
        
        // Contract returns Option<Address>
        // Check if it's Some variant (has an address) or None
        try {
          const address = StellarSdk.Address.fromScVal(result);
          return address.toString();
        } catch (e) {
          // If conversion fails, it's probably None (no king yet)
          console.log("No king assigned yet");
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error("Failed to get king:", error);
      return null;
    }
  }

  /**
   * Get current round ID
   */
  async getRoundId(): Promise<number> {
    try {
      const operation = this.contract.call("get_round_id");

      const tempKeypair = StellarSdk.Keypair.random();
      const account = new StellarSdk.Account(tempKeypair.publicKey(), "0");

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: CONFIG.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(300)
        .build();

      const simulated = await this.server.simulateTransaction(transaction);

      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as number;
        }
      }

      return 1;
    } catch (error) {
      console.error("Failed to get round ID:", error);
      return 1;
    }
  }
}

export const throneContractService = new ThroneContractService();
export type { Attestation };
