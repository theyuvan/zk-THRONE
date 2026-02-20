/**
 * MOCK ZK Verifier
 * 
 * This is a temporary implementation that bypasses real ZK proof verification.
 * Your friend will replace this with actual ZK verification logic later.
 * 
 * For now, this always returns true to allow game testing.
 */

export interface ZKProof {
  // Placeholder for proof structure
  // Will be defined by your friend's ZK implementation
  proof?: any;
  publicSignals?: any;
}

export interface TrialAnswer {
  trialId: string;
  answer: any;
  timestamp: number;
}

/**
 * Mock proof verification function
 * @param proof - The ZK proof object (currently unused)
 * @param publicSignals - Public signals for verification (currently unused)
 * @returns Promise<boolean> - Always returns true in mock mode
 */
export async function verifyProof(proof: any, publicSignals: any): Promise<boolean> {
  console.log('🔒 Mock verifyProof called');
  console.log('📝 Proof:', proof);
  console.log('📊 Public Signals:', publicSignals);

  // TEMPORARY: Always return true for testing
  // TODO: Your friend will replace this with real ZK verification
  
  // Simulate async verification delay
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('✅ Mock verification passed');
  return true;
}

/**
 * Generate mock proof for a trial answer
 * @param trialId - The trial identifier
 * @param answer - The player's answer
 * @returns ZKProof object
 */
export function generateMockProof(trialId: string, answer: any): ZKProof {
  console.log(`🔐 Generating mock proof for trial: ${trialId}`);
  
  return {
    proof: {
      // Mock proof data
      trialId,
      timestamp: Date.now(),
      mock: true,
    },
    publicSignals: {
      // Mock public signals
      isCorrect: true,
      trialCompleted: trialId,
    },
  };
}

/**
 * Batch verify multiple proofs
 * @param proofs - Array of proofs to verify
 * @returns Promise<boolean> - True if all proofs valid
 */
export async function batchVerifyProofs(proofs: ZKProof[]): Promise<boolean> {
  console.log(`🔒 Batch verifying ${proofs.length} proofs`);
  
  // In mock mode, verify each proof
  for (const proof of proofs) {
    const isValid = await verifyProof(proof.proof, proof.publicSignals);
    if (!isValid) {
      return false;
    }
  }
  
  console.log('✅ All proofs verified');
  return true;
}

/**
 * Check if ZK verification is in mock mode
 * @returns boolean - True if using mock verification
 */
export function isMockMode(): boolean {
  return true; // Always true until real ZK implementation
}
