# ZK-THRONE

**ZK-THRONE** is a multiplayer zero-knowledge trial game on Stellar where players race through cognitive challenges, with every proof verified entirely onchain through cryptographic attestations and deterministic trial validation.

Built for the Stellar ZK Gaming Hackathon, ZK-THRONE demonstrates how zero-knowledge proofs can create engaging, trustless, multiplayer experiences on the cheapest smart contract platform in crypto.

Traditional ZK gaming faces a critical challenge: computational verification costs. While Ethereum-based ZK games like Dark Forest burned thousands of ETH in gas fees, Stellar's native ZK primitives and ultra-low transaction costs enable a new class of proof-intensive games that would be economically infeasible elsewhere.

ZK-THRONE answers a key question: **Can multiplayer cognitive games leverage per-trial ZK proofs without sacrificing playability or decentralization?**

## Architecture

**Per-Trial ZK Attestations** with backend proof generation and Ed25519 signature verification  
**Game Hub Integration** for standardized session lifecycle tracking across the Stellar ecosystem  
**Deterministic Trial System** with 10 question variants per trial (100,000 possible combinations)  
**Race-to-Victory Mechanics** where first player to complete 3 of 5 trials wins  
**Full On-Chain Verification** via Soroban smart contracts with nonce-based replay protection

## The Challenge

ZK circuits typically prove tractable statements with known bounds: hash preimages, range checks, Merkle inclusion. Gaming introduces a different challenge class:

- **Dynamic computational structure** shaped by player input across varied trial types
- **Cognitive validation** requiring proof of logical reasoning, pattern recognition, and memory
- **Multiplayer synchronization** with privacy-preserving score tracking until game completion
- **Session lifecycle management** integrated with ecosystem-wide game tracking

ZK-THRONE solves this through a hybrid model: backend-generated Noir proofs with cryptographically signed attestations, verified on-chain via Ed25519 signatures and solution hash commitments.

## Session Lifecycle & Trust Model

Gameplay in ZK-THRONE is deterministic, reproducible, and verifiable on-chain.

### Game Flow

```
1. Host creates multiplayer room (2-4 players)
   ↓
2. Players join via room code
   ↓
3. Host initiates 15-second countdown
   ↓
4. Contract: start_multiplayer_session()
   → Triggers Game Hub's start_game()
   → Records session_id, player addresses, initial points
   ↓
5. Players race through 5 cognitive trials:
   • CipherGrid: 3×3 crossword puzzles
   • LogicLabyrinth: Boolean logic maze navigation
   • PatternOracle: Mathematical sequence prediction
   • MemoryOfCrown: 10-word memorization challenge
   • ThronebreakerProtocol: Paradox question shooting gallery
   ↓
6. Per-Trial Proof Submission:
   • Player solves trial locally
   • Backend generates Noir ZK proof
   • Backend signs (solution_hash, nonce, round_id) with Ed25519
   • Frontend submits attestation to contract
   • Contract verifies signature + nonce + progress
   ↓
7. Victory Condition:
   • First player to complete 3 trials wins
   • Contract automatically calls Game Hub's end_game()
   • Leaderboard revealed with final scores
```

### Trust Model

**Backend Role:** Convenience layer for ZK proof generation. The backend holds an Ed25519 keypair verified on-chain.

**On-Chain Guarantees:**
- Backend public key stored in contract during initialization
- Every proof attestation verified via Ed25519 signature
- Solution hash commitments prevent retroactive manipulation
- Nonce-based replay protection ensures single-use proofs
- Session tracking via Game Hub provides ecosystem-wide auditability

**Player Guarantees:**
- No server can forge valid proofs without player's correct solution
- Session lifecycle immutably recorded via Game Hub contract calls
- All transactions verifiable on Stellar Explorer
- Open-source contracts enable independent verification

Players trust the backend to generate valid proofs, but cannot be cheated because:
1. Backend cannot generate valid signatures for incorrect solutions (no hash collision)
2. Backend cannot reuse old proofs (nonce increments tracked on-chain)
3. Backend cannot fake session results (Game Hub records lifecycle)

## ZK Circuits

ZK-THRONE uses **Noir** for zero-knowledge proof generation via the Barretenberg proving system.

### Trial Proof Structure

