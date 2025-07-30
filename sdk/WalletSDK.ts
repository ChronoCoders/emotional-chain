import { EventEmitter } from 'eventemitter3';
import { AxiosInstance } from 'axios';
import { createHash, randomBytes } from 'crypto';

/**
 * WalletSDK - Wallet management and transaction signing
 * 
 * @example
 * ```typescript
 * const wallet = await sdk.wallet.createWallet();
 * const balance = await sdk.wallet.getBalance(wallet.address);
 * const tx = await sdk.wallet.sendTransaction({
 *   from: wallet.address,
 *   to: '0x742d35Cc6Cb8e8532',
 *   amount: 100
 * });
 * ```
 */

export interface Wallet {
  address: string;
  publicKey: string;
  privateKey?: string; // Only available for locally created wallets
  balance: number;
  emotionalScore?: number;
  nonce: number;
  createdAt: number;
}

export interface WalletCreateOptions {
  mnemonic?: string;
  privateKey?: string;
  password?: string;
  derivationPath?: string;
}

export interface SignedTransaction {
  transaction: any;
  signature: string;
  hash: string;
  from: string;
  to: string;
  amount: number;
  nonce: number;
  gasLimit: number;
  gasPrice: number;
}

export interface TransferRequest {
  from: string;
  to: string;
  amount: number;
  gasLimit?: number;
  gasPrice?: number;
  data?: string;
  nonce?: number;
}

export interface MultiSigWallet {
  address: string;
  owners: string[];
  requiredSignatures: number;
  transactions: MultiSigTransaction[];
}

export interface MultiSigTransaction {
  id: string;
  to: string;
  amount: number;
  data?: string;
  signatures: string[];
  executed: boolean;
  createdAt: number;
}

export class WalletSDK extends EventEmitter {
  private httpClient: AxiosInstance;
  private wallets = new Map<string, Wallet>();
  
  constructor(httpClient: AxiosInstance) {
    super();
    this.httpClient = httpClient;
  }
  
  // Wallet creation and management
  async createWallet(options: WalletCreateOptions = {}): Promise<Wallet> {
    try {
      let privateKey: string;
      let publicKey: string;
      let address: string;
      
      if (options.privateKey) {
        // Import from private key
        privateKey = options.privateKey;
        publicKey = this.derivePublicKey(privateKey);
        address = this.deriveAddress(publicKey);
      } else if (options.mnemonic) {
        // Import from mnemonic
        const keyPair = this.generateFromMnemonic(options.mnemonic, options.derivationPath);
        privateKey = keyPair.privateKey;
        publicKey = keyPair.publicKey;
        address = this.deriveAddress(publicKey);
      } else {
        // Generate new wallet
        const keyPair = this.generateKeyPair();
        privateKey = keyPair.privateKey;
        publicKey = keyPair.publicKey;
        address = this.deriveAddress(publicKey);
      }
      
      // Get initial balance and nonce
      const balance = await this.getBalance(address);
      const nonce = await this.getNonce(address);
      
      const wallet: Wallet = {
        address,
        publicKey,
        privateKey,
        balance,
        nonce,
        createdAt: Date.now()
      };
      
      // Store wallet locally
      this.wallets.set(address, wallet);
      
      this.emit('walletCreated', wallet);
      return wallet;
    } catch (error) {
      this.emit('walletError', error);
      throw error;
    }
  }
  
  async importWallet(privateKeyOrMnemonic: string, password?: string): Promise<Wallet> {
    const options: WalletCreateOptions = {};
    
    if (privateKeyOrMnemonic.split(' ').length === 12 || privateKeyOrMnemonic.split(' ').length === 24) {
      // It's a mnemonic
      options.mnemonic = privateKeyOrMnemonic;
      options.password = password;
    } else {
      // It's a private key
      options.privateKey = privateKeyOrMnemonic;
    }
    
    return this.createWallet(options);
  }
  
