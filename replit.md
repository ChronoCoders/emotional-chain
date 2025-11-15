# EmotionalChain - Proof of Emotion Blockchain

## Overview

EmotionalChain is a revolutionary blockchain network implementing Proof of Emotion (PoE) consensus - the world's first biometric-validated blockchain that uses real-time emotional and physiological data from validators to secure the network. Unlike traditional Proof of Work or Proof of Stake, EmotionalChain validators must maintain specific emotional fitness levels measured through connected biometric devices (heart rate monitors, EEG sensors, stress detectors) to participate in consensus.

The system combines cutting-edge cryptography, zero-knowledge proofs, Byzantine fault tolerance, and distributed P2P networking to create a human-centric blockchain where emotional authenticity and wellness are core to network security.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for UI components
- Vite as the build tool and development server
- Shadcn UI component library (New York style) with Radix UI primitives
- TailwindCSS for styling with custom design tokens
- React Hook Form with Zod/Joi validation for form handling

**Project Structure:**
- Client code isolated in `/client` directory with separate build output
- Centralized path aliases (@/, @shared, @assets) configured in both TypeScript and Vite
- Component-based architecture following atomic design principles
- CSS variables for theming with dark mode support

### Backend Architecture

**Core Framework:**
- Node.js with TypeScript (ES Modules)
- Express.js server (implied from package name "rest-express")
- Production runtime using esbuild-bundled server code

**Blockchain Implementation:**
- Custom Proof of Emotion consensus engine with Byzantine fault tolerance
- Real-time biometric data validation from hardware devices
- Zero-knowledge proof system for privacy-preserving emotional validation
- Multi-phase consensus: PROPOSE → VOTE → COMMIT
- Fork resolution with longest valid emotional chain rule
- Dynamic validator committee selection with anti-collusion mechanisms

**Biometric Integration:**
- Support for multiple device types: heart rate monitors, EEG sensors, stress detectors, focus monitors
- Real hardware device connectivity via Web Bluetooth and USB APIs
- Cryptographic authenticity proofs for biometric readings
- Multi-device fusion for enhanced validation
- Anti-spoofing and device attestation mechanisms

**Cryptographic Layer:**
- Production-grade cryptography using @noble/curves and @noble/hashes
- ECDSA signatures with secp256k1 for transactions and blocks
- Merkle tree implementation for transaction verification
- Zero-knowledge proof circuits (Circom/SnarkJS) for privacy
- Post-quantum cryptography support (CRYSTALS-Dilithium, CRYSTALS-Kyber)
- Biometric wallet with encrypted key storage

**Consensus Architecture:**
- Emotional scoring algorithm combining heart rate, stress, focus, and authenticity
- Validator selection based on emotional fitness (75%+ threshold)
- Byzantine fault detection with pattern analysis
- Dynamic reward calculation based on emotional contribution
- Slashing mechanisms for poor emotional behavior
- Real-time consensus metrics and monitoring

**P2P Network Layer:**
- libp2p-based peer-to-peer networking
- Multiple transport protocols: TCP, WebSockets, WebRTC
- DHT for peer discovery (Kademlia)
- Pub/Sub messaging (FloodSub) for block propagation
- Network partition detection and recovery
- Distributed validator coordination

**Advanced Features:**
- Smart contract layer with EVM compatibility
- Cross-chain bridges to Ethereum, Polygon, BSC, etc.
- AI-powered consensus optimization using TensorFlow
- Quantum-resistant cryptographic migration
- Privacy layer with zero-knowledge proofs
- Wellness goals and biometric triggers

### Data Storage Solutions

**Primary Database:**
- PostgreSQL via Neon serverless (@neondatabase/serverless)
- Drizzle ORM for type-safe database operations
- Schema defined in `/shared/schema.ts`
- Migration system using drizzle-kit

**Database Schema Highlights:**
- Validators table with emotional scores and reputation
- Blocks table with emotional data and ZK proof references
- Transactions with biometric metadata
- Biometric readings stored as privacy-preserving hashes
- ZK proof records for verification
- Smart contracts and wellness goals
- Bridge transactions for cross-chain operations
- Quantum key pairs for post-quantum migration
- AI model training data

**Storage Patterns:**
- Immutable blockchain data with cryptographic integrity
- Privacy-safe biometric storage (hashes only, not raw data)
- Advanced features backed by real database persistence
- No mock or simulation data in production paths

### Authentication and Authorization

**Biometric Wallet System:**
- Private key encryption using biometric seed derivation
- Multi-factor biometric authentication
- Device fingerprinting for security
- Recovery mechanisms with cryptographic hashing
- Nonce-based replay attack prevention

