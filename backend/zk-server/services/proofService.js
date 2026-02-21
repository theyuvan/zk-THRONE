// ============================================================================
// AUTO ZK PROOF SERVICE (AUTO VK + AUTO PROVE)
// Works with bb CLI (UltraHonk)
// ============================================================================

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CIRCUIT_DIR = path.join(
  __dirname,
  "../../noir-circuits/trial_proof"
);

const TARGET_DIR = path.join(CIRCUIT_DIR, "target");

const CIRCUIT_JSON = path.join(TARGET_DIR, "throne.json");
const WITNESS = path.join(TARGET_DIR, "throne.gz");
const VK_PATH = path.join(TARGET_DIR, "vk");
const PROOF_DIR = path.join(TARGET_DIR, "proof");

async function generateProof() {
  try {
    console.log("🔐 Starting Auto Proof Pipeline...");

    // ==============================
    // 1. Check Required Files
    // ==============================

    if (!fs.existsSync(CIRCUIT_JSON)) {
      throw new Error("❌ throne.json not found. Run nargo compile.");
    }

    if (!fs.existsSync(WITNESS)) {
      throw new Error("❌ throne.gz not found. Run nargo compile.");
    }

    // ==============================
    // 2. Auto Generate VK If Missing
    // ==============================

    if (!fs.existsSync(VK_PATH)) {
      console.log("⚡ vk not found. Auto generating...");

      execSync(
        `bb write_vk -b ${CIRCUIT_JSON} -o ${TARGET_DIR}`,
        { stdio: "inherit" }
      );

      console.log("✅ vk generated.");
    } else {
      console.log("✅ vk already exists. Skipping generation.");
    }

    // ==============================
    // 3. Run Proof
    // ==============================

    console.log("🚀 Generating proof...");

    execSync(
  `bb prove \
  -b ${CIRCUIT_JSON} \
  -w ${WITNESS} \
  -k ${VK_PATH} \
  -o ${PROOF_DIR}`,
  { stdio: "inherit" }
);

    console.log("✅ Proof generated successfully.");

    // ==============================
    // 4. Read Proof + Public Inputs
    // ==============================

    const proof = fs.readFileSync(
      path.join(PROOF_DIR, "proof")
    );

    const publicInputs = fs.readFileSync(
      path.join(PROOF_DIR, "public_inputs"),
      "utf8"
    );

    return {
      success: true,
      proof: proof.toString("base64"),
      publicInputs,
    };

  } catch (err) {
    console.error("❌ Proof Pipeline Failed");
    console.error(err);

    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = { generateProof };