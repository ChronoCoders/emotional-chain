import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { EmotionalChain, EmotionalChainConfig } from './EmotionalChainSDK';
import { Wallet } from './WalletSDK';
import { EmotionalState, BiometricDevice } from './BiometricSDK';
import { ValidatorInfo, ConsensusRound } from './ConsensusSDK';

/**
 * React SDK for EmotionalChain integration
 * 
 * @example
 * ```tsx
 * import { EmotionalChainProvider, useEmotionalWallet } from '@emotionalchain/react';
 * 
 * function App() {
 *   return (
 *     <EmotionalChainProvider config={{ endpoint: 'https://mainnet.emotionalchain.io' }}>
 *       <MyDApp />
 *     </EmotionalChainProvider>
 *   );
 * }
 * 
 * function MyDApp() {
 *   const { wallet, connect, emotionalScore } = useEmotionalWallet();
 *   return <div>Emotional Score: {emotionalScore}%</div>;
 * }
 * ```
 */

// Context for EmotionalChain client
interface EmotionalChainContextType {
  client: EmotionalChain | null;
  connected: boolean;
  connecting: boolean;
  error: Error | null;
}

const EmotionalChainContext = createContext<EmotionalChainContextType>({
  client: null,
  connected: false,
  connecting: false,
  error: null
});

// Provider component
interface EmotionalChainProviderProps {
  config: EmotionalChainConfig;
  children: React.ReactNode;
  autoConnect?: boolean;
}

export const EmotionalChainProvider: React.FC<EmotionalChainProviderProps> = ({
  config,
  children,
  autoConnect = true
}) => {
  const [client, setClient] = useState<EmotionalChain | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const emotionalChain = new EmotionalChain(config);
    setClient(emotionalChain);

    // Setup event listeners
    emotionalChain.on('connected', () => {
      setConnected(true);
      setConnecting(false);
      setError(null);
    });

    emotionalChain.on('disconnected', () => {
      setConnected(false);
      setConnecting(false);
    });

    emotionalChain.on('error', (err) => {
      setError(err);
      setConnecting(false);
    });

    // Auto-connect if enabled
    if (autoConnect) {
      setConnecting(true);
      emotionalChain.connect().catch(err => {
        setError(err);
        setConnecting(false);
      });
    }

    return () => {
      emotionalChain.destroy();
    };
  }, [config, autoConnect]);

  const value = useMemo(() => ({
    client,
    connected,
    connecting,
    error
  }), [client, connected, connecting, error]);

  return (
    <EmotionalChainContext.Provider value={value}>
      {children}
    </EmotionalChainContext.Provider>
  );
};

// Hook to use EmotionalChain client
export const useEmotionalChain = () => {
  const context = useContext(EmotionalChainContext);
  if (!context) {
    throw new Error('useEmotionalChain must be used within EmotionalChainProvider');
  }
  return context;
};

