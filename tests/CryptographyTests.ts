import { ProductionCrypto } from '../crypto/ProductionCrypto';
import { TransactionCrypto, SignedTransaction } from '../crypto/TransactionCrypto';
import { BlockCrypto, CryptographicBlock } from '../crypto/BlockCrypto';
import { BiometricCrypto } from '../crypto/BiometricCrypto';
import { BiometricKeyPair } from '../crypto/KeyPair';

/**
 * Comprehensive cryptographic test suite
 * Validates production-grade ECDSA implementation
 */
describe('Production Cryptography', () => {
  
  describe('ProductionCrypto Core', () => {
    test('ECDSA key generation produces valid keys', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.curve).toBe('secp256k1');
      expect(keyPair.privateKey.length).toBe(32);
      expect(keyPair.publicKey.length).toBeGreaterThan(32);
    });
    
    test('ECDSA signatures are valid and verifiable', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const testData = new TextEncoder().encode('test message');
      
      const signature = ProductionCrypto.signECDSA(testData, keyPair.privateKey);
      const isValid = ProductionCrypto.verifyECDSA(testData, signature, keyPair.publicKey);
      
      expect(signature.algorithm).toBe('ECDSA-secp256k1');
      expect(signature.signature).toBeTruthy();
      expect(signature.r).toBeTruthy();
      expect(signature.s).toBeTruthy();
      expect(isValid).toBe(true);
    });
    
    test('Signature verification fails for tampered data', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const originalData = new TextEncoder().encode('test message');
      const tamperedData = new TextEncoder().encode('tampered message');
      
      const signature = ProductionCrypto.signECDSA(originalData, keyPair.privateKey);
      const isValid = ProductionCrypto.verifyECDSA(tamperedData, signature, keyPair.publicKey);
      
      expect(isValid).toBe(false);
    });
    
    test('Multi-signature creation and verification', () => {
      const keyPairs = [
        ProductionCrypto.generateECDSAKeyPair(),
        ProductionCrypto.generateECDSAKeyPair(),
        ProductionCrypto.generateECDSAKeyPair()
      ];
      const testData = new TextEncoder().encode('multi-sig test');
      
      const multiSig = ProductionCrypto.createMultiSignature(
        testData, 
        keyPairs, 
        2
      );
      
      expect(multiSig.signatures).toHaveLength(2);
      expect(multiSig.requiredSignatures).toBe(2);
      expect(multiSig.algorithm).toBe('Multi-ECDSA');
      
      const isValid = ProductionCrypto.verifyMultiSignature(testData, multiSig);
      expect(isValid).toBe(true);
    });
  });
  
  describe('Transaction Cryptography', () => {
    test('Transaction signing produces valid signatures', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const transaction = {
        from: '0x123',
        to: '0x456',
        amount: 100,
        nonce: 1,
        timestamp: Date.now(),
        fee: 0.1,
        type: 'transfer' as const
      };
      
      const signedTx = await TransactionCrypto.signTransaction(transaction, keyPair.privateKey);
      
      expect(signedTx.signature).toBeTruthy();
      expect(signedTx.hash).toBeTruthy();
      expect(signedTx.from).toBe(transaction.from);
      expect(signedTx.amount).toBe(transaction.amount);
    });
    
    test('Transaction verification validates authentic signatures', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const transaction = {
        from: '0x123',
        to: '0x456',
        amount: 100,
        nonce: 1,
        timestamp: Date.now(),
        fee: 0.1,
        type: 'transfer' as const
      };
      
      const signedTx = await TransactionCrypto.signTransaction(transaction, keyPair.privateKey);
      const isValid = await TransactionCrypto.verifyTransaction(signedTx, keyPair.publicKey);
      
      expect(isValid).toBe(true);
    });
    
    test('Transaction verification rejects tampered transactions', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const transaction = {
        from: '0x123',
        to: '0x456',
        amount: 100,
        nonce: 1,
        timestamp: Date.now(),
        fee: 0.1,
        type: 'transfer' as const
      };
      
      const signedTx = await TransactionCrypto.signTransaction(transaction, keyPair.privateKey);
      
      // Tamper with the amount
      const tamperedTx = { ...signedTx, amount: 200 };
      
      const isValid = await TransactionCrypto.verifyTransaction(tamperedTx, keyPair.publicKey);
      expect(isValid).toBe(false);
    });
    
    test('Address derivation is deterministic', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      
      const address1 = TransactionCrypto.deriveAddress(keyPair.publicKey);
      const address2 = TransactionCrypto.deriveAddress(keyPair.publicKey);
      
      expect(address1).toBe(address2);
      expect(address1).toMatch(/^0x[0-9a-f]{40}$/);
    });
    
    test('Nonce generation provides uniqueness', () => {
      const nonces = new Set();
      
      for (let i = 0; i < 1000; i++) {
        const nonce = TransactionCrypto.generateNonce();
        expect(nonces.has(nonce)).toBe(false);
        nonces.add(nonce);
      }
    });
  });
  
  describe('Block Cryptography', () => {
    test('Block signing produces cryptographically secure blocks', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const blockInput = {
        index: 1,
        timestamp: Date.now(),
        transactions: [],
        previousHash: '0x000',
        validator: 'test-validator',
        emotionalScore: '85.5',
        consensusScore: '92.0',
        authenticity: '88.2',
        nonce: 0,
        difficulty: 2
      };
      
      const signedBlock = await BlockCrypto.signBlock(blockInput, keyPair.privateKey);
      
      expect(signedBlock.hash).toBeTruthy();
      expect(signedBlock.signature).toBeTruthy();
      expect(signedBlock.merkleRoot).toBeTruthy();
      expect(signedBlock.validatorSignatures).toHaveLength(1);
    });
    
    test('Block verification validates authentic blocks', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const blockInput = {
        index: 1,
        timestamp: Date.now(),
        transactions: [],
        previousHash: '0x000',
        validator: 'test-validator',
        emotionalScore: '85.5',
        consensusScore: '92.0',
        authenticity: '88.2',
        nonce: 0,
        difficulty: 2
      };
      
      const signedBlock = await BlockCrypto.signBlock(blockInput, keyPair.privateKey);
      const isValid = await BlockCrypto.verifyBlock(signedBlock, keyPair.publicKey);
      
      expect(isValid).toBe(true);
    });
    
    test('Block verification rejects tampered blocks', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const blockInput = {
        index: 1,
        timestamp: Date.now(),
        transactions: [],
        previousHash: '0x000',
        validator: 'test-validator',
        emotionalScore: '85.5',
        consensusScore: '92.0',
        authenticity: '88.2',
        nonce: 0,
        difficulty: 2
      };
      
      const signedBlock = await BlockCrypto.signBlock(blockInput, keyPair.privateKey);
      
      // Tamper with the emotional score
      const tamperedBlock = { ...signedBlock, emotionalScore: '95.0' };
      
      const isValid = await BlockCrypto.verifyBlock(tamperedBlock, keyPair.publicKey);
      expect(isValid).toBe(false);
    });
    
    test('Merkle root calculation is deterministic', () => {
      const transactions = [
        { id: 'tx1', amount: 100 },
        { id: 'tx2', amount: 200 },
        { id: 'tx3', amount: 300 }
      ];
      
      const root1 = BlockCrypto.calculateMerkleRoot(transactions);
      const root2 = BlockCrypto.calculateMerkleRoot(transactions);
      
      expect(root1).toBe(root2);
      expect(root1).toMatch(/^[0-9a-f]{64}$/);
    });
    
    test('Multi-signature consensus validation', async () => {
      const validators = [
        ProductionCrypto.generateECDSAKeyPair(),
        ProductionCrypto.generateECDSAKeyPair(),
        ProductionCrypto.generateECDSAKeyPair()
      ];
      
      const blockInput = {
        index: 1,
        timestamp: Date.now(),
        transactions: [],
        previousHash: '0x000',
        validator: 'validator-1',
        emotionalScore: '85.5',
        consensusScore: '92.0',
        authenticity: '88.2',
        nonce: 0,
        difficulty: 2
      };
      
      let signedBlock = await BlockCrypto.signBlock(blockInput, validators[0].privateKey);
      
      // Add additional validator signatures
      signedBlock = BlockCrypto.addValidatorSignature(signedBlock, validators[1].privateKey);
      signedBlock = BlockCrypto.addValidatorSignature(signedBlock, validators[2].privateKey);
      
      const publicKeys = validators.map(v => v.publicKey);
      const isValid = BlockCrypto.verifyMultiSignature(signedBlock, publicKeys, 2);
      
      expect(isValid).toBe(true);
      expect(signedBlock.validatorSignatures.length).toBe(3);
    });
  });
  
  describe('Biometric Cryptography', () => {
    test('Emotional proof generation creates cryptographic proofs', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const readings = [
        {
          deviceId: 'hr-001',
          deviceType: 'heart_rate' as const,
          value: 75,
          timestamp: Date.now(),
          unit: 'bpm'
        },
        {
          deviceId: 'stress-001',
          deviceType: 'stress' as const,
          value: 0.3,
          timestamp: Date.now(),
          unit: 'normalized'
        }
      ];
      
      const proof = await BiometricCrypto.generateEmotionalProof(readings, keyPair.privateKey);
      
      expect(proof.aggregateSignature).toBeTruthy();
      expect(proof.timestampSignature).toBeTruthy();
      expect(proof.antiTamperHash).toBeTruthy();
      expect(proof.emotionalScore).toBeGreaterThan(0);
      expect(proof.authenticity).toBeGreaterThan(0);
      expect(proof.readings).toHaveLength(2);
    });
    
    test('Emotional proof verification validates authentic proofs', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const readings = [
        {
          deviceId: 'hr-001',
          deviceType: 'heart_rate' as const,
          value: 75,
          timestamp: Date.now(),
          unit: 'bpm'
        }
      ];
      
      const proof = await BiometricCrypto.generateEmotionalProof(readings, keyPair.privateKey);
      const isValid = await BiometricCrypto.verifyEmotionalProof(proof, keyPair.publicKey);
      
      expect(isValid).toBe(true);
    });
    
    test('Emotional proof verification rejects tampered proofs', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const readings = [
        {
          deviceId: 'hr-001',
          deviceType: 'heart_rate' as const,
          value: 75,
          timestamp: Date.now(),
          unit: 'bpm'
        }
      ];
      
      const proof = await BiometricCrypto.generateEmotionalProof(readings, keyPair.privateKey);
      
      // Tamper with the emotional score
      const tamperedProof = { ...proof, emotionalScore: 95 };
      
      const isValid = await BiometricCrypto.verifyEmotionalProof(tamperedProof, keyPair.publicKey);
      expect(isValid).toBe(false);
    });
    
    test('Device signature aggregation creates deterministic signatures', () => {
      const signatures = new Map([
        ['device-1', 'sig1'],
        ['device-2', 'sig2'],
        ['device-3', 'sig3']
      ]);
      
      const aggregate1 = BiometricCrypto.aggregateDeviceSignatures(signatures);
      const aggregate2 = BiometricCrypto.aggregateDeviceSignatures(signatures);
      
      expect(aggregate1).toBe(aggregate2);
      expect(aggregate1).toMatch(/^[0-9a-f]{64}$/);
    });
  });
  
  describe('KeyPair Implementation', () => {
    test('BiometricKeyPair generates valid ECDSA keys', () => {
      const keyPair = new BiometricKeyPair();
      const keys = keyPair.generateKeyPair();
      
      expect(keys.publicKey).toBeTruthy();
      expect(keys.privateKey).toBeTruthy();
      expect(keys.publicKey).toMatch(/^[0-9a-f]+$/);
      expect(keys.privateKey).toMatch(/^[0-9a-f]+$/);
    });
    
    test('BiometricKeyPair address derivation is consistent', () => {
      const keyPair = new BiometricKeyPair();
      keyPair.generateKeyPair();
      
      const address1 = keyPair.getAddress();
      const address2 = keyPair.getAddress();
      
      expect(address1).toBe(address2);
      expect(address1).toMatch(/^0x[0-9a-f]{40}$/);
    });
    
    test('BiometricKeyPair signing and verification works', () => {
      const keyPair = new BiometricKeyPair();
      keyPair.generateKeyPair();
      
      const testData = Buffer.from('test message');
      const signature = keyPair.sign(testData);
      const isValid = keyPair.verify(testData, signature);
      
      expect(signature.r).toBeTruthy();
      expect(signature.s).toBeTruthy();
      expect(isValid).toBe(true);
    });
    
    test('Static KeyPair verification methods work', () => {
      const keyPair = new BiometricKeyPair();
      const keys = keyPair.generateKeyPair();
      
      const testHash = 'abcdef1234567890';
      const signature = BiometricKeyPair.sign(testHash, keys.privateKey);
      const isValid = BiometricKeyPair.verify(testHash, signature, keys.publicKey);
      
      expect(signature).toBeTruthy();
      expect(isValid).toBe(true);
    });
  });
  
  describe('Performance Tests', () => {
    test('Transaction signing performance < 10ms', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const transaction = {
        from: '0x123',
        to: '0x456',
        amount: 100,
        nonce: 1,
        timestamp: Date.now(),
        fee: 0.1,
        type: 'transfer' as const
      };
      
      const start = Date.now();
      await TransactionCrypto.signTransaction(transaction, keyPair.privateKey);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(10);
    });
    
    test('Block validation performance < 100ms', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const blockInput = {
        index: 1,
        timestamp: Date.now(),
        transactions: Array(100).fill(0).map((_, i) => ({ id: `tx-${i}`, amount: i })),
        previousHash: '0x000',
        validator: 'test-validator',
        emotionalScore: '85.5',
        consensusScore: '92.0',
        authenticity: '88.2',
        nonce: 0,
        difficulty: 2
      };
      
      const signedBlock = await BlockCrypto.signBlock(blockInput, keyPair.privateKey);
      
      const start = Date.now();
      await BlockCrypto.verifyBlock(signedBlock, keyPair.publicKey);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(100);
    });
    
    test('Signature verification performance < 5ms', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const testData = new TextEncoder().encode('test message');
      const signature = ProductionCrypto.signECDSA(testData, keyPair.privateKey);
      
      const start = Date.now();
      ProductionCrypto.verifyECDSA(testData, signature, keyPair.publicKey);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(5);
    });
  });
  
  describe('Security Validation', () => {
    test('Private keys never appear in error logs', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const privateKeyHex = Buffer.from(keyPair.privateKey).toString('hex');
      
      // Test error handling doesn't leak private keys
      try {
        ProductionCrypto.verifyECDSA(
          new Uint8Array([1, 2, 3]),
          { signature: 'invalid', algorithm: 'ECDSA-secp256k1', r: '', s: '', recovery: 0 },
          keyPair.publicKey
        );
      } catch (error) {
        const errorMessage = error?.toString() || '';
        expect(errorMessage).not.toContain(privateKeyHex);
      }
    });
    
    test('Replay protection prevents duplicate nonces', () => {
      const knownNonces = new Set(['0x123:1', '0x123:2', '0x456:1']);
      
      const validTx = { from: '0x123', nonce: 3 } as SignedTransaction;
      const replayTx = { from: '0x123', nonce: 1 } as SignedTransaction;
      
      expect(TransactionCrypto.validateReplayProtection(validTx, knownNonces)).toBe(true);
      expect(TransactionCrypto.validateReplayProtection(replayTx, knownNonces)).toBe(false);
    });
    
    test('Fork resistance prevents unauthorized modifications', async () => {
      const validator1 = ProductionCrypto.generateECDSAKeyPair();
      const validator2 = ProductionCrypto.generateECDSAKeyPair();
      
      const blockInput = {
        index: 1,
        timestamp: Date.now(),
        transactions: [],
        previousHash: '0x000',
        validator: 'validator-1',
        emotionalScore: '85.5',
        consensusScore: '92.0',
        authenticity: '88.2',
        nonce: 0,
        difficulty: 2
      };
      
      const legitimateBlock = await BlockCrypto.signBlock(blockInput, validator1.privateKey);
      
      // Attempt to forge with different validator
      const isValidForgery = await BlockCrypto.verifyBlock(legitimateBlock, validator2.publicKey);
      
      expect(isValidForgery).toBe(false);
    });
  });
});

export default {
  testEnvironment: 'node',
  preset: 'ts-jest',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'crypto/**/*.ts',
    'sdk/**/*.ts',
    '!**/*.d.ts'
  ]
};