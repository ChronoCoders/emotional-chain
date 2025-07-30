import { EventEmitter } from 'eventemitter3';
import * as _ from 'lodash';

import { EmotionalValidator } from './EmotionalValidator';
import { ConsensusRound, Vote } from './ConsensusRound';

/**
 * Byzantine fault detection and mitigation for Proof of Emotion consensus
 * Handles malicious validator identification and network security
 */

export interface ByzantineConfig {
  byzantineThreshold: number; // 67% - maximum tolerated Byzantine nodes
  detectionWindow: number; // Time window for pattern analysis (ms)
  suspicionThreshold: number; // Score threshold for suspicious behavior
  quarantineDuration: number; // How long to quarantine suspicious validators (ms)
}

export interface ByzantineEvidence {
  validatorId: string;
  evidenceType: 'double_voting' | 'conflicting_proposals' | 'emotional_manipulation' | 'network_attack' | 'collusion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: any;
  timestamp: number;
  confidence: number; // 0-100, how confident we are in this evidence
}

export interface ByzantineDetection {
  validatorId: string;
  suspicionScore: number;
  evidenceList: ByzantineEvidence[];
  lastDetected: number;
  status: 'monitoring' | 'suspicious' | 'quarantined' | 'slashed';
}

export class ByzantineTolerance extends EventEmitter {
  private config: ByzantineConfig;
  private suspiciousValidators = new Map<string, ByzantineDetection>();
  private evidenceHistory: ByzantineEvidence[] = [];
  private quarantinedValidators = new Set<string>();
  
  // Pattern detection state
  private voteHistory = new Map<string, Vote[]>();
  private proposalHistory = new Map<string, any[]>();
  private emotionalHistory = new Map<string, number[]>();
  
  constructor(config: Partial<ByzantineConfig> = {}) {
    super();
    
    this.config = {
      byzantineThreshold: 67,
      detectionWindow: 300000, // 5 minutes
      suspicionThreshold: 70,
      quarantineDuration: 1800000, // 30 minutes
      ...config
    };
  }
  
  async initialize(): Promise<void> {
    console.log('🛡️  Initializing Byzantine fault tolerance system...');
    
    // Start periodic cleanup
    setInterval(() => {
      this.cleanupOldEvidence();
      this.processQuarantineReleases();
    }, 60000); // Every minute
    
    console.log('✅ Byzantine fault tolerance system initialized');
  }
  
  // Main detection entry point
  async detectByzantineFailures(
    validators: EmotionalValidator[],
    consensusRound: ConsensusRound | null
  ): Promise<ByzantineDetection[]> {
    const detections: ByzantineDetection[] = [];
    
    for (const validator of validators) {
      const detection = await this.analyzeValidator(validator, consensusRound);
      if (detection) {
        detections.push(detection);
      }
    }
    
    return detections;
  }
  
