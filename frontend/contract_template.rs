#![no_std]

//! zk-Throne Stellar Smart Contract
//! 
//! This contract manages game state and integrates with the Game Hub.
//! It handles:
//! - Starting/ending game sessions
//! - Trial submissions and validation
//! - 2-minute punishment lockouts
//! - Player progress tracking

use soroban_sdk::{
    contract, contractimpl, contracttype, 
    Env, Address, Vec, Symbol, symbol_short
};

// Game state data structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GameState {
    pub player: Address,
    pub mode: u32,              // 1, 3, or 5 trials
    pub trials_completed: u32,
    pub current_trial: u32,
    pub last_failed_timestamp: u64,
    pub started_at: u64,
    pub completed_trials: Vec<u32>,
}

// Trial result
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TrialResult {
    Success,
    Failed,
    Locked,
}

#[contract]
pub struct ThroneGame;

const LOCKOUT_DURATION: u64 = 120; // 2 minutes in seconds
const STATE_KEY: Symbol = symbol_short!("STATE");
const GAME_HUB: Symbol = symbol_short!("GAME_HUB");

#[contractimpl]
impl ThroneGame {
    
    /// Initialize the contract with Game Hub address
    pub fn initialize(env: Env, game_hub: Address) {
        // Store Game Hub contract address
        env.storage().instance().set(&GAME_HUB, &game_hub);
    }
    
    /// Start a new game session
    /// 
    /// # Arguments
    /// * `player` - The player's address
    /// * `mode` - Game mode (1, 3, or 5 trials)
    /// 
    /// # Panics
    /// * If game already in progress
    /// * If mode is invalid
    pub fn start_game(env: Env, player: Address, mode: u32) {
        player.require_auth();
        
        // Validate mode
        if mode != 1 && mode != 3 && mode != 5 {
            panic!("Invalid mode. Must be 1, 3, or 5");
        }
        
        // Check if game already exists
        if env.storage().instance().has(&STATE_KEY) {
            panic!("Game already in progress");
        }
        
        let current_time = env.ledger().timestamp();
        
        // Initialize game state
        let state = GameState {
            player: player.clone(),
            mode,
            trials_completed: 0,
            current_trial: 0,
            last_failed_timestamp: 0,
            started_at: current_time,
            completed_trials: Vec::new(&env),
        };
        
        // Save state
        env.storage().instance().set(&STATE_KEY, &state);
        
        // TODO: Call Game Hub start_game()
        // let game_hub: Address = env.storage().instance().get(&GAME_HUB).unwrap();
        // Call game_hub.start_game(player)
        
        // Emit event
        env.events().publish(
            (symbol_short!("game"), symbol_short!("start")),
            (player, mode, current_time)
        );
    }
    
    /// Submit a trial answer with ZK proof verification
    /// 
    /// # Arguments
    /// * `player` - The player's address
    /// * `trial_id` - The trial identifier (0-4)
    /// * `proof_valid` - Whether the ZK proof is valid (from verifier)
    /// 
    /// # Returns
    /// * `TrialResult` - Success, Failed, or Locked
    pub fn submit_trial(
        env: Env,
        player: Address,
        trial_id: u32,
        proof_valid: bool
    ) -> TrialResult {
        player.require_auth();
        
        // Get current state
        let mut state: GameState = env.storage()
            .instance()
            .get(&STATE_KEY)
            .expect("Game not started");
        
        // Verify it's the same player
        if state.player != player {
            panic!("Not your game");
        }
        
        // Check if player is locked out (2-minute punishment)
        let current_time = env.ledger().timestamp();
        if state.last_failed_timestamp > 0 
            && current_time < state.last_failed_timestamp + LOCKOUT_DURATION {
            
            // Still locked
            return TrialResult::Locked;
        }
        
        // Check if trial already completed
        if state.completed_trials.contains(&trial_id) {
            panic!("Trial already completed");
        }
        
        // Check if all trials completed
        if state.trials_completed >= state.mode {
            panic!("All trials already completed");
        }
        
        let result = if proof_valid {
            // Proof is valid - trial passed
            state.trials_completed += 1;
            state.current_trial = trial_id;
            state.completed_trials.push_back(trial_id);
            
            // Emit success event
            env.events().publish(
                (symbol_short!("trial"), symbol_short!("pass")),
                (player.clone(), trial_id, current_time)
            );
            
            TrialResult::Success
        } else {
            // Proof failed - lock player for 2 minutes
            state.last_failed_timestamp = current_time;
            
            // Emit failure event
            env.events().publish(
                (symbol_short!("trial"), symbol_short!("fail")),
                (player.clone(), trial_id, current_time)
            );
            
            TrialResult::Failed
        };
        
        // Save updated state
        env.storage().instance().set(&STATE_KEY, &state);
        
        result
    }
    
