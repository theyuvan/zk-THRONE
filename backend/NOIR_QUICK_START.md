# 🎯 Stellar Throne - Noir ZK Architecture

**Zero-Knowledge Trial Verification using Noir + Barretenberg + Ed25519 Attestation**

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      STELLAR THRONE                          │
│                   (Noir ZK Architecture)                     │
└─────────────────────────────────────────────────────────────┘

Frontend                Backend (Node.js)           Soroban
─────────              ──────────────────           ───────

Player submits     →   1. Generate ZK Proof    →    
  solution              (Noir circuit +              
                         Barretenberg)               
                                                     
                   →   2. Verify proof locally  →    
                                                     
                   →   3. Sign public inputs    →   4. Verify signature
                        (Ed25519 attestation)       5. Update progress
                                                    6. Assign king
                   ←   Return attestation       ←   
                                                     
Frontend submits   →                            →   Submit signed
attestation to                                      attestation
contract                                            
```

## Security Model

- **Off-Chain Proving**: Noir circuit generates ZK proof that player knows correct solution
- **Off-Chain Verification**: Backend verifies proof using Barretenberg
- **Signature Attestation**: Backend signs `hash(public_inputs)` with Ed25519 private key
- **On-Chain Verification**: Contract verifies signature with stored backend public key
- **Trust Model**: Contract trusts backend signatures (backend is trusted party)

### Why This Approach?

1. **Scalability**: Soroban cannot verify 100MB RISC Zero receipts on-chain
2. **Simplicity**: Ed25519 signature = 64 bytes vs zkVM receipt = 100MB+
3. **Standard Tooling**: Soroban has native Ed25519 verification
4. **Performance**: Barretenberg prover compiles to WASM (no Docker needed)
5. **Noir Ecosystem**: Industry-standard ZK language (used by Aztec, zkSync)

## 📋 Prerequisites

### System Requirements
- **Node.js 18+** (for backend server)
- **Bun** (for package management)
- **Rust 1.70+** (for Soroban contracts)
- **Stellar CLI 25.1.0+** (for contract deployment)
- **Noir 0.32.0+** (for ZK circuits)

### Install Tools

```bash
# Bun
curl -fsSL https://bun.sh/install | bash

# Stellar CLI (Linux/WSL)
curl -L https://github.com/stellar/stellar-cli/releases/download/v25.1.0/stellar-cli-25.1.0-x86_64-unknown-linux-gnu.tar.gz | tar -xz
sudo mv stellar /usr/local/bin/

# Noir (via noirup)
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup --version 0.32.0
```

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repo-url>
cd Stellar-Game-Studi

# Install dependencies
bun install
```

### 2. Generate Backend Keypair

```bash
cd backend/zk-server
node -e "
const nacl = require('tweetnacl');
const kp = nacl.sign.keyPair();
console.log('Private Key:', Buffer.from(kp.secretKey.slice(0,32)).toString('hex'));
console.log('Public Key:', Buffer.from(kp.publicKey).toString('hex'));
"
```

Save the output:
- **Private Key** → `.env` as `BACKEND_PRIVATE_KEY=<hex>`
- **Public Key** → Use for contract initialization

### 3. Compile Noir Circuit

```bash
cd backend/noir-circuits/trial_proof

# Compile circuit
nargo compile

# Test with sample inputs (Prover.toml)
nargo prove

# Verify proof
nargo verify
```

Output: `target/trial_proof.json` (circuit bytecode + ABI)

### 4. Start Backend Server

```bash
cd backend/zk-server

# Create .env file
cat > .env << EOF
BACKEND_PRIVATE_KEY=<your_private_key_from_step_2>
PORT=3030
EOF

# Install dependencies
bun install

# Start development server
bun run dev
```

Server runs at `http://localhost:3030`

Test health check:
```bash
curl http://localhost:3030/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "zk-throne-backend",
  "publicKey": "a1b2c3d4...",
  "timestamp": 1234567890
}
```

### 5. Build Soroban Contract

