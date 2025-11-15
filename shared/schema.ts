import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});
export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  height: integer("height").notNull(),
  hash: text("hash").notNull().unique(),
  previousHash: text("previous_hash").notNull(),
  merkleRoot: text("merkle_root").notNull(),
  transactionRoot: text("transaction_root").notNull(), // NEW: Merkle root of transactions
  stateRoot: text("state_root").notNull(), // NEW: State tree root hash
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  nonce: integer("nonce").notNull(),
  difficulty: integer("difficulty").notNull(),
  validatorId: text("validator_id").notNull(),
  emotionalScore: decimal("emotional_score", { precision: 5, scale: 2 }).notNull(),
  emotionalProof: jsonb("emotional_proof"),
  blockData: jsonb("block_data"),
  transactions: jsonb("transactions").default('[]'), // NEW: Full transaction list (immutable)
  zkProofs: jsonb("zk_proofs").default('[]'), // NEW: Privacy-preserving proofs
  transactionCount: integer("transaction_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
// NOTE: This table becomes READ-ONLY cache for query optimization
// All transaction data is now stored immutably in blocks.transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hash: text("hash").notNull().unique(),
  blockHash: text("block_hash").references(() => blocks.hash),
  blockNumber: integer("block_number").notNull(), // NEW: Block inclusion number
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 18, scale: 8 }).default("0"),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  signature: jsonb("signature").notNull(),
  emotionalProofHash: text("emotional_proof_hash"), // NEW: ZK proof commitment
  biometricData: jsonb("biometric_data"), // DEPRECATED: Moving to off-chain encrypted storage
  transactionData: jsonb("transaction_data"),
  status: text("status").notNull().default("confirmed"),
  isBlockchainVerified: boolean("is_blockchain_verified").default(false), // NEW: Verification flag
  createdAt: timestamp("created_at").defaultNow(),
});
export const validatorStates = pgTable("validator_states", {
  validatorId: text("validator_id").primaryKey(),
  balance: decimal("balance", { precision: 18, scale: 8 }).notNull().default("0"),
  emotionalScore: decimal("emotional_score", { precision: 5, scale: 2 }).notNull().default("0"),
  lastActivity: bigint("last_activity", { mode: "number" }).notNull(),
  publicKey: text("public_key").notNull(),
  reputation: decimal("reputation", { precision: 5, scale: 2 }).default("100"),
  totalBlocksMined: integer("total_blocks_mined").default(0),
  totalValidations: integer("total_validations").default(0),
  deviceTrustLevel: integer("device_trust_level").default(1), // 1, 2, or 3
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Token economics table for persistent state
export const tokenEconomics = pgTable("token_economics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalSupply: decimal("total_supply", { precision: 18, scale: 8 }).notNull().default("0"),
  maxSupply: decimal("max_supply", { precision: 18, scale: 8 }).notNull().default("1000000000"),
  circulatingSupply: decimal("circulating_supply", { precision: 18, scale: 8 }).notNull().default("0"),
  stakingPoolAllocated: decimal("staking_pool_allocated", { precision: 18, scale: 8 }).notNull().default("400000000"),
  stakingPoolRemaining: decimal("staking_pool_remaining", { precision: 18, scale: 8 }).notNull().default("400000000"),
  stakingPoolUtilized: decimal("staking_pool_utilized", { precision: 18, scale: 8 }).notNull().default("0"),
  wellnessPoolAllocated: decimal("wellness_pool_allocated", { precision: 18, scale: 8 }).notNull().default("200000000"),
  wellnessPoolRemaining: decimal("wellness_pool_remaining", { precision: 18, scale: 8 }).notNull().default("200000000"),
  wellnessPoolUtilized: decimal("wellness_pool_utilized", { precision: 18, scale: 8 }).notNull().default("0"),
  ecosystemPoolAllocated: decimal("ecosystem_pool_allocated", { precision: 18, scale: 8 }).notNull().default("250000000"),
  ecosystemPoolRemaining: decimal("ecosystem_pool_remaining", { precision: 18, scale: 8 }).notNull().default("250000000"),
  ecosystemPoolUtilized: decimal("ecosystem_pool_utilized", { precision: 18, scale: 8 }).notNull().default("0"),
  baseBlockReward: decimal("base_block_reward", { precision: 18, scale: 8 }).notNull().default("50"),
  baseValidationReward: decimal("base_validation_reward", { precision: 18, scale: 8 }).notNull().default("5"),
  emotionalConsensusBonus: decimal("emotional_consensus_bonus", { precision: 18, scale: 8 }).notNull().default("25"),
  minimumValidatorStake: decimal("minimum_validator_stake", { precision: 18, scale: 8 }).notNull().default("10000"),
  lastBlockHeight: integer("last_block_height").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});
// DEPRECATED: Raw biometric data storage (GDPR VIOLATION)
// Kept for backward compatibility only - DO NOT USE for new data
// Use biometricCommitments table instead
export const biometricData = pgTable("biometric_data", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  validatorId: text("validator_id").references(() => validatorStates.validatorId).notNull(),
  deviceId: text("device_id").notNull(),
  readingType: text("reading_type").notNull(),
  value: decimal("value", { precision: 10, scale: 4 }).notNull(),
  quality: decimal("quality", { precision: 3, scale: 2 }).notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  authenticityProof: jsonb("authenticity_proof").notNull(),
  rawData: jsonb("raw_data"), // DEPRECATED: GDPR violation
  createdAt: timestamp("created_at").defaultNow(),
});

