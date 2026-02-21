// Room Service - Multiplayer State Management
// Handles room creation, joining, and hidden leaderboard

const crypto = require("crypto");

// In-memory storage (replace with Redis or DB in production)
const rooms = new Map();

class RoomService {
  /**
   * Create a new game room
   */
  createRoom(hostWallet, maxPlayers = 4, totalRounds = 7) {
    const roomId = crypto.randomBytes(4).toString("hex").toUpperCase();
    const joinCode = roomId.slice(0, 6); // Short code for sharing

    const room = {
      roomId,
      joinCode,
      hostWallet,
      maxPlayers,
      totalRounds,
      players: [
        {
          wallet: hostWallet,
          displayName: `Player_${hostWallet.slice(0, 4)}`,
          isHost: true,
          isReady: true,
          joinedAt: Date.now(),
          // Hidden fields - never sent to frontend during game
          currentScore: 0,
          completedRounds: [],
        },
      ],
      state: "WAITING", // WAITING | COUNTDOWN | IN_PROGRESS | FINISHED
      countdownStartTime: null,
      currentRound: 0, // 0 = not started, 1-7 = active rounds
      createdAt: Date.now(),
      // Hidden leaderboard - only revealed when game ends
      hiddenLeaderboard: [],
    };

    rooms.set(roomId, room);
    console.log(`🎮 Room created: ${roomId} by ${hostWallet}`);
    return { roomId, joinCode };
  }

  /**
   * Join existing room
   */
  joinRoom(roomId, playerWallet) {
    const room = rooms.get(roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.state !== "WAITING") {
      throw new Error("Game already started");
    }

    if (room.players.length >= room.maxPlayers) {
      throw new Error("Room is full");
    }

    // Check if already joined
    const existing = room.players.find((p) => p.wallet === playerWallet);
    if (existing) {
      return { success: true, message: "Already in room" };
    }

    room.players.push({
      wallet: playerWallet,
      displayName: `Player_${playerWallet.slice(0, 4)}`,
      isHost: false,
      isReady: false,
      joinedAt: Date.now(),
      currentScore: 0,
      completedRounds: [],
    });

    console.log(`👤 ${playerWallet} joined room ${roomId}`);
    return { success: true, playerCount: room.players.length };
  }

  /**
   * Get room state (WITHOUT hidden scores)
   */
  getRoomState(roomId) {
    const room = rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Filter out hidden fields
    const publicPlayers = room.players.map((p) => ({
      wallet: p.wallet,
      displayName: p.displayName,
      isHost: p.isHost,
      isReady: p.isReady,
      // DO NOT send: currentScore, completedRounds
    }));

    return {
      roomId: room.roomId,
      joinCode: room.joinCode,
      hostWallet: room.hostWallet,
      maxPlayers: room.maxPlayers,
      totalRounds: room.totalRounds,
      players: publicPlayers,
      state: room.state,
      currentRound: room.currentRound,
      countdownEndsAt:
        room.countdownStartTime
          ? room.countdownStartTime + 15000
          : null,
    };
  }

  /**
   * List all public waiting rooms (for room browser)
   */
  listPublicRooms() {
    const allRooms = Array.from(rooms.values());
    
    // Only return rooms that are:
    // 1. In "WAITING" state (not started yet)
    // 2. Not full (playerCount < maxPlayers)
    const publicRooms = allRooms
      .filter(room => 
        room.state === "WAITING" && 
        room.players.length < room.maxPlayers
      )
      .map(room => ({
        roomId: room.roomId,
        joinCode: room.joinCode,
        hostWallet: room.hostWallet.slice(0, 8) + "...", // Truncate for privacy
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        totalRounds: room.totalRounds,
        createdAt: room.createdAt,
        status: "waiting",
      }));
    
    console.log(`📋 Listing ${publicRooms.length} public rooms`);
    return publicRooms;
  }

