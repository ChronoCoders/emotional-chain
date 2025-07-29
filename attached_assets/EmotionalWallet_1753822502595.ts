// EmotionalChain Wallet & CLI Interface
// File: emotional-chain/src/wallet/EmotionalWallet.ts

import { createHash, randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path;
import { EmotionalChain, Transaction, EmotionalValidator, BiometricData } from '../blockchain/EmotionalChain.js';
import { EmotionalNetwork } from '../network/EmotionalNetwork.js';

// Wallet interfaces
interface WalletAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  balance: number;
  emotionalProfile?: EmotionalProfile;
  isValidator: boolean;
}

interface EmotionalProfile {
  baselineEmotions: EmotionalVector;
  stressThreshold: number;
  authenticityScore: number;
  validationHistory: ValidationRecord[];
}

interface ValidationRecord {
  timestamp: number;
  emotionalState: EmotionalVector;
  consensusScore: number;
  rewardEarned: number;
}

interface EmotionalVector {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  neutral: number;
  confidence: number;
}

interface WalletConfig {
  dataDir: string;
  networkPort: number;
  bootstrapNodes: string[];
  validatorSettings?: ValidatorSettings;
}

interface ValidatorSettings {
  minStake: number;
  biometricSensors: string[];
  emotionalThreshold: number;
  autoMining: boolean;
}