// GDPR-COMPLIANT: Commitment-only biometric storage
// Stores only cryptographic commitments, NOT raw biometric data
// Implements data minimization principle (GDPR Article 5)
export const biometricCommitments = pgTable("biometric_commitments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  validatorAddress: text("validator_address").notNull(),
  deviceId: text("device_id").notNull(),
  commitment: text("commitment").notNull(), // Hash(score + nonce)
  zkProof: text("zk_proof").notNull(), // Zero-knowledge threshold proof
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  blockHeight: integer("block_height"),
  scoreAboveThreshold: boolean("score_above_threshold"), // Only boolean, never actual score
  createdAt: timestamp("created_at").defaultNow(),
});

// OFF-CHAIN DATA: Can be deleted for GDPR compliance
// Separates personal data from immutable blockchain data
export const offChainProfiles = pgTable("off_chain_profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  validatorAddress: text("validator_address").notNull().unique(),
  email: text("email"),
  name: text("name"),
  country: text("country"),
  consentTimestamp: timestamp("consent_timestamp").notNull(),
  consentVersion: text("consent_version").notNull(), // e.g., "v1.0"
  consentActive: boolean("consent_active").default(true),
  dataProcessingPurpose: text("data_processing_purpose"), // Required by GDPR
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
// Smart contracts table
export const smartContracts = pgTable("smart_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractAddress: text("contract_address").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'wellness_incentive', 'emotional_trigger', 'biometric_reward'
  deployerAddress: text("deployer_address").notNull(),
  emotionalThreshold: decimal("emotional_threshold", { precision: 5, scale: 2 }).notNull(),
  totalValue: decimal("total_value", { precision: 18, scale: 8 }).default("0"),
  isActive: boolean("is_active").default(true),
  bytecode: text("bytecode").notNull(),
  abi: jsonb("abi").notNull(),
  metadata: jsonb("metadata"),
  participants: text("participants").array().default(sql`'{}'::text[]`),
  deployedAt: timestamp("deployed_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
// Wellness goals table
export const wellnessGoals = pgTable("wellness_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractAddress: text("contract_address").references(() => smartContracts.contractAddress).notNull(),
  participant: text("participant").notNull(),
  targetScore: decimal("target_score", { precision: 5, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // days
  currentProgress: decimal("current_progress", { precision: 5, scale: 2 }).default("0"),
  reward: decimal("reward", { precision: 18, scale: 8 }).notNull(),
  completed: boolean("completed").default(false),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  biometricHistory: jsonb("biometric_history").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
});
// Quantum key pairs table
export const quantumKeyPairs = pgTable("quantum_key_pairs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  validatorId: text("validator_id").references(() => validatorStates.validatorId).notNull(),
  algorithm: text("algorithm").notNull(), // 'CRYSTALS-Dilithium', 'CRYSTALS-Kyber', 'FALCON'
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(), // Encrypted storage
  keySize: integer("key_size").notNull(),
  securityLevel: text("security_level").notNull(), // '128', '192', '256'
  status: text("status").default("active"), // 'active', 'deprecated', 'compromised'
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});
// Privacy proofs table  
export const privacyProofs = pgTable("privacy_proofs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proofType: text("proof_type").notNull(), // 'zero_knowledge', 'ring_signature', 'homomorphic'
  validatorId: text("validator_id").references(() => validatorStates.validatorId),
  commitment: text("commitment").notNull(),
  nullifierHash: text("nullifier_hash"),
  proof: jsonb("proof").notNull(),
  anonymitySet: integer("anonymity_set"),
  isValid: boolean("is_valid").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
// Cross-chain bridge transactions table
export const bridgeTransactions = pgTable("bridge_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bridgeId: text("bridge_id").notNull(),
  sourceChain: text("source_chain").notNull(),
  targetChain: text("target_chain").notNull(),
  sourceTxHash: text("source_tx_hash").notNull(),
  targetTxHash: text("target_tx_hash"),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  tokenSymbol: text("token_symbol").notNull(),
  sender: text("sender").notNull(),
  recipient: text("recipient").notNull(),
  status: text("status").default("pending"), // 'pending', 'confirmed', 'completed', 'failed'
  emotionalMetadata: jsonb("emotional_metadata"),
  bridgeFee: decimal("bridge_fee", { precision: 18, scale: 8 }).notNull(),
  estimatedTime: integer("estimated_time").notNull(), // seconds
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
// AI model training data table
export const aiModelData = pgTable("ai_model_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelName: text("model_name").notNull(),
  modelType: text("model_type").notNull(), // 'emotional_predictor', 'anomaly_detector', 'consensus_optimizer'
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }).notNull(),
  precision: decimal("precision", { precision: 5, scale: 4 }).notNull(),
  recall: decimal("recall", { precision: 5, scale: 4 }).notNull(),
  f1Score: decimal("f1_score", { precision: 5, scale: 4 }).notNull(),
  trainingDataSize: integer("training_data_size").notNull(),
  version: text("version").notNull(),
  modelWeights: text("model_weights"), // File path or blob reference
  hyperparameters: jsonb("hyperparameters"),
  lastTraining: timestamp("last_training").defaultNow(),
  isActive: boolean("is_active").default(true),
});
// Biometric device registry table
export const biometricDevices = pgTable("biometric_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull().unique(),
  validatorId: text("validator_id").references(() => validatorStates.validatorId).notNull(),
  deviceType: text("device_type").notNull(), // 'heartRate', 'stress', 'focus', 'multi_sensor'
  manufacturer: text("manufacturer").notNull(),
  model: text("model").notNull(),
  firmwareVersion: text("firmware_version"),
  calibrationData: jsonb("calibration_data"),
  status: text("status").default("active"), // 'active', 'inactive', 'maintenance', 'error'
  lastActivity: timestamp("last_activity"),
  batteryLevel: integer("battery_level"),
  signalQuality: decimal("signal_quality", { precision: 3, scale: 2 }),
  authenticityVerified: boolean("authenticity_verified").default(false),
  registeredAt: timestamp("registered_at").defaultNow(),
});
// Consensus rounds table
export const consensusRounds = pgTable("consensus_rounds", {
  roundId: integer("round_id").primaryKey(),
  participants: text("participants").array().notNull(),
  emotionalScores: jsonb("emotional_scores").notNull(),
  consensusStrength: decimal("consensus_strength", { precision: 5, scale: 2 }).notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  blockHash: text("block_hash").references(() => blocks.hash),
  createdAt: timestamp("created_at").defaultNow(),
});
// Peer reputation table
export const peerReputation = pgTable("peer_reputation", {
  peerId: text("peer_id").primaryKey(),
  reputation: decimal("reputation", { precision: 5, scale: 2 }).notNull().default("100"),
  connectionCount: integer("connection_count").default(0),
  uptimePercentage: decimal("uptime_percentage", { precision: 5, scale: 2 }).default("0"),
  messageSuccessRate: decimal("message_success_rate", { precision: 5, scale: 2 }).default("100"),
  lastSeen: bigint("last_seen", { mode: "number" }).notNull(),
  metadata: jsonb("metadata"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
// Storage metrics table
export const storageMetrics = pgTable("storage_metrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  metricName: text("metric_name").notNull(),
  metricValue: decimal("metric_value", { precision: 18, scale: 8 }).notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Validator stakes table for hybrid consensus (PoE + PoS)
export const validatorStakes = pgTable("validator_stakes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  validatorAddress: text("validator_address").notNull().unique(),
  stakedAmount: text("staked_amount").notNull(), // Store as string for bigint
  stakeTimestamp: timestamp("stake_timestamp").notNull(),
  lockedUntil: timestamp("locked_until").notNull(),
  slashingEvents: integer("slashing_events").default(0),
  totalSlashed: text("total_slashed").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Device registrations for three-tier attestation
export const deviceRegistrations = pgTable("device_registrations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deviceId: text("device_id").notNull().unique(),
  deviceType: text("device_type").notNull(), // 'commodity' | 'medical' | 'hsm'
  manufacturer: text("manufacturer").notNull(),
  serialNumber: text("serial_number"),
  attestationProof: text("attestation_proof"),
  trustLevel: integer("trust_level").notNull(), // 1, 2, or 3
  validatorAddress: text("validator_address").notNull(),
  registeredAt: timestamp("registered_at").notNull(),
  lastActivityAt: timestamp("last_activity_at"),
  isActive: boolean("is_active").default(true),
  oauthProvider: text("oauth_provider"), // 'fitbit' | 'apple' | 'garmin' for Level 1
  deviceModel: text("device_model"), // Specific model for Level 2+
  createdAt: timestamp("created_at").defaultNow(),
});

// Threshold proofs table for privacy-preserving ZK system
export const thresholdProofs = pgTable("threshold_proofs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  validatorAddress: text("validator_address").notNull(),
  commitment: text("commitment").notNull(), // Cryptographic commitment (never reveals actual score)
  proofData: text("proof_data").notNull(), // ZK-SNARK proof
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  scoreAboveThreshold: boolean("score_above_threshold").notNull(), // Only reveals boolean
  threshold: integer("threshold").notNull(),
  isValid: boolean("is_valid").default(true),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Batch proofs table for inference attack prevention
export const batchProofs = pgTable("batch_proofs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  batchId: text("batch_id").notNull().unique(),
  validatorCommitments: text("validator_commitments").array().notNull(), // Array of commitments
  aggregatedProof: text("aggregated_proof").notNull(), // Single aggregated proof
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  validatorCount: integer("validator_count").notNull(),
  thresholdsPassed: integer("thresholds_passed").notNull(), // Aggregate statistic only
  isValid: boolean("is_valid").default(true),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for all tables
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
  createdAt: true,
});
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});
export const insertValidatorStateSchema = createInsertSchema(validatorStates).omit({
  updatedAt: true,
});
export const insertBiometricDataSchema = createInsertSchema(biometricData).omit({
  id: true,
  createdAt: true,
});

export const insertBiometricCommitmentSchema = createInsertSchema(biometricCommitments).omit({
  id: true,
  createdAt: true,
});

export const insertOffChainProfileSchema = createInsertSchema(offChainProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSmartContractSchema = createInsertSchema(smartContracts).omit({
  id: true,
  deployedAt: true,
  updatedAt: true,
});
export const insertWellnessGoalSchema = createInsertSchema(wellnessGoals).omit({
  id: true,
  createdAt: true,
});
export const insertQuantumKeyPairSchema = createInsertSchema(quantumKeyPairs).omit({
  id: true,
  createdAt: true,
});
export const insertPrivacyProofSchema = createInsertSchema(privacyProofs).omit({
  id: true,
  createdAt: true,
});
export const insertBridgeTransactionSchema = createInsertSchema(bridgeTransactions).omit({
  id: true,
  createdAt: true,
});
export const insertAiModelDataSchema = createInsertSchema(aiModelData).omit({
  id: true,
  lastTraining: true,
});
export const insertBiometricDeviceSchema = createInsertSchema(biometricDevices).omit({
  id: true,
  registeredAt: true,
});
export const insertConsensusRoundSchema = createInsertSchema(consensusRounds).omit({
  createdAt: true,
});

export const insertTokenEconomicsSchema = createInsertSchema(tokenEconomics).omit({
  id: true,
  updatedAt: true,
});
export const insertPeerReputationSchema = createInsertSchema(peerReputation).omit({
  updatedAt: true,
});
export const insertStorageMetricsSchema = createInsertSchema(storageMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertValidatorStakeSchema = createInsertSchema(validatorStakes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceRegistrationSchema = createInsertSchema(deviceRegistrations).omit({
  id: true,
  createdAt: true,
});

export const insertThresholdProofSchema = createInsertSchema(thresholdProofs).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export const insertBatchProofSchema = createInsertSchema(batchProofs).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

// Type exports for all tables
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type ValidatorState = typeof validatorStates.$inferSelect;
export type InsertValidatorState = z.infer<typeof insertValidatorStateSchema>;
export type BiometricDataRecord = typeof biometricData.$inferSelect;
export type InsertBiometricData = z.infer<typeof insertBiometricDataSchema>;
export type BiometricCommitment = typeof biometricCommitments.$inferSelect;
export type InsertBiometricCommitment = z.infer<typeof insertBiometricCommitmentSchema>;
export type OffChainProfile = typeof offChainProfiles.$inferSelect;
export type InsertOffChainProfile = z.infer<typeof insertOffChainProfileSchema>;
export type SmartContract = typeof smartContracts.$inferSelect;
export type InsertSmartContract = z.infer<typeof insertSmartContractSchema>;
export type WellnessGoal = typeof wellnessGoals.$inferSelect;
export type InsertWellnessGoal = z.infer<typeof insertWellnessGoalSchema>;
export type QuantumKeyPair = typeof quantumKeyPairs.$inferSelect;
export type InsertQuantumKeyPair = z.infer<typeof insertQuantumKeyPairSchema>;
export type PrivacyProof = typeof privacyProofs.$inferSelect;
export type InsertPrivacyProof = z.infer<typeof insertPrivacyProofSchema>;
export type BridgeTransaction = typeof bridgeTransactions.$inferSelect;
export type InsertBridgeTransaction = z.infer<typeof insertBridgeTransactionSchema>;
export type AiModelData = typeof aiModelData.$inferSelect;
export type InsertAiModelData = z.infer<typeof insertAiModelDataSchema>;
export type BiometricDevice = typeof biometricDevices.$inferSelect;
export type InsertBiometricDevice = z.infer<typeof insertBiometricDeviceSchema>;
export type ConsensusRound = typeof consensusRounds.$inferSelect;
export type InsertConsensusRound = z.infer<typeof insertConsensusRoundSchema>;
export type PeerReputation = typeof peerReputation.$inferSelect;
export type InsertPeerReputation = z.infer<typeof insertPeerReputationSchema>;
export type StorageMetrics = typeof storageMetrics.$inferSelect;
export type InsertStorageMetrics = z.infer<typeof insertStorageMetricsSchema>;
export type ValidatorStake = typeof validatorStakes.$inferSelect;
export type InsertValidatorStake = z.infer<typeof insertValidatorStakeSchema>;
export type DeviceRegistration = typeof deviceRegistrations.$inferSelect;
export type InsertDeviceRegistration = z.infer<typeof insertDeviceRegistrationSchema>;
export type ThresholdProof = typeof thresholdProofs.$inferSelect;
export type InsertThresholdProof = z.infer<typeof insertThresholdProofSchema>;
export type BatchProof = typeof batchProofs.$inferSelect;
export type InsertBatchProof = z.infer<typeof insertBatchProofSchema>;

// Token Economics types
export type TokenEconomics = typeof tokenEconomics.$inferSelect;
export type InsertTokenEconomics = z.infer<typeof insertTokenEconomicsSchema>;
// Legacy type aliases for backward compatibility
export type Validator = ValidatorState;
export type InsertValidator = InsertValidatorState;
export type BiometricData = BiometricDataRecord;
// Runtime compatibility types
export type NetworkStats = {
  id: string;
  connectedPeers: number;  
  activeValidators: number;
  blockHeight: number;
  consensusPercentage: string;
  networkStress: string;
  networkEnergy: string;
  networkFocus: string;
  totalSupply?: string; // Total EMO supply
  circulatingSupply?: string; // Circulating EMO supply
  tps?: string; // Transactions per second
  transactions24h?: string; // 24-hour transaction count
  volume24h?: number; // 24-hour transaction volume
  timestamp: Date;
};
export type InsertNetworkStats = Omit<NetworkStats, "id" | "timestamp">;
// Configuration snapshots table for audit trail
export const configSnapshots = pgTable("config_snapshots", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  blockHeight: integer("block_height").notNull(),
  config: jsonb("config").notNull(),
  changeReason: text("change_reason"),
  adminId: text("admin_id"),
  createdAt: timestamp("created_at").defaultNow(),
});
// Configuration snapshot schema
export const insertConfigSnapshotSchema = createInsertSchema(configSnapshots).omit({
  id: true,
  createdAt: true,
});
export type ConfigSnapshot = typeof configSnapshots.$inferSelect;
export type InsertConfigSnapshot = z.infer<typeof insertConfigSnapshotSchema>;

// Export AI training schema
export * from "./ai-training-schema";
