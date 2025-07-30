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
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  nonce: integer("nonce").notNull(),
  difficulty: integer("difficulty").notNull(),
  validatorId: text("validator_id").notNull(),
  emotionalScore: decimal("emotional_score", { precision: 5, scale: 2 }).notNull(),
  emotionalProof: jsonb("emotional_proof"),
  blockData: jsonb("block_data"),
  transactionCount: integer("transaction_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hash: text("hash").notNull().unique(),
  blockHash: text("block_hash").references(() => blocks.hash),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 18, scale: 8 }).default("0"),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  signature: jsonb("signature").notNull(),
  biometricData: jsonb("biometric_data"),
  transactionData: jsonb("transaction_data"),
  status: text("status").notNull().default("confirmed"),
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const biometricData = pgTable("biometric_data", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  validatorId: text("validator_id").references(() => validatorStates.validatorId).notNull(),
  deviceId: text("device_id").notNull(),
  readingType: text("reading_type").notNull(),
  value: decimal("value", { precision: 10, scale: 4 }).notNull(),
  quality: decimal("quality", { precision: 3, scale: 2 }).notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  authenticityProof: jsonb("authenticity_proof").notNull(),
  rawData: jsonb("raw_data"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Insert schemas
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

// Type exports for the application
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type ValidatorState = typeof validatorStates.$inferSelect;
export type InsertValidatorState = z.infer<typeof insertValidatorStateSchema>;

export type BiometricData = typeof biometricData.$inferSelect;
export type InsertBiometricData = z.infer<typeof insertBiometricDataSchema>;

export type ConsensusRound = typeof consensusRounds.$inferSelect;
export type PeerReputation = typeof peerReputation.$inferSelect;
export type StorageMetrics = typeof storageMetrics.$inferSelect;

// Legacy type aliases for backward compatibility
export type Validator = ValidatorState;
export type InsertValidator = InsertValidatorState;

// Placeholder types for not-yet-implemented features
export type NetworkStats = {
  id: string;
  timestamp: Date;
  activeValidators: number;
  totalTransactions: number;
  networkHashrate: string;
  consensusHealth: number;
};

export type InsertNetworkStats = Omit<NetworkStats, 'id' | 'timestamp'>;

export const insertConsensusRoundSchema = createInsertSchema(consensusRounds).omit({
  createdAt: true,
});

export const insertPeerReputationSchema = createInsertSchema(peerReputation).omit({
  updatedAt: true,
});

export const insertStorageMetricsSchema = createInsertSchema(storageMetrics).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocks.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertValidatorState = z.infer<typeof insertValidatorStateSchema>;
export type ValidatorState = typeof validatorStates.$inferSelect;

export type InsertBiometricData = z.infer<typeof insertBiometricDataSchema>;
export type BiometricData = typeof biometricData.$inferSelect;

export type InsertConsensusRound = z.infer<typeof insertConsensusRoundSchema>;
export type ConsensusRound = typeof consensusRounds.$inferSelect;

export type InsertPeerReputation = z.infer<typeof insertPeerReputationSchema>;
export type PeerReputation = typeof peerReputation.$inferSelect;

export type InsertStorageMetrics = z.infer<typeof insertStorageMetricsSchema>;
export type StorageMetrics = typeof storageMetrics.$inferSelect;

// Legacy compatibility types (for gradual migration)
export type Validator = ValidatorState;
export type InsertValidator = InsertValidatorState;
export type NetworkStats = {
  id: string;
  connectedPeers: number;
  activeValidators: number;
  blockHeight: number;
  consensusPercentage: string;
  networkStress: string;
  networkEnergy: string;
  networkFocus: string;
  timestamp: Date;
};
export type InsertNetworkStats = Omit<NetworkStats, "id" | "timestamp">;
