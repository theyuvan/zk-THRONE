// ============================================================================
// ZK Proof Generation HTTP Server
// ============================================================================
//
// Provides REST API for proof generation:
//
// POST /api/prove
// {
//   "trial_id": "colorSigil",
//   "solution": [1, 2, 3, 4],
//   "player_address": "GXXXXXX...",
//   "round_id": 1
// }
//
// Response:
// {
//   "receipt": "0x...",
//   "journal": {...},
//   "image_id": [...]
// }

use std::net::SocketAddr;
use zk_throne::{generate_trial_proof, hash_solution, TrialInput};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct ProveRequest {
    trial_id: String,
    solution: Vec<u8>,
    player_address: String,
    round_id: u32,
}

#[derive(Debug, Serialize)]
struct ProveResponse {
    receipt: String, // hex-encoded
    journal: serde_json::Value,
    image_id: [u32; 8],
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    error: String,
}

// Note: This is a minimal example. For production, use axum, actix-web, or warp
fn main() {
    println!("🔐 ZK Throne Proof Server");
    println!("========================");
    println!();
    println!("⚠️  This is a STANDALONE proof generation server");
    println!("   For production, use a proper web framework (axum, actix-web)");
    println!();
    println!("Example curl command:");
    println!(r#"
curl -X POST http://localhost:3030/api/prove \
  -H "Content-Type: application/json" \
  -d '{{
    "trial_id": "colorSigil",
    "solution": [1, 2, 3, 4, 5],
    "player_address": "GXXXXXXXXXXXXXX",
    "round_id": 1
  }}'
"#);
    println!();
    println!("📖 See README.md for full integration guide");
    println!();
    println!("To implement full server:");
    println!("  1. Install cargo add axum tokio serde_json");
    println!("  2. Implement proper async handlers");
    println!("  3. Add authentication/rate limiting");
    println!("  4. Deploy with proper monitoring");
}

// Example handler logic (not runnable without web framework):
async fn handle_prove(req: ProveRequest) -> Result<ProveResponse, String> {
    // Compute expected hash (in production, this comes from game state)
    let expected_hash = hash_solution(&req.solution);
    
    let input = TrialInput {
        trial_id: req.trial_id,
        solution: req.solution,
        expected_hash,
        player_address: req.player_address,
        round_id: req.round_id,
    };
    
    let proof = generate_trial_proof(input)
        .map_err(|e| format!("Proof generation failed: {}", e))?;
    
    Ok(ProveResponse {
        receipt: hex::encode(&proof.receipt),
        journal: serde_json::to_value(&proof.journal).unwrap(),
        image_id: proof.image_id,
    })
}
