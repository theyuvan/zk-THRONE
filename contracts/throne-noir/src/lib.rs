#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, contractclient, panic_with_error, symbol_short, Address,
    Bytes, BytesN, Env,
};

// ============================================================================
// GAME HUB INTEGRATION (Required for Stellar Hackathon)
// ============================================================================

/// Game Hub client interface - REQUIRED for hackathon submission
/// Testnet Game Hub: CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG
#[contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(
        env: Env,
        game_id: Address,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    );

    fn end_game(env: Env, session_id: u32, player1_won: bool);
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    RoundId,
    RequiredTrials,
    King,
    IsLocked,
    BackendPubKey,
    GameHub,           // Game Hub contract address
    SessionId,         // Current multiplayer session ID
    SessionPlayer1,    // Player 1 in current session
    SessionPlayer2,    // Player 2 in current session
    SessionStarted,    // Has start_game been called for current session?
    Progress(Address),
    Nonce(Address),
}

// ============================================================================
// ERROR CODES
// ============================================================================

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    RoundLocked = 1,
    InvalidNonce = 2,
    InvalidSignature = 3,
    AlreadyKing = 4,
}

// ============================================================================
// CONTRACT
// ============================================================================

#[contract]
pub struct Throne;

#[contractimpl]
impl Throne {
    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /// Initialize the contract
    /// Called once by admin to set up the game
    pub fn initialize(
        env: Env,
        admin: Address,
        backend_pubkey: BytesN<32>,
        required_trials: u32,
        game_hub: Address,  // Game Hub contract address (required for hackathon)
    ) {
        admin.require_auth();

        // Store backend public key for signature verification
        env.storage()
            .instance()
            .set(&DataKey::BackendPubKey, &backend_pubkey);

        // Store Game Hub address for lifecycle reporting
        env.storage()
            .instance()
            .set(&DataKey::GameHub, &game_hub);

        // Initialize round 1
        env.storage().instance().set(&DataKey::RoundId, &1u32);
        env.storage().instance().set(&DataKey::IsLocked, &false);
        env.storage()
            .instance()
            .set(&DataKey::RequiredTrials, &required_trials);

        env.events().publish(
            (symbol_short!("init"),),
            (admin, backend_pubkey, required_trials, game_hub),
        );
    }

    // ========================================================================
    // MULTIPLAYER SESSION (Game Hub Integration)
    // ========================================================================

    /// Start a multiplayer session between two players
    /// REQUIRED: Calls Game Hub's start_game() for hackathon compliance
    /// Frontend/backend should call this when a multiplayer room countdown finishes
    pub fn start_multiplayer_session(
        env: Env,
        session_id: u32,
        player1: Address,
        player2: Address,
    ) {
        // Require auth from at least one player (typically the host)
        player1.require_auth();

        // Get Game Hub address
        let game_hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHub)
            .expect("Game Hub not configured");

        // Store session info
        env.storage().instance().set(&DataKey::SessionId, &session_id);
        env.storage().instance().set(&DataKey::SessionPlayer1, &player1);
        env.storage().instance().set(&DataKey::SessionPlayer2, &player2);
        env.storage().instance().set(&DataKey::SessionStarted, &true);

        // HACKATHON REQUIREMENT: Call Game Hub's start_game()
        // This reports the game start to the ecosystem
        let game_hub_client = GameHubClient::new(&env, &game_hub_addr);
        let game_id = env.current_contract_address();
        
        game_hub_client.start_game(
            &game_id,
            &session_id,
            &player1,
            &player2,
            &0i128,  // Initial points (both start at 0)
            &0i128,
        );

