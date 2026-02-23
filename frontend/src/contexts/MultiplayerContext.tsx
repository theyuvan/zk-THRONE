// ============================================================================
// MULTIPLAYER CONTEXT - Shared Room State Across All Components
// ============================================================================
// This solves the critical bug where multiple useMultiplayer() instances
// created isolated state, causing question synchronization failures.
// All components now share a single source of truth for multiplayer state.
// ============================================================================

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { multiplayerService, RoomState } from "@/services/multiplayerService";
import { walletService } from "@/services/walletService";
import { throneContractService } from "@/services/throneContractService";

// ============================================================================
// Context Type Definition
// ============================================================================

interface MultiplayerContextType {
  // State
  currentRoom: RoomState | null;
  isInRoom: boolean;
  isHost: boolean;
  countdown: number | null;

  // Actions
  createRoom: (maxPlayers?: number, totalRounds?: number) => Promise<{
    success: boolean;
    roomId: string;
    joinCode: string;
  }>;
  joinRoom: (roomId: string) => Promise<{ success: boolean; roomState: RoomState }>;
  startGame: () => Promise<{ success: boolean }>;
  submitSolution: (solution: string, roundId: number, roomId?: string) => Promise<{
    success: boolean;
    playerFinished: boolean;
    gameFinished: boolean;
    txHash?: string;
  }>;
  leaveRoom: () => void;
  getFinalResults: (roomId?: string) => Promise<any>;
  getRoomState: (roomId: string) => Promise<RoomState>;
}