  async exportWallet(address: string, format: 'privateKey' | 'mnemonic' | 'keystore' = 'privateKey'): Promise<string> {
    const wallet = this.wallets.get(address);
    if (!wallet || !wallet.privateKey) {
      throw new Error('Wallet not found or private key not available');
    }
    
    switch (format) {
      case 'privateKey':
        return wallet.privateKey;
      case 'mnemonic':
        return this.generateMnemonic(wallet.privateKey);
      case 'keystore':
        return this.generateKeystore(wallet.privateKey);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  // Balance and account information
  async getBalance(address: string): Promise<number> {
    try {
      const response = await this.httpClient.get(`/api/v1/wallets/${address}/balance`);
      return response.data.balance;
    } catch (error) {
      if ((error as any).status === 404) {
        return 0; // New wallet with no balance
      }
      throw error;
    }
  }
  
  async getNonce(address: string): Promise<number> {
    try {
      const response = await this.httpClient.get(`/api/v1/wallets/${address}/nonce`);
      return response.data.nonce;
    } catch (error) {
      if ((error as any).status === 404) {
        return 0; // New wallet starts with nonce 0
      }
      throw error;
    }
  }
  
  async getWalletInfo(address: string): Promise<Wallet> {
    const response = await this.httpClient.get(`/api/v1/wallets/${address}`);
    const walletInfo = response.data;
    
    // Merge with local wallet if available
    const localWallet = this.wallets.get(address);
    if (localWallet) {
      return {
        ...walletInfo,
        privateKey: localWallet.privateKey
      };
    }
    
    return walletInfo;
  }
  
  // Transaction methods
  async sendTransaction(request: TransferRequest): Promise<SignedTransaction> {
    // Get wallet for signing
    const wallet = this.wallets.get(request.from);
    if (!wallet || !wallet.privateKey) {
      throw new Error('Wallet not found or cannot sign transactions');
    }
    
    // Get current nonce if not provided
    const nonce = request.nonce !== undefined ? request.nonce : await this.getNonce(request.from);
    
    // Build transaction object
    const transaction = {
      from: request.from,
      to: request.to,
      amount: request.amount,
      gasLimit: request.gasLimit || 21000,
      gasPrice: request.gasPrice || await this.estimateGasPrice(),
      nonce,
      data: request.data || '0x',
      timestamp: Date.now()
    };
    
    // Sign transaction
    const signature = this.signTransaction(transaction, wallet.privateKey);
    const hash = this.calculateTransactionHash(transaction, signature);
    
    const signedTx: SignedTransaction = {
      transaction,
      signature,
      hash,
      from: request.from,
      to: request.to,
      amount: request.amount,
      nonce,
      gasLimit: transaction.gasLimit,
      gasPrice: transaction.gasPrice
    };
    
    // Broadcast transaction
    const response = await this.httpClient.post('/api/v1/transactions', {
      ...signedTx,
      signedTransaction: this.serializeTransaction(signedTx)
    });
    
    this.emit('transactionSent', signedTx);
    return signedTx;
  }
  
  async estimateGas(request: TransferRequest): Promise<number> {
    const response = await this.httpClient.post('/api/v1/transactions/estimate-gas', request);
    return response.data.gasEstimate;
  }
  
  async estimateGasPrice(): Promise<number> {
    const response = await this.httpClient.get('/api/v1/gas-price');
    return response.data.gasPrice;
  }
  
  // Multi-signature wallet support
  async createMultiSigWallet(owners: string[], requiredSignatures: number): Promise<MultiSigWallet> {
    const response = await this.httpClient.post('/api/v1/multisig/create', {
      owners,
      requiredSignatures
    });
    
    const multiSigWallet = response.data;
    this.emit('multiSigWalletCreated', multiSigWallet);
    return multiSigWallet;
  }
  
  async getMultiSigWallet(address: string): Promise<MultiSigWallet> {
    const response = await this.httpClient.get(`/api/v1/multisig/${address}`);
    return response.data;
  }
  
  async proposeMultiSigTransaction(
    walletAddress: string,
    to: string,
    amount: number,
    data?: string
  ): Promise<MultiSigTransaction> {
    const response = await this.httpClient.post(`/api/v1/multisig/${walletAddress}/propose`, {
      to,
      amount,
      data
    });
    
    const transaction = response.data;
    this.emit('multiSigTransactionProposed', transaction);
    return transaction;
  }
  
  async signMultiSigTransaction(
    walletAddress: string,
    transactionId: string,
    signerAddress: string
  ): Promise<void> {
    const wallet = this.wallets.get(signerAddress);
    if (!wallet || !wallet.privateKey) {
      throw new Error('Signer wallet not found or cannot sign');
    }
    
    // Get transaction details
    const multiSigWallet = await this.getMultiSigWallet(walletAddress);
    const transaction = multiSigWallet.transactions.find(tx => tx.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Sign transaction
    const signature = this.signMessage(transactionId, wallet.privateKey);
    
    await this.httpClient.post(`/api/v1/multisig/${walletAddress}/sign`, {
      transactionId,
      signature,
      signer: signerAddress
    });
    
    this.emit('multiSigTransactionSigned', { walletAddress, transactionId, signer: signerAddress });
  }
  
  async executeMultiSigTransaction(walletAddress: string, transactionId: string): Promise<void> {
    await this.httpClient.post(`/api/v1/multisig/${walletAddress}/execute`, {
      transactionId
    });
    
    this.emit('multiSigTransactionExecuted', { walletAddress, transactionId });
  }
  
  // Hardware wallet integration
  async connectHardwareWallet(type: 'ledger' | 'trezor', derivationPath?: string): Promise<Wallet> {
    // This would integrate with hardware wallet libraries
    // For now, simulate the connection
    
    const response = await this.httpClient.post('/api/v1/hardware-wallet/connect', {
      type,
      derivationPath: derivationPath || "m/44'/60'/0'/0/0"
    });
    
    const wallet = response.data;
    this.wallets.set(wallet.address, { ...wallet, privateKey: undefined }); // No private key for hardware wallets
    
    this.emit('hardwareWalletConnected', wallet);
    return wallet;
  }
  
  async signWithHardwareWallet(address: string, transaction: any): Promise<string> {
    const response = await this.httpClient.post('/api/v1/hardware-wallet/sign', {
      address,
      transaction
    });
    
    return response.data.signature;
  }
  
  // Mobile wallet support
  async generateMobileWalletQR(address: string): Promise<string> {
    const response = await this.httpClient.post('/api/v1/mobile-wallet/qr', {
      address
    });
    
    return response.data.qrCode;
  }
  
  async linkMobileWallet(qrData: string): Promise<Wallet> {
    const response = await this.httpClient.post('/api/v1/mobile-wallet/link', {
      qrData
    });
    
    const wallet = response.data;
    this.wallets.set(wallet.address, wallet);
    
    this.emit('mobileWalletLinked', wallet);
    return wallet;
  }
  
  // Utility methods
  getStoredWallets(): Wallet[] {
    return Array.from(this.wallets.values()).map(wallet => ({
      ...wallet,
      privateKey: undefined // Don't expose private keys
    }));
  }
  
  hasWallet(address: string): boolean {
    return this.wallets.has(address);
  }
  
  removeWallet(address: string): boolean {
    const removed = this.wallets.delete(address);
    if (removed) {
      this.emit('walletRemoved', address);
    }
    return removed;
  }
  
  // Cryptographic helper methods
  private generateKeyPair(): { privateKey: string; publicKey: string } {
    const privateKey = '0x' + randomBytes(32).toString('hex');
    const publicKey = this.derivePublicKey(privateKey);
    return { privateKey, publicKey };
  }
  
  private derivePublicKey(privateKey: string): string {
    // Simplified ECDSA public key derivation
    // In production, use proper elliptic curve cryptography library
    const hash = createHash('sha256').update(privateKey).digest('hex');
    return '0x' + hash;
  }
  
  private deriveAddress(publicKey: string): string {
    // Simplified address derivation (similar to Ethereum)
    const hash = createHash('sha256').update(publicKey).digest('hex');
    return '0x' + hash.slice(-40);
  }
  
  private generateFromMnemonic(mnemonic: string, derivationPath?: string): { privateKey: string; publicKey: string } {
    // Simplified mnemonic to key derivation
    // In production, use BIP39 and BIP44 standards
    const seed = createHash('sha256').update(mnemonic + (derivationPath || '')).digest('hex');
    const privateKey = '0x' + seed;
    const publicKey = this.derivePublicKey(privateKey);
    return { privateKey, publicKey };
  }
  
  private generateMnemonic(privateKey: string): string {
    // Simplified mnemonic generation
    // In production, use BIP39 standard
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid'
    ];
    
    const hash = createHash('sha256').update(privateKey).digest();
    const mnemonic = [];
    
    for (let i = 0; i < 12; i++) {
      const index = hash[i] % words.length;
      mnemonic.push(words[index]);
    }
    
    return mnemonic.join(' ');
  }
  
  private generateKeystore(privateKey: string, password = ''): string {
    // Simplified keystore generation
    // In production, use proper encryption and key derivation
    const encrypted = createHash('sha256').update(privateKey + password).digest('hex');
    
    return JSON.stringify({
      version: 3,
      id: randomBytes(16).toString('hex'),
      address: this.deriveAddress(this.derivePublicKey(privateKey)),
      crypto: {
        cipher: 'aes-128-ctr',
        ciphertext: encrypted,
        kdf: 'scrypt',
        mac: createHash('sha256').update(encrypted).digest('hex')
      }
    });
  }
  
  private signTransaction(transaction: any, privateKey: string): string {
    // Simplified transaction signing
    // In production, use proper ECDSA signing
    const txData = JSON.stringify(transaction);
    const signature = createHash('sha256').update(txData + privateKey).digest('hex');
    return '0x' + signature;
  }
  
  private signMessage(message: string, privateKey: string): string {
    // Simplified message signing
    const signature = createHash('sha256').update(message + privateKey).digest('hex');
    return '0x' + signature;
  }
  
  private calculateTransactionHash(transaction: any, signature: string): string {
    const combined = JSON.stringify(transaction) + signature;
    return '0x' + createHash('sha256').update(combined).digest('hex');
  }
  
  private serializeTransaction(signedTx: SignedTransaction): string {
    // Simplified transaction serialization
    return JSON.stringify({
      transaction: signedTx.transaction,
      signature: signedTx.signature
    });
  }
  
  // Validation methods
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  
  isValidPrivateKey(privateKey: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
  }
  
  isValidAmount(amount: number): boolean {
    return amount > 0 && Number.isFinite(amount);
  }
  
  // Event handlers for wallet updates
  onBalanceUpdate(address: string, callback: (balance: number) => void): () => void {
    const handler = (data: any) => {
      if (data.address === address) {
        callback(data.balance);
      }
    };
    
    this.on('balanceUpdate', handler);
    return () => this.off('balanceUpdate', handler);
  }
  
  onTransactionConfirmed(address: string, callback: (tx: any) => void): () => void {
    const handler = (data: any) => {
      if (data.from === address || data.to === address) {
        callback(data);
      }
    };
    
    this.on('transactionConfirmed', handler);
    return () => this.off('transactionConfirmed', handler);
  }
}