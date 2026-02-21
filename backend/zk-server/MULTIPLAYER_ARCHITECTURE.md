# Multiplayer Room Architecture for ZK Throne

## Overview
Room-based multiplayer with **hidden leaderboard** (scores stored in backend only, not revealed to users - preserving ZK privacy)

## Core Components

### 1. Room State (Backend Only)
```javascript
{
  roomId: "uuid",
  hostWallet: "GABC...",
  maxPlayers: 4,
  players: [
    {
      wallet: "GABC...",
      displayName: "Player1",
      isReady: false,
      // HIDDEN from frontend - ZK privacy!
      currentScore: 0,
      completedRounds: []
    }
  ],
  state: "WAITING" | "COUNTDOWN" | "IN_PROGRESS" | "FINISHED",
  countdownStartTime: null,
  currentRound: 1,
  totalRounds: 7,
  // Hidden leaderboard - never sent to frontend until game ends
  hiddenLeaderboard: [
    { wallet: "...", score: 5, rank: 1 }
  ]
}
```

### 2. API Endpoints Needed

#### Room Management
- `POST /api/room/create` - Host creates room
  - Input: `{ hostWallet, maxPlayers, totalRounds }`
  - Output: `{ roomId, joinCode }`

- `POST /api/room/join` - Player joins room
  - Input: `{ roomId, playerWallet }`
  - Output: `{ success, roomState }`

- `GET /api/room/:roomId/state` - Get room state (WITHOUT scores)
  - Output: `{ players: [...], state, countdown, round }`

- `POST /api/room/:roomId/start` - Host starts game
  - Input: `{ hostWallet }` (verify is host)
  - Output: `{ countdownEndsAt }` (15 second countdown)

#### Gameplay
- `POST /api/room/:roomId/submit-proof` - Submit ZK proof for current round
  - Input: `{ playerWallet, solution, proof }`
  - Backend verifies proof, updates **hidden score**
  - Output: `{ success, roundComplete }` (NO score revealed!)

- `GET /api/room/:roomId/round-status` - Check if round is complete
  - Output: `{ allPlayersSubmitted, nextRoundStartsAt }`

- `GET /api/room/:roomId/final-results` - Game finished, reveal winner
  - Output: `{ winner: "GABC...", finalScores: [...] }`
  - **Only available when game state = FINISHED**

### 3. WebSocket Events (Real-time Updates)

```javascript
// Server → All room members
socket.on("player_joined", { playerWallet, playerCount });
socket.on("countdown_started", { startsInSeconds: 15 });
socket.on("game_started", { currentRound: 1 });
socket.on("round_complete", { nextRound: 2 });
socket.on("game_finished", { winner, finalScores });
```

### 4. Frontend Flow

```
┌─────────────┐
│ Create Room │ (Host)
└──────┬──────┘
       │ roomId = "abc123"
       │ Share code with friends
       ▼
┌─────────────┐
│ Join Room   │ (Other players)
└──────┬──────┘
       │ Enter code "abc123"
       ▼
┌─────────────────────┐
│ Waiting Room        │
│ • Player 1 (Host) ✓ │
│ • Player 2        ✓ │
│ • Player 3 (waiting)│
│ [Start Game] (Host) │
└──────┬──────────────┘
       │ Host clicks Start
       ▼
┌─────────────────────┐
│ Countdown: 15s      │
│ "Game starts in 10" │
└──────┬──────────────┘
       │ Countdown ends
       ▼
┌─────────────────────┐
│ Round 1/7           │
│ Enter solution:     │
│ [________]          │
│ [Submit ZK Proof]   │
│                     │
│ ✓ You submitted     │
│ ⏳ Waiting for      │
│    other players... │
└──────┬──────────────┘
       │ All submitted
       ▼
┌─────────────────────┐
│ Round Complete!     │
│ Starting Round 2... │
└──────┬──────────────┘
       │ Repeat for 7 rounds
       ▼
┌─────────────────────┐
│ Game Finished!      │
│ 👑 Winner: Player2  │
│                     │
│ Final Scores:       │
│ 1. Player2: 7/7     │
│ 2. Player1: 6/7     │
│ 3. Player3: 5/7     │
└─────────────────────┘
```

## Key Design Decisions

### ✅ Host = Wallet (Recommended)
- Host is the player's wallet address
- Host can start game, kick players
- Simpler permission model

### ❌ Room as Separate Entity
- Adds complexity
- Need separate auth for room management

### 🔐 ZK Privacy: Hidden Leaderboard
**CRITICAL:** Scores are **NEVER** sent to frontend until game ends
- During game: Players don't know who's winning
- Each player only knows: "I submitted" or "I'm waiting"
- After game: Reveal full leaderboard

This preserves **zero-knowledge property** - you prove you know the solution without revealing it, AND you don't know others' progress!

## Implementation Priority

1. **Phase 1:** Room creation + joining (polling-based, no WebSocket)
2. **Phase 2:** Game start countdown + round progression
3. **Phase 3:** Hidden score tracking + final reveal
4. **Phase 4:** WebSocket for real-time updates (optional)

## Files to Create

### Backend
- `backend/zk-server/services/roomService.js` - Room state management
- `backend/zk-server/routes/room.js` - Room API endpoints
- `backend/zk-server/middleware/roomAuth.js` - Verify host/player
- `backend/zk-server/websocket/roomEvents.js` - WebSocket handlers (Phase 4)

### Frontend
- `frontend/src/services/roomService.ts` - Room API client
- `frontend/src/pages/CreateRoom.tsx` - Room creation UI
- `frontend/src/pages/JoinRoom.tsx` - Join with code
- `frontend/src/pages/RoomLobby.tsx` - Waiting room
- `frontend/src/pages/MultiplayerGame.tsx` - In-game UI
- `frontend/src/pages/GameResults.tsx` - Final leaderboard

### Shared
- `backend/zk-server/storage/rooms.json` - Persistent room state (or use Redis)