    /// End the game session
    /// 
    /// # Arguments
    /// * `player` - The player's address
    /// 
    /// # Returns
    /// * `bool` - True if player completed all trials
    pub fn end_game(env: Env, player: Address) -> bool {
        player.require_auth();
        
        // Get current state
        let state: GameState = env.storage()
            .instance()
            .get(&STATE_KEY)
            .expect("Game not started");
        
        // Verify it's the same player
        if state.player != player {
            panic!("Not your game");
        }
        
        let completed_all = state.trials_completed >= state.mode;
        
        // TODO: Call Game Hub end_game()
        // let game_hub: Address = env.storage().instance().get(&GAME_HUB).unwrap();
        // Call game_hub.end_game(player, completed_all)
        
        // Clear state
        env.storage().instance().remove(&STATE_KEY);
        
        // Emit event
        env.events().publish(
            (symbol_short!("game"), symbol_short!("end")),
            (player, completed_all, env.ledger().timestamp())
        );
        
        completed_all
    }
    
    /// Get current game state
    /// 
    /// # Arguments
    /// * `player` - The player's address
    /// 
    /// # Returns
    /// * `GameState` - Current game state
    pub fn get_state(env: Env, player: Address) -> GameState {
        let state: GameState = env.storage()
            .instance()
            .get(&STATE_KEY)
            .expect("Game not started");
        
        // Verify it's the same player
        if state.player != player {
            panic!("Not your game");
        }
        
        state
    }
    
    /// Check if player is currently locked out
    /// 
    /// # Arguments
    /// * `player` - The player's address
    /// 
    /// # Returns
    /// * `(bool, u64)` - (is_locked, seconds_remaining)
    pub fn check_lockout(env: Env, player: Address) -> (bool, u64) {
        let state: GameState = env.storage()
            .instance()
            .get(&STATE_KEY)
            .expect("Game not started");
        
        if state.player != player {
            return (false, 0);
        }
        
        if state.last_failed_timestamp == 0 {
            return (false, 0);
        }
        
        let current_time = env.ledger().timestamp();
        let lock_end = state.last_failed_timestamp + LOCKOUT_DURATION;
        
        if current_time >= lock_end {
            (false, 0)
        } else {
            (true, lock_end - current_time)
        }
    }
    
    /// Get player's progress
    /// 
    /// # Arguments
    /// * `player` - The player's address
    /// 
    /// # Returns
    /// * `(u32, u32)` - (completed_trials, total_trials)
    pub fn get_progress(env: Env, player: Address) -> (u32, u32) {
        let state: GameState = env.storage()
            .instance()
            .get(&STATE_KEY)
            .expect("Game not started");
        
        if state.player != player {
            panic!("Not your game");
        }
        
        (state.trials_completed, state.mode)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    
    #[test]
    fn test_game_flow() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ThroneGame);
        let client = ThroneGameClient::new(&env, &contract_id);
        
        let player = Address::generate(&env);
        let game_hub = Address::generate(&env);
        
        // Initialize
        client.initialize(&game_hub);
        
        // Start game
        client.start_game(&player, &3);
        
        // Submit trials
        let result1 = client.submit_trial(&player, &0, &true);
        assert_eq!(result1, TrialResult::Success);
        
        // Check progress
        let (completed, total) = client.get_progress(&player);
        assert_eq!(completed, 1);
        assert_eq!(total, 3);
        
        // Submit failed trial
        let result2 = client.submit_trial(&player, &1, &false);
        assert_eq!(result2, TrialResult::Failed);
        
        // Should be locked
        let (locked, time) = client.check_lockout(&player);
        assert!(locked);
        assert!(time > 0);
    }
}
