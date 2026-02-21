// Room API Routes - Multiplayer Endpoints
const express = require("express");
const router = express.Router();
const roomService = require("../services/roomService");
const crypto = require("crypto");
const { generateProof } = require("../services/proofService");
const verifyProof = require("../services/verifyService");
const { signAttestation } = require("../services/attestationService");
const { getNextNonce } = require("../services/nonceService");
const { validateTrialSolution } = require("../config/trials");

/**
 * GET /api/room/list
 * List all public waiting rooms
 */
router.get("/list", (req, res) => {
  try {
    const publicRooms = roomService.listPublicRooms();
    res.json({ success: true, rooms: publicRooms });
  } catch (error) {
    console.error("List rooms error:", error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * POST /api/room/create
 * Create a new game room
 */
router.post("/create", (req, res) => {
  try {
    const { hostWallet, maxPlayers = 4, totalRounds = 7 } = req.body;

    if (!hostWallet) {
      return res.status(400).json({ error: "hostWallet required" });
    }

    const { roomId, joinCode } = roomService.createRoom(
      hostWallet,
      maxPlayers,
      totalRounds
    );

    res.json({
      success: true,
      roomId,
      joinCode,
      message: `Room created! Share code: ${joinCode}`,
    });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/room/join
 * Join existing room
 */
router.post("/join", (req, res) => {
  try {
    const { roomId, playerWallet } = req.body;

    if (!roomId || !playerWallet) {
      return res.status(400).json({ error: "roomId and playerWallet required" });
    }

    const result = roomService.joinRoom(roomId, playerWallet);
    const roomState = roomService.getRoomState(roomId);

    res.json({
      success: true,
      ...result,
      roomState,
    });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/room/:roomId/state
 * Get current room state (WITHOUT hidden scores)
 */
router.get("/:roomId/state", (req, res) => {
  try {
    const { roomId } = req.params;
    const roomState = roomService.getRoomState(roomId);

    res.json(roomState);
  } catch (error) {
    console.error("Get room state error:", error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/room/:roomId/start
 * Host starts the game (15 second countdown)
 */
router.post("/:roomId/start", (req, res) => {
  try {
    const { roomId } = req.params;
    const { hostWallet } = req.body;

    if (!hostWallet) {
      return res.status(400).json({ error: "hostWallet required" });
    }

    const result = roomService.startGame(roomId, hostWallet);

    res.json({
      success: true,
      ...result,
      message: "Game starting in 15 seconds!",
    });
  } catch (error) {
    console.error("Start game error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/room/:roomId/submit-proof
 * Submit ZK proof for current round - REAL ZK VERIFICATION!
 */
router.post("/:roomId/submit-proof", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerWallet, solution, roundId } = req.body;

    if (!playerWallet || !solution || !roundId) {
      return res.status(400).json({ error: "Missing playerWallet, solution, or roundId" });
    }

    console.log(`\n📝 Room ${roomId}: ${playerWallet} submitting solution for round ${roundId}`);

    // Players can be on different rounds - independent progression!
    console.log(`🎯 Player's current round: ${roundId}`);

    // STEP 1: Validate solution is CORRECT for current round
    console.log(`🔍 Validating solution for round ${roundId}...`);
    const isCorrectAnswer = validateTrialSolution(roundId, solution);
    
    if (!isCorrectAnswer) {
      console.log("❌ WRONG ANSWER! Rejecting submission.\n");
      return res.status(400).json({
        success: false,
        error: `Incorrect solution for round ${roundId}`,
      });
    }
    
    console.log("✅ Solution is CORRECT!\n");

    // STEP 2: Compute solution hash
    const solutionHash = "0x" + crypto.createHash("sha256").update(solution).digest("hex");
    console.log("🔐 Solution hash:", solutionHash);

    // STEP 3: Generate ZK proof with bb.js (only for CORRECT answers!)
    console.log("🔧 Generating ZK proof...");
    const proofData = await generateProof(solution, solutionHash, playerWallet, roundId);

    // STEP 4: Verify proof locally with bb.js
    console.log("🔍 Verifying proof...");
    const isValid = await verifyProof(proofData);

    if (!isValid) {
      console.log("❌ Proof verification failed");
      return res.status(400).json({
        success: false,
        error: "Proof verification failed",
      });
    }

    console.log("✅ Proof verified!");

    // STEP 5: Update room score (HIDDEN from frontend during game!)
    const result = await roomService.submitProofForRound(
      roomId,
      playerWallet,
      roundId,  // Pass the player's round
      solution,
      solutionHash
    );

    // STEP 6: Get nonce and sign attestation (for on-chain submission)
    const nonce = getNextNonce(playerWallet);
    const signature = signAttestation(roundId, playerWallet, solutionHash, nonce);

    res.json({
      success: true,
      ...result,
      attestation: {
        signature,
        solutionHash,
        nonce,
        roundId: roundId,  // Return the player's round
        player: playerWallet,
      },
    });
  } catch (error) {
    console.error("Submit proof error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/room/:roomId/round-status
 * Check if current round is complete
 */
router.get("/:roomId/round-status", (req, res) => {
  try {
    const { roomId } = req.params;
    const status = roomService.getRoundStatus(roomId);

    res.json(status);
  } catch (error) {
    console.error("Get round status error:", error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/room/:roomId/results
 * Get final results (only when game finished)
 */
router.get("/:roomId/results", (req, res) => {
  try {
    const { roomId } = req.params;
    const results = roomService.getFinalResults(roomId);

    res.json(results);
  } catch (error) {
    console.error("Get results error:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /api/room/:roomId
 * Delete room (cleanup)
 */
router.delete("/:roomId", (req, res) => {
  try {
    const { roomId } = req.params;
    roomService.deleteRoom(roomId);

    res.json({ success: true, message: "Room deleted" });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
