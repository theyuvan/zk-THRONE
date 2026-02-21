# Backend — ZK Throne Proof System

This directory contains the RISC Zero zkVM implementation for private trial verification.

## Structure

```
backend/
├── zk-throne/          # Core ZK proof library
│   ├── methods/        # RISC Zero methods
│   │   ├── guest/      # Guest program (runs in zkVM)
│   │   └── src/        # Method definitions
│   └── src/
│       ├── lib.rs      # Public API
│       ├── verifier.rs # Verification utilities
│       └── bin/        # CLI tools
└── zk-server/          # HTTP API server
    └── src/
        └── main.rs     # Axum server
```

## Quick Start

### 1. Install RISC Zero

```bash
cargo install cargo-risczero
cargo risczero install
```

### 2. Build Guest Program

```bash
cd zk-throne
cargo risczero build
```

### 3. Run Tests

```bash
cargo test
```

### 4. Start HTTP Server

```bash
cd ../zk-server
cargo run
```

Server runs on `http://localhost:3030`

## Usage

### Generate Proof (API)

```bash
curl -X POST http://localhost:3030/api/prove \
  -H "Content-Type: application/json" \
  -d '{
    "trial_id": "colorSigil",
    "solution": [1, 2, 3, 4, 5],
    "player_address": "GXXXXX...",
    "round_id": 1
  }'
```

### Generate Proof (Library)

```rust
use zk_throne::{generate_trial_proof, TrialInput};

let input = TrialInput {
    trial_id: "colorSigil".to_string(),
    solution: vec![1, 2, 3, 4, 5],
    expected_hash: expected_hash,
    player_address: "GXXXXX...".to_string(),
    round_id: 1,
};

let proof = generate_trial_proof(input)?;

println!("Receipt: {}", hex::encode(&proof.receipt));
println!("Journal: {:?}", proof.journal);
```

## Architecture

### Guest Program

The guest program runs inside the RISC Zero zkVM and:
1. Receives private solution input
2. Computes `hash(solution)`
3. Verifies hash matches expected_hash
4. Commits public journal data

**Key Property:** Solution never leaves guest environment in plaintext.

### Proof Receipt

Contains:
- **Proof:** Cryptographic proof that guest executed correctly
- **Journal:** Public outputs (trial_id, player, round_id, is_valid)
- **Image ID:** Identifies which guest program was used

### Verification

```rust
use zk_throne::verify_trial_proof;

let journal = verify_trial_proof(&receipt_bytes)?;

assert!(journal.is_valid);
assert_eq!(journal.trial_id, expected_trial_id);
```

## Security

See [BACKEND_ARCHITECTURE.md](../../BACKEND_ARCHITECTURE.md#security-considerations) for full security analysis.

**Key Points:**
- Solutions are never transmitted in plaintext
- Proofs are cryptographically verifiable
- Image ID ensures guest program integrity
- Replay protection via trial completion tracking

## Performance

| Operation | Time |
|-----------|------|
| Guest build | ~30s |
| Proof generation | 5-30s |
| Proof verification | <1s |

Proof generation time depends on:
- Solution complexity
- Available CPU cores
- RISC Zero prover backend (CPU vs GPU)

## Deployment

See [BACKEND_ARCHITECTURE.md](../../BACKEND_ARCHITECTURE.md#production-deployment) for production deployment guide.

## Troubleshooting

### Build Errors

```bash
# Reinstall RISC Zero
cargo risczero install --force

# Verify installation
cargo risczero --version
```

### Slow Proof Generation

- Use release builds: `cargo build --release`
- Enable GPU acceleration (RISC Zero Metal/CUDA)
- Increase CPU allocation

### Image ID Mismatch

```bash
# Extract current image ID
cargo run --bin get-image-id

# Update Soroban contract with new ID
```

## References

- [RISC Zero Documentation](https://dev.risczero.com/)
- [zkVM Tutorial](https://dev.risczero.com/api/zkvm/)
- [Guest Program Examples](https://github.com/risc0/risc0/tree/main/examples)
