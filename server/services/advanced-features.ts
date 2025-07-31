/**
 * Advanced Features Database Service
 * Replaces all mock implementations with real database-backed operations
 */

import { db } from "../db";
import { 
  smartContracts, 
  wellnessGoals,
  quantumKeyPairs,
  privacyProofs,
  bridgeTransactions,
  aiModelData,
  biometricDevices,
  type SmartContract,
  type WellnessGoal,
  type QuantumKeyPair,
  type PrivacyProof,
  type BridgeTransaction,
  type AiModelData,
  type BiometricDevice,
  type InsertSmartContract,
  type InsertWellnessGoal,
  type InsertQuantumKeyPair,
  type InsertPrivacyProof,
  type InsertBridgeTransaction,
  type InsertAiModelData,
  type InsertBiometricDevice
} from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export class AdvancedFeaturesService {
  
  // ===== SMART CONTRACT LAYER =====
  
  async deploySmartContract(contractData: InsertSmartContract): Promise<SmartContract> {
    const [contract] = await db
      .insert(smartContracts)
      .values(contractData)
      .returning();
    
    console.log(`🚀 Smart contract deployed to database: ${contract.contractAddress}`);
    return contract;
  }

  async getSmartContract(contractAddress: string): Promise<SmartContract | undefined> {
    const [contract] = await db
      .select()
      .from(smartContracts)
      .where(eq(smartContracts.contractAddress, contractAddress));
    
    return contract;
  }

  async getAllSmartContracts(): Promise<SmartContract[]> {
    return await db
      .select()
      .from(smartContracts)
      .where(eq(smartContracts.isActive, true))
      .orderBy(desc(smartContracts.deployedAt));
  }

  async updateSmartContract(contractAddress: string, updates: Partial<SmartContract>): Promise<SmartContract | undefined> {
    const [updated] = await db
      .update(smartContracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smartContracts.contractAddress, contractAddress))
      .returning();
    
    return updated;
  }

  // ===== WELLNESS GOALS =====

  async createWellnessGoal(goalData: InsertWellnessGoal): Promise<WellnessGoal> {
    const [goal] = await db
      .insert(wellnessGoals)
      .values(goalData)
      .returning();
    
    console.log(`🎯 Wellness goal created: ${goal.id}`);
    return goal;
  }

  async getWellnessGoalsByParticipant(participant: string): Promise<WellnessGoal[]> {
    return await db
      .select()
      .from(wellnessGoals)
      .where(eq(wellnessGoals.participant, participant))
      .orderBy(desc(wellnessGoals.createdAt));
  }

  async updateWellnessGoalProgress(goalId: string, progress: number): Promise<WellnessGoal | undefined> {
    const [updated] = await db
      .update(wellnessGoals)
      .set({ 
        currentProgress: progress.toString(),
        completed: progress >= 100
      })
      .where(eq(wellnessGoals.id, goalId))
      .returning();
    
    return updated;
  }

  // ===== QUANTUM RESISTANCE =====

  async storeQuantumKeyPair(keyPairData: InsertQuantumKeyPair): Promise<QuantumKeyPair> {
    const [keyPair] = await db
      .insert(quantumKeyPairs)
      .values(keyPairData)
      .returning();
    
    console.log(`🔐 Quantum key pair stored: ${keyPair.algorithm} for ${keyPair.validatorId}`);
    return keyPair;
  }

  async getQuantumKeyPair(validatorId: string, algorithm?: string): Promise<QuantumKeyPair | undefined> {
    const conditions = [eq(quantumKeyPairs.validatorId, validatorId)];
    if (algorithm) {
      conditions.push(eq(quantumKeyPairs.algorithm, algorithm));
    }

    const [keyPair] = await db
      .select()
      .from(quantumKeyPairs)
      .where(and(...conditions))
      .orderBy(desc(quantumKeyPairs.createdAt));
    
    return keyPair;
  }

  async getAllQuantumKeyPairs(): Promise<QuantumKeyPair[]> {
    return await db
      .select()
      .from(quantumKeyPairs)
      .where(eq(quantumKeyPairs.status, 'active'))
      .orderBy(desc(quantumKeyPairs.createdAt));
  }

  // ===== PRIVACY LAYER =====

  async storePrivacyProof(proofData: InsertPrivacyProof): Promise<PrivacyProof> {
    const [proof] = await db
      .insert(privacyProofs)
      .values(proofData)
      .returning();
    
    console.log(`🔒 Privacy proof stored: ${proof.proofType} - ${proof.id}`);
    return proof;
  }

  async getPrivacyProofs(proofType?: string, validatorId?: string): Promise<PrivacyProof[]> {
    const conditions = [eq(privacyProofs.isValid, true)];
    
    if (proofType) {
      conditions.push(eq(privacyProofs.proofType, proofType));
    }
    
    if (validatorId) {
      conditions.push(eq(privacyProofs.validatorId, validatorId));
    }

    return await db
      .select()
      .from(privacyProofs)
      .where(and(...conditions))
      .orderBy(desc(privacyProofs.createdAt));
  }

  // ===== CROSS-CHAIN BRIDGES =====

  async createBridgeTransaction(txData: InsertBridgeTransaction): Promise<BridgeTransaction> {
    const [bridgeTx] = await db
      .insert(bridgeTransactions)
      .values(txData)
      .returning();
    
    console.log(`🌉 Bridge transaction created: ${bridgeTx.bridgeId}`);
    return bridgeTx;
  }

  async getBridgeTransaction(bridgeId: string): Promise<BridgeTransaction | undefined> {
    const [bridgeTx] = await db
      .select()
      .from(bridgeTransactions)
      .where(eq(bridgeTransactions.bridgeId, bridgeId));
    
    return bridgeTx;
  }

  async updateBridgeTransactionStatus(
    bridgeId: string, 
    status: string, 
    targetTxHash?: string
  ): Promise<BridgeTransaction | undefined> {
    const updates: any = { status };
    if (targetTxHash) {
      updates.targetTxHash = targetTxHash;
    }
    if (status === 'completed') {
      updates.completedAt = new Date();
    }

    const [updated] = await db
      .update(bridgeTransactions)
      .set(updates)
      .where(eq(bridgeTransactions.bridgeId, bridgeId))
      .returning();
    
    return updated;
  }

  async getAllBridgeTransactions(): Promise<BridgeTransaction[]> {
    return await db
      .select()
      .from(bridgeTransactions)
      .orderBy(desc(bridgeTransactions.createdAt));
  }

  // ===== AI MODEL DATA =====

  async storeAiModelData(modelData: InsertAiModelData): Promise<AiModelData> {
    const [model] = await db
      .insert(aiModelData)
      .values(modelData)
      .returning();
    
    console.log(`🧠 AI model data stored: ${model.modelName} v${model.version}`);
    return model;
  }

  async getActiveAiModel(modelType: string): Promise<AiModelData | undefined> {
    const [model] = await db
      .select()
      .from(aiModelData)
      .where(and(
        eq(aiModelData.modelType, modelType),
        eq(aiModelData.isActive, true)
      ))
      .orderBy(desc(aiModelData.lastTraining));
    
    return model;
  }

  async getAllAiModels(): Promise<AiModelData[]> {
    return await db
      .select()
      .from(aiModelData)
      .where(eq(aiModelData.isActive, true))
      .orderBy(desc(aiModelData.lastTraining));
  }

  // ===== BIOMETRIC DEVICES =====

  async registerBiometricDevice(deviceData: InsertBiometricDevice): Promise<BiometricDevice> {
    const [device] = await db
      .insert(biometricDevices)
      .values(deviceData)
      .returning();
    
    console.log(`📱 Biometric device registered: ${device.deviceType} - ${device.deviceId}`);
    return device;
  }

  async getBiometricDevice(deviceId: string): Promise<BiometricDevice | undefined> {
    const [device] = await db
      .select()
      .from(biometricDevices)
      .where(eq(biometricDevices.deviceId, deviceId));
    
    return device;
  }

  async getValidatorBiometricDevices(validatorId: string): Promise<BiometricDevice[]> {
    return await db
      .select()
      .from(biometricDevices)
      .where(and(
        eq(biometricDevices.validatorId, validatorId),
        eq(biometricDevices.status, 'active')
      ))
      .orderBy(desc(biometricDevices.registeredAt));
  }

  async updateBiometricDeviceStatus(
    deviceId: string, 
    status: string, 
    batteryLevel?: number,
    signalQuality?: number
  ): Promise<BiometricDevice | undefined> {
    const updates: any = { 
      status,
      lastActivity: new Date()
    };
    
    if (batteryLevel !== undefined) {
      updates.batteryLevel = batteryLevel;
    }
    
    if (signalQuality !== undefined) {
      updates.signalQuality = signalQuality.toString();
    }

    const [updated] = await db
      .update(biometricDevices)
      .set(updates)
      .where(eq(biometricDevices.deviceId, deviceId))
      .returning();
    
    return updated;
  }

  // ===== DATA INTEGRITY VERIFICATION =====

  async verifyDataIntegrity(): Promise<{
    smartContracts: number;
    wellnessGoals: number;
    quantumKeyPairs: number;
    privacyProofs: number;
    bridgeTransactions: number;
    aiModels: number;
    biometricDevices: number;
  }> {
    const [counts] = await Promise.all([
      Promise.all([
        db.select().from(smartContracts).then(r => r.length),
        db.select().from(wellnessGoals).then(r => r.length),
        db.select().from(quantumKeyPairs).then(r => r.length),
        db.select().from(privacyProofs).then(r => r.length),
        db.select().from(bridgeTransactions).then(r => r.length),
        db.select().from(aiModelData).then(r => r.length),
        db.select().from(biometricDevices).then(r => r.length)
      ])
    ]);

    return {
      smartContracts: counts[0],
      wellnessGoals: counts[1],
      quantumKeyPairs: counts[2],
      privacyProofs: counts[3],
      bridgeTransactions: counts[4],
      aiModels: counts[5],
      biometricDevices: counts[6]
    };
  }
}

export const advancedFeaturesService = new AdvancedFeaturesService();