```bash
cd contracts/throne-noir

# Build contract
cargo build --target wasm32-unknown-unknown --release

# Optimize WASM
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/throne_noir.wasm
```

Output: `throne_noir.optimized.wasm` (~14KB)

### 6. Deploy to Testnet

```bash
# Set network config
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Create/fund deployer account (if needed)
stellar keys generate deployer --network testnet
stellar keys address deployer
# Fund at: https://laboratory.stellar.org/#account-creator?network=test

# Deploy contract
stellar contract deploy \
  --wasm throne_noir.optimized.wasm \
  --source deployer \
  --network testnet

# Save contract ID
export CONTRACT_ID=<output_contract_id>
```

### 7. Initialize Contract

```bash
# Get admin address
export ADMIN=$(stellar keys address deployer)

# Get backend public key (from step 2)
export BACKEND_PUBKEY=<your_public_key_from_step_2>

# Initialize contract
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin $ADMIN \
  --backend_pubkey $BACKEND_PUBKEY \
  --required_trials 7
```

### 8. Update Environment

```bash
# Update .env in backend
echo "CONTRACT_ID=$CONTRACT_ID" >> backend/zk-server/.env

# Update .env in frontend (if applicable)
echo "VITE_CONTRACT_ID=$CONTRACT_ID" >> frontend/.env
```

## 🧪 Testing the System

### Test Proof Generation

```bash
# POST request to backend
curl -X POST http://localhost:3030/prove \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "secret_answer_123",
    "player_wallet": "GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "trial_id": 1,
    "round_id": 1
  }'
```

Expected response:
```json
{
  "valid": true,
  "attestation": {
    "solution_hash": "0xabc123...",
    "player_wallet": "GBXX...",
    "trial_id": 1,
    "round_id": 1,
    "signature": "0xdef456...",
    "public_key": "0x789abc...",
    "timestamp": 1234567890
  }
}
```

### Test Contract Submission

```bash
# Convert attestation to XDR format
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- submit_proof \
  --player $ADMIN \
  --attestation_sig <signature_from_attestation> \
  --solution_hash <solution_hash_from_attestation> \
  --trial_id 1 \
  --round_id 1
```

### Check Player Progress

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_progress \
  --player $ADMIN \
  --round_id 1
```

Expected response:
```json
{
  "completed_trials": 1,
  "last_trial": 1
}
```

### Check Current King

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_king \
  --round_id 1
```

## 📁 Project Structure

```
backend/
├── noir-circuits/
│   └── trial_proof/
│       ├── src/
│       │   └── main.nr          # Noir circuit (ZK proof logic)
│       ├── Nargo.toml            # Circuit config
│       ├── Prover.toml           # Test inputs
│       └── target/
│           └── trial_proof.json # Compiled circuit (generated)
│
└── zk-server/
    ├── src/
    │   ├── index.ts             # Express HTTP server
    │   ├── prover.ts            # Barretenberg proof generation
    │   ├── attestation.ts       # Ed25519 signing
    │   └── types.ts             # TypeScript interfaces
    ├── package.json             # Node dependencies
    └── .env                     # Backend private key

contracts/
└── throne-noir/
    ├── src/
    │   └── lib.rs               # Soroban contract (signature verification)
    └── Cargo.toml               # Rust dependencies
```

## 🔐 Security Considerations

### Backend Private Key

- **Development**: Generate with `tweetnacl`, store in `.env`
- **Production**: Use HSM (Hardware Security Module) or KMS (Key Management Service)
- **Never commit**: Add `.env` to `.gitignore`

### Signature Scheme

- **Algorithm**: Ed25519 (Curve25519 elliptic curve)
- **Signature Size**: 64 bytes
- **Public Key Size**: 32 bytes
- **Security Level**: 128-bit (equivalent to RSA-3072)

### Trust Model

- **Backend Trust**: Contract trusts backend signatures
- **Centralization**: Single backend keypair (single point of failure)
- **Decentralization Path**: Multi-sig backend or threshold signatures (future work)

### Replay Protection

