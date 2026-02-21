# ⚡ QUICK REFERENCE — ZK + SOROBAN COMMANDS

Essential commands for day-to-day development and deployment.

---

## 🔧 SETUP

```bash
# Install all prerequisites
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install cargo-risczero && cargo risczero install
cargo install --locked stellar-cli
rustup target add wasm32-unknown-unknown

# Clone and setup
git clone <repo>
cd Stellar-Game-Studi
bun install
```

---

## 🏗️ BUILD

```bash
# Build everything
bun run setup:zk

# Build ZK guest only
cd backend/zk-throne
cargo risczero build

# Build contract only
cd contracts/throne-contract
cargo build --target wasm32-unknown-unknown --release

# Build server only
cd backend/zk-server
cargo build --release
```

---

## 🧪 TEST

```bash
# Test ZK system
cd backend/zk-throne && cargo test

# Test contract
cd contracts/throne-contract && cargo test

# Test integration
cd backend/zk-server && cargo run &
curl -X POST http://localhost:3030/api/prove -d '{...}'
```

---

## 🚀 DEPLOY

### Testnet

```bash
# Quick deploy (builds + deploys contract)
bun run setup:zk:deploy

# Manual deploy
stellar contract deploy \
  --wasm throne_contract_optimized.wasm \
  --source deployer \
  --network testnet

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

### Mainnet

```bash
# Deploy contract
stellar contract deploy \
  --wasm throne_contract_optimized.wasm \
  --source deployer-mainnet \
  --network mainnet

# Initialize
stellar contract invoke \
  --id $CONTRACT_ID \
  --source admin \
  --network mainnet \
  -- \
  initialize \
  --admin $ADMIN \
  --image_id $IMAGE_ID \
  --required_trials 7
```

---

## 🔐 RISC ZERO

```bash
# Build guest
cd backend/zk-throne
cargo risczero build

# Get image ID
cargo run --bin get-image-id

# Test proof generation
cargo test test_proof_generation

# Run standalone prover
cargo run --bin prove-server
```

---

## 📝 CONTRACT OPERATIONS

### Query State

```bash
# Get current round
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- \
  get_current_round

# Get player progress
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- \
  get_progress \
  --round_id 1 \
  --player $PLAYER_ADDRESS

# Get king
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- \
  get_king \
  --round_id 1
```

### Admin Operations

```bash
# Start new round
stellar contract invoke \
  --id $CONTRACT_ID \
  --source admin \
  --network testnet \
  -- \
  start_new_round \
  --admin $ADMIN_ADDRESS

# Update required trials
stellar contract invoke \
  --id $CONTRACT_ID \
  --source admin \
  --network testnet \
  -- \
  update_required_trials \
  --admin $ADMIN_ADDRESS \
  --required_trials 5
```

---

## 🌐 SERVER

```bash
# Run development server
cd backend/zk-server
cargo run

# Run production server
cargo run --release

# Docker
docker build -t zk-throne-server .
docker run -p 3030:3030 zk-throne-server

# Health check
curl http://localhost:3030/health

# Generate proof
curl -X POST http://localhost:3030/api/prove \
  -H "Content-Type: application/json" \
  -d '{
    "trial_id": "colorSigil",
    "solution": [1,2,3,4,5],
    "player_address": "GXXXX...",
    "round_id": 1
  }'
```

---

## 🎨 FRONTEND

```bash
# Development
bun run dev

# Production build
bun run build

# Preview production
bun run preview
```

### Environment Variables

```bash
# .env.local (development)
VITE_ZK_SERVER_URL=http://localhost:3030
VITE_THRONE_CONTRACT_ID=CXXXXXX... (testnet)
VITE_STELLAR_NETWORK=testnet

# .env.production
VITE_ZK_SERVER_URL=https://zk.stellar-game.com
VITE_THRONE_CONTRACT_ID=CXXXXXX... (mainnet)
VITE_STELLAR_NETWORK=mainnet
```

---

## 🐛 DEBUG

```bash
# Check workspace dependencies
cargo tree

# Audit dependencies
cargo audit

# Check contract size
ls -lh throne_contract_optimized.wasm

# View contract logs (Stellar)
stellar events --id $CONTRACT_ID --network testnet

# View server logs
export RUST_LOG=debug
cargo run
```

---

## 📦 VERSIONS

```bash
# Check tool versions
rustc --version
cargo --version
stellar --version
cargo risczero --version
bun --version

# Update Rust
rustup update

# Update Stellar CLI
cargo install --locked --force stellar-cli
```

---

## 🔍 INSPECT

```bash
# View contract info
stellar contract info \
  --id $CONTRACT_ID \
  --network testnet

# View account
stellar account info deployer --network testnet

# View transaction
stellar transaction info $TX_HASH --network testnet
```

---

## 🆘 TROUBLESHOOTING

### RISC Zero build fails

```bash
cargo risczero install --force
rustup update
cargo clean
cargo risczero build
```

### Contract deployment fails

```bash
# Fund account
stellar keys fund deployer --network testnet

# Increase fee
stellar contract deploy ... --fee 10000000

# Check balance
stellar account balance deployer --network testnet
```

### Proof generation slow

```bash
# Use release mode
cargo build --release
cargo run --release

# Check CPU usage
top -p $(pgrep zk-server)
```

### Out of gas

```bash
# Increase fee in transaction
# Or optimize contract storage usage
```

---

## 📚 DOCUMENTATION LINKS

- **Main Guide:** [README_ZK_SOROBAN.md](README_ZK_SOROBAN.md)
- **Architecture:** [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md)
- **Security:** [SECURITY_ANALYSIS.md](SECURITY_ANALYSIS.md)
- **Deployment:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Backend:** [backend/README.md](backend/README.md)
- **RISC Zero:** https://dev.risczero.com/
- **Soroban:** https://soroban.stellar.org/

---

## 🔑 KEY FILES

| File | Purpose |
|------|---------|
| `backend/zk-throne/methods/guest/src/main.rs` | Guest program logic |
| `backend/zk-throne/src/lib.rs` | Proof generation API |
| `backend/zk-server/src/main.rs` | HTTP server |
| `contracts/throne-contract/src/lib.rs` | Soroban contract |
| `frontend/src/integrations/zk-soroban-example.ts` | Frontend integration |
| `scripts/setup-zk.ts` | Build & deploy script |

---

## 🎯 COMMON WORKFLOWS

### Add New Trial Type

1. Update frontend trial logic
2. Update `encodeSolution()` in integration
3. No changes needed in ZK or contract (they're generic)
4. Test end-to-end

### Update Guest Program

1. Modify `backend/zk-throne/methods/guest/src/main.rs`
2. Rebuild: `cargo risczero build`
3. Get new image ID: `cargo run --bin get-image-id`
4. Update contract with new image ID
5. Redeploy contract

### Update Contract Logic

1. Modify `contracts/throne-contract/src/lib.rs`
2. Run tests: `cargo test`
3. Build: `cargo build --target wasm32-unknown-unknown --release`
4. Deploy new version
5. Update frontend contract ID

---

## 💡 TIPS

- Always test on testnet first
- Keep image ID in sync between ZK and contract
- Monitor proof generation times
- Use release builds in production
- Set up monitoring before mainnet launch
- Keep private keys secure (use hardware wallets)

---

**Happy coding! 🚀**
