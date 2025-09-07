import * as crypto from 'crypto';
import { Transaction } from './Transaction';
import { MerkleTree } from './MerkleTree';
import { EmotionalValidator, EmotionalValidatorUtils } from './EmotionalValidator';
export interface BlockHeader {
  index: number;
  timestamp: number;
  previousHash: string;
  merkleRoot: string;
  validator: string;
  emotionalScore: string;
  consensusScore: string;
  authenticity: string;
  // Removed PoW elements for pure PoE consensus
}
export class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;
  public merkleRoot: string;
  public validator: string;
  public emotionalScore: string;
  public consensusScore: string;
  public authenticity: string;
  public hash: string;
  private merkleTree: MerkleTree;
  constructor(
    index: number,
    transactions: Transaction[],
    previousHash: string,
    validator: EmotionalValidator,
    consensusScore: number
  ) {
    this.index = index;
    this.timestamp = Date.now();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.validator = validator.id;
    this.emotionalScore = validator.emotionalScore.toString();
    this.consensusScore = consensusScore.toString();
    this.authenticity = (validator.authenticity * 100).toFixed(2);
    // Build merkle tree for transaction integrity
    this.merkleTree = new MerkleTree(transactions);
    this.merkleRoot = this.merkleTree.getRoot();
    // Calculate block hash (will be updated during mining)
    this.hash = this.calculateHash();
  }
  /**
   * Calculate cryptographic hash of the block
   */
  public calculateHash(): string {
    const blockData = {
      index: this.index,
      timestamp: this.timestamp,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      validator: this.validator,
      emotionalScore: this.emotionalScore,
      consensusScore: this.consensusScore,
      authenticity: this.authenticity
    };
    const dataString = JSON.stringify(blockData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
  /**
   * Pure Proof of Emotion block validation - No computational mining required
   * Blocks are validated through emotional consensus only
   */
  public finalizeBlock(): boolean {
    // Calculate final hash for pure PoE consensus
    this.hash = this.calculateHash();
    return true;
  }
  /**
   * Validate block using emotional consensus rules
   */
  public isValid(previousBlock?: Block): boolean {
    try {
      // Basic structure validation
      if (!this.validateBasicStructure()) {
        return false;
      }
      // Chain integrity validation
      if (previousBlock && !this.validateChainIntegrity(previousBlock)) {
        return false;
      }
      // Transaction validation
      if (!this.validateTransactions()) {
        return false;
      }
      // Merkle tree validation
      if (!this.validateMerkleTree()) {
        return false;
      }
      // Emotional consensus validation
      if (!this.validateEmotionalConsensus()) {
        return false;
      }
      // Hash validation
      if (!this.validateHash()) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Block validation failed:', error);
      return false;
    }
  }
  /**
   * Validate basic block structure
   */
  private validateBasicStructure(): boolean {
    if (this.index < 0) return false;
    if (this.timestamp <= 0) return false;
    if (!this.previousHash) return false;
    if (!this.merkleRoot) return false;
    if (!this.validator) return false;
    if (!this.hash) return false;
    return true;
  }
  /**
   * Validate chain integrity with previous block
   */
  private validateChainIntegrity(previousBlock: Block): boolean {
    // Index should be incremental
    if (this.index !== previousBlock.index + 1) {
      console.error('Invalid block index');
      return false;
    }
    // Previous hash should match
    if (this.previousHash !== previousBlock.hash) {
      console.error('Invalid previous hash');
      return false;
    }
    // Timestamp should be after previous block
    if (this.timestamp <= previousBlock.timestamp) {
      console.error('Invalid timestamp');
      return false;
    }
    return true;
  }
  /**
   * Validate all transactions in the block
   */
  private validateTransactions(): boolean {
    for (const transaction of this.transactions) {
      if (!transaction.isValid()) {
        console.error('Invalid transaction found:', transaction.id);
        return false;
      }
    }
    return true;
  }
  /**
   * Validate merkle tree integrity
   */
  private validateMerkleTree(): boolean {
    // Recalculate merkle tree and compare root
    const calculatedTree = new MerkleTree(this.transactions);
    const calculatedRoot = calculatedTree.getRoot();
    if (this.merkleRoot !== calculatedRoot) {
      console.error('Merkle root mismatch');
      return false;
    }
    // Verify tree structure
    if (!calculatedTree.verifyTree()) {
      console.error('Invalid merkle tree structure');
      return false;
    }
    return true;
  }
  /**
   * Validate emotional consensus requirements
   */
  private validateEmotionalConsensus(): boolean {
    const emotionalScore = parseFloat(this.emotionalScore);
    const authenticity = parseFloat(this.authenticity) / 100;
    // Emotional score threshold
    if (!EmotionalValidatorUtils.isValidEmotionalProof(emotionalScore)) {
      console.error('Validator emotional score too low:', emotionalScore);
      return false;
    }
    // Authenticity threshold
    if (authenticity < 0.7) {
      console.error('Validator authenticity too low:', authenticity);
      return false;
    }
    // Consensus score should be reasonable
    const consensusScore = parseFloat(this.consensusScore);
    if (consensusScore < 60 || consensusScore > 100) {
      console.error('Invalid consensus score:', consensusScore);
      return false;
    }
    return true;
  }
  /**
   * Validate block hash for PoE consensus
   */
  private validateHash(): boolean {
    // Recalculate hash
    const calculatedHash = this.calculateHash();
    if (this.hash !== calculatedHash) {
      console.error('Block hash mismatch');
      return false;
    }
    // No mining difficulty check needed for pure PoE
    return true;
  }
  /**
   * Get block header for efficient transmission
   */
  public getHeader(): BlockHeader {
    return {
      index: this.index,
      timestamp: this.timestamp,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      validator: this.validator,
      emotionalScore: this.emotionalScore,
      consensusScore: this.consensusScore,
      authenticity: this.authenticity
    };
  }
  /**
   * Get merkle proof for a specific transaction
   */
  public getMerkleProof(transactionId: string): any {
    const transaction = this.transactions.find(tx => tx.id === transactionId);
    if (!transaction) return null;
    return this.merkleTree.getProof(transaction.calculateHash());
  }
  /**
   * Verify a transaction exists in this block using merkle proof
   */
  public verifyTransactionInBlock(transactionHash: string, proof: any): boolean {
    return MerkleTree.verifyProof(proof, this.merkleRoot);
  }
  /**
   * Get block size in bytes (estimated)
   */
  public getSize(): number {
    const blockJson = JSON.stringify(this.toJSON());
    return Buffer.byteLength(blockJson, 'utf8');
  }
  /**
   * Get transaction count
   */
  public getTransactionCount(): number {
    return this.transactions.length;
  }
  /**
   * Convert block to JSON for storage/transmission
   */
  public toJSON(): any {
    return {
      index: this.index,
      timestamp: this.timestamp,
      transactions: this.transactions.map(tx => tx.toJSON()),
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      validator: this.validator,
      emotionalScore: this.emotionalScore,
      consensusScore: this.consensusScore,
      authenticity: this.authenticity,
      hash: this.hash
    };
  }
  /**
   * Create block from JSON data
   */
  public static fromJSON(data: any): Block {
    // Reconstruct transactions
    const transactions = data.transactions.map((txData: any) => Transaction.fromJSON(txData));
    // Create validator object (minimal for reconstruction)
    const validator = {
      id: data.validator,
      emotionalScore: parseFloat(data.emotionalScore),
      authenticity: parseFloat(data.authenticity) / 100,
      address: '',
      biometricData: {
        heartRate: 80,
        stressLevel: 30,
        focusLevel: 85,
        authenticity: parseFloat(data.authenticity) / 100,
        timestamp: data.timestamp
      },
      lastActive: data.timestamp,
      blocksValidated: 0
    } as EmotionalValidator;
    // Create block
    const block = new Block(
      data.index,
      transactions,
      data.previousHash,
      validator,
      parseFloat(data.consensusScore)
    );
    // Set block values
    block.timestamp = data.timestamp;
    block.hash = data.hash;
    return block;
  }
  /**
   * Create genesis block
   */
  public static createGenesisBlock(): Block {
    const genesisValidator = EmotionalValidatorUtils.createValidator(
      'GenesisNode',
      '0x0000000000000000000000000000000000000000'
    );
    const genesisBlock = new Block(
      0,
      [], // No transactions in genesis
      '0'.repeat(64), // No previous hash
      genesisValidator,
      100.0 // Perfect consensus for genesis
    );
    // Finalize the genesis block
    genesisBlock.finalizeBlock();
    console.log(' Genesis block created with Proof of Emotion consensus!');
    return genesisBlock;
  }
}