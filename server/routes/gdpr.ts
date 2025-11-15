/**
 * GDPR Compliance API Routes
 * Implements data subject rights: erasure, access, portability
 */

import { Router } from 'express';
import { gdprService } from '../gdpr/complianceService';
import { createHash } from 'crypto';

const router = Router();

/**
 * POST /api/gdpr/erasure
 * Request data deletion (Right to be Forgotten - GDPR Article 17)
 * 
 * Requires cryptographic signature to prove identity
 */
router.post('/erasure', async (req, res) => {
  try {
    const { validatorAddress, requestType, signature, timestamp } = req.body;

    if (!validatorAddress || !signature || !timestamp) {
      return res.status(400).json({
        error: 'Missing required fields: validatorAddress, signature, timestamp',
      });
    }

    const request = {
      validatorAddress,
      requestType: requestType || 'personal_only',
      signature,
      timestamp: Number(timestamp),
    };

    // Handle erasure request
    const result = await gdprService.handleErasureRequest(request);

    res.json({
      success: result.success,
      deletedData: result.deletedData,
      retainedData: result.retainedData,
      reason: result.reason,
      message: 'Personal data has been deleted. Blockchain commitments retained for network integrity.',
    });
  } catch (error) {
    console.error('GDPR erasure error:', error);
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/gdpr/data/:validatorAddress
 * Export all personal data (Data Portability - GDPR Article 20)
 */
router.get('/data/:validatorAddress', async (req, res) => {
  try {
    const { validatorAddress } = req.params;

    if (!validatorAddress) {
      return res.status(400).json({
        error: 'validatorAddress required',
      });
    }

    const exportData = await gdprService.exportPersonalData(validatorAddress);

    res.json(exportData);
  } catch (error) {
    console.error('GDPR export error:', error);
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/gdpr/consent/:validatorAddress
 * Check consent status
 */
router.get('/consent/:validatorAddress', async (req, res) => {
  try {
    const { validatorAddress } = req.params;

    if (!validatorAddress) {
      return res.status(400).json({
        error: 'validatorAddress required',
      });
    }

    const consent = await gdprService.getConsentStatus(validatorAddress);

    if (!consent) {
      return res.status(404).json({
        error: 'No consent record found',
        hasConsent: false,
      });
    }

    res.json(consent);
  } catch (error) {
    console.error('GDPR consent status error:', error);
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/gdpr/consent
 * Record new consent
 */
router.post('/consent', async (req, res) => {
  try {
    const { 
      validatorAddress, 
      consentVersion, 
      dataProcessingPurpose,
      personalData 
    } = req.body;

    if (!validatorAddress || !consentVersion || !dataProcessingPurpose) {
      return res.status(400).json({
        error: 'Missing required fields: validatorAddress, consentVersion, dataProcessingPurpose',
      });
    }

    await gdprService.recordConsent(
      validatorAddress,
      consentVersion,
      dataProcessingPurpose,
      personalData
    );

    res.json({
      success: true,
      message: 'Consent recorded successfully',
      validatorAddress,
      consentVersion,
    });
  } catch (error) {
    console.error('GDPR consent recording error:', error);
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/gdpr/consent/revoke
 * Revoke consent (triggers unstaking and data deletion)
 */
router.post('/consent/revoke', async (req, res) => {
  try {
    const { validatorAddress, signature, timestamp } = req.body;

    if (!validatorAddress || !signature || !timestamp) {
      return res.status(400).json({
        error: 'Missing required fields: validatorAddress, signature, timestamp',
      });
    }

    // Verify signature
    const request = {
      validatorAddress,
      requestType: 'full' as const,
      signature,
      timestamp: Number(timestamp),
    };

    const isValid = await gdprService.verifySignature(request);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid signature - cannot verify identity',
      });
    }

    // Revoke consent
    await gdprService.revokeConsent(validatorAddress);

    res.json({
      success: true,
      message: 'Consent revoked. Your data will be deleted and you will be unstaked.',
      validatorAddress,
    });
  } catch (error) {
    console.error('GDPR consent revocation error:', error);
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/gdpr/anonymize
 * Anonymize validator data (alternative to full deletion)
 */
router.post('/anonymize', async (req, res) => {
  try {
    const { validatorAddress, signature, timestamp } = req.body;

    if (!validatorAddress || !signature || !timestamp) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Verify signature
    const request = {
      validatorAddress,
      requestType: 'personal_only' as const,
      signature,
      timestamp: Number(timestamp),
    };

    const isValid = await gdprService.verifySignature(request);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid signature',
      });
    }

    // Anonymize
    await gdprService.anonymizeValidator(validatorAddress);

    res.json({
      success: true,
      message: 'Personal data anonymized. Blockchain data preserved.',
    });
  } catch (error) {
    console.error('GDPR anonymization error:', error);
    res.status(500).json({
      error: (error as Error).message,
    });
  }
});

/**
 * POST /api/gdpr/verify-signature
 * Helper endpoint to verify signature format
 */
router.post('/verify-signature', async (req, res) => {
  try {
    const { validatorAddress, requestType, signature, timestamp } = req.body;

    const request = {
      validatorAddress,
      requestType: requestType || 'personal_only',
      signature,
      timestamp: Number(timestamp),
    };

    const isValid = await gdprService.verifySignature(request);

    res.json({
      isValid,
      timestamp: request.timestamp,
      age: Date.now() - request.timestamp,
      maxAge: 5 * 60 * 1000, // 5 minutes
    });
  } catch (error) {
    res.status(400).json({
      isValid: false,
      error: (error as Error).message,
    });
  }
});

/**
 * GET /api/gdpr/info
 * Get GDPR compliance information
 */
router.get('/info', (req, res) => {
  res.json({
    gdprCompliance: {
      version: '1.0',
      implemented: [
        'Right to Access (Article 15)',
        'Right to Data Portability (Article 20)',
        'Right to Erasure (Article 17)',
        'Data Minimization (Article 5)',
        'Consent Management (Article 7)',
      ],
      dataRetention: {
        personalData: 'Deleted upon request',
        blockchainData: 'Retained for network integrity (pseudonymous)',
        commitments: 'Cryptographic hashes - cannot reveal personal data',
      },
      contactDPO: 'dpo@emotionalchain.io',
    },
  });
});

export default router;
