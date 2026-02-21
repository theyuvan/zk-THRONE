// ============================================================================
// ZK Throne — RISC Zero Proof Generation Library
// ============================================================================

use anyhow::Result;
use risc0_zkvm::{default_prover, ExecutorEnv, Receipt};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub mod verifier;

// Import generated methods
use throne_methods::{TRIAL_VERIFY_ELF, TRIAL_VERIFY_ID};

// ============================================================================
// Data Structures
// ============================================================================

/// Input for trial proof generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrialInput {
    pub trial_id: String,
    pub solution: Vec<u8>,
    pub expected_hash: [u8; 32],
    pub player_address: String,
    pub round_id: u32,
}

/// Output from trial verification (extracted from journal)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrialOutput {
    pub solution_hash: [u8; 32],
    pub trial_id: [u8; 32],
    pub player_address: [u8; 32],
    pub round_id: u32,
    pub is_valid: bool,
}

/// Proof result returned to caller
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofResult {
    /// RISC Zero receipt (contains proof + journal)
    #[serde(with = "serde_bytes")]
    pub receipt: Vec<u8>,
    
    /// Journal data (public outputs)
    pub journal: TrialOutput,
    
    /// Image ID (method identifier)
    pub image_id: [u32; 8],
}

// ============================================================================
// Proof Generation
// ============================================================================

/// Generate a ZK proof for a trial solution
///
/// # Arguments
/// * `input` - Trial input with solution and expected hash
///
/// # Returns
/// * `ProofResult` - Contains receipt and journal data
pub fn generate_trial_proof(input: TrialInput) -> Result<ProofResult> {
    // Convert trial_id string to fixed-size array
    let mut trial_id_bytes = [0u8; 32];
    let trial_bytes = input.trial_id.as_bytes();
    let len = trial_bytes.len().min(32);
    trial_id_bytes[..len].copy_from_slice(&trial_bytes[..len]);
    
    // Convert player_address to fixed-size array
    let mut player_bytes = [0u8; 32];
    let addr_bytes = input.player_address.as_bytes();
    let len = addr_bytes.len().min(32);
    player_bytes[..len].copy_from_slice(&addr_bytes[..len]);
    
    // Prepare input for guest
    #[derive(Serialize)]
    struct GuestInput {
        trial_id: [u8; 32],
        solution: Vec<u8>,
        expected_hash: [u8; 32],
        player_address: [u8; 32],
        round_id: u32,
    }
    
    let guest_input = GuestInput {
        trial_id: trial_id_bytes,
        solution: input.solution.clone(),
        expected_hash: input.expected_hash,
        player_address: player_bytes,
        round_id: input.round_id,
    };
    
    // Create execution environment
    let env = ExecutorEnv::builder()
        .write(&guest_input)?
        .build()?;
    
    // Generate proof using default prover
    let prover = default_prover();
    let receipt = prover.prove(env, TRIAL_VERIFY_ELF)?;
    
    // Extract journal data
    let journal: TrialOutput = receipt.journal.decode()?;
    
    // Serialize receipt for storage/transmission
    let receipt_bytes = bincode::serialize(&receipt)?;
    
    Ok(ProofResult {
        receipt: receipt_bytes,
        journal,
        image_id: TRIAL_VERIFY_ID,
    })
}

/// Verify a proof receipt
///
/// # Arguments
/// * `receipt_bytes` - Serialized RISC Zero receipt
///
/// # Returns
/// * `TrialOutput` - Decoded journal data
pub fn verify_trial_proof(receipt_bytes: &[u8]) -> Result<TrialOutput> {
    // Deserialize receipt
    let receipt: Receipt = bincode::deserialize(receipt_bytes)?;
    
    // Verify the receipt
    receipt.verify(TRIAL_VERIFY_ID)?;
    
    // Extract journal
    let journal: TrialOutput = receipt.journal.decode()?;
    
    // Ensure proof shows validity
    if !journal.is_valid {
        anyhow::bail!("Proof shows invalid solution");
    }
    
    Ok(journal)
}

/// Utility: Compute hash of a solution
pub fn hash_solution(solution: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(solution);
    hasher.finalize().into()
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_proof_generation() {
        let solution = b"correct_answer_123";
        let expected_hash = hash_solution(solution);
        
        let input = TrialInput {
            trial_id: "colorSigil".to_string(),
            solution: solution.to_vec(),
            expected_hash,
            player_address: "GXXXXXXXXXXXXXX".to_string(),
            round_id: 1,
        };
        
        let result = generate_trial_proof(input).expect("Proof generation failed");
        
        // Verify the proof
        let journal = verify_trial_proof(&result.receipt).expect("Verification failed");
        
        assert!(journal.is_valid);
        assert_eq!(journal.solution_hash, expected_hash);
    }
    
    #[test]
    fn test_invalid_solution() {
        let correct_solution = b"correct_answer";
        let wrong_solution = b"wrong_answer";
        let expected_hash = hash_solution(correct_solution);
        
        let input = TrialInput {
            trial_id: "logicLabyrinth".to_string(),
            solution: wrong_solution.to_vec(),
            expected_hash,
            player_address: "GXXXXXXXXXXXXXX".to_string(),
            round_id: 1,
        };
        
        let result = generate_trial_proof(input).expect("Proof generation failed");
        let journal = verify_trial_proof(&result.receipt);
        
        // Should fail because solution is wrong
        assert!(journal.is_err() || !journal.unwrap().is_valid);
    }
}
