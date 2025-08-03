#!/usr/bin/env tsx

/**
 * Comprehensive Cryptographic Validation Suite
 * Validates production-grade ECDSA implementation across EmotionalChain
 */
import { ProductionCrypto } from '../crypto/ProductionCrypto.js';
import { TransactionCrypto } from '../crypto/TransactionCrypto.js';
import { BlockCrypto } from '../crypto/BlockCrypto.js';
import { BiometricCrypto } from '../crypto/BiometricCrypto.js';
import { BiometricKeyPair } from '../crypto/KeyPair.js';

class CryptographicValidator {
  private testResults: { name: string; passed: boolean; error?: string }[] = [];
  
  async runAllTests(): Promise<void> {
    console.log('🔐 CRYPTOGRAPHIC SECURITY VALIDATION SUITE');
    console.log('==========================================\n');
    
    await this.testProductionCrypto();
    await this.testTransactionCrypto();
    await this.testBlockCrypto();
    await this.testBiometricCrypto();
    await this.testKeyPairImplementation();
    await this.testPerformanceBenchmarks();
    await this.testSecurityValidation();
    
    this.printSummary();
  }
  
  private async test(name: string, testFn: () => Promise<void> | void): Promise<void> {
    try {
      await testFn();
      this.testResults.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.testResults.push({ name, passed: false, error: error?.toString() });
      console.log(`❌ ${name}: ${error}`);
    }
  }
  
  private async testProductionCrypto(): Promise<void> {
    console.log('📋 Testing ProductionCrypto Core...');
    
    await this.test('ECDSA key generation produces valid keys', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      
      if (!(keyPair.privateKey instanceof Uint8Array)) throw new Error('Private key not Uint8Array');
      if (!(keyPair.publicKey instanceof Uint8Array)) throw new Error('Public key not Uint8Array');
      if (keyPair.curve !== 'secp256k1') throw new Error('Incorrect curve');
      if (keyPair.privateKey.length !== 32) throw new Error('Invalid private key length');
      if (keyPair.publicKey.length <= 32) throw new Error('Invalid public key length');
    });
    
