# Architecture Overview

## System Design

EmotionalChain uses a three-tier architecture:

```
Frontend (React)
    ↓ HTTP/WebSocket
Express Backend
    ↓
PostgreSQL Database
```

## Core Components

### 1. Blockchain Layer
- **EmotionalChain.ts** - Main implementation
- **ProofOfEmotion.ts** - PoE consensus
- **EmotionalWallet.ts** - Wallet management

### 2. Validator Layer
- **distribution.ts** - 21 validators across 7 continents
- **Device Registration** - Three-tier attestation
- **Biometric Collection** - Real-time sensor data

### 3. Privacy Layer
- **Zero-Knowledge Proofs** - Transaction privacy
- **Threshold Proofs** - Inference attack prevention
- **Rate Limiting** - API protection

### 4. Data Layer
- **PostgreSQL Database** - Persistent storage
- **MemStorage** - In-memory alternative
- **Drizzle ORM** - Database abstraction

## Data Flow

### Transaction Processing

```
Submit Transaction
    ↓
Validate Input
    ↓
Check Wallet Balance
    ↓
Add to Mempool
    ↓
Validator Selection (PoE)
    ↓
Biometric Validation
    ↓
Block Creation
    ↓
Byzantine Consensus
    ↓
Block Finalization
    ↓
Update Wallets
```

## API Architecture

### Routes Layer
- Entry points for all requests
- Input validation
- Error handling

### Services Layer
- Business logic
- Consensus algorithms
- Token calculations

### Storage Layer
- Database abstraction
- CRUD operations
- Transaction consistency

## Frontend Pages

```
App (Router)
├── Landing
├── Dashboard (wallet, transactions)
├── Validator (metrics, rewards)
├── Explorer (blocks, transactions)
└── Admin (configuration, management)
```

## Performance

| Metric | Value |
|--------|-------|
| Block Time | 5-10 seconds |
| Throughput | 100+ TPS |
| Latency | <1 second |
| Validators | 21 fixed |
| Byzantine FT | Handles 1/3 faulty |

## Deployment

**Replit**: Automatic PostgreSQL, one-click deploy  
**Local**: Node.js + in-memory or PostgreSQL  
**Production**: Kubernetes-ready, horizontally scalable

---

For more details, see [Getting Started](Getting-Started) or [API Reference](API-Reference).
