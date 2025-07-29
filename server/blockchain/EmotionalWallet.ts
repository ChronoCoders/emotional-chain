// EmotionalWallet Implementation
export class EmotionalWallet {
  private blockchain: any;
  private network: any;
  private wallets: Map<string, any> = new Map(); // Multi-wallet support for all validators

  constructor(blockchain: any, network: any) {
    this.blockchain = blockchain;
    this.network = network;
    this.initializeWallets();
  }

  private initializeWallets() {
    // Initialize wallets for all validators when they're added
    if (this.blockchain && this.blockchain.getAllWallets) {
      const blockchainWallets = this.blockchain.getAllWallets();
      blockchainWallets.forEach((balance: number, validatorId: string) => {
        this.wallets.set(validatorId, {
          address: this.generateAddress(validatorId),
          balance: balance,
          staked: 0,
          isValidator: true,
          validatorId: validatorId
        });
      });
    }
  }

  private generateAddress(validatorId: string): string {
    // Generate consistent address from validator ID
    const hash = require('crypto').createHash('sha256').update(validatorId).digest('hex');
    return '0x' + hash.substring(0, 40).toUpperCase();
  }

  public getStatus(validatorId?: string): any {
    if (validatorId) {
      const wallet = this.wallets.get(validatorId);
      if (wallet) {
        return {
          address: wallet.address,
          balance: wallet.balance + ' EMO',
          staked: wallet.staked + ' EMO',
          type: 'Validator Node',
          validatorId: validatorId,
          authScore: '94.7',
          stressThreshold: '68',
          validationCount: 1247,
          reputation: '98.3'
        };
      }
    }

    // Default wallet status - use zenith_prime as primary
    const primaryWallet = this.wallets.get('zenith_prime');
    if (primaryWallet) {
      return {
        address: primaryWallet.address,
        balance: primaryWallet.balance + ' EMO',
        staked: primaryWallet.staked + ' EMO',
        type: 'Validator Node',
        validatorId: 'zenith_prime',
        authScore: '94.7',
        stressThreshold: '68',
        validationCount: 1247,
        reputation: '98.3'
      };
    }

    return {
      address: '0xA7B2C9E8F1D3456789ABCDEF0123456789ABCDEF',
      balance: '0.00 EMO',
      staked: '0.00 EMO',
      type: 'Validator Node',
      validatorId: 'none',
      authScore: '0.0',
      stressThreshold: '0',
      validationCount: 0,
      reputation: '0.0'
    };
  }

  public getBalance(validatorId?: string): number {
    if (validatorId) {
      const wallet = this.wallets.get(validatorId);
      return wallet ? wallet.balance : 0;
    }
    
    // Return primary wallet balance
    const primaryWallet = this.wallets.get('zenith_prime');
    return primaryWallet ? primaryWallet.balance : 0;
  }

  public getAllWallets(): Map<string, any> {
    return new Map(this.wallets);
  }

  public updateWalletBalance(validatorId: string, balance: number): void {
    if (this.wallets.has(validatorId)) {
      const wallet = this.wallets.get(validatorId);
      wallet.balance = balance;
      this.wallets.set(validatorId, wallet);
    } else {
      // Create new wallet for validator
      this.wallets.set(validatorId, {
        address: this.generateAddress(validatorId),
        balance: balance,
        staked: 0,
        isValidator: true,
        validatorId: validatorId
      });
    }
  }

  public transfer(from: string, to: string, amount: number): boolean {
    const fromWallet = this.wallets.get(from);
    if (!fromWallet || fromWallet.balance < amount) {
      return false; // Insufficient balance
    }

    // Deduct from sender
    fromWallet.balance -= amount;
    this.wallets.set(from, fromWallet);

    // Add to recipient (create wallet if doesn't exist)
    let toWallet = this.wallets.get(to);
    if (!toWallet) {
      toWallet = {
        address: this.generateAddress(to),
        balance: 0,
        staked: 0,
        isValidator: true,
        validatorId: to
      };
    }
    toWallet.balance += amount;
    this.wallets.set(to, toWallet);

    return true;
  }

  public syncWithBlockchain(): void {
    // Sync wallet balances with blockchain
    if (this.blockchain && this.blockchain.getAllWallets) {
      const blockchainWallets = this.blockchain.getAllWallets();
      blockchainWallets.forEach((balance: number, validatorId: string) => {
        this.updateWalletBalance(validatorId, balance);
      });
    }
  }
}