# 🚀 Stellar Throne - Complete Deployment Guide

**Step-by-step instructions for deploying the Noir ZK architecture**

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Bun installed
- [ ] Rust 1.70+ installed
- [ ] Stellar CLI 25.1.0+ installed
- [ ] Noir/nargo installed
- [ ] WSL or Linux environment (recommended for contract builds)
- [ ] Stellar testnet account with XLM balance

---

## Part 1: Install Required Tools

### Install Bun (Package Manager)

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc  # or ~/.zshrc
bun --version
```

### Install Stellar CLI (Linux/WSL)

```bash
# Download and install
curl -L https://github.com/stellar/stellar-cli/releases/download/v25.1.0/stellar-cli-25.1.0-x86_64-unknown-linux-gnu.tar.gz | tar -xz
sudo mv stellar /usr/local/bin/

# Verify installation
stellar --version
```

### Install Noir (ZK Circuit Compiler)

```bash
# Install noirup (Noir version manager)
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
source ~/.bashrc

# Install Noir 0.32.0
noirup --version 0.32.0

# Verify installation
nargo --version
```

### Install Rust (if needed)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup target add wasm32-unknown-unknown

# Verify installation
rustc --version
cargo --version
```

---

## Part 2: Project Setup

### Clone Repository

```bash
cd ~
git clone <repo-url> Stellar-Game-Studi
cd Stellar-Game-Studi
```

### Install Node Dependencies

```bash
# Root dependencies
bun install

# Backend dependencies
cd backend/zk-server
bun install
cd ../..
```

---

## Part 3: Generate Backend Keypair

### Generate Ed25519 Keys

```bash
cd backend/zk-server
node generate-keys.js
```

**Save the output:**
- Copy the **Private Key** (64 hex chars)
- Copy the **Public Key** (64 hex chars)

### Create Backend .env File

```bash
cd backend/zk-server
cat > .env << EOF
BACKEND_PRIVATE_KEY=<paste_private_key_from_above>
PORT=3030
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
LOG_LEVEL=info
EOF
```

**Verify .env file:**
```bash
cat .env
```

---

## Part 4: Compile Noir Circuit

### Navigate to Circuit Directory

```bash
cd ~/Stellar-Game-Studi/backend/noir-circuits/trial_proof
```

### Compile Circuit

```bash
nargo compile
```

**Expected output:**
```
Compiling trial_proof...
Compiled successfully
Generated: target/trial_proof.json
```

### Test Circuit (Optional)

```bash
# Generate proof with sample inputs
nargo prove

# Verify proof
nargo verify
```

**Expected output:**
```
Proof written to proofs/trial_proof.proof
Verifier written to Verifier.toml
Verification succeeded
```

---

## Part 5: Start Backend Server

### Navigate to Backend

```bash
cd ~/Stellar-Game-Studi/backend/zk-server
```

### Start Server (Development Mode)

```bash
bun run dev
```

**Expected output:**
```
🚀 Initializing ZK Throne Backend...
✅ Loaded Ed25519 keypair from BACKEND_PRIVATE_KEY
🔑 Backend Public Key: a1b2c3d4e5f6...
✅ Noir circuit loaded successfully
✅ Backend ready

🌐 ZK Throne Backend listening on http://localhost:3030
   Health: http://localhost:3030/health
   Public Key: http://localhost:3030/public-key
   Prove: POST http://localhost:3030/prove
```

### Test Backend (New Terminal)

Open a new terminal window:

```bash
# Test health endpoint
curl http://localhost:3030/health

# Test public key endpoint
curl http://localhost:3030/public-key
```

**Expected response:**
```json
{
  "publicKey": "a1b2c3d4e5f6...",
  "format": "hex",
  "algorithm": "Ed25519"
}
```

**Leave server running** and continue in a new terminal.

---

## Part 6: Build Soroban Contract

### Navigate to Contract

```bash
cd ~/Stellar-Game-Studi/contracts/throne-noir
```

### Build Contract

```bash
cargo build --target wasm32-unknown-unknown --release
```

**Expected output:**
```
   Compiling throne-noir v0.1.0
    Finished release [optimized] target(s)
```