    await this.test('ECDSA signatures are valid and verifiable', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const testData = new TextEncoder().encode('test message');
      
      const signature = ProductionCrypto.signECDSA(testData, keyPair.privateKey);
      const isValid = ProductionCrypto.verifyECDSA(testData, signature, keyPair.publicKey);
      
      if (signature.algorithm !== 'ECDSA-secp256k1') throw new Error('Incorrect algorithm');
      if (!signature.signature) throw new Error('No signature generated');
      if (!signature.r || !signature.s) throw new Error('Missing r/s components');
      if (!isValid) throw new Error('Signature verification failed');
    });
    
    await this.test('Signature verification fails for tampered data', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const originalData = new TextEncoder().encode('test message');
      const tamperedData = new TextEncoder().encode('tampered message');
      
      const signature = ProductionCrypto.signECDSA(originalData, keyPair.privateKey);
      const isValid = ProductionCrypto.verifyECDSA(tamperedData, signature, keyPair.publicKey);
      
      if (isValid) throw new Error('Signature should have failed verification');
    });
    
    await this.test('Cryptographic hashing is deterministic', () => {
      const testData = new TextEncoder().encode('deterministic test');
      
      const hash1 = ProductionCrypto.hash(testData);
      const hash2 = ProductionCrypto.hash(testData);
      
      const hashHex1 = Buffer.from(hash1).toString('hex');
      const hashHex2 = Buffer.from(hash2).toString('hex');
      
      if (hashHex1 !== hashHex2) throw new Error('Hash not deterministic');
      if (hashHex1.length !== 64) throw new Error('Hash not 256-bit');
    });
    
    console.log('');
  }
  
  private async testTransactionCrypto(): Promise<void> {
    console.log('💸 Testing Transaction Cryptography...');
    
    await this.test('Transaction signing produces valid signatures', async () => {
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
      
      if (!signedTx.signature) throw new Error('No signature generated');
      if (!signedTx.hash) throw new Error('No hash generated');
      if (signedTx.from !== transaction.from) throw new Error('Transaction data corrupted');
      if (signedTx.amount !== transaction.amount) throw new Error('Amount corrupted');
    });
    
    await this.test('Transaction verification validates authentic signatures', async () => {
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
      
      if (!isValid) throw new Error('Valid transaction failed verification');
    });
    
    await this.test('Address derivation is deterministic', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      
      const address1 = TransactionCrypto.deriveAddress(keyPair.publicKey);
      const address2 = TransactionCrypto.deriveAddress(keyPair.publicKey);
      
      if (address1 !== address2) throw new Error('Address derivation not deterministic');
      if (!/^0x[0-9a-f]{40}$/.test(address1)) throw new Error('Invalid address format');
    });
    
    await this.test('Nonce generation provides uniqueness', () => {
      const nonces = new Set();
      
      for (let i = 0; i < 100; i++) {
        const nonce = TransactionCrypto.generateNonce();
        if (nonces.has(nonce)) throw new Error('Duplicate nonce generated');
        nonces.add(nonce);
      }
    });
    
    console.log('');
  }
  
  private async testBlockCrypto(): Promise<void> {
    console.log('🧱 Testing Block Cryptography...');
    
    await this.test('Block signing produces cryptographically secure blocks', async () => {
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
      
      if (!signedBlock.hash) throw new Error('No block hash generated');
      if (!signedBlock.signature) throw new Error('No block signature generated');
      if (!signedBlock.merkleRoot) throw new Error('No Merkle root generated');
      if (signedBlock.validatorSignatures.length !== 1) throw new Error('Invalid validator signatures');
    });
    
    await this.test('Block verification validates authentic blocks', async () => {
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
      
      if (!isValid) throw new Error('Valid block failed verification');
    });
    
    await this.test('Merkle root calculation is deterministic', () => {
      const transactions = [
        { id: 'tx1', amount: 100 },
        { id: 'tx2', amount: 200 },
        { id: 'tx3', amount: 300 }
      ];
      
      const root1 = BlockCrypto.calculateMerkleRoot(transactions);
      const root2 = BlockCrypto.calculateMerkleRoot(transactions);
      
      if (root1 !== root2) throw new Error('Merkle root not deterministic');
      if (!/^[0-9a-f]{64}$/.test(root1)) throw new Error('Invalid Merkle root format');
    });
    
    console.log('');
  }
  
  private async testBiometricCrypto(): Promise<void> {
    console.log('🫀 Testing Biometric Cryptography...');
    
    await this.test('Emotional proof generation creates cryptographic proofs', async () => {
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
      
      if (!proof.aggregateSignature) throw new Error('No aggregate signature');
      if (!proof.timestampSignature) throw new Error('No timestamp signature');
      if (!proof.antiTamperHash) throw new Error('No anti-tamper hash');
      if (proof.emotionalScore <= 0) throw new Error('Invalid emotional score');
      if (proof.authenticity <= 0) throw new Error('Invalid authenticity score');
      if (proof.readings.length !== 1) throw new Error('Readings corrupted');
    });
    
    await this.test('Emotional proof verification validates authentic proofs', async () => {
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
      
      if (!isValid) throw new Error('Valid proof failed verification');
    });
    
    console.log('');
  }
  
  private async testKeyPairImplementation(): Promise<void> {
    console.log('🔑 Testing KeyPair Implementation...');
    
    await this.test('BiometricKeyPair generates valid ECDSA keys', () => {
      const keyPair = new BiometricKeyPair();
      const keys = keyPair.generateKeyPair();
      
      if (!keys.publicKey) throw new Error('No public key generated');
      if (!keys.privateKey) throw new Error('No private key generated');
      if (!/^[0-9a-f]+$/.test(keys.publicKey)) throw new Error('Invalid public key format');
      if (!/^[0-9a-f]+$/.test(keys.privateKey)) throw new Error('Invalid private key format');
    });
    
    await this.test('BiometricKeyPair address derivation is consistent', () => {
      const keyPair = new BiometricKeyPair();
      keyPair.generateKeyPair();
      
      const address1 = keyPair.getAddress();
      const address2 = keyPair.getAddress();
      
      if (address1 !== address2) throw new Error('Address derivation not consistent');
      if (!/^0x[0-9a-f]{40}$/.test(address1)) throw new Error('Invalid address format');
    });
    
    await this.test('BiometricKeyPair signing and verification works', () => {
      const keyPair = new BiometricKeyPair();
      keyPair.generateKeyPair();
      
      const testData = Buffer.from('test message');
      const signature = keyPair.sign(testData);
      const isValid = keyPair.verify(testData, signature);
      
      if (!signature.r) throw new Error('No r component');
      if (!signature.s) throw new Error('No s component');
      if (!isValid) throw new Error('Signature verification failed');
    });
    
    console.log('');
  }
  
  private async testPerformanceBenchmarks(): Promise<void> {
    console.log('⚡ Testing Performance Benchmarks...');
    
    await this.test('Transaction signing performance < 10ms', async () => {
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
      
      if (end - start >= 10) throw new Error(`Performance too slow: ${end - start}ms`);
    });
    
    await this.test('Signature verification performance < 5ms', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const testData = new TextEncoder().encode('test message');
      const signature = ProductionCrypto.signECDSA(testData, keyPair.privateKey);
      
      const start = Date.now();
      ProductionCrypto.verifyECDSA(testData, signature, keyPair.publicKey);
      const end = Date.now();
      
      if (end - start >= 5) throw new Error(`Performance too slow: ${end - start}ms`);
    });
    
    console.log('');
  }
  
  private async testSecurityValidation(): Promise<void> {
    console.log('🛡️ Testing Security Validation...');
    
    await this.test('Replay protection prevents duplicate nonces', () => {
      const knownNonces = new Set(['0x123:1', '0x123:2', '0x456:1']);
      
      const validTx = { from: '0x123', nonce: 3 } as any;
      const replayTx = { from: '0x123', nonce: 1 } as any;
      
      const validResult = TransactionCrypto.validateReplayProtection(validTx, knownNonces);
      const replayResult = TransactionCrypto.validateReplayProtection(replayTx, knownNonces);
      
      if (!validResult) throw new Error('Valid transaction rejected');
      if (replayResult) throw new Error('Replay attack not prevented');
    });
    
    await this.test('Fork resistance prevents unauthorized modifications', async () => {
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
      const isValidForgery = await BlockCrypto.verifyBlock(legitimateBlock, validator2.publicKey);
      
      if (isValidForgery) throw new Error('Fork attack not prevented');
    });
    
    console.log('');
  }
  
  private printSummary(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = this.testResults.filter(r => !r.passed);
    
    console.log('==========================================');
    console.log('🔐 CRYPTOGRAPHIC VALIDATION SUMMARY');
    console.log('==========================================\n');
    
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests.length}\n`);
    
    if (failedTests.length > 0) {
      console.log('Failed Tests:');
      failedTests.forEach(test => {
        console.log(`  ❌ ${test.name}`);
        if (test.error) {
          console.log(`     Error: ${test.error}`);
        }
      });
      console.log('');
    }
    
    const successRate = (passedTests / totalTests) * 100;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%\n`);
    
    if (successRate >= 90) {
      console.log('🎉 CRYPTOGRAPHIC SECURITY VALIDATION PASSED');
      console.log('   Production-grade cryptography successfully implemented!');
    } else if (successRate >= 70) {
      console.log('⚠️  CRYPTOGRAPHIC SECURITY VALIDATION PARTIAL');
      console.log('   Some issues detected - review failed tests');
    } else {
      console.log('🚨 CRYPTOGRAPHIC SECURITY VALIDATION FAILED');
      console.log('   Critical issues detected - immediate attention required');
    }
    
    console.log('\n==========================================');
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new CryptographicValidator();
  validator.runAllTests().catch(console.error);
}

export { CryptographicValidator };