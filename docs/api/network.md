# Network API Documentation

## Overview

The Network API provides access to real-time blockchain network status, block data, transaction information, and validator statistics. All endpoints return JSON responses and include real-time data from the EmotionalChain network.

## Base URL

```
/api/
```

## Authentication

Most network endpoints are public and do not require authentication. Rate limiting may apply for high-frequency requests.

## Endpoints

### Network Status

#### GET `/api/network/status`

Returns comprehensive network statistics including validator count, block height, consensus quality, and token economics.

**Response:**
```json
{
  "id": "network_status_12785",
  "connectedPeers": 21,
  "activeValidators": 21,
  "blockHeight": 12785,
  "consensusPercentage": "98.5%",
  "networkStress": "15.2%",
  "networkEnergy": "87.3%",
  "networkFocus": "91.7%",
  "totalSupply": "735659.32",
  "circulatingSupply": "537308.32",
  "tps": "12.5",
  "transactions24h": "18,432",
  "volume24h": 156789.45,
  "timestamp": "2025-01-27T15:30:00Z",
  "isRunning": true
}
```

**Response Fields:**
- `connectedPeers`: Number of connected P2P peers
- `activeValidators`: Active validators participating in consensus
- `blockHeight`: Current blockchain height
- `consensusPercentage`: Network consensus agreement percentage
- `networkStress`: Average stress level across validators (0-100%)
- `networkEnergy`: Average energy level across validators (0-100%)
- `networkFocus`: Average focus level across validators (0-100%)
- `totalSupply`: Total EMO tokens in circulation (from blockchain state)
- `circulatingSupply`: Circulating EMO supply (excludes staked tokens)
- `tps`: Current transactions per second
- `transactions24h`: Transaction count in last 24 hours
- `volume24h`: Transaction volume in EMO over last 24 hours

---

### Blocks

#### GET `/api/blocks`

Retrieves the latest blocks from the blockchain with transaction details and validator information.

**Query Parameters:**
- `limit` (optional): Number of blocks to return (default: 10, max: 100)

**Example:**
```
GET /api/blocks?limit=5
```

**Response:**
```json
[
  {
    "id": "block_abc123",
    "height": 12785,
    "hash": "0x1a2b3c4d5e6f7890abcdef1234567890",
    "previousHash": "0x0987654321abcdef1234567890123456",
    "merkleRoot": "0xaabbccddeeff112233445566778899aa",
    "transactionRoot": "0x1122334455667788990aabbccddeeff00",
    "stateRoot": "0xffeeddccbbaa998877665544332211",
    "timestamp": 1738072200000,
    "nonce": 156789,
    "difficulty": 4,
    "validatorId": "GravityCore",
    "emotionalScore": "89.45",
    "emotionalProof": {
      "heartRate": 72,
      "stressLevel": 15,
      "focusLevel": 88,
      "authenticity": 96
    },
    "transactions": [
      {
        "hash": "0x2067160e...",
        "type": "mining_reward",
        "amount": "51.07",
        "recipient": "GravityCore"
      }
    ],
    "transactionCount": 2,
    "createdAt": "2025-01-27T15:30:00Z"
  }
]
```

---

### Transactions

#### GET `/api/transactions`

Fetches recent transactions from the immutable blockchain ledger.

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 50, max: 1000)

**Example:**
```
GET /api/transactions?limit=20
```

**Response:**
```json
[
  {
    "id": "tx_def456",
    "hash": "0x2067160e1234567890abcdef",
    "blockHash": "0x1a2b3c4d5e6f7890abcdef1234567890",
    "blockNumber": 12785,
    "fromAddress": "system",
    "toAddress": "GravityCore",
    "amount": "51.07",
    "fee": "0.001",
    "timestamp": 1738072200000,
    "signature": {
      "r": "0x1234567890abcdef",
      "s": "0xfedcba0987654321",
      "v": 27
    },
    "emotionalProofHash": "0xabc123def456",
    "status": "confirmed",
    "isBlockchainVerified": true,
    "createdAt": "2025-01-27T15:30:00Z"
  }
]
```

#### GET `/api/transactions/stats`

Returns aggregate transaction statistics.

**Response:**
```json
{
  "totalTransactions": 487530,
  "totalVolume": "12.5M"
}
```

#### GET `/api/transactions/volume`

Returns transaction volume data over time for charts and analytics.

**Response:**
```json
{
  "hourly": [
    { "timestamp": "2025-01-27T14:00:00Z", "volume": 1250.75, "count": 45 },
    { "timestamp": "2025-01-27T15:00:00Z", "volume": 1689.32, "count": 52 }
  ],
  "daily": [
    { "date": "2025-01-26", "volume": 28456.78, "count": 1234 },
    { "date": "2025-01-27", "volume": 31245.67, "count": 1456 }
  ]
}
```

---

### Validators

#### GET `/api/validators`

Retrieves information about all active validators on the network.

