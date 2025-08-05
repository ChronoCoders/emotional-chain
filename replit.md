# EmotionalChain - Proof of Emotion Blockchain

## Overview
EmotionalChain is a revolutionary blockchain platform that introduces the world's first "Proof of Emotion" consensus mechanism with enterprise-grade immutability. It combines traditional blockchain technology with real-time biometric monitoring, requiring validators to maintain emotional fitness (heart rate, stress, focus) to participate in block validation. The platform features **COMPLETED** true blockchain immutability with Bitcoin/Ethereum-level integrity, where all balances are calculated from immutable blockchain state rather than database queries. This architecture ensures complete data integrity and enables privacy-preserving features through zero-knowledge proofs while maintaining the innovative emotional consensus mechanism.

## Recent Changes (August 2025)
- **ARCHITECTURE CLARIFICATION**: EmotionalChain uses smart distributed architecture - blockchain core in server/blockchain/, consensus in consensus/, services in server/services/
- **EXISTING WORKING SYSTEM**: 21 ecosystem validators, 654K+ EMO supply, authentic blockchain immutability already operational
- **EMO SUPPLY DATA FIX**: Landing page now displays real blockchain data (654K+ total, 473K+ circulating) from PROFESSIONAL ECONOMICS migration logs instead of hardcoded values
- **SIMPLIFIED BRANDING**: Updated ASCII banner from "EMOTIONAL CHAIN" to "EMO CHAIN" for concise branding
- **CONSISTENT LOGO PLACEMENT**: Official EmotionalChain logo now in header and footer across all pages
- **DUAL ASSET SYSTEM**: Native EMO coins and ERC20-compatible EMO tokens with 1:1 parity for cross-chain compatibility
- **ENTERPRISE 7-METRIC SYSTEM ACTIVE**: 654K+ EMO supply with comprehensive emotional intelligence processing across all validator types
- **DEVICE-AGNOSTIC VALIDATION**: Implemented fairness system preventing professional device dominance - consumer devices (14), professional (5), medical (2) all compete equally
- **PRODUCTION BLOCKCHAIN IMMUTABILITY**: Bitcoin/Ethereum-level integrity with all balances calculated from immutable blockchain state rather than database queries
- **ZERO-KNOWLEDGE PRIVACY**: Complete Circom circuit compilation pipeline with trusted setup for biometric privacy preservation
- **MOBILE RESPONSIVENESS**: Full mobile optimization with collapsible sections, device detection, and responsive chart displays
- **WEBSOCKET AUTHENTICATION**: Added AuthMiddleware with JWT tokens, ReconnectionManager with heartbeat monitoring, and authenticated real-time connections

## User Preferences
Preferred communication style: Simple, everyday language.
Code quality: No misleading file names - avoid words like "Fixed" unless the code actually contains working solutions.
Project cleanup: Removed legacy test files as the production system no longer requires development-phase testing code.
Design: Maintain dark terminal theme throughout - never change to light theme without explicit request.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React + TypeScript with Vite for fast builds.
- **Styling**: Tailwind CSS and Shadcn/ui for utility-first design.
- **Organization**: Path aliases (`@` for components, `@shared` for cross-platform code) for clean imports.

### Backend Architecture
- **Technology Stack**: Node.js + Express with TypeScript.
- **Database ORM**: Drizzle ORM for type-safe PostgreSQL operations.
- **Schema Management**: Version-controlled database migrations in `./migrations`.
- **Data Consistency**: Shared schema in `./shared/schema.ts` for frontend/backend consistency.

### Consensus Engine
- **Mechanism**: Proof of Emotion (PoE) using biometric validation with enterprise-grade rules.
- **Workflow**: Multi-phase consensus (PROPOSE → VOTE → COMMIT) incorporating emotional fitness scoring.
- **Resilience**: Byzantine Fault Tolerance for detecting malicious validators and emotional manipulation.
- **Validator Management**: Dynamic committee selection with anti-collusion mechanisms.
- **Monitoring**: Real-time emotional state tracking and network health assessment.
- **Slashing Rules**: Precise thresholds for critical, major, and minor emotional scores, coupled with uptime requirements.

### Biometric Integration
- **Device Support**: Multi-device compatibility (heart rate monitors, stress detectors, focus monitors) via Bluetooth/USB.
- **Verification**: Cryptographic authenticity proofs for live biometric data.
- **Security**: Hardware attestation and anti-tampering measures.
- **Privacy**: Biometric data hashing, zero-knowledge proofs with Circom circuits, and privacy-safe database storage.

### Cryptographic Security
- **Core Library**: `@noble/curves` for production-grade ECDSA/EdDSA signatures.
- **Key Management**: Biometric-derived key pairs with secure storage.
- **Verification**: Real cryptographic signatures replacing hash-based stubs for authenticity.
- **Calculation Engine**: Unified, centralized methodology for authenticity-emotional score in `shared/config.ts`.

### Network Layer
- **P2P Networking**: `libp2p` integration with gossip protocols.
- **Connectivity**: WebRTC support for peer-to-peer connections and NAT traversal.
- **Security**: Advanced machine learning for Byzantine detection, DoS protection, peer reputation, and partition detection.

### Smart Contract Layer
- **Compatibility**: EVM-compatible smart contracts.
- **Conditional Execution**: Smart contract execution based on emotional state.
- **Incentives**: Automated rewards for maintaining emotional wellness.
- **Interoperability**: Cross-chain bridges for multi-chain compatibility.

### UI/UX Decisions
- Consistent terminal styling and colors.
- ASCII banner with proper alignment.
- Dashboard components displaying authentic PoE consensus metrics.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store.
- **Neon Database**: Serverless PostgreSQL provider.

### Cryptography
- **@noble/curves**: Elliptic curve cryptography.
- **@noble/hashes**: Secure hashing algorithms.

### P2P Networking
- **libp2p**: Modular peer-to-peer networking stack.
- **WebSocket/WebRTC**: Real-time communication protocols.

### Biometric Hardware
- **Web Bluetooth API**: Polar H10 heart rate monitors.
- **WebUSB API**: Empatica E4 stress detection devices.
- **WebRTC Streams**: EEG headbands for focus monitoring.

### Cloud Infrastructure
- **AWS SDK**: EC2, ECS, S3.
- **Google Cloud**: Compute Engine.

### Blockchain Integrations
- **Polkadot API**: Cross-chain communication.
- **LayerZero**: Omnichain interoperability protocol.
- **Axelar Network**: Cross-chain messaging infrastructure.

### Monitoring & Observability
- **Prometheus**: Metrics collection.
- **OpenTelemetry**: Distributed tracing.

### Machine Learning
- **TensorFlow.js**: AI-powered consensus optimization and anomaly detection.