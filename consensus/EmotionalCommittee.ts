import * as _ from 'lodash';
import { EmotionalValidator } from './EmotionalValidator';
import { Block } from '../server/blockchain/Block';
/**
 * Dynamic validator committee selection for Proof of Emotion consensus
 * Handles rotation, selection, and anti-collusion mechanisms
 */
export interface CommitteeConfig {
  size: number;
  byzantineThreshold: number;
  rotationPeriod: number; // blocks
  diversityWeight: number; // 0-1, importance of validator diversity
}
export interface CommitteeSelection {
  primary: EmotionalValidator;
  backups: EmotionalValidator[];
  totalEmotionalScore: number;
  averageEmotionalScore: number;
  diversityScore: number;
  selectionTimestamp: number;
}
export class EmotionalCommittee {
  private config: CommitteeConfig;
  private selectedValidators: EmotionalValidator[] = [];
  private primaryValidator: EmotionalValidator | null = null;
  private backupValidators: EmotionalValidator[] = [];
  private selectionHistory: CommitteeSelection[] = [];
  constructor(size: number, byzantineThreshold: number, config: Partial<CommitteeConfig> = {}) {
    this.config = {
      size,
      byzantineThreshold,
      rotationPeriod: 10, // Rotate every 10 blocks
      diversityWeight: 0.3,
      ...config
    };
  }
  async selectValidators(eligibleValidators: EmotionalValidator[]): Promise<void> {
    if (eligibleValidators.length < this.config.size) {
      throw new Error(`Insufficient validators: ${eligibleValidators.length} < ${this.config.size} required`);
    }
    // Calculate selection scores for all validators
    const scoredValidators = await this.calculateSelectionScores(eligibleValidators);
    // Apply anti-collusion filters
    const filteredValidators = this.applyAntiCollusionFilters(scoredValidators);
    // Select primary validator (highest score)
    this.primaryValidator = filteredValidators[0]?.validator || null;
    if (!this.primaryValidator) {
      throw new Error('No suitable primary validator found');
    }
    // Select backup validators using weighted random selection
    this.backupValidators = this.selectBackupValidators(
      filteredValidators.slice(1),
      this.config.size - 1
    );
    // Combine primary and backups
    this.selectedValidators = [this.primaryValidator, ...this.backupValidators];
    // Record selection
    const selection: CommitteeSelection = {
      primary: this.primaryValidator,
      backups: this.backupValidators,
      totalEmotionalScore: _.sumBy(this.selectedValidators, v => v.getEmotionalScore()),
      averageEmotionalScore: _.meanBy(this.selectedValidators, v => v.getEmotionalScore()),
      diversityScore: this.calculateDiversityScore(this.selectedValidators),
      selectionTimestamp: Date.now()
    };
    this.selectionHistory.push(selection);
    // Keep only recent history
    if (this.selectionHistory.length > 100) {
      this.selectionHistory = this.selectionHistory.slice(-100);
    }
  }
  private async calculateSelectionScores(validators: EmotionalValidator[]): Promise<Array<{ validator: EmotionalValidator; score: number }>> {
    const scoredValidators = [];
    for (const validator of validators) {
      // Base score: emotional fitness
      let score = validator.getEmotionalScore();
      // Reputation bonus (0-20 points)
      const reputationBonus = (validator.getReputationScore() / 100) * 20;
      score += reputationBonus;
      // Stake weight (0-10 points)
      const stakeWeight = Math.min(10, (validator.getStake() / 50000) * 10);
      score += stakeWeight;
      // Trend bonus/penalty (-5 to +5 points)
      const trend = validator.getScoreTrend();
      const trendBonus = trend === 'improving' ? 5 : trend === 'declining' ? -5 : 0;
      score += trendBonus;
      // Confidence multiplier
      const confidenceMultiplier = validator.getConfidence() / 100;
      score *= confidenceMultiplier;
      // Diversity bonus (calculated later)
      const diversityBonus = this.calculateValidatorDiversityBonus(validator);
      score += diversityBonus;
      // Anti-repetition penalty
      const repetitionPenalty = this.calculateRepetitionPenalty(validator);
      score -= repetitionPenalty;
      scoredValidators.push({ validator, score });
    }
    // Sort by score (highest first)
    return scoredValidators.sort((a, b) => b.score - a.score);
  }
  private calculateValidatorDiversityBonus(validator: EmotionalValidator): number {
    // Bonus for validators not recently selected
    const recentSelections = this.selectionHistory.slice(-5);
    const recentValidatorIds = new Set(
      recentSelections.flatMap(s => [s.primary.getId(), ...s.backups.map(v => v.getId())])
    );
    return recentValidatorIds.has(validator.getId()) ? 0 : 10;
  }
  private calculateRepetitionPenalty(validator: EmotionalValidator): number {
    // Penalty for validators selected too frequently
    const recentSelections = this.selectionHistory.slice(-10);
    const selectionCount = recentSelections.filter(s => 
      s.primary.getId() === validator.getId() || 
      s.backups.some(v => v.getId() === validator.getId())
    ).length;
    return Math.min(20, selectionCount * 2);
  }
  private applyAntiCollusionFilters(scoredValidators: Array<{ validator: EmotionalValidator; score: number }>): Array<{ validator: EmotionalValidator; score: number }> {
    // Filter out validators with suspicious patterns
    return scoredValidators.filter(({ validator }) => {
      // Check for abnormal emotional patterns
      if (this.detectAbnormalEmotionalPattern(validator)) {
        return false;
      }
      // Check for collusion indicators
      if (this.detectCollusionIndicators(validator)) {
        return false;
      }
      return true;
    });
  }
  private detectAbnormalEmotionalPattern(validator: EmotionalValidator): boolean {
    // Simple heuristic: perfect scores are suspicious
    const emotionalScore = validator.getEmotionalScore();
    const confidence = validator.getConfidence();
    // Perfect score with perfect confidence is suspicious
    if (emotionalScore >= 99 && confidence >= 99) {
      return true;
    }
    // Score that's too consistent (no natural variation)
    // This would require historical data analysis in a real implementation
    return false;
  }
  private detectCollusionIndicators(validator: EmotionalValidator): boolean {
    // Check for validators that always have similar scores (possible coordination)
    // This would require analyzing score correlations with other validators
    // For now, just check reputation
    return validator.getReputationScore() < 30;
  }
  private selectBackupValidators(
    scoredValidators: Array<{ validator: EmotionalValidator; score: number }>,
    count: number
  ): EmotionalValidator[] {
    if (scoredValidators.length <= count) {
      return scoredValidators.map(sv => sv.validator);
    }
    // Use weighted random selection to ensure fairness
    const selected: EmotionalValidator[] = [];
    const candidates = [...scoredValidators];
    for (let i = 0; i < count; i++) {
      if (candidates.length === 0) break;
      // Calculate selection probabilities based on scores
      const totalScore = _.sumBy(candidates, 'score');
      const probabilities = candidates.map(c => c.score / totalScore);
      // Weighted random selection
      const selectedIndex = this.weightedRandomSelect(probabilities);
      selected.push(candidates[selectedIndex].validator);
      // Remove selected validator from candidates
      candidates.splice(selectedIndex, 1);
    }
    return selected;
  }
  private weightedRandomSelect(probabilities: number[]): number {
    const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
    const random = randomByte / 255;
    let cumulativeProbability = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProbability += probabilities[i];
      if (random <= cumulativeProbability) {
        return i;
      }
    }
    // Fallback to last index
    return probabilities.length - 1;
  }
  private calculateDiversityScore(validators: EmotionalValidator[]): number {
    if (validators.length === 0) return 0;
    // Calculate diversity based on different factors
    let diversityScore = 0;
    // Score diversity
    const scores = validators.map(v => v.getEmotionalScore());
    const scoreVariance = this.calculateVariance(scores);
    diversityScore += Math.min(20, scoreVariance);
    // Reputation diversity
    const reputations = validators.map(v => v.getReputationScore());
    const reputationVariance = this.calculateVariance(reputations);
    diversityScore += Math.min(15, reputationVariance / 5);
    // Stake diversity
    const stakes = validators.map(v => v.getStake());
    const stakeVariance = this.calculateVariance(stakes);
    diversityScore += Math.min(15, stakeVariance / 10000);
    return Math.min(100, diversityScore);
  }
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = _.mean(values);
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return _.mean(squaredDiffs);
  }
  // Block proposal broadcasting
  async broadcastProposal(block: Block): Promise<void> {
    if (!this.primaryValidator) {
      throw new Error('No primary validator selected');
    }
    console.log(`📡 Broadcasting block proposal from ${this.primaryValidator.getId()}`);
    // In a real implementation, this would use the P2P network
    // For now, we just validate that the primary validator can propose
    if (!this.primaryValidator.isActive()) {
      throw new Error('Primary validator is not active');
    }
    // Validate the block was actually proposed by the primary validator
    if (block.validatorId !== this.primaryValidator.getId()) {
      throw new Error('Block not proposed by primary validator');
    }
  }
  // Committee management
  shouldRotate(currentBlockHeight: number): boolean {
    const lastSelectionHeight = this.getLastSelectionHeight();
    return (currentBlockHeight - lastSelectionHeight) >= this.config.rotationPeriod;
  }
  private getLastSelectionHeight(): number {
    // This would be stored in the actual implementation
    // For now, assume we rotate every rotation period
    return 0;
  }
  // Validation methods
  hasValidator(validatorId: string): boolean {
    return this.selectedValidators.some(v => v.getId() === validatorId);
  }
  isPrimaryValidator(validatorId: string): boolean {
    return this.primaryValidator?.getId() === validatorId;
  }
  isBackupValidator(validatorId: string): boolean {
    return this.backupValidators.some(v => v.getId() === validatorId);
  }
  // Getters
  getPrimaryValidator(): EmotionalValidator | null {
    return this.primaryValidator;
  }
  getBackupValidators(): EmotionalValidator[] {
    return [...this.backupValidators];
  }
  getValidators(): EmotionalValidator[] {
    return [...this.selectedValidators];
  }
  size(): number {
    return this.selectedValidators.length;
  }
  getConfig(): CommitteeConfig {
    return { ...this.config };
  }
  getSelectionHistory(): CommitteeSelection[] {
    return [...this.selectionHistory];
  }
  // Statistics
  getCommitteeStats(): {
    size: number;
    averageEmotionalScore: number;
    averageReputationScore: number;
    totalStake: number;
    diversityScore: number;
    primaryValidatorId: string | null;
  } {
    if (this.selectedValidators.length === 0) {
      return {
        size: 0,
        averageEmotionalScore: 0,
        averageReputationScore: 0,
        totalStake: 0,
        diversityScore: 0,
        primaryValidatorId: null
      };
    }
    return {
      size: this.selectedValidators.length,
      averageEmotionalScore: _.meanBy(this.selectedValidators, v => v.getEmotionalScore()),
      averageReputationScore: _.meanBy(this.selectedValidators, v => v.getReputationScore()),
      totalStake: _.sumBy(this.selectedValidators, v => v.getStake()),
      diversityScore: this.calculateDiversityScore(this.selectedValidators),
      primaryValidatorId: this.primaryValidator?.getId() || null
    };
  }
  // Committee health check
  validateCommitteeHealth(): { healthy: boolean; issues: string[] } {
    const issues: string[] = [];
    // Check minimum size
    if (this.selectedValidators.length < this.config.size) {
      issues.push(`Committee under-sized: ${this.selectedValidators.length}/${this.config.size}`);
    }
    // Check primary validator
    if (!this.primaryValidator) {
      issues.push('No primary validator selected');
    } else if (!this.primaryValidator.isActive()) {
      issues.push('Primary validator is not active');
    }
    // Check backup validators
    const activeBackups = this.backupValidators.filter(v => v.isActive());
    if (activeBackups.length < Math.ceil(this.config.size * 0.5)) {
      issues.push(`Insufficient active backup validators: ${activeBackups.length}`);
    }
    // Check emotional fitness
    const averageScore = _.meanBy(this.selectedValidators, v => v.getEmotionalScore());
    if (averageScore < 75) {
      issues.push(`Low committee emotional fitness: ${averageScore.toFixed(1)}%`);
    }
    // Check Byzantine threshold
    const activeValidators = this.selectedValidators.filter(v => v.isActive());
    const byzantineResistance = (activeValidators.length / this.selectedValidators.length) * 100;
    if (byzantineResistance < this.config.byzantineThreshold) {
      issues.push(`Byzantine resistance too low: ${byzantineResistance.toFixed(1)}%`);
    }
    return {
      healthy: issues.length === 0,
      issues
    };
  }
  // Emergency procedures
  async replaceValidator(oldValidatorId: string, newValidator: EmotionalValidator): Promise<void> {
    const index = this.selectedValidators.findIndex(v => v.getId() === oldValidatorId);
    if (index === -1) {
      throw new Error('Validator not found in committee');
    }
    // Replace in main list
    this.selectedValidators[index] = newValidator;
    // Update primary/backup lists
    if (this.primaryValidator?.getId() === oldValidatorId) {
      this.primaryValidator = newValidator;
    } else {
      const backupIndex = this.backupValidators.findIndex(v => v.getId() === oldValidatorId);
      if (backupIndex !== -1) {
        this.backupValidators[backupIndex] = newValidator;
      }
    }
  }
  async emergencyReselection(eligibleValidators: EmotionalValidator[]): Promise<void> {
    console.log('🚨 Emergency committee reselection triggered');
    // Clear current selection
    this.selectedValidators = [];
    this.primaryValidator = null;
    this.backupValidators = [];
    // Perform new selection
    await this.selectValidators(eligibleValidators);
  }
}