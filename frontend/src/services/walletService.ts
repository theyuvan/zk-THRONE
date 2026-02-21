// ============================================================================
// WALLET SERVICE - Stellar Wallets Kit Integration
// ============================================================================

import { 
  StellarWalletsKit, 
  WalletNetwork, 
  allowAllModules,
  XBULL_ID
} from '@creit.tech/stellar-wallets-kit';

export interface WalletState {
  publicKey: string | null;
  isConnected: boolean;
}

class WalletService {
  private static instance: WalletService;
  private kit: StellarWalletsKit;
  
  public state: WalletState = {
    publicKey: null,
    isConnected: false,
  };

  private listeners: ((state: WalletState) => void)[] = [];

  private constructor() {
    // Initialize StellarWalletsKit instance
    this.kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: XBULL_ID,
      modules: allowAllModules(),
    });
    
    this.loadPersistedState();
  }

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Load persisted wallet state from localStorage
   */
  private loadPersistedState() {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('wallet_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.publicKey) {
          this.state = parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load wallet state:', error);
    }
  }

  /**
   * Save wallet state to localStorage
   */
  private saveState() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('wallet_state', JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save wallet state:', error);
    }
  }

  /**
   * Subscribe to wallet state changes
   */
  subscribe(listener: (state: WalletState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Connect wallet - triggers xBull wallet connection
   */
  async connect(): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('Wallet connection is only available in the browser');
    }

    try {
      console.log("🔌 Connecting to xBull wallet...");

      // Set wallet to xBull and get address
      this.kit.setWallet(XBULL_ID);
      const { address } = await this.kit.getAddress();
      
      if (!address) {
        throw new Error('No wallet address returned');
      }

      this.state = {
        publicKey: address,
        isConnected: true,
      };

      this.saveState();
      this.notify();
      console.log("✅ Wallet connected:", address);
      
      return address;
    } catch (error) {
      console.error("❌ Wallet connection failed:", error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect() {
    try {
      await this.kit.disconnect();
      
      this.state = {
        publicKey: null,
        isConnected: false,
      };
      
      this.saveState();
      this.notify();
      console.log("🔌 Wallet disconnected");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      // Still clear state even if disconnect fails
      this.state = {
        publicKey: null,
        isConnected: false,
      };
      this.saveState();
      this.notify();
    }
  }

  /**
   * Sign a transaction
   */
  async signTransaction(xdr: string): Promise<string> {
    if (!this.state.publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log("✍️  Signing transaction...");

      const { signedTxXdr } = await this.kit.signTransaction(xdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
        address: this.state.publicKey,
      });

      console.log("✅ Transaction signed");
      return signedTxXdr;
    } catch (error) {
      console.error("❌ Transaction signing failed:", error);
      throw error;
    }
  }

  /**
   * Get current public key
   */
  getPublicKey(): string | null {
    return this.state.publicKey;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.state.isConnected;
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance();