        env.events().publish(
            (symbol_short!("session"),),
            (session_id, player1, player2),
        );
    }

    // ========================================================================
    // PROOF SUBMISSION
    // ========================================================================

    /// Submit a verified proof attestation
    /// Backend has already verified the ZK proof off-chain
    /// This function verifies the backend's signature and updates progress
    /// Each trial has its own roundId (1, 2, 3...) for unique proof verification
    pub fn submit_proof(
        env: Env,
        player: Address,
        solution_hash: BytesN<32>,
        signature: BytesN<64>,
        nonce: u64,
        trial_round_id: u32,  // Which trial is being submitted (1, 2, 3...)
    ) {
        player.require_auth();

        // STEP 1: Check if round is locked
        let locked: bool = env
            .storage()
            .instance()
            .get(&DataKey::IsLocked)
            .unwrap_or(false);

        if locked {
            panic_with_error!(&env, Error::RoundLocked);
        }

        // STEP 2: Validate nonce (anti-replay)
        let last_nonce: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Nonce(player.clone()))
            .unwrap_or(0);

        if nonce <= last_nonce {
            panic_with_error!(&env, Error::InvalidNonce);
        }

        // STEP 3: Get player's current progress
        let current_progress: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Progress(player.clone()))
            .unwrap_or(0);

        // STEP 4: Validate trial_round_id matches expected progress
        // Player with 0 trials complete should submit trial 1, etc.
        let expected_trial = current_progress + 1;
        if trial_round_id != expected_trial {
            panic_with_error!(&env, Error::InvalidNonce); // Reuse InvalidNonce for wrong trial order
        }

        // STEP 5: Get backend public key
        let backend_pubkey: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::BackendPubKey)
            .expect("Backend public key not set");

        // STEP 6: Verify backend signature using the trial_round_id
        // Message format: SHA256(trialRoundId + player + solutionHash + nonce)
        Self::verify_signature(
            &env,
            &backend_pubkey,
            &signature,
            trial_round_id,
            &player,
            &solution_hash,
            nonce,
        );

        // STEP 6: Update nonce
        env.storage()
            .instance()
            .set(&DataKey::Nonce(player.clone()), &nonce);

        // STEP 7: Update player progress
        let mut count: u32 = env
            .storage()
            .instance()
            .get(&DataKey::Progress(player.clone()))
            .unwrap_or(0);

        count += 1;

        env.storage()
            .instance()
            .set(&DataKey::Progress(player.clone()), &count);

        // STEP 8: Check if player becomes king
        let required: u32 = env
            .storage()
            .instance()
            .get(&DataKey::RequiredTrials)
            .unwrap_or(7);

        if count >= required {
            // Player becomes king
            env.storage().instance().set(&DataKey::King, &player);
            env.storage().instance().set(&DataKey::IsLocked, &true);

            // Get game round ID for event
            let game_round_id: u32 = env
                .storage()
                .instance()
                .get(&DataKey::RoundId)
                .unwrap_or(1);

            // HACKATHON REQUIREMENT: Call Game Hub's end_game() when winner determined
            // Check if this is a multiplayer session
            let session_started: bool = env
                .storage()
                .instance()
                .get(&DataKey::SessionStarted)
                .unwrap_or(false);

            if session_started {
                let session_id: u32 = env
                    .storage()
                    .instance()
                    .get(&DataKey::SessionId)
                    .unwrap_or(0);

                let player1: Address = env
                    .storage()
                    .instance()
                    .get(&DataKey::SessionPlayer1)
                    .expect("Session player1 not found");

                // Determine if player1 won (current player is winner)
                let player1_won = player == player1;

                // Get Game Hub address and report game end
                let game_hub_addr: Address = env
                    .storage()
                    .instance()
                    .get(&DataKey::GameHub)
                    .expect("Game Hub not configured");

                let game_hub_client = GameHubClient::new(&env, &game_hub_addr);
                game_hub_client.end_game(&session_id, &player1_won);

                env.events().publish(
                    (symbol_short!("gameend"),),
                    (session_id, player.clone(), player1_won),
                );
            }

            env.events().publish(
                (symbol_short!("king"),),
                (player.clone(), game_round_id, trial_round_id),
            );
        } else {
            // Progress event with trial info
            env.events().publish(
                (symbol_short!("progress"),),
                (player, count, required, trial_round_id),
            );
        }
    }

    // ========================================================================
    // SIGNATURE VERIFICATION
    // ========================================================================

    /// Verify backend Ed25519 signature
    /// Message: SHA256(roundId + player + solutionHash + nonce)
    fn verify_signature(
        env: &Env,
        backend_pubkey: &BytesN<32>,
        signature: &BytesN<64>,
        round_id: u32,
        player: &Address,
        solution_hash: &BytesN<32>,
        nonce: u64,
    ) {
        // Construct message payload
        // Format: roundId (u32) + player (string) + solutionHash (32 bytes) + nonce (u64)

        let mut message = Bytes::new(env);

        // Add round_id (4 bytes, big-endian)
        message.extend_from_array(&round_id.to_be_bytes());

        // Add player address (convert to bytes)
        let player_string = player.to_string();
        let player_bytes = player_string.to_bytes();
        message.append(&player_bytes);

        // Add solution hash (32 bytes)
        message.extend_from_slice(&solution_hash.to_array());

        // Add nonce (8 bytes, big-endian)
        message.extend_from_array(&nonce.to_be_bytes());

        // Hash the message with SHA-256
        let message_hash = env.crypto().sha256(&message);

        // Convert hash to Bytes for signature verification
        let hash_bytes = Bytes::from_array(env, &message_hash.to_array());

        // Verify Ed25519 signature
        env.crypto()
            .ed25519_verify(backend_pubkey, &hash_bytes, signature);
    }

    // ========================================================================
    // QUERY METHODS
    // ========================================================================

    /// Get the current king
    pub fn get_king(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::King)
    }

    /// Get player's progress (completed trials)
    pub fn get_progress(env: Env, player: Address) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::Progress(player))
            .unwrap_or(0)
    }

    /// Get player's current nonce
    pub fn get_nonce(env: Env, player: Address) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::Nonce(player))
            .unwrap_or(0)
    }

    /// Get current round ID
    pub fn get_round_id(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::RoundId).unwrap_or(1)
    }

    /// Check if round is locked
    pub fn is_locked(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::IsLocked)
            .unwrap_or(false)
    }

    /// Get required trials to win
    pub fn get_required_trials(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::RequiredTrials)
            .unwrap_or(7)
    }

    /// Get backend public key
    pub fn get_backend_pubkey(env: Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&DataKey::BackendPubKey)
            .expect("Backend public key not set")
    }

    /// Get Game Hub address
    pub fn get_game_hub(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::GameHub)
            .expect("Game Hub not configured")
    }

    /// Get current session ID
    pub fn get_session_id(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::SessionId)
            .unwrap_or(0)
    }

    // ========================================================================
    // ADMIN METHODS
    // ========================================================================

    /// Start a new round (admin only)
    /// Resets game state for a fresh competition
    pub fn start_new_round(env: Env, admin: Address) {
        admin.require_auth();

        let current_round: u32 = env
            .storage()
            .instance()
            .get(&DataKey::RoundId)
            .unwrap_or(1);

        let new_round = current_round + 1;

        env.storage().instance().set(&DataKey::RoundId, &new_round);
        env.storage().instance().set(&DataKey::IsLocked, &false);
        env.storage().instance().remove(&DataKey::King);
        
        // Reset session data for new round
        env.storage().instance().set(&DataKey::SessionStarted, &false);
        env.storage().instance().remove(&DataKey::SessionId);
        env.storage().instance().remove(&DataKey::SessionPlayer1);
        env.storage().instance().remove(&DataKey::SessionPlayer2);

        env.events()
            .publish((symbol_short!("newround"),), (new_round,));
    }
}