  private async analyzeValidator(
    validator: EmotionalValidator,
    consensusRound: ConsensusRound | null
  ): Promise<ByzantineDetection | null> {
    const validatorId = validator.getId();
    
    // Skip if already quarantined
    if (this.quarantinedValidators.has(validatorId)) {
      return null;
    }
    
    const evidence: ByzantineEvidence[] = [];
    
    // Check for double voting
    const doubleVotingEvidence = await this.detectDoubleVoting(validatorId, consensusRound);
    if (doubleVotingEvidence) {
      evidence.push(doubleVotingEvidence);
    }
    
    // Check for conflicting proposals
    const conflictingProposalEvidence = await this.detectConflictingProposals(validatorId);
    if (conflictingProposalEvidence) {
      evidence.push(conflictingProposalEvidence);
    }
    
    // Check for emotional manipulation
    const emotionalManipulationEvidence = await this.detectEmotionalManipulation(validator);
    if (emotionalManipulationEvidence) {
      evidence.push(emotionalManipulationEvidence);
    }
    
    // Check for network attacks
    const networkAttackEvidence = await this.detectNetworkAttacks(validatorId);
    if (networkAttackEvidence) {
      evidence.push(networkAttackEvidence);
    }
    
    // Check for collusion
    const collusionEvidence = await this.detectCollusion(validatorId, validator);
    if (collusionEvidence) {
      evidence.push(collusionEvidence);
    }
    
    // Calculate suspicion score
    const suspicionScore = this.calculateSuspicionScore(evidence);
    
    if (suspicionScore > this.config.suspicionThreshold || evidence.length > 0) {
      const detection: ByzantineDetection = {
        validatorId,
        suspicionScore,
        evidenceList: evidence,
        lastDetected: Date.now(),
        status: suspicionScore > 90 ? 'quarantined' : 'suspicious'
      };
      
      this.suspiciousValidators.set(validatorId, detection);
      
      // Store evidence
      this.evidenceHistory.push(...evidence);
      
      // Quarantine if highly suspicious
      if (detection.status === 'quarantined') {
        await this.quarantineValidator(validatorId);
      }
      
      console.warn(`⚠️  Byzantine behavior detected: ${validatorId} (score: ${suspicionScore})`);
      this.emit('byzantine-detected', detection);
      
      return detection;
    }
    
    return null;
  }
  
  // Double voting detection
  private async detectDoubleVoting(
    validatorId: string,
    consensusRound: ConsensusRound | null
  ): Promise<ByzantineEvidence | null> {
    if (!consensusRound) return null;
    
    const votes = consensusRound.getVotes();
    const validatorVotes = Array.from(votes.values()).filter(v => v.validatorId === validatorId);
    
    // Check for multiple votes in same round
    if (validatorVotes.length > 1) {
      return {
        validatorId,
        evidenceType: 'double_voting',
        severity: 'critical',
        evidence: {
          roundId: consensusRound.getRoundId(),
          votes: validatorVotes,
          voteCount: validatorVotes.length
        },
        timestamp: Date.now(),
        confidence: 95
      };
    }
    
    // Check historical double voting patterns
    const historicalVotes = this.voteHistory.get(validatorId) || [];
    const recentVotes = historicalVotes.filter(v => 
      Date.now() - v.timestamp < this.config.detectionWindow
    );
    
    // Group by block hash and check for conflicting votes
    const votesByBlock = _.groupBy(recentVotes, 'blockHash');
    for (const [blockHash, blockVotes] of Object.entries(votesByBlock)) {
      if (blockVotes.length > 1) {
        const conflictingVotes = blockVotes.filter((vote, index, arr) => 
          arr.some((other, otherIndex) => 
            index !== otherIndex && vote.approved !== other.approved
          )
        );
        
        if (conflictingVotes.length > 0) {
          return {
            validatorId,
            evidenceType: 'double_voting',
            severity: 'high',
            evidence: {
              blockHash,
              conflictingVotes,
              timeSpan: Math.max(...blockVotes.map(v => v.timestamp)) - Math.min(...blockVotes.map(v => v.timestamp))
            },
            timestamp: Date.now(),
            confidence: 90
          };
        }
      }
    }
    
    return null;
  }
  
  // Conflicting proposal detection
  private async detectConflictingProposals(validatorId: string): Promise<ByzantineEvidence | null> {
    const proposals = this.proposalHistory.get(validatorId) || [];
    const recentProposals = proposals.filter(p => 
      Date.now() - p.timestamp < this.config.detectionWindow
    );
    
    if (recentProposals.length < 2) return null;
    
    // Check for proposals at same height with different content
    const proposalsByHeight = _.groupBy(recentProposals, 'height');
    for (const [height, heightProposals] of Object.entries(proposalsByHeight)) {
      if (heightProposals.length > 1) {
        const uniqueHashes = new Set(heightProposals.map(p => p.hash));
        if (uniqueHashes.size > 1) {
          return {
            validatorId,
            evidenceType: 'conflicting_proposals',
            severity: 'high',
            evidence: {
              height: parseInt(height),
              proposals: heightProposals,
              conflictingHashes: Array.from(uniqueHashes)
            },
            timestamp: Date.now(),
            confidence: 85
          };
        }
      }
    }
    
    return null;
  }
  
