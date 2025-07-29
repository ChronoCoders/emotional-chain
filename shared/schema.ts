import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
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
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  transactions: text("transactions").array().notNull().default([]),
  validator: text("validator").notNull(),
  emotionalScore: decimal("emotional_score", { precision: 5, scale: 2 }).notNull(),
  consensusScore: decimal("consensus_score", { precision: 5, scale: 2 }).notNull(),
  authenticity: decimal("authenticity", { precision: 5, scale: 2 }).notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hash: text("hash").notNull().unique(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 18, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  blockId: varchar("block_id").references(() => blocks.id),
  status: text("status").notNull().default("pending"),
});

export const validators = pgTable("validators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  stake: decimal("stake", { precision: 18, scale: 8 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  uptime: decimal("uptime", { precision: 5, scale: 2 }).notNull().default("0"),
  authScore: decimal("auth_score", { precision: 5, scale: 2 }).notNull().default("0"),
  device: text("device"),
  lastValidation: timestamp("last_validation"),
});

export const biometricData = pgTable("biometric_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  validatorId: varchar("validator_id").references(() => validators.id).notNull(),
  heartRate: integer("heart_rate"),
  hrv: integer("hrv"),
  stressLevel: decimal("stress_level", { precision: 5, scale: 2 }),
  focusLevel: decimal("focus_level", { precision: 5, scale: 2 }),
  authenticity: decimal("authenticity", { precision: 5, scale: 2 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const networkStats = pgTable("network_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectedPeers: integer("connected_peers").notNull().default(0),
  activeValidators: integer("active_validators").notNull().default(0),
  blockHeight: integer("block_height").notNull().default(0),
  consensusPercentage: decimal("consensus_percentage", { precision: 5, scale: 2 }).notNull().default("0"),
  networkStress: decimal("network_stress", { precision: 5, scale: 2 }).notNull().default("0"),
  networkEnergy: decimal("network_energy", { precision: 5, scale: 2 }).notNull().default("0"),
  networkFocus: decimal("network_focus", { precision: 5, scale: 2 }).notNull().default("0"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBlockSchema = createInsertSchema(blocks).omit({
  id: true,
  timestamp: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

export const insertValidatorSchema = createInsertSchema(validators).omit({
  id: true,
  lastValidation: true,
});

export const insertBiometricDataSchema = createInsertSchema(biometricData).omit({
  id: true,
  timestamp: true,
});

export const insertNetworkStatsSchema = createInsertSchema(networkStats).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type Block = typeof blocks.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertValidator = z.infer<typeof insertValidatorSchema>;
export type Validator = typeof validators.$inferSelect;

export type InsertBiometricData = z.infer<typeof insertBiometricDataSchema>;
export type BiometricData = typeof biometricData.$inferSelect;

export type InsertNetworkStats = z.infer<typeof insertNetworkStatsSchema>;
export type NetworkStats = typeof networkStats.$inferSelect;
