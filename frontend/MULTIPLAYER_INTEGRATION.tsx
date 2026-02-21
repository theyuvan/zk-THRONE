// ============================================================================
// MULTIPLAYER INTEGRATION GUIDE
// ============================================================================
// How to wire the multiplayer system into your 3D frontend
// ============================================================================

/**
 * STEP 1: Add this to your main App.tsx or game component
 */

import { useMultiplayer } from "@/hooks/useMultiplayer";
import { multiplayerService } from "@/services/multiplayerService";

export function GameComponent() {
  const {
    currentRoom,
    isInRoom,
    isHost,
    countdown,
    createRoom,
    joinRoom,
    startGame,
    submitSolution,
    leaveRoom,
  } = useMultiplayer();

  // ========================================================================
  // EXAMPLE 1: Host Creates Room
  // ========================================================================
  
  const handleCreateRoom = async () => {
    try {
      const result = await createRoom(4, 7); // 4 players, 7 rounds
      console.log("Room Code:", result.joinCode);
      // Show join code to user in UI
      alert(`Share this code: ${result.joinCode}`);
    } catch (error) {
      console.error("Failed to create room:", error);
    }
  };

  // ========================================================================
  // EXAMPLE 2: Player Joins Room
  // ========================================================================
  
  const handleJoinRoom = async (roomCode: string) => {
    try {
      await joinRoom(roomCode);
      console.log("Joined room successfully!");
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Room not found or full");
    }
  };

  // ========================================================================
  // EXAMPLE 3: Host Starts Game (15 second countdown)
  // ========================================================================
  
  const handleStartGame = async () => {
    if (!isHost) {
      alert("Only host can start the game!");
      return;
    }

    try {
      await startGame();
      // Countdown state is automatically managed
      // countdown will be 15, 14, 13... 3, 2, 1, null
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  // ========================================================================
  // EXAMPLE 4: Submit Solution During Round
  // ========================================================================
  
  const handleSubmitSolution = async (solution: string) => {
    try {
      const result = await submitSolution(solution);
      console.log("Solution submitted:", result.txHash);
      
      // Score is tracked on backend (hidden for ZK privacy!)
      // You DON'T see other players' scores until the end
      
    } catch (error) {
      console.error("Failed to submit solution:", error);
    }
  };

  // ========================================================================
  // EXAMPLE 5: Render Countdown UI
  // ========================================================================
  
  return (
    <div>
      {/* Countdown Display (when game is starting) */}
      {countdown !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center">
            <h1 className="text-8xl font-bold text-cyan-400 mb-4">
              {countdown}
            </h1>
            <p className="text-2xl text-white">
              {countdown > 0 ? "Game Starting..." : "GO!"}
            </p>
          </div>
        </div>
      )}

      {/* Room Info Display */}
      {isInRoom && currentRoom && (
        <div className="fixed top-4 right-4 bg-black/80 p-4 rounded-lg border border-cyan-400">
          <p className="text-sm text-white">
            Room: {currentRoom.joinCode}
          </p>
          <p className="text-sm text-white">
            Players: {currentRoom.players.length}/{currentRoom.maxPlayers}
          </p>
          <p className="text-sm text-white">
            Round: {currentRoom.currentRound}/{currentRoom.totalRounds}
          </p>
          <p className="text-sm text-white">
            Status: {currentRoom.status}
          </p>
          
          {/* Host Controls */}
          {isHost && currentRoom.status === "waiting" && (
            <button
              onClick={handleStartGame}
              className="mt-2 w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded"
              disabled={currentRoom.players.length < 2}
            >
              Start Game
            </button>
          )}
        </div>
      )}

      {/* Leave Room Button */}
      {isInRoom && (
        <button
          onClick={leaveRoom}
          className="fixed bottom-4 right-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
        >
          Leave Room
        </button>
      )}
    </div>
  );
}

/**
 * STEP 2: Wire into your existing RoomLobby component
 */

// In RoomLobby.tsx, replace the mock data fetch with:

const handleRefresh = async () => {
  setIsRefreshing(true);
  try {
    // TODO: Need backend endpoint to list all public rooms
    // For now, users can join by entering room code
  } catch (error) {
    console.error("Failed to refresh rooms:", error);
  } finally {
    setIsRefreshing(false);
  }
};

/**
 * STEP 3: Backend is already set up!
 */

// Your backend at http://localhost:3030 already has:
//
// POST /api/room/create        - Create new room
// POST /api/room/join          - Join existing room  
// GET  /api/room/:id/state     - Get room state (NO SCORES - ZK!)
// POST /api/room/:id/start     - Start game (15 sec countdown)
// POST /api/room/:id/submit-proof - Submit solution for round
// GET  /api/room/:id/leaderboard - Final scores (only after game ends)

/**
 * STEP 4: ZK Privacy Flow
 */

/*
  ┌─────────────────────────────────────────────────────────────┐
  │  DURING GAME (Hidden Scores - ZK Privacy!)                  │
  ├─────────────────────────────────────────────────────────────┤
  │                                                               │
  │  Frontend                      Backend                       │
  │  ─────────                     ───────                       │
  │                                                               │
  │  User submits solution  ──►   Verify ZK proof                │
  │                               Sign attestation               │
  │                               Track score INTERNALLY         │
  │  ◄─── Return success          (other players can't see)     │
  │                                                               │
  │  Show: "✅ Submitted!"                                       │
  │  DON'T show: actual score                                    │
  │                                                               │
  └─────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────┐
  │  AFTER ALL ROUNDS (Reveal Leaderboard)                      │
  ├─────────────────────────────────────────────────────────────┤
  │                                                               │
  │  GET /api/room/:id/leaderboard                              │
  │                                                               │
  │  ◄─── Return final scores:                                  │
  │       1. Player A: 7/7 ⭐⭐⭐                                │
  │       2. Player B: 5/7 ⭐⭐                                  │
  │       3. Player C: 3/7 ⭐                                    │
  │                                                               │
  │  NOW show in 3D throne room with animations!                │
  │                                                               │
  └─────────────────────────────────────────────────────────────┘
*/

/**
 * STEP 5: Add to your existing 3D scenes
 */

// In your ThroneHall.tsx or TrialScene.tsx:

import { useMultiplayer } from "@/hooks/useMultiplayer";

export function ThroneHall() {
  const { countdown, currentRoom, isHost } = useMultiplayer();

  return (
    <>
      {/* Your existing 3D scene */}
      <Canvas>
        {/* ... */}
      </Canvas>

      {/* Overlay countdown on top of 3D scene */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-9xl font-bold text-cyan-400"
            style={{
              textShadow: "0 0 40px rgba(0,240,255,0.8)",
            }}
          >
            {countdown || "GO!"}
          </motion.div>
        </div>
      )}
    </>
  );
}

export default GameComponent;
