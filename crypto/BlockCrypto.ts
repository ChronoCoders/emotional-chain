import { ProductionCrypto, ECDSASignature, MultiSignature } from './ProductionCrypto';
import { MerkleTree } from './MerkleTree';

export interface CryptographicBlock {
  index: number;
  timestamp: number;
  transactions: any[];
  previousHash: string;
  hash: string;           // Merkle root of all transactions
  signature: string;      // Block producer ECDSA signature
  merkleRoot: string;     // Transaction Merkle tree root
  validatorSignatures: string[]; // Multiple validator signatures
  nonce: number;
  difficulty: number;
  validator: string;
  emotionalScore: string;
  consensusScore: string;
  authenticity: string;
}

export interface BlockInput {
  index: number;
  timestamp: number;
  transactions: any[];
  previousHash: string;
  validator: string;
  emotionalScore: string;
  consensusScore: string;
  authenticity: string;
  nonce: number;
  difficulty: number;
}

export interface MerkleProof {
  leaf: string;
  proof: string[];
  root: string;
  index: number;
}

/**
 * Production-grade block cryptography using ECDSA signatures and Merkle trees
 * Replaces amateur hashing with cryptographically secure block validation
 */
export class BlockCrypto {
  
  /**
   * Sign block using ECDSA with secp256k1
   */
  static async signBlock(block: BlockInput, validatorPrivateKey: Uint8Array): Promise<CryptographicBlock> {
    // Calculate Merkle root of transactions
    const merkleRoot = this.calculateMerkleRoot(block.transactions);
    
    // Generate block hash from canonical data
    const blockHash = this.generateBlockHash({
      ...block,
      merkleRoot
    });
    
    // Sign the block hash with validator's private key
    const signature = ProductionCrypto.signECDSA(
      new TextEncoder().encode(blockHash),
      validatorPrivateKey
    );
    
    return {
      ...block,
      hash: blockHash,
      signature: signature.signature,
      merkleRoot,
      validatorSignatures: [signature.signature]
    };
  }
  
