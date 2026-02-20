# ✅ zk-Throne → Stellar Game Studio Migration Checklist

## Pre-Migration Setup

### 1. Prepare Your Environment
```bash
# Navigate to parent directory of current zk-Throne folder
cd ..

# Clone Stellar Game Studio
git clone https://github.com/YOUR_USERNAME/Stellar-Game-Studio.git
cd Stellar-Game-Studio
```

### 2. Setup Studio
```bash
bun run setup
```
⏱️ Wait for completion (this may take a few minutes)

### 3. Create Game Structure
```bash
bun run create throne-game
```

This creates:
- ✅ `contracts/throne-game/` 
- ✅ `games/throne-game/`

---

## Migration Phase

### 4. Copy Frontend Files

From `zk-Throne/src/` to `Stellar-Game-Studio/games/throne-game/src/`:

```bash
# Components
- [ ] Copy src/components/ → games/throne-game/src/components/
- [ ] Copy src/types/ → games/throne-game/src/types/
- [ ] Copy src/hooks/ → games/throne-game/src/hooks/
- [ ] Copy src/lib/ → games/throne-game/src/lib/
- [ ] Copy src/pages/ → games/throne-game/src/pages/

# Core files
- [ ] Copy src/zkVerifier.ts → games/throne-game/src/zkVerifier.ts
- [ ] Copy src/contractAdapter.ts → games/throne-game/src/contractAdapter.ts
- [ ] Copy src/App.tsx → games/throne-game/src/App.tsx
- [ ] Copy src/App.css → games/throne-game/src/App.css
- [ ] Copy src/index.css → games/throne-game/src/index.css

# Assets
- [ ] Copy public/* → games/throne-game/public/
```

### 5. Copy Config Files

```bash
- [ ] Copy components.json → games/throne-game/components.json
- [ ] Copy tailwind.config.ts → games/throne-game/tailwind.config.ts
- [ ] Copy postcss.config.js → games/throne-game/postcss.config.js
```

### 6. Copy Smart Contract

```bash
- [ ] Copy contract_template.rs → contracts/throne-game/src/lib.rs
```

### 7. Update Dependencies

In `games/throne-game/package.json`, add:
```json
{
  "dependencies": {
    "@stellar-game-studio/hooks": "latest",
    "@stellar-game-studio/contract-bindings": "latest"
  }
}
```

Then run:
```bash
cd games/throne-game
bun install
cd ../..
```

---

## Integration Phase

### 8. Update Imports in App.tsx

Replace mock imports with studio imports:

```typescript
// OLD (remove):
// import { useGameContract } from './contractAdapter'

// NEW (add):
import { useGameContract } from '@stellar-game-studio/hooks'
```

### 9. Update main.tsx

Ensure global styles are imported:
```typescript
import './index.css'
```

### 10. Configure Contract Build

In `contracts/throne-game/Cargo.toml`, verify:
```toml
[package]
name = "throne-game"
version = "0.1.0"
edition = "2021"

[dependencies]
soroban-sdk = "20.0.0"

[dev-dependencies]
soroban-sdk = { version = "20.0.0", features = ["testutils"] }
```

---

## Testing Phase

### 11. Test Local Development

```bash
# From Stellar-Game-Studio root
bun run dev:game throne-game
```

Open browser: `http://localhost:5173`

#### Test Checklist:
- [ ] Game loads without errors
- [ ] Can navigate between scenes (Throne Hall → Portal Room)
- [ ] Mode selection works (1/3/5 trials)
- [ ] Trial components render correctly
- [ ] Mock ZK verifier logs appear in console
- [ ] Punishment timer works (2 minutes)
- [ ] Game state persists during session

### 12. Test Contract Compilation

```bash
bun run build:contract throne-game
```

Should compile without errors.

---

## Deployment Phase

### 13. Deploy Smart Contract

```bash
bun run deploy throne-game
```

Save the contract address for frontend configuration.

### 14. Configure Frontend with Contract

Update `games/throne-game/src/config.ts` (if exists) with deployed contract address.

### 15. Publish Frontend

```bash
bun run publish throne-game
```

---

## Post-Migration

### 16. Verify Deployment

- [ ] Frontend is publicly accessible
- [ ] Contract is deployed on testnet/mainnet
- [ ] Game Hub integration works
- [ ] ZK verifier is hooked up (mock for now)

### 17. Document Contract Address

Create `DEPLOYED.md`:
```markdown
# Deployment Info

## Contract
Network: Stellar Testnet
Contract ID: [YOUR_CONTRACT_ID]

## Frontend
URL: [YOUR_FRONTEND_URL]

## Game Hub
Integration: ✅ Connected
```

### 18. Cleanup (Optional)

- [ ] Keep original `zk-Throne` folder as backup
- [ ] Create git branch for migration
- [ ] Commit changes to studio repository

---

## Integration with Friend's ZK Work

### 19. ZK Verifier Replacement Points

Your friend needs to replace these files:

```
games/throne-game/src/zkVerifier.ts
└── verifyProof() function
    Currently: return true (mock)
    Future: Real ZK verification
```

Document for your friend:
```typescript
// Current mock signature:
export async function verifyProof(proof: any, publicSignals: any): Promise<boolean>

// Expected inputs:
// - proof: ZK proof object from player
// - publicSignals: Public signals (trial ID, correct answer hash, etc.)

// Must return:
// - true if proof is valid
// - false if proof is invalid
```

---

## Troubleshooting

### Common Issues:

**Import errors in components:**
```bash
# Fix: Update import paths to match studio structure
# OLD: import { Trial } from '@/types/game'
# NEW: import { Trial } from '../types/game'
```

**Tailwind not working:**
```bash
# Ensure tailwind.config.ts has correct content paths
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

**Contract compilation errors:**
```bash
# Update soroban-sdk version in Cargo.toml
# Check studio documentation for correct version
```

**Runtime errors:**
```bash
# Check browser console
# Verify all dependencies are installed
# Ensure @stellar-game-studio packages are installed
```

---

## Success Criteria

✅ Game runs in studio environment  
✅ All 5 trials are playable  
✅ Mock ZK verifier logs to console  
✅ Contract compiles successfully  
✅ Can deploy contract to testnet  
✅ Frontend can call contract methods  
✅ Punishment system works (2-min lockout)  
✅ Mode selection works (1/3/5 trials)  
✅ Game state managed by contract  
✅ Ready for friend's ZK integration  

---

## Next Steps After Migration

1. **Test thoroughly** in local environment
2. **Deploy to testnet** first
3. **Share contract interface** with your friend
4. **Document ZK integration points**
5. **Test with real ZK proofs** when ready
6. **Deploy to mainnet** after testing

---

## Need Help?

- Check `MIGRATION_GUIDE.md` for detailed instructions
- Review `contractAdapter.ts` for integration patterns
- See `contract_template.rs` for contract structure
- Stellar Game Studio docs: [link]
- Your friend's ZK implementation: [link]

---

**Remember:** Keep original zk-Throne folder until migration is complete and tested!
