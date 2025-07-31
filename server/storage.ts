import { type User, type InsertUser, type Block, type InsertBlock, type Transaction, type InsertTransaction, type Validator, type InsertValidator, type BiometricData, type InsertBiometricData, type NetworkStats, type InsertNetworkStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Block methods
  getBlocks(limit?: number): Promise<Block[]>;
  getAllBlocks(): Promise<Block[]>;
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

  // Wallet methods for database sync
  getWalletsFromDatabase(): Promise<any[]>;
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
    // Initialize empty - will be populated by real blockchain data only
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

  async getAllBlocks(): Promise<Block[]> {
    return Array.from(this.blocks.values())
      .sort((a, b) => a.height - b.height);
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

// Import database storage
import { db } from "./db";
import { eq, desc, gte } from "drizzle-orm";
import { blocks as blocksTable, transactions as transactionsTable, validatorStates as validatorsTable, biometricData as biometricTable } from "@shared/schema";

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    // User management implementation would go here if needed
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // User management implementation would go here if needed  
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // User management implementation would go here if needed
    throw new Error("User management not implemented in blockchain storage");
  }

  // Block methods
  async getBlocks(limit: number = 10): Promise<Block[]> {
    const results = await db.select().from(blocksTable)
      .orderBy(blocksTable.height)
      .limit(limit);
    
    return results.map(this.mapBlockFromDatabase);
  }

  async getAllBlocks(): Promise<Block[]> {
    const results = await db.select().from(blocksTable)
      .orderBy(blocksTable.height);
    
    return results.map(this.mapBlockFromDatabase);
  }

  async getLatestBlock(): Promise<Block | undefined> {
    const results = await db.select().from(blocksTable)
      .orderBy(blocksTable.height)
      .limit(1);
    
    return results.length > 0 ? this.mapBlockFromDatabase(results[0]) : undefined;
  }

  async createBlock(insertBlock: InsertBlock): Promise<Block> {
    const blockData = {
      height: insertBlock.height,
      hash: insertBlock.hash,
      previousHash: insertBlock.previousHash,
      merkleRoot: insertBlock.merkleRoot || '',
      timestamp: insertBlock.timestamp,
      nonce: insertBlock.nonce,
      difficulty: insertBlock.difficulty,
      validatorId: insertBlock.validatorId,
      emotionalScore: insertBlock.emotionalScore.toString(),
      emotionalProof: insertBlock.emotionalProof || {},
      blockData: insertBlock.blockData || {},
      transactionCount: insertBlock.transactionCount || 0
    };

    const [result] = await db.insert(blocksTable).values(blockData).returning();
    console.log(`📦 Block ${insertBlock.height} saved to database: ${insertBlock.hash}`);
    
    return this.mapBlockFromDatabase(result);
  }

  async getBlockByHeight(height: number): Promise<Block | undefined> {
    const results = await db.select().from(blocksTable)
      .where(eq(blocksTable.height, height))
      .limit(1);
    
    return results.length > 0 ? this.mapBlockFromDatabase(results[0]) : undefined;
  }

  // Transaction methods
  async getTransactions(limit: number = 50): Promise<Transaction[]> {
    const results = await db.select().from(transactionsTable)
      .orderBy(desc(transactionsTable.timestamp))
      .limit(limit);
    
    return results.map(this.mapTransactionFromDatabase);
  }

  async getTransactionsByBlock(blockHash: string): Promise<Transaction[]> {
    const results = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.blockHash, blockHash));
    
    return results.map(this.mapTransactionFromDatabase);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const txData = {
      hash: insertTransaction.hash,
      blockHash: insertTransaction.blockHash,
      fromAddress: insertTransaction.fromAddress,
      toAddress: insertTransaction.toAddress,
      amount: insertTransaction.amount.toString(),
      fee: insertTransaction.fee?.toString() || '0',
      timestamp: insertTransaction.timestamp,
      signature: insertTransaction.signature,
      biometricData: insertTransaction.biometricData || {},
      transactionData: insertTransaction.transactionData || {},
      status: insertTransaction.status || 'confirmed'
    };

    const [result] = await db.insert(transactionsTable).values(txData).returning();
    console.log(`💳 Transaction saved to database: ${insertTransaction.hash}`);
    
    return this.mapTransactionFromDatabase(result);
  }

  async updateTransactionStatus(id: string, status: string): Promise<void> {
    await db.update(transactionsTable)
      .set({ status })
      .where(eq(transactionsTable.id, id));
  }

  // Validator methods
  async getValidators(): Promise<Validator[]> {
    const results = await db.select().from(validatorsTable);
    return results.map(this.mapValidatorFromDatabase);
  }

  async getActiveValidators(): Promise<Validator[]> {
    // Get validators active in last hour
    const oneHourAgo = Date.now() - 3600000;
    const results = await db.select().from(validatorsTable);
    
    return results
      .filter(v => v.lastActivity >= oneHourAgo)
      .map(this.mapValidatorFromDatabase);
  }

  async createValidator(insertValidator: InsertValidator): Promise<Validator> {
    const validatorData = {
      validatorId: insertValidator.validatorId,
      balance: insertValidator.balance.toString(),
      emotionalScore: insertValidator.emotionalScore.toString(),
      lastActivity: insertValidator.lastActivity,
      publicKey: insertValidator.publicKey,
      reputation: insertValidator.reputation?.toString() || '100',
      totalBlocksMined: insertValidator.totalBlocksMined || 0,
      totalValidations: insertValidator.totalValidations || 0
    };

    const [result] = await db.insert(validatorsTable).values(validatorData).returning();
    console.log(`👤 Validator ${insertValidator.validatorId} saved to database`);
    
    return this.mapValidatorFromDatabase(result);
  }

  async updateValidator(id: string, updates: Partial<Validator>): Promise<void> {
    const updateData: any = {};
    
    if (updates.balance !== undefined) updateData.balance = updates.balance.toString();
    if (updates.emotionalScore !== undefined) updateData.emotionalScore = updates.emotionalScore.toString();
    if (updates.lastActivity !== undefined) updateData.lastActivity = updates.lastActivity;
    if (updates.reputation !== undefined) updateData.reputation = updates.reputation.toString();
    if (updates.totalBlocksMined !== undefined) updateData.totalBlocksMined = updates.totalBlocksMined;
    if (updates.totalValidations !== undefined) updateData.totalValidations = updates.totalValidations;

    await db.update(validatorsTable)
      .set(updateData)
      .where(eq(validatorsTable.validatorId, id));
  }

  // Biometric data methods
  async getLatestBiometricData(validatorId: string): Promise<BiometricData | undefined> {
    const results = await db.select().from(biometricTable)
      .where(eq(biometricTable.validatorId, validatorId))
      .orderBy(biometricTable.timestamp)
      .limit(1);
    
    return results.length > 0 ? this.mapBiometricFromDatabase(results[0]) : undefined;
  }

  async createBiometricData(insertData: InsertBiometricData): Promise<BiometricData> {
    const biometricData = {
      validatorId: insertData.validatorId,
      deviceId: insertData.deviceId,
      readingType: insertData.readingType,
      value: insertData.value.toString(),
      quality: insertData.quality.toString(),
      timestamp: insertData.timestamp,
      authenticityProof: insertData.authenticityProof,
      rawData: insertData.rawData || {}
    };

    const [result] = await db.insert(biometricTable).values(biometricData).returning();
    return this.mapBiometricFromDatabase(result);
  }

  // Network stats methods
  async getLatestNetworkStats(): Promise<NetworkStats | undefined> {
    // Implementation would depend on network stats schema
    return undefined;
  }

  async createNetworkStats(insertStats: InsertNetworkStats): Promise<NetworkStats> {
    // Implementation would depend on network stats schema
    throw new Error("Network stats not implemented yet");
  }

  // Helper mapping methods
  private mapBlockFromDatabase(dbBlock: any): Block {
    return {
      id: dbBlock.id,
      height: dbBlock.height,
      hash: dbBlock.hash,
      previousHash: dbBlock.previousHash,
      merkleRoot: dbBlock.merkleRoot,
      timestamp: dbBlock.timestamp, // Keep as number from database
      nonce: dbBlock.nonce,
      difficulty: dbBlock.difficulty,
      validatorId: dbBlock.validatorId,
      emotionalScore: parseFloat(dbBlock.emotionalScore),
      emotionalProof: dbBlock.emotionalProof,
      blockData: dbBlock.blockData,
      transactionCount: dbBlock.transactionCount,
      createdAt: dbBlock.createdAt
    };
  }

  private mapTransactionFromDatabase(dbTx: any): Transaction {
    return {
      id: dbTx.id,
      hash: dbTx.hash,
      blockHash: dbTx.blockHash, // Use blockHash not blockId
      fromAddress: dbTx.fromAddress,
      toAddress: dbTx.toAddress,
      amount: parseFloat(dbTx.amount),
      fee: parseFloat(dbTx.fee || '0'),
      timestamp: dbTx.timestamp, // Keep as number from database
      signature: dbTx.signature,
      biometricData: dbTx.biometricData,
      transactionData: dbTx.transactionData,
      status: dbTx.status,
      createdAt: dbTx.createdAt
    };
  }

  private mapValidatorFromDatabase(dbValidator: any): Validator {
    return {
      validatorId: dbValidator.validatorId,
      balance: parseFloat(dbValidator.balance),
      emotionalScore: parseFloat(dbValidator.emotionalScore),
      lastActivity: dbValidator.lastActivity,
      publicKey: dbValidator.publicKey,
      reputation: parseFloat(dbValidator.reputation || '100'),
      totalBlocksMined: dbValidator.totalBlocksMined || 0,
      totalValidations: dbValidator.totalValidations || 0,
      updatedAt: dbValidator.updatedAt
    };
  }

  private mapBiometricFromDatabase(dbBiometric: any): BiometricData {
    return {
      id: dbBiometric.id,
      validatorId: dbBiometric.validatorId,
      deviceId: dbBiometric.deviceId,
      readingType: dbBiometric.readingType,
      value: parseFloat(dbBiometric.value),
      quality: parseFloat(dbBiometric.quality),
      timestamp: dbBiometric.timestamp,
      authenticityProof: dbBiometric.authenticityProof,
      rawData: dbBiometric.rawData,
      createdAt: dbBiometric.createdAt
    };
  }

  // Transaction volume methods
  async getTransactionVolume24h(): Promise<{ volume24h: number; transactions24h: number }> {
    try {
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      const results = await db.select({
        count: db.count(),
        volume: db.sum(transactionsTable.amount)
      }).from(transactionsTable)
      .where(gte(transactionsTable.timestamp, twentyFourHoursAgo));
      
      const result = results[0];
      return {
        volume24h: parseFloat(result.volume?.toString() || '0'),
        transactions24h: result.count || 0
      };
    } catch (error) {
      console.error('Error getting 24h transaction volume:', error);
      
      // Fallback: get total volume and count
      try {
        const totalResults = await db.select({
          count: db.count(),
          volume: db.sum(transactionsTable.amount)
        }).from(transactionsTable);
        
        const totalResult = totalResults[0];
        return {
          volume24h: parseFloat(totalResult.volume?.toString() || '0'),
          transactions24h: totalResult.count || 0
        };
      } catch (fallbackError) {
        console.error('Error getting total transaction volume:', fallbackError);
        return { volume24h: 0, transactions24h: 0 };
      }
    }
  }
}

export const storage = new DatabaseStorage();
