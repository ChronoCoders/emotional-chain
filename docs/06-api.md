# API Reference

Complete EmotionalChain REST API documentation.

## Base URL

```
Local Development:  http://localhost:5000
Replit Deployment:  https://your-replit-url.replit.dev
```

## Authentication

Most endpoints don't require authentication. Sensitive operations require:

```
Header: X-Signature
Header: X-Nonce
```

Example:
```bash
curl -X POST http://localhost:5000/api/transfer \
  -H "Content-Type: application/json" \
  -H "X-Signature: signature_hash" \
  -H "X-Nonce: unique_nonce" \
  -d '{"from":"validator1","to":"validator2","amount":100}'
```

## Blockchain Endpoints

### GET /api/blocks

Retrieve recent blocks.

**Query Parameters:**
- `limit` (number, default: 10) - Number of blocks to return

**Response:**
```json
[
  {
    "id": "block_123",
    "height": 19874,
    "previousHash": "hash_previous",
    "merkleRoot": "merkle_hash",
    "timestamp": 1704067200000,
    "validatorId": "StellarNode",
    "transactionCount": 24,
    "reward": 50,
    "difficulty": 0.85,
    "nonce": 12345
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/blocks?limit=5
```

---

### GET /api/blocks/:height

Get a specific block by height.

**Parameters:**
- `height` (number) - Block height

**Response:**
```json
{
  "id": "block_123",
  "height": 19874,
  "previousHash": "hash_previous",
  "merkleRoot": "merkle_hash",
  "timestamp": 1704067200000,
  "validatorId": "StellarNode",
  "transactionCount": 24,
  "transactions": [
    {
      "id": "tx_001",
      "from": "validator1",
      "to": "validator2",
      "amount": 100,
      "fee": 0.001,
      "timestamp": 1704067100000,
      "status": "confirmed"
    }
  ],
  "reward": 50,
  "difficulty": 0.85,
  "nonce": 12345
}
```

**Example:**
```bash
curl http://localhost:5000/api/blocks/19874
```

---

### GET /api/transactions

List recent transactions.

**Query Parameters:**
- `limit` (number, default: 10) - Number to return
- `status` (string) - Filter by status: "pending", "confirmed", "failed"

**Response:**
```json
[
  {
    "id": "tx_001",
    "from": "validator1",
    "to": "validator2",
    "amount": 100,
    "fee": 0.001,
    "timestamp": 1704067100000,
    "status": "confirmed",
    "blockHeight": 19874,
    "transactionIndex": 5
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/transactions?limit=20&status=confirmed
```

---

### POST /api/transfer

Send EMO tokens from one validator to another.

**Request Body:**
```json
{
  "from": "validator1",
  "to": "validator2",
  "amount": 100
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "tx_001",
  "message": "Successfully transferred 100 EMO from validator1 to validator2",
  "fee": 0.001,
  "blockConfirmation": 2
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{"from":"validator1","to":"validator2","amount":100}'
```

---

## Validator Endpoints

### GET /api/validators

List all validators.

**Query Parameters:**
- `status` (string) - Filter by "online" or "offline"

**Response:**
```json
[
  {
    "id": "StellarNode",
    "address": "0x1234567890123456789012345678901234567890",
    "balance": 250000,
    "staked": 10000,
    "status": "online",
    "emotionalScore": 0.82,
    "location": "North America",
    "uptime": 99.7,
    "blocksValidated": 1247,
    "reputation": 98.3,
    "rewardsEarned": 62000
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/validators?status=online
```

---

### GET /api/validators/:id

Get details of a specific validator.

**Parameters:**
- `id` (string) - Validator ID

**Response:**
```json
{
  "id": "StellarNode",
  "address": "0x1234567890123456789012345678901234567890",
  "balance": 250000,
  "staked": 10000,
  "liquid": 240000,
  "status": "online",
  "emotionalScore": 0.82,
  "location": "North America",
  "uptime": 99.7,
  "blocksValidated": 1247,
  "reputation": 98.3,
  "rewardsEarned": 62000,
  "deviceStatus": "active",
  "lastHeartbeat": 1704067200000,
  "anomalyDetected": false
}
```

**Example:**
```bash
curl http://localhost:5000/api/validators/StellarNode
```

---

### GET /api/validators/distribution

Get geographic distribution of validators.

**Response:**
```json
{
  "total": 21,
  "online": 20,
  "offline": 1,
  "byContinent": {
    "north_america": {
      "total": 5,
      "online": 5,
      "validators": ["validator1", "validator2", "validator3", "validator4", "validator5"]
    },
    "europe": {
      "total": 5,
      "online": 5,
      "validators": [...]
    },
    "asia": {
      "total": 4,
      "online": 3,
      "validators": [...]
    }
    // ... other continents
  }
}
```

**Example:**
```bash
curl http://localhost:5000/api/validators/distribution
```

---

## Wallet Endpoints

### GET /api/wallet/:validatorId

Get wallet balance for a specific validator.

**Parameters:**
- `validatorId` (string) - Validator ID

**Response:**
```json
{
  "validatorId": "StellarNode",
  "address": "0x1234567890123456789012345678901234567890",
  "balance": 250000,
  "liquid": 175000,
  "staked": 75000,
  "currency": "EMO",
  "lastUpdated": 1704067200000
}
```

**Example:**
```bash
curl http://localhost:5000/api/wallet/StellarNode
```

---

### GET /api/wallets

