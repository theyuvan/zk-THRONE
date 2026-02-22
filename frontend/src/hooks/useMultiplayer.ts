// ============================================================================
// MULTIPLAYER HOOK - Manage Room State and Backend Connection
// ============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { multiplayerService, RoomState } from "@/services/multiplayerService";
import { walletService } from "@/services/walletService";
import { throneContractService } from "@/services/throneContractService";

export function useMultiplayer() {
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Track if we've already called startMultiplayerSession for this game
  const sessionStartedRef = useRef<string | null>(null);

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

      return { success: true, roomState: result.roomState };
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
   * 
   * Players progress independently - no waiting!
   */
  const submitSolution = useCallback(async (solution: string, roundId: number, roomId?: string) => {
    const targetRoomId = roomId || currentRoom?.roomId;
    if (!targetRoomId) throw new Error("Not in a room - roomId required");

    try {
      const wallet = walletService.getPublicKey();
      if (!wallet) throw new Error("Wallet not connected");

      console.log(`📝 Submitting solution for round ${roundId} to backend...`);
      
      // STEP 1: Submit to backend - generates ZK proof & verifies
      const result = await multiplayerService.submitRoundProof(
        targetRoomId,
        wallet,
        solution,
        roundId  // Send player's current round
      );

      console.log("✅ Backend verified proof! Attestation:", result.attestation);
      console.log("📊 Player finished:", result.playerFinished);
      console.log("🏁 Game finished (race mode):", result.gameFinished);

      // STEP 2: Submit attestation to contract on-chain
      // Import throneContractService
      const { throneContractService } = await import("@/services/throneContractService");
      
      console.log("🔗 Submitting to contract...");
      const contractResult = await throneContractService.submitProof(result.attestation);

      if (!contractResult.success) {
        console.error("❌ Contract submission failed");
        throw new Error(contractResult.error || "Contract submission failed");
      }

      console.log("✅ Proof submitted on-chain! TxHash:", contractResult.txHash);

      return {
        success: true,
        playerFinished: result.playerFinished,
        gameFinished: result.gameFinished,
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
    sessionStartedRef.current = null; // Reset session tracker
  }, []);

  /**
   * Get final results (only when game finished)
   * This reveals the leaderboard with all scores!
   */
  const getFinalResults = useCallback(async (roomId?: string) => {
    const targetRoomId = roomId || currentRoom?.roomId;
    if (!targetRoomId) throw new Error("Not in a room - roomId required");

    try {
      console.log("🏆 Fetching final results...");
      const results = await multiplayerService.getFinalResults(targetRoomId);
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
        console.log('📡 Room state polled:', { state: newState.state, countdownEndsAt: newState.countdownEndsAt });
        setCurrentRoom(newState);

        // Handle game start countdown
        if (newState.state === "COUNTDOWN" && newState.countdownEndsAt) {
          const remaining = Math.max(
            0,
            Math.ceil((newState.countdownEndsAt - Date.now()) / 1000)
          );
          console.log(`⏱️  Countdown: ${remaining} seconds remaining`);
          setCountdown(remaining);

          if (remaining === 0) {
            console.log("🎮 Game is starting NOW!");
          }
        }

        // Trigger game start when countdown finishes
        if (newState.state === "IN_PROGRESS") {
          console.log("🎮 Game state is IN_PROGRESS, triggering start!");
          setCountdown(0);
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
   * Call contract's start_multiplayer_session when game begins
   * CRITICAL: This triggers Game Hub's start_game() for hackathon compliance
   * Only host calls this (contract requires player1.require_auth())
   */
  useEffect(() => {
    if (!currentRoom || !isHost) return;
    if (currentRoom.state !== "IN_PROGRESS") return;
    
    // Prevent duplicate calls for same room
    if (sessionStartedRef.current === currentRoom.roomId) {
      console.log("⏭️  Session already started for this room, skipping");
      return;
    }

    const initializeSession = async () => {
      try {
        console.log("🎮 HOST: Calling contract.start_multiplayer_session()...");
        
        // Get player addresses from room
        if (currentRoom.players.length < 2) {
          console.error("❌ Need at least 2 players for multiplayer session");
          return;
        }

        const player1 = currentRoom.players[0].wallet;
        const player2 = currentRoom.players[1].wallet;
        
        // Generate session ID from room ID (convert to number)
        const sessionId = parseInt(currentRoom.roomId.slice(0, 8), 16);
        
        console.log("📊 Session params:", { sessionId, player1, player2 });
        
        // Call contract - this will trigger Game Hub's start_game()
        const result = await throneContractService.startMultiplayerSession(
          sessionId,
          player1,
          player2
        );

        if (result.success) {
          console.log("✅ Multiplayer session started on-chain!");
          console.log("🏆 Game Hub notified via start_game()");
          console.log(`🔗 TX: ${result.txHash}`);
          
          // Mark as started to prevent duplicate calls
          sessionStartedRef.current = currentRoom.roomId;
        } else {
          console.error("❌ Failed to start session:", result.error);
        }
      } catch (error) {
        console.error("❌ Error starting multiplayer session:", error);
      }
    };

    // Add small delay to ensure wallet is ready
    const timer = setTimeout(initializeSession, 1000);
    return () => clearTimeout(timer);
  }, [currentRoom?.state, currentRoom?.roomId, currentRoom?.players, isHost]);

  /**
   * Countdown timer effect
   */
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return prev; // Keep at 0 to trigger game start
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
    getRoomState: multiplayerService.getRoomState.bind(multiplayerService), // Expose for polling
  };
}