- **Round ID**: Prevents old proofs from being reused across rounds
- **Trial ID**: Prevents same trial from being completed twice
- **Player Binding**: Signature includes player address in commitment

## 🛠️ Development Commands

### Backend

```bash
cd backend/zk-server

# Development server (watch mode)
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Run tests
bun run test

# Compile Noir circuit
bun run compile-circuit

# Generate proof (using Prover.toml)
bun run prove

# Verify proof
bun run verify
```

### Contract

```bash
cd contracts/throne-noir

# Build
cargo build --target wasm32-unknown-unknown --release

# Run tests
cargo test

# Optimize WASM
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/throne_noir.wasm

# Deploy
stellar contract deploy --wasm throne_noir.optimized.wasm --source deployer --network testnet
```

## 📚 API Reference

### Backend Endpoints

#### `GET /health`
Health check

**Response:**
```json
{
  "status": "healthy",
  "service": "zk-throne-backend",
  "publicKey": "a1b2c3d4...",
  "timestamp": 1234567890
}
```

#### `GET /public-key`
Get backend Ed25519 public key

**Response:**
```json
{
  "publicKey": "a1b2c3d4...",
  "format": "hex",
  "algorithm": "Ed25519"
}
```

#### `POST /prove`
Generate ZK proof and attestation

**Request:**
```json
{
  "solution": "secret_answer",
  "player_wallet": "GBXX...",
  "trial_id": 1,
  "round_id": 1
}
```

**Response:**
```json
{
  "valid": true,
  "attestation": {
    "solution_hash": "0xabc...",
    "player_wallet": "GBXX...",
    "trial_id": 1,
    "round_id": 1,
    "signature": "0xdef...",
    "public_key": "0x789...",
    "timestamp": 1234567890
  }
}
```

#### `POST /verify`
Verify attestation signature (testing only)

**Request:**
```json
{
  "attestation": { ... }
}
```

**Response:**
```json
{
  "valid": true,
  "timestamp": 1234567890
}
```

### Contract Methods

#### `initialize(admin, backend_pubkey, required_trials)`
Initialize contract (called once)

#### `submit_proof(player, attestation_sig, solution_hash, trial_id, round_id)`
Submit verified proof with backend signature

#### `get_king(round_id) -> Option<Address>`
Get current king for round

#### `get_progress(player, round_id) -> PlayerProgress`
Get player's completed trials

#### `get_round_state(round_id) -> RoundState`
Get round state (king, locked status, required trials)

#### `get_backend_pubkey() -> BytesN<32>`
Get stored backend public key

## 🐛 Troubleshooting

### Circuit Compilation Fails

```bash
# Check Noir version
nargo --version

# Update to 0.32.0
noirup --version 0.32.0

# Clean and rebuild
cd backend/noir-circuits/trial_proof
rm -rf target
nargo compile
```

### Backend Server Crashes

```bash
# Check if circuit is compiled
ls backend/noir-circuits/trial_proof/target/trial_proof.json

# If missing:
cd backend/noir-circuits/trial_proof
nargo compile

# Check .env file exists
cat backend/zk-server/.env

# Restart server
cd backend/zk-server
bun run dev
```

### Contract Deployment Fails

```bash
# Check network config
stellar network ls

# Check account funded
stellar keys address deployer
# Fund at https://laboratory.stellar.org/#account-creator?network=test

# Check WASM size (<200KB)
ls -lh contracts/throne-noir/throne_noir.optimized.wasm

# Retry deployment
stellar contract deploy --wasm throne_noir.optimized.wasm --source deployer --network testnet
```

### Signature Verification Fails

```bash
# Check backend public key matches contract
curl http://localhost:3030/public-key

stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_backend_pubkey

# If mismatch: redeploy contract with correct key
```

## 📖 Learn More

- **Noir Documentation**: https://noir-lang.org/
- **Barretenberg**: https://github.com/AztecProtocol/barretenberg
- **Soroban Documentation**: https://soroban.stellar.org/
- **Ed25519 RFC**: https://tools.ietf.org/html/rfc8032

## 🤝 Contributing

See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design details.

## 📄 License

MIT
