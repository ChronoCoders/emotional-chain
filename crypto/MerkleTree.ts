import * as crypto from 'crypto';
import { Transaction } from './Transaction';
export interface MerkleProof {
  leaf: string;
  path: string[];
  indices: number[];
}
export class MerkleTree {
  private leaves: string[];
  private tree: string[][];
  constructor(transactions: Transaction[]) {
    // Create leaf hashes from transactions
    this.leaves = transactions.map(tx => tx.calculateHash());
    // Build the merkle tree
    this.tree = this.buildTree();
  }
  /**
   * Build the merkle tree from leaf hashes
   */
  private buildTree(): string[][] {
    if (this.leaves.length === 0) {
      return [['0'.repeat(64)]]; // Empty tree root
    }
    let currentLevel = [...this.leaves];
    const tree: string[][] = [currentLevel];
    // Build tree levels bottom-up
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      // Pair up hashes and create parent hashes
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left; // Duplicate if odd
        const combined = left + right;
        const parentHash = crypto.createHash('sha256').update(combined).digest('hex');
        nextLevel.push(parentHash);
      }
      currentLevel = nextLevel;
      tree.push(currentLevel);
    }
    return tree;
  }
  /**
   * Get the merkle root hash
   */
  public getRoot(): string {
    if (this.tree.length === 0) {
      return '0'.repeat(64);
    }
    const rootLevel = this.tree[this.tree.length - 1];
    return rootLevel[0];
  }
  /**
   * Generate a merkle proof for a specific transaction
   */
  public getProof(transactionHash: string): MerkleProof | null {
    // Find the leaf index
    const leafIndex = this.leaves.indexOf(transactionHash);
    if (leafIndex === -1) {
      return null; // Transaction not found
    }
    const proof: MerkleProof = {
      leaf: transactionHash,
      path: [],
      indices: []
    };
    let currentIndex = leafIndex;
    // Traverse up the tree collecting sibling hashes
    for (let level = 0; level < this.tree.length - 1; level++) {
      const currentLevel = this.tree[level];
      const isRightNode = currentIndex % 2 === 1;
      let siblingIndex: number;
      if (isRightNode) {
        siblingIndex = currentIndex - 1; // Left sibling
      } else {
        siblingIndex = currentIndex + 1; // Right sibling
      }
      // Add sibling hash to proof (or duplicate if no sibling)
      if (siblingIndex < currentLevel.length) {
        proof.path.push(currentLevel[siblingIndex]);
      } else {
        proof.path.push(currentLevel[currentIndex]); // Duplicate for odd number
      }
      proof.indices.push(isRightNode ? 1 : 0); // 0 = left, 1 = right
      currentIndex = Math.floor(currentIndex / 2); // Move to parent
    }
    return proof;
  }
  /**
   * Verify a merkle proof against the root
   */
  public static verifyProof(proof: MerkleProof, root: string): boolean {
    let currentHash = proof.leaf;
    // Traverse up the tree using the proof path
    for (let i = 0; i < proof.path.length; i++) {
      const siblingHash = proof.path[i];
      const isRightNode = proof.indices[i] === 0;
      let combined: string;
      if (isRightNode) {
        combined = siblingHash + currentHash; // Sibling on left, current on right
      } else {
        combined = currentHash + siblingHash; // Current on left, sibling on right
      }
      currentHash = crypto.createHash('sha256').update(combined).digest('hex');
    }
    return currentHash === root;
  }
  /**
   * Get all leaf hashes
   */
  public getLeaves(): string[] {
    return [...this.leaves];
  }
  /**
   * Get the complete tree structure (for debugging)
   */
  public getTree(): string[][] {
    return this.tree.map(level => [...level]);
  }
  /**
   * Verify the entire tree structure
   */
  public verifyTree(): boolean {
    try {
      // Verify each level is correctly computed from the level below
      for (let level = 0; level < this.tree.length - 1; level++) {
        const currentLevel = this.tree[level];
        const parentLevel = this.tree[level + 1];
        // Check if parent level has correct number of nodes
        const expectedParentSize = Math.ceil(currentLevel.length / 2);
        if (parentLevel.length !== expectedParentSize) {
          return false;
        }
        // Verify each parent hash
        for (let i = 0; i < parentLevel.length; i++) {
          const leftChild = currentLevel[i * 2];
          const rightChild = i * 2 + 1 < currentLevel.length ? currentLevel[i * 2 + 1] : leftChild;
          const combined = leftChild + rightChild;
          const expectedHash = crypto.createHash('sha256').update(combined).digest('hex');
          if (parentLevel[i] !== expectedHash) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Tree verification failed:', error);
      return false;
    }
  }
  /**
   * Create merkle tree from transaction hashes directly
   */
  public static fromHashes(hashes: string[]): MerkleTree {
    const dummyTransactions = hashes.map(hash => ({
      calculateHash: () => hash
    })) as Transaction[];
    return new MerkleTree(dummyTransactions);
  }
}