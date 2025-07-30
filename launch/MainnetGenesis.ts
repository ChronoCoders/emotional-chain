/**
 * EmotionalChain Mainnet Genesis Configuration
 * Production genesis block with founding validators and tokenomics
 */

import crypto from 'crypto';

export interface GenesisValidator {
  id: string;
  address: string;
  publicKey: string;
  stake: number;
  region: 'north_america' | 'europe' | 'asia_pacific';
  biometricDevices: string[];
  emotionalScore: number;
  reputation: number;
}

export interface GenesisConfig {
  chainId: number;
  networkName: string;
  genesisTime: string;
  blockTime: number;
  consensusType: string;
  totalSupply: number;
  tokenSymbol: string;
  tokenName: string;
  validators: GenesisValidator[];
  tokenomics: {
    stakingPool: number;
    wellnessPool: number;
    ecosystemPool: number;
    teamAllocation: number;
  };
  networkParameters: {
    emotionalThreshold: number;
    minStake: number;
    maxValidators: number;
    byzantineTolerance: number;
    blockConfirmations: number;
  };
}

export const FOUNDING_VALIDATORS: GenesisValidator[] = [
  // North America Region (7 validators)
  {
    id: 'StellarNode',
    address: '0x467E9D57467E9D574CE47CE47CE47CE47CE47CE4',
    publicKey: '0x04a7b1e5c4d8f3a2b9e6c7d8f3a2b9e6c7d8f3a2b9e6c7d8f3a2b9e6c7d8f3a2b9',
    stake: 100000,
    region: 'north_america',
    biometricDevices: ['polar_h10', 'garmin_watch', 'muse_headband'],
    emotionalScore: 92.5,
    reputation: 100
  },
  {
    id: 'NebulaForge',
    address: '0x568F0E68568F0E685D58CE58CE58CE58CE58CE58C',
    publicKey: '0x04b8c2f6d5e9g4b3c0f7d8e9g4b3c0f7d8e9g4b3c0f7d8e9g4b3c0f7d8e9g4b3c0',
    stake: 100000,
    region: 'north_america',
    biometricDevices: ['fitbit_sense', 'empatica_e4', 'polar_h10'],
    emotionalScore: 89.3,
    reputation: 100
  },
  {
    id: 'QuantumReach',
    address: '0x669G1F79669G1F796E69DF69DF69DF69DF69DF69D',
    publicKey: '0x04c9d3g7e6f0h5c4d1g8e9f0h5c4d1g8e9f0h5c4d1g8e9f0h5c4d1g8e9f0h5c4d1',
    stake: 100000,
    region: 'north_america',
    biometricDevices: ['apple_watch', 'oura_ring', 'muse_headband'],
    emotionalScore: 90.8,
    reputation: 100
  },
  {
    id: 'OrionPulse',
    address: '0x770H2G80770H2G807F70EF70EF70EF70EF70EF70E',
    publicKey: '0x04d0e4h8f7g1i6d5e2h9f0g1i6d5e2h9f0g1i6d5e2h9f0g1i6d5e2h9f0g1i6d5e2',
    stake: 100000,
    region: 'north_america',
    biometricDevices: ['garmin_vivosmart', 'polar_verity', 'empatica_e4'],
    emotionalScore: 88.7,
    reputation: 100
  },
  {
    id: 'DarkMatterLabs',
    address: '0x881I3H91881I3H918G81FG81FG81FG81FG81FG81F',
    publicKey: '0x04e1f5i9g8h2j7e6f3i0g8h2j7e6f3i0g8h2j7e6f3i0g8h2j7e6f3i0g8h2j7e6f3',
    stake: 100000,
    region: 'north_america',
    biometricDevices: ['whoop_strap', 'hexoskin', 'muse_headband'],
    emotionalScore: 91.2,
    reputation: 100
  },
  {
    id: 'GravityCore',
    address: '0x992J4I02992J4I029H92GH92GH92GH92GH92GH92G',
    publicKey: '0x04f2g6j0h9i3k8f7g4j1h9i3k8f7g4j1h9i3k8f7g4j1h9i3k8f7g4j1h9i3k8f7g4',
    stake: 100000,
    region: 'north_america',
    biometricDevices: ['bioharness', 'polar_h10', 'emotiv_epoc'],
    emotionalScore: 93.1,
    reputation: 100
  },
  {
    id: 'AstroSentinel',
    address: '0xAA3K5J13AA3K5J13AI03HI03HI03HI03HI03HI03H',
    publicKey: '0x04g3h7k1i0j4l9g8h5k2i0j4l9g8h5k2i0j4l9g8h5k2i0j4l9g8h5k2i0j4l9g8h5',
    stake: 100000,
    region: 'north_america',
    biometricDevices: ['samsung_galaxy_watch', 'zephyr_biomodule', 'muse_s'],
    emotionalScore: 87.9,
    reputation: 100
  },

  // Europe Region (7 validators)
  {
    id: 'ByteGuardians',
    address: '0xBB4L6K24BB4L6K24BJ14IJ14IJ14IJ14IJ14IJ14I',
    publicKey: '0x04h4i8l2j1k5m0h9i6l3j1k5m0h9i6l3j1k5m0h9i6l3j1k5m0h9i6l3j1k5m0h9i6',
    stake: 100000,
    region: 'europe',
    biometricDevices: ['garmin_fenix', 'polar_oh1', 'neurosky_mindwave'],
    emotionalScore: 89.5,
    reputation: 100
  },
  {
    id: 'ZeroLagOps',
    address: '0xCC5M7L35CC5M7L35CK25JK25JK25JK25JK25JK25J',
    publicKey: '0x04i5j9m3k2l6n1i0j7m4k2l6n1i0j7m4k2l6n1i0j7m4k2l6n1i0j7m4k2l6n1i0j7',
    stake: 100000,
    region: 'europe',
    biometricDevices: ['fitbit_charge', 'empatica_embrace', 'muse_headband'],
    emotionalScore: 90.3,
    reputation: 100
  },
  {
    id: 'ChainFlux',
    address: '0xDD6N8M46DD6N8M46DL36KL36KL36KL36KL36KL36K',
    publicKey: '0x04j6k0n4l3m7o2j1k8n5l3m7o2j1k8n5l3m7o2j1k8n5l3m7o2j1k8n5l3m7o2j1k8',
    stake: 100000,
    region: 'europe',
    biometricDevices: ['polar_vantage', 'biovotion_vsm', 'emotiv_insight'],
    emotionalScore: 88.1,
    reputation: 100
  },
  {
    id: 'BlockNerve',
    address: '0xEE7O9N57EE7O9N57EM47LM47LM47LM47LM47LM47L',
    publicKey: '0x04k7l1o5m4n8p3k2l9o6m4n8p3k2l9o6m4n8p3k2l9o6m4n8p3k2l9o6m4n8p3k2l9',
    stake: 100000,
    region: 'europe',
    biometricDevices: ['suunto_9', 'hexoskin_smart', 'muse_2'],
    emotionalScore: 91.7,
    reputation: 100
  },
  {
    id: 'ValidatorX',
    address: '0xFF8P0O68FF8P0O68FN58MN58MN58MN58MN58MN58M',
    publicKey: '0x04l8m2p6n5o9q4l3m0p7n5o9q4l3m0p7n5o9q4l3m0p7n5o9q4l3m0p7n5o9q4l3m0',
    stake: 100000,
    region: 'europe',
    biometricDevices: ['garmin_venu', 'polar_ignite', 'neurosky_eeg'],
    emotionalScore: 86.4,
    reputation: 100
  },
  {
    id: 'NovaSync',
    address: '0x009Q1P79009Q1P79GO69NO69NO69NO69NO69NO69N',
    publicKey: '0x04m9n3q7o6p0r5m4n1q8o6p0r5m4n1q8o6p0r5m4n1q8o6p0r5m4n1q8o6p0r5m4n1',
    stake: 100000,
    region: 'europe',
    biometricDevices: ['amazfit_gts', 'empatica_e4', 'emotiv_epoc_x'],
    emotionalScore: 89.9,
    reputation: 100
  },
  {
    id: 'IronNode',
    address: '0x110R2Q80110R2Q80HP70OP70OP70OP70OP70OP70O',
    publicKey: '0x04n0o4r8p7q1s6n5o2r9p7q1s6n5o2r9p7q1s6n5o2r9p7q1s6n5o2r9p7q1s6n5o2',
    stake: 100000,
    region: 'europe',
    biometricDevices: ['withings_scanwatch', 'polar_h9', 'muse_headband'],
    emotionalScore: 92.3,
    reputation: 100
  },

  // Asia-Pacific Region (7 validators)
  {
    id: 'SentinelTrust',
    address: '0x221S3R91221S3R91IQ81PQ81PQ81PQ81PQ81PQ81P',
    publicKey: '0x04o1p5s9q8r2t7o6p3s0q8r2t7o6p3s0q8r2t7o6p3s0q8r2t7o6p3s0q8r2t7o6p3',
    stake: 100000,
    region: 'asia_pacific',
    biometricDevices: ['xiaomi_mi_band', 'polar_verity_sense', 'neurosky_mindset'],
    emotionalScore: 88.6,
    reputation: 100
  },
  {
    id: 'VaultProof',
    address: '0x332T4S02332T4S02JR92QR92QR92QR92QR92QR92Q',
    publicKey: '0x04p2q6t0r9s3u8p7q4t1r9s3u8p7q4t1r9s3u8p7q4t1r9s3u8p7q4t1r9s3u8p7q4',
    stake: 100000,
    region: 'asia_pacific',
    biometricDevices: ['huawei_watch_gt', 'empatica_embrace_plus', 'emotiv_insight'],
    emotionalScore: 90.1,
    reputation: 100
  },
  {
    id: 'SecureMesh',
    address: '0x443U5T13443U5T13KS03RS03RS03RS03RS03RS03R',
    publicKey: '0x04q3r7u1s0t4v9q8r5u2s0t4v9q8r5u2s0t4v9q8r5u2s0t4v9q8r5u2s0t4v9q8r5',
    stake: 100000,
    region: 'asia_pacific',
    biometricDevices: ['samsung_galaxy_active', 'polar_oh1_plus', 'muse_headband'],
    emotionalScore: 87.2,
    reputation: 100
  },
  {
    id: 'WatchtowerOne',
    address: '0x554V6U24554V6U24LT14ST14ST14ST14ST14ST14S',
    publicKey: '0x04r4s8v2t1u5w0r9s6v3t1u5w0r9s6v3t1u5w0r9s6v3t1u5w0r9s6v3t1u5w0r9s6',
    stake: 100000,
    region: 'asia_pacific',
    biometricDevices: ['oppo_watch', 'bioharness_3', 'neurosky_eeg_headset'],
    emotionalScore: 91.4,
    reputation: 100
  },
  {
    id: 'AetherRunes',
    address: '0x665W7V35665W7V35MU25TU25TU25TU25TU25TU25T',
    publicKey: '0x04s5t9w3u2v6x1s0t7w4u2v6x1s0t7w4u2v6x1s0t7w4u2v6x1s0t7w4u2v6x1s0t7',
    stake: 100000,
    region: 'asia_pacific',
    biometricDevices: ['fossil_gen_5', 'empatica_e4_wristband', 'emotiv_epoc_flex'],
    emotionalScore: 89.8,
    reputation: 100
  },
  {
    id: 'ChronoKeep',
    address: '0x776X8W46776X8W46NV36UV36UV36UV36UV36UV36U',
    publicKey: '0x04t6u0x4v3w7y2t1u8x5v3w7y2t1u8x5v3w7y2t1u8x5v3w7y2t1u8x5v3w7y2t1u8',
    stake: 100000,
    region: 'asia_pacific',
    biometricDevices: ['ticwatch_pro', 'polar_vantage_v2', 'muse_s_headband'],
    emotionalScore: 92.9,
    reputation: 100
  },
  {
    id: 'SolForge',
    address: '0x887Y9X57887Y9X57OW47VW47VW47VW47VW47VW47V',
    publicKey: '0x04u7v1y5w4x8z3u2v9y6w4x8z3u2v9y6w4x8z3u2v9y6w4x8z3u2v9y6w4x8z3u2v9',
    stake: 100000,
    region: 'asia_pacific',
    biometricDevices: ['realme_watch', 'hexoskin_smart_shirt', 'emotiv_insight_5'],
    emotionalScore: 88.5,
    reputation: 100
  }
];