// Wallet management hook
export const useEmotionalWallet = () => {
  const { client } = useEmotionalChain();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [emotionalScore, setEmotionalScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    if (!client) throw new Error('EmotionalChain client not available');
    
    setLoading(true);
    setError(null);
    
    try {
      const newWallet = await client.wallet.createWallet();
      setWallet(newWallet);
      setBalance(newWallet.balance);
      
      // Get initial emotional score
      const score = await client.biometric.getCurrentEmotionalScore();
      setEmotionalScore(score);
      
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const disconnect = useCallback(() => {
    setWallet(null);
    setBalance(0);
    setEmotionalScore(0);
    setError(null);
  }, []);

  const sendTransaction = useCallback(async (to: string, amount: number, requireEmotionalAuth = false) => {
    if (!client || !wallet) throw new Error('Wallet not connected');
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await client.sendTransaction({
        from: wallet.address,
        to,
        amount,
        requireEmotionalAuth
      });
      
      // Update balance
      const newBalance = await client.wallet.getBalance(wallet.address);
      setBalance(newBalance);
      
      return tx;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, wallet]);

  // Listen for balance updates
  useEffect(() => {
    if (!client || !wallet) return;

    const unsubscribe = client.wallet.onBalanceUpdate(wallet.address, (newBalance) => {
      setBalance(newBalance);
    });

    return unsubscribe;
  }, [client, wallet]);

  // Listen for emotional score updates
  useEffect(() => {
    if (!client) return;

    const unsubscribe = client.onEmotionalScoreUpdate((data) => {
      setEmotionalScore(data.overall);
    });

    return unsubscribe;
  }, [client]);

  return {
    wallet,
    balance,
    emotionalScore,
    loading,
    error,
    connect,
    disconnect,
    sendTransaction,
    isConnected: !!wallet
  };
};

// Biometric authentication hook
export const useBiometricAuth = (config?: any) => {
  const { client } = useEmotionalChain();
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [currentState, setCurrentState] = useState<EmotionalState | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const scanDevices = useCallback(async () => {
    if (!client) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const foundDevices = await client.biometric.scanForDevices();
      setDevices(foundDevices);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const connectDevice = useCallback(async (deviceId: string) => {
    if (!client) return;
    
    try {
      await client.biometric.connectDevice(deviceId);
      await scanDevices(); // Refresh device list
    } catch (err) {
      setError(err as Error);
    }
  }, [client, scanDevices]);

  const startMonitoring = useCallback(async () => {
    if (!client) return;
    
    try {
      await client.biometric.startMonitoring();
      setIsMonitoring(true);
    } catch (err) {
      setError(err as Error);
    }
  }, [client]);

  const stopMonitoring = useCallback(async () => {
    if (!client) return;
    
    try {
      await client.biometric.stopMonitoring();
      setIsMonitoring(false);
    } catch (err) {
      setError(err as Error);
    }
  }, [client]);

  const authenticate = useCallback(async () => {
    if (!client) throw new Error('EmotionalChain client not available');
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await client.biometric.authenticate();
      setCurrentState(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Listen for emotional state updates
  useEffect(() => {
    if (!client) return;

    const unsubscribe = client.biometric.on('emotionalScoreUpdate', (state: EmotionalState) => {
      setCurrentState(state);
    });

    return () => unsubscribe();
  }, [client]);

  // Listen for device connection updates
  useEffect(() => {
    if (!client) return;

    const onDeviceConnected = () => scanDevices();
    const onDeviceDisconnected = () => scanDevices();

    client.biometric.on('deviceConnected', onDeviceConnected);
    client.biometric.on('deviceDisconnected', onDeviceDisconnected);

    return () => {
      client.biometric.off('deviceConnected', onDeviceConnected);
      client.biometric.off('deviceDisconnected', onDeviceDisconnected);
    };
  }, [client, scanDevices]);

  return {
    devices,
    currentState,
    isMonitoring,
    loading,
    error,
    scanDevices,
    connectDevice,
    startMonitoring,
    stopMonitoring,
    authenticate
  };
};

// Consensus monitoring hook
export const useConsensusMonitor = () => {
  const { client } = useEmotionalChain();
  const [currentRound, setCurrentRound] = useState<ConsensusRound | null>(null);
  const [validators, setValidators] = useState<ValidatorInfo[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadCurrentRound = useCallback(async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const round = await client.consensus.getCurrentRound();
      setCurrentRound(round);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client]);

  const loadValidators = useCallback(async () => {
    if (!client) return;
    
    try {
      const validatorList = await client.consensus.getValidators();
      setValidators(validatorList);
    } catch (err) {
      setError(err as Error);
    }
  }, [client]);

  const loadNetworkStats = useCallback(async () => {
    if (!client) return;
    
    try {
      const stats = await client.consensus.getNetworkStats();
      setNetworkStats(stats);
    } catch (err) {
      setError(err as Error);
    }
  }, [client]);

  // Listen for consensus updates
  useEffect(() => {
    if (!client) return;

    const unsubscribeRound = client.onConsensusRound((round: ConsensusRound) => {
      setCurrentRound(round);
    });

    const unsubscribeValidator = client.onValidatorUpdate(() => {
      loadValidators();
    });

    return () => {
      unsubscribeRound();
      unsubscribeValidator();
    };
  }, [client, loadValidators]);

  // Initial data load
  useEffect(() => {
    if (client) {
      loadCurrentRound();
      loadValidators();
      loadNetworkStats();
    }
  }, [client, loadCurrentRound, loadValidators, loadNetworkStats]);

  return {
    currentRound,
    validators,
    networkStats,
    loading,
    error,
    refresh: () => {
      loadCurrentRound();
      loadValidators();
      loadNetworkStats();
    }
  };
};

// Transaction history hook
export const useTransactionHistory = (address?: string) => {
  const { client } = useEmotionalChain();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!client || !address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const txHistory = await client.getTransactionHistory(address);
      setTransactions(txHistory);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [client, address]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Listen for new transactions
  useEffect(() => {
    if (!client || !address) return;

    const unsubscribe = client.onTransaction((tx) => {
      if (tx.from === address || tx.to === address) {
        setTransactions(prev => [tx, ...prev]);
      }
    });

    return unsubscribe;
  }, [client, address]);

  return {
    transactions,
    loading,
    error,
    refresh: loadTransactions
  };
};

// Network status hook
export const useNetworkStatus = () => {
  const { client, connected, connecting, error } = useEmotionalChain();
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const loadNetworkInfo = useCallback(async () => {
    if (!client) return;
    
    try {
      const info = await client.getNetworkInfo();
      setNetworkInfo(info);
    } catch (err) {
      console.error('Failed to load network info:', err);
    }
  }, [client]);

  const checkHealth = useCallback(async () => {
    if (!client) return;
    
    try {
      const health = await client.healthCheck();
      setHealthStatus(health);
    } catch (err) {
      console.error('Failed to check health:', err);
    }
  }, [client]);

  useEffect(() => {
    if (connected && client) {
      loadNetworkInfo();
      checkHealth();
      
      // Refresh periodically
      const interval = setInterval(() => {
        loadNetworkInfo();
        checkHealth();
      }, 30000); // Every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [connected, client, loadNetworkInfo, checkHealth]);

  return {
    networkInfo,
    healthStatus,
    connected,
    connecting,
    error,
    refresh: () => {
      loadNetworkInfo();
      checkHealth();
    }
  };
};

// Error boundary for EmotionalChain components
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class EmotionalChainErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('EmotionalChain Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div style={{ padding: '20px', border: '1px solid #ff6b6b', borderRadius: '4px', backgroundColor: '#fff5f5' }}>
    <h3 style={{ color: '#d63031', margin: '0 0 10px 0' }}>EmotionalChain Error</h3>
    <p style={{ margin: '0', color: '#2d3436' }}>{error.message}</p>
  </div>
);

// Utility hook for formatting
export const useEmotionalChainFormatter = () => {
  const formatEmotionalScore = useCallback((score: number) => {
    return `${score.toFixed(1)}%`;
  }, []);

  const formatBalance = useCallback((balance: number, symbol = 'EMO') => {
    return `${balance.toLocaleString()} ${symbol}`;
  }, []);

  const formatAddress = useCallback((address: string, length = 8) => {
    if (!address) return '';
    return `${address.slice(0, length)}...${address.slice(-4)}`;
  }, []);

  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  const formatDuration = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  return {
    formatEmotionalScore,
    formatBalance,
    formatAddress,
    formatTimestamp,
    formatDuration
  };
};