import { pool } from '../db';
import { zkProofGenerator } from './zk-proof-generator';

/**
 * Privacy-preserving storage layer
 * Stores proof hashes on-chain while keeping biometric data off-chain
 */
export class PrivacyStorage {
  private static instance: PrivacyStorage;
  
  public static getInstance(): PrivacyStorage {
    if (!PrivacyStorage.instance) {
      PrivacyStorage.instance = new PrivacyStorage();
    }
    return PrivacyStorage.instance;
  }

  /**
   * Store biometric proof on-chain (only hash and metadata)
   */
  async storeProofOnChain(
    validatorId: string,
    proofHash: string,
    commitmentHash: string,
    threshold: number,
    isValid: boolean,
    blockHeight?: number
  ): Promise<{ proofId: string; stored: boolean }> {
    try {
      const query = `
        INSERT INTO biometric_proofs (
          validator_id, proof_hash, commitment_hash, 
          threshold, is_valid, block_height, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `;
      
      const result = await pool.query(query, [
        validatorId,
        proofHash,
        commitmentHash,
        threshold,
        isValid,
        blockHeight || 0
      ]);
      
      return {
        proofId: result.rows[0].id,
        stored: true
      };
    } catch (error) {
      return {
        proofId: '',
        stored: false
      };
    }
  }

  /**
   * Store sensitive biometric data off-chain (encrypted local storage)
   */
  async storeBiometricDataOffChain(
    validatorId: string,
    biometricData: {
      heartRate: number;
      stressLevel: number;
      focusLevel: number;
      emotionalState: number;
    },
    proofId: string
  ): Promise<{ stored: boolean; encryptedRef: string }> {
    try {
      // Store in separate off-chain storage table with encryption
      const encryptedData = this.encryptBiometricData(biometricData);
      const encryptedRef = this.generateEncryptedReference(validatorId, proofId);
      
      const query = `
        INSERT INTO biometric_data_offchain (
          validator_id, proof_id, encrypted_data, 
          encrypted_ref, storage_type, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      
      await pool.query(query, [
        validatorId,
        proofId,
        encryptedData,
        encryptedRef,
        'local_encrypted'
      ]);
      
      return {
        stored: true,
        encryptedRef
      };
    } catch (error) {
      return {
        stored: false,
        encryptedRef: ''
      };
    }
  }

  /**
   * Retrieve proof from on-chain storage
   */
  async getProofFromChain(proofHash: string): Promise<{
    found: boolean;
    proof?: {
      validatorId: string;
      proofHash: string;
      commitmentHash: string;
      threshold: number;
      isValid: boolean;
      blockHeight: number;
      createdAt: Date;
    };
  }> {
    try {
      const query = `
        SELECT validator_id, proof_hash, commitment_hash, 
               threshold, is_valid, block_height, created_at
        FROM biometric_proofs
        WHERE proof_hash = $1
      `;
      
      const result = await pool.query(query, [proofHash]);
      
      if (result.rows.length === 0) {
        return { found: false };
      }
      
      const row = result.rows[0];
      return {
        found: true,
        proof: {
          validatorId: row.validator_id,
          proofHash: row.proof_hash,
          commitmentHash: row.commitment_hash,
          threshold: parseFloat(row.threshold),
          isValid: row.is_valid,
          blockHeight: row.block_height,
          createdAt: new Date(row.created_at)
        }
      };
    } catch (error) {
      return { found: false };
    }
  }

  /**
   * Get validator's proof history (on-chain data only)
   */
  async getValidatorProofHistory(
    validatorId: string,
    limit: number = 10
  ): Promise<Array<{
    proofHash: string;
    commitmentHash: string;
    isValid: boolean;
    threshold: number;
    createdAt: Date;
  }>> {
    try {
      const query = `
        SELECT proof_hash, commitment_hash, is_valid, threshold, created_at
        FROM biometric_proofs
        WHERE validator_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      
      const result = await pool.query(query, [validatorId, limit]);
      
      return result.rows.map(row => ({
        proofHash: row.proof_hash,
        commitmentHash: row.commitment_hash,
        isValid: row.is_valid,
        threshold: parseFloat(row.threshold),
        createdAt: new Date(row.created_at)
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Verify proof integrity across chain
   */
  async verifyProofIntegrity(proofHash: string): Promise<{
    isIntact: boolean;
    verificationDetails: {
      hashExists: boolean;
      commitmentMatches: boolean;
      timestampValid: boolean;
    };
  }> {
    try {
      const proofResult = await this.getProofFromChain(proofHash);
      
      if (!proofResult.found || !proofResult.proof) {
        return {
          isIntact: false,
          verificationDetails: {
            hashExists: false,
            commitmentMatches: false,
            timestampValid: false
          }
        };
      }
      
      // Verify proof with ZK system
      const verification = await zkProofGenerator.verifyProof(
        proofResult.proof.proofHash,
        proofResult.proof.commitmentHash,
        proofResult.proof.threshold,
        proofResult.proof.validatorId
      );
      
      const timestampValid = this.verifyTimestamp(proofResult.proof.createdAt);
      
      return {
        isIntact: verification.isValid && timestampValid,
        verificationDetails: {
          hashExists: true,
          commitmentMatches: verification.confidence > 0.8,
          timestampValid
        }
      };
    } catch (error) {
      return {
        isIntact: false,
        verificationDetails: {
          hashExists: false,
          commitmentMatches: false,
          timestampValid: false
        }
      };
    }
  }

  private encryptBiometricData(data: any): string {
    // Simple base64 encoding for demo - in production use proper encryption
    const jsonData = JSON.stringify(data);
    return Buffer.from(jsonData).toString('base64');
  }

  private generateEncryptedReference(validatorId: string, proofId: string): string {
    const refData = `${validatorId}:${proofId}:${Date.now()}`;
    return Buffer.from(refData).toString('base64');
  }

  private verifyTimestamp(timestamp: Date): boolean {
    const now = new Date();
    const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24; // Valid within 24 hours
  }
}

export const privacyStorage = PrivacyStorage.getInstance();