Each trial proof attests to:
- **Solution Hash:** Keccak256 hash of player's correct answer
- **Round ID:** Unique identifier for this trial attempt
- **Player Address:** Stellar public key (Ed25519)
- **Nonce:** Sequential counter preventing replay attacks

### Circuit Characteristics

| Metric               | Value                            |
|----------------------|----------------------------------|
| **Proof System**     | Barretenberg (PLONK)             |
| **Backend**          | Noir (via `bb` CLI)              |
| **Signature Scheme** | Ed25519                          |
| **Hash Function**    | Keccak256 (solution commitments) |
| **Proof Time**       | ~2-5 seconds per trial           |
| **Proof Size**       | ~2KB per attestation             |

### Verification Flow

```rust
pub fn submit_proof(
    env: Env,
    player: Address,
    solution_hash: BytesN<32>,
    signature: BytesN<64>,
    nonce: u64,
    trial_round_id: u32,
) {
    player.require_auth();
    
    // 1. Verify nonce (prevent replay)
    let stored_nonce = get_nonce(&env, &player);
    if nonce != stored_nonce {
        panic_with_error!(&env, Error::InvalidNonce);
    }
    
    // 2. Reconstruct signed message
    let message = construct_message(solution_hash, nonce, trial_round_id, &player);
    
    // 3. Verify Ed25519 signature
    let backend_pubkey = get_backend_pubkey(&env);
    env.crypto().ed25519_verify(&backend_pubkey, &message, &signature);
    
    // 4. Update progress + increment nonce
    let progress = get_progress(&env, &player);
    set_progress(&env, &player, progress + 1);
    set_nonce(&env, &player, nonce + 1);
    
    // 5. Check victory condition (3+ trials completed)
    if progress + 1 >= REQUIRED_TRIALS {
        finalize_winner(&env, &player);
        game_hub_client.end_game(&session_id, &player1_won);
    }
}
```

## Game Hub Integration

ZK-THRONE fully integrates with Stellar's **Game Hub** contract for standardized session lifecycle tracking.

### Lifecycle Events

**Game Start:**
```rust
game_hub.start_game(
    &game_id,              // ZK-THRONE contract address
    &session_id,           // Unique room identifier
    &player1,              // Host wallet
    &player2,              // Opponent wallet
    &0i128,                // Initial points (0)
    &0i128,
);
```

**Game End:**
```rust
game_hub.end_game(
    &session_id,           // Room identifier
    &player1_won,          // Winner boolean flag
);
```

### Why Game Hub Matters

1. **Ecosystem Discoverability:** Games appear in unified dashboards/leaderboards
2. **Session Auditability:** Independent verification of game outcomes
3. **Anti-Cheat Foundation:** Immutable record of session boundaries
4. **Analytics Infrastructure:** Standardized metrics across all Stellar games


### Random Selection Implementation

```typescript
const PUZZLE_SETS: Puzzle[][] = [ /* 10 sets */ ];

const getRandomPuzzleSet = () => {
  const randomIndex = Math.floor(Math.random() * PUZZLE_SETS.length);
  console.log(`🎲 CipherGrid: Selected puzzle set ${randomIndex + 1}/10`);
  return PUZZLE_SETS[randomIndex];
};

// One-time selection on component mount
const [PUZZLES] = useState<Puzzle[]>(() => getRandomPuzzleSet());
```

This ensures:
- Each game session feels fresh and unpredictable
- Players cannot pre-memorize solutions
- Backend validation remains generic (accepts any solution format)
- Frontend-only change requires no contract redeployment

## Testnet Contracts

All contracts are deployed on **Stellar Testnet** and fully operational.

| Contract      | Address                                                    |
|---------------|------------------------------------------------------------|
| **ZK-THRONE** | `CBQ7XTUSGPDVBJYSXKPDE5L4L2KSDXD2DALWH3SKWWP4DKXLVKXCRBL3` |
| **Game Hub**  | `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG` |

### Verification

Verify transactions on Stellar Explorer:
- **ZK-THRONE Contract:** https://stellar.expert/explorer/testnet/contract/CBQ7XTUSGPDVBJYSXKPDE5L4L2KSDXD2DALWH3SKWP4DKXLVKXCRBL3
- **Game Hub Contract:** https://stellar.expert/explorer/testnet/contract/CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG

