/**
 * Interactive ZK + Soroban Setup Script
 * 
 * This script:
 * 1. Builds RISC Zero guest program
 * 2. Builds Soroban throne contract
 * 3. Extracts image ID
 * 4. Deploys contract to testnet
 * 5. Updates .env with contract ID
 */

import { $ } from "bun";
import { writeFile, readFile } from "fs/promises";
import { join } from "path";
import readline from "readline";

const ROOT = join(import.meta.dir, "..");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(msg: string, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function header(msg: string) {
  console.log();
  log(`${"=".repeat(70)}`, colors.cyan);
  log(`  ${msg}`, colors.bright + colors.cyan);
  log(`${"=".repeat(70)}`, colors.cyan);
  console.log();
}

function success(msg: string) {
  log(`✅ ${msg}`, colors.green);
}

function error(msg: string) {
  log(`❌ ${msg}`, colors.red);
}

function info(msg: string) {
  log(`ℹ️  ${msg}`, colors.blue);
}

function warn(msg: string) {
  log(`⚠️  ${msg}`, colors.yellow);
}

// Interactive prompt
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ============================================================================
// Main Setup
// ============================================================================

header("🏛️  STELLAR THRONE — ZK + SOROBAN SETUP");

log("This script will set up your ZK + Soroban backend architecture:", colors.bright);
console.log();
log("  1. Build RISC Zero guest program (zkVM)", colors.white);
log("  2. Build Soroban throne contract", colors.white);
log("  3. Extract RISC Zero image ID", colors.white);
log("  4. Optionally deploy to Stellar testnet", colors.white);
log("  5. Configure environment variables", colors.white);
console.log();

const shouldContinue = await prompt("Continue with setup? (y/n)");

if (shouldContinue.toLowerCase() !== "y" && shouldContinue.toLowerCase() !== "yes") {
  log("Setup cancelled.", colors.yellow);
  process.exit(0);
}

// ============================================================================
// 1. Check Prerequisites
// ============================================================================

header("1️⃣  Checking Prerequisites");

let allPrereqsMet = true;

// Check Rust
try {
  const rustVersion = await $`rustc --version`.text();
  success(`Rust installed: ${rustVersion.trim()}`);
} catch {
  error("Rust not found. Install from: https://rustup.rs/");
  allPrereqsMet = false;
}

// Check RISC Zero
try {
  const risczeroVersion = await $`cargo risczero --version`.text();
  success(`RISC Zero installed: ${risczeroVersion.trim()}`);
} catch {
  error("RISC Zero not found. Install: cargo install cargo-risczero && cargo risczero install");
  allPrereqsMet = false;
}

// Check Stellar CLI
try {
  const stellarVersion = await $`stellar --version`.text();
  success(`Stellar CLI installed: ${stellarVersion.trim()}`);
} catch {
  error("Stellar CLI not found. Install: cargo install --locked stellar-cli");
  allPrereqsMet = false;
}

// Check wasm32 target
try {
  const targets = await $`rustup target list --installed`.text();
  if (targets.includes("wasm32-unknown-unknown")) {
    success("wasm32-unknown-unknown target installed");
  } else {
    error("wasm32-unknown-unknown target not found. Install: rustup target add wasm32-unknown-unknown");
    allPrereqsMet = false;
  }
} catch {
  error("Failed to check Rust targets");
  allPrereqsMet = false;
}

if (!allPrereqsMet) {
  console.log();
  error("Please install missing prerequisites and run again.");
  process.exit(1);
}

console.log();
success("All prerequisites met!");

// ============================================================================
// 2. Build RISC Zero Guest
// ============================================================================

header("2️⃣  Building RISC Zero Guest Program");

info("This compiles the zkVM guest program to RISC-V...");
info("This may take a few minutes on first build.");
console.log();

try {
  await $`cd ${join(ROOT, "backend/zk-throne")} && cargo risczero build`;
  success("RISC Zero guest built successfully");
} catch (err) {
  error("Failed to build RISC Zero guest");
  error(String(err));
  process.exit(1);
}

// ============================================================================
// 3. Extract Image ID
// ============================================================================

header("3️⃣  Extracting RISC Zero Image ID");

let imageId = "";

try {
  const result = await $`cd ${join(ROOT, "backend/zk-throne")} && cargo run --bin get-image-id`.text();
  
  const hexMatch = result.match(/For Soroban BytesN<32>, use:\s*\n\s*(0x[0-9a-f]+)/i);
  
  if (!hexMatch) {
    throw new Error("Could not extract image ID from output");
  }
  
  imageId = hexMatch[1];
  success(`Image ID extracted: ${imageId}`);
  
  // Store for later use
  await writeFile(join(ROOT, ".zk-image-id"), imageId);
  
} catch (err) {
  error("Failed to extract image ID");
  error(String(err));
  process.exit(1);
}

// ============================================================================
// 4. Build Soroban Contract
// ============================================================================

header("4️⃣  Building Soroban Throne Contract");

info("Compiling contract to WASM...");
console.log();

try {
  await $`cd ${join(ROOT, "contracts/throne-contract")} && cargo build --target wasm32-unknown-unknown --release`;
  success("Throne contract built successfully");
} catch (err) {
  error("Failed to build Soroban contract");
  error(String(err));
  process.exit(1);
}

// ============================================================================
// 5. Optimize Contract
// ============================================================================

header("5️⃣  Optimizing Contract WASM");

const wasmPath = join(ROOT, "contracts/throne-contract/target/wasm32-unknown-unknown/release/throne_contract.wasm");
const optimizedPath = join(ROOT, "contracts/throne-contract/throne_contract_optimized.wasm");

try {
  await $`stellar contract optimize --wasm ${wasmPath} --wasm-out ${optimizedPath}`;
  success("Contract optimized");
  
  // Check file size
  const stats = await Bun.file(optimizedPath).stat();
  const sizeKB = (stats.size / 1024).toFixed(2);
  info(`Optimized WASM size: ${sizeKB} KB`);
} catch (err) {
  warn("Failed to optimize contract (non-critical)");
  warn("Continuing with unoptimized WASM...");
  // Copy unoptimized as fallback
  try {
    await $`cp ${wasmPath} ${optimizedPath}`;
  } catch {
    error("Could not copy WASM file");
    process.exit(1);
  }
}

// ============================================================================
// 6. Deploy to Testnet (Optional)
// ============================================================================

header("6️⃣  Testnet Deployment");

console.log();
log("Would you like to deploy the contract to Stellar testnet?", colors.bright);
log("This requires a funded testnet account.", colors.white);
console.log();

const shouldDeploy = await prompt("Deploy to testnet? (y/n)");

let contractId = "";
let adminAddress = "";

if (shouldDeploy.toLowerCase() === "y" || shouldDeploy.toLowerCase() === "yes") {
  
  info("Checking for deployer identity...");
  
  try {
    const identities = await $`stellar keys list`.text();
    
    if (!identities.includes("deployer")) {
      info("Creating deployer identity...");
      await $`stellar keys generate deployer --network testnet`;
      success("Deployer identity created");
      
      info("Funding deployer account...");
      await $`stellar keys fund deployer --network testnet`;
      success("Deployer account funded");
      
      // Wait for funding to propagate
      info("Waiting for funding to propagate...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      success("Deployer identity exists");
    }
    
    // Get admin address
    adminAddress = (await $`stellar keys address deployer`.text()).trim();
    info(`Admin address: ${adminAddress}`);
    
  } catch (err) {
    error("Failed to setup deployer identity");
    error(String(err));
    process.exit(1);
  }
  
  info("Deploying contract to testnet...");
  console.log();
  
  try {
    const deployResult = await $`stellar contract deploy --wasm ${optimizedPath} --source deployer --network testnet`.text();
    
    const contractIdMatch = deployResult.match(/C[A-Z0-9]{55}/);
    
    if (!contractIdMatch) {
      throw new Error("Could not extract contract ID from deployment output");
    }
    
    contractId = contractIdMatch[0];
    success(`Contract deployed: ${contractId}`);
    
  } catch (err) {
    error("Contract deployment failed");
    error(String(err));
    process.exit(1);
  }
  
  // Initialize contract
  header("7️⃣  Initializing Contract");
  
  info("Initializing throne contract with image ID...");
  console.log();
  
  try {
    await $`stellar contract invoke --id ${contractId} --source deployer --network testnet -- initialize --admin ${adminAddress} --image_id ${imageId} --required_trials 7`;
    success("Contract initialized successfully");
  } catch (err) {
    error("Contract initialization failed");
    error(String(err));
    warn("Contract deployed but not initialized. You may need to initialize manually.");
  }
  
  // Verify initialization
  try {
    const currentRound = await $`stellar contract invoke --id ${contractId} --network testnet -- get_current_round`.text();
    if (currentRound.includes("1")) {
      success("Contract verification passed: Round 1 active");
    }
  } catch (err) {
    warn("Could not verify contract initialization");
  }
  
} else {
  info("Skipping testnet deployment");
  warn("Contract built but not deployed");
}

// ============================================================================
// 8. Update Environment Files
// ============================================================================

header("8️⃣  Updating Environment Configuration");

const envPath = join(ROOT, ".env");
const frontendEnvPath = join(ROOT, "frontend/.env");

const envContent = `# Auto-generated by setup script
# Generated: ${new Date().toISOString()}

# ZK Proof Server
VITE_ZK_SERVER_URL=http://localhost:3030

# Stellar Network
VITE_STELLAR_NETWORK=testnet
VITE_TESTNET_RPC_URL=https://soroban-testnet.stellar.org

# Throne Contract
VITE_THRONE_CONTRACT_ID=${contractId || ""}

# RISC Zero
VITE_ZK_IMAGE_ID=${imageId}

# Development
VITE_DEBUG=true
VITE_MOCK_MODE=false
`;

try {
  await writeFile(envPath, envContent);
  success(`Updated ${envPath}`);
  
  await writeFile(frontendEnvPath, envContent);
  success(`Updated ${frontendEnvPath}`);
} catch (err) {
  error("Failed to update .env files");
  error(String(err));
}

// ============================================================================
// 9. Summary
// ============================================================================

header("✨ Setup Complete!");

console.log();
log("📋 Summary:", colors.bright);
console.log();

if (imageId) {
  log(`  🔑 Image ID: ${imageId}`, colors.green);
}

if (contractId) {
  log(`  📜 Contract ID: ${contractId}`, colors.green);
  log(`  👤 Admin: ${adminAddress}`, colors.green);
}

console.log();
log("🚀 Next Steps:", colors.bright);
console.log();

log("  1. Start ZK proof server:", colors.white);
log("     cd backend/zk-server && cargo run --release", colors.cyan);
console.log();

log("  2. Start frontend:", colors.white);
log("     cd frontend && bun run dev", colors.cyan);
console.log();

if (contractId) {
  log("  3. Test the integration:", colors.white);
  log("     - Open http://localhost:5000", colors.cyan);
  log("     - Connect a testnet wallet", colors.cyan);
  log("     - Complete a trial end-to-end", colors.cyan);
} else {
  log("  3. Deploy to testnet:", colors.white);
  log("     bun run setup:zk", colors.cyan);
}

console.log();
log("📖 Documentation:", colors.bright);
log("   - Architecture: README_ZK_SOROBAN.md", colors.white);
log("   - Security: SECURITY_ANALYSIS.md", colors.white);
log("   - Quick Start: QUICK_START.md", colors.white);

console.log();
log("🎉 Ready to build the Throne! 👑", colors.bright + colors.green);
console.log();
