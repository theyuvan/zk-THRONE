// ============================================================================
// MULTIPLAYER HOOK - Manage Room State and Backend Connection
// ============================================================================

import { useState, useEffect, useCallback } from "react";
import { multiplayerService, RoomState } from "@/services/multiplayerService";
import { walletService } from "@/services/walletService";

export function useMultiplayer() {
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  /**
   * Create a new room (becomes host)
   */
  const createRoom = useCallback(async (maxPlayers: number = 4, totalRounds: number = 7) => {
    try {
      const wallet = walletService.getPublicKey();
      if (!wallet) throw new Error("Wallet not connected");

      console.log("🎮 Creating room...");
      const result = await multiplayerService.createRoom(wallet, maxPlayers, totalRounds);
      
      console.log("✅ Room created:", result.joinCode);
      
      // Immediately fetch the room state
      const roomState = await multiplayerService.getRoomState(result.roomId);
      setCurrentRoom(roomState);
      setIsInRoom(true);
      setIsHost(true);

      return {
        success: true,
        roomId: result.roomId,
        joinCode: result.joinCode,
      };
    } catch (error: any) {
      console.error("❌ Failed to create room:", error);
      throw error;
    }
  }, []);

  /**
   * Join an existing room
   */
  const joinRoom = useCallback(async (roomId: string) => {
    try {
      const wallet = walletService.getPublicKey();
      if (!wallet) throw new Error("Wallet not connected");

      console.log("🎮 Joining room:", roomId);
      const result = await multiplayerService.joinRoom(roomId, wallet);
      
      console.log("✅ Joined room");
      
      setCurrentRoom(result.roomState);
      setIsInRoom(true);
      setIsHost(false);

      return { success: true };
    } catch (error: any) {
      console.error("❌ Failed to join room:", error);
      throw error;
    }
  }, []);

  /**
   * Host starts the game (15 second countdown)
   */
  const startGame = useCallback(async () => {
    if (!currentRoom || !isHost) {
      throw new Error("Only host can start the game");
    }

    try {
      const wallet = walletService.getPublicKey();
      if (!wallet) throw new Error("Wallet not connected");

      console.log("🚀 Starting game...");
      const result = await multiplayerService.startGame(currentRoom.roomId, wallet);
      
      console.log("✅ Game starting in 15 seconds!");
      setCountdown(15);

      return { success: true };
    } catch (error: any) {
      console.error("❌ Failed to start game:", error);
      throw error;
    }
  }, [currentRoom, isHost]);

  /**
   * Submit solution for current round
   * 1. Backend verifies ZK proof
   * 2. Backend returns attestation  
   * 3. Submit attestation to contract on-chain
   */
  const submitSolution = useCallback(async (solution: string) => {
    if (!currentRoom) throw new Error("Not in a room");

    try {
      const wallet = walletService.getPublicKey();
      if (!wallet) throw new Error("Wallet not connected");

      console.log("📝 Submitting solution to backend...");
      
      // STEP 1: Submit to backend - generates ZK proof & verifies
      const result = await multiplayerService.submitRoundProof(
        currentRoom.roomId,
        wallet,
        solution
      );

      console.log("✅ Backend verified proof! Attestation:", result.attestation);

      // STEP 2: Submit attestation to contract on-chain
      // Import throneContractService
      const { throneContractService } = await import("@/services/throneContractService");
      
      console.log("🔗 Submitting to contract...");
      const contractResult = await throneContractService.submitProof(result.attestation);

      if (contractResult.success) {
        console.log("✅ Proof submitted on-chain! TxHash:", contractResult.txHash);
      }

      return {
        success: true,
        roundComplete: result.roundComplete,
        txHash: contractResult.txHash,
      };
    } catch (error: any) {
      console.error("❌ Failed to submit solution:", error);
      throw error;
    }
  }, [currentRoom]);

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    setCurrentRoom(null);
    setIsInRoom(false);
    setIsHost(false);
    setCountdown(null);
  }, []);

  /**
   * Get final results (only when game finished)
   * This reveals the leaderboard with all scores!
   */
  const getFinalResults = useCallback(async () => {
    if (!currentRoom) throw new Error("Not in a room");

    try {
      console.log("🏆 Fetching final results...");
      const results = await multiplayerService.getFinalResults(currentRoom.roomId);
      console.log("✅ Leaderboard revealed:", results);
      return results;
    } catch (error: any) {
      console.error("❌ Failed to get results:", error);
      throw error;
    }
  }, [currentRoom]);

  /**
   * Poll room state for updates (every 2 seconds)
   */
  useEffect(() => {
    if (!currentRoom) return;

    console.log("📡 Starting room state polling...");
    
    const stopPolling = multiplayerService.startPolling(
      currentRoom.roomId,
      (newState) => {
        setCurrentRoom(newState);

        // Handle game start countdown
        if (newState.status === "starting" && newState.startTime) {
          const remaining = Math.max(
            0,
            Math.ceil((newState.startTime - Date.now()) / 1000)
          );
          setCountdown(remaining);

          if (remaining === 0) {
            console.log("🎮 Game is starting NOW!");
          }
        }

        // Clear countdown when game starts
        if (newState.status === "in_progress") {
          setCountdown(null);
        }
      },
      2000 // Poll every 2 seconds
    );

    return () => {
      console.log("📡 Stopped room state polling");
      stopPolling();
    };
  }, [currentRoom?.roomId]);

  /**
   * Countdown timer effect
   */
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  return {
    // State
    currentRoom,
    isInRoom,
    isHost,
    countdown,

    // Actions
    createRoom,
    joinRoom,
    startGame,
    submitSolution,
    leaveRoom,
    getFinalResults, // Get leaderboard when game ends
  };
}
