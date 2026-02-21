// ============================================================================
// MULTIPLAYER SERVICE - Connect to Backend Room System
// ============================================================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3030";

export interface RoomState {
  roomId: string;
  joinCode: string;
  hostWallet: string;
  players: string[]; // Wallet addresses
  maxPlayers: number;
  totalRounds: number;
  currentRound: number;
  status: "waiting" | "starting" | "in_progress" | "finished";
  startTime?: number;
  roundScores?: Record<string, number>; // Only shown at end (ZK privacy!)
}

export interface CreateRoomResponse {
  success: boolean;
  roomId: string;
  joinCode: string;
  message: string;
}

export interface JoinRoomResponse {
  success: boolean;
  playerIndex: number;
  roomState: RoomState;
}

class MultiplayerService {
  /**
   * Create a new game room
   */
  async createRoom(
    hostWallet: string,
    maxPlayers: number = 4,
    totalRounds: number = 7
  ): Promise<CreateRoomResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/room/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostWallet, maxPlayers, totalRounds }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("❌ Create room failed:", error);
      throw error;
    }
  }

  /**
   * Join an existing room by room ID or join code
   */
  async joinRoom(
    roomId: string,
    playerWallet: string
  ): Promise<JoinRoomResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/room/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerWallet }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join room");
      }

      return await response.json();
    } catch (error: any) {
      console.error("❌ Join room failed:", error);
      throw error;
    }
  }

  /**
   * Get current room state (NO SCORES - ZK privacy!)
   */
  async getRoomState(roomId: string): Promise<RoomState> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/room/${roomId}/state`);

      if (!response.ok) {
        throw new Error(`Room not found: ${roomId}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("❌ Get room state failed:", error);
      throw error;
    }
  }

  /**
   * Start the game (host only) - triggers 15 second countdown
   */
  async startGame(roomId: string, hostWallet: string): Promise<{
    success: boolean;
    countdown: number;
    message: string;
  }> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/room/${roomId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostWallet }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start game");
      }

      return await response.json();
    } catch (error: any) {
      console.error("❌ Start game failed:", error);
      throw error;
    }
  }

  /**
   * Submit proof for current round
   * Backend tracks scores internally (hidden for ZK privacy)
   * Returns attestation for on-chain submission!
   */
  async submitRoundProof(
    roomId: string,
    playerWallet: string,
    solution: string
  ): Promise<{
    success: boolean;
    message: string;
    roundComplete: boolean;
    attestation: {
      signature: string;
      solutionHash: string;
      nonce: number;
      roundId: number;
      player: string;
    };
  }> {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/room/${roomId}/submit-proof`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerWallet, solution }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit proof");
      }

      const data = await response.json();
      console.log("✅ ZK Proof verified! Score updated (hidden)");
      return data;
    } catch (error: any) {
      console.error("❌ Submit round proof failed:", error);
      throw error;
    }
  }

  /**
   * Get final leaderboard (only available after game ends)
   * THIS IS WHEN SCORES ARE REVEALED! (ZK privacy maintained until end)
   */
  async getFinalResults(roomId: string): Promise<FinalResults> {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/room/${roomId}/results`
      );

      if (!response.ok) {
        throw new Error("Game not finished yet - scores are hidden!");
      }

      const data = await response.json();
      console.log("🏆 Final results revealed:", data);
      return data;
    } catch (error: any) {
      console.error("❌ Get results failed:", error);
      throw error;
    }
  }

  /**
   * List all public waiting rooms
   */
  async listRooms(): Promise<{
    success: boolean;
    rooms: Array<{
      roomId: string;
      joinCode: string;
      hostWallet: string;
      playerCount: number;
      maxPlayers: number;
      totalRounds: number;
      status: string;
    }>;
  }> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/room/list`);

      if (!response.ok) {
        throw new Error("Failed to fetch room list");
      }

      return await response.json();
    } catch (error: any) {
      console.error("❌ List rooms failed:", error);
      throw error;
    }
  }

  /**
   * Poll room state for updates (call this every 2-3 seconds in UI)
   */
  startPolling(
    roomId: string,
    onUpdate: (state: RoomState) => void,
    intervalMs: number = 2000
  ): () => void {
    const pollInterval = setInterval(async () => {
      try {
        const state = await this.getRoomState(roomId);
        onUpdate(state);
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(pollInterval);
  }
}

export const multiplayerService = new MultiplayerService();
