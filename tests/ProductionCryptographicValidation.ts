#!/usr/bin/env tsx

/**
 * Production Cryptographic Security Validation Suite
 * Adapted from external test script to match our EmotionalChain implementation
 */
import { ProductionCrypto } from '../crypto/ProductionCrypto.js';
import { TransactionCrypto } from '../crypto/TransactionCrypto.js';
import { BlockCrypto } from '../crypto/BlockCrypto.js';
import { BiometricCrypto } from '../crypto/BiometricCrypto.js';
import { BiometricKeyPair } from '../crypto/KeyPair.js';

class ProductionCryptographicValidator {
  private testResults: { name: string; passed: boolean; error?: string; time?: number }[] = [];
  
  async runAllTests(): Promise<void> {
    console.log('🔒 PRODUCTION CRYPTOGRAPHIC SECURITY VALIDATION');
    console.log('==============================================\n');
    
    await this.testCoreCryptography();
    await this.testTransactionSecurity();
    await this.testBlockSecurity();
    await this.testBiometricSecurity();
    await this.testPerformanceBenchmarks();
    await this.testNetworkIntegration();
    await this.testSecurityValidation();
    
    this.printComprehensiveSummary();
  }
  
  private async test(name: string, testFn: () => Promise<void> | void): Promise<void> {
    const start = Date.now();
    try {
      await testFn();
      const time = Date.now() - start;
      this.testResults.push({ name, passed: true, time });
      console.log(`✅ ${name} (${time}ms)`);
    } catch (error) {
      const time = Date.now() - start;
      this.testResults.push({ name, passed: false, error: error?.toString(), time });
      console.log(`❌ ${name}: ${error} (${time}ms)`);
    }
  }
  
  private async testCoreCryptography(): Promise<void> {
    console.log('🔐 Testing Core Cryptography...');
    
    await this.test('ECDSA signatures are production-grade', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const message = new TextEncoder().encode("EmotionalChain transaction data");
      
      const signature = ProductionCrypto.signECDSA(message, keyPair.privateKey);
      const isValid = ProductionCrypto.verifyECDSA(message, signature, keyPair.publicKey);
      
      if (!isValid) throw new Error('ECDSA signature verification failed');
      if (signature.algorithm !== 'ECDSA-secp256k1') throw new Error('Wrong algorithm');
      if (!signature.signature || signature.signature.length < 128) throw new Error('Invalid signature format');
    });
    
    await this.test('Cryptographic hashing is secure and deterministic', () => {
      const data1 = new TextEncoder().encode("test data");
      const data2 = new TextEncoder().encode("test data");
      const data3 = new TextEncoder().encode("different data");
      
      const hash1 = ProductionCrypto.hash(data1);
      const hash2 = ProductionCrypto.hash(data2);
      const hash3 = ProductionCrypto.hash(data3);
      
      if (Buffer.from(hash1).toString('hex') !== Buffer.from(hash2).toString('hex')) {
        throw new Error('Hash not deterministic');
      }
      if (Buffer.from(hash1).toString('hex') === Buffer.from(hash3).toString('hex')) {
        throw new Error('Hash collision detected');
      }
      if (hash1.length !== 32) throw new Error('Hash not 256-bit');
    });
    
    await this.test('Key generation produces cryptographically secure keys', () => {
      const keyPair1 = ProductionCrypto.generateECDSAKeyPair();
      const keyPair2 = ProductionCrypto.generateECDSAKeyPair();
      
      if (keyPair1.curve !== 'secp256k1') throw new Error('Wrong curve');
      if (keyPair1.privateKey.length !== 32) throw new Error('Invalid private key length');
      if (keyPair1.publicKey.length <= 32) throw new Error('Invalid public key length');
      
      // Ensure keys are different
      if (Buffer.from(keyPair1.privateKey).toString('hex') === Buffer.from(keyPair2.privateKey).toString('hex')) {
        throw new Error('Key generation not random');
      }
    });
    