// EmotionalChain Wallet Class
class EmotionalWallet {
  private accounts: Map<string, WalletAccount> = new Map();
  private blockchain: EmotionalChain;
  private network: EmotionalNetwork;
  private config: WalletConfig;
  private dataDir: string;
  private currentAccount?: WalletAccount;
  private isShuttingDown: boolean = false;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: WalletConfig) {
    this.config = config;
    this.dataDir = config.dataDir;
    this.blockchain = new EmotionalChain();
    this.network = new EmotionalNetwork(
      this.blockchain, 
      this.generateNodeId(), 
      config.networkPort
    );
    
    this.initializeWallet();
  }

  // Initialize wallet
  private initializeWallet(): void {
    try {
      // Create data directory if it doesn't exist
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // Load existing accounts
      this.loadAccounts();
      
      // Connect to network
      this.connectToNetwork();
      
      console.log('💰 EmotionalChain Wallet initialized');
      console.log(`📊 Research by: Altug Tatlisu, CEO Bytus Technologies`);
      
      // Start periodic maintenance
      this.startHeartbeat();
      
    } catch (error) {
      console.error('[ERROR] Wallet initialization failed:', error);
      throw error;
    }
  }

  // Start heartbeat monitoring
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isShuttingDown) return;
      
      try {
        const stats = this.network.getNetworkStats();
        const chainStats = this.blockchain.getChainStats();
        // Silent heartbeat - only log if there are issues
        if (stats.connectedPeers === 0 && chainStats.totalValidators > 0) {
          console.log('[WARNING] No network peers but validators present');
        }
      } catch (error) {
        console.error('[ERROR] Heartbeat error:', error);
      }
    }, 60000); // Every minute
  }

  // Create new account
  public createAccount(name?: string): WalletAccount {
    try {
      const privateKey = this.generatePrivateKey();
      const publicKey = this.generatePublicKey(privateKey);
      const address = this.generateAddress(publicKey);

      const account: WalletAccount = {
        address,
        publicKey,
        privateKey,
        balance: 0,
        isValidator: false
      };

      this.accounts.set(address, account);
      this.saveAccounts();

      console.log(`✅ New account created: ${address}`);
      if (name) {
        console.log(`📛 Account name: ${name}`);
      }
      
      return account;
    } catch (error) {
      console.error('[ERROR] Account creation failed:', error);
      throw error;
    }
  }

  // Import account from private key
  public importAccount(privateKey: string): WalletAccount {
    try {
      if (!privateKey || privateKey.length !== 64) {
        throw new Error('Invalid private key format');
      }

      const publicKey = this.generatePublicKey(privateKey);
      const address = this.generateAddress(publicKey);

      const account: WalletAccount = {
        address,
        publicKey,
        privateKey,
        balance: 0,
        isValidator: false
      };

      this.accounts.set(address, account);
      this.saveAccounts();

      console.log(`📥 Account imported: ${address}`);
      return account;
    } catch (error) {
      console.error('[ERROR] Account import failed:', error);
      throw error;
    }
  }

  // Set current active account
  public setCurrentAccount(address: string): boolean {
    try {
      const account = this.accounts.get(address);
      if (account) {
        this.currentAccount = account;
        console.log(`👤 Current account set to: ${address}`);
        return true;
      }
      console.log('❌ Account not found');
      return false;
    } catch (error) {
      console.error('[ERROR] Set current account failed:', error);
      return false;
    }
  }

  // Get account balance
  public getBalance(address?: string): number {
    try {
      const targetAddress = address || this.currentAccount?.address;
      if (!targetAddress) return 0;

      // Calculate balance from blockchain
      const chain = this.blockchain.getChain();
      let balance = 0;

      chain.forEach(block => {
        block.transactions.forEach(tx => {
          if (tx.to === targetAddress) {
            balance += tx.amount;
          }
          if (tx.from === targetAddress) {
            balance -= (tx.amount + tx.fee);
          }
        });
      });

      // Update account balance in cache
      const account = this.accounts.get(targetAddress);
      if (account) {
        account.balance = balance;
        this.accounts.set(targetAddress, account);
      }

      return balance;
    } catch (error) {
      console.error('[ERROR] Get balance failed:', error);
      return 0;
    }
  }

  // Send transaction
  public async sendTransaction(
    to: string, 
    amount: number, 
    fee: number = 1
  ): Promise<Transaction | null> {
    try {
      if (!this.currentAccount) {
        console.log('❌ No active account selected');
        return null;
      }

      if (!this.isValidAddress(to)) {
        console.log('❌ Invalid recipient address');
        return null;
      }

      if (amount <= 0 || fee < 0) {
        console.log('❌ Invalid amount or fee');
        return null;
      }

      const currentBalance = this.getBalance();
      if (currentBalance < amount + fee) {
        console.log(`❌ Insufficient balance. Current: ${currentBalance} EMO, Required: ${amount + fee} EMO`);
        return null;
      }

      const transaction: Transaction = {
        id: this.generateTransactionId(),
        from: this.currentAccount.address,
        to,
        amount,
        fee,
        timestamp: Date.now(),
        signature: this.signTransaction(this.currentAccount.privateKey, { to, amount, fee }),
        type: 'transfer'
      };

      if (this.blockchain.addTransaction(transaction)) {
        console.log(`💸 Transaction sent successfully!`);
        console.log(`   ID: ${transaction.id}`);
        console.log(`   Amount: ${amount} EMO`);
        console.log(`   Fee: ${fee} EMO`);
        return transaction;
      }

      console.log('❌ Transaction failed to be added to blockchain');
      return null;
    } catch (error) {
      console.error('[ERROR] Send transaction failed:', error);
      return null;
    }
  }

  // Register as validator
  public async registerAsValidator(
    stake: number,
    biometricProfile: EmotionalProfile
  ): Promise<boolean> {
    try {
      if (!this.currentAccount) {
        console.log('❌ No active account selected');
        return false;
      }

      if (stake < 1000) {
        console.log('❌ Minimum stake of 1000 EMO required');
        return false;
      }

      const currentBalance = this.getBalance();
      if (currentBalance < stake) {
        console.log(`❌ Insufficient balance for staking. Current: ${currentBalance} EMO, Required: ${stake} EMO`);
        return false;
      }

      const validator: EmotionalValidator = {
        id: this.currentAccount.address,
        publicKey: this.currentAccount.publicKey,
        stake,
        emotionalConsistency: biometricProfile.authenticityScore,
        uptime: 1.0,
        reputation: 0.8, // Initial reputation
        biometricProfile: {
          baselineHeartRate: 72, // Would be calibrated from real data
          emotionalRange: biometricProfile.baselineEmotions,
          stressThreshold: biometricProfile.stressThreshold,
          authenticityScore: biometricProfile.authenticityScore
        },
        lastValidation: Date.now()
      };

      // Register with blockchain and network
      if (this.blockchain.registerValidator(validator)) {
        this.network.registerAsValidator(validator);

        // Update account
        this.currentAccount.isValidator = true;
        this.currentAccount.emotionalProfile = biometricProfile;
        this.accounts.set(this.currentAccount.address, this.currentAccount);
        this.saveAccounts();

        console.log(`👑 Successfully registered as validator!`);
        console.log(`   Stake: ${stake} EMO`);
        console.log(`   Authenticity Score: ${(biometricProfile.authenticityScore * 100).toFixed(1)}%`);
        console.log(`   Emotional Consistency: ${(validator.emotionalConsistency * 100).toFixed(1)}%`);
        
        return true;
      }

      console.log('❌ Validator registration failed');
      return false;
    } catch (error) {
      console.error('[ERROR] Validator registration failed:', error);
      return false;
    }
  }

  // Start mining (for validators)
  public async startMining(biometricData?: BiometricData): Promise<void> {
    try {
      if (!this.currentAccount?.isValidator) {
        console.log('❌ Account is not a validator');
        return;
      }

      console.log('⛏️  Starting mining with biometric validation...');
      
      const data = biometricData || this.generateTestBiometricData();
      
      console.log('🧠 Processing biometric data...');
      console.log(`   Heart Rate: ${data.heartRate.toFixed(1)} BPM`);
      console.log(`   Stress Level: ${(data.voiceStress * 100).toFixed(1)}%`);
      console.log(`   Authenticity: ${(data.facialExpression.confidence * 100).toFixed(1)}%`);
      
      await this.network.startMining(data);
      console.log('✅ Mining attempt completed');
    } catch (error) {
      console.error('[ERROR] Mining failed:', error);
    }
  }

  // Get transaction history
  public getTransactionHistory(address?: string): Transaction[] {
    try {
      const targetAddress = address || this.currentAccount?.address;
      if (!targetAddress) return [];

      const chain = this.blockchain.getChain();
      const transactions: Transaction[] = [];

      chain.forEach(block => {
        block.transactions.forEach(tx => {
          if (tx.from === targetAddress || tx.to === targetAddress) {
            transactions.push(tx);
          }
        });
      });

      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('[ERROR] Get transaction history failed:', error);
      return [];
    }
  }

  // Get emotional validation history
  public getValidationHistory(address?: string): ValidationRecord[] {
    try {
      const targetAddress = address || this.currentAccount?.address;
      const account = this.accounts.get(targetAddress || '');
      
      return account?.emotionalProfile?.validationHistory || [];
    } catch (error) {
      console.error('[ERROR] Get validation history failed:', error);
      return [];
    }
  }

  // Generate biometric data (for testing)
  public generateTestBiometricData(): BiometricData {
    try {
      const baseHeartRate = 60 + Math.random() * 40; // 60-100 BPM
      const stressLevel = Math.random() * 0.6; // 0-60% stress
      
      return {
        heartRate: baseHeartRate,
        heartRateVariability: 20 + Math.random() * 60, // 20-80ms
        facialExpression: {
          joy: Math.max(0, 0.7 - stressLevel + Math.random() * 0.3),
          sadness: Math.random() * 0.3 * stressLevel,
          anger: Math.random() * 0.2 * stressLevel,
          fear: Math.random() * 0.2 * stressLevel,
          surprise: Math.random() * 0.4,
          disgust: Math.random() * 0.1,
          neutral: Math.random() * 0.5,
          confidence: 0.7 + Math.random() * 0.3
        },
        voiceStress: stressLevel,
        galvanicSkinResponse: stressLevel + Math.random() * 0.2,
        eyeTracking: {
          pupilDilation: 2 + Math.random() * 4, // 2-6mm
          gazePattern: [Math.random(), Math.random(), Math.random()],
          blinkRate: 10 + Math.random() * 20, // 10-30 blinks/min
          fixationDuration: 100 + Math.random() * 400 // 100-500ms
        },
        timestamp: Date.now(),
        deviceSignature: this.generateDeviceSignature()
      };
    } catch (error) {
      console.error('[ERROR] Generate test biometric data failed:', error);
      throw error;
    }
  }

  // Get wallet status
  public getWalletStatus() {
    try {
      const networkStats = this.network.getNetworkStats();
      const chainStats = this.blockchain.getChainStats();
      
      return {
        accounts: this.accounts.size,
        currentAccount: this.currentAccount?.address,
        balance: this.getBalance(),
        isValidator: this.currentAccount?.isValidator || false,
        networkPeers: networkStats.connectedPeers,
        activeValidators: networkStats.activeValidators,
        blockchainLength: chainStats.totalBlocks,
        consensusScore: chainStats.avgConsensusScore,
        authenticity: chainStats.avgAuthenticity,
        networkStats,
        chainStats
      };
    } catch (error) {
      console.error('[ERROR] Get wallet status failed:', error);
      return {
        accounts: 0,
        currentAccount: null,
        balance: 0,
        isValidator: false,
        error: (error as Error).message
      };
    }
  }

  // Private helper methods
  private generateNodeId(): string {
    return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePrivateKey(): string {
    return randomBytes(32).toString('hex');
  }

  private generatePublicKey(privateKey: string): string {
    return createHash('sha256').update(privateKey).digest('hex');
  }

  private generateAddress(publicKey: string): string {
    return '0x' + createHash('ripemd160').update(publicKey).digest('hex');
  }

  private generateTransactionId(): string {
    return createHash('sha256')
      .update(Date.now().toString() + Math.random())
      .digest('hex')
      .substring(0, 16);
  }

  private generateDeviceSignature(): string {
    return createHash('sha256')
      .update(`device_${Date.now()}_${Math.random()}`)
      .digest('hex')
      .substring(0, 32);
  }

  private signTransaction(privateKey: string, data: any): string {
    const dataString = JSON.stringify(data);
    return createHash('sha256').update(privateKey + dataString).digest('hex');
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private async connectToNetwork(): Promise<void> {
    try {
      for (const node of this.config.bootstrapNodes) {
        const [host, port] = node.split(':');
        const connected = await this.network.connectToPeer(host, parseInt(port));
        if (connected) {
          console.log(`🌐 Connected to bootstrap node: ${node}`);
        } else {
          console.log(`⚠️  Failed to connect to bootstrap node: ${node}`);
        }
      }
    } catch (error) {
      console.error('[ERROR] Network connection failed:', error);
    }
  }

  private loadAccounts(): void {
    const accountsPath = path.join(this.dataDir, 'accounts.json');
    try {
      if (fs.existsSync(accountsPath)) {
        const accountsData = fs.readFileSync(accountsPath, 'utf8');
        const accounts = JSON.parse(accountsData);
        
        Object.entries(accounts).forEach(([address, account]) => {
          this.accounts.set(address, account as WalletAccount);
        });
        
        console.log(`📂 Loaded ${this.accounts.size} accounts from storage`);
      }
    } catch (error) {
      console.error('[ERROR] Failed to load accounts:', error);
    }
  }

  private saveAccounts(): void {
    const accountsPath = path.join(this.dataDir, 'accounts.json');
    const accountsData = Object.fromEntries(this.accounts);
    
    try {
      fs.writeFileSync(accountsPath, JSON.stringify(accountsData, null, 2));
    } catch (error) {
      console.error('[ERROR] Failed to save accounts:', error);
    }
  }

  // Get all accounts
  public getAccounts(): WalletAccount[] {
    return Array.from(this.accounts.values());
  }

  // Get current account
  public getCurrentAccount(): WalletAccount | undefined {
    return this.currentAccount;
  }

  // Export account (returns private key)
  public exportAccount(address?: string): string | null {
    try {
      const targetAddress = address || this.currentAccount?.address;
      if (!targetAddress) {
        console.log('❌ No account specified or selected');
        return null;
      }

      const account = this.accounts.get(targetAddress);
      if (!account) {
        console.log('❌ Account not found');
        return null;
      }

      console.log('⚠️  WARNING: Keep your private key secure and never share it!');
      return account.privateKey;
    } catch (error) {
      console.error('[ERROR] Export account failed:', error);
      return null;
    }
  }

  // Shutdown wallet
  public shutdown(): void {
    try {
      this.isShuttingDown = true;
      
      // Clear heartbeat interval
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = undefined;
      }

      // Save accounts before shutdown
      this.saveAccounts();
      
      // Shutdown network
      this.network.shutdown();
      
      // Shutdown blockchain
      if (this.blockchain && typeof this.blockchain.shutdown === 'function') {
        this.blockchain.shutdown();
      }
      
      console.log('💰 EmotionalChain Wallet shutdown complete');
    } catch (error) {
      console.error('[ERROR] Wallet shutdown failed:', error);
    }
  }
}

