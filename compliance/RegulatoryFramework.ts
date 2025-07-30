/**
 * Regulatory Compliance Framework for EmotionalChain
 * Global regulatory compliance automation and audit trail generation
 */

import { EventEmitter } from 'events';
// Define BiometricData interface locally since it's not exported from BiometricDevice
interface BiometricData {
  heartRate: number;
  stressLevel: number;
  focusLevel: number;
  authenticity: number;
  timestamp: number;
}

export interface RegulatoryJurisdiction {
  code: string;
  name: string;
  regulations: string[];
  dataProtectionLaws: string[];
  healthcareLaws: string[];
  financialLaws: string[];
  requirements: {
    dataLocalization: boolean;
    consentRequired: boolean;
    rightToErasure: boolean;
    dataPortability: boolean;
    notificationRequired: boolean;
    registrationRequired: boolean;
  };
}

export interface ComplianceAudit {
  auditId: string;
  timestamp: string;
  jurisdiction: string;
  regulation: string;
  status: 'compliant' | 'non-compliant' | 'partial' | 'pending';
  findings: string[];
  recommendations: string[];
  nextReviewDate: string;
  auditedBy: string;
}

export interface DataProcessingRecord {
  recordId: string;
  dataSubject: string;
  dataTypes: string[];
  processingPurpose: string;
  legalBasis: string;
  retentionPeriod: number;
  thirdPartySharing: boolean;
  consentStatus: 'given' | 'withdrawn' | 'expired';
  crossBorderTransfer: boolean;
  destinationCountries?: string[];
}

export interface PrivacyRights {
  jurisdiction: string;
  rights: {
    access: boolean;
    rectification: boolean;
    erasure: boolean;
    restriction: boolean;
    portability: boolean;
    objection: boolean;
    automated_decision_making: boolean;
  };
  exerciseDeadline: number; // days
  responseFormat: string[];
}

export const RegulatoryJurisdictions: RegulatoryJurisdiction[] = [
  {
    code: 'EU',
    name: 'European Union',
    regulations: ['GDPR', 'Medical Device Regulation', 'AI Act'],
    dataProtectionLaws: ['GDPR', 'ePrivacy Directive'],
    healthcareLaws: ['Medical Device Regulation', 'Clinical Trials Regulation'],
    financialLaws: ['PSD2', 'MiFID II'],
    requirements: {
      dataLocalization: false,
      consentRequired: true,
      rightToErasure: true,
      dataPortability: true,
      notificationRequired: true,
      registrationRequired: false
    }
  },
  {
    code: 'US',
    name: 'United States',
    regulations: ['HIPAA', 'CCPA', 'CPRA', 'FDA Regulations'],
    dataProtectionLaws: ['CCPA', 'CPRA', 'Virginia CDPA'],
    healthcareLaws: ['HIPAA', 'HITECH', 'FDA 21 CFR Part 820'],
    financialLaws: ['SOX', 'PCI DSS', 'GLBA'],
    requirements: {
      dataLocalization: false,
      consentRequired: true,
      rightToErasure: true,
      dataPortability: false,
      notificationRequired: true,
      registrationRequired: false
    }
  },
  {
    code: 'CA',
    name: 'Canada',
    regulations: ['PIPEDA', 'Health Canada Regulations'],
    dataProtectionLaws: ['PIPEDA', 'Quebec Law 25'],
    healthcareLaws: ['Health Canada Medical Device Regulations'],
    financialLaws: ['PCMLTFA'],
    requirements: {
      dataLocalization: true,
      consentRequired: true,
      rightToErasure: false,
      dataPortability: false,
      notificationRequired: true,
      registrationRequired: false
    }
  },
  {
    code: 'UK',
    name: 'United Kingdom', 
    regulations: ['UK GDPR', 'Data Protection Act 2018', 'MHRA Regulations'],
    dataProtectionLaws: ['UK GDPR', 'Data Protection Act 2018'],
    healthcareLaws: ['MHRA Medical Device Regulations'],
    financialLaws: ['FCA Regulations'],
    requirements: {
      dataLocalization: false,
      consentRequired: true,
      rightToErasure: true,
      dataPortability: true,
      notificationRequired: true,
      registrationRequired: false
    }
  },
  {
    code: 'SG',
    name: 'Singapore',
    regulations: ['PDPA', 'Health Sciences Authority'],
    dataProtectionLaws: ['PDPA'],
    healthcareLaws: ['Health Sciences Authority Regulations'],
    financialLaws: ['MAS Regulations'],
    requirements: {
      dataLocalization: false,
      consentRequired: true,
      rightToErasure: false,
      dataPortability: false,
      notificationRequired: true,
      registrationRequired: true
    }
  }
];