  // Emotional manipulation detection
  private async detectEmotionalManipulation(validator: EmotionalValidator): Promise<ByzantineEvidence | null> {
    const validatorId = validator.getId();
    const currentScore = validator.getEmotionalScore();
    
    // Get historical emotional scores
    const historicalScores = this.emotionalHistory.get(validatorId) || [];
    historicalScores.push(currentScore);
    
    // Keep only recent history
    const recentScores = historicalScores.slice(-20);
    this.emotionalHistory.set(validatorId, recentScores);
    
    if (recentScores.length < 5) return null;
    
    // Check for impossible patterns
    const impossibleJumps = this.detectImpossibleEmotionalJumps(recentScores);
    if (impossibleJumps.length > 0) {
      return {
        validatorId,
        evidenceType: 'emotional_manipulation',
        severity: 'high',
        evidence: {
          pattern: 'impossible_jumps',
          jumps: impossibleJumps,
          scores: recentScores
        },
        timestamp: Date.now(),
        confidence: 80
      };
    }
    
    // Check for artificial consistency (too perfect)
    const variance = this.calculateVariance(recentScores);
    if (variance < 0.5 && _.mean(recentScores) > 95) {
      return {
        validatorId,
        evidenceType: 'emotional_manipulation',
        severity: 'medium',
        evidence: {
          pattern: 'artificial_consistency',
          variance,
          averageScore: _.mean(recentScores),
          scores: recentScores
        },
        timestamp: Date.now(),
        confidence: 70
      };
    }
    
    // Check for suspicious correlation with other validators
    const correlationEvidence = await this.detectEmotionalCorrelation(validatorId, recentScores);
    if (correlationEvidence) {
      return correlationEvidence;
    }
    
    return null;
  }
  
  private detectImpossibleEmotionalJumps(scores: number[]): Array<{ from: number; to: number; jump: number; index: number }> {
    const jumps = [];
    
    for (let i = 1; i < scores.length; i++) {
      const jump = Math.abs(scores[i] - scores[i-1]);
      
      // Emotional scores shouldn't jump more than 30 points instantly
      if (jump > 30) {
        jumps.push({
          from: scores[i-1],
          to: scores[i],
          jump,
          index: i
        });
      }
    }
    
    return jumps;
  }
  
  private async detectEmotionalCorrelation(validatorId: string, scores: number[]): Promise<ByzantineEvidence | null> {
    // Check correlation with other validators (potential collusion)
    const otherValidatorScores = new Map<string, number[]>();
    
    for (const [otherId, otherScores] of this.emotionalHistory.entries()) {
      if (otherId !== validatorId && otherScores.length >= scores.length) {
        otherValidatorScores.set(otherId, otherScores.slice(-scores.length));
      }
    }
    
    for (const [otherId, otherScores] of otherValidatorScores.entries()) {
      const correlation = this.calculateCorrelation(scores, otherScores);
      
      // Perfect or near-perfect correlation is suspicious
      if (Math.abs(correlation) > 0.95) {
        return {
          validatorId,
          evidenceType: 'emotional_manipulation',
          severity: 'medium',
          evidence: {
            pattern: 'suspicious_correlation',
            correlatedValidator: otherId,
            correlation,
            scores,
            otherScores
          },
          timestamp: Date.now(),
          confidence: 75
        };
      }
    }
    
    return null;
  }
  
  // Network attack detection
  private async detectNetworkAttacks(validatorId: string): Promise<ByzantineEvidence | null> {
    // This would integrate with network layer monitoring
    // For now, we'll implement basic checks
    
    // Check for excessive message volume (potential DDoS)
    // Check for malformed messages
    // Check for timestamp manipulation
    
    // Placeholder implementation
    return null;
  }
  
