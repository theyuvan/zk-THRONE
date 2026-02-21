# 🚀 Stellar Throne — Quick Start Guide

Complete setup guide to deploy and run the ZK + Soroban backend in 5 minutes.

---

## Prerequisites

Before starting, ensure you have:

1. **Rust** (1.75+): [Install from rustup.rs](https://rustup.rs/)
2. **RISC Zero**: 
   ```bash
   cargo install cargo-risczero
   cargo risczero install
   ```
3. **Stellar CLI**:
   ```bash
   cargo install --locked stellar-cli
   ```
4. **Bun**: [Install from bun.sh](https://bun.sh/)
5. **wasm32 target**:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

---

## 🎯 One-Command Setup

Run the interactive setup script:

```bash
bun run setup:zk
```

This will:
1. ✅ Verify all prerequisites
2. ✅ Build RISC Zero guest program
3. ✅ Extract image ID
4. ✅ Build Soroban contract
5. ✅ Optimize WASM
6. ✅ Optionally deploy to testnet
7. ✅ Create `.env` files

**Follow the prompts** — the script will guide you through each step!

---

## 🧪 Testing the Setup

### 1. Start the ZK Proof Server

In a terminal:

```bash
cd backend/zk-server
cargo run --release
```

Server starts on `http://localhost:3030`

### 2. Test Proof Generation

```bash
curl -X POST http://localhost:3030/api/prove \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "12345",
    "trial_id": "temperature_sensor",
    "player_address": "GAXXX...YOUR_ADDRESS",
    "round_id": 1
  }'
```

Should return JSON with `receipt`, `journal`, and `image_id`.

### 3. Start Frontend

In another terminal:

```bash
cd frontend
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 📜 Contract Interaction

### Get Current Round

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- get_current_round
```

### Get Player Progress

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- get_progress \
  --player <PLAYER_ADDRESS> \
  --round 1
```

### Submit Proof (via Stellar CLI)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <PLAYER_IDENTITY> \
  --network testnet \
  -- submit_proof \
  --receipt <RECEIPT_HEX> \
  --journal <JOURNAL_HEX>
```

---

## 🔧 Manual Build (Optional)

If you prefer manual steps:

### 1. Build RISC Zero Guest

```bash
cd backend/zk-throne
cargo risczero build
```

### 2. Extract Image ID

```bash
cargo run --bin get-image-id
```

Copy the hex output to `.env` as `VITE_ZK_IMAGE_ID`.

### 3. Build Contract

```bash
cd contracts/throne-contract
cargo build --target wasm32-unknown-unknown --release
```

### 4. Optimize WASM

```bash
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/throne_contract.wasm \
  --wasm-out throne_contract_optimized.wasm
```

### 5. Deploy to Testnet

```bash
# Generate deployer identity
stellar keys generate deployer --network testnet

# Fund account
stellar keys fund deployer --network testnet

# Deploy contract
stellar contract deploy \
  --wasm throne_contract_optimized.wasm \
  --source deployer \
  --network testnet
```

### 6. Initialize Contract

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --image_id <IMAGE_ID_HEX> \
  --required_trials 7
```

---

## 🌐 Environment Variables

After setup, your `.env` should contain:

```env
VITE_ZK_SERVER_URL=http://localhost:3030
VITE_STELLAR_NETWORK=testnet
VITE_THRONE_CONTRACT_ID=C...
VITE_ZK_IMAGE_ID=0x...
VITE_DEBUG=true
```

---

## 🎮 Complete End-to-End Test

### 1. Generate Proof

```bash
curl -X POST http://localhost:3030/api/prove \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "correct_answer_hash",
    "trial_id": "trial_001",
    "player_address": "GAXXX",
    "round_id": 1
  }' | jq .
```

### 2. Submit to Contract

Use the frontend UI or:

```typescript
import { submitProof } from './services/zkService';

const proof = await generateProof({
  solution: "answer",
  trialId: "trial_001",
  playerAddress: "GAXXX",
  roundId: 1
});

const tx = await submitProof(proof.receipt, proof.journal);
console.log("Transaction:", tx);
```

### 3. Check Progress

```bash
stellar contract invoke \
  --id $VITE_THRONE_CONTRACT_ID \
  --network testnet \
  -- get_progress \
  --player <YOUR_ADDRESS> \
  --round 1
```

### 4. Complete 7 Trials

Repeat steps 1-3 with 7 different trials.

### 5. Check King Status

```bash
stellar contract invoke \
  --id $VITE_THRONE_CONTRACT_ID \
  --network testnet \
  -- get_current_king \
  --round 1
```

---

## 🐛 Troubleshooting

### "RISC Zero not found"

```bash
cargo install cargo-risczero
cargo risczero install
```

### "Stellar CLI not found"

```bash
cargo install --locked stellar-cli
```

### "wasm32 target not found"

```bash
rustup target add wasm32-unknown-unknown
```

### "Deployer account has insufficient balance"

```bash
stellar keys fund deployer --network testnet
```

### "Contract initialization failed"

Check that:
- Image ID format is correct (0x... hex string)
- Admin address is valid Stellar address
- Deployer has enough XLM

### ZK Server not starting

```bash
cd backend/zk-throne
cargo risczero build
cd ../zk-server
cargo build --release
cargo run --release
```

---

## 📚 Next Steps

- Read [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) for detailed architecture
- Review [SECURITY_ANALYSIS.md](./SECURITY_ANALYSIS.md) for security considerations
- Check [AGENTS.md](./AGENTS.md) for development patterns
- Explore [frontend/src/integrations/zk-soroban-example.ts](./frontend/src/integrations/zk-soroban-example.ts) for integration code

---

## 🎉 Success!

You now have:
- ✅ RISC Zero zkVM generating zero-knowledge proofs
- ✅ Soroban smart contract verifying proofs on-chain
- ✅ HTTP server exposing proof generation API
- ✅ Frontend ready for integration
- ✅ Complete testnet deployment

**Happy hacking! 👑**
