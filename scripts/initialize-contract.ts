#!/usr/bin/env bun
// Initialize the Throne contract with backend public key

import { Contract, rpc, TransactionBuilder, Keypair, Account, BASE_FEE, nativeToScVal, xdr } from "@stellar/stellar-sdk";

const CONTRACT_ID = "CD6RYSLZXSPLF7U5HOV5B7N62ICZEKXRZUAM6KWIEOF2NP2GTTT3BGOO";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
const BACKEND_PUBLIC_KEY = "GAUXYHLV65LYUIRK7QDQKAVSDGG7F4PV2HZFW2OVIUXINIWQGG2BGK5V";
const REQUIRED_TRIALS = 3;

async function initializeContract(adminSecret: string) {
  console.log("🔧 Initializing Throne Contract...");
  console.log(`📝 Contract: ${CONTRACT_ID}`);
  console.log(`🔑 Backend Key: ${BACKEND_PUBLIC_KEY}`);

  const server = new rpc.Server(RPC_URL);
  const adminKeypair = Keypair.fromSecret(adminSecret);
  const adminAddress = adminKeypair.publicKey();

  console.log(`👤 Admin: ${adminAddress}`);

  // Convert backend public key to BytesN<32>
  const backendKeypair = Keypair.fromPublicKey(BACKEND_PUBLIC_KEY);
  const backendKeyBytes = backendKeypair.rawPublicKey();

  // Get admin account
  const adminAccount = await server.getAccount(adminAddress);
  const account = new Account(adminAccount.accountId(), adminAccount.sequenceNumber());

  // Build contract call
  const contract = new Contract(CONTRACT_ID);
  const operation = contract.call(
    "initialize",
    nativeToScVal(adminAddress, { type: "address" }),
    xdr.ScVal.scvBytes(backendKeyBytes),
    nativeToScVal(REQUIRED_TRIALS, { type: "u32" })
  );

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  // Simulate first
  console.log("🔍 Simulating initialization...");
  const simulated = await server.simulateTransaction(transaction);

  if (rpc.Api.isSimulationSuccess(simulated)) {
    console.log("✅ Simulation successful!");

    // Prepare and sign
    const prepared = rpc.assembleTransaction(transaction, simulated).build();
    prepared.sign(adminKeypair);

    // Submit
    console.log("📡 Submitting initialization transaction...");
    const response = await server.sendTransaction(prepared);

    console.log(`📋 TX Hash: ${response.hash}`);
    console.log(`🔗 https://stellar.expert/explorer/testnet/tx/${response.hash}`);

    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    let attempts = 0;
    while (attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const txResponse = await server.getTransaction(response.hash);
        if (txResponse.status === "SUCCESS") {
          console.log("✅ Contract initialized successfully!");
          return;
        } else if (txResponse.status === "FAILED") {
          console.error("❌ Transaction failed:", txResponse);
          return;
        }
      } catch (e) {
        // Still pending
      }
      attempts++;
    }

    console.log("⏱️  Transaction is taking longer than expected. Check the explorer link above.");
  } else {
    console.error("❌ Simulation failed:");
    console.error(simulated);
    throw new Error("Simulation failed");
  }
}

// Get admin secret from env or command line
const adminSecret = process.env.ADMIN_SECRET || process.argv[2];

if (!adminSecret) {
  console.error("❌ Please provide admin secret key:");
  console.error("   bun run scripts/initialize-contract.ts <SECRET_KEY>");
  console.error("   OR set ADMIN_SECRET environment variable");
  process.exit(1);
}

initializeContract(adminSecret)
  .then(() => {
    console.log("🎉 Initialization complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error:", error);
    process.exit(1);
  });