**Response:**
```json
[
  {
    "id": "GravityCore",
    "publicKey": "0x04a1b2c3d4e5f6...",
    "balance": "51234.56",
    "emotionalScore": "89.45",
    "reputation": "98.7",
    "isActive": true,
    "totalBlocksMined": 342,
    "totalValidations": 12456,
    "lastActivity": 1738072200000,
    "delegatedStake": "125000.00",
    "commission": "5.0%",
    "uptime": "99.8%",
    "biometricDevices": [
      {
        "type": "heartRate",
        "status": "connected",
        "lastReading": 1738072180000
      }
    ]
  }
]
```

---

### Wallets

#### GET `/api/wallets`

Returns wallet balances for all validators, sourced directly from blockchain state.

**Response:**
```json
[
  {
    "validatorId": "GravityCore",
    "balance": "51234.56",
    "currency": "EMO",
    "stakedBalance": "10000.00",
    "availableBalance": "41234.56",
    "pendingRewards": "234.56"
  }
]
```

#### GET `/api/wallet/:validatorId`

Returns wallet information for a specific validator.

**Example:**
```
GET /api/wallet/GravityCore
```

**Response:**
```json
{
  "validatorId": "GravityCore",
  "balance": "51234.56",
  "currency": "EMO",
  "stakedBalance": "10000.00",
  "availableBalance": "41234.56",
  "pendingRewards": "234.56",
  "recentTransactions": [
    {
      "hash": "0x2067160e...",
      "type": "mining_reward",
      "amount": "51.07",
      "timestamp": 1738072200000
    }
  ]
}
```

#### GET `/api/wallet/status/:validatorId`

Returns detailed wallet status including staking information.

**Response:**
```json
{
  "validatorId": "GravityCore",
  "totalBalance": "51234.56",
  "liquidBalance": "41234.56",
  "stakedBalance": "10000.00",
  "stakingRewards": "1234.56",
  "stakingAPY": "15.7%",
  "lastRewardClaim": 1738072200000,
  "stakingStatus": "active"
}
```

#### POST `/api/wallet/sync`

Forces a synchronization between wallet state and blockchain data.

**Response:**
```json
{
  "success": true,
  "message": "Wallet synced with blockchain",
  "syncedAccounts": 21,
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Token Economics

#### GET `/api/token/economics`

Returns comprehensive token economics and distribution information.

**Response:**
```json
{
  "totalSupply": "735659.32",
  "maxSupply": "1000000000.00",
  "circulatingSupply": "537308.32",
  "stakingPool": {
    "allocated": "400000000.00",
    "remaining": "399875000.00",
    "utilized": "125000.00"
  },
  "wellnessPool": {
    "allocated": "200000000.00",
    "remaining": "199950000.00",
    "utilized": "50000.00"
  },
  "ecosystemPool": {
    "allocated": "250000000.00",
    "remaining": "249900000.00",
    "utilized": "100000.00"
  },
  "rewardStructure": {
    "baseBlockReward": "50.00",
    "baseValidationReward": "5.00",
    "emotionalConsensusBonus": "25.00",
    "minimumValidatorStake": "10000.00"
  },
  "lastBlockHeight": 12785,
  "updatedAt": "2025-01-27T15:30:00Z"
}
```

---

## WebSocket Configuration

#### GET `/api/config/websocket`

Returns WebSocket configuration for real-time connections.

**Response:**
```json
{
  "heartbeatInterval": 30000,
  "reconnectAttempts": 5,
  "reconnectDelay": 2000,
  "fallbackHost": "localhost",
  "fallbackPort": 5000,
  "retryLimit": 10,
  "exponentialBackoffEnabled": true,
  "maxBackoffDelay": 30000
}
```

---

## Error Responses

All API endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-27T15:30:00Z",
  "requestId": "req_abc123"
}
```

**Common Error Codes:**
- `NETWORK_UNAVAILABLE`: Network or blockchain service unavailable
- `VALIDATOR_NOT_FOUND`: Specified validator does not exist
- `INVALID_PARAMETERS`: Request parameters are invalid
- `RATE_LIMIT_EXCEEDED`: Too many requests from client
- `INTERNAL_ERROR`: Server-side error occurred

---

## Rate Limiting

API endpoints are rate-limited to ensure network stability:

- **General endpoints**: 100 requests per minute per IP
- **Real-time endpoints**: 10 requests per second per IP
- **Batch endpoints**: 10 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1738072800
```

---

## WebSocket Real-Time Updates

Connect to `/ws` for real-time network updates:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.on('message', (data) => {
  const update = JSON.parse(data);
  console.log('Network update:', update);
});
```

**Event Types:**
- `block_created`: New block mined
- `transaction_confirmed`: Transaction confirmed
- `validator_status_change`: Validator status updated
- `network_stats_update`: Network statistics changed
- `consensus_round_complete`: Consensus round finished