  // Collusion detection
  private async detectCollusion(validatorId: string, validator: EmotionalValidator): Promise<ByzantineEvidence | null> {
    // Check for coordinated behavior patterns
    const recentVotes = this.voteHistory.get(validatorId) || [];
    
    if (recentVotes.length < 10) return null;
    
    // Check voting pattern correlation with other validators
    const suspiciousCorrelations = [];
    
    for (const [otherId, otherVotes] of this.voteHistory.entries()) {
      if (otherId === validatorId || otherVotes.length < 10) continue;
      
      // Compare voting patterns
      const correlation = this.calculateVotingCorrelation(recentVotes, otherVotes);
      
      if (correlation > 0.9) {
        suspiciousCorrelations.push({
          validator: otherId,
          correlation
        });
      }
    }
    
    if (suspiciousCorrelations.length > 0) {
      return {
        validatorId,
        evidenceType: 'collusion',
        severity: 'high',
        evidence: {
          correlations: suspiciousCorrelations,
          voteCount: recentVotes.length
        },
        timestamp: Date.now(),
        confidence: 70
      };
    }
    
    return null;
  }
  
  // Utility methods
  private calculateSuspicionScore(evidence: ByzantineEvidence[]): number {
    if (evidence.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const item of evidence) {
      let weight = item.confidence / 100;
      
      // Severity multiplier
      const severityMultiplier = {
        'low': 0.5,
        'medium': 1.0,
        'high': 2.0,
        'critical': 3.0
      }[item.severity];
      
      weight *= severityMultiplier;
      
      totalScore += weight * 100;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? Math.min(100, totalScore / totalWeight) : 0;
  }
  
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = _.mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return _.mean(squaredDiffs);
  }
  
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = _.sum(x);
    const sumY = _.sum(y);
    const sumXY = _.sum(x.map((xi, i) => xi * y[i]));
    const sumXX = _.sum(x.map(xi => xi * xi));
    const sumYY = _.sum(y.map(yi => yi * yi));
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  private calculateVotingCorrelation(votes1: Vote[], votes2: Vote[]): number {
    // Find common block hashes
    const hash1Set = new Set(votes1.map(v => v.blockHash));
    const hash2Set = new Set(votes2.map(v => v.blockHash));
    const commonHashes = Array.from(hash1Set).filter(h => hash2Set.has(h));
    
    if (commonHashes.length < 5) return 0; // Need at least 5 common votes
    
    let agreements = 0;
    for (const hash of commonHashes) {
      const vote1 = votes1.find(v => v.blockHash === hash);
      const vote2 = votes2.find(v => v.blockHash === hash);
      
      if (vote1 && vote2 && vote1.approved === vote2.approved) {
        agreements++;
      }
    }
    
    return agreements / commonHashes.length;
  }
  
  // Quarantine management
  private async quarantineValidator(validatorId: string): Promise<void> {
    this.quarantinedValidators.add(validatorId);
    
    console.log(`🚫 Validator ${validatorId} quarantined for suspicious behavior`);
    
    // Set release timer
    setTimeout(() => {
      this.releaseFromQuarantine(validatorId);
    }, this.config.quarantineDuration);
    
    this.emit('validator-quarantined', validatorId);
  }
  
  private releaseFromQuarantine(validatorId: string): void {
    this.quarantinedValidators.delete(validatorId);
    
    // Reset suspicion status
    const detection = this.suspiciousValidators.get(validatorId);
    if (detection) {
      detection.status = 'monitoring';
      detection.suspicionScore *= 0.5; // Reduce suspicion after quarantine
    }
    
    console.log(`✅ Validator ${validatorId} released from quarantine`);
    this.emit('validator-released', validatorId);
  }
  
  private processQuarantineReleases(): void {
    // Automatic quarantine releases are handled by setTimeout
    // This method can be used for manual reviews
  }
  