const MultiplayerContext = createContext<MultiplayerContextType | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  // CRITICAL: Persist room state in sessionStorage to survive component unmounts/remounts
  // Use sessionStorage (not localStorage) so it clears when browser tab closes
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(() => {
    try {
      const saved = sessionStorage.getItem('multiplayer-room');
      if (saved) {
        const room = JSON.parse(saved);
        console.log('🔄 [Context] Restored room from sessionStorage:', room.roomId);
        return room;
      }
    } catch (e) {
      console.warn('⚠️  [Context] Failed to restore room from sessionStorage:', e);
    }
    return null;
  });
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

      console.log("🎮 [Context] Creating room...");
      console.log("ℹ️  NOTE: Contract progress is cumulative across all games for this wallet");
      const result = await multiplayerService.createRoom(wallet, maxPlayers, totalRounds);
      
      console.log("✅ [Context] Room created:", result.joinCode);
      
      // Immediately fetch the room state
      const roomState = await multiplayerService.getRoomState(result.roomId);
      console.log('📊 [Context] Room state after creation:', roomState);
      console.log('🎲 [Context] Question variants:', roomState.questionVariants);
      setCurrentRoom(roomState);
      sessionStorage.setItem('multiplayer-room', JSON.stringify(roomState)); // Persist
      console.log('💾 [Context] Saved room to sessionStorage');
      setIsInRoom(true);
      setIsHost(true);

      return {
        success: true,
        roomId: result.roomId,
        joinCode: result.joinCode,
      };
    } catch (error: any) {
      console.error("❌ [Context] Failed to create room:", error);
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

      console.log("🎮 [Context] Joining room:", roomId);
      const result = await multiplayerService.joinRoom(roomId, wallet);
      
      console.log("✅ [Context] Joined room");
      
      setCurrentRoom(result.roomState);
      sessionStorage.setItem('multiplayer-room', JSON.stringify(result.roomState)); // Persist
      console.log('💾 [Context] Saved room to sessionStorage');
      setIsInRoom(true);
      setIsHost(false);

      return { success: true, roomState: result.roomState };
    } catch (error: any) {
      console.error("❌ [Context] Failed to join room:", error);
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

      console.log("🚀 [Context] Starting game...");
      const result = await multiplayerService.startGame(currentRoom.roomId, wallet);
      
      console.log("✅ [Context] Game starting in 15 seconds!");
      setCountdown(15);

      return { success: true };
    } catch (error: any) {
      console.error("❌ [Context] Failed to start game:", error);
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

      // CRITICAL: Call start_multiplayer_session on FIRST trial submission (host only)
      // This delays wallet popup until player actually plays, not at game start
      if (isHost && !sessionStartedRef.current && currentRoom) {
        sessionStartedRef.current = currentRoom.roomId; // Mark immediately to prevent duplicates
        
        console.log("🎮 [Context] HOST: Starting multiplayer session on-chain (first trial submission)...");
        
        // Only proceed with contract call for 2-player games (Game Hub limitation)
        if (currentRoom.players.length === 2) {
          const player1 = currentRoom.players[0].wallet;
          const player2 = currentRoom.players[1].wallet;
          const sessionId = parseInt(currentRoom.roomId.slice(0, 8), 16);
          
          console.log("📊 [Context] Session params:", { sessionId, player1, player2 });
          
          // Fire and forget - don't block trial submission
          throneContractService.startMultiplayerSession(sessionId, player1, player2)
            .then(result => {
              if (result.success) {
                console.log("✅ [Context] Multiplayer session started on-chain!");
                console.log("🏆 [Context] Game Hub notified via start_game()");
                console.log(`🔗 [Context] TX: ${result.txHash}`);
              } else {
                console.error("❌ [Context] Failed to start session:", result.error);
              }
            })
            .catch(error => {
              console.error("❌ [Context] Error starting session:", error);
            });
        } else {
          console.log("ℹ️  [Context] 3-4 player game: Skipping Game Hub integration (only supports 2 players)");
        }
      }

      console.log(`📝 [Context] Submitting solution for round ${roundId} to backend...`);
      
      // STEP 1: Submit to backend - generates ZK proof & verifies
      const result = await multiplayerService.submitRoundProof(
        targetRoomId,
        wallet,
        solution,
        roundId  // Send player's current round
      );

      console.log("✅ [Context] Backend verified proof! Attestation:", result.attestation);
      console.log("📊 [Context] Player finished:", result.playerFinished);
      console.log("🏁 [Context] Game finished (race mode):", result.gameFinished);

      // STEP 2: Submit attestation to contract on-chain
      console.log("🔗 [Context] Submitting to contract...");
      const contractResult = await throneContractService.submitProof(result.attestation);

      if (!contractResult.success) {
        console.error("❌ [Context] Contract submission failed");
        throw new Error(contractResult.error || "Contract submission failed");
      }

      console.log("✅ [Context] Proof submitted on-chain! TxHash:", contractResult.txHash);

      return {
        success: true,
        playerFinished: result.playerFinished,
        gameFinished: result.gameFinished,
        txHash: contractResult.txHash,
      };
    } catch (error: any) {
      console.error("❌ [Context] Failed to submit solution:", error);
      throw error;
    }
  }, [currentRoom, isHost]);

  /**
   * Leave current room
   */
  const leaveRoom = useCallback(() => {
    setCurrentRoom(null);
    sessionStorage.removeItem('multiplayer-room'); // Clear persisted room
    console.log('🗑️  [Context] Cleared room from sessionStorage');
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
      console.log("🏆 [Context] Fetching final results...");
      const results = await multiplayerService.getFinalResults(targetRoomId);
      console.log("✅ [Context] Leaderboard revealed:", results);
      return results;
    } catch (error: any) {
      console.error("❌ [Context] Failed to get results:", error);
      throw error;
    }
  }, [currentRoom]);

  /**
   * Poll room state for updates (every 2 seconds)
   * CRITICAL: This stays active even when components unmount because it's at provider level
   */
  useEffect(() => {
    if (!currentRoom) return;

    console.log("📡 [Context] Starting room state polling...");
    
    const stopPolling = multiplayerService.startPolling(
      currentRoom.roomId,
      (newState) => {
        console.log('📡 [Context] Room state polled:', { 
          state: newState.state, 
          countdownEndsAt: newState.countdownEndsAt,
          questionVariants: newState.questionVariants,
          hasVariants: !!newState.questionVariants 
        });
        setCurrentRoom(newState);
        sessionStorage.setItem('multiplayer-room', JSON.stringify(newState)); // Persist updates continuously

        // Handle game start countdown
        if (newState.state === "COUNTDOWN" && newState.countdownEndsAt) {
          const remaining = Math.max(
            0,
            Math.ceil((newState.countdownEndsAt - Date.now()) / 1000)
          );
          console.log(`⏱️  [Context] Countdown: ${remaining} seconds remaining`);
          setCountdown(remaining);

          if (remaining === 0) {
            console.log("🎮 [Context] Game is starting NOW!");
          }
        }

        // Trigger game start when countdown finishes
        if (newState.state === "IN_PROGRESS") {
          console.log("🎮 [Context] Game state is IN_PROGRESS, game active!");
          setCountdown(0);
        }
      },
      2000 // Poll every 2 seconds
    );

    return () => {
      console.log("📡 [Context] Stopped room state polling");
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
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return prev; // Keep at 0 to trigger game start
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const value: MultiplayerContextType = {
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
    getFinalResults,
    getRoomState: multiplayerService.getRoomState.bind(multiplayerService),
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}

// ============================================================================
// Custom Hook to Access Context
// ============================================================================

export function useMultiplayer() {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider");
  }
  return context;
}
