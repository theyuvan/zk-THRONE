// ============================================================================
// GAME HOOK - Full ZK-Throne Integration
// ============================================================================

import { useState, useEffect } from "react";
import { gameService, type SubmitSolutionResult } from "../services/gameService";
import { useWallet } from "./useWallet";

export function useGame() {
  const { publicKey, isConnected } = useWallet();
  const [progress, setProgress] = useState<number>(0);
  const [king, setKing] = useState<string | null>(null);
  const [roundId, setRoundId] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);

  // Load game state when wallet connects
  useEffect(() => {
    if (isConnected && publicKey) {
      loadGameState();
    }
  }, [isConnected, publicKey]);

  // Check backend health on mount
  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkBackend = async () => {
    const healthy = await gameService.checkBackendHealth();
    setBackendHealthy(healthy);
  };

  const loadGameState = async () => {
    try {
      const [prog, currentKing, round] = await Promise.all([
        gameService.getProgress(),
        gameService.getKing(),
        gameService.getRoundId(),
      ]);

      setProgress(prog);
      setKing(currentKing);
      setRoundId(round);
    } catch (error) {
      console.error("Failed to load game state:", error);
    }
  };

  /**
   * Submit a solution (complete flow)
   */
  const submitSolution = async (
    solution: string
  ): Promise<SubmitSolutionResult> => {
    console.log("🎮 useGame.submitSolution called");
    console.log("  Solution:", solution);
    console.log("  RoundId:", roundId);
    console.log("  Wallet:", publicKey);
    
    setIsSubmitting(true);
    try {
      console.log("🚀 Calling gameService.submitSolution...");
      const result = await gameService.submitSolution(solution, roundId);
      console.log("📊 Game service result:", result);

      if (result.success) {
        // Update local state
        if (result.progress !== undefined) {
          setProgress(result.progress);
        }

        // Reload game state to check for king assignment
        await loadGameState();
      }

      return result;
    } catch (error) {
      console.error("💥 Error in useGame.submitSolution:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Refresh game state manually
   */
  const refresh = async () => {
    await loadGameState();
  };

  /**
   * Check if current player is king
   */
  const isKing = king === publicKey;

  return {
    // State
    progress,
    king,
    roundId,
    isKing,
    isSubmitting,
    backendHealthy,

    // Actions
    submitSolution,
    refresh,
  };
}