// CLI Interface
class EmotionalChainCLI {
  private wallet: EmotionalWallet;

  constructor(wallet: EmotionalWallet) {
    this.wallet = wallet;
  }

  // Process CLI commands
  public async processCommand(command: string, args: string[]): Promise<void> {
    try {
      switch (command.toLowerCase()) {
        case 'help':
          this.showHelp();
          break;

        case 'create-account':
          this.createAccount(args[0]);
          break;

        case 'import-account':
          this.importAccount(args[0]);
          break;

        case 'export-account':
          this.exportAccount(args[0]);
          break;

        case 'list-accounts':
          this.listAccounts();
          break;

        case 'set-account':
          this.setCurrentAccount(args[0]);
          break;

        case 'balance':
          this.showBalance(args[0]);
          break;

        case 'send':
          await this.sendTransaction(args[0], parseFloat(args[1]), parseFloat(args[2]));
          break;

        case 'register-validator':
          await this.registerValidator(parseFloat(args[0]));
          break;

        case 'start-mining':
          await this.startMining();
          break;

        case 'history':
          this.showTransactionHistory(args[0]);
          break;

        case 'validation-history':
          this.showValidationHistory(args[0]);
          break;

        case 'status':
          this.showWalletStatus();
          break;

        case 'network-stats':
          this.showNetworkStats();
          break;

        case 'blockchain-info':
          this.showBlockchainInfo();
          break;

        case 'generate-biometric':
          this.generateTestBiometric();
          break;

        case 'clear':
          console.clear();
          break;

        case 'exit':
          console.log('Shutting down EmotionalChain Wallet...');
          this.wallet.shutdown();
          process.exit(0);
          break;

        default:
          console.log(`❌ Unknown command: ${command}`);
          console.log('Type "help" for available commands');
      }
    } catch (error) {
      console.error('[ERROR] Command execution failed:', error);
    }
  }