  // Evidence cleanup
  private cleanupOldEvidence(): void {
    const cutoffTime = Date.now() - (this.config.detectionWindow * 2);
    
    // Clean evidence history
    this.evidenceHistory = this.evidenceHistory.filter(e => e.timestamp > cutoffTime);
    
    // Clean vote history
    for (const [validatorId, votes] of this.voteHistory.entries()) {
      const recentVotes = votes.filter(v => v.timestamp > cutoffTime);
      if (recentVotes.length > 0) {
        this.voteHistory.set(validatorId, recentVotes);
      } else {
        this.voteHistory.delete(validatorId);
      }
    }
    
    // Clean proposal history
    for (const [validatorId, proposals] of this.proposalHistory.entries()) {
      const recentProposals = proposals.filter(p => p.timestamp > cutoffTime);
      if (recentProposals.length > 0) {
        this.proposalHistory.set(validatorId, recentProposals);
      } else {
        this.proposalHistory.delete(validatorId);
      }
    }
    
    // Clean emotional history (keep more history for trend analysis)
    const emotionalCutoffTime = Date.now() - (this.config.detectionWindow * 5);
    for (const [validatorId, scores] of this.emotionalHistory.entries()) {
      // Keep only recent scores, but more than other histories
      const recentScores = scores.slice(-50);
      this.emotionalHistory.set(validatorId, recentScores);
    }
  }
  
  // Data recording methods (called by consensus engine)
  recordVote(vote: Vote): void {
    const votes = this.voteHistory.get(vote.validatorId) || [];
    votes.push(vote);
    this.voteHistory.set(vote.validatorId, votes);
  }
  
  recordProposal(validatorId: string, proposal: any): void {
    const proposals = this.proposalHistory.get(validatorId) || [];
    proposals.push({
      ...proposal,
      timestamp: Date.now()
    });
    this.proposalHistory.set(validatorId, proposals);
  }
  
  // Public API
  isQuarantined(validatorId: string): boolean {
    return this.quarantinedValidators.has(validatorId);
  }
  
  getSuspiciousValidators(): Map<string, ByzantineDetection> {
    return new Map(this.suspiciousValidators);
  }
  
  getEvidenceHistory(): ByzantineEvidence[] {
    return [...this.evidenceHistory];
  }
  
  getValidatorSuspicion(validatorId: string): ByzantineDetection | null {
    return this.suspiciousValidators.get(validatorId) || null;
  }
  
  // Handle Byzantine failure
  async handleByzantineFailure(error: Error): Promise<void> {
    console.error('🚨 Byzantine failure detected:', error.message);
    
    // Implement emergency procedures
    if (error.message.includes('consensus')) {
      // Consensus failure - might need to halt temporarily
      this.emit('consensus-byzantine-failure', error);
    } else if (error.message.includes('network')) {
      // Network partition or attack
      this.emit('network-byzantine-failure', error);
    }
  }
  
  // Network health assessment
  assessNetworkHealth(validators: EmotionalValidator[]): {
    healthy: boolean;
    byzantineRisk: number;
    details: any;
  } {
    const totalValidators = validators.length;
    const quarantinedCount = this.quarantinedValidators.size;
    const suspiciousCount = this.suspiciousValidators.size;
    
    // Calculate Byzantine risk
    const byzantineRisk = ((quarantinedCount + suspiciousCount * 0.5) / totalValidators) * 100;
    
    // Network is healthy if Byzantine risk is below threshold
    const healthy = byzantineRisk < (100 - this.config.byzantineThreshold);
    
    return {
      healthy,
      byzantineRisk,
      details: {
        totalValidators,
        quarantinedValidators: quarantinedCount,
        suspiciousValidators: suspiciousCount,
        byzantineThreshold: this.config.byzantineThreshold,
        evidenceCount: this.evidenceHistory.length,
        timestamp: Date.now()
      }
    };
  }
}