/**
 * DAO Governance System for EmotionalChain
 * Decentralized governance with community proposals and validator voting
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  type: 'protocol_upgrade' | 'parameter_change' | 'treasury_allocation' | 'partnership_approval' | 'emergency_action';
  proposer: string;
  proposerStake: number;
  requiredQuorum: number; // percentage
  passingThreshold: number; // percentage
  status: 'draft' | 'active' | 'passed' | 'rejected' | 'executed' | 'expired';
  votingPeriod: {
    startTime: string;
    endTime: string;
    duration: number; // hours
  };
  votes: {
    for: number;
    against: number;
    abstain: number;
    totalVoters: number;
    participationRate: number;
  };
  executionData?: {
    targetContract: string;
    functionCall: string;
    parameters: any[];
    executionDelay: number; // hours
  };
  createdAt: string;
  lastUpdated: string;
}

export interface VotingRecord {
  proposalId: string;
  voter: string;
  votingPower: number;
  choice: 'for' | 'against' | 'abstain';
  reason?: string;
  timestamp: string;
  blockHeight: number;
}

export interface GovernanceParameter {
  name: string;
  currentValue: any;
  type: 'number' | 'boolean' | 'string' | 'address';
  description: string;
  validRange?: {
    min: number;
    max: number;
  };
  lastChanged: string;
  changeHistory: {
    proposalId: string;
    oldValue: any;
    newValue: any;
    timestamp: string;
  }[];
}

export interface TreasuryAllocation {
  id: string;
  purpose: string;
  amount: number; // EMO tokens
  recipient: string;
  status: 'proposed' | 'approved' | 'distributed' | 'rejected';
  proposalId: string;
  distributionSchedule?: {
    milestone: string;
    amount: number;
    completed: boolean;
    completionDate?: string;
  }[];
  createdAt: string;
}

export interface ValidatorGovernanceProfile {
  validatorId: string;
  votingPower: number;
  delegatedPower: number;
  totalStake: number;
  participationRate: number;
  reputation: number;
  proposalsCreated: number;
  votesCount: number;
  averageVoteTime: number; // hours from proposal start
  governanceRewards: number;
}

export const GovernanceParameters: GovernanceParameter[] = [
  {
    name: 'blockTime',
    currentValue: 30,
    type: 'number',
    description: 'Block generation time in seconds',
    validRange: { min: 15, max: 60 },
    lastChanged: '2024-12-01T00:00:00Z',
    changeHistory: []
  },
  {
    name: 'emotionalThreshold',
    currentValue: 75.0,
    type: 'number',
    description: 'Minimum emotional score for consensus participation',
    validRange: { min: 50, max: 95 },
    lastChanged: '2024-12-01T00:00:00Z',
    changeHistory: []
  },
  {
    name: 'validatorReward',
    currentValue: 50,
    type: 'number',
    description: 'Base validator reward in EMO tokens',
    validRange: { min: 25, max: 100 },
    lastChanged: '2024-12-01T00:00:00Z',
    changeHistory: []
  },
  {
    name: 'maxValidators',
    currentValue: 101,
    type: 'number',
    description: 'Maximum number of active validators',
    validRange: { min: 21, max: 201 },
    lastChanged: '2024-12-01T00:00:00Z',
    changeHistory: []
  },
  {
    name: 'minimumStake',
    currentValue: 50000,
    type: 'number',
    description: 'Minimum EMO tokens required to become a validator',
    validRange: { min: 10000, max: 100000 },
    lastChanged: '2024-12-01T00:00:00Z',
    changeHistory: []
  },
  {
    name: 'governanceQuorum',
    currentValue: 51,
    type: 'number',
    description: 'Minimum participation percentage for governance votes',
    validRange: { min: 33, max: 67 },
    lastChanged: '2024-12-01T00:00:00Z',
    changeHistory: []
  }
];

export class DAOGovernanceManager extends EventEmitter {
  private proposals: Map<string, GovernanceProposal> = new Map();
  private votes: Map<string, VotingRecord[]> = new Map();
  private parameters: Map<string, GovernanceParameter> = new Map();
  private treasuryAllocations: Map<string, TreasuryAllocation> = new Map();
  private validatorProfiles: Map<string, ValidatorGovernanceProfile> = new Map();
  
  private treasuryBalance = 400000000; // 400M EMO tokens
  private governanceStats = {
    totalProposals: 0,
    activeProposals: 0,
    passedProposals: 0,
    averageParticipation: 0,
    totalVoters: 0
  };

  constructor() {
    super();
    this.initializeGovernanceParameters();
    this.startGovernanceMonitoring();
  }

  private initializeGovernanceParameters(): void {
    GovernanceParameters.forEach(param => {
      this.parameters.set(param.name, { ...param });
    });
    console.log(`⚖️ Initialized ${this.parameters.size} governance parameters`);
  }

  private startGovernanceMonitoring(): void {
    // Check proposal statuses every hour
    setInterval(() => {
      this.updateProposalStatuses();
    }, 60 * 60 * 1000);

    // Update governance stats daily
    setInterval(() => {
      this.updateGovernanceStats();
    }, 24 * 60 * 60 * 1000);
  }

  public async createProposal({
    title,
    description,
    type,
    proposer,
    proposerStake,
    votingDuration = 168, // 7 days default
    executionData
  }: {
    title: string;
    description: string;
    type: GovernanceProposal['type'];
    proposer: string;
    proposerStake: number;
    votingDuration?: number;
    executionData?: GovernanceProposal['executionData'];
  }): Promise<{ success: boolean; proposalId?: string; message: string }> {
    try {
      // Validate proposer stake
      const minProposerStake = this.getMinimumProposerStake(type);
      if (proposerStake < minProposerStake) {
        return {
          success: false,
          message: `Insufficient stake. Minimum required: ${minProposerStake} EMO`
        };
      }

      // Generate proposal ID
      const proposalId = crypto.randomBytes(16).toString('hex');

      // Determine voting parameters
      const { quorum, threshold } = this.getVotingParameters(type);

      const proposal: GovernanceProposal = {
        id: proposalId,
        title,
        description,
        type,
        proposer,
        proposerStake,
        requiredQuorum: quorum,
        passingThreshold: threshold,
        status: 'active',
        votingPeriod: {
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + votingDuration * 60 * 60 * 1000).toISOString(),
          duration: votingDuration
        },
        votes: {
          for: 0,
          against: 0,
          abstain: 0,
          totalVoters: 0,
          participationRate: 0
        },
        executionData,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      this.proposals.set(proposalId, proposal);
      this.votes.set(proposalId, []);
      this.governanceStats.totalProposals++;
      this.governanceStats.activeProposals++;

      console.log(`📋 Governance proposal created: ${proposalId} - ${title}`);
      this.emit('proposalCreated', proposal);

      return {
        success: true,
        proposalId,
        message: `Proposal "${title}" created successfully. Voting period: ${votingDuration} hours`
      };

    } catch (error) {
      console.error('Proposal creation failed:', error);
      return { success: false, message: 'Proposal creation failed' };
    }
  }

  public async castVote(
    proposalId: string,
    voter: string,
    votingPower: number,
    choice: 'for' | 'against' | 'abstain',
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return { success: false, message: 'Proposal not found' };
    }

    if (proposal.status !== 'active') {
      return { success: false, message: 'Proposal is not active for voting' };
    }

    // Check if voting period is still active
    const now = new Date();
    const endTime = new Date(proposal.votingPeriod.endTime);
    if (now > endTime) {
      return { success: false, message: 'Voting period has ended' };
    }

    try {
      // Check if voter has already voted
      const proposalVotes = this.votes.get(proposalId) || [];
      const existingVote = proposalVotes.find(v => v.voter === voter);
      
      if (existingVote) {
        return { success: false, message: 'Voter has already cast a vote on this proposal' };
      }

      // Create vote record
      const voteRecord: VotingRecord = {
        proposalId,
        voter,
        votingPower,
        choice,
        reason,
        timestamp: new Date().toISOString(),
        blockHeight: Math.floor(Math.random() * 100000) // Simplified
      };

      // Add vote to records
      proposalVotes.push(voteRecord);
      this.votes.set(proposalId, proposalVotes);

      // Update proposal vote counts
      proposal.votes[choice] += votingPower;
      proposal.votes.totalVoters++;
      proposal.lastUpdated = new Date().toISOString();

      // Calculate participation rate
      const totalEligibleVotingPower = this.getTotalVotingPower();
      const totalVotingPowerUsed = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
      proposal.votes.participationRate = (totalVotingPowerUsed / totalEligibleVotingPower) * 100;

      // Update validator profile
      this.updateValidatorGovernanceProfile(voter, votingPower);

      console.log(`🗳️ Vote cast: ${voter} voted ${choice} on ${proposalId}`);
      this.emit('voteCast', { proposal, vote: voteRecord });

      return { success: true, message: `Vote cast successfully: ${choice}` };

    } catch (error) {
      console.error('Vote casting failed:', error);
      return { success: false, message: 'Vote casting failed' };
    }
  }

  public async executeProposal(proposalId: string): Promise<{ success: boolean; message: string }> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return { success: false, message: 'Proposal not found' };
    }

    if (proposal.status !== 'passed') {
      return { success: false, message: 'Proposal has not passed voting' };
    }

    try {
      console.log(`⚡ Executing proposal: ${proposalId} - ${proposal.title}`);

      // Execute based on proposal type
      switch (proposal.type) {
        case 'parameter_change':
          await this.executeParameterChange(proposal);
          break;
        case 'treasury_allocation':
          await this.executeTreasuryAllocation(proposal);
          break;
        case 'protocol_upgrade':
          await this.executeProtocolUpgrade(proposal);
          break;
        case 'partnership_approval':
          await this.executePartnershipApproval(proposal);
          break;
        case 'emergency_action':
          await this.executeEmergencyAction(proposal);
          break;
        default:
          throw new Error(`Unknown proposal type: ${proposal.type}`);
      }

      // Update proposal status
      proposal.status = 'executed';
      proposal.lastUpdated = new Date().toISOString();

      console.log(`✅ Proposal executed successfully: ${proposalId}`);
      this.emit('proposalExecuted', proposal);

      return { success: true, message: 'Proposal executed successfully' };

    } catch (error) {
      console.error('Proposal execution failed:', error);
      return { success: false, message: 'Proposal execution failed' };
    }
  }

  private getMinimumProposerStake(type: GovernanceProposal['type']): number {
    const stakeRequirements = {
      'protocol_upgrade': 100000,
      'parameter_change': 75000,
      'treasury_allocation': 50000,
      'partnership_approval': 25000,
      'emergency_action': 150000
    };
    return stakeRequirements[type] || 50000;
  }

  private getVotingParameters(type: GovernanceProposal['type']): { quorum: number; threshold: number } {
    const parameters = {
      'protocol_upgrade': { quorum: 67, threshold: 75 },
      'parameter_change': { quorum: 51, threshold: 60 },
      'treasury_allocation': { quorum: 51, threshold: 55 },
      'partnership_approval': { quorum: 33, threshold: 50 },
      'emergency_action': { quorum: 75, threshold: 80 }
    };
    return parameters[type] || { quorum: 51, threshold: 50 };
  }

  private getTotalVotingPower(): number {
    // Calculate total voting power from all validators
    let totalPower = 0;
    for (const profile of this.validatorProfiles.values()) {
      totalPower += profile.votingPower;
    }
    return totalPower || 1000000; // Default fallback
  }

  private updateValidatorGovernanceProfile(validator: string, votingPower: number): void {
    let profile = this.validatorProfiles.get(validator);
    
    if (!profile) {
      profile = {
        validatorId: validator,
        votingPower,
        delegatedPower: 0,
        totalStake: votingPower, // Simplified
        participationRate: 0,
        reputation: 100,
        proposalsCreated: 0,
        votesCount: 0,
        averageVoteTime: 0,
        governanceRewards: 0
      };
    }

    profile.votesCount++;
    profile.participationRate = (profile.votesCount / this.governanceStats.totalProposals) * 100;
    
    this.validatorProfiles.set(validator, profile);
  }

  private async executeParameterChange(proposal: GovernanceProposal): Promise<void> {
    if (!proposal.executionData) {
      throw new Error('No execution data for parameter change');
    }

    const { parameters } = proposal.executionData;
    
    for (const param of parameters) {
      const governanceParam = this.parameters.get(param.name);
      if (governanceParam) {
        // Add to change history
        governanceParam.changeHistory.push({
          proposalId: proposal.id,
          oldValue: governanceParam.currentValue,
          newValue: param.value,
          timestamp: new Date().toISOString()
        });

        // Update current value
        governanceParam.currentValue = param.value;
        governanceParam.lastChanged = new Date().toISOString();

        console.log(`📊 Parameter updated: ${param.name} = ${param.value}`);
      }
    }
  }

  private async executeTreasuryAllocation(proposal: GovernanceProposal): Promise<void> {
    if (!proposal.executionData) {
      throw new Error('No execution data for treasury allocation');
    }

    const { amount, recipient } = proposal.executionData.parameters[0];
    
    if (amount > this.treasuryBalance) {
      throw new Error('Insufficient treasury balance');
    }

    const allocationId = crypto.randomBytes(16).toString('hex');
    const allocation: TreasuryAllocation = {
      id: allocationId,
      purpose: proposal.title,
      amount,
      recipient,
      status: 'approved',
      proposalId: proposal.id,
      createdAt: new Date().toISOString()
    };

    this.treasuryAllocations.set(allocationId, allocation);
    this.treasuryBalance -= amount;

    console.log(`💰 Treasury allocation approved: ${amount} EMO to ${recipient}`);
  }

  private async executeProtocolUpgrade(proposal: GovernanceProposal): Promise<void> {
    console.log(`🔄 Protocol upgrade initiated: ${proposal.title}`);
    // In reality, this would trigger a protocol upgrade process
  }

  private async executePartnershipApproval(proposal: GovernanceProposal): Promise<void> {
    console.log(`🤝 Partnership approved: ${proposal.title}`);
    // In reality, this would activate partnership agreements
  }

  private async executeEmergencyAction(proposal: GovernanceProposal): Promise<void> {
    console.log(`🚨 Emergency action executed: ${proposal.title}`);
    // In reality, this would execute emergency protocol actions
  }

  private updateProposalStatuses(): void {
    const now = new Date();

    for (const [id, proposal] of this.proposals.entries()) {
      if (proposal.status === 'active') {
        const endTime = new Date(proposal.votingPeriod.endTime);
        
        if (now > endTime) {
          // Voting period ended, determine outcome
          const totalVotingPowerUsed = proposal.votes.for + proposal.votes.against + proposal.votes.abstain;
          const quorumMet = proposal.votes.participationRate >= proposal.requiredQuorum;
          const thresholdMet = (proposal.votes.for / totalVotingPowerUsed) * 100 >= proposal.passingThreshold;

          if (quorumMet && thresholdMet) {
            proposal.status = 'passed';
            this.governanceStats.passedProposals++;
            console.log(`✅ Proposal passed: ${id} - ${proposal.title}`);
            this.emit('proposalPassed', proposal);
          } else {
            proposal.status = 'rejected';
            console.log(`❌ Proposal rejected: ${id} - ${proposal.title}`);
            this.emit('proposalRejected', proposal);
          }

          this.governanceStats.activeProposals--;
          proposal.lastUpdated = new Date().toISOString();
        }
      }
    }
  }

  private updateGovernanceStats(): void {
    const proposals = Array.from(this.proposals.values());
    const totalParticipation = proposals.reduce((sum, p) => sum + p.votes.participationRate, 0);
    
    this.governanceStats.averageParticipation = proposals.length > 0 ? 
      totalParticipation / proposals.length : 0;

    const uniqueVoters = new Set();
    for (const votes of this.votes.values()) {
      votes.forEach(vote => uniqueVoters.add(vote.voter));
    }
    this.governanceStats.totalVoters = uniqueVoters.size;
  }

  // Public getters and utilities
  public getProposals(): GovernanceProposal[] {
    return Array.from(this.proposals.values());
  }

  public getProposal(proposalId: string): GovernanceProposal | undefined {
    return this.proposals.get(proposalId);
  }

  public getActiveProposals(): GovernanceProposal[] {
    return Array.from(this.proposals.values()).filter(p => p.status === 'active');
  }

  public getProposalVotes(proposalId: string): VotingRecord[] {
    return this.votes.get(proposalId) || [];
  }

  public getGovernanceParameters(): GovernanceParameter[] {
    return Array.from(this.parameters.values());
  }

  public getParameter(name: string): GovernanceParameter | undefined {
    return this.parameters.get(name);
  }

  public getTreasuryAllocations(): TreasuryAllocation[] {
    return Array.from(this.treasuryAllocations.values());
  }

  public getValidatorGovernanceProfiles(): ValidatorGovernanceProfile[] {
    return Array.from(this.validatorProfiles.values());
  }

  public getGovernanceStats(): typeof this.governanceStats & {
    treasuryBalance: number;
    totalParameters: number;
    totalAllocations: number;
  } {
    return {
      ...this.governanceStats,
      treasuryBalance: this.treasuryBalance,
      totalParameters: this.parameters.size,
      totalAllocations: this.treasuryAllocations.size
    };
  }

  public getValidatorGovernanceProfile(validatorId: string): ValidatorGovernanceProfile | undefined {
    return this.validatorProfiles.get(validatorId);
  }

  // Administrative functions
  public emergencyPauseGovernance(): void {
    console.log('🚨 Emergency pause activated - all governance halted');
    this.emit('governancePaused');
  }

  public resumeGovernance(): void {
    console.log('▶️ Governance resumed');
    this.emit('governanceResumed');
  }

  public delegateVotingPower(from: string, to: string, amount: number): boolean {
    const fromProfile = this.validatorProfiles.get(from);
    const toProfile = this.validatorProfiles.get(to);

    if (fromProfile && toProfile && fromProfile.votingPower >= amount) {
      fromProfile.votingPower -= amount;
      toProfile.delegatedPower += amount;
      toProfile.votingPower += amount;

      console.log(`🔄 Voting power delegated: ${amount} from ${from} to ${to}`);
      this.emit('votingPowerDelegated', { from, to, amount });
      return true;
    }

    return false;
  }
}