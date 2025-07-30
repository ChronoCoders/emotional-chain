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
    // Since we don't have a blocks endpoint yet, we'll derive from other data
    const validators = await this.getValidators();
    const transactions = await this.getTransactions(limit);
    
    // Create mock blocks from available data
    const blocks: Block[] = [];
    for (let i = 0; i < Math.min(limit, 10); i++) {
      const validator = validators[i % validators.length];
      blocks.push({
        height: 1000 + i,
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        timestamp: Date.now() - (i * 30000), // 30 seconds per block
        validator: validator?.id || 'Unknown',
        transactionCount: Math.floor(Math.random() * 10) + 1,
        reward: 50 + Math.random() * 25,
        emotionalConsensus: {
          score: validator?.emotionalScore || 75,
          participants: Math.floor(Math.random() * 5) + 12,
        },
        size: Math.floor(Math.random() * 1000) + 500,
      });
    }
    
    return blocks.sort((a, b) => b.height - a.height);
  }

  async getTokenEconomics(): Promise<TokenEconomics> {
    const economics = await this.request<any>('/token/economics');
    return {
      totalSupply: economics.totalSupply || 0,
      maxSupply: economics.maxSupply || 1000000000,
      circulatingSupply: economics.circulatingSupply || 0,
      stakingPool: economics.stakingPool || 0,
      currentInflation: 5.2, // Default inflation rate
      burnedTokens: 0,
    };
  }

  async getWallets() {
    return this.request<any[]>('/wallets');
  }
}

export const apiClient = new ApiClient();