### Optimize WASM

```bash
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/throne_noir.wasm
```

**Expected output:**
```
Optimized contract: throne_noir.optimized.wasm
Size: ~14KB
```

### Verify WASM Size

```bash
ls -lh throne_noir.optimized.wasm
```

**Expected:** ~14-20KB

---

## Part 7: Configure Stellar Network

### Add Testnet Network

```bash
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

### Generate Deployer Keypair

```bash
stellar keys generate deployer --network testnet
```

**Expected output:**
```
Generated keypair for account: deployer
Public key: GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
Secret key: SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Get Deployer Address

```bash
stellar keys address deployer
```

**Save this address** - you'll need it for initialization.

### Fund Account (Testnet)

Visit: https://laboratory.stellar.org/#account-creator?network=test

- Paste your deployer public key
- Click "Get test network lumens"
- Wait for confirmation (10-30 seconds)

### Verify Account Balance

```bash
stellar keys address deployer | xargs -I {} \
  curl "https://horizon-testnet.stellar.org/accounts/{}"
```

**Expected:** JSON response with account details and XLM balance

---

## Part 8: Deploy Contract

### Deploy to Testnet

```bash
cd ~/Stellar-Game-Studi/contracts/throne-noir

stellar contract deploy \
  --wasm throne_noir.optimized.wasm \
  --source deployer \
  --network testnet
```

**Expected output:**
```
Deploying contract...
Contract deployed successfully!
Contract ID: CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI
```

### Save Contract ID

```bash
export CONTRACT_ID=<contract_id_from_above>
echo "CONTRACT_ID=$CONTRACT_ID"
```

**Save this Contract ID** - you'll need it for all future operations.

---

## Part 9: Initialize Contract

### Get Initialization Parameters

```bash
# Admin address (deployer)
export ADMIN=$(stellar keys address deployer)
echo "ADMIN=$ADMIN"

# Backend public key (from Part 3)
export BACKEND_PUBKEY=<your_public_key_from_generate_keys>
echo "BACKEND_PUBKEY=$BACKEND_PUBKEY"
```

### Initialize Contract

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin $ADMIN \
  --backend_pubkey $BACKEND_PUBKEY \
  --required_trials 7
```

**Expected output:**
```
Transaction submitted successfully
Status: SUCCESS
```

### Verify Initialization

```bash
# Check backend public key
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_backend_pubkey

# Check round 1 state
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_round_state \
  --round_id 1
```

**Expected response:**
```json
{
  "king": null,
  "is_locked": false,
  "required_trials": 7
}
```

---

## Part 10: Update Environment Files

### Update Backend .env

```bash
cd ~/Stellar-Game-Studi/backend/zk-server
echo "CONTRACT_ID=$CONTRACT_ID" >> .env
cat .env
```

### Update Frontend .env (if applicable)

```bash
cd ~/Stellar-Game-Studi/frontend
cat > .env << EOF
VITE_CONTRACT_ID=$CONTRACT_ID
VITE_BACKEND_URL=http://localhost:3030
VITE_STELLAR_NETWORK=testnet
EOF
```

---

## Part 11: End-to-End Test

### Test 1: Generate Proof

```bash
curl -X POST http://localhost:3030/prove \
  -H "Content-Type: application/json" \
  -d "{
    \"solution\": \"test_secret_123\",
    \"player_wallet\": \"$ADMIN\",
    \"trial_id\": 1,
    \"round_id\": 1
  }" | jq
```

**Expected response:**
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

**Save the attestation response** for next step.

### Test 2: Submit to Contract

Extract values from attestation:

```bash
export ATTESTATION_SIG=<signature_from_response>
export SOLUTION_HASH=<solution_hash_from_response>
```

Submit proof:

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- submit_proof \
  --player $ADMIN \
  --attestation_sig $ATTESTATION_SIG \
  --solution_hash $SOLUTION_HASH \
  --trial_id 1 \
  --round_id 1
```

**Expected output:**
```
Transaction submitted successfully
Status: SUCCESS
```

### Test 3: Check Progress

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_progress \
  --player $ADMIN \
  --round_id 1
