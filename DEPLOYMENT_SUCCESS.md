# 🎉 ZK-THRONE DEPLOYMENT COMPLETE

**Deployed on February 21, 2026**

---

## 📋 Deployment Summary

### ✅ Contract Deployed

- **Contract ID**: `CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI`
- **Network**: Stellar Testnet
- **WASM Size**: 4,884 bytes (optimized from 5,781 bytes)
- **Explorer**: https://stellar.expert/explorer/testnet/contract/CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI

### 🔑 Accounts Created

#### Deployer Account
- **Alias**: `deployer`
- **Public Key**: `GAYY2F3OZCLIREXCCKHVR22XUUOJTKG2BXQPMPV5PS67VYKVQD5B736E`
- **Role**: Contract admin, can manage rounds
- **Status**: ✅ Funded on testnet

#### Backend Account  
- **Alias**: `backend`
- **Public Key**: `GAUXYHLV65LYUIRK7QDQKAVSDGG7F4PV2HZFW2OVIUXINIWQGG2BGK5V`
- **Secret Key**: `SDYQGKMJHLKHOWDJ75PEAVTEYUIR2VFJNTXJW3OJQ5FXTOCGXTTTE33A` (stored in .env)
- **Raw Public Key (hex)**: `297c1d75f7578a222afc070502b2198df2f1f5d1f25b69d5452e86a2d031b413`
- **Role**: Proof attestation signing authority
- **Security**: ⚠️ **KEEP BACKEND SECRET KEY PRIVATE!**

### ⚙️ Contract Configuration

- **Required Trials**: 7 (player must complete 7 trials to become king)
- **Current Round**: 1
- **Round Status**: Unlocked (ready for submissions)
- **Backend Public Key**: Stored in contract for signature verification

---

## 🗂️ Project Structure

### Smart Contract
```
contracts/throne-noir/
├── src/lib.rs           ✅ Built and deployed
├── Cargo.toml           ✅ Configured
└── target/
    └── wasm32-unknown-unknown/release/
        ├── throne.wasm          (5.7KB)
        └── throne.optimized.wasm (4.9KB) ← DEPLOYED
```

### Backend Server
```
backend/zk-server/
├── .env                 ✅ Configured with:
│                            - BACKEND_SECRET
│                            - CONTRACT_ID  
│                            - PORT=3030
├── config.js            ✅ Server configuration
├── index.js             ✅ Express HTTP server
├── services/
│   ├── attestationService.js  ✅ Ed25519 signing
│   ├── verifyService.js       ✅ Barretenberg CLI verification
│   ├── proofService.js        ✅ Proof generation
│   └── nonceService.js        ✅ Replay protection
└── routes/
    └── submitSolution.js      ✅ Main API endpoint
```

### Noir Circuit
```
backend/noir-circuits/trial_proof/
├── src/main.nr          ✅ Pedersen hash circuit
├── Nargo.toml           ✅ Package config
└── target/throne.json   (generated after `nargo compile`)
```

---

## 🚀 Next Steps

### 1. Compile Noir Circuit

```bash
cd backend/noir-circuits/trial_proof
nargo compile
```

This will generate:
- `target/throne.json` (circuit bytecode)

Then generate Barretenberg keys:
```bash
bb write_vk -b ./target/throne.json -o ./verification_key
bb write_pk -b ./target/throne.json -o ./proving_key
```

### 2. Install Backend Dependencies

```bash
cd backend/zk-server
npm install
```

Required packages:
- `@stellar/stellar-sdk` (Ed25519 signing)
- `express` (HTTP server)
- `cors` (cross-origin)
- `dotenv` (environment variables)

### 3. Start Backend Server

```bash
cd backend/zk-server
npm run dev
```

Server will start on `http://localhost:3030`

Endpoints:
- `GET /health` - Health check
- `GET /public-key` - Get backend public key
- `POST /submit-solution` - Submit trial solution

### 4. Test End-to-End Flow

#### Step 1: Submit Solution to Backend

```bash
curl -X POST http://localhost:3030/submit-solution \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "test_secret_123",
    "player": "GAYY2F3OZCLIREXCCKHVR22XUUOJTKG2BXQPMPV5PS67VYKVQD5B736E",
    "roundId": 1
  }'
```

**Response:**
```json
{
  "success": true,
  "attestation": {
    "signature": "base64_signature...",
    "solutionHash": "0xabc123...",
    "nonce": 1,
    "roundId": 1,
    "player": "GAYY..."
  }
}
```

#### Step 2: Submit Attestation to Contract