  /**
   * Verify block signature and integrity
   */
  static async verifyBlock(block: CryptographicBlock, validatorPublicKey: Uint8Array): Promise<boolean> {
    try {
      // Reconstruct block data without signature
      const blockInput: BlockInput = {
        index: block.index,
        timestamp: block.timestamp,
        transactions: block.transactions,
        previousHash: block.previousHash,
        validator: block.validator,
        emotionalScore: block.emotionalScore,
        consensusScore: block.consensusScore,
        authenticity: block.authenticity,
        nonce: block.nonce,
        difficulty: block.difficulty
      };
      
      // Verify Merkle root matches transactions
      const expectedMerkleRoot = this.calculateMerkleRoot(block.transactions);
      if (expectedMerkleRoot !== block.merkleRoot) {
        return false;
      }
      
      // Verify block hash matches
      const expectedHash = this.generateBlockHash({
        ...blockInput,
        merkleRoot: block.merkleRoot
      });
      if (expectedHash !== block.hash) {
        return false;
      }
      
      // Verify block signature
      const signatureObj: ECDSASignature = {
        signature: block.signature,
        algorithm: 'ECDSA-secp256k1',
        r: '', s: '', recovery: 0
      };
      
      return ProductionCrypto.verifyECDSA(
        new TextEncoder().encode(block.hash),
        signatureObj,
        validatorPublicKey
      );
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Calculate Merkle root of transactions using production cryptography
   */
  static calculateMerkleRoot(transactions: any[]): string {
    if (transactions.length === 0) {
      // Empty block has null hash
      return Buffer.from(ProductionCrypto.hash(new Uint8Array(0))).toString('hex');
    }
    
    // Create Merkle tree from transaction hashes
    const merkleTree = new MerkleTree(transactions);
    return merkleTree.getRoot();
  }
  
  /**
   * Generate cryptographic hash of block header
   */
  static generateBlockHash(block: BlockInput & { merkleRoot: string }): string {
    // Create canonical block representation
    const canonicalData = {
      index: block.index,
      timestamp: block.timestamp,
      previousHash: block.previousHash,
      merkleRoot: block.merkleRoot,
      validator: block.validator,
      emotionalScore: block.emotionalScore,
      consensusScore: block.consensusScore,
      authenticity: block.authenticity,
      nonce: block.nonce,
      difficulty: block.difficulty
    };
    
    // Convert to deterministic byte representation
    const dataString = JSON.stringify(canonicalData, Object.keys(canonicalData).sort());
    const dataBytes = new TextEncoder().encode(dataString);
    
    // Generate SHA-256 hash using production crypto
    const hashBytes = ProductionCrypto.hash(dataBytes);
    return Buffer.from(hashBytes).toString('hex');
  }
  
  /**
   * Verify Merkle proof for transaction inclusion
   */
  static verifyMerkleProof(proof: MerkleProof): boolean {
    try {
      let currentHash = proof.leaf;
      
      for (let i = 0; i < proof.proof.length; i++) {
        const siblingHash = proof.proof[i];
        const isRightNode = (proof.index >> i) & 1;
        
        if (isRightNode) {
          currentHash = Buffer.from(ProductionCrypto.hash(
            new TextEncoder().encode(siblingHash + currentHash)
          )).toString('hex');
        } else {
          currentHash = Buffer.from(ProductionCrypto.hash(
            new TextEncoder().encode(currentHash + siblingHash)
          )).toString('hex');
        }
      }
      
      return currentHash === proof.root;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Add validator signature to block (multi-signature consensus)
   */
  static addValidatorSignature(
    block: CryptographicBlock,
    validatorPrivateKey: Uint8Array
  ): CryptographicBlock {
    // Sign the block hash
    const signature = ProductionCrypto.signECDSA(
      new TextEncoder().encode(block.hash),
      validatorPrivateKey
    );
    
    // Add signature to validator signatures array
    const validatorSignatures = [...block.validatorSignatures, signature.signature];
    
    return {
      ...block,
      validatorSignatures
    };
  }
  
  /**
   * Verify multi-signature consensus for block
   */
  static verifyMultiSignature(
    block: CryptographicBlock,
    validatorPublicKeys: Uint8Array[],
    requiredSignatures: number
  ): boolean {
    if (block.validatorSignatures.length < requiredSignatures) {
      return false;
    }
    
    let validSignatures = 0;
    
    for (let i = 0; i < Math.min(block.validatorSignatures.length, validatorPublicKeys.length); i++) {
      const signature = block.validatorSignatures[i];
      const publicKey = validatorPublicKeys[i];
      
      const signatureObj: ECDSASignature = {
        signature,
        algorithm: 'ECDSA-secp256k1',
        r: '', s: '', recovery: 0
      };
      
      if (ProductionCrypto.verifyECDSA(
        new TextEncoder().encode(block.hash),
        signatureObj,
        publicKey
      )) {
        validSignatures++;
      }
    }
    
    return validSignatures >= requiredSignatures;
  }
  
  /**
   * Validate block structure and cryptographic integrity
   */
  static validateBlockStructure(block: CryptographicBlock): boolean {
    // Check required fields
    if (!block.hash || !block.signature || !block.merkleRoot || !block.previousHash) {
      return false;
    }
    
    // Check index is non-negative
    if (block.index < 0) {
      return false;
    }
    
    // Check timestamp is reasonable
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    if (Math.abs(now - block.timestamp) > oneHour && block.index > 0) {
      return false;
    }
    
    // Check difficulty is positive
    if (block.difficulty <= 0) {
      return false;
    }
    
    // Check nonce is non-negative
    if (block.nonce < 0) {
      return false;
    }
    
    // Validate emotional scores
    const emotionalScore = parseFloat(block.emotionalScore);
    const consensusScore = parseFloat(block.consensusScore);
    const authenticity = parseFloat(block.authenticity);
    
    if (isNaN(emotionalScore) || emotionalScore < 0 || emotionalScore > 100) {
      return false;
    }
    
    if (isNaN(consensusScore) || consensusScore < 0 || consensusScore > 100) {
      return false;
    }
    
    if (isNaN(authenticity) || authenticity < 0 || authenticity > 100) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Generate proof-of-work nonce for block mining
   */
  static async mineBlock(
    block: BlockInput,
    difficulty: number,
    validatorPrivateKey: Uint8Array
  ): Promise<CryptographicBlock> {
    let nonce = 0;
    const target = '0'.repeat(difficulty);
    
    while (true) {
      const blockWithNonce = { ...block, nonce };
      const merkleRoot = this.calculateMerkleRoot(block.transactions);
      const hash = this.generateBlockHash({ ...blockWithNonce, merkleRoot });
      
      if (hash.startsWith(target)) {
        // Found valid nonce, sign the block
        return this.signBlock({ ...blockWithNonce, nonce }, validatorPrivateKey);
      }
      
      nonce++;
      
      // Prevent infinite mining loops
      if (nonce > 1000000) {
        throw new Error('Mining timeout: unable to find valid nonce');
      }
    }
  }
}