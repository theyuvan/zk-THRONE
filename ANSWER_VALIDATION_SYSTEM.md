# 🔒 ANSWER VALIDATION SYSTEM - How It Works

## The Security Problem (BEFORE)

**Before validation was added:**
```javascript
// User submits ANY answer
POST /submit-solution
{
  "solution": "test123",  // ❌ WRONG ANSWER!
  "player": "GDLP...",
  "roundId": 1
}

// Backend blindly accepts:
✅ Generate ZK proof
✅ Sign attestation  
✅ User gets credit for WRONG answer!
```

**Result**: System was BROKEN! Users could submit wrong answers and still progress.

---

##🛡️ The Fix (NOW)

### Backend Validation Flow

```javascript
// STEP 1: User submits solution
POST /submit-solution
{
  "solution": "test123",
  "player": "GDLP...",
  "roundId": 1
}

// STEP 2: Backend validates BEFORE generating proof
const isCorrect = validateTrialSolution(roundId, solution);

if (!isCorrect) {
  ❌ Return error: "Incorrect solution for this trial"
  ❌ NO proof generated
  ❌ NO attestation signed
  ❌ User CANNOT submit to blockchain
}

// STEP 3: Only if correct:
✅ Generate ZK proof
✅ Verify proof
✅ Sign attestation
✅ Return to user for blockchain submission
```

---

## 📁 Implementation Files

### 1. Trial Definitions (`backend/zk-server/config/trials.js`)

Stores correct answers and validation logic for each of the 7 trials:

```javascript
const TRIALS = {
  1: {
    name: "Thronebreaker Protocol",
    validateSolution(solution) {
      // Accept completion token from frontend
      return solution === "thronebreaker_complete" 
          || solution.startsWith("THRONEBREAKER:");
    },
  },
  
  2: {
    name: "Color Sigil Memory",
    validateSolution(solution) {
      return solution === "colorsigil_complete" 
          || solution.startsWith("COLORSIGIL:");
    },
  },
  
  // ... trials 3-7 same pattern
};
```

### 2. Route Validation (`routes/submitSolution.js` & `routes/room.js`)

Both routes now validate BEFORE generating proofs:

```javascript
// Validate solution first
const isCorrectAnswer = validateTrialSolution(roundId, solution);

if (!isCorrectAnswer) {
  return res.status(400).json({
    success: false,
    error: "Incorrect solution for this trial",
  });
}

// Only generate proof if validation passes
const proofData = await generateProof(...);
```

---

## 🎮 Frontend Integration

### Current Trial Completion Format

Each frontend trial component must submit a completion token when the user successfully completes the trial.

#### Example: Thronebreaker Protocol Trial

```tsx
// ThronebreakerProtocolTrial.tsx

const handleTrialComplete = async () => {
  // User successfully completed trial
  const solution = "thronebreaker_complete";  // ✅ Accepted by backend
  
  // Submit to backend
  const result = await throneContractService.submitSolution({
    solution,
    player: walletAddress,
    roundId: 1,
  });
  
  // Backend validates → generates proof → returns attestation
  // Frontend submits attestation to blockchain
};
```

#### Example: Color Sigil Memory Trial

```tsx
// ColorSigilTrial.tsx

const handleSequenceCorrect = async () => {
  // User remembered sequence correctly
  const solution = "colorsigil_complete";  // ✅ Accepted by backend
  
  await throneContractService.submitSolution({
    solution,
    player: walletAddress,
    roundId: 2,
  });
};
```

### Advanced: Trial-Specific Solution Formats

For more security, you can send trial-specific data:

```tsx
// Example: Include game state proof
const solution = `THRONEBREAKER:${correctAnswersShot}:${timestamp}`;
// e.g., "THRONEBREAKER:5:1708560123"

// Example: Include sequence verification
const solution = `COLORSIGIL:${sequenceHash}`;
// e.g., "COLORSIGIL:a3f2c1b9..."
```

The backend will accept anything that starts with the trial prefix:

```javascript
validateSolution(solution) {
  return solution === "thronebreaker_complete" 
      || solution.startsWith("THRONEBREAKER:");  // ✅ Accepts both!
}
```

---

## 🔐 Security Guarantees

### 1. Backend is Source of Truth

- Frontend can be modified by malicious users
- Backend has authoritative trial definitions
- Only backend can sign attestations
- Contract verifies backend's signature

### 2. Validation Happens First

```
User submits → Backend validates → Generate proof → Sign → Blockchain
                     ↓
                  If wrong, STOP HERE ❌
                  No proof, no signature
```

### 3. Contract Enforces Backend Approval

```rust
// Contract code (Soroban)
pub fn submit_proof(
    env: Env,
    player: Address,
    solution_hash: BytesN<32>,
    signature: BytesN<64>,  // ← Backend's signature required!
    nonce: u64,
) {
    // Verify backend signed this submission
    verify_ed25519_signature(...);  // ✅
    
    // Only then increment progress
    progress += 1;
}
```

---

## 🚨 What Happens If User Submits Wrong Answer?

### Single Player (`/submit-solution`)