```bash
stellar contract invoke \
  --id CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI \
  --source deployer \
  --network testnet \
  -- submit_proof \
  --player GAYY2F3OZCLIREXCCKHVR22XUUOJTKG2BXQPMPV5PS67VYKVQD5B736E \
  --solution_hash <HASH_FROM_RESPONSE> \
  --signature <SIGNATURE_FROM_RESPONSE> \
  --nonce 1
```

#### Step 3: Check Player Progress

```bash
stellar contract invoke \
  --id CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI \
  --source deployer \
  --network testnet \
  -- get_progress \
  --player GAYY2F3OZCLIREXCCKHVR22XUUOJTKG2BXQPMPV5PS67VYKVQD5B736E
```

**Expected:** `1` (one trial completed)

#### Step 4: Complete 7 Trials to Become King

Repeat steps 1-2 with different solutions and incrementing nonces (2-7).

#### Step 5: Verify King Assignment

```bash
stellar contract invoke \
  --id CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI \
  --source deployer \
  --network testnet \
  -- get_king
```

**Expected:** `GAYY2F3OZCLIREXCCKHVR22XUUOJTKG2BXQPMPV5PS67VYKVQD5B736E`

---

## 🔐 Security Notes

### Backend Secret Key

- ⚠️ **CRITICAL**: The backend secret key `SDYQGKMJHLKHOWDJ75PEAVTEYUIR2VFJNTXJW3OJQ5FXTOCGXTTTE33A` is stored in `.env`
- ✅ `.env` is in `.gitignore` (never commit)
- 🔒 For production: Use AWS KMS, HashiCorp Vault, or HSM

### Signature Scheme

- **Algorithm**: Ed25519 (Curve25519)
- **Signature Size**: 64 bytes
- **Public Key Size**: 32 bytes
- **Hash**: SHA-256 over (roundId + player + solutionHash + nonce)

### Trust Model

- Backend is the **trusted authority** for proof verification
- Contract **trusts backend signatures** (verifies Ed25519)
- Nonce system prevents **replay attacks**
- Each solution hash must be unique per player per round

---

## 📊 Architecture Flow

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

**Flow:**
1. Player submits solution to backend
2. Backend generates ZK proof (Noir + Barretenberg)
3. Backend verifies proof locally
4. Backend signs attestation (Ed25519)
5. Frontend submits attestation to contract
6. Contract verifies signature with stored backend public key
7. Contract increments player progress
8. If progress == 7: Assign king and lock round

---

## 🛠️ Tools Reference

### Stellar CLI Commands

```bash
# View contract
stellar contract inspect --id <CONTRACT_ID> --network testnet

# View account
stellar keys show <ALIAS>

# Query contract
stellar contract invoke --id <ID> --source <ACCOUNT> --network testnet -- <METHOD> <ARGS>
```

### Noir Commands

```bash
# Compile circuit
nargo compile

# Generate proof
nargo prove

# Verify proof
nargo verify
```

### Barretenberg Commands

```bash
# Generate verification key
bb write_vk -b ./target/throne.json -o ./verification_key

# Generate proving key
bb write_pk -b ./target/throne.json -o ./proving_key

# Generate proof
bb prove -b <circuit.json> -w <witness.tr> -o <proof>

# Verify proof
bb verify -k <verification_key> -p <proof>
```

---

## 📖 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [backend/NOIR_QUICK_START.md](backend/NOIR_QUICK_START.md) - Noir architecture guide
- [contracts/throne-noir/src/lib.rs](contracts/throne-noir/src/lib.rs) - Contract source

---

## 🎯 Success Criteria

- [x] Contract deployed to testnet
- [x] Contract initialized with backend public key  
- [x] Backend keypair generated
- [x] .env configured with secrets
- [ ] Noir circuit compiled (run `nargo compile`)
- [ ] Barretenberg keys generated (run `bb write_vk/write_pk`)
- [ ] Backend server tested (run `npm run dev`)
- [ ] End-to-end flow verified (7 trials → king assignment)

---

## 💡 Troubleshooting

### Contract "InvalidAction" error
- Check that backend_pubkey is raw 32-byte hex (not G... address)
- Use `node get-raw-key.js` to extract raw key from secret

### Backend signature verification fails
- Ensure message format matches: roundId + player + solutionHash + nonce
- Check that backend secret matches deployed public key

### Nonce error
- Nonce must increment: each submission needs nonce > last_nonce
- Backend tracks nonces in-memory (restart = reset)
- Contract tracks nonces persistently

---

**Deployment completed successfully! 🎉**

Contract: `CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI`  
Network: Stellar Testnet  
Status: ✅ Ready for testing
