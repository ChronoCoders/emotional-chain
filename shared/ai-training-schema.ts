// AI Training Events Schema for Feedback Loop Learning
import { pgTable, text, real, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// AI Training Events table for storing learning feedback
export const aiTrainingEvents = pgTable("ai_training_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  validatorId: text("validator_id").notNull(),
  
  // Emotional Pattern Data
  emotionalScore: real("emotional_score").notNull(),
  consensusScore: real("consensus_score").notNull(),
  authenticity: real("authenticity").notNull(),
  deviation: real("deviation").notNull(),
  historicalAverage: real("historical_average").notNull(),
  timeOfDay: real("time_of_day").notNull(),
  
  // AI Prediction Results
  anomalyPrediction: real("anomaly_prediction").notNull(), // 0-1 probability
  anomalyType: text("anomaly_type").notNull(),
  confidence: real("confidence").notNull(),
  adjustedWeight: real("adjusted_weight").notNull(),
  originalWeight: real("original_weight").notNull(),
  
  // Actual Outcomes (Ground Truth)
  finalBlockReward: real("final_block_reward"), // Actual reward received
  validatorPerformance: real("validator_performance"), // Performance score 0-100
  consensusParticipation: boolean("consensus_participation").notNull(),
  blockCreatedSuccessfully: boolean("block_created_successfully"),
  
  // System Reaction
  systemAction: text("system_action").notNull(), // 'proceed', 'reduce_weight', 'exclude', 'investigate'
  rewardFairness: real("reward_fairness"), // How fair the reward was vs prediction
  emotionDrift: real("emotion_drift"), // Emotional score change after event
  
  // Learning Metadata
  modelVersion: text("model_version").notNull(),
  trainingRound: integer("training_round").notNull(),
  feedbackProcessed: boolean("feedback_processed").default(false),
  
  // Additional Context
  contextData: jsonb("context_data"), // Additional contextual information
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Learning Metrics table for tracking AI improvement
export const aiLearningMetrics = pgTable("ai_learning_metrics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  modelVersion: text("model_version").notNull(),
  trainingRound: integer("training_round").notNull(),
  
  // Performance Metrics
  accuracy: real("accuracy").notNull(),
  precision: real("precision").notNull(),
  recall: real("recall").notNull(),
  f1Score: real("f1_score").notNull(),
  
  // Fairness Metrics
  rewardFairnessScore: real("reward_fairness_score").notNull(),
  emotionDriftVariance: real("emotion_drift_variance").notNull(),
  biasScore: real("bias_score").notNull(),
  
  // Training Details
  trainingDataSize: integer("training_data_size").notNull(),
  validationDataSize: integer("validation_data_size").notNull(),
  trainingLoss: real("training_loss").notNull(),
  validationLoss: real("validation_loss").notNull(),
  epochs: integer("epochs").notNull(),
  learningRate: real("learning_rate").notNull(),
  
  // Improvement Metrics
  performanceImprovement: real("performance_improvement"), // vs previous version
  biasReduction: real("bias_reduction"), // vs previous version
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Zod schemas for validation
export const insertAiTrainingEventSchema = createInsertSchema(aiTrainingEvents, {
  emotionalScore: z.number().min(0).max(100),
  consensusScore: z.number().min(0).max(100),
  authenticity: z.number().min(0).max(100),
  anomalyPrediction: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  validatorPerformance: z.number().min(0).max(100).optional(),
  rewardFairness: z.number().min(0).max(1).optional(),
  emotionDrift: z.number().min(-100).max(100).optional()
});

export const insertAiLearningMetricsSchema = createInsertSchema(aiLearningMetrics, {
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1),
  recall: z.number().min(0).max(1),
  f1Score: z.number().min(0).max(1),
  rewardFairnessScore: z.number().min(0).max(1),
  biasScore: z.number().min(0).max(1)
});

// TypeScript types
export type AiTrainingEvent = typeof aiTrainingEvents.$inferSelect;
export type InsertAiTrainingEvent = z.infer<typeof insertAiTrainingEventSchema>;
export type AiLearningMetrics = typeof aiLearningMetrics.$inferSelect;
export type InsertAiLearningMetrics = z.infer<typeof insertAiLearningMetricsSchema>;