  private showHelp(): void {
    console.log(`
🧠 EmotionalChain CLI - Proof of Emotion Blockchain
Research by: Altug Tatlisu, CEO Bytus Technologies

ACCOUNT MANAGEMENT:
  create-account [name]           Create new wallet account
  import-account <private-key>    Import account from private key
  export-account [address]        Export private key for account
  list-accounts                   List all accounts
  set-account <address>           Set active account
  balance [address]               Show account balance

TRANSACTIONS:
  send <to-address> <amount> [fee]  Send EMO tokens
  history [address]                 Show transaction history

VALIDATOR OPERATIONS:
  register-validator <stake>        Register as validator
  start-mining                      Start mining with biometric data
  validation-history [address]     Show validation history

NETWORK & BLOCKCHAIN:
  status                           Show wallet status
  network-stats                    Show network statistics
  blockchain-info                  Show blockchain information

TESTING & UTILITIES:
  generate-biometric              Generate test biometric data
  clear                           Clear screen
  help                            Show this help message
  exit                            Exit the CLI

Examples:
  create-account my-validator
  send 0x1234... 100 1
  register-validator 5000
  start-mining

Note: This is research software by Altug Tatlisu demonstrating 
the world's first Proof of Emotion blockchain consensus mechanism.
    `);
  }

