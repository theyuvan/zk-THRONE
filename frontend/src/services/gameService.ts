// ============================================================================
// COMPLETE GAME SERVICE - Orchestrates ZK Backend + Contract
// ============================================================================

import { walletService } from "./walletService";
import { zkBackendService } from "./zkBackendService";
import { throneContractService, type Attestation } from "./throneContractService";

export interface SubmitSolutionResult {
  success: boolean;
  txHash?: string;
  progress?: number;
  error?: string;
}

class GameService {
  /**
   * COMPLETE FLOW: User → Backend → Contract
   * 
   * This is the main entry point for submitting a trial solution:
   * 
   * 1. User solves challenge and submits answer
   * 2. Frontend calls backend POST /submit-solution
   * 3. Backend generates ZK proof with Noir + bb.js
   * 4. Backend verifies proof locally
   * 5. Backend signs Ed25519 attestation
   * 6. Frontend receives attestation
   * 7. Frontend calls contract.submit_proof() via XBull
   * 8. Wallet signs transaction
   * 9. Contract verifies backend signature
   * 10. Contract updates progress
   * 11. Frontend updates UI
   */
  async submitSolution(
    solution: string,
    roundId: number
  ): Promise<SubmitSolutionResult> {
    try {
      // STEP 1: Check wallet connection
      const player = walletService.getPublicKey();
      if (!player) {
        return {
          success: false,
          error: "Wallet not connected. Please connect your XBull wallet first.",
        };
      }

      console.log("\n╔═══════════════════════════════════════════════╗");
      console.log("║     SUBMITTING SOLUTION TO ZK-THRONE          ║");
      console.log("╚═══════════════════════════════════════════════╝\n");
      console.log("👤 Wallet Address:", player);
      console.log("🎯 Round:", roundId);
      console.log("💡 Solution:", solution.substring(0, 20) + "...");

      // STEP 2: Submit to backend for ZK proof
      console.log("\n📡 STEP 1: Generate ZK Proof & Get Attestation");
      const backendResponse = await zkBackendService.submitSolution(
        solution,
        player,
        roundId
      );

      if (!backendResponse.success || !backendResponse.attestation) {
        return {
          success: false,
          error: backendResponse.error || "Failed to get attestation from backend",
        };
      }

      const attestation = backendResponse.attestation;
      console.log("✅ Backend attestation received");
      console.log("   • Signature:", attestation.signature.substring(0, 20) + "...");
      console.log("   • Solution Hash:", attestation.solutionHash.substring(0, 20) + "...");
      console.log("   • Nonce:", attestation.nonce);

      // STEP 3: Submit to Soroban contract
      console.log("\n🔗 STEP 2: Submit Proof to Contract");
      const contractResult = await throneContractService.submitProof(attestation);

      if (!contractResult.success) {
        return {
          success: false,
          error: contractResult.error || "Failed to submit to contract",
        };
      }

      console.log("✅ Proof submitted to contract!");
      console.log("   • Transaction:", contractResult.txHash);

      // STEP 4: Get updated progress
      console.log("\n📊 STEP 3: Check Updated Progress");
      const progress = await throneContractService.getProgress(player);
      console.log("   • Trials Completed:", progress, "/ 7");

      console.log("\n╔═══════════════════════════════════════════════╗");
      console.log("║            ✅ SUCCESS!                          ║");
      console.log("╚═══════════════════════════════════════════════╝\n");

      return {
        success: true,
        txHash: contractResult.txHash,
        progress,
      };
    } catch (error: any) {
      console.error("\n❌ Submission failed:", error);
      return {
        success: false,
        error: error.message || "Unknown error occurred",
      };
    }
  }

  /**
   * Get player's current progress
   */
  async getProgress(playerAddress?: string): Promise<number> {
    const player = playerAddress || walletService.getPublicKey();
    if (!player) return 0;

    return await throneContractService.getProgress(player);
  }

  /**
   * Get current king
   */
  async getKing(): Promise<string | null> {
    return await throneContractService.getKing();
  }

  /**
   * Get current round ID
   */
  async getRoundId(): Promise<number> {
    return await throneContractService.getRoundId();
  }

  /**
   * Check if player is the current king
   */
  async isKing(): Promise<boolean> {
    const player = walletService.getPublicKey();
    if (!player) return false;

    const king = await this.getKing();
    return king === player;
  }

  /**
   * Check backend health
   */
  async checkBackendHealth(): Promise<boolean> {
    return await zkBackendService.checkHealth();
  }
}

export const gameService = new GameService();
