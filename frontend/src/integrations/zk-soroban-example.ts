/**
 * INTEGRATION EXAMPLES
 * 
 * This file demonstrates how to integrate the ZK + Soroban backend
 * with your frontend trial system.
 */

import React, { useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';

// ============================================================================
// 1. ENVIRONMENT CONFIGURATION
// ============================================================================

const CONFIG = {
  zkServerUrl: import.meta.env.VITE_ZK_SERVER_URL || 'http://localhost:3030',
  contractId: import.meta.env.VITE_THRONE_CONTRACT_ID,
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
};

// ============================================================================
// 2. TYPE DEFINITIONS
// ============================================================================

interface ZKProof {
  receipt: string;
  journal: {
    solution_hash: string;
    trial_id: string;
    player_address: string;
    round_id: number;
    is_valid: boolean;
  };
  image_id: string;
}

interface PlayerProgress {
  player: string;
  round_id: number;
  trials_completed: number;
  last_trial_timestamp: number;
  is_king: boolean;
}

// ============================================================================
// 3. SOLUTION ENCODING
// ============================================================================

/**
 * Encode trial solutions into bytes for ZK proof
 */
function encodeSolution(trialId: string, solution: any): Uint8Array {
  switch (trialId) {
    case 'colorSigil':
      // Solution is array of color indices [1, 2, 3, 4, 5]
      return new Uint8Array(solution as number[]);
    
    case 'hiddenSigil':
      // Solution is string "answer"
      return new TextEncoder().encode(solution as string);
    
    case 'logicLabyrinth':
      // Solution is complex object, JSON stringify
      return new TextEncoder().encode(JSON.stringify(solution));
    
    case 'patternOracle':
      // Solution is array of numbers
      return new Uint8Array(solution as number[]);
    
    case 'memoryOfCrown':
      // Solution is serialized game state
      return new TextEncoder().encode(JSON.stringify(solution));
    
    case 'timekeeper':
      // Solution is timing data
      return new TextEncoder().encode(JSON.stringify(solution));
    
    case 'finalOath':
      // Solution is commitment value
      return new Uint8Array(solution as number[]);
    
    default:
      // Fallback: JSON stringify
      return new TextEncoder().encode(JSON.stringify(solution));
  }
}

// ============================================================================
// 4. PROOF GENERATION
// ============================================================================

/**
 * Generate ZK proof for trial solution
 */
async function generateProof(
  trialId: string,
  solution: any,
  playerAddress: string,
  roundId: number
): Promise<ZKProof> {
  // Encode solution
  const solutionBytes = encodeSolution(trialId, solution);
  
  // Call ZK proof server
  const response = await fetch(`${CONFIG.zkServerUrl}/api/prove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trial_id: trialId,
      solution: Array.from(solutionBytes),
      player_address: playerAddress,
      round_id: roundId,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Proof generation failed');
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Unknown error');
  }
  
  return {
    receipt: data.receipt,
    journal: data.journal,
    image_id: data.image_id,
  };
}

// ============================================================================
// 5. CONTRACT INTERACTION
// ============================================================================

/**
 * Submit proof to Soroban contract
 */
async function submitProof(
  proof: ZKProof,
  playerKeypair: StellarSdk.Keypair,
  roundId: number
): Promise<void> {
  const server = new StellarSdk.SorobanRpc.Server(CONFIG.rpcUrl);
  const contract = new StellarSdk.Contract(CONFIG.contractId);
  
  // Load account
  const account = await server.getAccount(playerKeypair.publicKey());
  
  // Prepare contract arguments
  const playerAddr = StellarSdk.Address(playerKeypair.publicKey()).toScVal();
  
  const receipt = StellarSdk.xdr.ScVal.scvBytes(
    Buffer.from(proof.receipt, 'hex')
  );
  
  const journal = StellarSdk.xdr.ScVal.scvBytes(
    Buffer.from(JSON.stringify(proof.journal))
  );
  
  const round = StellarSdk.nativeToScVal(roundId, { type: 'u32' });
  
  // Build transaction
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: '1000000',
    networkPassphrase: CONFIG.networkPassphrase,
  })
    .addOperation(
      contract.call('submit_proof', playerAddr, receipt, journal, round)
    )
    .setTimeout(300)
    .build();
  
  // Prepare transaction
  const prepared = await server.prepareTransaction(transaction);
  
  // Sign
  prepared.sign(playerKeypair);
  
  // Submit
  const result = await server.sendTransaction(prepared);
  
  // Wait for confirmation
  let status = await server.getTransaction(result.hash);
  
  while (status.status === 'NOT_FOUND' || status.status === 'PENDING') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    status = await server.getTransaction(result.hash);
  }
  
  if (status.status === 'FAILED') {
    throw new Error('Transaction failed: ' + status.error);
  }
  
  console.log('✅ Proof submitted successfully');
}

/**
 * Get player progress from contract
 */
async function getPlayerProgress(
  playerAddress: string,
  roundId: number
): Promise<PlayerProgress | null> {
  const server = new StellarSdk.SorobanRpc.Server(CONFIG.rpcUrl);
  const contract = new StellarSdk.Contract(CONFIG.contractId);
  
  // Build simulation transaction
  const tempAccount = new StellarSdk.Account(playerAddress, '0');
  
  const transaction = new StellarSdk.TransactionBuilder(tempAccount, {
    fee: '100',
    networkPassphrase: CONFIG.networkPassphrase,
  })
    .addOperation(
      contract.call(
        'get_progress',
        StellarSdk.nativeToScVal(roundId, { type: 'u32' }),
        StellarSdk.Address(playerAddress).toScVal()
      )
    )
    .setTimeout(0)
    .build();
  
  // Simulate
  const result = await server.simulateTransaction(transaction);
  
  if (!result.results || result.results.length === 0) {
    return null;
  }
  
  // Decode result
  const scVal = result.results[0].xdr;
  
  // Parse Soroban result (adjust based on actual structure)
  const progress = decodePlayerProgress(scVal);
  
  return progress;
}

/**
 * Get current King for round
 */
async function getKing(roundId: number): Promise<string | null> {
  const server = new StellarSdk.SorobanRpc.Server(CONFIG.rpcUrl);
  const contract = new StellarSdk.Contract(CONFIG.contractId);
  
  // Similar to getPlayerProgress but call get_king
  // ... implementation
  
  return null; // Placeholder
}

// ============================================================================
// 6. HIGH-LEVEL INTEGRATION
// ============================================================================

/**
 * Complete trial and submit proof
 * 
 * This is the main function to call from trial components
 */
async function completeTrial(
  trialId: string,
  solution: any,
  playerKeypair: StellarSdk.Keypair,
  roundId: number
): Promise<{ becameKing: boolean; progress: PlayerProgress }> {
  console.log(`🎮 Completing trial: ${trialId}`);
  
  // 1. Generate ZK proof
  console.log('🔐 Generating proof...');
  const proof = await generateProof(
    trialId,
    solution,
    playerKeypair.publicKey(),
    roundId
  );
  
  console.log('✅ Proof generated');
  console.log('Journal:', proof.journal);
  
  // 2. Submit to contract
  console.log('📝 Submitting to blockchain...');
  await submitProof(proof, playerKeypair, roundId);
  
  // 3. Get updated progress
  console.log('📊 Getting progress...');
  const progress = await getPlayerProgress(playerKeypair.publicKey(), roundId);
  
  if (!progress) {
    throw new Error('Failed to get progress after submission');
  }
  
  console.log(`✅ Trial complete! (${progress.trials_completed} total)`);
  
  return {
    becameKing: progress.is_king,
    progress,
  };
}

// ============================================================================
// 7. REACT COMPONENT EXAMPLE
// ============================================================================

/**
 * Example React component integrating ZK proof system
 */
function ColorSigilTrialWithZK() {
  const [solution, setSolution] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Assume these are available from context/props
  const playerKeypair = usePlayerKeypair();
  const currentRound = useCurrentRound();
  const { navigateTo } = useGameNavigation();
  
  async function handleComplete() {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit trial with ZK proof
      const result = await completeTrial(
        'colorSigil',
        solution,
        playerKeypair,
        currentRound
      );
      
      if (result.becameKing) {
        // Player became King!
        navigateTo('kingReveal');
      } else {
        // More trials to complete
        navigateTo('portalRoom');
      }
    } catch (err) {
      console.error('Trial submission failed:', err);
      setError(err.message || 'Failed to submit trial');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <div>
      <h2>Color Sigil Trial</h2>
      
      {/* Trial UI here */}
      
      <button
        onClick={handleComplete}
        disabled={isSubmitting || solution.length === 0}
      >
        {isSubmitting ? 'Submitting Proof...' : 'Complete Trial'}
      </button>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
}

// ============================================================================
// 8. UTILITY FUNCTIONS
// ============================================================================

/**
 * Decode Soroban ScVal to PlayerProgress
 * (Adjust based on actual Soroban encoding)
 */
function decodePlayerProgress(scVal: StellarSdk.xdr.ScVal): PlayerProgress {
  // This is a placeholder - actual implementation depends on Soroban encoding
  // You'll need to use StellarSdk.scValToNative() with proper structure
  
  return {
    player: 'GXXXX...',
    round_id: 1,
    trials_completed: 3,
    last_trial_timestamp: Date.now(),
    is_king: false,
  };
}

/**
 * Health check for ZK server
 */
async function checkZKServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${CONFIG.zkServerUrl}/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

// ============================================================================
// 9. ERROR HANDLING
// ============================================================================

class ZKProofError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ZKProofError';
  }
}

class ContractError extends Error {
  constructor(message: string, public readonly txHash?: string) {
    super(message);
    this.name = 'ContractError';
  }
}

/**
 * Wrapper with better error handling
 */
async function completeTrialSafe(
  trialId: string,
  solution: any,
  playerKeypair: StellarSdk.Keypair,
  roundId: number
): Promise<{ becameKing: boolean; progress: PlayerProgress }> {
  try {
    return await completeTrial(trialId, solution, playerKeypair, roundId);
  } catch (err) {
    if (err.message?.includes('Proof generation failed')) {
      throw new ZKProofError(
        'Failed to generate zero-knowledge proof. Please try again.',
        'PROOF_GENERATION_FAILED'
      );
    }
    
    if (err.message?.includes('TrialAlreadyCompleted')) {
      throw new ContractError(
        'You have already completed this trial.',
        err.txHash
      );
    }
    
    if (err.message?.includes('InvalidProof')) {
      throw new ZKProofError(
        'Proof verification failed. Your solution may be incorrect.',
        'INVALID_PROOF'
      );
    }
    
    throw err;
  }
}

// ============================================================================
// EXPORT API
// ============================================================================

export {
  // Main functions
  completeTrial,
  completeTrialSafe,
  
  // Individual steps
  generateProof,
  submitProof,
  getPlayerProgress,
  getKing,
  
  // Utilities
  encodeSolution,
  checkZKServerHealth,
  
  // Types
  type ZKProof,
  type PlayerProgress,
  
  // Errors
  ZKProofError,
  ContractError,
};

// ============================================================================
// USAGE IN YOUR TRIAL COMPONENTS
// ============================================================================

/**
 * Replace the mock zkVerifier calls with:
 * 
 * Before:
 *   import { verifyProof, generateMockProof } from './zkVerifier';
 *   const proof = generateMockProof(trialId, answer);
 *   const isValid = await verifyProof(proof.proof, proof.publicSignals);
 * 
 * After:
 *   import { completeTrial } from './integrations/zk-soroban';
 *   const result = await completeTrial(trialId, answer, playerKeypair, roundId);
 *   if (result.becameKing) { ... }
 */
