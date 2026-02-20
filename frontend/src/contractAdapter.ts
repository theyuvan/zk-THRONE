/**
 * Game Contract Integration Layer
 * 
 * This file provides integration between your React frontend and Stellar smart contract.
 * After moving to Stellar Game Studio, update the import paths.
 */

// TODO: Replace with actual studio imports after migration
// import { useGameContract } from '@stellar-game-studio/hooks'
// import type { Address } from '@stellar-game-studio/types'

import { verifyProof, generateMockProof } from './zkVerifier'

export interface ContractGameState {
  player: string
  trialsCompleted: number
  currentTrial: number
  lastFailedTimestamp: number
  mode: 1 | 3 | 5
  isLocked: boolean
  lockTimeRemaining: number
}

/**
 * Mock contract calls (to be replaced with real contract bindings)
 */
export class GameContractAdapter {
  private state: ContractGameState | null = null
  
  /**
   * Start a new game session
   */
  async startGame(player: string, mode: 1 | 3 | 5): Promise<void> {
    console.log('🎮 Starting game:', { player, mode })
    
    // TODO: Replace with actual contract call
    // await contract.start_game(player, mode)
    
    this.state = {
      player,
      trialsCompleted: 0,
      currentTrial: 0,
      lastFailedTimestamp: 0,
      mode,
      isLocked: false,
      lockTimeRemaining: 0,
    }
    
    // Mock: Save to localStorage until contract is integrated
    localStorage.setItem('gameState', JSON.stringify(this.state))
  }
  
  /**
   * Submit a trial answer with ZK proof
   */
  async submitTrial(
    player: string,
    trialId: string,
    answer: any
  ): Promise<boolean> {
    console.log('📝 Submitting trial:', { player, trialId })
    
    // Generate proof
    const proof = generateMockProof(trialId, answer)
    
    // Verify proof
    const isValid = await verifyProof(proof.proof, proof.publicSignals)
    
    if (!this.state) {
      throw new Error('Game not started')
    }
    
    // Check if locked (2-minute cooldown)
    const currentTime = Date.now() / 1000
    if (currentTime < this.state.lastFailedTimestamp + 120) {
      console.log('⏱️ Player is locked out')
      return false
    }
    
    // TODO: Replace with actual contract call
    // const result = await contract.submit_trial(player, trialId, isValid)
    
    if (isValid) {
      this.state.trialsCompleted += 1
      this.state.currentTrial += 1
      console.log('✅ Trial completed')
    } else {
      this.state.lastFailedTimestamp = currentTime
      this.state.isLocked = true
      console.log('❌ Trial failed - 2 minute lockout')
    }
    
    // Save state
    localStorage.setItem('gameState', JSON.stringify(this.state))
    
    return isValid
  }
  
  /**
   * End the game session
   */
  async endGame(player: string): Promise<void> {
    console.log('🏁 Ending game:', { player })
    
    // TODO: Replace with actual contract call
    // await contract.end_game(player)
    
    this.state = null
    localStorage.removeItem('gameState')
  }
  
  /**
   * Get current game state
   */
  getState(): ContractGameState | null {
    if (!this.state) {
      const saved = localStorage.getItem('gameState')
      if (saved) {
        this.state = JSON.parse(saved)
      }
    }
    
    // Update lock status
    if (this.state && this.state.isLocked) {
      const currentTime = Date.now() / 1000
      const lockEndTime = this.state.lastFailedTimestamp + 120
      
      if (currentTime >= lockEndTime) {
        this.state.isLocked = false
        this.state.lockTimeRemaining = 0
      } else {
        this.state.lockTimeRemaining = Math.ceil(lockEndTime - currentTime)
      }
    }
    
    return this.state
  }
  
  /**
   * Check if player is locked out
   */
  isPlayerLocked(): boolean {
    const state = this.getState()
    return state?.isLocked ?? false
  }
  
  /**
   * Get remaining lock time in seconds
   */
  getLockTimeRemaining(): number {
    const state = this.getState()
    return state?.lockTimeRemaining ?? 0
  }
}

// Singleton instance
export const gameContract = new GameContractAdapter()

/**
 * React Hook for game contract (to be replaced with studio hook)
 */
export function useGameContract() {
  // TODO: Replace with actual studio hook after migration
  // return useGameContract('throne-game')
  
  return {
    startGame: (player: string, mode: 1 | 3 | 5) => 
      gameContract.startGame(player, mode),
    
    submitTrial: (player: string, trialId: string, answer: any) =>
      gameContract.submitTrial(player, trialId, answer),
    
    endGame: (player: string) =>
      gameContract.endGame(player),
    
    getState: () =>
      gameContract.getState(),
    
    isLocked: () =>
      gameContract.isPlayerLocked(),
    
    getLockTime: () =>
      gameContract.getLockTimeRemaining(),
  }
}

/**
 * Utility: Format lock time for display
 */
export function formatLockTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
