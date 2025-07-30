/**
 * EmotionalChain Public Token Sale Implementation
 * Multi-tier token sale with KYC/AML compliance and vesting schedules
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface TokenSalePhase {
  name: string;
  allocation: number;
  price: number;
  minPurchase: number;
  maxPurchase?: number;
  participants: 'accredited_investors' | 'institutions' | 'public' | 'community';
  vestingMonths: number;
  startDate: string;
  endDate: string;
  sold: number;
  active: boolean;
}

export interface InvestorProfile {
  investorId: string;
  email: string;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  amlStatus: 'pending' | 'approved' | 'rejected';
  accreditationStatus: 'retail' | 'accredited' | 'institutional';
  jurisdiction: string;
  investmentLimit: number;
  totalInvested: number;
  kycDocuments: {
    idDocument: boolean;
    proofOfAddress: boolean;
    sourceOfFunds: boolean;
    accreditationProof?: boolean;
  };
  riskScore: number;
  createdAt: string;
  lastUpdated: string;
}

export interface TokenPurchase {
  purchaseId: string;
  investorId: string;
  phase: string;
  tokenAmount: number;
  usdAmount: number;
  paymentMethod: 'ETH' | 'BTC' | 'USDC' | 'USDT' | 'WIRE' | 'CARD';
  paymentAddress?: string;
  transactionHash?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  vestingSchedule: VestingSchedule;
  purchaseDate: string;
  confirmationDate?: string;
}

export interface VestingSchedule {
  totalTokens: number;
  cliffMonths: number;
  vestingMonths: number;
  releasedTokens: number;
  schedule: {
    releaseDate: string;
    amount: number;
    released: boolean;
  }[];
}

export interface AntiWhaleRule {
  maxPurchasePercentage: number; // Max % of phase allocation per investor
  maxWalletPercentage: number;   // Max % of total supply per wallet
  cooldownPeriod: number;        // Days between large purchases
  whaleThreshold: number;        // USD amount that triggers whale status
}

export interface GeographicRestriction {
  restrictedCountries: string[];
  sanctionedEntities: string[];
  allowedJurisdictions: string[];
  requiresAccreditation: string[];
}

export const TokenSaleConfig = {
  phases: [
    {
      name: 'Private Sale',
      allocation: 300000,           // 300k EMO (6%)
      price: 0.10,                  // $0.10 per EMO
      minPurchase: 10000,           // 10k EMO minimum
      maxPurchase: 50000,           // 50k EMO maximum
      participants: 'accredited_investors' as const,
      vestingMonths: 24,
      startDate: '2024-12-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      sold: 0,
      active: true
    },
    {
      name: 'Strategic Sale',
      allocation: 500000,           // 500k EMO (10%)
      price: 0.15,                  // $0.15 per EMO
      minPurchase: 5000,            // 5k EMO minimum
      maxPurchase: 100000,          // 100k EMO maximum
      participants: 'institutions' as const,
      vestingMonths: 18,
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-02-28T23:59:59Z',
      sold: 0,
      active: false
    },
    {
      name: 'Public Sale',
      allocation: 700000,           // 700k EMO (14%)
      price: 0.25,                  // $0.25 per EMO
      minPurchase: 100,             // 100 EMO minimum
      maxPurchase: 10000,           // 10k EMO maximum
      participants: 'public' as const,
      vestingMonths: 6,
      startDate: '2025-03-01T00:00:00Z',
      endDate: '2025-03-31T23:59:59Z',
      sold: 0,
      active: false
    }
  ] as TokenSalePhase[],
  
  paymentMethods: ['ETH', 'BTC', 'USDC', 'USDT', 'WIRE', 'CARD'],
  
  lockupPeriods: {
    team: 48,                       // 4 years
    advisors: 24,                   // 2 years
    ecosystem: 36,                  // 3 years
    foundation: 60                  // 5 years
  },

  antiWhaleRules: {
    maxPurchasePercentage: 5,       // Max 5% of phase allocation per investor
    maxWalletPercentage: 1,         // Max 1% of total supply per wallet
    cooldownPeriod: 7,              // 7 days between large purchases
    whaleThreshold: 100000          // $100k triggers whale status
  } as AntiWhaleRule,

  geographicRestrictions: {
    restrictedCountries: ['US-NY', 'CN', 'IR', 'KP', 'SY'],
    sanctionedEntities: [],
    allowedJurisdictions: ['US', 'EU', 'UK', 'CA', 'AU', 'SG', 'JP', 'KR'],
    requiresAccreditation: ['US']
  } as GeographicRestriction
};

export class TokenSaleManager extends EventEmitter {
  private phases: Map<string, TokenSalePhase> = new Map();
  private investors: Map<string, InvestorProfile> = new Map();
  private purchases: Map<string, TokenPurchase> = new Map();
  private vestingSchedules: Map<string, VestingSchedule> = new Map();
  private saleStats = {
    totalRaised: 0,
    totalSold: 0,
    uniqueInvestors: 0,
    averageInvestment: 0
  };

  constructor() {
    super();
    this.initializePhases();
    this.startVestingProcessor();
    this.startComplianceMonitoring();
  }

  private initializePhases(): void {
    TokenSaleConfig.phases.forEach(phase => {
      this.phases.set(phase.name, { ...phase });
    });
    console.log(`💰 Initialized ${this.phases.size} token sale phases`);
  }

  private startVestingProcessor(): void {
    // Process vesting releases daily
    setInterval(() => {
      this.processVestingReleases();
    }, 24 * 60 * 60 * 1000);
  }

  private startComplianceMonitoring(): void {
    // Monitor compliance daily
    setInterval(() => {
      this.monitorCompliance();
    }, 24 * 60 * 60 * 1000);
  }

  public async registerInvestor(
    email: string,
    jurisdiction: string,
    accreditationStatus: 'retail' | 'accredited' | 'institutional'
  ): Promise<{ success: boolean; investorId?: string; message: string }> {
    try {
      // Check geographic restrictions
      if (TokenSaleConfig.geographicRestrictions.restrictedCountries.includes(jurisdiction)) {
        return { success: false, message: 'Investment not permitted from this jurisdiction' };
      }

      // Generate investor ID
      const investorId = crypto.randomBytes(16).toString('hex');

      // Determine investment limit based on accreditation
      let investmentLimit = 10000; // Default for retail
      if (accreditationStatus === 'accredited') investmentLimit = 100000;
      if (accreditationStatus === 'institutional') investmentLimit = 1000000;

      const investor: InvestorProfile = {
        investorId,
        email,
        kycStatus: 'pending',
        amlStatus: 'pending',
        accreditationStatus,
        jurisdiction,
        investmentLimit,
        totalInvested: 0,
        kycDocuments: {
          idDocument: false,
          proofOfAddress: false,
          sourceOfFunds: false,
          accreditationProof: accreditationStatus !== 'retail' ? false : undefined
        },
        riskScore: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      this.investors.set(investorId, investor);
      
      console.log(`👤 Investor registered: ${investorId} (${accreditationStatus})`);
      this.emit('investorRegistered', investor);

      return { success: true, investorId, message: 'Registration successful. Please complete KYC.' };

    } catch (error) {
      console.error('Investor registration failed:', error);
      return { success: false, message: 'Registration failed' };
    }
  }

  public async completeKYC(
    investorId: string,
    documents: {
      idDocument: boolean;
      proofOfAddress: boolean;
      sourceOfFunds: boolean;
      accreditationProof?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> {
    const investor = this.investors.get(investorId);
    if (!investor) {
      return { success: false, message: 'Investor not found' };
    }

    // Update documents
    investor.kycDocuments = { ...documents };

    // Check if all required documents are provided
    const requiredDocs = ['idDocument', 'proofOfAddress', 'sourceOfFunds'];
    if (investor.accreditationStatus !== 'retail') {
      requiredDocs.push('accreditationProof');
    }

    const allDocsProvided = requiredDocs.every(doc => 
      investor.kycDocuments[doc as keyof typeof investor.kycDocuments] === true
    );

    if (allDocsProvided) {
      // Simulate KYC approval (in reality, this would involve external verification)
      investor.kycStatus = 'approved';
      investor.amlStatus = 'approved';
      investor.riskScore = Math.random() * 50; // Low risk score
      investor.lastUpdated = new Date().toISOString();

      console.log(`✅ KYC approved for investor ${investorId}`);
      this.emit('kycApproved', investor);

      return { success: true, message: 'KYC approved. You can now participate in token sales.' };
    } else {
      return { success: false, message: 'Missing required documents' };
    }
  }

  public async purchaseTokens(
    investorId: string,
    phaseName: string,
    tokenAmount: number,
    paymentMethod: string
  ): Promise<{ success: boolean; purchaseId?: string; message: string }> {
    try {
      const investor = this.investors.get(investorId);
      const phase = this.phases.get(phaseName);

      if (!investor) {
        return { success: false, message: 'Investor not found' };
      }

      if (!phase) {
        return { success: false, message: 'Sale phase not found' };
      }

      // Validate investor eligibility
      const eligibilityCheck = await this.validateInvestorEligibility(investor, phase, tokenAmount);
      if (!eligibilityCheck.eligible) {
        return { success: false, message: eligibilityCheck.reason };
      }

      // Anti-whale validation
      const whaleCheck = this.validateAntiWhaleRules(investor, phase, tokenAmount);
      if (!whaleCheck.valid) {
        return { success: false, message: whaleCheck.reason };
      }

      // Calculate USD amount
      const usdAmount = tokenAmount * phase.price;

      // Generate purchase ID
      const purchaseId = crypto.randomBytes(16).toString('hex');

      // Create vesting schedule
      const vestingSchedule = this.createVestingSchedule(tokenAmount, phase.vestingMonths);

      const purchase: TokenPurchase = {
        purchaseId,
        investorId,
        phase: phaseName,
        tokenAmount,
        usdAmount,
        paymentMethod: paymentMethod as any,
        status: 'pending',
        vestingSchedule,
        purchaseDate: new Date().toISOString()
      };

      // Process payment (simplified)
      const paymentResult = await this.processPayment(purchase);
      if (!paymentResult.success) {
        return { success: false, message: paymentResult.message };
      }

      // Update records
      this.purchases.set(purchaseId, purchase);
      this.vestingSchedules.set(purchaseId, vestingSchedule);
      
      // Update phase and investor stats
      phase.sold += tokenAmount;
      investor.totalInvested += usdAmount;
      investor.lastUpdated = new Date().toISOString();

      // Update sale stats
      this.updateSaleStats();

      console.log(`💳 Token purchase completed: ${purchaseId} (${tokenAmount} EMO)`);
      this.emit('tokensPurchased', purchase);

      return { 
        success: true, 
        purchaseId, 
        message: `Successfully purchased ${tokenAmount} EMO tokens. Vesting starts after ${phase.vestingMonths} months.`
      };

    } catch (error) {
      console.error('Token purchase failed:', error);
      return { success: false, message: 'Purchase failed' };
    }
  }

  private async validateInvestorEligibility(
    investor: InvestorProfile,
    phase: TokenSalePhase,
    tokenAmount: number
  ): Promise<{ eligible: boolean; reason: string }> {
    // Check KYC status
    if (investor.kycStatus !== 'approved') {
      return { eligible: false, reason: 'KYC not approved' };
    }

    // Check AML status
    if (investor.amlStatus !== 'approved') {
      return { eligible: false, reason: 'AML check not approved' };
    }

    // Check phase activity
    if (!phase.active) {
      return { eligible: false, reason: 'Sale phase not active' };
    }

    // Check phase timing
    const now = new Date();
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    
    if (now < phaseStart || now > phaseEnd) {
      return { eligible: false, reason: 'Sale phase not in progress' };
    }

    // Check participant type eligibility
    if (!this.isEligibleParticipant(investor, phase.participants)) {
      return { eligible: false, reason: 'Not eligible for this phase' };
    }

    // Check minimum/maximum purchase amounts
    if (tokenAmount < phase.minPurchase) {
      return { eligible: false, reason: `Minimum purchase: ${phase.minPurchase} EMO` };
    }

    if (phase.maxPurchase && tokenAmount > phase.maxPurchase) {
      return { eligible: false, reason: `Maximum purchase: ${phase.maxPurchase} EMO` };
    }

    // Check investment limit
    const usdAmount = tokenAmount * phase.price;
    if (investor.totalInvested + usdAmount > investor.investmentLimit) {
      return { eligible: false, reason: 'Investment limit exceeded' };
    }

    // Check phase allocation
    if (phase.sold + tokenAmount > phase.allocation) {
      return { eligible: false, reason: 'Insufficient tokens available in this phase' };
    }

    return { eligible: true, reason: 'Eligible' };
  }

  private validateAntiWhaleRules(
    investor: InvestorProfile,
    phase: TokenSalePhase,
    tokenAmount: number
  ): { valid: boolean; reason: string } {
    const rules = TokenSaleConfig.antiWhaleRules;
    const usdAmount = tokenAmount * phase.price;

    // Check maximum purchase percentage per phase
    const maxTokensPerPhase = (phase.allocation * rules.maxPurchasePercentage) / 100;
    if (tokenAmount > maxTokensPerPhase) {
      return { 
        valid: false, 
        reason: `Maximum ${rules.maxPurchasePercentage}% of phase allocation (${maxTokensPerPhase} EMO)` 
      };
    }

    // Check whale threshold
    if (usdAmount >= rules.whaleThreshold) {
      // Additional verification required for whales
      if (investor.riskScore > 25) {
        return { valid: false, reason: 'Additional verification required for large purchases' };
      }
    }

    return { valid: true, reason: 'Valid' };
  }

  private isEligibleParticipant(
    investor: InvestorProfile,
    participantType: string
  ): boolean {
    switch (participantType) {
      case 'accredited_investors':
        return investor.accreditationStatus === 'accredited';
      case 'institutions':
        return investor.accreditationStatus === 'institutional';
      case 'public':
        return true; // All investor types eligible
      case 'community':
        return investor.accreditationStatus === 'retail';
      default:
        return false;
    }
  }

  private createVestingSchedule(tokenAmount: number, vestingMonths: number): VestingSchedule {
    const schedule: VestingSchedule = {
      totalTokens: tokenAmount,
      cliffMonths: 0, // No cliff for public sale
      vestingMonths,
      releasedTokens: 0,
      schedule: []
    };

    // Create monthly release schedule
    const tokensPerMonth = tokenAmount / vestingMonths;
    const now = new Date();

    for (let month = 1; month <= vestingMonths; month++) {
      const releaseDate = new Date(now);
      releaseDate.setMonth(now.getMonth() + month);

      schedule.schedule.push({
        releaseDate: releaseDate.toISOString(),
        amount: tokensPerMonth,
        released: false
      });
    }

    return schedule;
  }

  private async processPayment(purchase: TokenPurchase): Promise<{ success: boolean; message: string }> {
    // Simplified payment processing
    // In reality, this would integrate with payment processors
    
    try {
      switch (purchase.paymentMethod) {
        case 'ETH':
        case 'BTC':
        case 'USDC':
        case 'USDT':
          // Generate crypto payment address
          purchase.paymentAddress = crypto.randomBytes(20).toString('hex');
          purchase.status = 'pending';
          break;
          
        case 'WIRE':
        case 'CARD':
          // Process fiat payment
          purchase.status = 'confirmed';
          purchase.confirmationDate = new Date().toISOString();
          break;
          
        default:
          return { success: false, message: 'Unsupported payment method' };
      }

      return { success: true, message: 'Payment initiated' };

    } catch (error) {
      return { success: false, message: 'Payment processing failed' };
    }
  }

  private processVestingReleases(): void {
    console.log('🔄 Processing vesting releases...');
    
    const now = new Date();
    let releasesProcessed = 0;

    for (const [purchaseId, vestingSchedule] of this.vestingSchedules.entries()) {
      for (const release of vestingSchedule.schedule) {
        if (!release.released && new Date(release.releaseDate) <= now) {
          release.released = true;
          vestingSchedule.releasedTokens += release.amount;
          releasesProcessed++;

          this.emit('tokensVested', {
            purchaseId,
            amount: release.amount,
            totalReleased: vestingSchedule.releasedTokens,
            totalTokens: vestingSchedule.totalTokens
          });
        }
      }
    }

    if (releasesProcessed > 0) {
      console.log(`✅ Processed ${releasesProcessed} vesting releases`);
    }
  }

  private monitorCompliance(): void {
    console.log('🔍 Monitoring compliance...');
    
    // Check for expired KYC documents
    for (const [investorId, investor] of this.investors.entries()) {
      const kycAge = Date.now() - new Date(investor.lastUpdated).getTime();
      const oneYear = 365 * 24 * 60 * 60 * 1000;
      
      if (kycAge > oneYear && investor.kycStatus === 'approved') {
        investor.kycStatus = 'expired';
        console.warn(`⚠️ KYC expired for investor ${investorId}`);
        this.emit('kycExpired', investor);
      }
    }
  }

  private updateSaleStats(): void {
    const purchases = Array.from(this.purchases.values());
    
    this.saleStats.totalRaised = purchases.reduce((sum, p) => sum + p.usdAmount, 0);
    this.saleStats.totalSold = purchases.reduce((sum, p) => sum + p.tokenAmount, 0);
    this.saleStats.uniqueInvestors = new Set(purchases.map(p => p.investorId)).size;
    this.saleStats.averageInvestment = this.saleStats.totalRaised / this.saleStats.uniqueInvestors || 0;
  }

  // Public getters and utilities
  public getSaleStats(): typeof this.saleStats {
    return { ...this.saleStats };
  }

  public getPhases(): TokenSalePhase[] {
    return Array.from(this.phases.values());
  }

  public getActivePhase(): TokenSalePhase | null {
    const now = new Date();
    
    for (const phase of this.phases.values()) {
      if (phase.active && 
          now >= new Date(phase.startDate) && 
          now <= new Date(phase.endDate)) {
        return phase;
      }
    }
    
    return null;
  }

  public getInvestorProfile(investorId: string): InvestorProfile | undefined {
    return this.investors.get(investorId);
  }

  public getInvestorPurchases(investorId: string): TokenPurchase[] {
    return Array.from(this.purchases.values()).filter(p => p.investorId === investorId);
  }

  public getVestingSchedule(purchaseId: string): VestingSchedule | undefined {
    return this.vestingSchedules.get(purchaseId);
  }

  public activatePhase(phaseName: string): boolean {
    const phase = this.phases.get(phaseName);
    if (phase) {
      phase.active = true;
      console.log(`🚀 Token sale phase activated: ${phaseName}`);
      this.emit('phaseActivated', phase);
      return true;
    }
    return false;
  }

  public deactivatePhase(phaseName: string): boolean {
    const phase = this.phases.get(phaseName);
    if (phase) {
      phase.active = false;
      console.log(`⏹️ Token sale phase deactivated: ${phaseName}`);
      this.emit('phaseDeactivated', phase);
      return true;
    }
    return false;
  }
}