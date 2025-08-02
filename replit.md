# Overview

EmotionalChain is a novel blockchain platform implementing a "Proof of Emotion" consensus mechanism that uses real-time biometric data from validators to secure the network. The system combines traditional blockchain technology with biometric authentication, requiring validators to maintain emotional and physical wellness scores above certain thresholds to participate in consensus. This creates a unique approach to blockchain security that ties network participation to human emotional and physiological states.

The project includes a full-stack implementation with a React frontend, Express.js backend, PostgreSQL database with Drizzle ORM, and comprehensive biometric device integration capabilities. It also features advanced components like cross-chain bridges, quantum-resistant cryptography, privacy layers with zero-knowledge proofs, and AI-powered consensus optimization.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript and Vite for development tooling
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **Styling**: CSS variables for theming with dark mode support
- **Build System**: Vite with custom aliases for clean imports (@, @shared, @assets)
- **Component Structure**: Modular component architecture using Radix UI primitives

## Backend Architecture
- **Runtime**: Node.js with TypeScript and ESM modules
- **Framework**: Express.js for REST API endpoints
- **Database**: PostgreSQL with Neon serverless for cloud deployment
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Build System**: ESBuild for production bundling with external package handling

## Consensus Engine
- **Algorithm**: Custom "Proof of Emotion" consensus requiring 67% honest validators
- **Committee Size**: 21 active validators selected through emotional scoring
- **Round Structure**: Three-phase process (PROPOSE → VOTE → COMMIT) with 30-second epochs
- **Byzantine Tolerance**: Advanced detection of emotional manipulation and collusion
- **Emotional Thresholds**: 75% minimum emotional fitness score for participation

## Biometric Integration
- **Device Support**: Heart rate monitors (Polar H10), stress detectors (Empatica E4), focus monitors (EEG devices)
- **Connection Types**: Web Bluetooth, USB, and WebRTC for device communication
- **Data Processing**: Real-time signal processing with HRV analysis and authenticity proofs
- **Security**: Hardware authentication and anti-tampering measures for biometric devices

## Cryptographic Infrastructure
- **Key Management**: Production-grade elliptic curve cryptography using @noble/curves
- **Hashing**: SHA-256 and SHA-3 for block and transaction integrity
- **Signatures**: EdDSA and BLS signature schemes for validator authentication
- **Quantum Resistance**: Post-quantum cryptography preparation with CRYSTALS-Dilithium
- **Privacy**: Zero-knowledge proofs for biometric data privacy protection

## Network Layer
- **P2P Protocol**: libp2p stack with TCP, WebSockets, and WebRTC transports
- **Messaging**: Custom emotional protocol for biometric data broadcasting
- **Peer Management**: Reputation-based peer selection with anti-DoS protection
- **Consensus Networking**: Gossip protocol for efficient block and vote propagation

## Data Storage
- **Primary Database**: PostgreSQL with comprehensive schema for validators, blocks, transactions
- **Biometric Storage**: Encrypted biometric data with privacy-compliant retention policies
- **Advanced Features**: Separate storage for quantum keys, privacy proofs, bridge transactions
- **Performance**: Connection pooling and query optimization for high-throughput operations

## Monitoring and Compliance
- **Metrics**: Prometheus integration for comprehensive system monitoring
- **Privacy Compliance**: GDPR-compliant biometric data processing with consent management
- **Security Compliance**: SOC 2 Type II controls implementation
- **Audit Logging**: Comprehensive audit trails for all biometric and consensus operations

# External Dependencies

## Blockchain and Cryptography
- **@noble/curves**: Production-grade elliptic curve cryptography for key generation and signatures
- **@noble/hashes**: Secure hashing functions (SHA-256, SHA-3, HMAC, PBKDF2)
- **@neondatabase/serverless**: PostgreSQL serverless database connection for cloud deployment
- **drizzle-kit**: Database schema management and migrations

## P2P Networking
- **@libp2p/tcp**: TCP transport for peer-to-peer communication
- **@libp2p/websockets**: WebSocket transport for browser compatibility
- **@libp2p/webrtc**: WebRTC transport for NAT traversal
- **@libp2p/noise**: Secure transport encryption
- **@libp2p/kad-dht**: Distributed hash table for peer discovery
- **@libp2p/floodsub**: Publish-subscribe messaging for consensus coordination

## Cloud Infrastructure
- **AWS SDK**: EC2, ECS, and S3 services for cloud deployment and storage
- **Google Cloud**: Compute Engine, Storage, and Monitoring services
- **Microsoft API Extractor**: API documentation and type extraction

## Frontend Development
- **React**: Core frontend framework with TypeScript support
- **@radix-ui**: Accessible UI primitives for complex components
- **@hookform/resolvers**: Form validation with Joi schema integration
- **Tailwind CSS**: Utility-first CSS framework for responsive design

## Development and Monitoring
- **@opentelemetry**: Distributed tracing and monitoring for performance insights
- **@babel/core**: JavaScript transpilation for cross-browser compatibility
- **Vite**: Fast development server and build tool
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Blockchain Interoperability
- **@polkadot/api**: Polkadot ecosystem integration for cross-chain functionality
- **LayerZero, Axelar, Wormhole**: Cross-chain bridge protocols for multi-chain deployment

## Validation and Security
- **@hapi/joi**: Schema validation for API endpoints and data integrity
- **argon2**: Secure password hashing for key derivation from biometric data
- **Various cryptographic libraries**: For quantum-resistant algorithms and zero-knowledge proofs