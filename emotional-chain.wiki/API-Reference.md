# API Reference

Base URL: `http://localhost:5000`

## Blockchain Endpoints

### GET /api/blocks
```bash
curl http://localhost:5000/api/blocks?limit=10
```
Returns recent blocks

### GET /api/blocks/:height
```bash
curl http://localhost:5000/api/blocks/19874
```
Get specific block by height

### GET /api/transactions
```bash
curl http://localhost:5000/api/transactions?limit=20
```
List recent transactions

### POST /api/transfer
```bash
curl -X POST http://localhost:5000/api/transfer \
  -H "Content-Type: application/json" \
  -d '{"from":"validator1","to":"validator2","amount":100}'
```
Send EMO tokens

## Validator Endpoints

### GET /api/validators
```bash
curl http://localhost:5000/api/validators
```
List all validators

### GET /api/validators/:id
```bash
curl http://localhost:5000/api/validators/StellarNode
```
Get validator details

### GET /api/validators/distribution
```bash
curl http://localhost:5000/api/validators/distribution
```
Geographic validator distribution

## Wallet Endpoints

### GET /api/wallet/:validatorId
```bash
curl http://localhost:5000/api/wallet/StellarNode
```
Get wallet balance

### GET /api/wallets
```bash
curl http://localhost:5000/api/wallets
```
List all wallets

## Biometric Endpoints

### GET /api/biometric/:validatorId
```bash
curl http://localhost:5000/api/biometric/StellarNode
```
Latest biometric data

### POST /api/biometric
```bash
curl -X POST http://localhost:5000/api/biometric \
  -H "Content-Type: application/json" \
  -d '{
    "validatorId":"StellarNode",
    "heartRate":72,
    "stressLevel":0.35,
    "emotionalState":"stable"
  }'
```
Submit biometric data

## Network Stats

### GET /api/network-stats
```bash
curl http://localhost:5000/api/network-stats
```

Response includes:
- Block height
- Total transactions
- Active validators
- Average block time
- Transactions per second

### GET /api/network-stats/historical
```bash
curl http://localhost:5000/api/network-stats/historical?days=30
```

Historical network statistics

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Missing required field"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Validator not found"
}
```

### 500 Server Error
```json
{
  "error": "Server error",
  "message": "Failed to process request"
}
```

## Rate Limiting

- **General Endpoints**: 1,000 requests / 15 minutes
- **Sensitive Endpoints**: 10 requests / 5 minutes

Response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: timestamp
```

## WebSocket

Real-time updates:
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Update:', data);
};
```

Events: `block:created`, `transaction:pending`, `validator:status`, `biometric:update`

## Integration Examples

### JavaScript
```javascript
const validators = await fetch('http://localhost:5000/api/validators')
  .then(r => r.json());
console.log(validators);
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

See [Developers](#) for more implementation details.
