# Architecture Guide

## System Overview

EmotionalChain is a blockchain platform built on a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  Dashboard | Explorer | Validator Panel | Admin Console    │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP/WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Express.js)                        │
│  API Routes | Middleware | Services | WebSocket Handler   │
└─────────────────────────────────────────────────────────────┘
                            │
                      Database Layer
                            │
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                          │
│  Blocks | Transactions | Validators | Wallets | Biometrics│
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Blockchain Layer

**EmotionalChain.ts** - Main blockchain implementation
- Block creation and validation
- Proof of Emotion consensus
- Transaction processing
- Chain state management

**ProofOfEmotion.ts** - PoE consensus mechanism
- Biometric data validation
- Emotional authenticity scoring
- Validator selection based on emotional state
- Anomaly detection

**EmotionalWallet.ts** - Wallet management
- Balance tracking (liquid + staked)
- Transaction history
- Multi-validator support
- Address generation

### 2. Validator Layer

**distribution.ts** - Geographic validator distribution
- 21 validators across 7 continents
- Load balancing
- Failover mechanisms
- Reputation tracking

**Device Registration** - Three-tier attestation
- Device identity verification
- Biometric sensor calibration
- Status monitoring (online/offline)
- Reward adjustments

### 3. Privacy & Security Layer

**Zero-Knowledge Proofs** - Privacy mechanisms
- Threshold proofs for transaction validation
- Batch proofs for inference attack prevention
- Non-interactive zero-knowledge proofs

**Rate Limiting & Auth**
- API rate limiting (1000 req/15min general, 10 req/5min sensitive)
- Message authentication via nonces
- CORS protection
- Input validation with Zod schemas

### 4. Data Layer

**Schema** - Drizzle ORM with PostgreSQL
- Immutable blocks table
- Transaction history
- Validator profiles
- Biometric readings
- Wallet balances
- Network statistics

**Storage Interface (IStorage)**
- MemStorage for local/development
- PostgreSQL for production (Replit)
- Unified CRUD operations
- Transaction consistency

## Data Flow

### Transaction Flow

```
User submits transaction
        ↓
Input validation (Zod schema)
        ↓
Check wallet balance
        ↓
Create transaction object
        ↓
Add to mempool
        ↓
Validator selection (PoE-based)
        ↓
Biometric validation
        ↓
Block creation
        ↓
Consensus validation (Byzantine FT)
        ↓
Block commitment to chain
        ↓
Wallet update
        ↓
Blockchain Explorer sync
```

### Block Validation Flow

```
New block received
        ↓
Verify block structure
        ↓
Check PoE consensus proof
        ↓
Validate all transactions
        ↓
Check validator reputation
        ↓
Verify digital signature
        ↓
Add to candidate blocks
        ↓
Reach consensus (>2/3 validators)
        ↓
Finalize block
        ↓
Update blockchain state
```

## API Architecture

### Layered Approach

**Routes Layer** (server/routes.ts)
- Entry point for all API requests
- Route registration and middleware setup
- Error handling
- Response formatting

**Services Layer** (server/services/)
- Business logic implementation
- Data validation
- Complex computations
- Integration coordination

**Storage Layer** (server/storage.ts)
- Database abstraction
- CRUD operations
- Transaction management
- Data consistency

## Frontend Architecture

### Page Structure

```
App.tsx (Main Router)
├── Landing Page
├── Dashboard
│   ├── Wallet view
│   ├── Transaction history
│   └── Network stats
├── Validator Dashboard
│   ├── Validator stats
│   ├── Biometric data
│   └── Rewards tracking
├── Explorer
│   ├── Block browser
│   ├── Transaction search
│   └── Validator directory
└── Admin Panel
    ├── Configuration
    ├── Validator management
    └── Network monitoring
```

### Component Hierarchy

```
App
├── Layout (Navigation/Sidebar)
├── ThemeProvider
├── QueryClientProvider
└── [Page Components]
    ├── Forms (React Hook Form + Zod)
    ├── Tables (TanStack Query)
    ├── Cards (Shadcn/UI)
    └── Charts (Custom visualization)
```

## Data Persistence Models

### Replit (Production)

**Database**: Neon PostgreSQL (automatic provisioning)
- Full data persistence
- Automatic backups
- Schema migrations via Drizzle
- Environment variable: `DATABASE_URL`

### Local Development

**Option 1**: In-Memory Storage (MemStorage)
- Data resets on server restart
- Good for testing
- No external dependencies

**Option 2**: Local PostgreSQL
```bash
createdb emotionalchain
export DATABASE_URL="postgresql://postgres@localhost/emotionalchain"
npm run dev
```

## Scalability Considerations

### Current Limits
- **Block time**: 5-10 seconds
- **Throughput**: 100+ TPS
- **Validators**: 21 fixed nodes
- **Consensus**: Byzantine Fault Tolerance (handles 1/3 faulty nodes)

### Optimization Strategies
- Transaction batching
- Off-chain data storage
- Light client support (future)
- Sharding mechanism (future)

## Security Architecture

### Multi-Layer Protection

1. **Network Layer**
   - CORS whitelisting
   - Rate limiting per IP
   - Request validation

2. **Application Layer**
   - Input validation (Zod)
   - SQL injection prevention
   - XSS protection headers

3. **Consensus Layer**
   - Biometric fraud detection
   - Validator reputation system
   - Zero-knowledge proof verification

4. **Storage Layer**
   - Encrypted sensitive data
   - Transaction immutability
   - Audit trails

## Deployment Architecture

### Replit Deployment
- Automatic GitHub integration
- One-click deployment
- Environment variable management
- PostgreSQL auto-provisioning
- HTTPS by default

### Local Deployment
- Node.js + npm
- Express server on port 5000
- Vite dev server hot reloading
- Local PostgreSQL or in-memory DB

## Performance Metrics

```
Metric                  Current      Target
─────────────────────────────────────────
Block time              5-10s        3-5s
Transactions/second     100+         1000+
Finality                2-3 blocks   1 block
Consensus latency       <1s          <500ms
Network bandwidth       ~1MB/block   Optimized
```

## Future Architecture Enhancements

- Multi-chain bridge support
- Off-chain transaction channels
- Sharded validator groups
- Light client framework
- Mobile node support
- Enhanced P2P networking
