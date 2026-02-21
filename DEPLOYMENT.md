# 🚀 ZK-THRONE DEPLOYMENT GUIDE

**Complete deployment for Noir + Barretenberg CLI + Soroban architecture**

---

## Prerequisites

### Required Tools

1. **Noir + Nargo** (circuit compiler)
   ```bash
   curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
   noirup --version 0.32.0
   nargo --version
   ```

2. **Barretenberg CLI** (`bb` binary)
   ```bash
   # Install from Aztec's releases
   curl -L https://github.com/AztecProtocol/aztec-packages/releases/download/barretenberg-v0.32.0/bb-x86_64-linux -o bb
   chmod +x bb
   sudo mv bb /usr/local/bin/
   bb --version
   ```

3. **Stellar CLI** (contract deployment)
   ```bash
   curl -L https://github.com/stellar/stellar-cli/releases/download/v25.1.0/stellar-cli-25.1.0-x86_64-unknown-linux-gnu.tar.gz | tar -xz
   sudo mv stellar /usr/local/bin/
   stellar --version
   ```

4. **Node.js 18+** and **npm**
   ```bash
   node --version
   npm --version
   ```

5. **Rust + wasm32 target**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add wasm32-unknown-unknown
   ```

---

## Step 1: Clone Repository

```bash
git clone <repo-url>
cd zk-throne
```

---

## Step 2: Generate Backend Keypair

The backend needs a Stellar keypair for signing attestations.

### Option A: Generate New Keypair

```bash
# Using Stellar CLI
stellar keys generate backend --network testnet

# View the secret key
stellar keys show backend

# View the public key
stellar keys address backend
```

**Save both keys securely:**
- Secret Key (S...): Add to `.env` as `BACKEND_SECRET`
- Public Key (G...): Use for contract initialization

### Option B: Use Existing Keypair

If you already have a Stellar account:
```bash
stellar keys add backend --secret-key SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Step 3: Fund Testnet Account (For Deployment)

Create a deployer account:
```bash
stellar keys generate deployer --network testnet
```

Fund it via Stellar Laboratory:
https://laboratory.stellar.org/#account-creator?network=test

Verify balance:
```bash
stellar keys address deployer | xargs -I {} curl "https://horizon-testnet.stellar.org/accounts/{}"
```

---

## Step 4: Compile Noir Circuit

```bash
cd backend/noir-circuits/trial_proof

# Compile circuit
nargo compile

# Expected output: target/throne.json
```

### Generate Proving and Verification Keys

```bash
# Generate verification key
bb write_vk -b ./target/throne.json -o ./verification_key

# Generate proving key
bb write_pk -b ./target/throne.json -o ./proving_key
```

**Expected files:**
- `target/throne.json` (circuit bytecode)
- `verification_key` (for bb verify)
- `proving_key` (for bb prove)

---

## Step 5: Configure Backend

```bash
cd backend/zk-server

# Create .env file
cat > .env << EOF
BACKEND_SECRET=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
PORT=3030
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org:443
BB_PATH=bb
EOF
```

**Important:** Replace `BACKEND_SECRET` with your actual secret key from Step 2.

### Install Dependencies

```bash
npm install
```

### Test Backend (Optional)

```bash
# Start server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:3030/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "zk-throne-backend",
  "publicKey": "GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "network": "testnet"
}
```

---

## Step 6: Build Soroban Contract

```bash
cd contracts/throne-noir

# Build contract
cargo build --target wasm32-unknown-unknown --release

# Optimize WASM
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/throne.wasm
```

**Expected output:**
- `target/wasm32-unknown-unknown/release/throne.wasm` (~20KB)
- `throne.optimized.wasm` (~14KB)

---

## Step 7: Deploy Contract to Testnet

```bash
cd contracts/throne-noir

# Deploy
stellar contract deploy \
  --wasm throne.optimized.wasm \
  --source deployer \
  --network testnet

# Save the contract ID
export CONTRACT_ID=<output_contract_id>
```

**Example output:**
```
Deploying contract...
Contract ID: CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI
```

---

## Step 8: Initialize Contract

Get the backend public key:
```bash
stellar keys address backend
```

Initialize the contract:
```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address deployer) \
  --backend_pubkey <BACKEND_PUBLIC_KEY_FROM_STEP_2> \
  --required_trials 7
```

**Example:**
```bash
stellar contract invoke \
  --id CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --backend_pubkey GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --required_trials 7
```

### Verify Initialization

```bash
# Check backend public key
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_backend_pubkey

# Check round state
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- is_locked
```

---

## Step 9: Update Environment Files

### Backend .env

```bash
echo "CONTRACT_ID=$CONTRACT_ID" >> backend/zk-server/.env
```

### Frontend .env (if applicable)

```bash
cat > frontend/.env << EOF
VITE_CONTRACT_ID=$CONTRACT_ID
VITE_BACKEND_URL=http://localhost:3030
VITE_STELLAR_NETWORK=testnet
EOF
```

---

## Step 10: Test End-to-End Flow

### Start Backend Server

```bash
cd backend/zk-server
npm run dev
```

### Submit a Solution

```bash
curl -X POST http://localhost:3030/submit-solution \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "test_secret_123",
    "player": "'"$(stellar keys address deployer)"'",
    "roundId": 1
  }'
```

