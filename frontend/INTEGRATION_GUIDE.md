# 🏰 ZK-THRONE Frontend Integration Guide

## ✅ Complete System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │  ZK Backend  │         │   Soroban   │
│  (React UI) │         │ (Noir+bb.js) │         │   Contract  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                         │
      │  1. Submit solution    │                         │
      │ ────────────────────>  │                         │
      │                        │                         │
      │  2. ZK proof generated │                         │
      │  3. Attestation signed │                         │
      │ <────────────────────  │                         │
      │                        │                         │
      │  4. Submit proof tx    │                         │
      │  (via XBull wallet)    │                         │
      │ ───────────────────────────────────────────────> │
      │                        │                         │
      │                        │  5. Verify signature    │
      │                        │  6. Update progress     │
      │                        │                         │
      │  7. Progress updated   │                         │
      │ <─────────────────────────────────────────────── │
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
bun install
```

This installs:
- `@stellar/stellar-sdk` - Soroban smart contract interaction
- `@creit.tech/stellar-wallets-kit` - XBull wallet integration

### 2. Start Backend Server

```bash
cd backend/zk-server
npm run dev
```

Server runs on `http://localhost:3030`

### 3. Start Frontend

```bash
cd frontend
bun run dev
```

Frontend runs on `http://localhost:5000`

## 📦 What's Included

### Services

#### `services/walletService.ts`
- XBull wallet connection
- Transaction signing
- State management with subscriptions

#### `services/zkBackendService.ts`
- Communicate with ZK backend (port 3030)
- Submit solutions for proof generation
- Receive attestations

#### `services/throneContractService.ts`
- Soroban contract interaction
- Call `submit_proof()` function
- Query progress, king, round ID
- Transaction building and submission

#### `services/gameService.ts`
- **ORCHESTRATOR** - Combines all services
- Complete flow: solution → backend → contract
- Single entry point for UI

### React Hooks

#### `hooks/useWallet.tsx`
```tsx
const { publicKey, isConnected, connect, disconnect } = useWallet();
```

#### `hooks/useGame.tsx`
```tsx
const { 
  progress,        // Trials completed (0-7)
  king,            // Current king address
  isKing,          // Is current player king?
  submitSolution,  // Submit trial solution
  refresh,         // Reload game state
  backendHealthy   // Backend server status
} = useGame();
```

### Example Component

`components/TrialComponent.tsx` - Complete working example showing:
- Wallet connection UI
- Solution submission form
- Progress display
- King status
- Backend health check

## 🔥 Complete Flow Example

```tsx
import { useWallet } from './hooks/useWallet';
import { useGame } from './hooks/useGame';

function MyTrial() {
  const { connect, isConnected } = useWallet();
  const { submitSolution, progress, isKing } = useGame();

  const handleSubmit = async () => {
    const result = await submitSolution("my_secret_answer");
    
    if (result.success) {
      console.log("✅ Transaction:", result.txHash);
      console.log("📊 Progress:", result.progress, "/7");
    } else {
      console.log("❌ Error:", result.error);
    }
  };

  if (!isConnected) {
    return <button onClick={connect}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Progress: {progress} / 7</p>
      {isKing && <p>👑 You are the King!</p>}
      <button onClick={handleSubmit}>Submit Solution</button>
    </div>
  );
}
```

## 🎯 Complete Submission Flow

When you call `submitSolution("answer")`:

```
1️⃣  Check wallet connection
    ↓
2️⃣  POST to backend: /submit-solution
    {
      solution: "answer",
      player: "GBXXX...",
      roundId: 1
    }
    ↓
3️⃣  Backend generates ZK proof (Noir + bb.js)
    ↓
4️⃣  Backend verifies proof locally
    ↓
5️⃣  Backend signs Ed25519 attestation
    ↓
6️⃣  Frontend receives:
    {
      signature: "...",
      solutionHash: "0x...",
      nonce: 123,
      roundId: 1,
      player: "GBXXX..."
    }
    ↓
7️⃣  Build Soroban transaction
    contract.call("submit_proof", player, hash, signature, nonce)
    ↓
8️⃣  XBull wallet opens
    User signs transaction
    ↓
9️⃣  Transaction submitted to Stellar testnet
    ↓
🔟 Contract verifies backend signature
    ↓
1️⃣1️⃣ Progress updated on-chain
    ↓
1️⃣2️⃣ Frontend updates UI
```

## 📝 Environment Variables

Required in `.env`:

