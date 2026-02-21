#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Bytes, BytesN, Env};

// ============================================================================
// Tests
// ============================================================================

#[test]
fn test_initialization() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ThroneContract);
    let client = ThroneContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let image_id = BytesN::from_array(&env, &[1u8; 32]);

    env.mock_all_auths();

    client.initialize(&admin, &image_id, &7);

    let round = client.get_current_round();
    assert_eq!(round, 1);
}

#[test]
fn test_submit_proof_and_progress() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ThroneContract);
    let client = ThroneContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    let image_id = BytesN::from_array(&env, &[1u8; 32]);

    env.mock_all_auths();

    client.initialize(&admin, &image_id, &3); // Only 3 trials for testing

    // Create mock journal (simplified)
    let mut journal_data = vec![0u8; 101];
    // solution_hash
    journal_data[0..32].copy_from_slice(&[42u8; 32]);
    // trial_id
    journal_data[32..64].copy_from_slice(b"colorSigil\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0");
    // player_address (simplified)
    let player_str = player.to_string();
    let player_bytes = player_str.as_bytes();
    journal_data[64..64 + player_bytes.len().min(32)].copy_from_slice(&player_bytes[..player_bytes.len().min(32)]);
    // round_id
    journal_data[96..100].copy_from_slice(&1u32.to_be_bytes());
    // is_valid
    journal_data[100] = 1;

    let journal = Bytes::from_slice(&env, &journal_data);
    let receipt = Bytes::new(&env); // Mock receipt

    // Submit first trial
    let progress = client.submit_proof(&player, &receipt, &journal, &1);
    assert_eq!(progress.trials_completed, 1);
    assert!(!progress.is_king);

    // Check progress
    let retrieved = client.get_progress(&1, &player);
    assert!(retrieved.is_some());
    assert_eq!(retrieved.unwrap().trials_completed, 1);
}

#[test]
#[should_panic(expected = "TrialAlreadyCompleted")]
fn test_duplicate_trial_submission() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ThroneContract);
    let client = ThroneContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    let image_id = BytesN::from_array(&env, &[1u8; 32]);

    env.mock_all_auths();

    client.initialize(&admin, &image_id, &7);

    // Create journal
    let mut journal_data = vec![0u8; 101];
    journal_data[32..64].copy_from_slice(b"colorSigil\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0");
    let player_str = player.to_string();
    let player_bytes = player_str.as_bytes();
    journal_data[64..64 + player_bytes.len().min(32)].copy_from_slice(&player_bytes[..player_bytes.len().min(32)]);
    journal_data[96..100].copy_from_slice(&1u32.to_be_bytes());
    journal_data[100] = 1;

    let journal = Bytes::from_slice(&env, &journal_data);
    let receipt = Bytes::new(&env);

    // Submit once
    client.submit_proof(&player, &receipt, &journal, &1);

    // Submit again (should panic)
    client.submit_proof(&player, &receipt, &journal, &1);
}

#[test]
fn test_king_assignment() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ThroneContract);
    let client = ThroneContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    let image_id = BytesN::from_array(&env, &[1u8; 32]);

    env.mock_all_auths();

    client.initialize(&admin, &image_id, &2); // Only 2 trials

    let receipt = Bytes::new(&env);

    // Submit trial 1
    let mut journal1 = vec![0u8; 101];
    journal1[32..64].copy_from_slice(b"trial1\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0");
    let player_str = player.to_string();
    let player_bytes = player_str.as_bytes();
    journal1[64..64 + player_bytes.len().min(32)].copy_from_slice(&player_bytes[..player_bytes.len().min(32)]);
    journal1[96..100].copy_from_slice(&1u32.to_be_bytes());
    journal1[100] = 1;
    client.submit_proof(&player, &receipt, &Bytes::from_slice(&env, &journal1), &1);

    // Submit trial 2
    let mut journal2 = vec![0u8; 101];
    journal2[32..64].copy_from_slice(b"trial2\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0");
    journal2[64..64 + player_bytes.len().min(32)].copy_from_slice(&player_bytes[..player_bytes.len().min(32)]);
    journal2[96..100].copy_from_slice(&1u32.to_be_bytes());
    journal2[100] = 1;
    let progress = client.submit_proof(&player, &receipt, &Bytes::from_slice(&env, &journal2), &1);

    assert_eq!(progress.trials_completed, 2);
    assert!(progress.is_king);

    // Check king
    let king = client.get_king(&1);
    assert!(king.is_some());
    assert_eq!(king.unwrap(), player);
}

#[test]
fn test_round_management() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ThroneContract);
    let client = ThroneContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let image_id = BytesN::from_array(&env, &[1u8; 32]);

    env.mock_all_auths();

    client.initialize(&admin, &image_id, &7);

    let round1 = client.get_current_round();
    assert_eq!(round1, 1);

    // Start new round
    let round2 = client.start_new_round(&admin);
    assert_eq!(round2, 2);

    let current = client.get_current_round();
    assert_eq!(current, 2);
}