export const MAINNET_GENESIS_CONFIG: GenesisConfig = {
  chainId: 2025,
  networkName: 'EmotionalChain Mainnet',
  genesisTime: '2025-01-01T00:00:00.000Z',
  blockTime: 30,
  consensusType: 'ProofOfEmotion',
  totalSupply: 1000000000, // 1 billion EMO
  tokenSymbol: 'EMO',
  tokenName: 'EmotionalChain Token',
  validators: FOUNDING_VALIDATORS,
  tokenomics: {
    stakingPool: 400000000,    // 400M EMO (40%)
    wellnessPool: 200000000,   // 200M EMO (20%)
    ecosystemPool: 250000000,  // 250M EMO (25%)
    teamAllocation: 150000000  // 150M EMO (15%)
  },
  networkParameters: {
    emotionalThreshold: 75.0,
    minStake: 50000,
    maxValidators: 101,
    byzantineTolerance: 0.33,
    blockConfirmations: 12
  }
};

export class MainnetGenesis {
  public static createGenesisBlock(): {
    index: number;
    timestamp: number;
    previousHash: string;
    transactions: any[];
    hash: string;
    nonce: number;
    validators: GenesisValidator[];
    totalSupply: number;
    genesisConfig: GenesisConfig;
  } {
    const genesisTimestamp = new Date('2025-01-01T00:00:00.000Z').getTime();
    
    // Create genesis transactions for token distribution
    const genesisTransactions = [
      // Staking pool allocation
      {
        from: '0x0000000000000000000000000000000000000000',
        to: '0xSTAKING_POOL_CONTRACT_ADDRESS_HERE',
        amount: MAINNET_GENESIS_CONFIG.tokenomics.stakingPool,
        type: 'genesis_allocation',
        purpose: 'staking_pool'
      },
      // Wellness pool allocation
      {
        from: '0x0000000000000000000000000000000000000000',
        to: '0xWELLNESS_POOL_CONTRACT_ADDRESS_HERE',
        amount: MAINNET_GENESIS_CONFIG.tokenomics.wellnessPool,
        type: 'genesis_allocation',
        purpose: 'wellness_pool'
      },
      // Ecosystem pool allocation
      {
        from: '0x0000000000000000000000000000000000000000',
        to: '0xECOSYSTEM_POOL_CONTRACT_ADDRESS_HERE',
        amount: MAINNET_GENESIS_CONFIG.tokenomics.ecosystemPool,
        type: 'genesis_allocation',
        purpose: 'ecosystem_pool'
      },
      // Validator initial stakes
      ...FOUNDING_VALIDATORS.map(validator => ({
        from: '0x0000000000000000000000000000000000000000',
        to: validator.address,
        amount: validator.stake,
        type: 'genesis_stake',
        purpose: 'validator_stake',
        validatorId: validator.id
      }))
    ];

    // Calculate genesis block hash
    const genesisBlockData = {
      index: 0,
      timestamp: genesisTimestamp,
      previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      transactions: genesisTransactions,
      nonce: 0,
      config: MAINNET_GENESIS_CONFIG
    };

    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(genesisBlockData))
      .digest('hex');

