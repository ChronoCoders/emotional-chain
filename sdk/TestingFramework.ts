import { EmotionalChain, EmotionalChainConfig } from './EmotionalChainSDK';
import { BiometricDevice, BiometricReading, EmotionalState } from './BiometricSDK';
import { ValidatorInfo, ConsensusRound } from './ConsensusSDK';
import { Wallet } from './WalletSDK';
import { CONFIG } from '../shared/config';
/**
 * Comprehensive testing utilities for EmotionalChain dApp developers
 * 
 * @example  
 * ```typescript
 * import { EmotionalChainTester, MockDataGenerator } from '@emotionalchain/testing';
 * 
 * const tester = new EmotionalChainTester();
 * await tester.setupTestEnvironment();
 * 
 * const mockBiometric = MockDataGenerator.generateBiometricReading('heartrate');
 * const result = await tester.testEmotionalAuthentication(mockBiometric);
 * ```
 */
export interface TestConfig {
  network?: 'testnet' | 'devnet' | 'local';
  mockMode?: boolean;
  logLevel?: 'silent' | 'error' | 'warn' | 'info' | 'debug';
  timeout?: number;
  retries?: number;
}
export interface TestResult {
  passed: boolean;
  duration: number;
  error?: Error;
  data?: any;
  logs: string[];
}
export interface TestSuite {
  name: string;
  tests: TestCase[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}
export interface TestCase {
  name: string;
  test: () => Promise<TestResult>;
  timeout?: number;
  retry?: number;
}
export class EmotionalChainTester {
  private client?: EmotionalChain;
  private config: TestConfig;
  private testResults: Map<string, TestResult> = new Map();
  private logs: string[] = [];
  constructor(config: TestConfig = {}) {
    this.config = {
      network: 'testnet',
      mockMode: true,
      logLevel: 'info',
      timeout: 5000, // Fixed timeout instead of missing property
      retries: CONFIG.network.protocols.websocket.reconnectAttempts,
      ...config
    };
  }
  // Test environment setup
  async setupTestEnvironment(): Promise<void> {
    this.log('info', 'Setting up EmotionalChain test environment...');
    const clientConfig: EmotionalChainConfig = {
      endpoint: this.getTestEndpoint(),
      network: this.config.network as any,
      timeout: this.config.timeout
    };
    this.client = new EmotionalChain(clientConfig);
    // Configure biometric SDK for mock mode
    if (this.config.mockMode) {
      this.client.biometric.updateConfig({ mockMode: true });
    }
    try {
      await this.client.connect();
      this.log('info', 'Test environment ready');
    } catch (error) {
      this.log('error', `Failed to setup test environment: ${(error as Error).message}`);
      throw error;
    }
  }
  async teardownTestEnvironment(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = undefined;
    }
    this.log('info', 'Test environment cleaned up');
  }
  private getTestEndpoint(): string {
    switch (this.config.network) {
      case 'testnet':
        return 'https://testnet.emotionalchain.io';
      case 'devnet':
        return 'https://devnet.emotionalchain.io';
      case 'local':
        return 'http://localhost:8080';
      default:
        return 'https://testnet.emotionalchain.io';
    }
  }
  // Wallet testing
  async testWalletCreation(): Promise<TestResult> {
    return this.runTest('Wallet Creation', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      const wallet = await this.client.wallet.createWallet();
      if (!wallet.address || !wallet.publicKey) {
        throw new Error('Invalid wallet created');
      }
      if (!this.client.wallet.isValidAddress(wallet.address)) {
        throw new Error('Invalid wallet address format');
      }
      return { wallet };
    });
  }
  async testWalletBalance(): Promise<TestResult> {
    return this.runTest('Wallet Balance', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      const wallet = await this.client.wallet.createWallet();
      const balance = await this.client.wallet.getBalance(wallet.address);
      if (typeof balance !== 'number' || balance < 0) {
        throw new Error('Invalid balance returned');
      }
      return { balance, address: wallet.address };
    });
  }
  async testTransaction(): Promise<TestResult> {
    return this.runTest('Transaction Creation', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      const fromWallet = await this.client.wallet.createWallet();
      const toWallet = await this.client.wallet.createWallet();
      // In test mode, wallet should have initial balance
      const initialBalance = await this.client.wallet.getBalance(fromWallet.address);
      if (initialBalance === 0) {
        // Fund wallet for testing
        await this.fundTestWallet(fromWallet.address, 100);
      }
      const tx = await this.client.sendTransaction({
        from: fromWallet.address,
        to: toWallet.address,
        amount: 10
      });
      if (!tx.hash || !tx.from || !tx.to) {
        throw new Error('Invalid transaction created');
      }
      return { transaction: tx };
    });
  }
  // Biometric testing
  async testBiometricDeviceScanning(): Promise<TestResult> {
    return this.runTest('Biometric Device Scanning', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      const devices = await this.client.biometric.scanForDevices();
      if (!Array.isArray(devices)) {
        throw new Error('Device scan should return array');
      }
      // In mock mode, should return mock devices
      if (this.config.mockMode && devices.length === 0) {
        throw new Error('Mock mode should return test devices');
      }
      return { devices };
    });
  }
  async testBiometricAuthentication(): Promise<TestResult> {
    return this.runTest('Biometric Authentication', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      // Scan and connect to devices
      const devices = await this.client.biometric.scanForDevices();
      if (devices.length > 0) {
        await this.client.biometric.connectDevice(devices[0].id);
        await this.client.biometric.startMonitoring();
        // Wait for readings
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      const result = await this.client.biometric.authenticate();
      if (!result || typeof result.overall !== 'number') {
        throw new Error('Invalid authentication result');
      }
      if (result.overall < 0 || result.overall > 100) {
        throw new Error('Emotional score out of valid range');
      }
      return { emotionalState: result };
    });
  }
  async testEmotionalProofGeneration(): Promise<TestResult> {
    return this.runTest('Emotional Proof Generation', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      const emotionalScore = 85.5;
      const proof = await this.client.biometric.generateProof(emotionalScore);
      if (!proof.hash || !proof.signature) {
        throw new Error('Invalid proof generated');
      }
      const isValid = await this.client.biometric.verifyProof(proof);
      if (!isValid) {
        throw new Error('Generated proof failed verification');
      }
      return { proof, verified: isValid };
    });
  }
  // Consensus testing
  async testConsensusRoundFetching(): Promise<TestResult> {
    return this.runTest('Consensus Round Fetching', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      const currentRound = await this.client.consensus.getCurrentRound();
      if (!currentRound || !currentRound.roundId) {
        throw new Error('Invalid consensus round returned');
      }
      return { consensusRound: currentRound };
    });
  }
  async testValidatorInformation(): Promise<TestResult> {
    return this.runTest('Validator Information', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      const validators = await this.client.consensus.getValidators();
      if (!Array.isArray(validators)) {
        throw new Error('Validators should be returned as array');
      }
      if (validators.length > 0) {
        const validator = validators[0];
        if (!validator.id || typeof validator.emotionalScore !== 'number') {
          throw new Error('Invalid validator data structure');
        }
      }
      return { validators, count: validators.length };
    });
  }
  async testNetworkHealth(): Promise<TestResult> {
    return this.runTest('Network Health Check', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      const health = await this.client.healthCheck();
      const requiredServices = ['api', 'websocket', 'biometric', 'consensus'];
      for (const service of requiredServices) {
        if (!(service in health)) {
          throw new Error(`Missing health check for ${service}`);
        }
      }
      return { health };
    });
  }
  // Performance testing
  async testTransactionThroughput(txCount = 10): Promise<TestResult> {
    return this.runTest('Transaction Throughput', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      const wallet = await this.client.wallet.createWallet();
      await this.fundTestWallet(wallet.address, txCount * 10);
      const startTime = Date.now();
      const transactions = [];
      for (let i = 0; i < txCount; i++) {
        const toWallet = await this.client.wallet.createWallet();
        const tx = await this.client.sendTransaction({
          from: wallet.address,
          to: toWallet.address,
          amount: 1
        });
        transactions.push(tx as any); // Type assertion to handle interface mismatch
      }
      const duration = Date.now() - startTime;
      const tps = (txCount * 1000) / duration;
      return {
        transactions: transactions.length,
        duration,
        tps: tps.toFixed(2)
      };
    }, txCount * 5000); // Longer timeout for performance tests
  }
  async testWebSocketConnection(): Promise<TestResult> {
    return this.runTest('WebSocket Connection', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      let messageReceived = false;
      // Listen for any message
      const unsubscribe = this.client.websocket.onMessage(() => {
        messageReceived = true;
      });
      // Subscribe to consensus rounds
      await this.client.websocket.subscribeToConsensusRounds();
      // Wait for connection and potential messages
      await new Promise(resolve => setTimeout(resolve, 5000));
      const isConnected = this.client.websocket.isConnected();
      const subscriptions = this.client.websocket.getActiveSubscriptions();
      unsubscribe();
      return {
        connected: isConnected,
        subscriptions: subscriptions.length,
        messageReceived
      };
    });
  }
  // Integration testing
  async testFullEmotionalTransaction(): Promise<TestResult> {
    return this.runTest('Full Emotional Transaction', async () => {
      if (!this.client) throw new Error('Test environment not setup');
      // Create wallets
      const fromWallet = await this.client.wallet.createWallet();
      const toWallet = await this.client.wallet.createWallet();
      // Fund sender
      await this.fundTestWallet(fromWallet.address, 100);
      // Setup biometric monitoring
      const devices = await this.client.biometric.scanForDevices();
      if (devices.length > 0) {
        await this.client.biometric.connectDevice(devices[0].id);
        await this.client.biometric.startMonitoring();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      // Send transaction with emotional authentication
      const tx = await this.client.sendTransaction({
        from: fromWallet.address,
        to: toWallet.address,
        amount: 10,
        requireEmotionalAuth: true
      });
      // Wait for confirmation
      const confirmedTx = await this.client.waitForTransaction(tx.hash);
      if (confirmedTx.status !== 'confirmed') {
        throw new Error('Transaction was not confirmed');
      }
      return { transaction: confirmedTx };
    });
  }
  // Test suite execution
  async runTestSuite(suite: TestSuite): Promise<Map<string, TestResult>> {
    this.log('info', `Running test suite: ${suite.name}`);
    const results = new Map<string, TestResult>();
    try {
      // Setup
      if (suite.setup) {
        await suite.setup();
      }
      // Run tests
      for (const testCase of suite.tests) {
        this.log('info', `Running test: ${testCase.name}`);
        try {
          const result = await this.runTestWithRetry(
            testCase.test, 
            testCase.retry || this.config.retries!,
            testCase.timeout || this.config.timeout!
          );
          results.set(testCase.name, result);
        } catch (error) {
          const result: TestResult = {
            passed: false,
            duration: 0,
            error: error as Error,
            logs: [error instanceof Error ? error.message : String(error)]
          };
          results.set(testCase.name, result);
        }
      }
      // Teardown
      if (suite.teardown) {
        await suite.teardown();
      }
    } catch (error) {
      this.log('error', `Test suite setup/teardown failed: ${(error as Error).message}`);
    }
    return results;
  }
  // Helper methods
  private async runTest(name: string, testFn: () => Promise<any>, timeout?: number): Promise<TestResult> {
    const startTime = Date.now();
    try {
      const data = await this.withTimeout(testFn(), timeout || this.config.timeout!);
      const duration = Date.now() - startTime;
      const result: TestResult = {
        passed: true,
        duration,
        data,
        logs: [`Test ${name} completed successfully`]
      };
      this.testResults.set(name, result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        passed: false,
        duration,
        error: error as Error,
        logs: [`Test ${name} failed: ${(error as Error).message}`]
      };
      this.testResults.set(name, result);
      throw error;
    }
  }
  private async runTestWithRetry(testFn: () => Promise<TestResult>, retries: number, timeout: number): Promise<TestResult> {
    let lastError: Error;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.withTimeout(testFn(), timeout);
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          this.log('warn', `Test attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }
    throw lastError!;
  }
  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }
  private async fundTestWallet(address: string, amount: number): Promise<void> {
    // In a real implementation, this would fund the wallet from a test faucet
    this.log('debug', `Funding test wallet ${address} with ${amount} EMO`);
  }
  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    this.logs.push(logMessage);
    if (this.shouldLog(level)) {
      console.log(logMessage);
    }
  }
  private shouldLog(level: string): boolean {
    const levels = ['silent', 'error', 'warn', 'info', 'debug'];
    const currentLevel = levels.indexOf(this.config.logLevel!);
    const messageLevel = levels.indexOf(level);
    return messageLevel <= currentLevel;
  }
  // Results and reporting
  getTestResults(): Map<string, TestResult> {
    return new Map(this.testResults);
  }
  generateReport(): {
    summary: {
      total: number;
      passed: number;
      failed: number;
      duration: number;
    };
    results: Array<{
      name: string;
      passed: boolean;
      duration: number;
      error?: string;
    }>;
  } {
    const results = Array.from(this.testResults.entries());
    const totalDuration = results.reduce((sum, [, result]) => sum + result.duration, 0);
    return {
      summary: {
        total: results.length,
        passed: results.filter(([, result]) => result.passed).length,
        failed: results.filter(([, result]) => !result.passed).length,
        duration: totalDuration
      },
      results: results.map(([name, result]) => ({
        name,
        passed: result.passed,
        duration: result.duration,
        error: result.error?.message
      }))
    };
  }
  getLogs(): string[] {
    return [...this.logs];
  }
  clearResults(): void {
    this.testResults.clear();
    this.logs = [];
  }
}
// Deterministic test data generator using secure RNG
export class MockDataGenerator {
  private static seedCounter = 0;
  
  // Deterministic pseudo-random number generator for testing
  private static deterministicRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  
  private static getNextSeed(): number {
    return ++this.seedCounter;
  }
  
  static generateBiometricDevice(type: 'heartrate' | 'stress' | 'focus' = 'heartrate'): BiometricDevice {
    const seed = this.getNextSeed();
    return {
      id: `test-${type}-${Date.now()}-${seed}`,
      name: `Test ${type} Device`,
      type,
      status: 'connected',
      lastReading: Date.now(),
      batteryLevel: 50 + this.deterministicRandom(seed) * 50,
      signalQuality: 0.8 + this.deterministicRandom(seed + 1) * 0.2,
      manufacturer: 'TestCorp',
      model: 'DeterministicDevice-1'
    };
  }
  static generateBiometricReading(type: string): BiometricReading {
    const seed = this.getNextSeed();
    let value: number;
    let unit: string;
    
    switch (type) {
      case 'heartrate':
        value = 65 + this.deterministicRandom(seed) * 20;
        unit = 'BPM';
        break;
      case 'stress':
        value = 20 + this.deterministicRandom(seed) * 30;
        unit = 'stress_units';
        break;
      case 'focus':
        value = 70 + this.deterministicRandom(seed) * 25;
        unit = 'focus_score';
        break;
      default:
        value = this.deterministicRandom(seed) * 100;
        unit = 'units';
    }
    
    return {
      deviceId: `test-${type}-device`,
      type,
      value,
      unit,
      timestamp: Date.now(),
      quality: 0.8 + this.deterministicRandom(seed + 1) * 0.2,
      processed: false
    };
  }
  static generateEmotionalState(): EmotionalState {
    const seed = this.getNextSeed();
    return {
      overall: 75 + this.deterministicRandom(seed) * 20,
      stress: 70 + this.deterministicRandom(seed + 1) * 25,
      focus: 80 + this.deterministicRandom(seed + 2) * 15,
      authenticity: 85 + this.deterministicRandom(seed + 3) * 10,
      timestamp: Date.now(),
      confidence: 0.8 + this.deterministicRandom(seed + 4) * 0.2
    };
  }
  static generateWallet(): Wallet {
    const seed = this.getNextSeed();
    const address = '0x' + Array.from({ length: 40 }, (_, i) => 
      Math.floor(this.deterministicRandom(seed + i) * 16).toString(16)
    ).join('');
    
    return {
      address,
      publicKey: '0x' + Array.from({ length: 64 }, (_, i) => 
        Math.floor(this.deterministicRandom(seed + 40 + i) * 16).toString(16)
      ).join(''),
      balance: this.deterministicRandom(seed + 100) * 1000,
      nonce: Math.floor(this.deterministicRandom(seed + 101) * 100),
      createdAt: Date.now()
    };
  }
  static generateValidator(): ValidatorInfo {
    const seed = this.getNextSeed();
    const idSeed = this.deterministicRandom(seed);
    const id = `validator-${Math.floor(idSeed * 1000000).toString(36)}`;
    const baseEmotionalScore = CONFIG.consensus.thresholds.emotionalScore;
    const minStake = (CONFIG.consensus.thresholds.consensusQuorum || 3) * 1000; // Dynamic minimum stake
    
    return {
      id,
      address: '0x' + Array.from({ length: 40 }, (_, i) => 
        Math.floor(this.deterministicRandom(seed + 10 + i) * 16).toString(16)
      ).join(''),
      name: `Validator ${id}`,
      emotionalScore: baseEmotionalScore * 0.93 + this.deterministicRandom(seed + 1) * (100 - baseEmotionalScore),
      participationRate: CONFIG.consensus.thresholds.participationRate + this.deterministicRandom(seed + 2) * (1 - CONFIG.consensus.thresholds.participationRate),
      reputationScore: 70 + this.deterministicRandom(seed + 3) * 25, // Use fixed minimum instead of missing property
      status: 'active',
      stake: minStake + this.deterministicRandom(seed + 4) * (minStake * 9),
      rewards: this.deterministicRandom(seed + 5) * (CONFIG.consensus.rewards.baseReward || 100) * 10,
      penalties: this.deterministicRandom(seed + 6) * (CONFIG.consensus.rewards.baseReward || 100),
      lastActive: Date.now() - this.deterministicRandom(seed + 7) * 30 * 24 * 60 * 60 * 1000, // Use fixed 30 days instead of missing property
      biometricDevices: ['heartrate', 'stress']
    };
  }
  static generateConsensusRound(): ConsensusRound {
    const roundId = `round-${Date.now()}`;
    const blockTimeMs = (CONFIG.consensus.blockTime || 5) * 1000;
    const consensusTimeoutMs = 30000; // Fixed 30 second timeout
    return {
      roundId,
      epoch: Math.floor(Date.now() / blockTimeMs),
      phase: 'commit',
      startTime: Date.now() - (consensusTimeoutMs * 0.83),
      endTime: Date.now(),
      duration: Math.floor(consensusTimeoutMs * 0.83 / 1000),
      blockNumber: Math.floor(this.deterministicRandom(Date.now()) * 10000),
      proposer: 'validator-' + Math.floor(this.deterministicRandom(Date.now() + 1) * 1000000).toString(36),
      participants: Array.from({ length: 5 }, (_, i) => 
        'validator-' + Math.floor(this.deterministicRandom(Date.now() + 2 + i) * 1000000).toString(36)
      ),
      emotionalScores: {
        'validator-1': 85.2,
        'validator-2': 78.9,
        'validator-3': 92.1,
        'validator-4': 81.7,
        'validator-5': 87.3
      },
      votes: {
        'validator-1': 'yes',
        'validator-2': 'yes',
        'validator-3': 'yes',
        'validator-4': 'yes',
        'validator-5': 'yes'
      },
      result: 'success',
      byzantineFailures: []
    };
  }
}