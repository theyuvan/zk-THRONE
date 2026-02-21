// Room Service - Multiplayer API Client (Frontend)

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3030";

export interface RoomState {
  roomId: string;
  joinCode: string;
  hostWallet: string;
  maxPlayers: number;
  totalRounds: number;
  players: Player[];
  state: "WAITING" | "COUNTDOWN" | "IN_PROGRESS" | "FINISHED";
  currentRound: number;
  countdownEndsAt: number | null;
}

export interface Player {
  wallet: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  // NOTE: Scores are hidden during game for ZK privacy!
}

export interface FinalResults {
  winner: {
    wallet: string;
    displayName: string;
    score: number;
    rank: number;
  };
  leaderboard: Array<{
    wallet: string;
    displayName: string;
    score: number;
    accuracy: number;
    rank: number;
  }>;
  totalRounds: number;
}

class RoomService {
  /**
   * Create a new multiplayer room
   */
  async createRoom(
    hostWallet: string,
    maxPlayers: number = 4,
    totalRounds: number = 7
  ): Promise<{ roomId: string; joinCode: string }> {
    const response = await fetch(`${BACKEND_URL}/api/room/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostWallet, maxPlayers, totalRounds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create room");
    }

    const data = await response.json();
    console.log("🎮 Room created:", data.joinCode);
    return {
      roomId: data.roomId,
      joinCode: data.joinCode,
    };
  }

  /**
   * Join existing room with code
   */
  async joinRoom(
    roomId: string,
    playerWallet: string
  ): Promise<RoomState> {
    const response = await fetch(`${BACKEND_URL}/api/room/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, playerWallet }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to join room");
    }

    const data = await response.json();
    console.log("👤 Joined room:", roomId);
    return data.roomState;
  }

  /**
   * Get current room state
   * Note: Scores are NOT included (ZK privacy)
   */
  async getRoomState(roomId: string): Promise<RoomState> {
    const response = await fetch(`${BACKEND_URL}/api/room/${roomId}/state`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get room state");
    }

    return await response.json();
  }

  /**
   * Host starts the game (15 second countdown)
   */
  async startGame(
    roomId: string,
    hostWallet: string
  ): Promise<{ countdownEndsAt: number }> {
    const response = await fetch(`${BACKEND_URL}/api/room/${roomId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostWallet }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to start game");
    }

    const data = await response.json();
    console.log("⏱️  Game starting in 15 seconds");
    return {
      countdownEndsAt: data.countdownEndsAt,
    };
  }

  /**
   * Submit ZK proof for current round
   * Returns success but DOES NOT reveal your score (ZK privacy!)
   */
  async submitProof(
    roomId: string,
    playerWallet: string,
    solution: string,
    proof: any
  ): Promise<{ success: boolean; roundComplete: boolean }> {
    const response = await fetch(
      `${BACKEND_URL}/api/room/${roomId}/submit-proof`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerWallet, solution, proof }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit proof");
    }

    const data = await response.json();
    console.log("✅ Proof submitted for round");
    return data;
  }

  /**
   * Check round status (waiting for other players?)
   */
  async getRoundStatus(roomId: string): Promise<{
    currentRound: number;
    totalPlayers: number;
    submittedCount: number;
    allSubmitted: boolean;
  }> {
    const response = await fetch(
      `${BACKEND_URL}/api/room/${roomId}/round-status`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get round status");
    }

    return await response.json();
  }

  /**
   * Get final results (only available when game finished)
   * This is when scores are REVEALED!
   */
  async getFinalResults(roomId: string): Promise<FinalResults> {
    const response = await fetch(`${BACKEND_URL}/api/room/${roomId}/results`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get results");
    }

    const data = await response.json();
    console.log("🏁 Final results:", data);
    return data;
  }

  /**
   * Poll room state every N seconds (for updates)
   */
  pollRoomState(
    roomId: string,
    intervalMs: number = 2000,
    callback: (state: RoomState) => void
  ): () => void {
    const poll = async () => {
      try {
        const state = await this.getRoomState(roomId);
        callback(state);
      } catch (error) {
        console.error("Poll error:", error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const interval = setInterval(poll, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }
}

export const roomService = new RoomService();
