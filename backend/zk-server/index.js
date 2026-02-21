// ============================================================================
// ZK THRONE BACKEND SERVER
// ============================================================================

const express = require("express");
const cors = require("cors");
const config = require("./config");
const submitSolutionRoute = require("./routes/submitSolution");
const roomRoutes = require("./routes/room"); // Multiplayer room routes
const { backendKeypair } = require("./services/attestationService");

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "zk-throne-backend",
    publicKey: backendKeypair.publicKey(),
    network: config.STELLAR_NETWORK,
    timestamp: Date.now(),
  });
});

/**
 * Get backend public key
 */
app.get("/public-key", (req, res) => {
  res.json({
    publicKey: backendKeypair.publicKey(),
    format: "Stellar G...",
    algorithm: "Ed25519",
  });
});

/**
 * Submit solution (main endpoint)
 */
app.use("/submit-solution", submitSolutionRoute);

/**
 * Multiplayer room endpoints
 */
app.use("/api/room", roomRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// ============================================================================
// SERVER START
// ============================================================================

app.listen(config.PORT, () => {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║          ZK-THRONE BACKEND SERVER                          ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`🌐 Server: http://localhost:${config.PORT}`);
  console.log(`🔑 Public Key: ${backendKeypair.publicKey()}`);
  console.log(`🌍 Network: ${config.STELLAR_NETWORK}`);
  console.log("");
  console.log("📡 Endpoints:");
  console.log(`   GET  /health`);
  console.log(`   GET  /public-key`);
  console.log(`   POST /submit-solution`);
  console.log("");
  console.log("🎮 Multiplayer:");
  console.log(`   POST /api/room/create`);
  console.log(`   POST /api/room/join`);
  console.log(`   GET  /api/room/:id/state`);
  console.log(`   POST /api/room/:id/start`);
  console.log(`   POST /api/room/:id/submit-proof`);
  console.log(`   GET  /api/room/:id/results`);
  console.log("");
  console.log("✅ Server ready");
  console.log("");
});