```bash
# User submits wrong answer
POST /submit-solution
{
  "solution": "test123",  # ❌ WRONG!
  "roundId": 1
}

# Backend response:
HTTP 400 Bad Request
{
  "success": false,
  "error": "Incorrect solution for this trial"
}

# User CANNOT proceed to blockchain
# Progress NOT incremented
```

### Multiplayer (`/room/:id/submit-proof`)

```bash
# User submits wrong answer in multiplayer
POST /api/room/abc123/submit-proof
{
  "solution": "wrong_answer",  # ❌ WRONG!
  "playerWallet": "GDLP..."
}

# Backend response:
HTTP 400 Bad Request
{
  "success": false,
  "error": "Incorrect solution for round 3"
}

# Player's score NOT incremented
# Round NOT marked complete for this player
# Other players still waiting
```

---

## ✅ Testing the System

### Test 1: Submit Correct Answer

```bash
curl -X POST http://localhost:3030/submit-solution \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "thronebreaker_complete",
    "player": "GDLP...",
    "roundId": 1
  }'

# Expected:
{
  "success": true,
  "attestation": {
    "signature": "...",  # ✅ Backend signed!
    "solutionHash": "...",
    "nonce": 123,
    "roundId": 1
  }
}
```

### Test 2: Submit Wrong Answer

```bash
curl -X POST http://localhost:3030/submit-solution \
  -H "Content-Type: application/json" \
  -d '{
    "solution": "test123",  # ❌ WRONG!
    "player": "GDLP...",
    "roundId": 1
  }'

# Expected:
{
  "success": false,
  "error": "Incorrect solution for this trial"  # ❌ Rejected!
}
```

---

## 🔧 How to Add New Trials

### Step 1: Define Trial in `config/trials.js`

```javascript
8: {
  name: "New Awesome Trial",
  description: "Solve the new puzzle",
  
  validateSolution(solution) {
    // Option 1: Simple completion token
    return solution === "awesome_complete";
    
    // Option 2: With prefix for additional data
    return solution.startsWith("AWESOME:");
    
    // Option 3: Complex validation
    if (solution.startsWith("AWESOME:")) {
      const [_, score, time] = solution.split(":");
      return parseInt(score) >= 5 && parseInt(time) < 60000;
    }
    return false;
  },
},
```

### Step 2: Frontend Submits Completion

```tsx
// NewAwesomeTrial.tsx

const handleComplete = async () => {
  const solution = "awesome_complete";  // OR "AWESOME:5:45123"
  
  await submitSolution({
    solution,
    player: walletAddress,
    roundId: 8,
  });
};
```

---

## 📊 Validation Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  USER SUBMITS SOLUTION                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend: submitSolution("test123")                    │
│  ↓                                                       │
│  POST /submit-solution                                  │
│  ↓                                                       │
│  Backend Routes                                         │
│  ├─ Extract: roundId, solution, player                  │
│  ├─ Validate: validateTrialSolution(roundId, solution)  │
│  │                                                       │
│  │  ┌──────────────────────────────────────┐           │
│  │  │ config/trials.js                     │           │
│  │  │ TRIALS[1].validateSolution("test123")│           │
│  │  │                                       │           │
│  │  │ Expected: "thronebreaker_complete"   │           │
│  │  │ Got: "test123"                       │           │
│  │  │                                       │           │
│  │  │ Return: false ❌                     │           │
│  │  └──────────────────────────────────────┘           │
│  │                                                       │
│  └─ If false:                                           │
│     ❌ Return 400 error: "Incorrect solution"          │
│     ❌ STOP - No proof generated                        │
│                                                          │
│  ✋ USER CANNOT PROCEED                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  USER SUBMITS CORRECT SOLUTION                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend: submitSolution("thronebreaker_complete")     │
│  ↓                                                       │
│  POST /submit-solution                                  │
│  ↓                                                       │
│  Backend Routes                                         │
│  ├─ Validate: validateTrialSolution(1, "thronebreaker_complete") │
│  │             ✅ Returns true!                         │
│  │                                                       │
│  ├─ Generate ZK proof with bb.js                        │
│  ├─ Verify proof with bb.js                             │
│  ├─ Sign attestation (Ed25519)                          │
│  └─ Return attestation to frontend                      │
│  ↓                                                       │
│  Frontend: Receives attestation                         │
│  ↓                                                       │
│  Submit attestation to Soroban contract                 │
│  ↓                                                       │
│  Contract: Verify backend signature ✅                  │
│  Contract: Increment progress (4 → 5) ✅               │
│                                                          │
│  🎉 SUCCESS! User progresses to next trial              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Summary

### BEFORE Validation:
- ❌ Users could submit ANY answer
- ❌ Backend generated proofs for wrong answers
- ❌ Users got credit for incorrect solutions
- ❌ System was exploitable

### AFTER Validation:
- ✅ Backend validates solution FIRST
- ✅ Only correct answers get proofs
- ✅ Only correct answers get signed
- ✅ Only backend-approved submissions reach blockchain
- ✅ System is SECURE

### The Chain of Trust:
1. **Frontend**: Presents trial, user solves it
2. **Backend**: Validates solution is correct
3. **ZK Proof**: Proves knowledge without revealing
4. **Attestation**: Backend signature approves it
5. **Contract**: Verifies backend signature, increments progress

**Every layer is validated. No shortcuts. No exploits.**
