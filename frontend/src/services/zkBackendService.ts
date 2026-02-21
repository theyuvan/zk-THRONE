// ============================================================================
// ZK BACKEND SERVICE
// ============================================================================

const ZK_SERVER_URL =
  import.meta.env.VITE_ZK_SERVER_URL || "http://localhost:3030";

interface BackendResponse {
  success: boolean;
  attestation?: {
    signature: string;
    solutionHash: string;
    nonce: number;
    roundId: number;
    player: string;
  };
  error?: string;
}

class ZKBackendService {
  /**
   * Get backend public key (for display/verification)
   */
  async getPublicKey(): Promise<string> {
    try {
      const response = await fetch(`${ZK_SERVER_URL}/public-key`);

      if (!response.ok) {
        throw new Error("Failed to get public key");
      }

      const data = await response.json();
      return data.publicKey;
    } catch (error) {
      console.error("Failed to get backend public key:", error);
      throw error;
    }
  }

  /**
   * Submit solution to backend for ZK proof generation
   * 
   * Flow:
   * 1. User submits solution
   * 2. Backend generates ZK proof with bb.js
   * 3. Backend verifies proof
   * 4. Backend signs Ed25519 attestation
   * 5. Backend returns attestation for on-chain submission
   */
  async submitSolution(
    solution: string,
    player: string,
    roundId: number
  ): Promise<BackendResponse> {
    try {
      console.log("📤 Submitting solution to ZK backend...");
      console.log("   Backend URL:", ZK_SERVER_URL);
      console.log("   Wallet Address:", player);
      console.log("   RoundId:", roundId);

      const response = await fetch(`${ZK_SERVER_URL}/submit-solution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          solution,
          player,
          roundId,
        }),
      });
      
      console.log("📥 Backend response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BackendResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Backend proof generation failed");
      }

      console.log("✅ Attestation received from backend");
      return data;
    } catch (error: any) {
      console.error("❌ Backend submission failed:", error);
      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Check backend health status
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${ZK_SERVER_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const zkBackendService = new ZKBackendService();
