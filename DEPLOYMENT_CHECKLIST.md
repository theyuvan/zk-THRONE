# 🚀 DEPLOYMENT CHECKLIST

Complete step-by-step deployment guide for production.

---

## PRE-DEPLOYMENT

### 1. Code Review

- [ ] All tests passing (`cargo test` in all workspaces)
- [ ] No compiler warnings
- [ ] Security audit completed
- [ ] Dependencies audited (`cargo audit`)
- [ ] Code reviewed by senior engineers
- [ ] Documentation complete

### 2. RISC Zero Guest Program

- [ ] Guest program built successfully
  ```bash
  cd backend/zk-throne
  cargo risczero build
  ```

- [ ] Image ID extracted and documented
  ```bash
  cargo run --bin get-image-id
  # Record output: 0x123456789abcdef0...
  ```

- [ ] Guest tests passing
  ```bash
  cargo test
  ```

- [ ] Proof generation benchmarked
  - Target: <30s for typical trial
  - Measure on production hardware

### 3. Soroban Contract

- [ ] Contract built for wasm32
  ```bash
  cd contracts/throne-contract
  cargo build --target wasm32-unknown-unknown --release
  ```

- [ ] Contract tests passing
  ```bash
  cargo test
  ```

- [ ] WASM optimized
  ```bash
  stellar contract optimize \
    --wasm target/wasm32-unknown-unknown/release/throne_contract.wasm \
    --wasm-out throne_contract_optimized.wasm
  ```

- [ ] WASM size acceptable (<100KB)
  ```bash
  ls -lh throne_contract_optimized.wasm
  ```

### 4. Backend Server

- [ ] Server builds successfully
  ```bash
  cd backend/zk-server
  cargo build --release
  ```

- [ ] Health endpoint working
  ```bash
  curl http://localhost:3030/health
  ```

- [ ] Proof generation endpoint tested
  ```bash
  curl -X POST http://localhost:3030/api/prove -d '{...}'
  ```

- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Logging configured
- [ ] Error handling tested

### 5. Frontend

- [ ] Integration code implemented
- [ ] Environment variables configured
  ```
  VITE_ZK_SERVER_URL=https://zk.example.com
  VITE_THRONE_CONTRACT_ID=CXXXXXX...
  VITE_STELLAR_NETWORK=mainnet
  ```

- [ ] Wallet integration tested
- [ ] Trial completion flow tested
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Production build tested
  ```bash
  bun run build
  ```

---

## TESTNET DEPLOYMENT

### 1. Setup Testnet Environment

- [ ] Generate deployer identity
  ```bash
  stellar keys generate deployer --network testnet
  ```

- [ ] Fund deployer account
  ```bash
  stellar keys fund deployer --network testnet
  ```

- [ ] Verify balance
  ```bash
  stellar account balance deployer --network testnet
  ```

### 2. Deploy Throne Contract

- [ ] Deploy contract
  ```bash
  stellar contract deploy \
    --wasm throne_contract_optimized.wasm \
    --source deployer \
    --network testnet
  ```

- [ ] Record contract ID
  ```
  CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  ```

- [ ] Initialize contract
  ```bash
  stellar contract invoke \
    --id $CONTRACT_ID \
    --source deployer \
    --network testnet \
    -- \
    initialize \
    --admin $(stellar keys address deployer) \
    --image_id 0x123456789abcdef0... \
    --required_trials 7
  ```

- [ ] Verify initialization
  ```bash
  stellar contract invoke \
    --id $CONTRACT_ID \
    --network testnet \
    -- \
    get_current_round
  ```

### 3. Deploy ZK Server

- [ ] Build Docker image
  ```bash
  docker build -t zk-throne-server:testnet .
  ```

- [ ] Deploy to cloud platform
  - [ ] AWS ECS / Fargate
  - [ ] Google Cloud Run
  - [ ] Azure Container Instances
  - [ ] DigitalOcean App Platform

- [ ] Configure environment
  ```
  PORT=3030
  RUST_LOG=info
  ```

- [ ] Verify deployment
  ```bash
  curl https://zk-testnet.example.com/health
  ```

### 4. Update Frontend Config

- [ ] Update .env
  ```
  VITE_ZK_SERVER_URL=https://zk-testnet.example.com
  VITE_THRONE_CONTRACT_ID=CXXXXXX...
  VITE_STELLAR_NETWORK=testnet
  ```

- [ ] Deploy frontend
  ```bash
  bun run build
  # Deploy to Vercel/Netlify/etc
  ```

### 5. Testnet Testing

- [ ] Complete end-to-end trial
  1. Open frontend
  2. Connect wallet
  3. Complete trial
  4. Verify proof generated
  5. Verify contract updated

- [ ] Test all 7 trials
  - [ ] colorSigil
  - [ ] hiddenSigil
  - [ ] logicLabyrinth
  - [ ] patternOracle
  - [ ] memoryOfCrown
  - [ ] timekeeper
  - [ ] finalOath

- [ ] Test king assignment
  - Complete all 7 trials
  - Verify king status

- [ ] Test edge cases
  - Duplicate trial submission (should fail)
  - Invalid proof (should fail)
  - Multiple players
  - Round transitions

- [ ] Load testing
  - 100+ proof generations
  - 10+ concurrent players
  - Measure response times

### 6. Testnet Monitoring

- [ ] Set up monitoring
  - Server uptime
  - Proof generation time
  - Contract transaction success rate
  - Error rates

- [ ] Set up alerts
  - Server down
  - Proof generation failures
  - Contract errors

- [ ] Review logs
  - No sensitive data logged
  - Errors properly captured

