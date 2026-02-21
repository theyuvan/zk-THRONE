// ============================================================================
// SUBMIT SOLUTION ROUTE
// ============================================================================

const express = require("express");
const crypto = require("crypto");
const { generateProof } = require("../services/proofService");
const verifyProof = require("../services/verifyService");
const { signAttestation } = require("../services/attestationService");
const { getNextNonce } = require("../services/nonceService");
const { validateTrialSolution } = require("../config/trials");

const router = express.Router();

/**
 * POST /submit-solution
 * 
 * Body:
 * {
 *   "solution": "secret_answer",
 *   "player": "GBXXXXXXXX...",
 *   "roundId": 1
 * }
 * 
 * Returns:
 * {
 *   "success": true,
 *   "attestation": {
 *     "signature": "base64...",
 *     "solutionHash": "0xabc...",
 *     "nonce": 123
 *   }
 * }
 */
router.post("/", async (req, res) => {
  try {
    const { solution, player, roundId } = req.body;

    // Validate inputs
    if (!solution || !player || !roundId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: solution, player, roundId",
      });
    }

    console.log(`\n📝 Solution submitted by ${player} for round ${roundId}`);

    // STEP 1: Validate solution is CORRECT for this trial
    console.log("🔍 Validating solution...");
    const isCorrectAnswer = validateTrialSolution(roundId, solution);
    
    if (!isCorrectAnswer) {
      console.log("❌ WRONG ANSWER! Rejecting submission.\n");
      return res.status(400).json({
        success: false,
        error: "Incorrect solution for this trial",
      });
    }
    
    console.log("✅ Solution is CORRECT!\n");

    // STEP 2: Compute solution hash
    const solutionHash = "0x" + crypto.createHash("sha256").update(solution).digest("hex");
    console.log("🔐 Solution hash:", solutionHash);

    // STEP 3: Generate ZK proof with bb.js (only for CORRECT answers!)
    console.log("🔧 Generating ZK proof...");
    const proofData = await generateProof(solution, solutionHash, player, roundId);

    // STEP 4: Verify proof locally with bb.js
    console.log("🔍 Verifying proof...");
    const isValid = await verifyProof(proofData);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "Proof verification failed",
      });
    }

    // STEP 5: Get nonce for replay protection
    const nonce = getNextNonce(player);
    console.log("🔢 Nonce:", nonce);

    // STEP 6: Sign attestation (backend approves CORRECT solution)
    console.log("✍️  Signing attestation...");
    const signature = signAttestation(roundId, player, solutionHash, nonce);

    // STEP 7: Return attestation
    const attestation = {
      signature,
      solutionHash,
      nonce,
      roundId,
      player,
    };

    console.log("✅ Attestation ready for on-chain submission\n");

    res.json({
      success: true,
      attestation,
    });
  } catch (error) {
    console.error("❌ Error processing solution:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
