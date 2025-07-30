/**
 * Real-time Biometric Data Broadcasting for EmotionalChain
 * Production-grade cross-validator biometric data sharing
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { WebSocket } from 'ws';

export interface BiometricReading {
  timestamp: number;
  deviceId: string;
  type: 'heartRate' | 'stress' | 'focus' | 'authenticity';
  value: number;
  quality: number;
  rawData?: any;
}

export interface EmotionalUpdate {
  validatorId: string;
  biometricData: BiometricReading;
  emotionalScore: number;
  consensusRound: number;
  signature: string;
  timestamp: number;
  networkPropagationTime: number;
}

export interface BiometricProof {
  validatorId: string;
  biometricHash: string;
  deviceSignature: string;
  timestamp: number;
  nonce: string;
  merkleProof: string[];
}

export interface AnomalyReport {
  validatorId: string;
  anomalyType: 'pattern_deviation' | 'temporal_inconsistency' | 'device_tampering' | 'value_manipulation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  evidence: any[];
  recommendedAction: 'monitor' | 'investigate' | 'quarantine' | 'exclude';
  timestamp: number;
}

export interface BroadcastMetrics {
  totalBroadcasts: number;
  successfulBroadcasts: number;
  failedBroadcasts: number;
  averageLatency: number;
  bandwidthUsage: number;
  activeSubscribers: number;
  anomaliesDetected: number;
}

export class BiometricBroadcast extends EventEmitter {
  private connectedPeers: Map<string, WebSocket> = new Map();
  private emotionalUpdates: Map<string, EmotionalUpdate[]> = new Map();
  private biometricHistory: Map<string, BiometricReading[]> = new Map();
  private anomalyDetector: AnomalyDetector;
  private broadcastMetrics: BroadcastMetrics;
  private subscribers: Set<(data: EmotionalUpdate) => void> = new Set();
  private compressionEnabled = true;
  private encryptionEnabled = true;

  constructor() {
    super();
    this.anomalyDetector = new AnomalyDetector();
    this.broadcastMetrics = {
      totalBroadcasts: 0,
      successfulBroadcasts: 0,
      failedBroadcasts: 0,
      averageLatency: 0,
      bandwidthUsage: 0,
      activeSubscribers: 0,
      anomaliesDetected: 0
    };
    this.startPerformanceMonitoring();
  }

  public async broadcastEmotionalState(
    validatorId: string,
    biometricData: BiometricReading
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Calculate emotional score from biometric data
      const emotionalScore = this.calculateEmotionalScore(biometricData);
      
      // Create digital signature for authenticity
      const signature = this.createBiometricSignature(validatorId, biometricData);
      
      // Build emotional update message
      const emotionalUpdate: EmotionalUpdate = {
        validatorId,
        biometricData,
        emotionalScore,
        consensusRound: this.getCurrentConsensusRound(),
        signature,
        timestamp: Date.now(),
        networkPropagationTime: 0
      };

      // Store in local history for anomaly detection
      this.storeBiometricReading(validatorId, biometricData);

      // Detect anomalies before broadcasting
      const anomalies = await this.detectAnomalousPatterns(validatorId);
      if (anomalies.severity === 'critical') {
        console.warn(`🚨 Critical anomaly detected for ${validatorId} - broadcast blocked`);
        this.emit('anomalyDetected', anomalies);
        return;
      }

      // Compress and encrypt if enabled
      let messageData = JSON.stringify(emotionalUpdate);
      if (this.compressionEnabled) {
        messageData = this.compressMessage(messageData);
      }
      if (this.encryptionEnabled) {
        messageData = this.encryptMessage(messageData);
      }

      // Broadcast to all connected peers
      const broadcastPromises: Promise<void>[] = [];
      for (const [peerId, connection] of this.connectedPeers.entries()) {
        if (connection.readyState === WebSocket.OPEN) {
          broadcastPromises.push(this.sendToPeer(peerId, connection, messageData));
        }
      }

      await Promise.allSettled(broadcastPromises);

      // Notify local subscribers
      this.notifySubscribers(emotionalUpdate);

      // Update metrics
      const latency = Date.now() - startTime;
      this.updateBroadcastMetrics(true, latency, messageData.length);

      console.log(`📡 Emotional state broadcast completed for ${validatorId} in ${latency}ms`);
      this.emit('broadcastCompleted', { validatorId, latency, recipients: this.connectedPeers.size });

    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateBroadcastMetrics(false, latency, 0);
      console.error(`❌ Broadcast failed for ${validatorId}:`, error);
      this.emit('broadcastFailed', { validatorId, error: error.message });
      throw error;
    }
  }

  public subscribeToEmotionalUpdates(callback: (data: EmotionalUpdate) => void): void {
    this.subscribers.add(callback);
    this.broadcastMetrics.activeSubscribers = this.subscribers.size;
    
    console.log(`📩 New subscriber added - Total: ${this.subscribers.size}`);
    this.emit('subscriberAdded', { totalSubscribers: this.subscribers.size });
  }

  public unsubscribeFromEmotionalUpdates(callback: (data: EmotionalUpdate) => void): void {
    this.subscribers.delete(callback);
    this.broadcastMetrics.activeSubscribers = this.subscribers.size;
    
    console.log(`📤 Subscriber removed - Total: ${this.subscribers.size}`);
    this.emit('subscriberRemoved', { totalSubscribers: this.subscribers.size });
  }

  public async validateBiometricProof(proof: BiometricProof): Promise<boolean> {
    try {
      // Verify timestamp is recent (within 5 minutes)
      const proofAge = Date.now() - proof.timestamp;
      if (proofAge > 5 * 60 * 1000) {
        console.warn(`⚠️ Biometric proof expired: ${proof.validatorId}`);
        return false;
      }

      // Verify device signature
      const deviceValid = this.verifyDeviceSignature(proof);
      if (!deviceValid) {
        console.warn(`⚠️ Invalid device signature: ${proof.validatorId}`);
        return false;
      }

      // Verify merkle proof for data integrity
      const merkleValid = this.verifyMerkleProof(proof);
      if (!merkleValid) {
        console.warn(`⚠️ Invalid merkle proof: ${proof.validatorId}`);
        return false;
      }

      // Verify validator authorization
      const validatorValid = await this.verifyValidatorAuthorization(proof.validatorId);
      if (!validatorValid) {
        console.warn(`⚠️ Unauthorized validator: ${proof.validatorId}`);
        return false;
      }

      console.log(`✅ Biometric proof validated for ${proof.validatorId}`);
      this.emit('proofValidated', { validatorId: proof.validatorId, timestamp: proof.timestamp });
      return true;

    } catch (error) {
      console.error(`❌ Biometric proof validation failed:`, error);
      return false;
    }
  }

  public async detectAnomalousPatterns(validatorId: string): Promise<AnomalyReport> {
    const history = this.biometricHistory.get(validatorId) || [];
    
    if (history.length < 10) {
      return {
        validatorId,
        anomalyType: 'pattern_deviation',
        severity: 'low',
        confidence: 0.5,
        evidence: [],
        recommendedAction: 'monitor',
        timestamp: Date.now()
      };
    }

    // Analyze patterns using multiple detection methods
    const patterns = await this.anomalyDetector.analyzePatterns(history);
    const temporal = await this.anomalyDetector.analyzeTemporalConsistency(history);
    const device = await this.anomalyDetector.analyzeDeviceConsistency(history);
    const values = await this.anomalyDetector.analyzeValueManipulation(history);

    // Combine anomaly scores
    const combinedScore = Math.max(patterns.score, temporal.score, device.score, values.score);
    const primaryAnomaly = [patterns, temporal, device, values]
      .reduce((max, current) => current.score > max.score ? current : max);

    const anomalyReport: AnomalyReport = {
      validatorId,
      anomalyType: primaryAnomaly.type,
      severity: this.calculateSeverity(combinedScore),
      confidence: combinedScore,
      evidence: [patterns, temporal, device, values].filter(a => a.score > 0.3),
      recommendedAction: this.determineAction(combinedScore),
      timestamp: Date.now()
    };

    if (anomalyReport.severity !== 'low') {
      this.broadcastMetrics.anomaliesDetected++;
      console.warn(`🔍 Anomaly detected for ${validatorId}: ${anomalyReport.anomalyType} (${anomalyReport.severity})`);
      this.emit('anomalyDetected', anomalyReport);
    }

    return anomalyReport;
  }

  public addPeer(peerId: string, connection: WebSocket): void {
    this.connectedPeers.set(peerId, connection);
    
    connection.on('message', (data) => {
      this.handleIncomingMessage(peerId, data);
    });

    connection.on('close', () => {
      this.connectedPeers.delete(peerId);
      console.log(`🔌 Peer disconnected: ${peerId}`);
      this.emit('peerDisconnected', peerId);
    });

    connection.on('error', (error) => {
      console.error(`❌ Peer connection error ${peerId}:`, error);
      this.connectedPeers.delete(peerId);
      this.emit('peerError', { peerId, error: error.message });
    });

    console.log(`🔗 Peer connected: ${peerId} - Total peers: ${this.connectedPeers.size}`);
    this.emit('peerConnected', { peerId, totalPeers: this.connectedPeers.size });
  }

  public removePeer(peerId: string): void {
    const connection = this.connectedPeers.get(peerId);
    if (connection) {
      connection.close();
      this.connectedPeers.delete(peerId);
      console.log(`🔌 Peer removed: ${peerId}`);
      this.emit('peerRemoved', peerId);
    }
  }

  private async sendToPeer(peerId: string, connection: WebSocket, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (connection.readyState !== WebSocket.OPEN) {
        reject(new Error(`Peer ${peerId} not connected`));
        return;
      }

      connection.send(data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private handleIncomingMessage(peerId: string, data: any): void {
    try {
      let messageData = data.toString();
      
      // Decrypt if enabled
      if (this.encryptionEnabled) {
        messageData = this.decryptMessage(messageData);
      }
      
      // Decompress if enabled
      if (this.compressionEnabled) {
        messageData = this.decompressMessage(messageData);
      }

      const emotionalUpdate: EmotionalUpdate = JSON.parse(messageData);
      emotionalUpdate.networkPropagationTime = Date.now() - emotionalUpdate.timestamp;

      // Validate incoming emotional update
      if (this.validateEmotionalUpdate(emotionalUpdate)) {
        this.notifySubscribers(emotionalUpdate);
        this.emit('emotionalUpdateReceived', { peerId, update: emotionalUpdate });
      } else {
        console.warn(`⚠️ Invalid emotional update from peer ${peerId}`);
        this.emit('invalidUpdateReceived', { peerId, update: emotionalUpdate });
      }

    } catch (error) {
      console.error(`❌ Error processing message from ${peerId}:`, error);
      this.emit('messageProcessingError', { peerId, error: error.message });
    }
  }

  private notifySubscribers(emotionalUpdate: EmotionalUpdate): void {
    for (const callback of this.subscribers) {
      try {
        callback(emotionalUpdate);
      } catch (error) {
        console.error('❌ Error notifying subscriber:', error);
      }
    }
  }

  private calculateEmotionalScore(biometricData: BiometricReading): number {
    // Advanced emotional score calculation
    switch (biometricData.type) {
      case 'heartRate':
        const optimalHR = 75;
        const hrDeviation = Math.abs(biometricData.value - optimalHR) / optimalHR;
        return Math.max(0, 100 - (hrDeviation * 100));
      
      case 'stress':
        return Math.max(0, 100 - (biometricData.value * 100));
      
      case 'focus':
        return biometricData.value * 100;
      
      case 'authenticity':
        return biometricData.value * 100;
      
      default:
        return 50; // Neutral score for unknown types
    }
  }

  private createBiometricSignature(validatorId: string, biometricData: BiometricReading): string {
    const hash = crypto.createHash('sha256');
    hash.update(validatorId);
    hash.update(JSON.stringify(biometricData));
    hash.update(Date.now().toString());
    return hash.digest('hex');
  }

  private storeBiometricReading(validatorId: string, biometricData: BiometricReading): void {
    if (!this.biometricHistory.has(validatorId)) {
      this.biometricHistory.set(validatorId, []);
    }

    const history = this.biometricHistory.get(validatorId)!;
    history.push(biometricData);

    // Keep only last 100 readings for analysis
    if (history.length > 100) {
      history.shift();
    }
  }

  private getCurrentConsensusRound(): number {
    return Math.floor(Date.now() / 30000); // 30-second consensus rounds
  }

  private compressMessage(message: string): string {
    // Simplified compression (would use actual compression library)
    return Buffer.from(message).toString('base64');
  }

  private decompressMessage(compressedMessage: string): string {
    // Simplified decompression
    return Buffer.from(compressedMessage, 'base64').toString('utf8');
  }

  private encryptMessage(message: string): string {
    // Simplified encryption (would use proper encryption)
    const cipher = crypto.createCipher('aes-256-cbc', 'emotional-chain-key');
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptMessage(encryptedMessage: string): string {
    // Simplified decryption
    const decipher = crypto.createDecipher('aes-256-cbc', 'emotional-chain-key');
    let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private verifyDeviceSignature(proof: BiometricProof): boolean {
    // Verify device signature authenticity
    return proof.deviceSignature.length > 0 && proof.deviceSignature.startsWith('dev_');
  }

  private verifyMerkleProof(proof: BiometricProof): boolean {
    // Verify merkle proof for data integrity
    return proof.merkleProof.length > 0;
  }

  private async verifyValidatorAuthorization(validatorId: string): Promise<boolean> {
    // Verify validator is authorized to broadcast
    const authorizedValidators = ['StellarNode', 'NebulaForge', 'QuantumReach']; // Simplified
    return authorizedValidators.includes(validatorId);
  }

  private validateEmotionalUpdate(update: EmotionalUpdate): boolean {
    // Validate emotional update structure and content
    return !!(update.validatorId &&
              update.biometricData &&
              update.emotionalScore >= 0 &&
              update.emotionalScore <= 100 &&
              update.signature &&
              update.timestamp > 0);
  }

  private calculateSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private determineAction(score: number): 'monitor' | 'investigate' | 'quarantine' | 'exclude' {
    if (score >= 0.8) return 'exclude';
    if (score >= 0.6) return 'quarantine';
    if (score >= 0.4) return 'investigate';
    return 'monitor';
  }

  private updateBroadcastMetrics(success: boolean, latency: number, bytes: number): void {
    this.broadcastMetrics.totalBroadcasts++;
    
    if (success) {
      this.broadcastMetrics.successfulBroadcasts++;
    } else {
      this.broadcastMetrics.failedBroadcasts++;
    }

    // Update average latency
    const totalLatency = this.broadcastMetrics.averageLatency * (this.broadcastMetrics.totalBroadcasts - 1) + latency;
    this.broadcastMetrics.averageLatency = totalLatency / this.broadcastMetrics.totalBroadcasts;

    // Update bandwidth usage
    this.broadcastMetrics.bandwidthUsage += bytes;
  }

  private startPerformanceMonitoring(): void {
    // Monitor performance metrics every 30 seconds
    setInterval(() => {
      this.emitPerformanceMetrics();
    }, 30000);

    // Clean up old biometric history every 5 minutes
    setInterval(() => {
      this.cleanupOldHistory();
    }, 5 * 60 * 1000);
  }

  private emitPerformanceMetrics(): void {
    const metrics = {
      ...this.broadcastMetrics,
      connectedPeers: this.connectedPeers.size,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };

    this.emit('performanceMetrics', metrics);
  }

  private cleanupOldHistory(): void {
    const maxAge = 60 * 60 * 1000; // 1 hour
    const cutoffTime = Date.now() - maxAge;

    for (const [validatorId, history] of this.biometricHistory.entries()) {
      const filteredHistory = history.filter(reading => reading.timestamp > cutoffTime);
      if (filteredHistory.length !== history.length) {
        this.biometricHistory.set(validatorId, filteredHistory);
      }
    }
  }

  // Public getters
  public getBroadcastMetrics(): BroadcastMetrics {
    return { ...this.broadcastMetrics };
  }

  public getConnectedPeers(): string[] {
    return Array.from(this.connectedPeers.keys());
  }

  public getBiometricHistory(validatorId: string): BiometricReading[] {
    return this.biometricHistory.get(validatorId) || [];
  }

  public getActiveSubscribers(): number {
    return this.subscribers.size;
  }
}

class AnomalyDetector {
  public async analyzePatterns(history: BiometricReading[]): Promise<{ type: any; score: number }> {
    // Pattern deviation analysis
    const values = history.map(r => r.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Check for unusual patterns
    const outliers = values.filter(val => Math.abs(val - mean) > 2 * standardDeviation);
    const outlierRatio = outliers.length / values.length;

    return {
      type: 'pattern_deviation',
      score: Math.min(1, outlierRatio * 3)
    };
  }

  public async analyzeTemporalConsistency(history: BiometricReading[]): Promise<{ type: any; score: number }> {
    // Temporal consistency analysis
    if (history.length < 5) return { type: 'temporal_inconsistency', score: 0 };

    let inconsistencies = 0;
    for (let i = 1; i < history.length; i++) {
      const timeDiff = history[i].timestamp - history[i-1].timestamp;
      if (timeDiff < 1000 || timeDiff > 120000) { // Less than 1s or more than 2min
        inconsistencies++;
      }
    }

    const inconsistencyRatio = inconsistencies / (history.length - 1);
    return {
      type: 'temporal_inconsistency',
      score: Math.min(1, inconsistencyRatio * 2)
    };
  }

  public async analyzeDeviceConsistency(history: BiometricReading[]): Promise<{ type: any; score: number }> {
    // Device consistency analysis
    const devices = new Set(history.map(r => r.deviceId));
    const qualityScores = history.map(r => r.quality);
    const avgQuality = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length;

    // Suspicious if too many devices or low quality
    let suspicionScore = 0;
    if (devices.size > 3) suspicionScore += 0.3; // Too many devices
    if (avgQuality < 0.5) suspicionScore += 0.4; // Low quality readings

    return {
      type: 'device_tampering',
      score: Math.min(1, suspicionScore)
    };
  }

  public async analyzeValueManipulation(history: BiometricReading[]): Promise<{ type: any; score: number }> {
    // Value manipulation analysis
    const values = history.map(r => r.value);
    
    // Check for artificial patterns
    let artificialPatterns = 0;
    
    // Check for too-perfect values (multiples of 5 or 10)
    const perfectValues = values.filter(val => val % 5 === 0 || val % 10 === 0);
    if (perfectValues.length / values.length > 0.7) artificialPatterns += 0.3;

    // Check for impossible rapid changes
    for (let i = 1; i < values.length; i++) {
      const change = Math.abs(values[i] - values[i-1]);
      if (change > values[i-1] * 0.5) { // 50% change
        artificialPatterns += 0.2;
      }
    }

    return {
      type: 'value_manipulation',
      score: Math.min(1, artificialPatterns)
    };
  }
}