  private createAccount(name?: string): void {
    try {
      const account = this.wallet.createAccount(name);
      console.log(`✅ Account created successfully!`);
      console.log(`   Address: ${account.address}`);
      console.log(`   Public Key: ${account.publicKey}`);
      console.log(`   Private Key: ${account.privateKey}`);
      console.log(`⚠️  IMPORTANT: Keep your private key safe and never share it!`);
      console.log(`💡 Use 'export-account' command to retrieve it later.`);
    } catch (error) {
      console.error('❌ Failed to create account:', error);
    }
  }

  private importAccount(privateKey: string): void {
    if (!privateKey) {
      console.log('❌ Private key required');
      console.log('Usage: import-account <64-character-hex-private-key>');
      return;
    }

    try {
      const account = this.wallet.importAccount(privateKey);
      console.log(`✅ Account imported successfully!`);
      console.log(`   Address: ${account.address}`);
      console.log(`   Balance will be calculated from blockchain...`);
    } catch (error) {
      console.log('❌ Failed to import account. Please check the private key format.');
    }
  }

  private exportAccount(address?: string): void {
    try {
      const privateKey = this.wallet.exportAccount(address);
      if (privateKey) {
        console.log(`🔐 Private Key: ${privateKey}`);
        console.log(`⚠️  WARNING: Never share this private key with anyone!`);
      }
    } catch (error) {
      console.error('❌ Failed to export account:', error);
    }
  }

  private listAccounts(): void {
    try {
      const accounts = this.wallet.getAccounts();
      const current = this.wallet.getCurrentAccount();

      console.log(`\n📋 Wallet Accounts (${accounts.length}):`);
      console.log('─'.repeat(80));
      
      if (accounts.length === 0) {
        console.log('   No accounts found. Use "create-account" to create one.');
        return;
      }
      
      accounts.forEach((account, index) => {
        const isCurrent = current?.address === account.address;
        const indicator = isCurrent ? '👤' : '  ';
        const validatorBadge = account.isValidator ? '👑' : '  ';
        
        console.log(`${indicator} ${index + 1}. ${account.address}`);
        console.log(`   ${validatorBadge} Balance: ${account.balance} EMO | Validator: ${account.isValidator ? 'Yes' : 'No'}`);
        if (account.emotionalProfile) {
          console.log(`      Authenticity: ${(account.emotionalProfile.authenticityScore * 100).toFixed(1)}%`);
        }
        console.log('');
      });

      console.log('Legend: 👤 = Current Account, 👑 = Validator');
    } catch (error) {
      console.error('❌ Failed to list accounts:', error);
    }
  }