  /**
   * Host starts the game (15 second countdown)
   */
  startGame(roomId, requesterWallet) {
    const room = rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    // Verify requester is host
    if (room.hostWallet !== requesterWallet) {
      throw new Error("Only host can start game");
    }

    if (room.state !== "WAITING") {
      throw new Error("Game already started");
    }

    if (room.players.length < 2) {
      throw new Error("Need at least 2 players to start");
    }

    room.state = "COUNTDOWN";
    room.countdownStartTime = Date.now();

    // Auto-start game after 15 seconds
    setTimeout(() => {
      this._beginGame(roomId);
    }, 15000);

    console.log(`⏱️  Countdown started for room ${roomId}`);
    return {
      countdownEndsAt: room.countdownStartTime + 15000,
    };
  }

  /**
   * Internal: Begin the actual game
   */
  _beginGame(roomId) {
    const room = rooms.get(roomId);
    if (!room || room.state !== "COUNTDOWN") return;

    room.state = "IN_PROGRESS";
    room.currentRound = 1;
    console.log(`🎮 Game started for room ${roomId} - Round 1`);
  }

  /**
   * Submit ZK proof for current round
   * Proof is already verified by route - just update score!
   * Returns success but DOES NOT reveal score (ZK privacy!)
   */
  async submitProofForRound(roomId, playerWallet, solution, solutionHash) {
    const room = rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.state !== "IN_PROGRESS") {
      throw new Error("Game not in progress");
    }

    const player = room.players.find((p) => p.wallet === playerWallet);
    if (!player) {
      throw new Error("Player not in room");
    }

    // Check if already submitted for this round
    if (player.completedRounds.includes(room.currentRound)) {
      return { success: false, message: "Already submitted for this round" };
    }

    // Proof already verified in route - just update score!
    player.currentScore += 1;
    player.completedRounds.push(room.currentRound);
    player.lastSolutionHash = solutionHash; // Store for reference

    console.log(
      `✅ ${playerWallet} submitted valid proof for round ${room.currentRound}`
    );

    // Check if all players submitted
    const allSubmitted = room.players.every((p) =>
      p.completedRounds.includes(room.currentRound)
    );

    if (allSubmitted) {
      this._advanceRound(roomId);
    }

    return {
      success: true,
      roundComplete: allSubmitted,
      // DO NOT send: currentScore
    };
  }

  /**
   * Internal: Advance to next round or finish game
   */
  _advanceRound(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    if (room.currentRound >= room.totalRounds) {
      // Game finished
      this._finishGame(roomId);
    } else {
      // Next round
      room.currentRound += 1;
      console.log(`➡️  Room ${roomId} advancing to round ${room.currentRound}`);
    }
  }

  /**
   * Internal: Finish game and calculate leaderboard
   */
  _finishGame(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.state = "FINISHED";

    // Calculate final leaderboard
    room.hiddenLeaderboard = room.players
      .map((p) => ({
        wallet: p.wallet,
        displayName: p.displayName,
        score: p.currentScore,
        accuracy: (p.currentScore / room.totalRounds) * 100,
      }))
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({ ...p, rank: index + 1 }));

    console.log(`🏁 Game finished for room ${roomId}`);
    console.log("Final Leaderboard:", room.hiddenLeaderboard);
  }

  /**
   * Get final results (only available when game finished)
   */
  getFinalResults(roomId) {
    const room = rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    if (room.state !== "FINISHED") {
      throw new Error("Game not finished yet");
    }

    return {
      winner: room.hiddenLeaderboard[0],
      leaderboard: room.hiddenLeaderboard,
      totalRounds: room.totalRounds,
    };
  }

  /**
   * Check round status (all players submitted?)
   */
  getRoundStatus(roomId) {
    const room = rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }

    const allSubmitted = room.players.every((p) =>
      p.completedRounds.includes(room.currentRound)
    );

    const submittedCount = room.players.filter((p) =>
      p.completedRounds.includes(room.currentRound)
    ).length;

    return {
      currentRound: room.currentRound,
      totalPlayers: room.players.length,
      submittedCount,
      allSubmitted,
      // DO NOT reveal who submitted or scores
    };
  }

  /**
   * Delete room (admin/cleanup)
   */
  deleteRoom(roomId) {
    rooms.delete(roomId);
    console.log(`🗑️  Room ${roomId} deleted`);
  }
}

module.exports = new RoomService();
