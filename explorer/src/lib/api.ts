// API client for EmotionalChain Explorer
const API_BASE = '/api';

export interface NetworkStats {
  isRunning: boolean;
  stats: {
    id: string;
    uptime: number;
    totalValidators: number;
    activeValidators: number;
    consensusQuality: number;
    emotionalAverage: number;
    p2pConnections: number;
    blockHeight: number;
    networkHashrate: string;
    avgBlockTime: number;
  };
}

export interface Validator {
  id: string;
  address: string;
  stake: string;
  emotionalScore: number;
  isActive: boolean;
  uptime: number;
  blocksProduced: number;
  rewards: number;
}

export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: number;
  type: string;
  timestamp: number;
  status: string;
  emotionalData?: {
    authenticity: number;
    emotionalScore: number;
  };
}

export interface Block {
  height: number;
  hash: string;
  timestamp: number;
  validator: string;
  transactionCount: number;
  reward: number;
  emotionalConsensus: {
    score: number;
    participants: number;
  };
  size: number;
}

export interface TokenEconomics {
  totalSupply: number;
  maxSupply: number;
  circulatingSupply: number;
  stakingPool: number;
  currentInflation: number;
  burnedTokens: number;
}

class ApiClient {
  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return response.json();
  }

  async getNetworkStats(): Promise<NetworkStats> {
    return this.request<NetworkStats>('/network/status');
  }

  async getValidators(): Promise<Validator[]> {
    return this.request<Validator[]>('/validators');
  }

  async getTransactions(limit = 50): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/transactions?limit=${limit}`);
  }

  async getBlocks(limit = 20): Promise<Block[]> {
    // Return empty array - no fake data allowed, wait for real blocks API
    return [];
  }

  async getTokenEconomics(): Promise<TokenEconomics> {
    const economics = await this.request<any>('/token/economics');
    return {
      totalSupply: economics.totalSupply || 0,
      maxSupply: economics.maxSupply || 1000000000,
      circulatingSupply: economics.circulatingSupply || 0,
      stakingPool: economics.stakingPool || 0,
      currentInflation: economics.currentInflation || 0, // Use real data only
      burnedTokens: economics.burnedTokens || 0,
    };
  }

  async getWallets() {
    return this.request<any[]>('/wallets');
  }
}

export const apiClient = new ApiClient();