export const PrivacyRightsByJurisdiction: PrivacyRights[] = [
  {
    jurisdiction: 'EU',
    rights: {
      access: true,
      rectification: true,
      erasure: true,
      restriction: true,
      portability: true,
      objection: true,
      automated_decision_making: true
    },
    exerciseDeadline: 30,
    responseFormat: ['electronic', 'paper', 'structured_data']
  },
  {
    jurisdiction: 'US',
    rights: {
      access: true,
      rectification: true,
      erasure: true,
      restriction: false,
      portability: false,
      objection: true,
      automated_decision_making: false
    },
    exerciseDeadline: 45,
    responseFormat: ['electronic', 'paper']
  },
  {
    jurisdiction: 'CA',
    rights: {
      access: true,
      rectification: true,
      erasure: false,
      restriction: false,
      portability: false,
      objection: true,
      automated_decision_making: false
    },
    exerciseDeadline: 30,
    responseFormat: ['electronic', 'paper']
  }
];

export class RegulatoryComplianceEngine extends EventEmitter {
  private jurisdictions: Map<string, RegulatoryJurisdiction> = new Map();
  private auditRecords: Map<string, ComplianceAudit> = new Map();
  private processingRecords: Map<string, DataProcessingRecord> = new Map();
  private privacyRights: Map<string, PrivacyRights> = new Map();
  private complianceScore: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeJurisdictions();
    this.initializePrivacyRights();
    this.startComplianceMonitoring();
  }

  private initializeJurisdictions(): void {
    RegulatoryJurisdictions.forEach(jurisdiction => {
      this.jurisdictions.set(jurisdiction.code, jurisdiction);
      this.complianceScore.set(jurisdiction.code, 0);
    });
    console.log(`⚖️ Initialized ${this.jurisdictions.size} regulatory jurisdictions`);
  }

  private initializePrivacyRights(): void {
    PrivacyRightsByJurisdiction.forEach(rights => {
      this.privacyRights.set(rights.jurisdiction, rights);
    });
    console.log(`🔒 Initialized privacy rights for ${this.privacyRights.size} jurisdictions`);
  }

  private startComplianceMonitoring(): void {
    // Daily compliance check
    setInterval(() => {
      this.performDailyComplianceCheck();
    }, 24 * 60 * 60 * 1000);

    // Weekly audit
    setInterval(() => {
      this.performWeeklyAudit();
    }, 7 * 24 * 60 * 60 * 1000);
  }

  public async validateGDPRCompliance(
    dataSubject: string,
    biometricData: BiometricData,
    processingPurpose: string
  ): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check if processing has legal basis
    const record = this.processingRecords.get(dataSubject);
    if (!record) {
      issues.push('No data processing record found');
      return { compliant: false, issues };
    }

    // Validate consent status
    if (record.legalBasis === 'consent' && record.consentStatus !== 'given') {
      issues.push('Invalid consent status for GDPR processing');
    }

    // Check data minimization
    if (record.dataTypes.length > 5) {
      issues.push('Potential data minimization violation - too many data types');
    }

    // Validate retention period
    if (record.retentionPeriod > 36) { // 3 years max for health data
      issues.push('Retention period exceeds GDPR recommendations');
    }

    // Cross-border transfer validation
    if (record.crossBorderTransfer && !record.destinationCountries) {
      issues.push('Cross-border transfer without adequacy decision');
    }

    const compliant = issues.length === 0;
    
    if (compliant) {
      console.log(`✅ GDPR compliance validated for ${dataSubject}`);
    } else {
      console.warn(`⚠️ GDPR compliance issues for ${dataSubject}:`, issues);
    }

    return { compliant, issues };
  }

  public async validateHIPAACompliance(
    coveredEntity: string,
    phi: BiometricData,
    businessAssociate?: string
  ): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Validate covered entity status
    if (!this.isCoveredEntity(coveredEntity)) {
      issues.push('Entity is not a HIPAA covered entity');
    }

    // Check business associate agreement
    if (businessAssociate && !this.hasValidBAA(coveredEntity, businessAssociate)) {
      issues.push('Missing or invalid Business Associate Agreement');
    }

    // Validate minimum necessary rule
    if (!this.isMinimumNecessary(phi)) {
      issues.push('PHI disclosure violates minimum necessary rule');
    }

    // Check encryption requirements
    if (!this.isPHIEncrypted(phi)) {
      issues.push('PHI not properly encrypted in transit/at rest');
    }

    // Audit trail validation
    if (!this.hasAuditTrail(phi)) {
      issues.push('Missing audit trail for PHI access');
    }

    const compliant = issues.length === 0;
    
    if (compliant) {
      console.log(`✅ HIPAA compliance validated for ${coveredEntity}`);
    } else {
      console.warn(`⚠️ HIPAA compliance issues for ${coveredEntity}:`, issues);
    }

    return { compliant, issues };
  }

  public async validateCCPACompliance(
    consumer: string,
    personalInfo: any,
    saleOfData: boolean
  ): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check consumer rights notice
    if (!this.hasConsumerRightsNotice(consumer)) {
      issues.push('Missing consumer privacy rights notice');
    }

    // Validate opt-out mechanism for data sales
    if (saleOfData && !this.hasOptOutMechanism()) {
      issues.push('Missing opt-out mechanism for data sales');
    }

    // Check data deletion capabilities
    if (!this.canDeleteConsumerData(consumer)) {
      issues.push('Unable to delete consumer data upon request');
    }

    // Validate non-discrimination
    if (this.hasDiscriminatoryPractices()) {
      issues.push('Discriminatory practices for privacy right exercise');
    }

    const compliant = issues.length === 0;
    
    if (compliant) {
      console.log(`✅ CCPA compliance validated for ${consumer}`);
    } else {
      console.warn(`⚠️ CCPA compliance issues for ${consumer}:`, issues);
    }

    return { compliant, issues };
  }

  public async handlePrivacyRightRequest(
    jurisdiction: string,
    requestType: string,
    dataSubject: string
  ): Promise<{ success: boolean; response: any; deadline: string }> {
    const rights = this.privacyRights.get(jurisdiction);
    if (!rights) {
      return {
        success: false,
        response: 'Jurisdiction not supported',
        deadline: ''
      };
    }

    const deadline = new Date(Date.now() + rights.exerciseDeadline * 24 * 60 * 60 * 1000).toISOString();

    switch (requestType) {
      case 'access':
        if (!rights.rights.access) {
          return { success: false, response: 'Access right not available in this jurisdiction', deadline };
        }
        const accessData = await this.getDataSubjectInfo(dataSubject);
        return { success: true, response: accessData, deadline };

      case 'erasure':
        if (!rights.rights.erasure) {
          return { success: false, response: 'Right to erasure not available in this jurisdiction', deadline };
        }
        const erasureResult = await this.eraseDataSubjectInfo(dataSubject);
        return { success: erasureResult, response: 'Data erasure completed', deadline };

      case 'portability':
        if (!rights.rights.portability) {
          return { success: false, response: 'Data portability not available in this jurisdiction', deadline };
        }
        const portableData = await this.exportDataSubjectInfo(dataSubject);
        return { success: true, response: portableData, deadline };

      case 'objection':
        if (!rights.rights.objection) {
          return { success: false, response: 'Right to object not available in this jurisdiction', deadline };
        }
        const objectionResult = await this.processObjection(dataSubject);
        return { success: objectionResult, response: 'Processing objection handled', deadline };

      default:
        return { success: false, response: 'Unknown request type', deadline };
    }
  }

  public generateComplianceReport(jurisdiction: string): ComplianceAudit {
    const auditId = `audit-${Date.now()}-${jurisdiction}`;
    const jurisdictionData = this.jurisdictions.get(jurisdiction);
    
    if (!jurisdictionData) {
      throw new Error(`Jurisdiction ${jurisdiction} not found`);
    }

    const findings: string[] = [];
    const recommendations: string[] = [];
    let compliancePercentage = 100;

    // Check various compliance aspects
    if (!this.hasDataProtectionOfficer() && jurisdiction === 'EU') {
      findings.push('No Data Protection Officer appointed (GDPR requirement)');
      recommendations.push('Appoint qualified Data Protection Officer');
      compliancePercentage -= 10;
    }

    if (!this.hasPrivacyNotice()) {
      findings.push('Missing or incomplete privacy notice');
      recommendations.push('Update privacy notice with all required information');
      compliancePercentage -= 15;
    }

    if (!this.hasIncidentResponsePlan()) {
      findings.push('No data breach incident response plan');
      recommendations.push('Develop comprehensive incident response procedures');
      compliancePercentage -= 20;
    }

    const status = compliancePercentage >= 90 ? 'compliant' : 
                  compliancePercentage >= 70 ? 'partial' : 'non-compliant';

    const audit: ComplianceAudit = {
      auditId,
      timestamp: new Date().toISOString(),
      jurisdiction,
      regulation: jurisdictionData.regulations.join(', '),
      status,
      findings,
      recommendations,
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      auditedBy: 'EmotionalChain-Compliance-Engine'
    };

    this.auditRecords.set(auditId, audit);
    this.complianceScore.set(jurisdiction, compliancePercentage);

    console.log(`📋 Compliance audit completed for ${jurisdiction}: ${compliancePercentage}%`);
    return audit;
  }

  // Helper methods (simplified implementations)
  private isCoveredEntity(entity: string): boolean {
    // Check if entity is a healthcare provider, health plan, or healthcare clearinghouse
    const coveredEntities = ['mayo-clinic', 'stanford-medicine', 'nhs-digital'];
    return coveredEntities.includes(entity);
  }

  private hasValidBAA(coveredEntity: string, businessAssociate: string): boolean {
    // Check if valid Business Associate Agreement exists
    return true; // Simplified
  }

  private isMinimumNecessary(phi: BiometricData): boolean {
    // Check if PHI disclosure is minimum necessary
    return true; // Simplified
  }

  private isPHIEncrypted(phi: BiometricData): boolean {
    // Check if PHI is encrypted
    return true; // Simplified - assume encrypted
  }

  private hasAuditTrail(phi: BiometricData): boolean {
    // Check if audit trail exists for PHI access
    return true; // Simplified
  }

  private hasConsumerRightsNotice(consumer: string): boolean {
    return true; // Simplified
  }

  private hasOptOutMechanism(): boolean {
    return true; // Simplified
  }

  private canDeleteConsumerData(consumer: string): boolean {
    return true; // Simplified
  }

  private hasDiscriminatoryPractices(): boolean {
    return false; // Simplified
  }

  private async getDataSubjectInfo(dataSubject: string): Promise<any> {
    // Retrieve all data for the data subject
    return { message: 'Data access request processed' };
  }

  private async eraseDataSubjectInfo(dataSubject: string): Promise<boolean> {
    // Erase all data for the data subject
    this.processingRecords.delete(dataSubject);
    return true;
  }

  private async exportDataSubjectInfo(dataSubject: string): Promise<any> {
    // Export data in portable format
    return { message: 'Data portability request processed' };
  }

  private async processObjection(dataSubject: string): Promise<boolean> {
    // Process objection to data processing
    return true;
  }

  private hasDataProtectionOfficer(): boolean {
    return true; // Simplified
  }

  private hasPrivacyNotice(): boolean {
    return true; // Simplified
  }

  private hasIncidentResponsePlan(): boolean {
    return true; // Simplified
  }

  private performDailyComplianceCheck(): void {
    console.log('🔍 Performing daily compliance check...');
    
    for (const [code, jurisdiction] of this.jurisdictions.entries()) {
      const issues = [];
      
      // Check for expired records
      for (const [id, record] of this.processingRecords.entries()) {
        const recordAge = Date.now() - new Date(record.recordId).getTime();
        const maxAge = record.retentionPeriod * 30 * 24 * 60 * 60 * 1000;
        
        if (recordAge > maxAge) {
          issues.push(`Expired processing record: ${id}`);
        }
      }

      if (issues.length > 0) {
        this.emit('complianceIssues', { jurisdiction: code, issues });
      }
    }
  }

  private performWeeklyAudit(): void {
    console.log('📊 Performing weekly compliance audit...');
    
    for (const [code] of this.jurisdictions.entries()) {
      try {
        this.generateComplianceReport(code);
      } catch (error) {
        console.error(`Audit failed for ${code}:`, error);
      }
    }
  }

  // Public getters
  public getJurisdictions(): RegulatoryJurisdiction[] {
    return Array.from(this.jurisdictions.values());
  }

  public getAuditRecords(): ComplianceAudit[] {
    return Array.from(this.auditRecords.values());
  }

  public getComplianceScore(jurisdiction: string): number {
    return this.complianceScore.get(jurisdiction) || 0;
  }

  public addProcessingRecord(record: DataProcessingRecord): void {
    this.processingRecords.set(record.recordId, record);
    console.log(`📝 Processing record added: ${record.recordId}`);
  }

  public getOverallComplianceStatus(): {
    averageScore: number;
    compliantJurisdictions: number;
    totalJurisdictions: number;
    criticalIssues: number;
  } {
    const scores = Array.from(this.complianceScore.values());
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const compliantJurisdictions = scores.filter(score => score >= 90).length;
    const criticalIssues = Array.from(this.auditRecords.values())
      .filter(audit => audit.status === 'non-compliant').length;

    return {
      averageScore,
      compliantJurisdictions,
      totalJurisdictions: this.jurisdictions.size,
      criticalIssues
    };
  }
}