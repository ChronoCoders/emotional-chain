# EmotionalChain API Reference

## Base URL
```
Production: https://api.emotionalchain.io
Development: http://localhost:5000
```

## Authentication

### JWT Token Authentication
```javascript
// Request header
Authorization: Bearer <jwt_token>

// Obtain token via login
POST /api/auth/login
{
  "username": "validator_id",
  "password": "secure_password",
  "role": "validator" // user, validator, admin
}
```

### API Key Authentication
```javascript
// Request header
X-API-Key: <api_key>

// For enterprise integrations
POST /api/auth/api-key
{
  "organization": "company_name",
  "permissions": ["read", "write", "admin"]
}
```

## Core Blockchain API

### Blocks

#### Get Latest Blocks
```http
GET /api/blocks?limit=10&offset=0
```

**Response:**
```json
[
  {
    "id": "00f7941e32a02742685afafdece3c322d2824271edf6acf19a01b57d1fb15baa",
    "height": 13251,
    "hash": "00f7941e32a02742685afafdece3c322d2824271edf6acf19a01b57d1fb15baa",
    "previousHash": "00fc186a76243f2cecce558e8a1e73f55fcdd94a5d2cc96f12cb44d4898763b1",
    "timestamp": "2025-09-06T23:31:58.517Z",
    "validator": "GravityCore",
    "emotionalScore": 75.42,
    "consensusScore": "87.5",
    "authenticity": "94.2",
    "transactionCount": 4,
    "blockSize": 2048,
    "difficulty": 2,
    "nonce": 845291,
    "merkleRoot": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
]
```

#### Get Block by Hash
```http
GET /api/blocks/{hash}
```

#### Get Block by Height
```http
GET /api/blocks/height/{height}
```

### Transactions

#### Get Transaction by Hash
```http
GET /api/transactions/{hash}
```

**Response:**
```json
{
  "id": "tx_hash_here",
  "from": "StellarNode",
  "to": "NebulaForge", 
  "amount": 50.0,
  "fee": 0.001,
  "timestamp": "2025-09-07T17:21:33.524Z",
  "blockHeight": 13253,
  "status": "confirmed",
  "confirmations": 6,
  "type": "transfer",
  "signature": "ecdsa_signature_here",
  "emotionalProof": {
    "score": 73.54,
    "authenticity": 0.93,
    "biometricHash": "proof_hash"
  }
}
```

#### Send Transaction
```http
POST /api/transactions
```

**Request:**
```json
{
  "from": "validator_id",
  "to": "recipient_id",
  "amount": 100.0,
  "type": "transfer",
  "emotionalProof": {
    "zkProof": "zk_proof_here",
    "biometricHash": "biometric_proof_hash"
  },
  "signature": "transaction_signature"
}
```

#### Get Transaction Pool
```http
GET /api/transactions/pending
```

### Network Status

#### Network Statistics
```http
GET /api/network/status
```

**Response:**
```json
{
  "networkId": "emotionalchain-mainnet",
  "latestBlock": {
    "height": 13397,
    "hash": "latest_block_hash",
    "timestamp": "2025-09-07T18:00:00.000Z"
  },
  "stats": {
    "totalBlocks": 13397,
    "totalTransactions": 21104,
    "activeValidators": 21,
    "averageBlockTime": 10.2,
    "networkHashrate": "125.5 GH/s",
    "difficulty": 2,
    "emotionalAverage": 78.5
  },
  "tokenEconomics": {
    "totalSupply": 768667.74,
    "circulatingSupply": 563147.04,
    "stakedAmount": 205520.70,
    "currentInflation": 4.2
  }
}
```

#### Validator Network
```http
GET /api/network/validators
```

**Response:**
```json
{
  "validators": [
    {
      "id": "StellarNode",
      "status": "active",
      "stake": 15000.0,
      "emotionalScore": 82.3,
      "uptime": 99.8,
      "blocksProduced": 638,
      "lastActive": "2025-09-07T17:59:45.000Z",
      "commission": 5.0,
      "location": "North America",
      "biometricDevices": ["heart_rate", "stress_sensor"]
    }
  ],
  "totalStake": 315000.0,
  "averageEmotionalScore": 78.5,
  "consensusThreshold": 0.67
}
```

## Biometric Integration API

### Device Management

#### Register Biometric Device
```http
POST /api/biometric/devices
```

**Request:**
```json
{
  "deviceType": "heart_rate_monitor",
  "deviceModel": "Polar H10",
  "validatorId": "validator_id",
  "calibrationData": {
    "baselineHeartRate": 65,
    "maxHeartRate": 180,
    "restingVariability": 45
  }
}
```

#### Get Connected Devices
```http
GET /api/biometric/devices/{validatorId}
```

#### Submit Biometric Data
```http
POST /api/biometric/data
```

**Request:**
```json
{
  "validatorId": "validator_id",
  "timestamp": 1757272000000,
  "deviceId": "device_uuid",
  "biometricData": {
    "heartRate": 75,
    "heartRateVariability": 42,
    "stressLevel": 0.25,
    "focusLevel": 0.85,
    "authenticity": 0.94
  },
  "zkProof": "zero_knowledge_proof"
}
```

### Emotional Validation

#### Get Emotional Score
```http
GET /api/biometric/score/{validatorId}
```

**Response:**
```json
{
  "validatorId": "StellarNode",
  "currentScore": 82.3,
  "scoreHistory": [
    {"timestamp": "2025-09-07T17:00:00.000Z", "score": 81.5},
    {"timestamp": "2025-09-07T17:30:00.000Z", "score": 82.3}
  ],
  "metrics": {
    "heartRateAverage": 72,
    "stressLevel": 0.18,
    "focusLevel": 0.88,
    "authenticity": 0.94,
    "consistency": 0.91
  },
  "validationStatus": "valid",
  "lastUpdated": "2025-09-07T17:59:30.000Z"
}
```

