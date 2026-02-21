// ============================================================================
// Verifier Utilities for Soroban Integration
// ============================================================================

use serde::{Deserialize, Serialize};

/// Compact proof data for Soroban contract submission
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompactProof {
    /// Receipt bytes (compressed)
    pub receipt: Vec<u8>,
    
    /// Journal hash (for quick verification)
    pub journal_hash: [u8; 32],
    
    /// Image ID
    pub image_id: [u32; 8],
}

/// Parameters needed for on-chain verification
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationParams {
    /// RISC Zero image ID (identifies the guest program)
    pub image_id: [u32; 8],
    
    /// Expected journal structure version
    pub journal_version: u32,
}

/// Create compact proof for Soroban
pub fn create_compact_proof(
    receipt: &[u8],
    journal_hash: [u8; 32],
    image_id: [u32; 8],
) -> CompactProof {
    CompactProof {
        receipt: receipt.to_vec(),
        journal_hash,
        image_id,
    }
}

/// Extract verification parameters for contract deployment
pub fn get_verification_params() -> VerificationParams {
    use throne_methods::TRIAL_VERIFY_ID;
    
    VerificationParams {
        image_id: TRIAL_VERIFY_ID,
        journal_version: 1,
    }
}

/// Serialize proof for Soroban contract call
pub fn serialize_for_soroban(proof: &CompactProof) -> Vec<u8> {
    bincode::serialize(proof).expect("Serialization should not fail")
}