**Expected response:**
```json
{
  "success": true,
  "attestation": {
    "signature": "base64_encoded_signature...",
    "solutionHash": "0xabc123...",
    "nonce": 1,
    "roundId": 1,
    "player": "GBXX..."
  }
}
```

### Submit to Contract

Extract the attestation data and submit:

```bash
export ATTESTATION_SIG="<signature_from_response>"
export SOLUTION_HASH="<solutionHash_from_response>"
export NONCE=1

stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- submit_proof \
  --player $(stellar keys address deployer) \
  --solution_hash $SOLUTION_HASH \
  --signature $ATTESTATION_SIG \
  --nonce $NONCE
```

### Check Progress

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_progress \
  --player $(stellar keys address deployer)
```

**Expected:** `1` (one trial completed)

### Complete 7 Trials to Become King

Repeat the flow with different solutions:

```bash
for i in {2..7}; do
  echo "Trial $i..."
  
  # Submit solution to backend
  RESPONSE=$(curl -s -X POST http://localhost:3030/submit-solution \
    -H "Content-Type: application/json" \
    -d "{\"solution\":\"secret_$i\",\"player\":\"$(stellar keys address deployer)\",\"roundId\":1}")
  
  # Extract attestation
  SIGNATURE=$(echo $RESPONSE | jq -r '.attestation.signature')
  HASH=$(echo $RESPONSE | jq -r '.attestation.solutionHash')
  NONCE=$(echo $RESPONSE | jq -r '.attestation.nonce')
  
  # Submit to contract
  stellar contract invoke \
    --id $CONTRACT_ID \
    --source deployer \
    --network testnet \
    -- submit_proof \
    --player $(stellar keys address deployer) \
    --solution_hash $HASH \
    --signature $SIGNATURE \
    --nonce $NONCE
  
  sleep 2
done
```

### Verify King

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_king
```

**Expected:** Your deployer address (after 7 trials)

### Verify Round Locked

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- is_locked
```

**Expected:** `true`

---

## 🎉 Deployment Complete!

### Summary

✅ Noir circuit compiled  
✅ Barretenberg keys generated  
✅ Backend server running  
✅ Contract deployed to testnet  
✅ Contract initialized with backend public key  
✅ End-to-end flow tested  
✅ King assigned after 7 trials

---

## Production Checklist

Before deploying to mainnet:

### Backend Security

- [ ] Use AWS KMS or HSM for backend secret key
- [ ] Implement rate limiting (prevent spam)
- [ ] Add authentication (API keys or JWT)
- [ ] Enable HTTPS (TLS certificates)
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Add database for nonce persistence (replace in-memory Map)

### Contract Security

- [ ] Audit by Stellar security team
- [ ] Test all edge cases (nonce overflow, replay attacks)
- [ ] Add admin functions (emergency pause, round reset)
- [ ] Set appropriate gas limits
- [ ] Test with multiple concurrent players

### Infrastructure

- [ ] Deploy backend to cloud (AWS, Heroku, Railway)
- [ ] Use environment variable manager (Doppler, AWS Secrets Manager)
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Configure DNS and load balancing
- [ ] Enable logging and alerting

### Testing

- [ ] Load testing (1000+ concurrent requests)
- [ ] Signature verification edge cases
- [ ] Nonce wraparound handling
- [ ] Network failure recovery
- [ ] Frontend wallet integration (xBull, Albedo)

---

## Troubleshooting

### Circuit compilation fails

```bash
# Check nargo version
nargo --version

# Update to 0.32.0
noirup --version 0.32.0

# Clean and rebuild
rm -rf target
nargo compile
```

### bb keys generation fails

```bash
# Check bb binary exists
bb --version

# Ensure circuit is compiled first
nargo compile

# Regenerate keys
bb write_vk -b ./target/throne.json -o ./verification_key
bb write_pk -b ./target/throne.json -o ./proving_key
```

### Backend signature verification fails

```bash
# Check backend public key matches contract
stellar contract invoke --id $CONTRACT_ID --network testnet -- get_backend_pubkey

# Compare with backend key
stellar keys address backend

# If mismatch: redeploy contract with correct key
```

### Nonce error on submission

```bash
# Check current nonce
stellar contract invoke --id $CONTRACT_ID --network testnet -- get_nonce --player <PLAYER>

# Backend nonce is in-memory - restart backend to reset
# Or use the next nonce value from contract + 1
```

### Contract deployment fails

```bash
# Check deployer balance
stellar keys address deployer | xargs -I {} curl "https://horizon-testnet.stellar.org/accounts/{}"

# Fund account if needed
# https://laboratory.stellar.org/#account-creator?network=test

# Check WASM size (<200KB)
ls -lh throne.optimized.wasm
```

---

## Architecture Reference

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Player    │─────▶│  Backend Server  │─────▶│  Soroban    │
│   (xBull)   │      │  (Node.js)       │      │  Contract   │
└─────────────┘      └──────────────────┘      └─────────────┘
                              │
                     ┌────────┴────────┐
                     │                 │
              ┌──────▼──────┐   ┌─────▼──────┐
              │ Noir Circuit│   │ Attestation│
              │ (Pedersen)  │   │  (Ed25519) │
              └─────────────┘   └────────────┘
```

---

## Contact

For issues or questions:
- GitHub Issues: <repo-url>/issues
- Documentation: See `/docs` folder
- Contract: https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID
