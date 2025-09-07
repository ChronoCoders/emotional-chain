# EmotionalChain - Proof of Emotion Blockchain

## Overview

EmotionalChain is a revolutionary blockchain network that implements "Proof of Emotion" consensus, where validators participate in consensus based on their authenticated emotional and biometric states rather than computational power or stake alone. The system combines real-time biometric data from multiple devices (heart rate monitors, stress sensors, EEG devices) with cryptographic proofs to create a unique consensus mechanism that prioritizes human wellness and authentic participation.

The project is built as a full-stack application with a React/TypeScript frontend, Express.js backend, and PostgreSQL database. It includes comprehensive biometric device integration, advanced cryptography using @noble/curves, cross-chain bridge infrastructure, AI-powered consensus optimization, and enterprise-grade security features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite build system
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React hooks and context for biometric data and validator states
- **Real-time Updates**: WebSocket connections for live biometric streaming and consensus monitoring

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **Language**: TypeScript with strict type checking
- **API Design**: RESTful endpoints with real-time WebSocket support
- **Middleware**: CORS, compression, and custom biometric authentication middleware
- **Service Layer**: Modular services for validator management, biometric processing, and consensus coordination

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle migrations with version control
- **Tables**: Validators, biometric readings, consensus rounds, blocks, transactions, cross-chain bridges
- **Indexing**: Optimized indexes for high-frequency biometric data queries and validator lookups
- **Privacy**: Biometric data stored as cryptographic hashes with ZK proof references

### Consensus Architecture
- **Algorithm**: Proof of Emotion with Byzantine fault tolerance
- **Committee Selection**: Dynamic validator selection based on emotional fitness scores
- **Rounds**: Three-phase consensus (PROPOSE → VOTE → COMMIT) with 30-second epochs (realistic for biometric processing)
- **Thresholds**: 75% minimum emotional score, 67% honest validator requirement
- **Anti-Gaming**: Multi-device biometric validation with authenticity proofs

### Cryptographic Systems
- **Key Management**: ECDSA key pairs using @noble/curves secp256k1
- **Signatures**: Production-grade ECDSA signatures replacing amateur implementations
- **Hashing**: SHA-256 for all cryptographic operations
- **Biometric Proofs**: Cryptographic proofs of emotional authenticity with anti-spoofing
- **Zero-Knowledge**: Privacy-preserving biometric validation using ZK proofs

### P2P Network
- **Library**: libp2p with multiple transport protocols (TCP, WebSockets, WebRTC)
- **Discovery**: Kademlia DHT for peer discovery and routing
- **Messaging**: Protobuf-based emotional protocol for validator communication
- **Security**: Noise protocol for encrypted peer communication
- **Topology**: Mesh network with bootstrap nodes and reputation-based peer management

### Advanced Features
- **Quantum Resistance**: NIST-approved post-quantum cryptographic algorithms
- **Cross-Chain Bridges**: Multi-protocol bridges to Ethereum, Polygon, BSC, and other networks
- **Smart Contracts**: EVM-compatible emotional-aware smart contracts
- **AI Integration**: TensorFlow.js models for consensus optimization and anomaly detection
- **Privacy Layer**: Zero-knowledge proofs for biometric data privacy

### Performance Optimizations
- **Parallel Processing**: Worker threads for validator batch processing
- **Caching**: LRU caches for validator data and emotional scores
- **Database**: Connection pooling and optimized queries for 10,000+ validators
- **WebAssembly**: Crypto acceleration for high-performance operations
- **Batch Operations**: Batched database writes and signature verification

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **ORM**: Drizzle ORM with PostgreSQL driver for type-safe database operations
- **Monitoring**: Prometheus metrics integration for system observability

### Biometric Integration
- **Device APIs**: Web Bluetooth API for heart rate monitors and biometric devices
- **Signal Processing**: Real-time biometric data processing and quality assessment
- **Machine Learning**: TensorFlow.js for emotional pattern recognition

### Cryptography
- **@noble/curves**: Production-grade ECDSA operations with secp256k1
- **@noble/hashes**: SHA-256, HMAC, and PBKDF2 implementations

### P2P Networking
- **libp2p**: Complete P2P networking stack with multiple transport protocols
- **Multiaddr**: Protocol-agnostic network addressing

### Cloud Services
- **AWS SDK**: EC2, ECS, and S3 integration for validator infrastructure
- **Google Cloud**: Compute Engine and storage for global validator deployment
- **Monitoring**: OpenTelemetry for distributed tracing and observability

### Cross-Chain Infrastructure
- **Bridge Protocols**: LayerZero, Axelar, and Wormhole for multi-chain interoperability
- **Token Standards**: ERC-20 compatible tokens with biometric authentication features

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Checking**: TypeScript with strict configuration
- **Code Quality**: ESBuild for fast bundling and module processing