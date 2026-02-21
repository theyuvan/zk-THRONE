#!/usr/bin/env node

// ============================================================================
// ED25519 KEYPAIR GENERATOR
// ============================================================================
// Generate Ed25519 keypair for backend attestation signing
//
// Usage:
//   node generate-keys.js
//
// Output:
//   - Private key (64 hex chars) → Add to .env as BACKEND_PRIVATE_KEY
//   - Public key (64 hex chars) → Use for contract initialization
// ============================================================================

import nacl from 'tweetnacl';

const keypair = nacl.sign.keyPair();

const privateKey = Buffer.from(keypair.secretKey.slice(0, 32)).toString('hex');
const publicKey = Buffer.from(keypair.publicKey).toString('hex');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║          ED25519 KEYPAIR GENERATED                         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('🔑 PRIVATE KEY (keep secret!)');
console.log('   Add to backend/zk-server/.env:');
console.log(`   BACKEND_PRIVATE_KEY=${privateKey}\n`);

console.log('🔓 PUBLIC KEY (use for contract initialization)');
console.log(`   ${publicKey}\n`);

console.log('📋 STELLAR CONTRACT COMMAND:');
console.log('   stellar contract invoke \\');
console.log('     --id <CONTRACT_ID> \\');
console.log('     --source deployer \\');
console.log('     --network testnet \\');
console.log('     -- initialize \\');
console.log('     --admin <ADMIN_ADDRESS> \\');
console.log(`     --backend_pubkey ${publicKey} \\`);
console.log('     --required_trials 7\n');

console.log('⚠️  SECURITY WARNING:');
console.log('   - Never commit the private key to version control');
console.log('   - Add .env to .gitignore');
console.log('   - In production, use HSM or KMS for key storage\n');