```

**Expected response:**
```json
{
  "completed_trials": 1,
  "last_trial": 1
}
```

### Test 4: Complete 7 Trials (Become King)

Repeat Test 1-2 with different trial_ids (2-7):

```bash
for trial_id in {2..7}; do
  echo "Submitting trial $trial_id..."
  
  # Generate proof
  RESPONSE=$(curl -s -X POST http://localhost:3030/prove \
    -H "Content-Type: application/json" \
    -d "{\"solution\":\"secret_$trial_id\",\"player_wallet\":\"$ADMIN\",\"trial_id\":$trial_id,\"round_id\":1}")
  
  ATTESTATION_SIG=$(echo $RESPONSE | jq -r '.attestation.signature')
  SOLUTION_HASH=$(echo $RESPONSE | jq -r '.attestation.solution_hash')
  
  # Submit to contract
  stellar contract invoke \
    --id $CONTRACT_ID \
    --source deployer \
    --network testnet \
    -- submit_proof \
    --player $ADMIN \
    --attestation_sig $ATTESTATION_SIG \
    --solution_hash $SOLUTION_HASH \
    --trial_id $trial_id \
    --round_id 1
  
  echo "Trial $trial_id completed"
  sleep 2
done
```

### Test 5: Verify King Assignment

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_king \
  --round_id 1
```

**Expected response:**
```
GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

(Should match your deployer address)

---

## ✅ Deployment Complete!

### Summary

- [x] Installed all tools (Bun, Stellar CLI, Noir, Rust)
- [x] Generated Ed25519 keypair
- [x] Compiled Noir circuit
- [x] Started backend server
- [x] Built Soroban contract
- [x] Deployed contract to testnet
- [x] Initialized contract
- [x] Tested proof generation
- [x] Tested contract submission
- [x] Verified king assignment

### Contract Details

```
Contract ID: $CONTRACT_ID
Network: Stellar Testnet
Backend URL: http://localhost:3030
Admin: $ADMIN
Required Trials: 7
```

### Next Steps

1. **Frontend Integration**:
   - Update API calls to use `http://localhost:3030/prove`
   - Parse attestation responses
   - Submit to contract via Freighter/Albedo wallet

2. **Production Deployment**:
   - Deploy backend to Heroku/Vercel/Railway
   - Use HSM for backend private key
   - Deploy frontend to Vercel/Netlify
   - Switch to Stellar mainnet

3. **Security Audit**:
   - Review backend key management
   - Test signature verification edge cases
   - Implement rate limiting
   - Add monitoring/logging

---

## 🐛 Troubleshooting

### Backend won't start: "Failed to load Noir circuit"

```bash
cd backend/noir-circuits/trial_proof
nargo compile
# Then restart backend
```

### Contract deployment fails: "Account not found"

```bash
# Ensure account is funded
stellar keys address deployer
# Visit https://laboratory.stellar.org/#account-creator?network=test
```

### Signature verification fails

```bash
# Check if public keys match
curl http://localhost:3030/public-key
stellar contract invoke --id $CONTRACT_ID --network testnet -- get_backend_pubkey
# If mismatch: redeploy contract
```

### "already initialized" error

```bash
# Contract can only be initialized once
# Either:
# 1. Use existing deployed contract
# 2. Deploy a new contract instance
```

---

## 📚 Reference Commands

### Backend Management

```bash
# Start backend
cd backend/zk-server && bun run dev

# View logs
cd backend/zk-server && bun run dev | bunyan

# Restart backend
pkill -f "bun run dev" && bun run dev
```

### Contract Management

```bash
# Redeploy contract
cd contracts/throne-noir
stellar contract deploy --wasm throne_noir.optimized.wasm --source deployer --network testnet

# Call contract methods
stellar contract invoke --id $CONTRACT_ID --network testnet -- <method> <args>
```

### Testing

```bash
# Local proof verification
cd backend/noir-circuits/trial_proof
nargo prove && nargo verify

# Backend health check
curl http://localhost:3030/health

# Contract state query
stellar contract invoke --id $CONTRACT_ID --network testnet -- get_round_state --round_id 1
```

---

**🎉 Congratulations!** Your Noir ZK + Soroban system is now live on Stellar testnet!