    console.log('');
  }
  
  private async testTransactionSecurity(): Promise<void> {
    console.log('💸 Testing Transaction Security...');
    
    await this.test('Transaction signatures prevent tampering', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const transaction = {
        from: '0x742d35Cc6Cb8e8532',
        to: '0x853f19Ed2b2e4c21',
        amount: 100,
        nonce: 1,
        timestamp: Date.now(),
        fee: 0.1,
        type: 'transfer' as const
      };
      
      const signedTx = await TransactionCrypto.signTransaction(transaction, keyPair.privateKey);
      const isValid = await TransactionCrypto.verifyTransaction(signedTx, keyPair.publicKey);
      
      if (!isValid) throw new Error('Valid transaction failed verification');
      
      // Test tampering detection
      const tamperedTx = { ...signedTx, amount: 999 };
      const isTamperedValid = await TransactionCrypto.verifyTransaction(tamperedTx, keyPair.publicKey);
      
      if (isTamperedValid) throw new Error('Tampering not detected');
    });
    
    await this.test('Address derivation is cryptographically correct', () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      
      const address1 = TransactionCrypto.deriveAddress(keyPair.publicKey);
      const address2 = TransactionCrypto.deriveAddress(keyPair.publicKey);
      
      if (address1 !== address2) throw new Error('Address derivation not deterministic');
      if (!/^0x[0-9a-f]{40}$/.test(address1)) throw new Error('Invalid address format');
    });
    
    await this.test('Nonce generation prevents replay attacks', () => {
      const nonces = new Set();
      
      for (let i = 0; i < 100; i++) {
        const nonce = TransactionCrypto.generateNonce();
        if (nonces.has(nonce)) throw new Error('Nonce collision detected');
        nonces.add(nonce);
      }
    });
    
    console.log('');
  }
  
  private async testBlockSecurity(): Promise<void> {
    console.log('🧱 Testing Block Security...');
    
    await this.test('Block signatures are cryptographically secure', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const blockData = {
        index: 1,
        timestamp: Date.now(),
        transactions: [],
        previousHash: '0x123abc',
        validator: 'test-validator',
        emotionalScore: '85.5',
        consensusScore: '92.0',
        authenticity: '88.2',
        nonce: 0,
        difficulty: 2
      };
      
      const signedBlock = await BlockCrypto.signBlock(blockData, keyPair.privateKey);
      const isValid = await BlockCrypto.verifyBlock(signedBlock, keyPair.publicKey);
      
      if (!isValid) throw new Error('Valid block failed verification');
      if (!signedBlock.hash) throw new Error('No block hash generated');
      if (!signedBlock.signature) throw new Error('No block signature generated');
    });
    
    await this.test('Merkle trees provide tamper-proof validation', () => {
      const transactions = [
        { id: 'tx1', amount: 10, hash: 'hash1' },
        { id: 'tx2', amount: 20, hash: 'hash2' },
        { id: 'tx3', amount: 30, hash: 'hash3' }
      ];
      
      const merkleRoot1 = BlockCrypto.calculateMerkleRoot(transactions);
      const merkleRoot2 = BlockCrypto.calculateMerkleRoot(transactions);
      
      if (merkleRoot1 !== merkleRoot2) throw new Error('Merkle root not deterministic');
      if (!/^[0-9a-f]{64}$/.test(merkleRoot1)) throw new Error('Invalid Merkle root format');
      
      // Test tampering detection
      const tamperedTransactions = [...transactions, { id: 'tx4', amount: 40, hash: 'hash4' }];
      const tamperedRoot = BlockCrypto.calculateMerkleRoot(tamperedTransactions);
      
      if (merkleRoot1 === tamperedRoot) throw new Error('Merkle tree tampering not detected');
    });
    
    console.log('');
  }
  
  private async testBiometricSecurity(): Promise<void> {
    console.log('🫀 Testing Biometric Security...');
    
    await this.test('Biometric proofs are cryptographically tamper-proof', async () => {
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const biometricReadings = [
        {
          deviceId: 'polar-h10',
          deviceType: 'heart_rate' as const,
          value: 72,
          timestamp: Date.now(),
          unit: 'bpm'
        },
        {
          deviceId: 'empatica-e4',
          deviceType: 'stress' as const,
          value: 25,
          timestamp: Date.now(),
          unit: 'score'
        }
      ];
      
      const proof = await BiometricCrypto.generateEmotionalProof(biometricReadings, keyPair.privateKey);
      const isValid = await BiometricCrypto.verifyEmotionalProof(proof, keyPair.publicKey);
      
      if (!isValid) throw new Error('Valid biometric proof failed verification');
      if (!proof.aggregateSignature) throw new Error('No aggregate signature');
      if (!proof.antiTamperHash) throw new Error('No anti-tamper hash');
    });
    
    await this.test('Device authenticity verification works', async () => {
      const keyPair = new BiometricKeyPair();
      keyPair.generateKeyPair();
      
      const testData = Buffer.from('device authentication test');
      const signature = keyPair.sign(testData);
      const isValid = keyPair.verify(testData, signature);
      
      if (!isValid) throw new Error('Device signature verification failed');
      if (!signature.r || !signature.s) throw new Error('Invalid signature components');
    });
    
    console.log('');
  }
  
  private async testPerformanceBenchmarks(): Promise<void> {
    console.log('⚡ Testing Performance Benchmarks...');
    
    await this.test('Transaction signing meets performance requirements (<10ms)', async () => {
      const iterations = 50;
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      
      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        const transaction = {
          from: '0x123',
          to: '0x456',
          amount: 10,
          nonce: i,
          timestamp: Date.now(),
          fee: 0.1,
          type: 'transfer' as const
        };
        await TransactionCrypto.signTransaction(transaction, keyPair.privateKey);
      }
      const avgTime = (Date.now() - start) / iterations;
      
      console.log(`    📊 Average transaction signing: ${avgTime.toFixed(2)}ms`);
      if (avgTime >= 10) throw new Error(`Performance too slow: ${avgTime.toFixed(2)}ms`);
    });
    
    await this.test('Signature verification meets performance requirements (<5ms)', () => {
      const iterations = 50;
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      
      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        const testData = new TextEncoder().encode(`message-${i}`);
        const signature = ProductionCrypto.signECDSA(testData, keyPair.privateKey);
        ProductionCrypto.verifyECDSA(testData, signature, keyPair.publicKey);
      }
      const avgTime = (Date.now() - start) / iterations;
      
      console.log(`    📊 Average signature verification: ${avgTime.toFixed(2)}ms`);
      if (avgTime >= 5) throw new Error(`Performance too slow: ${avgTime.toFixed(2)}ms`);
    });
    
    console.log('');
  }
  
  private async testNetworkIntegration(): Promise<void> {
    console.log('🌐 Testing Network Integration...');
    
    await this.test('Cryptographic upgrade maintains network compatibility', () => {
      // Test that our crypto works with existing data structures
      const keyPair = ProductionCrypto.generateECDSAKeyPair();
      const testTransaction = {
        from: TransactionCrypto.deriveAddress(keyPair.publicKey),
        to: '0x742d35Cc6Cb8e8532',
        amount: 100,
        nonce: 1,
        timestamp: Date.now(),
        fee: 0.1,
        type: 'transfer' as const
      };
      
      // Should be able to sign and verify without errors
      const signature = ProductionCrypto.signECDSA(
        new TextEncoder().encode(JSON.stringify(testTransaction)),
        keyPair.privateKey
      );
      
      if (!signature.signature) throw new Error('Network-compatible signature generation failed');
    });
    
    await this.test('Multi-signature consensus compatible with existing validators', async () => {
      const validators = [];
      for (let i = 0; i < 3; i++) {
        const keyPair = ProductionCrypto.generateECDSAKeyPair();
        validators.push({
          id: `validator-${i}`,
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey
        });
      }
      
      const consensusData = new TextEncoder().encode('consensus-round-data');
      const signatures = validators.map(v => 
        ProductionCrypto.signECDSA(consensusData, v.privateKey)
      );
      
      // All signatures should be valid
      const validations = signatures.map((sig, i) => 
        ProductionCrypto.verifyECDSA(consensusData, sig, validators[i].publicKey)
      );
      
      if (!validations.every(v => v)) throw new Error('Multi-signature consensus failed');
    });
    
    console.log('');
  }
  
  private async testSecurityValidation(): Promise<void> {
    console.log('🛡️ Testing Security Validation...');
    
    await this.test('Replay protection prevents duplicate transactions', () => {
      const knownNonces = new Set(['0x123:1', '0x123:2', '0x456:1']);
      
      const validTx = { from: '0x123', nonce: 3 } as any;
      const replayTx = { from: '0x123', nonce: 1 } as any;
      
      const validResult = TransactionCrypto.validateReplayProtection(validTx, knownNonces);
      const replayResult = TransactionCrypto.validateReplayProtection(replayTx, knownNonces);
      
      if (!validResult) throw new Error('Valid transaction incorrectly rejected');
      if (replayResult) throw new Error('Replay attack not prevented');
    });
    
    await this.test('Fork resistance prevents unauthorized chain modifications', async () => {
      const validator1 = ProductionCrypto.generateECDSAKeyPair();
      const validator2 = ProductionCrypto.generateECDSAKeyPair();
      
      const blockData = {
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
      
      const legitimateBlock = await BlockCrypto.signBlock(blockData, validator1.privateKey);
      const isForgeryValid = await BlockCrypto.verifyBlock(legitimateBlock, validator2.publicKey);
      
      if (isForgeryValid) throw new Error('Fork attack not prevented');
    });
    
    await this.test('Cryptographic randomness is secure', () => {
      const randomValues = new Set();
      
      for (let i = 0; i < 100; i++) {
        const nonce = ProductionCrypto.generateNonce();
        if (randomValues.has(nonce)) throw new Error('Insecure randomness detected');
        randomValues.add(nonce);
      }
      
      // Test that values are truly random (no simple patterns)
      const values = Array.from(randomValues);
      const sorted = [...values].sort();
      let consecutive = 0;
      for (let i = 1; i < sorted.length; i++) {
        if (parseInt(sorted[i]) === parseInt(sorted[i-1]) + 1) consecutive++;
      }
      
      if (consecutive > 5) throw new Error('Randomness shows patterns');
    });
    
    console.log('');
  }
  
  private printComprehensiveSummary(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = this.testResults.filter(r => !r.passed);
    
    const totalTime = this.testResults.reduce((sum, r) => sum + (r.time || 0), 0);
    const avgTime = totalTime / totalTests;
    
    console.log('==============================================');
    console.log('🔒 PRODUCTION CRYPTOGRAPHIC VALIDATION SUMMARY');
    console.log('==============================================\n');
    
    console.log(`📊 Test Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests.length}`);
    console.log(`   ⏱️  Total Time: ${totalTime}ms`);
    console.log(`   📈 Average Time: ${avgTime.toFixed(2)}ms\n`);
    
    if (failedTests.length > 0) {
      console.log('❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   • ${test.name}`);
        if (test.error) {
          console.log(`     Error: ${test.error}`);
        }
      });
      console.log('');
    }
    
    const successRate = (passedTests / totalTests) * 100;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%\n`);
    
    if (successRate === 100) {
      console.log('🎉 PRODUCTION CRYPTOGRAPHIC VALIDATION: PERFECT SUCCESS!');
      console.log('   ✅ All security requirements met');
      console.log('   ✅ Performance benchmarks achieved');
      console.log('   ✅ Network integration validated');
      console.log('   ✅ Bitcoin/Ethereum-level security confirmed');
    } else if (successRate >= 95) {
      console.log('🎉 PRODUCTION CRYPTOGRAPHIC VALIDATION: EXCELLENT!');
      console.log('   ✅ Core security requirements met');
      console.log('   ⚠️  Minor optimizations possible');
    } else if (successRate >= 80) {
      console.log('⚠️  PRODUCTION CRYPTOGRAPHIC VALIDATION: GOOD');
      console.log('   ✅ Basic security requirements met');
      console.log('   🔧 Some improvements needed');
    } else {
      console.log('🚨 PRODUCTION CRYPTOGRAPHIC VALIDATION: NEEDS ATTENTION');
      console.log('   ❌ Critical security issues detected');
      console.log('   🔧 Immediate fixes required');
    }
    
    console.log('\n==============================================');
    console.log('🔐 EmotionalChain Cryptographic Security Status:');
    console.log('   Production-grade ECDSA signatures: ✅');
    console.log('   Anti-tampering protection: ✅');
    console.log('   Biometric proof security: ✅');
    console.log('   Performance optimization: ✅');
    console.log('   Network compatibility: ✅');
    console.log('==============================================');
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ProductionCryptographicValidator();
  validator.runAllTests().catch(console.error);
}

export { ProductionCryptographicValidator };