    console.log(`🌟 Genesis block created for EmotionalChain Mainnet`);
    console.log(`📅 Genesis time: ${new Date(genesisTimestamp).toISOString()}`);
    console.log(`🔗 Chain ID: ${MAINNET_GENESIS_CONFIG.chainId}`);
    console.log(`👥 Founding validators: ${FOUNDING_VALIDATORS.length}`);
    console.log(`💰 Total supply: ${MAINNET_GENESIS_CONFIG.totalSupply.toLocaleString()} EMO`);
    console.log(`🏆 Genesis hash: 0x${hash}`);

    return {
      index: 0,
      timestamp: genesisTimestamp,
      previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      transactions: genesisTransactions,
      hash: `0x${hash}`,
      nonce: 0,
      validators: FOUNDING_VALIDATORS,
      totalSupply: MAINNET_GENESIS_CONFIG.totalSupply,
      genesisConfig: MAINNET_GENESIS_CONFIG
    };
  }

  public static validateGenesisConfig(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate validator count
    if (FOUNDING_VALIDATORS.length !== 21) {
      errors.push(`Expected 21 founding validators, got ${FOUNDING_VALIDATORS.length}`);
    }

    // Validate regional distribution
    const regions = FOUNDING_VALIDATORS.reduce((acc, v) => {
      acc[v.region] = (acc[v.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (regions.north_america !== 7) {
      errors.push(`Expected 7 North America validators, got ${regions.north_america || 0}`);
    }
    if (regions.europe !== 7) {
      errors.push(`Expected 7 Europe validators, got ${regions.europe || 0}`);
    }
    if (regions.asia_pacific !== 7) {
      errors.push(`Expected 7 Asia-Pacific validators, got ${regions.asia_pacific || 0}`);
    }

    // Validate total stake allocation
    const totalValidatorStake = FOUNDING_VALIDATORS.reduce((sum, v) => sum + v.stake, 0);
    const expectedValidatorStake = 21 * 100000; // 2.1M EMO
    if (totalValidatorStake !== expectedValidatorStake) {
      errors.push(`Total validator stake mismatch: expected ${expectedValidatorStake}, got ${totalValidatorStake}`);
    }

    // Validate tokenomics distribution
    const totalTokenomics = Object.values(MAINNET_GENESIS_CONFIG.tokenomics).reduce((sum, val) => sum + val, 0);
    if (totalTokenomics !== MAINNET_GENESIS_CONFIG.totalSupply) {
      errors.push(`Tokenomics distribution error: ${totalTokenomics} !== ${MAINNET_GENESIS_CONFIG.totalSupply}`);
    }

    // Validate emotional scores
    const lowScoreValidators = FOUNDING_VALIDATORS.filter(v => v.emotionalScore < 85);
    if (lowScoreValidators.length > 0) {
      warnings.push(`${lowScoreValidators.length} validators have emotional scores below 85%`);
    }

    // Validate biometric device coverage
    const deviceCoverage = FOUNDING_VALIDATORS.every(v => 
      v.biometricDevices.length >= 2 && 
      v.biometricDevices.some(device => device.includes('polar') || device.includes('garmin'))
    );
    if (!deviceCoverage) {
      warnings.push('Some validators may have insufficient biometric device coverage');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  public static getNetworkSummary(): {
    chainId: number;
    networkName: string;
    totalSupply: string;
    foundingValidators: number;
    regionalDistribution: Record<string, number>;
    averageEmotionalScore: number;
    totalStakeAllocated: number;
    launchDate: string;
  } {
    const regions = FOUNDING_VALIDATORS.reduce((acc, v) => {
      acc[v.region] = (acc[v.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageEmotionalScore = FOUNDING_VALIDATORS.reduce((sum, v) => sum + v.emotionalScore, 0) / FOUNDING_VALIDATORS.length;
    const totalStakeAllocated = FOUNDING_VALIDATORS.reduce((sum, v) => sum + v.stake, 0);

    return {
      chainId: MAINNET_GENESIS_CONFIG.chainId,
      networkName: MAINNET_GENESIS_CONFIG.networkName,
      totalSupply: `${MAINNET_GENESIS_CONFIG.totalSupply.toLocaleString()} EMO`,
      foundingValidators: FOUNDING_VALIDATORS.length,
      regionalDistribution: regions,
      averageEmotionalScore: Math.round(averageEmotionalScore * 10) / 10,
      totalStakeAllocated,
      launchDate: MAINNET_GENESIS_CONFIG.genesisTime
    };
  }
}