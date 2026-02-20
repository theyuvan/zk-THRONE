# zk-Throne Migration to Stellar Game Studio

## Migration Steps

### Phase 1: Setup Studio (Complete these first)
1. ✅ Clone Stellar Game Studio (in parent folder)
2. ✅ Run `bun run setup`
3. ✅ Run `bun run create throne-game`

### Phase 2: Copy Files to Studio

After creating `throne-game` in the studio, copy files from this folder:

#### Frontend Files (copy to `games/throne-game/src/`)
```
src/components/        → games/throne-game/src/components/
src/hooks/            → games/throne-game/src/hooks/
src/lib/              → games/throne-game/src/lib/
src/pages/            → games/throne-game/src/pages/
src/types/            → games/throne-game/src/types/
src/test/             → games/throne-game/src/test/
src/zkVerifier.ts     → games/throne-game/src/zkVerifier.ts
src/App.tsx           → games/throne-game/src/App.tsx
src/App.css           → games/throne-game/src/App.css
src/index.css         → games/throne-game/src/index.css
```

#### Config Files (adapt to studio structure)
```
components.json       → games/throne-game/components.json
tailwind.config.ts    → games/throne-game/tailwind.config.ts
tsconfig.json         → games/throne-game/tsconfig.json
postcss.config.js     → games/throne-game/postcss.config.js
```

#### Public Assets
```
public/*              → games/throne-game/public/*
```

### Phase 3: Update Imports

After copying, update these files in the studio:

#### `games/throne-game/src/main.tsx`
Add global styles import:
```tsx
import './index.css'
```

#### `games/throne-game/src/App.tsx`
Update to include game state management with studio:
```tsx
import { useState, useEffect } from 'react'
import { useGameContract } from '@stellar-game-studio/hooks' // Studio hook
import './App.css'
// ... rest of your imports
```

### Phase 4: Create Contract Integration

Create `contracts/throne-game/src/lib.rs`:

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Address, Symbol, symbol_short};

#[contract]
pub struct ThroneGame;

#[derive(Clone)]
pub struct GameState {
    player: Address,
    trials_completed: u32,
    current_trial: u32,
    last_failed_timestamp: u64,
    mode: u32, // 1, 3, or 5 trials
}

#[contractimpl]
impl ThroneGame {
    pub fn start_game(env: Env, player: Address, mode: u32) {
        player.require_auth();
        // TODO: Call Game Hub start_game()
        
        let state = GameState {
            player: player.clone(),
            trials_completed: 0,
            current_trial: 0,
            last_failed_timestamp: 0,
            mode,
        };
        
        // Save state
        env.storage().instance().set(&symbol_short!("state"), &state);
    }
    
    pub fn submit_trial(env: Env, player: Address, trial_id: u32, proof: bool) -> bool {
        player.require_auth();
        
        // Get current state
        let mut state: GameState = env.storage().instance().get(&symbol_short!("state")).unwrap();
        
        // Check if player is locked out (2 min punishment)
        let current_time = env.ledger().timestamp();
        if current_time < state.last_failed_timestamp + 120 {
            return false; // Still locked
        }
        
        if proof {
            // Correct answer
            state.trials_completed += 1;
            state.current_trial += 1;
        } else {
            // Wrong answer - lock for 2 minutes
            state.last_failed_timestamp = current_time;
        }
        
        env.storage().instance().set(&symbol_short!("state"), &state);
        
        proof
    }
    
    pub fn end_game(env: Env, player: Address) {
        player.require_auth();
        // TODO: Call Game Hub end_game()
        
        // Clear state
        env.storage().instance().remove(&symbol_short!("state"));
    }
    
    pub fn get_state(env: Env, player: Address) -> GameState {
        env.storage().instance().get(&symbol_short!("state")).unwrap()
    }
}
```

### Phase 5: Update Package Dependencies

In `games/throne-game/package.json`, ensure these exist:
```json
{
  "dependencies": {
    "@stellar-game-studio/hooks": "latest",
    "@stellar-game-studio/contract-bindings": "latest",
    // ... your existing dependencies
  }
}
```

### Phase 6: Test

```bash
# From Stellar-Game-Studio root
bun run dev:game throne-game
```

Open: http://localhost:5173

### Phase 7: Deploy

```bash
# Deploy contract
bun run deploy throne-game

# Publish frontend
bun run publish throne-game
```

## File Structure After Migration

```
Stellar-Game-Studio/
├── contracts/
│   └── throne-game/
│       ├── src/
│       │   └── lib.rs          # Your smart contract
│       └── Cargo.toml
│
├── games/
│   └── throne-game/
│       ├── src/
│       │   ├── components/      # All your React components
│       │   ├── types/           # Game types
│       │   ├── zkVerifier.ts    # Mock ZK verifier
│       │   ├── App.tsx          # Main game app
│       │   ├── main.tsx         # Entry point
│       │   └── index.css        # Global styles
│       ├── public/              # Assets
│       ├── index.html
│       ├── package.json
│       └── tailwind.config.ts
│
└── zk-Throne/                   # Keep as backup/reference
```

## Important Notes

### ZK Verifier Integration
The `zkVerifier.ts` file is already created with mock implementation. Your friend will later replace:
```typescript
return true; // Mock
```
with real ZK verification.

### Contract Integration Points
In your React components, replace direct game logic with contract calls:

```typescript
import { verifyProof } from './zkVerifier'
import { useGameContract } from '@stellar-game-studio/hooks'

// In your component
const contract = useGameContract('throne-game')

async function handleTrialComplete(trialId: string, answer: any) {
  // Generate proof (mock for now)
  const proof = generateMockProof(trialId, answer)
  
  // Verify proof
  const isValid = await verifyProof(proof.proof, proof.publicSignals)
  
  // Submit to contract
  if (isValid) {
    await contract.submit_trial(player, trialId, isValid)
  }
}
```

### Punishment System
The 2-minute lockout is now handled by the smart contract's timestamp check.

### Keep Original as Backup
Don't delete the current `zk-Throne` folder until migration is complete and tested.
