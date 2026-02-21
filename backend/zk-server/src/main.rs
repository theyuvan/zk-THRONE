// ============================================================================
// ZK Throne — Production HTTP Server
// ============================================================================

use axum::{
    extract::State,
    http::{HeaderValue, Method, StatusCode},
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use zk_throne::{generate_trial_proof, hash_solution, TrialInput};

// ============================================================================
// API Types
// ============================================================================

#[derive(Debug, Deserialize)]
struct ProveRequest {
    trial_id: String,
    solution: Vec<u8>,
    player_address: String,
    round_id: u32,
}

#[derive(Debug, Serialize)]
struct ProveResponse {
    success: bool,
    receipt: String,
    journal: serde_json::Value,
    image_id: String,
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    success: bool,
    error: String,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
    version: String,
}

// ============================================================================
// App State
// ============================================================================

#[derive(Clone)]
struct AppState {
    // Add any shared state here (DB connections, caches, etc.)
}

// ============================================================================
// Handlers
// ============================================================================

async fn health_check() -> impl IntoResponse {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

async fn generate_proof(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<ProveRequest>,
) -> Result<Json<ProveResponse>, (StatusCode, Json<ErrorResponse>)> {
    // Compute expected hash from solution
    let expected_hash = hash_solution(&req.solution);

    // Create proof input
    let input = TrialInput {
        trial_id: req.trial_id,
        solution: req.solution,
        expected_hash,
        player_address: req.player_address,
        round_id: req.round_id,
    };

    // Generate proof
    let proof = generate_trial_proof(input).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                success: false,
                error: format!("Proof generation failed: {}", e),
            }),
        )
    })?;

    // Convert image_id to hex
    let image_id_hex = proof
        .image_id
        .iter()
        .map(|n| format!("{:08x}", n))
        .collect::<Vec<_>>()
        .join("");

    Ok(Json(ProveResponse {
        success: true,
        receipt: hex::encode(&proof.receipt),
        journal: serde_json::to_value(&proof.journal).unwrap(),
        image_id: image_id_hex,
    }))
}

// ============================================================================
// Main
// ============================================================================

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Create app state
    let state = Arc::new(AppState {});

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/prove", post(generate_proof))
        .with_state(state)
        .layer(cors);

    // Start server
    let addr = "0.0.0.0:3030";
    let listener = tokio::net::TcpListener::bind(addr).await?;

    println!("🔐 ZK Throne Proof Server");
    println!("========================");
    println!();
    println!("Server listening on: {}", addr);
    println!();
    println!("Endpoints:");
    println!("  GET  /health       - Health check");
    println!("  POST /api/prove    - Generate ZK proof");
    println!();
    println!("Example curl:");
    println!(
        r#"
curl -X POST http://localhost:3030/api/prove \
  -H "Content-Type: application/json" \
  -d '{{
    "trial_id": "colorSigil",
    "solution": [1, 2, 3, 4, 5],
    "player_address": "GXXXXXXXXXXXXXX",
    "round_id": 1
  }}'
"#
    );

    axum::serve(listener, app).await?;

    Ok(())
}
