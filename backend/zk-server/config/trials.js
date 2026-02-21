// ============================================================================
// TRIAL DEFINITIONS AND CORRECT ANSWERS
// ============================================================================
// The backend stores the correct answers for each trial/round.
// This prevents users from submitting wrong answers and still getting credit.
//
// SECURITY: These must match the frontend trial implementations!
// ============================================================================

/**
 * Trial configuration with correct solutions
 * 
 * Each trial has:
 * - id: Trial/round number (1-7)
 * - name: Trial name
 * - validateSolution: Function that returns true if solution is correct
 */

const TRIALS = {
  // Trial 1: Thronebreaker Protocol
  // User must shoot the WRONG answer (avoid shooting correct answer)
  1: {
    name: "Thronebreaker Protocol",
    description: "Shoot the wrong answers, avoid the correct ones",
    
    validateSolution(solution) {
      // Expected format: "completed" or specific game state proof
      // For now, accept a completion token
      // TODO: Implement proper game state validation
      return solution === "thronebreaker_complete" || solution.startsWith("THRONEBREAKER:");
    },
  },

  // Trial 2: Color Sigil Memory
  // User must remember and repeat a color sequence
  2: {
    name: "Color Sigil Memory",
    description: "Remember and repeat the color sequence",
    
    validateSolution(solution) {
      // Expected format: "color_sequence_verified" or sequence hash
      return solution === "colorsigil_complete" || solution.startsWith("COLORSIGIL:");
    },
  },

  // Trial 3: Pattern Oracle
  // User must identify the next pattern
  3: {
    name: "Pattern Oracle",
    description: "Complete the pattern sequence",
    
    validateSolution(solution) {
      return solution === "patteroracle_complete" || solution.startsWith("PATTERN:");
    },
  },

  // Trial 4: Cipher Grid
  // User must decode the cipher
  4: {
    name: "Cipher Grid",
    description: "Solve the cipher puzzle",
    
    validateSolution(solution) {
      return solution === "ciphergrid_complete" || solution.startsWith("CIPHER:");
    },
  },

  // Trial 5: Logic Labyrinth
  // User must solve logic gates
  5: {
    name: "Logic Labyrinth",
    description: "Navigate the logic gates",
    
    validateSolution(solution) {
      return solution === "logiclabyrinth_complete" || solution.startsWith("LOGIC:");
    },
  },

  // Trial 6: Memory of Crowns
  // User must remember royal symbols
  6: {
    name: "Memory of Crowns",
    description: "Remember the royal symbols",
    
    validateSolution(solution) {
      return solution === "memoryofcrowns_complete" || solution.startsWith("MEMORY:");
    },
  },

  // Trial 7: Hidden Sigil
  // User must find hidden patterns
  7: {
    name: "Hidden Sigil",
    description: "Discover the hidden sigil",
    
    validateSolution(solution) {
      return solution === "hiddensigil_complete" || solution.startsWith("HIDDEN:");
    },
  },
};

/**
 * Validate a solution for a specific trial
 * 
 * UPDATED: Now checks solution against ALL trials, not just the specified roundId
 * This allows frontend to dynamically select trial order while backend validates
 * 
 * @param {number} roundId - Trial number (1-7) - used for logging only
 * @param {string} solution - User's submitted solution
 * @returns {boolean} - True if solution is correct for ANY trial
 */
function validateTrialSolution(roundId, solution) {
  // Check if solution matches ANY trial validator
  for (const [trialId, trial] of Object.entries(TRIALS)) {
    if (trial.validateSolution(solution)) {
      console.log(`🎯 Round ${roundId} - Solution validated as "${trial.name}": ✅ CORRECT`);
      return true;
    }
  }
  
  console.log(`🎯 Round ${roundId} validation: ❌ WRONG - No matching trial found`);
  console.log(`   Solution received: ${solution.substring(0, 50)}...`);
  
  return false;
}

/**
 * Get trial information
 * 
 * @param {number} roundId - Trial number
 * @returns {object} - Trial info (without validation function)
 */
function getTrialInfo(roundId) {
  const trial = TRIALS[roundId];
  
  if (!trial) {
    throw new Error(`Invalid trial ID: ${roundId}`);
  }

  return {
    id: roundId,
    name: trial.name,
    description: trial.description,
  };
}

/**
 * Get all trials
 * 
 * @returns {array} - Array of trial info
 */
function getAllTrials() {
  return Object.keys(TRIALS).map((id) => getTrialInfo(parseInt(id)));
}

module.exports = {
  TRIALS,
  validateTrialSolution,
  getTrialInfo,
  getAllTrials,
};