---

## MAINNET DEPLOYMENT

⚠️ **ONLY PROCEED AFTER TESTNET VALIDATION**

### 1. Security Audit

- [ ] Third-party security audit completed
- [ ] All critical findings addressed
- [ ] Penetration testing completed
- [ ] Bug bounty program prepared

### 2. Final Preparation

- [ ] Create mainnet deployer identity
  ```bash
  stellar keys generate deployer-mainnet --network mainnet
  ```

- [ ] Fund deployer (use custodial service)
  - Minimum: 100 XLM
  - Recommended: 1000 XLM for reserves

- [ ] Prepare admin key
  - [ ] Use hardware wallet (Ledger)
  - [ ] Set up multi-sig (recommended)
  - [ ] Document key recovery process

- [ ] Verify image ID matches testnet
  ```bash
  cargo run --bin get-image-id
  # Must match testnet deployment exactly
  ```

### 3. Deploy Contract to Mainnet

- [ ] Deploy throne contract
  ```bash
  stellar contract deploy \
    --wasm throne_contract_optimized.wasm \
    --source deployer-mainnet \
    --network mainnet
  ```

- [ ] Record mainnet contract ID
  ```
  MAINNET_CONTRACT_ID=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  ```

- [ ] Initialize contract
  ```bash
  stellar contract invoke \
    --id $MAINNET_CONTRACT_ID \
    --source deployer-mainnet \
    --network mainnet \
    -- \
    initialize \
    --admin $ADMIN_ADDRESS \
    --image_id $IMAGE_ID \
    --required_trials 7
  ```

- [ ] Verify contract initialized
  ```bash
  stellar contract invoke \
    --id $MAINNET_CONTRACT_ID \
    --network mainnet \
    -- \
    get_current_round
  # Should return 1
  ```

### 4. Deploy Production ZK Server

- [ ] Build production image
  ```bash
  docker build -t zk-throne-server:v1.0.0 .
  ```

- [ ] Deploy to production infrastructure
  - [ ] Load balancer configured
  - [ ] Auto-scaling enabled
  - [ ] Health checks configured
  - [ ] SSL/TLS certificates installed

- [ ] Configure production environment
  ```
  PORT=443
  RUST_LOG=warn
  CORS_ORIGIN=https://throne.stellar-game.com
  ```

- [ ] Verify deployment
  ```bash
  curl https://zk.stellar-game.com/health
  ```

### 5. Update Frontend for Mainnet

- [ ] Update .env.production
  ```
  VITE_ZK_SERVER_URL=https://zk.stellar-game.com
  VITE_THRONE_CONTRACT_ID=CXXXXXX... (mainnet)
  VITE_STELLAR_NETWORK=mainnet
  ```

- [ ] Build production frontend
  ```bash
  NODE_ENV=production bun run build
  ```

- [ ] Deploy to production
  - [ ] CDN configured
  - [ ] SSL/TLS enabled
  - [ ] Domain configured

### 6. Production Smoke Tests

- [ ] Connect with real wallet
- [ ] Complete one trial end-to-end
- [ ] Verify proof on blockchain explorer
- [ ] Check player progress
- [ ] Monitor server logs

### 7. Launch Preparation

- [ ] Announcement prepared
- [ ] Documentation published
- [ ] Support channels ready
- [ ] Monitoring dashboards configured
- [ ] Incident response team briefed

---

## POST-DEPLOYMENT

### Monitoring

- [ ] Set up 24/7 monitoring
  - Server uptime (99.9% SLA)
  - Database health
  - Contract transaction success rate
  - Proof generation latency
  - Error rates

- [ ] Configure alerts
  - Server down → PagerDuty
  - High error rate → Slack
  - Unusual activity → Email

### Maintenance

- [ ] Daily health checks
- [ ] Weekly log review
- [ ] Monthly security review
- [ ] Quarterly dependency updates

### Scaling

- [ ] Monitor usage growth
- [ ] Plan for capacity increases
- [ ] Optimize proof generation
- [ ] Consider GPU acceleration

---

## ROLLBACK PLAN

### If Issues Detected

1. **Pause proof submissions**
   ```bash
   stellar contract invoke \
     --id $CONTRACT_ID \
     --source admin \
     --network mainnet \
     -- \
     pause
   ```

2. **Investigate issue**
   - Review logs
   - Check metrics
   - Identify root cause

3. **Fix and redeploy**
   - Deploy fixed version
   - Test on testnet first
   - Deploy to mainnet

4. **Resume operations**
   ```bash
   stellar contract invoke \
     --id $CONTRACT_ID \
     --source admin \
     --network mainnet \
     -- \
     unpause
   ```

---

## EMERGENCY CONTACTS

- **Smart Contract Issues:** [admin@stellar-throne.com]
- **ZK Server Issues:** [devops@stellar-throne.com]
- **Security Issues:** [security@stellar-throne.com]
- **General Support:** [support@stellar-throne.com]

---

## FINAL CHECKLIST

Before going live:

- [ ] All testnet tests passing
- [ ] Security audit complete
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Support team trained
- [ ] Rollback plan tested
- [ ] Announcement ready
- [ ] Bug bounty active

**Sign-off:**

- [ ] Engineering Lead
- [ ] Security Lead
- [ ] Product Manager
- [ ] CEO/Founder

---

## 🎉 LAUNCH!

When all checkboxes are complete:

```bash
# Update status page
echo "LIVE" > status.txt

# Send announcement
# 🚀 Stellar Throne is LIVE!

# Monitor closely for first 24 hours
```

---

**Good luck! 🚀👑**