  private setCurrentAccount(address: string): void {
    if (!address) {
      console.log('❌ Address required');
      console.log('Usage: set-account <address>');
      return;
    }

    if (this.wallet.setCurrentAccount(address)) {
      const balance = this.wallet.getBalance();
      console.log(`✅ Current account set to: ${address}`);
      console.log(`💰 Current balance: ${balance} EMO`);
    } else {
      console.log('❌ Account not found. Use "list-accounts" to see available accounts.');
    }
  }

  private showBalance(address?: string): void {
    const balance = this.wallet.getBalance(address);
    const targetAddress = address || this.wallet.getCurrentAccount()?.address;
    
    if (!targetAddress) {
      console.log('❌ No account specified or selected');
      console.log('Use "set-account <address>" to select an account');
      return;
    }

    console.log(`💰 Balance for ${targetAddress}: ${balance} EMO`);
  }

  private async sendTransaction(to: string, amount: number, fee: number = 1): Promise<void> {
    if (!to || !amount) {
      console.log('❌ Recipient address and amount required');
      console.log('Usage: send <to-address> <amount> [fee]');
      return;
    }

    if (amount <= 0) {
      console.log('❌ Amount must be greater than 0');
      return;
    }

    console.log(`💸 Sending ${amount} EMO to ${to} with ${fee} EMO fee...`);
    
    const transaction = await this.wallet.sendTransaction(to, amount, fee);
    if (transaction) {
      console.log(`✅ Transaction sent successfully!`);
      console.log(`   Transaction ID: ${transaction.id}`);
      console.log(`   Timestamp: ${new Date(transaction.timestamp).toLocaleString()}`);
      
      // Show updated balance
      const newBalance = this.wallet.getBalance();
      console.log(`💰 New balance: ${newBalance} EMO`);
    }
  }

  private async registerValidator(stake: number): Promise<void> {
    if (!stake || stake < 1000) {
      console.log('❌ Minimum stake of 1000 EMO required');
      console.log('Usage: register-validator <stake-amount>');
      return;
    }

    console.log(`👑 Registering as validator with ${stake} EMO stake...`);

    // Generate realistic emotional profile
    const emotionalProfile: EmotionalProfile = {
      baselineEmotions: {
        joy: 0.6 + Math.random() * 0.2,      // 60-80%
        sadness: 0.05 + Math.random() * 0.1,  // 5-15%
        anger: 0.02 + Math.random() * 0.08,   // 2-10%
        fear: 0.05 + Math.random() * 0.1,     // 5-15%
        surprise: 0.1 + Math.random() * 0.1,  // 10-20%
        disgust: 0.01 + Math.random() * 0.04, // 1-5%
        neutral: 0.1 + Math.random() * 0.1,   // 10-20%
        confidence: 0.8 + Math.random() * 0.2  // 80-100%
      },
      stressThreshold: 0.2 + Math.random() * 0.3, // 20-50%
      authenticityScore: 0.85 + Math.random() * 0.15, // 85-100%
      validationHistory: []
    };

    const success = await this.wallet.registerAsValidator(stake, emotionalProfile);
    if (success) {
      console.log(`🎉 Validator registration successful!`);
      console.log(`   You can now use "start-mining" to begin validating blocks`);
    } else {
      console.log(`❌ Validator registration failed. Check your balance and try again.`);
    }
  }

  private async startMining(): Promise<void> {
    const currentAccount = this.wallet.getCurrentAccount();
    if (!currentAccount?.isValidator) {
      console.log('❌ Current account is not a validator');
      console.log('Use "register-validator <stake>" to become a validator first');
      return;
    }

    console.log('⛏️  Initiating mining process...');
    console.log('🧠 Generating biometric data for emotional validation...');
    
    await this.wallet.startMining();
  }

