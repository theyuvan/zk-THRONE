// ============================================================================
// WALLET HOOK
// ============================================================================

import { useState, useEffect } from "react";
import { walletService, type WalletState } from "../services/walletService";

export function useWallet() {
  const [state, setState] = useState<WalletState>(walletService.state);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Subscribe to wallet state changes
    const unsubscribe = walletService.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      await walletService.connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    walletService.disconnect();
  };

  return {
    publicKey: state.publicKey,
    isConnected: state.isConnected,
    isConnecting,
    connect,
    disconnect,
  };
}