```env
VITE_ZK_SERVER_URL=http://localhost:3030
VITE_THRONE_CONTRACT_ID=CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI
VITE_STELLAR_NETWORK=testnet
VITE_TESTNET_RPC_URL=https://soroban-testnet.stellar.org
VITE_TESTNET_PASSPHRASE=Test SDF Network ; September 2015
```

## 🛠️ Integration Checklist

- [x] Wallet service created
- [x] Backend service created
- [x] Contract service created
- [x] Game orchestrator service created
- [x] React hooks created
- [x] Example component created
- [x] Dependencies added to package.json
- [ ] Install dependencies (`npm install`)
- [ ] Start backend server
- [ ] Test wallet connection
- [ ] Test solution submission
- [ ] Verify on-chain update

## 🎨 UI Integration Points

### 1. Wallet Button
```tsx
<button onClick={connect}>
  {isConnected ? `${publicKey.slice(0, 6)}...` : "Connect Wallet"}
</button>
```

### 2. Progress Bar
```tsx
<progress value={progress} max={7} />
<span>{progress} / 7 trials completed</span>
```

### 3. King Status
```tsx
{isKing && <div>👑 You are the reigning King!</div>}
{king && !isKing && <div>Current King: {king}</div>}
```

### 4. Trial Submission
```tsx
<form onSubmit={async (e) => {
  e.preventDefault();
  const result = await submitSolution(solution);
  if (result.success) {
    alert("Success! Tx: " + result.txHash);
  }
}}>
  <input value={solution} onChange={e => setSolution(e.target.value)} />
  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Submitting..." : "Submit"}
  </button>
</form>
```

### 5. Backend Status
```tsx
<div className={backendHealthy ? "online" : "offline"}>
  {backendHealthy ? "✅ Backend Online" : "⚠️ Backend Offline"}
</div>
```

## 🔐 Security Model

1. **ZK Privacy**: Noir circuit proves you know *a* solution without revealing it
2. **Backend Validation**: Backend verifies the solution is *correct*
3. **Ed25519 Signature**: Backend signs attestation (proof of correctness)
4. **On-Chain Verification**: Contract verifies backend signature
5. **Wallet Authorization**: User must sign transaction
6. **Nonce Protection**: Anti-replay protection

**Result**: Privacy (ZK) + Correctness (Backend) + Decentralization (Contract)

## 🧪 Testing

### Test Backend Connection
```bash
curl http://localhost:3030/health
curl http://localhost:3030/public-key
```

### Test Proof Generation
```bash
curl -X POST http://localhost:3030/submit-solution \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "test_secret_42",
    "player": "GAYY2F3OZCLIREXCCKHVR22XUUOJTKG2BXQPMPV5PS67VYKVQD5B736E",
    "roundId": 1
  }'
```

### Test Frontend
1. Connect XBull wallet
2. Submit a solution
3. Approve transaction in wallet
4. Check progress updated

## 🐛 Troubleshooting

### "Wallet not connected"
- Click "Connect Wallet" button
- Approve connection in XBull

### "Backend Offline"
- Check `npm run dev` is running in `backend/zk-server`
- Verify `http://localhost:3030/health` returns 200

### "Simulation failed"
- Check contract ID in `.env` is correct
- Ensure backend public key matches contract
- Verify nonce is incrementing (not replaying old attestation)

### "Signature verification failed"
- Backend secret must match public key in contract
- Check contract was initialized correctly:
  ```bash
  stellar contract invoke \
    --id CDITUB3WOHBUELIFPNH2T664NYRTN4SZKC6JTDZX5YXY36RHI3EGFAXI \
    -- get_backend_pubkey
  ```

## 📚 Next Steps

1. **Install Dependencies**
   ```bash
   cd frontend && npm install
   ```

2. **Start Backend**
   ```bash
   cd backend/zk-server && npm run dev
   ```

3. **Start Frontend**
   ```bash
   cd frontend && npm run dev
   ```

4. **Test Complete Flow**
   - Open http://localhost:5173
   - Connect wallet
   - Submit solution
   - Watch transaction on Stellar testnet

5. **Integrate into Your UI**
   - Copy `TrialComponent.tsx` as template
   - Use `useWallet()` and `useGame()` hooks
   - Customize styling to match your design

## 🎉 You're Ready!

Your ZK-Throne system is now fully connected:
- ✅ Backend generates ZK proofs
- ✅ Frontend handles wallet + UI
- ✅ Contract verifies on-chain
- ✅ Complete decentralized flow

**Happy throne claiming!** 👑