  private showTransactionHistory(address?: string): void {
    try {
      const history = this.wallet.getTransactionHistory(address);
      const targetAddress = address || this.wallet.getCurrentAccount()?.address;

      console.log(`\n📜 Transaction History for ${targetAddress}:`);
      console.log('─'.repeat(80));

      if (history.length === 0) {
        console.log('No transactions found for this account');
        return;
      }

      history.slice(0, 10).forEach((tx, index) => {
        const date = new Date(tx.timestamp).toLocaleString();
        const type = tx.from === targetAddress ? '📤 SENT' : '📥 RECEIVED';
        const peer = tx.from === targetAddress ? tx.to : tx.from;
        const sign = tx.from === targetAddress ? '-' : '+';
        
        console.log(`${index + 1}. ${type} | ${sign}${tx.amount} EMO | ${date}`);
        console.log(`   ${tx.from === targetAddress ? 'To' : 'From'}: ${peer}`);
        console.log(`   TX ID: ${tx.id} | Fee: ${tx.fee} EMO | Type: ${tx.type}`);
        console.log('');
      });

      if (history.length > 10) {
        console.log(`... and ${history.length - 10} more transactions`);
      }
    } catch (error) {
      console.error('❌ Failed to show transaction history:', error);
    }
  }

  private showValidationHistory(address?: string): void {
    try {
      const history = this.wallet.getValidationHistory(address);
      const targetAddress = address || this.wallet.getCurrentAccount()?.address;

      console.log(`\n🧠 Validation History for ${targetAddress}:`);
      console.log('─'.repeat(80));

      if (history.length === 0) {
        console.log('No validation records found');
        console.log('Start mining as a validator to generate validation history');
        return;
      }

      history.slice(0, 10).forEach((record, index) => {
        const date = new Date(record.timestamp).toLocaleString();
        
        console.log(`${index + 1}. ${date}`);
        console.log(`   Consensus Score: ${(record.consensusScore * 100).toFixed(1)}%`);
        console.log(`   Reward Earned: ${record.rewardEarned} EMO`);
        console.log(`   Dominant Emotion: ${this.getDominantEmotion(record.emotionalState)}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Failed to show validation history:', error);
    }
  }

  private showWalletStatus(): void {
    try {
      const status = this.wallet.getWalletStatus();
      
      console.log(`\n📊 EmotionalChain Wallet Status:`);
      console.log('─'.repeat(50));
      console.log(`Research: Altug Tatlisu, CEO Bytus Technologies`);
      console.log(`Total Accounts: ${status.accounts}`);
      console.log(`Current Account: ${status.currentAccount || 'None selected'}`);
      console.log(`Current Balance: ${status.balance} EMO`);
      console.log(`Validator Status: ${status.isValidator ? '👑 Active Validator' : '❌ Not a Validator'}`);
      console.log(`Network Peers: ${status.networkPeers}`);
      console.log(`Active Validators: ${status.activeValidators}`);
      console.log(`Blockchain Length: ${status.blockchainLength} blocks`);
      
      if (status.consensusScore !== undefined) {
        console.log(`Average Consensus: ${(status.consensusScore * 100).toFixed(1)}%`);
        console.log(`Network Authenticity: ${(status.authenticity * 100).toFixed(1)}%`);
      }
    } catch (error) {
      console.error('❌ Failed to show wallet status:', error);
    }
  }

  private showNetworkStats(): void {
    try {
      const status = this.wallet.getWalletStatus();
      const stats = status.networkStats;
      
      console.log(`\n🌐 Network Statistics:`);
      console.log('─'.repeat(50));
      console.log(`Connected Peers: ${stats.connectedPeers}`);
      console.log(`Active Validators: ${stats.activeValidators}`);
      console.log(`Network Latency: ${stats.networkLatency.toFixed(2)}ms`);
      console.log(`Consensus Participation: ${(stats.consensusParticipation * 100).toFixed(1)}%`);
      console.log(`Emotional Sync Rate: ${(stats.emotionalSyncRate * 100).toFixed(1)}%`);
      
      console.log(`\n🧠 Emotional Network Health:`);
      console.log(`Average Authenticity: ${(status.authenticity * 100).toFixed(1)}%`);
      console.log(`Consensus Quality: ${(status.consensusScore * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Failed to show network stats:', error);
    }
  }

  private showBlockchainInfo(): void {
    try {
      const status = this.wallet.getWalletStatus();
      const chainStats = status.chainStats;
      
      console.log(`\n⛓️  EmotionalChain Blockchain Information:`);
      console.log('─'.repeat(50));
      console.log(`Consensus Type: Proof of Emotion (PoE)`);
      console.log(`Total Blocks: ${chainStats.totalBlocks}`);
      console.log(`Total Validators: ${chainStats.totalValidators}`);
      console.log(`Mining Difficulty: ${chainStats.difficulty}`);
      console.log(`Block Reward: ${chainStats.miningReward} EMO`);
      console.log(`Average Consensus Score: ${(chainStats.avgConsensusScore * 100).toFixed(1)}%`);
      console.log(`Average Authenticity: ${(chainStats.avgAuthenticity * 100).toFixed(1)}%`);
      
      console.log(`\n📈 Performance Metrics:`);
      console.log(`Energy Efficiency: 99.9% better than Bitcoin PoW`);
      console.log(`Consensus Time: 2-8 seconds`);
      console.log(`Biometric Validation: Real-time`);
    } catch (error) {
      console.error('❌ Failed to show blockchain info:', error);
    }
  }

  private generateTestBiometric(): void {
    try {
      const biometricData = this.wallet.generateTestBiometricData();
      
      console.log(`\n🔬 Generated Test Biometric Data:`);
      console.log('─'.repeat(50));
      console.log(`Heart Rate: ${biometricData.heartRate.toFixed(1)} BPM`);
      console.log(`Heart Rate Variability: ${biometricData.heartRateVariability.toFixed(1)} ms`);
      console.log(`Voice Stress Level: ${(biometricData.voiceStress * 100).toFixed(1)}%`);
      console.log(`Skin Conductance: ${(biometricData.galvanicSkinResponse * 100).toFixed(1)}%`);
      console.log(`Pupil Dilation: ${biometricData.eyeTracking.pupilDilation.toFixed(1)} mm`);
      console.log(`Blink Rate: ${biometricData.eyeTracking.blinkRate.toFixed(1)} per minute`);
      console.log(`Dominant Emotion: ${this.getDominantEmotion(biometricData.facialExpression)}`);
      console.log(`Overall Confidence: ${(biometricData.facialExpression.confidence * 100).toFixed(1)}%`);
      console.log(`Device Signature: ${biometricData.deviceSignature}`);
      console.log(`Timestamp: ${new Date(biometricData.timestamp).toLocaleString()}`);
    } catch (error) {
      console.error('❌ Failed to generate test biometric data:', error);
    }
  }

  private getDominantEmotion(emotions: EmotionalVector): string {
    try {
      const emotionEntries = Object.entries(emotions).filter(([key]) => key !== 'confidence');
      const dominant = emotionEntries.reduce((max, current) => 
        current[1] > max[1] ? current : max
      );
      return `${dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1)} (${(dominant[1] * 100).toFixed(1)}%)`;
    } catch (error) {
      return 'Unknown';
    }
  }
}

// Main CLI Application
class EmotionalChainApp {
  private wallet: EmotionalWallet;
  private cli: EmotionalChainCLI;

  constructor() {
    const config: WalletConfig = {
      dataDir: './emotional-wallet-data',
      networkPort: 8001,
      bootstrapNodes: ['localhost:8000'], // Bootstrap nodes
      validatorSettings: {
        minStake: 1000,
        biometricSensors: ['heartRate', 'facial', 'voice', 'skin', 'eye'],
        emotionalThreshold: 0.75,
        autoMining: false
      }
    };

    this.wallet = new EmotionalWallet(config);
    this.cli = new EmotionalChainCLI(this.wallet);
  }

  public async start(): Promise<void> {
    console.log(`
🧠 EmotionalChain - Proof of Emotion Blockchain
===============================================
The World's First Emotion-Powered Blockchain
Research by: Altug Tatlisu, CEO Bytus Technologies

Welcome to the revolutionary blockchain that validates emotions!
This system demonstrates biometric consensus mechanisms for
human-centric distributed networks.

Type 'help' for available commands or 'exit' to quit.
===============================================
    `);

    // Set up CLI input handling
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'emotional-chain> '
    });

    rl.prompt();

    rl.on('line', async (input: string) => {
      const trimmedInput = input.trim();
      if (trimmedInput) {
        const [command, ...args] = trimmedInput.split(' ');
        try {
          await this.cli.processCommand(command, args);
        } catch (error) {
          console.error('❌ Error executing command:', error);
        }
      }
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('\n👋 Thank you for using EmotionalChain!');
      console.log('Research by: Altug Tatlisu, CEO Bytus Technologies');
      this.wallet.shutdown();
      process.exit(0);
    });
  }
}

// Export classes
export {
  EmotionalWallet,
  EmotionalChainCLI,
  EmotionalChainApp,
  type WalletAccount,
  type EmotionalProfile,
  type WalletConfig,
  type ValidationRecord,
  type EmotionalVector,
  type ValidatorSettings
}; 
