#![no_main]
#![no_std]

// ============================================================================
// RISC Zero Guest Program — Trial Verification
// ============================================================================
//
// This program runs inside the RISC Zero zkVM to verify trial solutions
// WITHOUT revealing the solution itself.
//
// Flow:
// 1. Host provides private solution
// 2. Guest computes hash(solution)
// 3. Guest verifies hash matches expected hash
// 4. Guest commits public hash to journal
// 5. Receipt proves solution was correct without revealing it

use risc0_zkvm::guest::env;
use sha2::{Digest, Sha256};

risc0_zkvm::guest::entry!(main);

/// Input structure from host
#[derive(serde::Deserialize)]
struct TrialInput {
    /// The trial ID (e.g., "colorSigil")
    trial_id: [u8; 32],
    
    /// Private solution data (will NOT be revealed)
    solution: Vec<u8>,
    
    /// Expected hash of correct solution (public)
    expected_hash: [u8; 32],
    
    /// Player's wallet address (public)
    player_address: [u8; 32],
    
    /// Round ID (public)
    round_id: u32,
}

/// Output structure committed to journal (public)
#[derive(serde::Serialize)]
struct TrialOutput {
    /// Hash of the solution (proves solution was used)
    solution_hash: [u8; 32],
    
    /// Trial ID
    trial_id: [u8; 32],
    
    /// Player address
    player_address: [u8; 32],
    
    /// Round ID
    round_id: u32,
    
    /// Verification result
    is_valid: bool,
}

pub fn main() {
    // Read input from host
    let input: TrialInput = env::read();
    
    // Compute SHA-256 hash of solution
    let mut hasher = Sha256::new();
    hasher.update(&input.solution);
    let solution_hash: [u8; 32] = hasher.finalize().into();
    
    // Verify hash matches expected hash
    let is_valid = solution_hash == input.expected_hash;
    
    // Create output (public journal data)
    let output = TrialOutput {
        solution_hash,
        trial_id: input.trial_id,
        player_address: input.player_address,
        round_id: input.round_id,
        is_valid,
    };
    
    // Commit output to journal (becomes public)
    env::commit(&output);
    
    // If verification fails, we still generate proof but mark is_valid = false
    // This prevents griefing attacks where invalid proofs cause reverts
}
