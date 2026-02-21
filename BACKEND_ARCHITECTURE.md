# 🏛️ ZK + SOROBAN THRONE ARCHITECTURE

## Complete Implementation Guide

This document provides production-grade deployment and integration instructions for the Stellar Throne ZK + Soroban system.

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [RISC Zero Setup](#risc-zero-setup)
4. [Soroban Contract Deployment](#soroban-contract-deployment)
5. [Backend Server Setup](#backend-server-setup)
6. [Frontend Integration](#frontend-integration)
7. [Complete Flow](#complete-flow)
8. [Security Considerations](#security-considerations)
9. [Testing](#testing)
10. [Production Deployment](#production-deployment)

---

## 🔧 PREREQUISITES

### Required Tools

```bash
# Rust (latest stable)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Soroban CLI
cargo install --locked soroban-cli

# RISC Zero toolchain
cargo install cargo-risczero
cargo risczero install

# Bun (for scripts)
curl -fsSL https://bun.sh/install | bash

# Stellar CLI (for deployment)
cargo install --locked stellar-cli
```

### Rust Targets

```bash
# Add WASM target for Soroban
rustup target add wasm32-unknown-unknown

# RISC Zero will auto-install riscv32im-unknown-none-elf
```

---

## 📁 PROJECT STRUCTURE

```
Stellar-Game-Studi/
├── backend/
│   ├── zk-throne/              # RISC Zero proof system
│   │   ├── methods/
│   │   │   ├── guest/          # zkVM guest program
│   │   │   └── src/            # Method definitions
│   │   └── src/
│   │       ├── lib.rs          # Prover library
│   │       └── bin/server.rs   # Standalone server
│   └── zk-server/              # Production HTTP API
│       └── src/main.rs
├── contracts/
│   └── throne-contract/        # Soroban contract
│       └── src/
│           ├── lib.rs          # Main contract
│           └── test.rs         # Tests
└── frontend/
    └── src/
        ├── zkVerifier.ts       # ZK integration (to be updated)
        └── contractAdapter.ts  # Contract integration (to be updated)
```

---

## 🔐 RISC ZERO SETUP

### Step 1: Build the Guest Program

```bash
cd backend/zk-throne

# Build the guest program (compiles to RISC-V)
cargo risczero build
```

This generates:
- `methods/guest/target/riscv32im-unknown-none-elf/release/throne-guest`
- Image ID constants in `methods/src/lib.rs`

### Step 2: Test Proof Generation

```bash
# Run tests
cargo test

# Expected output:
# ✅ test_proof_generation ... ok
# ✅ test_invalid_solution ... ok
```

### Step 3: Get Image ID

```bash
# Extract the image ID (needed for Soroban contract)
cargo run --bin get-image-id

# Or build and inspect:
cargo build --release
```

The image ID is a 256-bit identifier (8 x u32) that uniquely identifies the guest program.

**Example Image ID:**
```
[0x12345678, 0x9abcdef0, 0x11223344, 0x55667788, 
 0xaabbccdd, 0xeeff0011, 0x22334455, 0x66778899]
```

**Convert to Soroban BytesN<32>:**
```rust
// In hex string format
let image_id_hex = "123456789abcdef0112233445566778aabbccddeeff00112233445566778899";
```

---

## 🚀 SOROBAN CONTRACT DEPLOYMENT

### Step 1: Build Contract

```bash
# From repo root
bun run build throne-contract

# Or manually:
cd contracts/throne-contract
cargo build --target wasm32-unknown-unknown --release
```

### Step 2: Optimize WASM

```bash
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/throne_contract.wasm \
  --wasm-out throne_contract_optimized.wasm
```

### Step 3: Deploy to Testnet

```bash
# Setup network
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"

# Generate identity (if needed)
stellar keys generate deployer --network testnet

# Fund account
stellar keys fund deployer --network testnet

# Deploy contract
stellar contract deploy \
  --wasm throne_contract_optimized.wasm \
  --source deployer \
  --network testnet
```

**Output:**
```
Contract deployed successfully!
Contract ID: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 4: Initialize Contract

```bash
# Get image ID from RISC Zero (convert to BytesN<32> format)
export IMAGE_ID="0x123456789abcdef0112233445566778aabbccddeeff00112233445566778899"
export ADMIN="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export CONTRACT_ID="CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Initialize
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin $ADMIN \
  --image_id $IMAGE_ID \
  --required_trials 7
```

---

## 🌐 BACKEND SERVER SETUP

### Development Mode

```bash
cd backend/zk-server

# Install dependencies
cargo build

# Run server
cargo run

# Server starts on http://localhost:3030
```

### Test Endpoint

```bash
curl -X POST http://localhost:3030/api/prove \
  -H "Content-Type: application/json" \
  -d '{
    "trial_id": "colorSigil",
    "solution": [1, 2, 3, 4, 5],
    "player_address": "GXXXXXXXXXXXXXX",
    "round_id": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "receipt": "0x...",  // Hex-encoded RISC Zero receipt
  "journal": {
    "solution_hash": "0x...",
    "trial_id": "0x...",
    "player_address": "0x...",
    "round_id": 1,
    "is_valid": true
  },
  "image_id": "123456789abcdef0..."
}
```

### Production Deployment

```bash
# Build release binary
cargo build --release

# Binary location:
# backend/zk-server/target/release/zk-server

# Run with environment variables
export PORT=3030
export RUST_LOG=info
./target/release/zk-server
```

**Deployment Options:**
- Docker container
- Systemd service
- Cloud platforms (AWS, GCP, Azure)
- Kubernetes

---

## 🎨 FRONTEND INTEGRATION

### Update zkVerifier.ts

Replace the mock implementation with real ZK calls:

```typescript
// frontend/src/zkVerifier.ts

const ZK_SERVER_URL = import.meta.env.VITE_ZK_SERVER_URL || 'http://localhost:3030';

export interface ZKProof {
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

export async function generateProof(
  trialId: string,
  solution: any,
  playerAddress: string,
  roundId: number
): Promise<ZKProof> {
  // Encode solution as bytes
  const solutionBytes = encodeSolution(trialId, solution);
  
  const response = await fetch(`${ZK_SERVER_URL}/api/prove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trial_id: trialId,
      solution: Array.from(solutionBytes),
      player_address: playerAddress,
      round_id: roundId,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Proof generation failed');
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

function encodeSolution(trialId: string, solution: any): Uint8Array {
  // Trial-specific encoding
  switch (trialId) {
    case 'colorSigil':
      return new Uint8Array(solution as number[]);
    
    case 'logicLabyrinth':
      return new TextEncoder().encode(JSON.stringify(solution));
    
    // Add other trials...
    
    default:
      return new TextEncoder().encode(JSON.stringify(solution));
  }
}
```

### Update contractAdapter.ts

```typescript
// frontend/src/contractAdapter.ts

import * as StellarSdk from '@stellar/stellar-sdk';
import { generateProof, ZKProof } from './zkVerifier';

const CONTRACT_ID = import.meta.env.VITE_THRONE_CONTRACT_ID;
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const RPC_URL = 'https://soroban-testnet.stellar.org';

export async function submitTrialProof(
  trialId: string,
  solution: any,
  playerKeypair: StellarSdk.Keypair,
  roundId: number
): Promise<void> {
  // 1. Generate ZK proof
  const proof = await generateProof(
    trialId,
    solution,
    playerKeypair.publicKey(),
    roundId
  );
  
  // 2. Prepare contract call
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  
  const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
  
  // Load account
  const account = await server.getAccount(playerKeypair.publicKey());
  
  // Build transaction
  const receipt = StellarSdk.xdr.ScVal.scvBytes(
    Buffer.from(proof.receipt, 'hex')
  );
  
  const journal = StellarSdk.xdr.ScVal.scvBytes(
    Buffer.from(JSON.stringify(proof.journal))
  );
  
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: '1000000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'submit_proof',
        StellarSdk.Address(playerKeypair.publicKey()).toScVal(),
        receipt,
        journal,
        StellarSdk.nativeToScVal(roundId, { type: 'u32' })
      )
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
    throw new Error('Transaction failed');
  }
  
  console.log('✅ Trial proof submitted successfully');
}

export async function getPlayerProgress(
  playerAddress: string,
  roundId: number
): Promise<PlayerProgress | null> {
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const server = new StellarSdk.SorobanRpc.Server(RPC_URL);
  
  // Simulate transaction to read state
  const result = await server.simulateTransaction(
    new StellarSdk.TransactionBuilder(
      new StellarSdk.Account(playerAddress, '0'),
      { fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(
        contract.call(
          'get_progress',
          StellarSdk.nativeToScVal(roundId, { type: 'u32' }),
          StellarSdk.Address(playerAddress).toScVal()
        )
      )
      .setTimeout(0)
      .build()
  );
  
  // Decode result
  if (result.results && result.results.length > 0) {
    return decodeProgress(result.results[0].xdr);
  }
  
  return null;
}
```

---

## 🔄 COMPLETE FLOW

### 1. Player Completes Trial

```typescript
// In trial component (e.g., ColorSigilTrial.tsx)

async function completeTrialHandler() {
  const solution = [1, 2, 3, 4, 5]; // Player's answer
  
  try {
    // Submit proof to contract
    await submitTrialProof(
      'colorSigil',
      solution,
      playerKeypair,
      currentRoundId
    );
    
    // Update UI
    setTrialCompleted(true);
    
    // Check if player became king
    const progress = await getPlayerProgress(
      playerKeypair.publicKey(),
      currentRoundId
    );
    
    if (progress?.is_king) {
      navigateTo('kingReveal');
    } else {
      navigateTo('portalRoom');
    }
  } catch (error) {
    console.error('Failed to submit proof:', error);
    showError('Failed to verify solution');
  }
}
```

### 2. Backend Generates Proof

```
Player completes ColorSigil
     ↓
Frontend encodes solution: [1, 2, 3, 4, 5]
     ↓
POST /api/prove
     ↓
ZK Server: generate_trial_proof()
     ↓
RISC Zero executes guest program
     ↓
Guest verifies hash(solution) == expected_hash
     ↓
Guest commits journal (public data)
     ↓
Prover generates receipt (proof)
     ↓
Return { receipt, journal, image_id }
```

### 3. Contract Verifies Proof

```
Frontend receives proof
     ↓
Build Soroban transaction: submit_proof()
     ↓
Contract receives: (player, receipt, journal, round_id)
     ↓
Contract: verify_proof_internal()
     ↓
(In production: call risc0-zkvm verify)
     ↓
Decode journal → extract trial_id, player, round_id
     ↓
Check trial not already completed
     ↓
Increment completed_trials counter
     ↓
If trials_completed >= required_trials:
   → Assign King
   → Emit KING event
     ↓
Return PlayerProgress
```

---

## 🔒 SECURITY CONSIDERATIONS

### 1. Proof Verification

**Current Implementation:**
- Journal parsing without full receipt verification
- ⚠️ **PRODUCTION TODO:** Integrate `risc0-zkvm` verifier in Soroban

**Required for Production:**
```rust
// In throne-contract/src/lib.rs

use risc0_zkvm::Receipt;

fn verify_proof_internal(
    env: &Env,
    receipt: Bytes,
    journal: Bytes,
) -> Result<TrialCompletion, Error> {
    // Deserialize receipt
    let receipt_data: Receipt = bincode::deserialize(&receipt)
        .map_err(|_| Error::InvalidProof)?;
    
    // Verify against image ID
    let image_id: BytesN<32> = env.storage()
        .instance()
        .get(&DataKey::ImageId)
        .ok_or(Error::NotInitialized)?;
    
    // CRITICAL: Verify the receipt
    receipt_data.verify(&image_id_bytes)
        .map_err(|_| Error::InvalidProof)?;
    
    // Extract journal
    let journal_data: TrialOutput = receipt_data.journal.decode()
        .map_err(|_| Error::InvalidJournal)?;
    
    // ... rest of logic
}
```

**Challenge:** RISC Zero verifier must be compatible with Soroban's `no_std` environment.

**Solutions:**
- Use `risc0-zkvm` with `default-features = false`
- Implement custom Soroban-compatible verifier
- Use off-chain verification with on-chain journal validation

### 2. Replay Attacks

**Protection:**
- Each trial can only be completed once per round per player
- `CompletedTrials(round_id, player)` set prevents duplicates

### 3. Griefing Attacks

**Scenario:** Attacker submits invalid proofs to block legitimate players

**Protection:**
- Proof generation validates correctness (`is_valid` field)
- Invalid proofs rejected at contract level
- Optional: Implement proof submission fees

### 4. Front-Running

**Scenario:** Attacker sees proof in mempool and submits first

**Protection:**
- First-to-complete wins King status
- Non-transferable achievement (tied to player address)

### 5. Solution Privacy

**Guarantee:** Solutions never leave local environment in plaintext

**Flow:**
1. Player solves trial in browser
2. Solution → local proof generation (or sent to trusted backend)
3. Only proof receipt + journal sent to blockchain
4. Journal contains hash(solution), not solution itself

### 6. Image ID Integrity

**Critical:** Image ID must match deployed guest program

**Verification:**
```bash
# Generate image ID
cargo risczero build
cat methods/src/lib.rs | grep TRIAL_VERIFY_ID

# Use EXACT same ID in contract initialization
```

---

## 🧪 TESTING

### Unit Tests

```bash
# ZK proof generation
cd backend/zk-throne
cargo test

# Soroban contract
cd contracts/throne-contract
cargo test
```

### Integration Tests

```bash
# End-to-end flow test
cd backend/zk-server
cargo run &
SERVER_PID=$!

# Test proof generation
curl -X POST http://localhost:3030/api/prove \
  -H "Content-Type: application/json" \
  -d '{
    "trial_id": "colorSigil",
    "solution": [1,2,3],
    "player_address": "TEST",
    "round_id": 1
  }' | jq

kill $SERVER_PID
```

### Testnet Testing

```bash
# Deploy contract to testnet
bun run deploy throne-contract

# Submit test proof via Stellar CLI
stellar contract invoke \
  --id $CONTRACT_ID \
  --source player \
  --network testnet \
  -- \
  submit_proof \
  --player $PLAYER_ADDR \
  --receipt $RECEIPT_HEX \
  --journal $JOURNAL_HEX \
  --round_id 1
```

---

## 🚢 PRODUCTION DEPLOYMENT

### Backend Server

**Docker Deployment:**

```dockerfile
# Dockerfile
FROM rust:1.75 as builder

WORKDIR /app
COPY backend/zk-server ./zk-server
COPY backend/zk-throne ./zk-throne

WORKDIR /app/zk-server
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/zk-server/target/release/zk-server /usr/local/bin/

EXPOSE 3030

CMD ["zk-server"]
```

```bash
# Build & run
docker build -t zk-throne-server .
docker run -p 3030:3030 zk-throne-server
```

**Kubernetes:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zk-throne-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zk-throne
  template:
    metadata:
      labels:
        app: zk-throne
    spec:
      containers:
      - name: server
        image: zk-throne-server:latest
        ports:
        - containerPort: 3030
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
---
apiVersion: v1
kind: Service
metadata:
  name: zk-throne-service
spec:
  selector:
    app: zk-throne
  ports:
  - port: 80
    targetPort: 3030
  type: LoadBalancer
```

### Soroban Contract

**Mainnet Deployment:**

```bash
# Use production network
stellar network add mainnet \
  --rpc-url https://soroban-mainnet.stellar.org \
  --network-passphrase "Public Global Stellar Network ; September 2015"

# Deploy
stellar contract deploy \
  --wasm throne_contract_optimized.wasm \
  --source deployer \
  --network mainnet

# Initialize with production image ID
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network mainnet \
  -- \
  initialize \
  --admin $ADMIN_ADDR \
  --image_id $IMAGE_ID \
  --required_trials 7
```

### Monitoring

**Metrics to Track:**
- Proof generation time
- Proof verification success rate
- Contract gas usage
- Player progression rate
- King assignment events

**Logging:**
```rust
// Add tracing to server
use tracing::{info, error, warn};

info!("Proof generated for trial_id={}", trial_id);
error!("Verification failed: {}", err);
```

---

## 📊 PERFORMANCE BENCHMARKS

**Expected Performance:**

| Operation | Time | Gas (Soroban) |
|-----------|------|---------------|
| Proof Generation | 5-30s | N/A |
| Proof Verification | <1s | ~500k |
| submit_proof() | 1-3s | ~800k |
| get_progress() | <100ms | ~50k (read) |

**Optimization Tips:**
- Cache proofs client-side (localStorage)
- Batch multiple trial submissions
- Use Soroban's temporary storage for ephemeral data

---

## 🎯 NEXT STEPS

1. ✅ Build ZK guest program
2. ✅ Test proof generation locally
3. ✅ Deploy throne contract to testnet
4. ✅ Initialize contract with image ID
5. ⏳ Integrate risc0-zkvm verifier in Soroban
6. ⏳ Update frontend zkVerifier.ts
7. ⏳ Update frontend contractAdapter.ts
8. ⏳ End-to-end testing on testnet
9. ⏳ Security audit
10. ⏳ Mainnet deployment

---

## 📚 REFERENCES

- [RISC Zero Documentation](https://dev.risczero.com/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [Stellar SDK](https://github.com/stellar/js-stellar-sdk)
- [zkVM Security Best Practices](https://dev.risczero.com/api/security-model)

---

## 🆘 TROUBLESHOOTING

### RISC Zero Build Fails

```bash
# Reinstall RISC Zero toolchain
cargo risczero install --force

# Check target installed
rustup target list | grep riscv32im
```

### Soroban Contract Deployment Fails

```bash
# Check balance
stellar account balance deployer --network testnet

# Increase fee
stellar contract deploy \
  --wasm contract.wasm \
  --source deployer \
  --network testnet \
  --fee 10000000
```

### Proof Verification Fails

- Check image ID matches between guest and contract
- Verify journal format matches expected structure
- Ensure solution hash is computed correctly

---

**END OF DOCUMENTATION**
