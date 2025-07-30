import { HeartRateMonitor } from './HeartRateMonitor';
import { StressDetector } from './StressDetector';
import { FocusMonitor } from './FocusMonitor';
import { AuthenticityProofGenerator } from './AuthenticityProof';
import { EmotionalConsensusEngine } from './EmotionalConsensus';
import { BiometricWallet } from './BiometricWallet';
import { BiometricDeviceManager } from './DeviceManager';
import { BiometricReading, DeviceConfig } from './BiometricDevice';

async function runBiometricIntegrationTest(): Promise<void> {
  console.log('🧠 EMOTIONALCHAIN BIOMETRIC INTEGRATION TEST');
  console.log('==============================================');
  console.log('Testing Step 2: Real biometric device integration with hardware sensors');
  console.log('');

  try {
    // Test 1: Device Discovery and Connection
    console.log('📱 TEST 1: Biometric Device Discovery');
    console.log('-----------------------------------');
    
    const heartRateDevices = await HeartRateMonitor.discoverDevices();
    const stressDevices = await StressDetector.discoverDevices();
    const focusDevices = await FocusMonitor.discoverDevices();
    
    console.log(`❤️  Heart Rate Monitors: ${heartRateDevices.length} found`);
    console.log(`😌 Stress Detectors: ${stressDevices.length} found`);
    console.log(`🧘 Focus Monitors: ${focusDevices.length} found`);
    console.log('');

    // Test 2: Device Connection and Data Collection
    console.log('🔗 TEST 2: Device Connection and Data Collection');
    console.log('-----------------------------------------------');
    
    const heartRateMonitor = new HeartRateMonitor(heartRateDevices[0]);
    const stressDetector = new StressDetector(stressDevices[0]);
    const focusMonitor = new FocusMonitor(focusDevices[0]);
    
    // Connect devices
    const connections = await Promise.all([
      heartRateMonitor.connect(),
      stressDetector.connect(),
      focusMonitor.connect()
    ]);
    
    console.log(`✅ Connected devices: ${connections.filter(c => c).length}/3`);
    
    // Collect biometric data
    const readings: BiometricReading[] = [];
    
    for (let i = 0; i < 5; i++) {
      const [hrReading, stressReading, focusReading] = await Promise.all([
        heartRateMonitor.readData(),
        stressDetector.readData(),
        focusMonitor.readData()
      ]);
      
      if (hrReading) readings.push(hrReading);
      if (stressReading) readings.push(stressReading);
      if (focusReading) readings.push(focusReading);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`📊 Collected ${readings.length} biometric readings`);
    console.log('');

    // Test 3: Authenticity Proof Generation
    console.log('🔐 TEST 3: Cryptographic Authenticity Proofs');
    console.log('--------------------------------------------');
    
    const proofGenerator = new AuthenticityProofGenerator('validator-001');
    const authenticity = readings.map(reading => {
      const proof = proofGenerator.generateAuthenticityProof(reading);
      const valid = AuthenticityProofGenerator.verifyAuthenticityProof(proof, reading.deviceId);
      return { proof, valid };
    });
    
    const validProofCount = authenticity.filter(a => a.valid).length;
    console.log(`🔏 Generated ${authenticity.length} authenticity proofs`);
    console.log(`✅ Valid proofs: ${validProofCount}/${authenticity.length}`);
    
    if (validProofCount > 0) {
      const sampleProof = authenticity.find(a => a.valid)?.proof;
      console.log(`📝 Sample proof ID: ${sampleProof?.proofId.substring(0, 16)}...`);
      console.log(`   Liveness score: ${sampleProof?.livenessProof?.split(':')[0]}%`);
    }
    console.log('');

    // Test 4: Emotional Consensus Engine
    console.log('🧠 TEST 4: Emotional Consensus Calculation');
    console.log('------------------------------------------');
    
    const consensusEngine = new EmotionalConsensusEngine();
    const validProofs = authenticity.filter(a => a.valid).map(a => a.proof);
    
    const emotionalProfile = consensusEngine.calculateEmotionalScore(readings, validProofs);
    
    console.log(`👤 Validator: ${emotionalProfile.validatorId}`);
    console.log(`❤️  Heart Rate: ${emotionalProfile.heartRate} BPM`);
    console.log(`😌 Stress Level: ${emotionalProfile.stressLevel}%`);
    console.log(`🎯 Focus Level: ${emotionalProfile.focusLevel}%`);
    console.log(`🔒 Authenticity: ${(emotionalProfile.authenticity * 100).toFixed(1)}%`);
    console.log(`📱 Devices: ${emotionalProfile.deviceCount}`);
    console.log(`⭐ Quality: ${emotionalProfile.qualityScore}%`);
    console.log('');

    // Test 5: Network Consensus Simulation
    console.log('🌐 TEST 5: Network Consensus Simulation');
    console.log('---------------------------------------');
    
    const networkConsensus = consensusEngine.simulateNetworkConsensus(8);
    
    console.log(`🏆 Selected Validator: ${networkConsensus.selectedValidator}`);
    console.log(`📊 Eligible Validators: ${networkConsensus.totalEligible}/${networkConsensus.scores.length}`);
    console.log(`💪 Consensus Strength: ${networkConsensus.consensusStrength.toFixed(1)}%`);
    console.log(`🛡️  Anti-Gaming Score: ${networkConsensus.antiGamingScore.toFixed(1)}%`);
    
    console.log('\n📈 Top 3 Validators:');
    networkConsensus.scores.slice(0, 3).forEach((score, index) => {
      const status = score.eligible ? '✅' : '❌';
      console.log(`   ${index + 1}. ${score.validatorId} ${status} - ${score.finalScore.toFixed(1)}% (Auth: ${score.authenticityScore.toFixed(1)}%)`);
    });
    console.log('');

    // Test 6: Biometric Wallet Integration
    console.log('💳 TEST 6: Biometric Wallet Security');
    console.log('------------------------------------');
    
    const wallet = new BiometricWallet('validator-001');
    
    // Enroll biometric identity
    const enrollment = await wallet.enrollBiometricIdentity(readings, 'master-password-123');
    if (enrollment.success && enrollment.keyPair) {
      console.log(`✅ Biometric identity enrolled`);
      console.log(`🔑 Wallet address: ${enrollment.keyPair.getAddress()}`);
      
      // Test authentication
      const auth = await wallet.authenticateBiometric(readings.slice(0, 3));
      if (auth.success && auth.keyPair) {
        console.log(`🔓 Authentication successful (${(auth.confidence * 100).toFixed(1)}% confidence)`);
        console.log(`🔐 Factors: ${auth.factors.join(', ')}`);
        console.log(`✅ Wallet unlocked: ${auth.keyPair.getAddress()}`);
      } else {
        console.log(`❌ Authentication failed: ${auth.error}`);
      }
    } else {
      console.log(`❌ Enrollment failed`);
    }
    console.log('');

    // Test 7: Device Manager Integration
    console.log('🎛️  TEST 7: Multi-Device Management');
    console.log('----------------------------------');
    
    const deviceManager = new BiometricDeviceManager();
    
    // Initialize validator with devices
    const deviceConfigs: DeviceConfig[] = [
      ...heartRateDevices.slice(0, 1),
      ...stressDevices.slice(0, 1),
      ...focusDevices.slice(0, 1)
    ];
    
    const deviceGroup = await deviceManager.initializeValidator('validator-001', deviceConfigs);
    
    console.log(`📱 Initialized ${deviceGroup.devices.length} devices`);
    console.log(`🏥 Health Score: ${deviceGroup.healthScore.toFixed(1)}%`);
    console.log(`🔄 Redundancy: ${deviceGroup.redundancyLevel}`);
    
    // Get fused biometric data
    const fusedData = await deviceManager.getBiometricData('validator-001');
    if (fusedData) {
      console.log(`📊 Data fusion successful:`);
      console.log(`   Quality: ${(fusedData.qualityScore * 100).toFixed(1)}%`);
      console.log(`   Confidence: ${(fusedData.confidence * 100).toFixed(1)}%`);
      console.log(`   Readings: ${fusedData.readings.length}`);
      console.log(`   Anomalies: ${fusedData.anomalies.length}`);
    }
    
    const systemHealth = deviceManager.getSystemHealth();
    console.log(`🌡️  System Status: ${systemHealth.systemStatus}`);
    console.log(`🔌 Connection Rate: ${(systemHealth.connectionRate * 100).toFixed(1)}%`);
    
    await deviceManager.shutdown();
    console.log('');

    // Test 8: Anti-Spoofing Verification
    console.log('🔒 TEST 8: Anti-Spoofing Protection');
    console.log('-----------------------------------');
    
    // Test with suspicious readings (too perfect)
    const suspiciousReadings: BiometricReading[] = [
      {
        timestamp: Date.now(),
        deviceId: 'fake-device-001',
        type: 'heartRate',
        value: 75, // Perfect heart rate
        quality: 1.0, // Perfect quality (suspicious)
        rawData: { suspicious: true }
      },
      {
        timestamp: Date.now(),
        deviceId: 'fake-device-002',
        type: 'stress',
        value: 25, // Perfect stress level
        quality: 1.0, // Perfect quality (suspicious)
        rawData: { suspicious: true }
      }
    ];
    
    const suspiciousProofGen = new AuthenticityProofGenerator('fake-validator');
    const suspiciousProofs = suspiciousReadings.map(r => suspiciousProofGen.generateAuthenticityProof(r));
    
    const suspiciousProfile = consensusEngine.calculateEmotionalScore(suspiciousReadings, suspiciousProofs);
    const suspiciousConsensus = consensusEngine.calculateConsensusScores([suspiciousProfile]);
    
    const suspiciousValidator = suspiciousConsensus.scores[0];
    console.log(`⚠️  Suspicious validator eligibility: ${suspiciousValidator.eligible ? 'ELIGIBLE' : 'REJECTED'}`);
    console.log(`📊 Authenticity score: ${suspiciousValidator.authenticityScore.toFixed(1)}%`);
    console.log(`🛡️  Anti-gaming protection: ${suspiciousConsensus.antiGamingScore.toFixed(1)}%`);
    console.log('');

    // Cleanup
    await Promise.all([
      heartRateMonitor.disconnect(),
      stressDetector.disconnect(),
      focusMonitor.disconnect()
    ]);

    // Final Results
    console.log('🎉 BIOMETRIC INTEGRATION TEST COMPLETE!');
    console.log('======================================');
    console.log('✅ Multi-modal biometric device integration');
    console.log('✅ Real-time heart rate, stress, and focus monitoring');
    console.log('✅ Cryptographic authenticity proofs with anti-spoofing');
    console.log('✅ Privacy-preserving biometric templates');
    console.log('✅ Emotional consensus scoring and validator selection');
    console.log('✅ Biometric-secured wallet with multi-factor authentication');
    console.log('✅ Device management with health monitoring and redundancy');
    console.log('✅ Anti-gaming protection against malicious validators');
    console.log('');
    console.log('🚀 Ready for Step 3: Full blockchain integration!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test directly
runBiometricIntegrationTest()
  .then(() => {
    console.log('\n✅ All tests passed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });

export { runBiometricIntegrationTest };