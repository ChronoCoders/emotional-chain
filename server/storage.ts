import { type User, type InsertUser, type Block, type InsertBlock, type Transaction, type InsertTransaction, type Validator, type InsertValidator, type BiometricData, type InsertBiometricData, type NetworkStats, type InsertNetworkStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Block methods
  getBlocks(limit?: number): Promise<Block[]>;
  getLatestBlock(): Promise<Block | undefined>;
  createBlock(block: InsertBlock): Promise<Block>;
  getBlockByHeight(height: number): Promise<Block | undefined>;

  // Transaction methods
  getTransactions(limit?: number): Promise<Transaction[]>;
  getTransactionsByBlock(blockId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string): Promise<void>;

  // Validator methods
  getValidators(): Promise<Validator[]>;
  getActiveValidators(): Promise<Validator[]>;
  createValidator(validator: InsertValidator): Promise<Validator>;
  updateValidator(id: string, updates: Partial<Validator>): Promise<void>;

  // Biometric data methods
  getLatestBiometricData(validatorId: string): Promise<BiometricData | undefined>;
  createBiometricData(data: InsertBiometricData): Promise<BiometricData>;

  // Network stats methods
  getLatestNetworkStats(): Promise<NetworkStats | undefined>;
  createNetworkStats(stats: InsertNetworkStats): Promise<NetworkStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private blocks: Map<string, Block>;
  private transactions: Map<string, Transaction>;
  private validators: Map<string, Validator>;
  private biometricData: Map<string, BiometricData>;
  private networkStats: Map<string, NetworkStats>;

  constructor() {
    this.users = new Map();
    this.blocks = new Map();
    this.transactions = new Map();
    this.validators = new Map();
    this.biometricData = new Map();
    this.networkStats = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize with some sample data
    const genesisBlock: Block = {
      id: randomUUID(),
      height: 0,
      hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      previousHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      timestamp: new Date(),
      transactions: [],
      validator: "0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
      emotionalScore: "95.50",
      consensusScore: "100.00",
      authenticity: "98.30"
    };
    this.blocks.set(genesisBlock.id, genesisBlock);

    // Add sample validators
    const sampleValidators: Validator[] = [
      {
        id: randomUUID(),
        address: "0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
        stake: "15000.00000000",
        isActive: true,
        uptime: "99.80",
        authScore: "97.20",
        device: "Apple Watch S8",
        lastValidation: new Date()
      },
      {
        id: randomUUID(),
        address: "0x8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7",
        stake: "12500.00000000",
        isActive: true,
        uptime: "98.90",
        authScore: "94.80",
        device: "Fitbit Sense 2",
        lastValidation: new Date()
      },
      {
        id: randomUUID(),
        address: "0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7e8",
        stake: "18000.00000000",
        isActive: true,
        uptime: "87.30",
        authScore: "89.10",
        device: "Oura Ring 3",
        lastValidation: new Date()
      }
    ];

    sampleValidators.forEach(validator => {
      this.validators.set(validator.id, validator);
    });

    // Initialize network stats
    const initialStats: NetworkStats = {
      id: randomUUID(),
      connectedPeers: 127,
      activeValidators: 21,
      blockHeight: 8432,
      consensusPercentage: "89.70",
      networkStress: "23.40",
      networkEnergy: "87.20",
      networkFocus: "94.70",
      timestamp: new Date()
    };
    this.networkStats.set(initialStats.id, initialStats);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Block methods
  async getBlocks(limit: number = 10): Promise<Block[]> {
    const blocks = Array.from(this.blocks.values())
      .sort((a, b) => b.height - a.height)
      .slice(0, limit);
    return blocks;
  }

  async getLatestBlock(): Promise<Block | undefined> {
    const blocks = Array.from(this.blocks.values());
    return blocks.reduce((latest, current) => 
      current.height > (latest?.height || -1) ? current : latest, undefined as Block | undefined);
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const id = randomUUID();
    const block: Block = { 
      ...insertBlock, 
      id, 
      timestamp: new Date() 
    };
    this.blocks.set(id, block);
    return block;
  }

  async getBlockByHeight(height: number): Promise<Block | undefined> {
    return Array.from(this.blocks.values()).find(block => block.height === height);
  }

  // Transaction methods
  async getTransactions(limit: number = 10): Promise<Transaction[]> {
    const transactions = Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    return transactions;
  }

  async getTransactionsByBlock(blockId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(tx => tx.blockId === blockId);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      timestamp: new Date() 
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(id: string, status: string): Promise<void> {
    const transaction = this.transactions.get(id);
    if (transaction) {
      transaction.status = status;
      this.transactions.set(id, transaction);
    }
  }

  // Validator methods
  async getValidators(): Promise<Validator[]> {
    return Array.from(this.validators.values());
  }

  async getActiveValidators(): Promise<Validator[]> {
    return Array.from(this.validators.values()).filter(v => v.isActive);
  }

  async createValidator(insertValidator: InsertValidator): Promise<Validator> {
    const id = randomUUID();
    const validator: Validator = { 
      ...insertValidator, 
      id, 
      lastValidation: new Date() 
    };
    this.validators.set(id, validator);
    return validator;
  }

  async updateValidator(id: string, updates: Partial<Validator>): Promise<void> {
    const validator = this.validators.get(id);
    if (validator) {
      Object.assign(validator, updates);
      this.validators.set(id, validator);
    }
  }

  // Biometric data methods
  async getLatestBiometricData(validatorId: string): Promise<BiometricData | undefined> {
    const data = Array.from(this.biometricData.values())
      .filter(d => d.validatorId === validatorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return data[0];
  }

  async createBiometricData(insertData: InsertBiometricData): Promise<BiometricData> {
    const id = randomUUID();
    const data: BiometricData = { 
      ...insertData, 
      id, 
      timestamp: new Date() 
    };
    this.biometricData.set(id, data);
    return data;
  }

  // Network stats methods
  async getLatestNetworkStats(): Promise<NetworkStats | undefined> {
    const stats = Array.from(this.networkStats.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return stats[0];
  }

  async createNetworkStats(insertStats: InsertNetworkStats): Promise<NetworkStats> {
    const id = randomUUID();
    const stats: NetworkStats = { 
      ...insertStats, 
      id, 
      timestamp: new Date() 
    };
    this.networkStats.set(id, stats);
    return stats;
  }
}

export const storage = new MemStorage();