List all validator wallets.

**Response:**
```json
[
  {
    "validatorId": "StellarNode",
    "balance": 250000,
    "currency": "EMO"
  },
  {
    "validatorId": "validator2",
    "balance": 180000,
    "currency": "EMO"
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/wallets
```

---

## Biometric Endpoints

### GET /api/biometric/:validatorId

Get latest biometric data for a validator.

**Parameters:**
- `validatorId` (string) - Validator ID

**Response:**
```json
{
  "validatorId": "StellarNode",
  "heartRate": 72,
  "stressLevel": 0.35,
  "emotionalState": "stable",
  "hrv": 45,
  "timestamp": 1704067200000,
  "authenticityScore": 0.82,
  "anomalyDetected": false,
  "deviceId": "device_001"
}
```

**Example:**
```bash
curl http://localhost:5000/api/biometric/StellarNode
```

---

### POST /api/biometric

Submit biometric data to the network.

**Request Body:**
```json
{
  "validatorId": "StellarNode",
  "deviceId": "device_001",
  "heartRate": 72,
  "stressLevel": 0.35,
  "emotionalState": "stable",
  "hrv": 45,
  "temperature": 37.2,
  "respiratoryRate": 16
}
```

**Response:**
```json
{
  "success": true,
  "message": "Biometric data recorded",
  "authenticityScore": 0.82,
  "recordId": "bio_001",
  "nextSubmissionIn": 1000
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/biometric \
  -H "Content-Type: application/json" \
  -d '{
    "validatorId":"StellarNode",
    "deviceId":"device_001",
    "heartRate":72,
    "stressLevel":0.35,
    "emotionalState":"stable",
    "hrv":45,
    "temperature":37.2,
    "respiratoryRate":16
  }'
```

---

## Network Stats Endpoints

### GET /api/network-stats

Get real-time network statistics.

**Response:**
```json
{
  "blockHeight": 19874,
  "totalTransactions": 482561,
  "activeValidators": 20,
  "avgBlockTime": 7.2,
  "transactionsPerSecond": 6.8,
  "networkDifficulty": 0.85,
  "totalStaked": 210000,
  "circulatingSupply": 8400000,
  "timestamp": 1704067200000,
  "networkHealth": "optimal",
  "consensusParticipation": 95.2
}
```

**Example:**
```bash
curl http://localhost:5000/api/network-stats
```

---

### GET /api/network-stats/historical

Get historical network statistics.

**Query Parameters:**
- `days` (number, default: 7) - Number of days of history

**Response:**
```json
[
  {
    "date": "2025-01-01",
    "avgBlockTime": 7.1,
    "avgTps": 6.5,
    "avgDifficulty": 0.84,
    "blocksCreated": 12096
  },
  {
    "date": "2025-01-02",
    "avgBlockTime": 7.3,
    "avgTps": 6.9,
    "avgDifficulty": 0.85,
    "blocksCreated": 12000
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/network-stats/historical?days=30
```

---

## Explorer Endpoints

### GET /api/explorer

Get explorer data for dashboard.

**Response:**
```json
{
  "recentBlocks": [...],
  "recentTransactions": [...],
  "topValidators": [...],
  "networkStats": {...},
  "priceHistory": [...]
}
```

**Example:**
```bash
curl http://localhost:5000/api/explorer
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid request",
  "message": "Missing required field: amount",
  "code": "INVALID_INPUT"
}
```

### 404 Not Found

```json
{
  "error": "Not found",
  "message": "Validator StellarNode not found",
  "code": "VALIDATOR_NOT_FOUND"
}
```

### 500 Server Error

```json
{
  "error": "Server error",
  "message": "Failed to process transaction",
  "code": "INTERNAL_ERROR"
}
```

---

## Rate Limiting

API requests are rate limited per IP:

```
General Endpoints:    1,000 requests / 15 minutes
Sensitive Endpoints:  10 requests / 5 minutes
```

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067800
```

---

## WebSocket Connections

Real-time updates via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Block created:', data);
};

// Supported events:
// - block:created
// - transaction:pending
// - validator:status
// - biometric:update
```

---

## Integration Examples

### JavaScript/Node.js

```javascript
const fetch = require('node-fetch');

async function getValidators() {
  const res = await fetch('http://localhost:5000/api/validators');
  const data = await res.json();
  console.log(data);
}

getValidators();
```

### Python

```python
import requests

response = requests.get('http://localhost:5000/api/validators')
data = response.json()
print(data)
```

### cURL

```bash
curl http://localhost:5000/api/validators | jq
```

---

## Testing Endpoints

Use this sequence to test all functionality:

```bash
# 1. Check network status
curl http://localhost:5000/api/network-stats

# 2. List validators
curl http://localhost:5000/api/validators

# 3. Get validator details
curl http://localhost:5000/api/validators/StellarNode

# 4. Check wallet balance
curl http://localhost:5000/api/wallet/StellarNode

# 5. View blocks
curl http://localhost:5000/api/blocks

# 6. View transactions
curl http://localhost:5000/api/transactions

# 7. Submit biometric data (requires body)
curl -X POST http://localhost:5000/api/biometric \
  -H "Content-Type: application/json" \
  -d '{"validatorId":"StellarNode","heartRate":72,...}'
```

---

## Changelog

**v1.0.0** (Current)
- Block and transaction endpoints
- Validator management
- Wallet operations
- Biometric submission
- Network statistics
- WebSocket support
