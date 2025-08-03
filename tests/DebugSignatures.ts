#!/usr/bin/env tsx

/**
 * Debug signature verification issues
 */
import { ProductionCrypto } from '../crypto/ProductionCrypto.js';
import { BiometricCrypto } from '../crypto/BiometricCrypto.js';
import { BiometricKeyPair } from '../crypto/KeyPair.js';

async function debugSignatures() {
  console.log('🔍 DEBUGGING SIGNATURE VERIFICATION ISSUES\n');
  
  // Test 1: Check ProductionCrypto signature format
  console.log('📋 Testing ProductionCrypto signature format...');
  const keyPair = ProductionCrypto.generateECDSAKeyPair();
  const testData = new TextEncoder().encode('test message');
  const signature = ProductionCrypto.signECDSA(testData, keyPair.privateKey);
  
  console.log('Signature object:', {
    algorithm: signature.algorithm,
    hasSignature: !!signature.signature,
    signatureLength: signature.signature?.length,
    hasR: !!signature.r,
    rLength: signature.r?.length,
    hasS: !!signature.s,
    sLength: signature.s?.length,
    recovery: signature.recovery
  });
  
  // Test verification with original signature object
  const isValid1 = ProductionCrypto.verifyECDSA(testData, signature, keyPair.publicKey);
  console.log('Original signature verification:', isValid1);
  
  // Test 2: Check BiometricCrypto signature generation
  console.log('\n🫀 Testing BiometricCrypto signature generation...');
  const readings = [
    {
      deviceId: 'hr-001',
      deviceType: 'heart_rate' as const,
      value: 75,
      timestamp: Date.now(),
      unit: 'bpm'
    }
  ];
  
  try {
    const proof = await BiometricCrypto.generateEmotionalProof(readings, keyPair.privateKey);
    console.log('Generated proof signatures:', {
      aggregateSignature: proof.aggregateSignature?.substring(0, 20) + '...',
      timestampSignature: proof.timestampSignature?.substring(0, 20) + '...',
      aggregateLength: proof.aggregateSignature?.length,
      timestampLength: proof.timestampSignature?.length
    });
    
    const isValidProof = await BiometricCrypto.verifyEmotionalProof(proof, keyPair.publicKey);
    console.log('Biometric proof verification:', isValidProof);
  } catch (error) {
    console.log('Biometric proof error:', error);
  }
  
  // Test 3: Check KeyPair signature format
  console.log('\n🔑 Testing KeyPair signature format...');
  const biometricKeyPair = new BiometricKeyPair();
  biometricKeyPair.generateKeyPair();
  
  const testBuffer = Buffer.from('test message');
  const keyPairSignature = biometricKeyPair.sign(testBuffer);
  
  console.log('KeyPair signature object:', {
    hasR: !!keyPairSignature.r,
    rLength: keyPairSignature.r?.length,
    hasS: !!keyPairSignature.s,
    sLength: keyPairSignature.s?.length,
    recoveryParam: keyPairSignature.recoveryParam
  });
  
  const isValidKeyPair = biometricKeyPair.verify(testBuffer, keyPairSignature);
  console.log('KeyPair signature verification:', isValidKeyPair);
  
  // Test 4: Check if signature format matches expected format
  console.log('\n🔍 Checking signature format compatibility...');
  if (signature.signature && signature.signature.length >= 128) {
    const extractedR = signature.signature.substring(0, 64);
    const extractedS = signature.signature.substring(64, 128);
    
    console.log('Extracted from signature string:', {
      r: extractedR.substring(0, 10) + '...',
      s: extractedS.substring(0, 10) + '...',
      rMatches: extractedR === signature.r,
      sMatches: extractedS === signature.s
    });
  }
}

// Run debug if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugSignatures().catch(console.error);
}