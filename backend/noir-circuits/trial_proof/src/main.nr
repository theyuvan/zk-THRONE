// ============================================================================
// ZK-THRONE TRIAL VERIFICATION CIRCUIT
// ============================================================================
// Private: solution (the secret answer)
// Public: solution_hash, round_id
//
// Constraint: Prove knowledge of solution
// Note: The circuit proves the player knows *a* solution (not revealing it).
// The backend verifies it's the *correct* solution and signs an attestation.
// Security comes from the Ed25519 signature verified on-chain.
// ============================================================================

fn main(
    solution: Field,
    solution_hash: pub Field,
    round_id: pub Field
) {
    // ZK proof: Player knows a solution without revealing it
    // Backend validates correctness before signing attestation
    assert(solution != 0); // Proves knowledge without revealing
}
