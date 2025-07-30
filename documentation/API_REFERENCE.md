# EmotionalChain API Reference

## Base URL
```
Production: https://emotionalchain.com/api
Development: http://localhost:5000/api
```

## Authentication
Currently using development mode. Production will require API keys.

## Core Endpoints

### Network Status
```http
GET /api/network/status
```
Returns current network health, validator count, and consensus metrics.

**Response:**
```json
{
  "blockHeight": 57,
  "validators": 17,
  "averageConsensus": "95.0%",
  "authenticity": "93.0%",
  "networkHash": "006033802dfdb7f4...",
  "difficulty": 2
}
```

### Blockchain Data

#### Get Blocks
```http
GET /api/blocks?limit=10
```
Returns recent blocks with transaction data.

**Parameters:**
- `limit` (optional): Number of blocks to return (default: 10)

#### Get Transactions
```http
GET /api/transactions?limit=10
```
Returns recent transactions with biometric validation data.

**Parameters:**
- `limit` (optional): Number of transactions to return (default: 10)

### Validator Operations

#### Get Validators
```http
GET /api/validators
```
Returns list of active validators with emotional scores.

#### Get Validator Details
```http
GET /api/biometric/{validatorId}
```
Returns biometric data for specific validator.

### Wallet Operations

#### Get Wallet Balance
```http
GET /api/wallet/{validatorId}
```
Returns EMO balance for validator wallet.

**Response:**
```json
{
  "validatorId": "StellarNode",
  "balance": 283.52,
  "currency": "EMO"
}
```

#### Get All Wallets
```http
GET /api/wallets
```
Returns balances for all validator wallets.

### Mining Operations

#### Start Mining
```http
POST /api/mining/start
```
Starts the mining process.

#### Stop Mining
```http
POST /api/mining/stop
```
Stops the mining process.

#### Mining Status
```http
GET /api/mining/status
```
Returns current mining status and statistics.

### Token Economics

#### Get Token Economics
```http
GET /api/token/economics
```
Returns current token supply, distribution, and economic metrics.

**Response:**
```json
{
  "maxSupply": 1000000000,
  "circulatingSupply": 3547.5,
  "stakingPool": 399996452.5,
  "totalValidators": 17,
  "averageValidatorBalance": 208.67
}
```

## WebSocket Connection

Connect to real-time updates:
```javascript
const ws = new WebSocket('wss://emotionalchain.com/ws');
```

### WebSocket Events
- `connection` - Initial connection established
- `update` - Real-time blockchain updates
- `command_result` - Response to executed commands

## Rate Limits
- Public endpoints: 1000 requests/hour
- Authenticated endpoints: 5000 requests/hour

## Error Codes
- `400` - Bad Request
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## SDKs Available
- JavaScript/Node.js
- Python (planned)
- Go (planned)