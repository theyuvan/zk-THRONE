// ============================================================================
// TRIAL SOLUTION GENERATOR
// ============================================================================
// Generates solution tokens for each trial completion
// These match the backend validation in backend/zk-server/config/trials.js
// ============================================================================

import type { TrialId } from '../types/game';

/**
 * Generate solution token for a completed trial
 * 
 * IMPORTANT: These tokens MUST match backend validation rules in:
 * backend/zk-server/config/trials.js
 * 
 * Each trial has a specific completion token that proves the player
 * actually completed the challenge.
 */
export function generateTrialSolution(trialId: TrialId, roundId: number): string {
  const timestamp = Date.now();
  
  switch (trialId) {
    case 'colorSigil':
      // Trial 2 in backend: Color Sigil Memory
      // Backend validates: solution === "colorsigil_complete" || solution.startsWith("COLORSIGIL:")
      return `COLORSIGIL:complete:${timestamp}`;
      
    case 'logicLabyrinth':
      // Trial 5 in backend: Logic Labyrinth
      // Backend validates: solution === "logiclabyrinth_complete" || solution.startsWith("LOGIC:")
      return `LOGIC:complete:${timestamp}`;
      
    case 'patternOracle':
      // Trial 3 in backend: Pattern Oracle
      // Backend validates: solution === "patternoracle_complete" || solution.startsWith("PATTERN:")
      return `PATTERN:complete:${timestamp}`;
      
    case 'memoryOfCrown':
      // Trial 6 in backend: Memory of Crowns
      // Backend validates: solution === "memoryofcrowns_complete" || solution.startsWith("MEMORY:")
      return `MEMORY:complete:${timestamp}`;
      
    case 'finalOath':
      // Trial 1 in backend: Thronebreaker Protocol / Final Oath
      // Backend validates: solution === "thronebreaker_complete" || solution.startsWith("THRONEBREAKER:")
      return `THRONEBREAKER:complete:${timestamp}`;
      
    default:
      // Fallback for unknown trials
      return `TRIAL_${roundId}_COMPLETE:${timestamp}`;
  }
}

/**
 * Map trial index to trial ID
 * Used when you have the trial number (1-7) instead of trial object
 */
export function getTrialIdFromIndex(index: number): TrialId {
  const mapping: Record<number, TrialId> = {
    1: 'colorSigil',
    2: 'logicLabyrinth',
    3: 'patternOracle',
    4: 'memoryOfCrown',
    5: 'finalOath',
  };
  
  return mapping[index] || 'colorSigil';
}

/**
 * Check if a solution token is valid format
 * Used for debugging/validation
 */
export function isValidSolutionToken(solution: string): boolean {
  const validPrefixes = [
    'COLOR_SIGIL:',
    'HIDDEN_SIGIL:',
    'LOGIC_PATH:',
    'PATTERN_ORACLE:',
    'MEMORY_CROWN:',
    'TRAP_TIMEKEEPER:',
    'THRONEBREAKER:',
  ];
  
  const validCompletions = [
    'colorsigil_complete',
    'hiddensigil_complete',
    'logicpath_complete',
    'patternoracle_complete',
    'memorycrown_complete',
    'traptimekeeper_complete',
    'thronebreaker_complete',
  ];
  
  return (
    validCompletions.includes(solution) ||
    validPrefixes.some(prefix => solution.startsWith(prefix))
  );
}
