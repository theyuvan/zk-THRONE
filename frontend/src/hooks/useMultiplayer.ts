// ============================================================================
// MULTIPLAYER HOOK - Re-export from Context
// ============================================================================
// This file now simply re-exports the Context-based hook.
// All state management moved to MultiplayerContext to fix the bug where
// multiple useMultiplayer() calls created isolated state instances.
// ============================================================================

export { useMultiplayer, MultiplayerProvider } from "@/contexts/MultiplayerContext";

// Also re-export RoomState type for convenience
export type { RoomState } from "@/services/multiplayerService";
