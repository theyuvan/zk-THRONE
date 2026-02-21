// ============================================================================
// EXAMPLE: ZK-THRONE TRIAL COMPONENT
// ============================================================================
// This demonstrates the complete integration:
// Wallet → Backend → Contract
// ============================================================================

import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useGame } from "../hooks/useGame";

export function TrialComponent() {
  const { publicKey, isConnected, isConnecting, connect, disconnect } =
    useWallet();
  const { progress, king, isKing, isSubmitting, backendHealthy, submitSolution } =
    useGame();

  const [solution, setSolution] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const handleSubmit = async () => {
    console.log("🎯 SUBMIT BUTTON CLICKED");
    console.log("Solution:", solution);
    console.log("Wallet:", publicKey);
    
    if (!solution.trim()) {
      setMessage({ type: "error", text: "Please enter a solution" });
      return;
    }

    setMessage({ type: "info", text: "🔄 Submitting solution to backend..." });
    console.log("📤 Calling submitSolution...");

    try {
      const result = await submitSolution(solution);
      console.log("📥 Submit result:", result);

      if (result.success) {
        setMessage({
          type: "success",
          text: `✅ Success! Transaction: ${result.txHash}. Progress: ${result.progress}/7`,
        });
        setSolution("");
      } else {
        setMessage({ type: "error", text: `❌ ${result.error}` });
      }
    } catch (error) {
      console.error("💥 Submit error:", error);
      setMessage({ type: "error", text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>🏰 ZK-THRONE</h1>

      {/* Backend Status */}
      <div
        style={{
          padding: "10px",
          marginBottom: "20px",
          backgroundColor: backendHealthy ? "#d4edda" : "#f8d7da",
          border: `1px solid ${backendHealthy ? "#c3e6cb" : "#f5c6cb"}`,
          borderRadius: "5px",
        }}
      >
        {backendHealthy ? "✅ Backend Online" : "⚠️ Backend Offline"}
      </div>

      {/* Wallet Connection */}
      {!isConnected ? (
        <div>
          <p>Connect your XBull wallet to begin</p>
          <button onClick={connect} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      ) : (
        <div>
          <p>
            👤 <strong>Connected:</strong> {publicKey?.substring(0, 10)}...
          </p>
          <button onClick={disconnect}>Disconnect</button>

          {/* Game Status */}
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#e7f3ff",
              border: "1px solid #b3d9ff",
              borderRadius: "5px",
            }}
          >
            <h3>📊 Game Status</h3>
            <p>
              <strong>Trials Completed:</strong> {progress} / 7
            </p>
            <p>
              <strong>Current King:</strong> {king || "None"}
            </p>
            {isKing && (
              <p style={{ color: "gold", fontWeight: "bold" }}>
                👑 YOU ARE THE KING!
              </p>
            )}
          </div>

          {/* Solution Submission */}
          <div style={{ marginTop: "20px" }}>
            <h3>🎯 Submit Trial Solution</h3>
            <input
              type="text"
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Enter your solution"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                fontSize: "16px",
              }}
              disabled={isSubmitting}
            />
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !backendHealthy}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                backgroundColor: isSubmitting ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Solution"}
            </button>
          </div>

          {/* Message Display */}
          {message && (
            <div
              style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor:
                  message.type === "success"
                    ? "#d4edda"
                    : message.type === "error"
                    ? "#f8d7da"
                    : "#d1ecf1",
                border: `1px solid ${
                  message.type === "success"
                    ? "#c3e6cb"
                    : message.type === "error"
                    ? "#f5c6cb"
                    : "#bee5eb"
                }`,
                borderRadius: "5px",
              }}
            >
              {message.text}
            </div>
          )}

          {/* Flow Explanation */}
          <div
            style={{
              marginTop: "30px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            <h4>🔄 How It Works</h4>
            <ol style={{ textAlign: "left" }}>
              <li>You submit a solution</li>
              <li>Backend generates ZK proof with Noir + bb.js</li>
              <li>Backend verifies proof locally</li>
              <li>Backend signs Ed25519 attestation</li>
              <li>Frontend receives attestation</li>
              <li>XBull wallet signs transaction</li>
              <li>Contract verifies backend signature</li>
              <li>Progress updated on-chain</li>
              <li>After 7 trials, you become King! 👑</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
