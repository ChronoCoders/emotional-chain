import Joi from 'joi';

/**
 * Production-grade input validation schemas
 * Prevents injection attacks and ensures data integrity
 */

// Common patterns
const BLOCKCHAIN_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const HASH_PATTERN = /^[a-fA-F0-9]{64}$/;
const PUBLIC_KEY_PATTERN = /^[a-fA-F0-9]{66}$/;
const SIGNATURE_PATTERN = /^[a-fA-F0-9]{128}$/;
const NONCE_PATTERN = /^[a-fA-F0-9]{24}$/;

// Validator registration schema
export const validatorRegistrationSchema = Joi.object({
  address: Joi.string().pattern(BLOCKCHAIN_ADDRESS_PATTERN).required(),
  publicKey: Joi.string().pattern(PUBLIC_KEY_PATTERN).required(),
  stake: Joi.number().positive().max(1000000).required(),
  biometricHash: Joi.string().pattern(HASH_PATTERN).required(),
  deviceSignature: Joi.string().pattern(SIGNATURE_PATTERN).required(),
  metadata: Joi.object({
    deviceType: Joi.string().valid('heartRate', 'focus', 'stress').required(),
    deviceModel: Joi.string().max(100).required(),
    calibrationData: Joi.object().optional()
  }).required()
});

// Transaction schema
export const transactionSchema = Joi.object({
  from: Joi.string().pattern(BLOCKCHAIN_ADDRESS_PATTERN).required(),
  to: Joi.string().pattern(BLOCKCHAIN_ADDRESS_PATTERN).required(),
  amount: Joi.number().positive().max(1000000).required(),
  fee: Joi.number().positive().max(1000).required(),
  nonce: Joi.string().pattern(NONCE_PATTERN).required(),
  signature: Joi.string().pattern(SIGNATURE_PATTERN).required(),
  biometricProof: Joi.object({
    authenticity: Joi.number().min(0).max(100).required(),
    timestamp: Joi.number().integer().positive().required(),
    deviceId: Joi.string().max(100).required()
  }).optional()
});

// Biometric data schema
export const biometricDataSchema = Joi.object({
  validatorId: Joi.string().pattern(BLOCKCHAIN_ADDRESS_PATTERN).required(),
  deviceId: Joi.string().max(100).required(),
  timestamp: Joi.number().integer().positive().required(),
  data: Joi.object({
    heartRate: Joi.number().integer().min(30).max(220).optional(),
    stress: Joi.number().min(0).max(100).optional(),
    focus: Joi.number().min(0).max(100).optional(),
    authenticity: Joi.number().min(0).max(100).required()
  }).required(),
  signature: Joi.string().pattern(SIGNATURE_PATTERN).required(),
  quality: Joi.number().min(0).max(100).required()
});

// Block proposal schema
export const blockProposalSchema = Joi.object({
  proposer: Joi.string().pattern(BLOCKCHAIN_ADDRESS_PATTERN).required(),
  height: Joi.number().integer().positive().required(),
  parentHash: Joi.string().pattern(HASH_PATTERN).required(),
  transactions: Joi.array().items(
    Joi.string().pattern(HASH_PATTERN)
  ).max(1000).required(),
  timestamp: Joi.number().integer().positive().required(),
  emotionalScore: Joi.number().min(0).max(100).required(),
  consensusData: Joi.object({
    validators: Joi.array().items(
      Joi.string().pattern(BLOCKCHAIN_ADDRESS_PATTERN)
    ).min(1).max(10000).required(),
    signatures: Joi.array().items(
      Joi.string().pattern(SIGNATURE_PATTERN)
    ).required()
  }).required(),
  signature: Joi.string().pattern(SIGNATURE_PATTERN).required()
});

// Network message schema
export const networkMessageSchema = Joi.object({
  type: Joi.string().valid(
    'block_proposal',
    'block_vote',
    'transaction_broadcast',
    'validator_announcement',
    'consensus_message',
    'biometric_update'
  ).required(),
  sender: Joi.string().pattern(BLOCKCHAIN_ADDRESS_PATTERN).required(),
  timestamp: Joi.number().integer().positive().required(),
  nonce: Joi.string().pattern(NONCE_PATTERN).required(),
  payload: Joi.object().required(),
  signature: Joi.string().pattern(SIGNATURE_PATTERN).required()
});

// Consensus vote schema
export const consensusVoteSchema = Joi.object({
  voter: Joi.string().pattern(BLOCKCHAIN_ADDRESS_PATTERN).required(),
  blockHash: Joi.string().pattern(HASH_PATTERN).required(),
  vote: Joi.string().valid('approve', 'reject', 'abstain').required(),
  emotionalState: Joi.object({
    stress: Joi.number().min(0).max(100).required(),
    focus: Joi.number().min(0).max(100).required(),
    authenticity: Joi.number().min(0).max(100).required()
  }).required(),
  timestamp: Joi.number().integer().positive().required(),
  signature: Joi.string().pattern(SIGNATURE_PATTERN).required()
});

// API request schemas
export const apiRequestSchema = Joi.object({
  method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE').required(),
  endpoint: Joi.string().max(500).required(),
  headers: Joi.object({
    'x-signature': Joi.string().pattern(SIGNATURE_PATTERN).optional(),
    'x-nonce': Joi.string().pattern(NONCE_PATTERN).optional(),
    'content-type': Joi.string().max(100).optional(),
    'user-agent': Joi.string().max(500).optional()
  }).unknown(true).optional(),
  body: Joi.object().optional()
});

// WebSocket message schema
export const websocketMessageSchema = Joi.object({
  type: Joi.string().valid(
    'ping',
    'pong',
    'command',
    'subscription',
    'update',
    'error'
  ).required(),
  id: Joi.string().max(100).optional(),
  payload: Joi.object().optional(),
  timestamp: Joi.number().integer().positive().required()
});

// Terminal command schema
export const terminalCommandSchema = Joi.object({
  command: Joi.string().valid(
    'status',
    'mine',
    'wallet',
    'network',
    'history',
    'validators',
    'help',
    'clear'
  ).required(),
  args: Joi.array().items(
    Joi.string().max(100)
  ).max(10).optional(),
  flags: Joi.object().pattern(
    Joi.string().max(50),
    Joi.alternatives().try(
      Joi.string().max(200),
      Joi.number(),
      Joi.boolean()
    )
  ).optional()
});

// Configuration update schema
export const configUpdateSchema = Joi.object({
  section: Joi.string().valid(
    'consensus',
    'network',
    'biometric',
    'security',
    'database'
  ).required(),
  key: Joi.string().max(100).required(),
  value: Joi.alternatives().try(
    Joi.string().max(1000),
    Joi.number(),
    Joi.boolean(),
    Joi.object()
  ).required(),
  signature: Joi.string().pattern(SIGNATURE_PATTERN).required(),
  timestamp: Joi.number().integer().positive().required()
});

// Export all schemas
export default {
  validatorRegistrationSchema,
  transactionSchema,
  biometricDataSchema,
  blockProposalSchema,
  networkMessageSchema,
  consensusVoteSchema,
  apiRequestSchema,
  websocketMessageSchema,
  terminalCommandSchema,
  configUpdateSchema
};