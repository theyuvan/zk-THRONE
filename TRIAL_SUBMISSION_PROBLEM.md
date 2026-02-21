# 🚨 CRITICAL ISSUE: Trials Not Submitting to Backend/Contract

## Problem Statement

**User Report:**
> "for each round completion in the frontend, it doesnot pop up transaction, i think the frontend is contacting to the backend itself i think so, for each wallet, i dont know what itself happening, i want the real game js to connect to the backend for the zk and onchain verification"

## Root Cause Analysis

### What's Happening Now (BROKEN):

1. User completes trial (e.g., ThronebreakerProtocolTrial)
2. Trial calls `onComplete()`
3. `handleTrialComplete()` in [Index.tsx](frontend/src/pages/Index.tsx) just updates UI state
4. **NO backend submission ❌**
5. **NO ZK proof generation ❌**
6. **NO wallet popup ❌**
7. **NO contract transaction ❌**

### Current Flow (UI ONLY):
```
Trial Completed
     ↓
onComplete() callback
     ↓
handleTrialComplete() - ONLY updates trialsCompleted counter
     ↓
Move to next trial OR proof scene
     ↓
GAME ENDS (no blockchain interaction!)
```

### Expected Flow (CORRECT):
```
Trial Completed
     ↓
Generate solution token (e.g., "thronebreaker_complete")
     ↓
gameService.submitSolution(solution, roundId)
     ↓
Backend: Generate ZK proof + sign attestation
     ↓
Frontend: Call contract.submit_proof()
     ↓
XBull wallet popup (TRANSACTION SIGNING) ✅
     ↓
Transaction broadcast to Stellar testnet
     ↓
Contract verifies signature and updates progress
     ↓
Move to next trial
```

## Code Locations

### The Disconnect:

**[Index.tsx](frontend/src/pages/Index.tsx#L63-L76)** - Trial completion handler:
```tsx
const handleTrialComplete = useCallback(() => {
  setGameState(prev => {
    const nextCompleted = prev.trialsCompleted + 1;
    const nextTrial = selectedTrials[nextCompleted];

    // ❌ PROBLEM: Just updates UI, no backend call!
    if (nextCompleted >= prev.totalTrials || !nextTrial) {
      return { ...prev, scene: 'proof', trialsCompleted: nextCompleted };
    }

    return {
      ...prev,
      trialsCompleted: nextCompleted,
      currentTrial: nextTrial,
      activatedPortals: [...prev.activatedPortals, prev.currentTrial?.id || ''].filter(Boolean),
    };
  });
}, [selectedTrials]);
```

**Trial Components** - No solution generation:
- [ThronebreakerProtocolTrial.tsx](frontend/src/components/trials/ThronebreakerProtocolTrial.tsx)
- [CipherGridTrial.tsx](frontend/src/components/trials/CipherGridTrial.tsx)
- [LogicLabyrinthTrial.tsx](frontend/src/components/trials/LogicLabyrinthTrial.tsx)
- [PatternOracleTrial.tsx](frontend/src/components/trials/PatternOracleTrial.tsx)
- [MemoryOfCrownTrial.tsx](frontend/src/components/trials/MemoryOfCrownTrial.tsx)
- [HiddenSigilTrial.tsx](frontend/src/components/trials/HiddenSigilTrial.tsx)
- [TrapDetectionTrial.tsx](frontend/src/components/trials/TrapDetectionTrial.tsx)

All these trials call `onComplete()` with NO solution data.

## What Exists (Ready to Use)

### ✅ Backend Integration Ready:
- [gameService.ts](frontend/src/services/gameService.ts) - Complete submitSolution flow
- [zkBackendService.ts](frontend/src/services/zkBackendService.ts) - Backend API calls  
- [throneContractService.ts](frontend/src/services/throneContractService.ts) - Contract submission
- [walletService.ts](frontend/src/services/walletService.ts) - XBull wallet integration

### ✅ Backend Endpoints Working:
- `POST /api/submit-solution` - Validates answer → generates ZK proof → signs attestation
- Answer validation system in [config/trials.js](backend/zk-server/config/trials.js)

### ❌ Missing Integration:
**Trials don't connect to the services!**

## Solution Required

### 1. Trial Solution Tokens

Each trial completion needs to generate a unique solution token:

```typescript
// Trial 1: Thronebreaker Protocol
solution = "THRONEBREAKER:complete:timestamp"

// Trial 2: Cipher Grid (Color Sigil)
solution = "colorsigil_complete"

// Trial 3: Hidden Sigil
solution = "hiddensigil_complete"

// Trial 4: Logic Labyrinth
solution = "logicpath_complete"

// Trial 5: Pattern Oracle
solution = "patternoracle_complete"

// Trial 6: Memory of Crown
solution = "memorycrown_complete"

// Trial 7: Trap Detection (Timekeeper)
solution = "traptimekeeper_complete"
```

### 2. Update Trial Completion Handler

**[Index.tsx](frontend/src/pages/Index.tsx)** needs to:
```tsx
import { useGame } from './hooks/useGame';

const { submitSolution, isSubmitting } = useGame();

const handleTrialComplete = useCallback(async (trialId: TrialId) => {
  // Generate solution token based on trial
  const solution = generateSolutionToken(trialId);
  
  // Get current round (1-7)
  const roundId = gameState.trialsCompleted + 1;
  
  // Submit to backend + contract
  const result = await submitSolution(solution, roundId);
  
  if (result.success) {
    // Update UI state
    setGameState(prev => {
      const nextCompleted = prev.trialsCompleted + 1;
      const nextTrial = selectedTrials[nextCompleted];
      
      if (nextCompleted >= prev.totalTrials || !nextTrial) {
        return { ...prev, scene: 'proof', trialsCompleted: nextCompleted };
      }
      
      return {
        ...prev,
        trialsCompleted: nextCompleted,
        currentTrial: nextTrial,
      };
    });
  } else {
    // Show error
    console.error('Submission failed:', result.error);
  }
}, [selectedTrials, gameState, submitSolution]);
```

### 3. Update Trial Components

Each trial needs to pass the trial ID when calling onComplete:

```tsx
// Before:
onComplete()

// After:
onComplete(trial.id)  // Pass trial identifier
```

Or better, the TrialScene can inject the trial ID:

```tsx
<TrialComponent 
  onComplete={() => handleTrialComplete(trial.id)} 
/>
```

### 4. Add Loading/Transaction States

While transaction is pending:
- Show loading indicator
- Block trial navigation
- Display "Waiting for wallet signature..."
- Display "Transaction confirming..."

## Expected User Experience After Fix

1. **User completes trial** - Solves the puzzle
2. **Solution generated** - Unique token created (e.g., "thronebreaker_complete")
3. **Backend called** - POST /api/submit-solution
4. **ZK proof generated** - Noir circuit proves correctness
5. **Attestation signed** - Backend Ed25519 signature
6. **XBull popup appears** - User sees transaction to sign ✅
7. **User approves** - Signs transaction
8. **Transaction broadcast** - Sent to Stellar testnet
9. **Contract verifies** - Ed25519 signature + progress increment
10. **Success!** - Move to next trial

## Implementation Priority

1. **HIGH PRIORITY**: Wire trials to submission flow (stops fake progress)
2. **MEDIUM**: Add loading states and error handling
3. **LOW**: Improve UX with transaction status displays

## Testing Checklist

After fix:
- [ ] Complete trial 1 → XBull wallet popup appears
- [ ] Sign transaction → Success confirmation
- [ ] Check progress on contract → Incremented to 1
- [ ] Complete trial 2 → Another wallet popup
- [ ] Reject transaction → Error shown, can retry
- [ ] Submit wrong answer → Backend rejects with 400 error

---

## Current State

**Trials are completely disconnected from blockchain!**

The game is just a UI demo right now with no actual blockchain state management. Every trial completion is client-side only.

**Fix needed:** Connect trial completion callbacks to the full submission flow.