#### Validate Emotional Proof
```http
POST /api/biometric/validate
```

**Request:**
```json
{
  "validatorId": "validator_id",
  "zkProof": "zero_knowledge_proof",
  "timestamp": 1757272000000,
  "challengeResponse": "challenge_response"
}
```

## Mining and Consensus API

### Mining Operations

#### Start Mining
```http
POST /api/mining/start
```

**Request:**
```json
{
  "validatorId": "validator_id",
  "emotionalProof": {
    "zkProof": "proof_data",
    "score": 85.2,
    "authenticity": 0.96
  }
}
```

**Response:**
```json
{
  "status": "started",
  "message": "Mining started with Proof of Emotion consensus",
  "validatorId": "validator_id",
  "difficulty": 2,
  "consensusType": "Proof of Emotion (PoE)",
  "miningInterval": "10 seconds",
  "estimatedRewards": {
    "baseReward": 50.0,
    "emotionalBonus": 18.5,
    "validationReward": 3.2
  }
}
```

#### Stop Mining
```http
POST /api/mining/stop
```

#### Get Mining Status
```http
GET /api/mining/status/{validatorId}
```

### Consensus Participation

#### Submit Block Proposal
```http
POST /api/consensus/propose
```

#### Validate Block
```http
POST /api/consensus/validate
```

#### Get Consensus Round
```http
GET /api/consensus/round/{roundId}
```

## Staking and Economics API

### Staking Operations

#### Stake Tokens
```http
POST /api/staking/stake
```

**Request:**
```json
{
  "validatorId": "target_validator",
  "amount": 1000.0,
  "stakingPeriod": "30_days",
  "emotionalCommitment": {
    "minimumScore": 75.0,
    "consistencyRequirement": 0.85
  }
}
```

#### Unstake Tokens
```http
POST /api/staking/unstake
```

#### Get Staking Rewards
```http
GET /api/staking/rewards/{validatorId}
```

**Response:**
```json
{
  "validatorId": "StellarNode",
  "totalStaked": 15000.0,
  "currentRewards": 1250.75,
  "rewardRate": 0.12,
  "emotionalBonus": 1.25,
  "stakingHistory": [
    {
      "timestamp": "2025-09-01T00:00:00.000Z",
      "amount": 15000.0,
      "action": "stake",
      "emotionalScore": 78.5
    }
  ],
  "nextRewardDistribution": "2025-09-08T00:00:00.000Z"
}
```

### Token Economics

#### Get Token Statistics
```http
GET /api/economics/stats
```

#### Get Reward Distribution
```http
GET /api/economics/rewards
```

#### Get Validator Economics
```http
GET /api/economics/validator/{validatorId}
```

## Real-Time WebSocket API

### Connection
```javascript
const ws = new WebSocket('wss://api.emotionalchain.io/ws');

// Authentication
ws.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token_here'
}));
```

### Subscriptions

#### Block Updates
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'blocks'
}));

// Receives:
{
  "type": "block",
  "data": {
    "height": 13398,
    "hash": "new_block_hash",
    "validator": "StellarNode",
    "emotionalScore": 84.2,
    "transactions": 5
  }
}
```

#### Transaction Updates
```javascript
ws.send(JSON.stringify({
  type: 'subscribe', 
  channel: 'transactions',
  filter: {
    "address": "validator_id"
  }
}));
```

#### Network Status
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'network_status'
}));
```

#### Biometric Updates
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'biometric',
  validatorId: 'your_validator_id'
}));
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "INVALID_EMOTIONAL_PROOF",
    "message": "Emotional proof validation failed",
    "details": {
      "validatorId": "validator_id",
      "reason": "Biometric authenticity below threshold",
      "threshold": 0.75,
      "received": 0.68
    },
    "timestamp": "2025-09-07T18:00:00.000Z",
    "requestId": "req_12345"
  }
}
```

### Error Codes
- `INVALID_SIGNATURE`: Transaction signature validation failed
- `INSUFFICIENT_BALANCE`: Not enough tokens for transaction
- `INVALID_EMOTIONAL_PROOF`: Biometric validation failed
- `VALIDATOR_NOT_ELIGIBLE`: Validator doesn't meet consensus requirements
- `NETWORK_CONGESTION`: Network experiencing high load
- `BIOMETRIC_DEVICE_ERROR`: Hardware device malfunction
- `CONSENSUS_TIMEOUT`: Block consensus timed out
- `STAKE_LOCKED`: Staked tokens in lock-up period

## Rate Limits

### API Rate Limits
- **Standard API**: 1000 requests/hour
- **Premium API**: 10000 requests/hour  
- **Enterprise API**: Unlimited
- **WebSocket**: 100 subscriptions per connection

### Biometric Data
- **Real-time submissions**: 1 per second maximum
- **Batch submissions**: 100 per minute
- **Historical queries**: 1000 per hour

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @emotionalchain/sdk
```

```javascript
import { EmotionalChainSDK } from '@emotionalchain/sdk';

const client = new EmotionalChainSDK({
  apiKey: 'your_api_key',
  network: 'mainnet'
});

const balance = await client.getBalance('validator_id');
```

### Python
```bash
pip install emotionalchain-python
```

### Go
```bash
go get github.com/emotionalchain/go-sdk
```

### Documentation Links
- [SDK Documentation](./sdk.md)
- [Integration Examples](./examples.md)
- [Best Practices](./best-practices.md)