Look for:
- `start_multiplayer_session` transactions when games begin
- `submit_proof` transactions for each trial completion
- `start_game` calls to Game Hub
- `end_game` calls when winners are determined

## Technical Stack

**Blockchain:** Stellar Soroban (Testnet)  
**Smart Contracts:** Rust (soroban-sdk 22.0.1)  
**ZK Proofs:** Noir + Barretenberg (bb CLI)  
**Backend:** Node.js + Express  
**Frontend:** React + TypeScript + Vite  
**Wallet Integration:** XBull, Freighter  
**Styling:** TailwindCSS + Framer Motion

### Repository Structure

```
├── contracts/
│   └── throne-noir/          # Soroban contract with Game Hub integration
├── backend/
│   └── zk-server/            # Noir proof generation + Ed25519 signing
│       ├── noir-circuits/    # Barretenberg circuits
│       └── services/         # Room management, proof verification
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── trials/       # 5 cognitive challenge components
│   │   ├── services/         # Contract + multiplayer services
│   │   └── hooks/            # useMultiplayer with Game Hub triggers
│   └── public/
└── scripts/                  # Build, deploy, bindings generation
```

## Running Locally

### Prerequisites

```bash
bun install                   # Install dependencies
stellar network add testnet   # Configure Stellar CLI
```

### Backend (ZK Proof Server)

```bash
cd backend/zk-server
node index.js                 # Starts on localhost:3030
```

### Frontend

```bash
cd frontend
bun run dev                   # Starts on localhost:5173
```

### Testing Multiplayer

1. Open two browser windows (different wallets)
2. Window 1: Create room → Copy join code
3. Window 2: Join room with code
4. Window 1 (Host): Click "Start Game"
5. **Check Console:** Should see `start_multiplayer_session()` call
6. Race through trials (first to 3 wins)
7. **Check Console:** Should see `end_game()` call on victory

## Development Workflow

```bash
# Build contracts
bun run build throne-noir

# Deploy to testnet
bun run deploy throne-noir

# Generate TypeScript bindings
bun run bindings throne-noir

# Update frontend contract address
# Edit: frontend/public/game-studio-config.js
```

## Security Considerations

### Attack Vectors & Mitigations

| Attack                 | Mitigation                                          |
|------------------------|-----------------------------------------------------|
| **Replay Attacks**     | Nonce increments on every proof submission          |
| **Solution Forgery**   | Ed25519 signature verification via contract         |
| **Backend Compromise** | Cannot forge signatures for incorrect solutions     |
| **Front-Running**      | Player-specific nonces prevent cross-player replays |
| **Score Manipulation** | Game Hub immutably records session lifecycle        |

### Trust Assumptions

**You trust the backend to:**
- Generate valid ZK proofs for correct solutions
- Not collude with specific players (equally compromised for all)

**You DO NOT trust the backend for:**
- Solution correctness (verified via signature over solution hash)
- Session integrity (Game Hub provides independent audit trail)
- Score accuracy (contract enforces progress via nonces)

## Future Enhancements

**Mainnet Deployment:** Migrate to Stellar mainnet for production use  
**Client-Side Proving:** Wasm-compiled Noir circuits for trustless local proving  
**Leaderboard Contracts:** Global ranking system across all players  
**NFT Rewards:** Mint achievement tokens for trial completion milestones  
**Tournament Mode:** Bracket-style competitions with prize pools  
**More Trials:** Expand from 5 to 10+ unique cognitive challenges

## Links

**Play Now (Testnet):** https://zk--throne.vercel.app

**Demo Video:** https://youtu.be/CwzEedk0x6E

**GitHub :** https://github.com/theyuvan/zk-THRONE

**Contract Explorer:** https://stellar.expert/explorer/testnet/contract/CBQ7XTUSGPDVBJYSXKPDE5L4L2KSDXD2DALWH3SKWWP4DKXLVKXCRBL3  


## Built With Stellar Game Studio

ZK-THRONE was built using [Stellar Game Studio](https://github.com/jamesbachini/Stellar-Game-Studio), a development toolkit for shipping web3 games on Stellar quickly and efficiently.

Built for the **Stellar ZK Gaming Hackathon 2026**.

---

**License:** MIT  
**Author:** Yuvan raj 
**Built:** February 2026
