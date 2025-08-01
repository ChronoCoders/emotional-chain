import { EventEmitter } from 'eventemitter3';
import axios, { AxiosInstance } from 'axios';
import { WalletSDK } from './WalletSDK';
import { BiometricSDK } from './BiometricSDK';
import { ConsensusSDK } from './ConsensusSDK';
import { WebSocketSDK } from './WebSocketSDK';
/**
 * EmotionalChain SDK - Main entry point for developers
 * 
 * @example
 * ```typescript
 * import { EmotionalChain } from '@emotionalchain/sdk';
 * 
 * const client = new EmotionalChain({
 *   endpoint: 'https://mainnet.emotionalchain.io',
 *   apiKey: 'your-api-key'
 * });
 * 
 * const wallet = await client.createWallet();
 * const tx = await client.sendTransaction({
 *   from: wallet.address,
 *   to: '0x742d35Cc6Cb8e8532',
 *   amount: 100,
 *   requireEmotionalAuth: true
 * });
 * ```
 */
export interface EmotionalChainConfig {
  endpoint: string;
  apiKey?: string;
  network?: 'mainnet' | 'testnet' | 'devnet';
  timeout?: number;
  retries?: number;
  websocketEndpoint?: string;
  pollInterval?: number;
  transactionTimeout?: number;
  emotionalThresholdDefault?: number;
}
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  emotionalScore?: number;
  biometricProof?: any;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockHash?: string;
  blockNumber?: number;
  gasUsed?: number;
}
export interface TransactionRequest {
  from: string;
  to: string;
  amount: number;
  requireEmotionalAuth?: boolean;
  emotionalThreshold?: number;
  data?: any;
  gasLimit?: number;
  gasPrice?: number;
}
export interface NetworkInfo {
  networkId: number;
  networkName: string;
  blockHeight: number;
  validators: number;
  averageEmotionalScore: number;
  consensusStrength: number;
  throughput: number;
}
export class EmotionalChain extends EventEmitter {
  private config: EmotionalChainConfig;
  private httpClient: AxiosInstance;
  // SDK modules
  public wallet: WalletSDK;
  public biometric: BiometricSDK;
  public consensus: ConsensusSDK;
  public websocket: WebSocketSDK;
  constructor(config: EmotionalChainConfig) {
    super();
    this.config = {
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      network: config.network || 'mainnet',
      pollInterval: config.pollInterval || 2000,
      transactionTimeout: config.transactionTimeout || 60000,
      emotionalThresholdDefault: config.emotionalThresholdDefault || 75,
      ...config
    };
    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.endpoint,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EmotionalChain-SDK/1.0.0',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey })
      }
    });
    // Initialize SDK modules
    this.wallet = new WalletSDK(this.httpClient);
    this.biometric = new BiometricSDK(this.httpClient);
    this.consensus = new ConsensusSDK(this.httpClient);
    this.websocket = new WebSocketSDK({
      endpoint: this.config.websocketEndpoint || this.config.endpoint.replace('http', 'ws') + '/ws',
      apiKey: this.config.apiKey
    });
    this.setupEventForwarding();
    this.setupInterceptors();
  }
  private setupEventForwarding(): void {
    // Forward events from modules
    this.websocket.on('consensusRound', (data) => this.emit('consensusRound', data));
    this.websocket.on('newBlock', (data) => this.emit('newBlock', data));
    this.websocket.on('transaction', (data) => this.emit('transaction', data));
    this.websocket.on('validatorUpdate', (data) => this.emit('validatorUpdate', data));
    this.websocket.on('networkAlert', (data) => this.emit('networkAlert', data));
    this.biometric.on('emotionalScoreUpdate', (data) => this.emit('emotionalScoreUpdate', data));
    this.biometric.on('deviceConnected', (data) => this.emit('deviceConnected', data));
    this.biometric.on('deviceDisconnected', (data) => this.emit('deviceDisconnected', data));
  }
  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use((config) => {
      config.metadata = { startTime: Date.now() };
      return config;
    });
    // Response interceptor with retry logic
    this.httpClient.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata?.startTime;
        this.emit('apiCall', {
          url: response.config.url,
          method: response.config.method,
          status: response.status,
          duration
        });
        return response;
      },
      async (error) => {
        const config = error.config;
        if (!config || !config.retry) {
          config.retry = 0;
        }
        if (config.retry < this.config.retries && this.shouldRetry(error)) {
          config.retry++;
          await this.delay(Math.pow(2, config.retry) * 1000); // Exponential backoff
          return this.httpClient(config);
        }
        throw this.enhanceError(error);
      }
    );
  }
  private shouldRetry(error: any): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      (error.response && error.response.status >= 500)
    );
  }
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  private enhanceError(error: any): Error {
    const enhanced = new Error();
    enhanced.name = 'EmotionalChainError';
    if (error.response) {
      enhanced.message = `API Error ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      (enhanced as any).status = error.response.status;
      (enhanced as any).data = error.response.data;
    } else if (error.request) {
      enhanced.message = 'Network Error: No response received from EmotionalChain API';
    } else {
      enhanced.message = error.message || 'Unknown error occurred';
    }
    (enhanced as any).originalError = error;
    return enhanced;
  }
  // Core SDK methods
  async connect(): Promise<NetworkInfo> {
    try {
      const response = await this.httpClient.get('/api/v1/network/info');
      const networkInfo = response.data;
      // Connect WebSocket
      await this.websocket.connect();
      this.emit('connected', networkInfo);
      return networkInfo;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  async disconnect(): Promise<void> {
    await this.websocket.disconnect();
    this.emit('disconnected');
  }
  async getNetworkInfo(): Promise<NetworkInfo> {
    const response = await this.httpClient.get('/api/v1/network/info');
    return response.data;
  }
  async sendTransaction(request: TransactionRequest): Promise<Transaction> {
    try {
      // Validate emotional authentication if required
      if (request.requireEmotionalAuth) {
        const emotionalScore = await this.biometric.getCurrentEmotionalScore();
        const threshold = request.emotionalThreshold || this.config.emotionalThresholdDefault;
        if (emotionalScore < threshold) {
          throw new Error(`Emotional score ${emotionalScore}% below threshold ${threshold}%`);
        }
        // Generate biometric proof
        const biometricProof = await this.biometric.generateProof(emotionalScore);
        (request as any).biometricProof = biometricProof;
      }
      const response = await this.httpClient.post('/api/v1/transactions', request);
      const transaction = response.data;
      this.emit('transactionCreated', transaction);
      return transaction;
    } catch (error) {
      this.emit('transactionError', error);
      throw error;
    }
  }
  async getTransaction(hash: string): Promise<Transaction> {
    const response = await this.httpClient.get(`/api/v1/transactions/${hash}`);
    return response.data;
  }
  async getTransactionHistory(address: string, limit = 50, offset = 0): Promise<Transaction[]> {
    const response = await this.httpClient.get('/api/v1/transactions', {
      params: { address, limit, offset }
    });
    return response.data.transactions;
  }
  async waitForTransaction(hash: string, timeout?: number): Promise<Transaction> {
    const actualTimeout = timeout || this.config.transactionTimeout;
    const startTime = Date.now();
    while (Date.now() - startTime < actualTimeout) {
      try {
        const tx = await this.getTransaction(hash);
        if (tx.status === 'confirmed' || tx.status === 'failed') {
          return tx;
        }
        await this.delay(this.config.pollInterval);
      } catch (error) {
        // Transaction might not exist yet, continue polling
        await this.delay(this.config.pollInterval);
      }
    }
    throw new Error(`Transaction ${hash} timeout after ${actualTimeout}ms`);
  }
  // Block and blockchain methods
  async getLatestBlock(): Promise<any> {
    const response = await this.httpClient.get('/api/v1/blocks/latest');
    return response.data;
  }
  async getBlock(hashOrNumber: string | number): Promise<any> {
    const response = await this.httpClient.get(`/api/v1/blocks/${hashOrNumber}`);
    return response.data;
  }
  async getBlockRange(start: number, end: number): Promise<any[]> {
    const response = await this.httpClient.get('/api/v1/blocks/range', {
      params: { start, end }
    });
    return response.data.blocks;
  }
  // Validator methods
  async getValidators(): Promise<any[]> {
    const response = await this.httpClient.get('/api/v1/validators');
    return response.data.validators;
  }
  async getValidator(id: string): Promise<any> {
    const response = await this.httpClient.get(`/api/v1/validators/${id}`);
    return response.data;
  }
  // Utility methods
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  isValidTransactionHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }
  convertToWei(amount: number): string {
    return (amount * 1e18).toString();
  }
  convertFromWei(wei: string): number {
    return parseInt(wei) / 1e18;
  }
  // Event subscription helpers
  onConsensusRound(callback: (data: any) => void): () => void {
    this.on('consensusRound', callback);
    return () => this.off('consensusRound', callback);
  }
  onNewBlock(callback: (block: any) => void): () => void {
    this.on('newBlock', callback);
    return () => this.off('newBlock', callback);
  }
  onTransaction(callback: (tx: Transaction) => void): () => void {
    this.on('transaction', callback);
    return () => this.off('transaction', callback);
  }
  onEmotionalScoreUpdate(callback: (data: any) => void): () => void {
    this.on('emotionalScoreUpdate', callback);
    return () => this.off('emotionalScoreUpdate', callback);
  }
  // Error handling helpers
  isNetworkError(error: any): boolean {
    return error.name === 'EmotionalChainError' && !error.status;
  }
  isAPIError(error: any): boolean {
    return error.name === 'EmotionalChainError' && error.status;
  }
  getErrorCode(error: any): string | null {
    return error.data?.code || null;
  }
  // Development and testing helpers
  async generateTestData(): Promise<{
    wallet: any;
    transaction: TransactionRequest;
    biometricData: any;
  }> {
    const wallet = await this.wallet.createWallet();
    const transaction = {
      from: wallet.address,
      to: '0x' + '0'.repeat(40),
      amount: 1,
      requireEmotionalAuth: true
    };
    const biometricData = await this.biometric.generateMockData();
    return { wallet, transaction, biometricData };
  }
  // Health check
  async healthCheck(): Promise<{
    api: boolean;
    websocket: boolean;
    biometric: boolean;
    consensus: boolean;
  }> {
    const results = {
      api: false,
      websocket: false,
      biometric: false,
      consensus: false
    };
    try {
      await this.getNetworkInfo();
      results.api = true;
    } catch (error) {
      // API is down
    }
    try {
      results.websocket = this.websocket.isConnected();
    } catch (error) {
      // WebSocket is down
    }
    try {
      await this.biometric.getDeviceStatus();
      results.biometric = true;
    } catch (error) {
      // Biometric service is down
    }
    try {
      await this.consensus.getCurrentRound();
      results.consensus = true;
    } catch (error) {
      // Consensus service is down
    }
    return results;
  }
  // Configuration
  getConfig(): EmotionalChainConfig {
    return { ...this.config };
  }
  updateConfig(updates: Partial<EmotionalChainConfig>): void {
    this.config = { ...this.config, ...updates };
    // Update HTTP client if endpoint changed
    if (updates.endpoint) {
      this.httpClient.defaults.baseURL = updates.endpoint;
    }
    // Update API key if changed
    if (updates.apiKey !== undefined) {
      if (updates.apiKey) {
        this.httpClient.defaults.headers['X-API-Key'] = updates.apiKey;
      } else {
        delete this.httpClient.defaults.headers['X-API-Key'];
      }
    }
  }
  // Cleanup
  async destroy(): Promise<void> {
    await this.disconnect();
    this.removeAllListeners();
  }
}
// Export default instance creation helper
export function createEmotionalChainClient(config: EmotionalChainConfig): EmotionalChain {
  return new EmotionalChain(config);
}
// Export types for developers
export * from './WalletSDK';
export * from './BiometricSDK';
export * from './ConsensusSDK';
export * from './WebSocketSDK';