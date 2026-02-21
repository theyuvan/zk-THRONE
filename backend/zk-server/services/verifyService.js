// ============================================================================
// CLI BASED PROOF VERIFICATION SERVICE (BEST PRACTICE)
// ============================================================================

const { execSync } = require("child_process");
const path = require("path");

const TARGET_DIR = path.join(
  __dirname,
  "../../noir-circuits/trial_proof/target"
);

async function verifyProofWithCLI() {
  try {
    console.log("🔍 Verifying proof via bb CLI...");

    const cmd = `
      bb verify \
      -k ${TARGET_DIR}/vk \
      -p ${TARGET_DIR}/proof/proof \
      -i ${TARGET_DIR}/proof/public_inputs
    `;

    execSync(cmd, { stdio: "inherit" });

    console.log("✅ CLI Proof Verified Successfully");

    return true;

  } catch (err) {
    console.error("❌ CLI Verification Failed");
    return false;
  }
}

module.exports = verifyProofWithCLI;