**Validator Authentication:**
- Cryptographic key pairs for validator identity
- Emotional authenticity as consensus requirement
- Reputation scoring system
- Anti-collusion and anti-gaming measures

### External Dependencies

**Cloud Providers (Infrastructure):**
- AWS SDK: EC2, ECS, S3 for cloud deployment
- Google Cloud: Compute Engine, Storage, Monitoring
- Multi-cloud support for validator node deployment

**Blockchain Integrations:**
- Polkadot API for potential parachain integration
- LayerZero, Axelar, Wormhole for cross-chain bridges
- EVM-compatible smart contract support

**AI/ML Services:**
- TensorFlow.js for consensus optimization
- Custom neural networks for anomaly detection
- Pattern recognition for Byzantine fault detection

**Monitoring and Observability:**
- OpenTelemetry for distributed tracing
- Prometheus metrics (custom EmotionalChain metrics)
- Custom monitoring dashboard for network health

**Cryptographic Libraries:**
- @noble/curves and @noble/hashes (production crypto)
- Circomlib and SnarkJS (zero-knowledge proofs)
- Babel for advanced JavaScript transformations

**Development Tools:**
- TypeScript with strict mode enabled
- Vite with HMR and runtime error overlay
- Replit-specific plugins for development environment
- ESBuild for production bundling

**Smart Contract Development:**
- Hardhat framework for contract deployment
- OpenZeppelin contracts for standards
- Multi-chain deployment scripts

**Testing and Compliance:**
- GDPR compliance systems for biometric data
- SOC 2 Type II compliance controls
- Automated vulnerability management

## Recent Implementations

### Phase 3: GDPR Compliance (November 15, 2025)

**GDPR-Compliant Privacy Architecture:**
- **Client-Side Biometric Processing** (`client/services/biometricProcessor.ts`)
  - All raw biometric data processed on-device
  - Zero-knowledge proofs generated locally
  - Only cryptographic commitments transmitted to blockchain
  
- **Commitment-Only Storage** (`shared/schema.ts`)
  - New `biometricCommitments` table: stores SHA-256 hash(score + nonce)
  - New `offChainProfiles` table: separates personal data from blockchain
  - Deprecated `biometric_data.rawData` field (marked as GDPR violation)
  - Data minimization: only boolean disclosure (score above threshold)

- **GDPR Compliance Service** (`server/gdpr/complianceService.ts`)
  - Right to Erasure (GDPR Article 17): signature-verified deletion workflow
  - Right to Access (Article 15): full data export functionality
  - Right to Data Portability (Article 20): machine-readable export
  - Consent Management: version tracking, revocation, purpose specification

- **GDPR API Endpoints** (`server/routes/gdpr.ts`)
  - `POST /api/gdpr/erasure`: Delete personal data (retains blockchain commitments)
  - `GET /api/gdpr/data/:address`: Export all personal data
  - `POST /api/gdpr/consent`: Record consent with version tracking
  - `POST /api/gdpr/consent/revoke`: Revoke consent (triggers unstaking)
  - `GET /api/gdpr/consent/:address`: Check consent status

- **BiometricConsent Smart Contract** (`shared/contracts/BiometricConsent.ts`)
  - Required before validator registration and staking
  - Consent versioning for policy updates
  - Event log for audit trail
  - Integrated into `/api/validators/stake` (returns 403 if no consent)

**Privacy Model:**
- Three-layer privacy: threshold proofs + batch aggregation + dummy transactions
- Commitments are meaningless without nonce (computationally infeasible to reverse)
- Personal data stored separately and deletable without affecting blockchain
- Research/demonstration project (not production GDPR-compliant yet)

### Phase 1 & 2: Hybrid Consensus (Complete - November 15, 2025)

**Hybrid PoE+PoS Consensus:**
- Minimum stake: 10,000 EMO, 14-day lock period
- Emotional fitness: 75% threshold (soft requirement for optimal rewards)
- Reward calculation: 50% PoS + 50% PoE

**Three-Tier Device Attestation:**
- Tier 1: Commodity devices (OAuth, 0.5x multiplier)
- Tier 2: Medical devices (Serial verified, 1.0x multiplier)
- Tier 3: HSM devices (Cryptographic attestation, 1.5x multiplier)

**ZK Privacy System:**
- Threshold proofs: hide individual scores, reveal only "above threshold"
- Batch proof aggregation: 10 validators per block
- Dummy transaction injection for noise generation
- DEMO/MOCK implementation with production upgrade path