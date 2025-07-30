# EmotionalChain Blockchain Application

## Overview

This project is a full-stack web application implementing **EmotionalChain**, the world's first emotion-powered blockchain using Proof of Emotion (PoE) consensus. The application features a terminal-style interface for interacting with blockchain operations, monitoring network status, and managing validators with biometric data integration.

**Latest Update (July 30, 2025):** Successfully completed Step 5 of converting from blockchain simulation to real blockchain implementation. Now features production-grade Proof of Emotion consensus engine with comprehensive Byzantine fault tolerance, real-time emotional validation, and distributed consensus coordination. The system includes ProofOfEmotionEngine, EmotionalValidator, ConsensusRound, EmotionalCommittee, ByzantineTolerance, EmotionalProof, RewardCalculator, ForkResolution, and ConsensusMetrics providing a complete consensus framework with 30-second block times, immediate finality, and 67% Byzantine fault tolerance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom terminal theme
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with WebSocket support for real-time updates
- **Middleware**: Custom logging and error handling middleware

### Terminal Interface Design
The application uses a unique terminal-style interface with:
- ASCII art banner for branding
- Green terminal color scheme
- Real-time data streaming via WebSocket
- Command-line interface for blockchain operations

## Key Components

### Blockchain Core
- **EmotionalChain**: Core blockchain implementation with PoE consensus
- **EmotionalNetwork**: P2P networking layer for validator communication
- **EmotionalWallet**: Multi-wallet system for validator nodes
- **BootstrapNode**: Entry point for network initialization

### Cryptographic Foundation (Step 1 Complete)
- **KeyPair**: Elliptic curve cryptography (secp256k1) for wallet generation and digital signatures
- **Transaction**: Real transaction class with cryptographic signatures and biometric data support
- **MerkleTree**: Transaction integrity verification with merkle proofs
- **Block**: Production-ready blocks with light Proof of Emotion mining (difficulty 2)
- **EmotionalValidator**: Biometric authenticity verification and emotional score calculation

### Biometric Integration Framework (NEW - Step 2 Complete)
- **HeartRateMonitor**: Multi-device heart rate tracking with Polar H10, Garmin, and Fitbit support
- **StressDetector**: HRV-based stress analysis with GSR and temperature sensors (Empatica E4, BioHarness)
- **FocusMonitor**: EEG brainwave analysis for attention and meditation states (Muse 2, OpenBCI, Emotiv)
- **AuthenticityProof**: Cryptographic proof generation with anti-spoofing and liveness detection
- **BiometricWallet**: Hardware-secured wallet with biometric multi-factor authentication
- **DeviceManager**: Multi-device orchestration with health monitoring and redundancy
- **EmotionalConsensus**: Production consensus engine with validator selection and anti-gaming protection

### P2P Network Architecture (Step 3 Complete)
- **P2PNode**: Real libp2p implementation with TCP, WebSocket, and WebRTC transports
- **EmotionalProtocol**: Custom protocol with Protobuf serialization for PoE consensus messages
- **ConsensusEngine**: Distributed Byzantine fault-tolerant consensus with 30-second rounds
- **PeerManager**: Intelligent peer discovery, reputation scoring, and connection management
- **NetworkSecurity**: DDoS protection, peer authentication, and malicious node detection
- **BiometricBroadcast**: Real-time emotional data propagation with privacy preservation

### Persistent Storage Architecture (Step 4 Complete)
- **DatabaseStorage**: Integrated storage system replacing all in-memory Maps with PostgreSQL
- **PostgreSQLStorage**: Production database layer with ACID transactions and connection pooling
- **StateManager**: Validator state management with emotional scoring and consensus tracking
- **ReplicationManager**: Multi-node data replication with Byzantine fault tolerance
- **CacheManager**: High-performance in-memory caching with intelligent eviction policies
- **Schema Migration**: Enhanced database schema supporting blockchain operations and biometric data

### Production Consensus Engine (NEW - Step 5 Complete)
- **ProofOfEmotionEngine**: Core consensus coordinator with 30-second epochs and Byzantine fault tolerance
- **EmotionalValidator**: Real-time biometric monitoring with reputation system and slashing protection
- **ConsensusRound**: Three-phase consensus (PROPOSE → VOTE → COMMIT) with timeout handling
- **EmotionalCommittee**: Dynamic validator selection with anti-collusion and rotation mechanisms
- **ByzantineTolerance**: Malicious validator detection with quarantine and evidence tracking
- **EmotionalProof**: Cryptographic authenticity proofs with zero-knowledge privacy preservation
- **RewardCalculator**: Dynamic EMO rewards based on emotional contribution and network participation
- **ForkResolution**: Automatic fork detection with longest valid emotional chain resolution
- **ConsensusMetrics**: Real-time performance monitoring with alerting and trend analysis

### Data Layer (Enhanced - Step 4 Complete)
- **Database**: PostgreSQL with Drizzle ORM and enhanced blockchain schema
- **Connection**: Neon Database serverless adapter with connection pooling
- **Schema**: Production blockchain tables (blocks, transactions, validator_states, biometric_data, consensus_rounds, peer_reputation)
- **Storage System**: Complete replacement of MemStorage with DatabaseStorage
- **Replication**: Multi-node data consistency with automatic conflict resolution
- **Caching**: Intelligent multi-layer caching with hot data identification
- **State Management**: Real-time validator state tracking with emotional consensus integration

### Real-time Features
- **WebSocket Server**: Custom WebSocket implementation for live updates
- **Terminal Commands**: Interactive command system for blockchain operations
- **Live Monitoring**: Real-time network statistics and validator status

### UI Components
- **Terminal Interface**: Command-line style interaction
- **Blockchain Explorer**: Visual block and transaction explorer
- **Validator Dashboard**: Real-time validator monitoring
- **Biometric Status**: Integration with wearable devices
- **Consensus Monitor**: PoE consensus visualization

## Data Flow

1. **User Interaction**: Commands entered through terminal interface
2. **WebSocket Communication**: Real-time bidirectional data flow
3. **API Layer**: RESTful endpoints for blockchain data
4. **Blockchain Processing**: EmotionalChain core processes transactions
5. **Database Persistence**: Data stored via Drizzle ORM
6. **Real-time Updates**: WebSocket broadcasts updates to connected clients

### Key Data Entities
- **Blocks**: Blockchain blocks with emotional consensus scores
- **Transactions**: Financial transactions with validation status
- **Validators**: Node operators with biometric authentication
- **Biometric Data**: Heart rate, stress, and focus metrics
- **Network Stats**: Overall network health and performance

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **ws**: WebSocket server implementation
- **express**: Web server framework

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight router

### Development Tools
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tsx**: TypeScript execution
- **esbuild**: Production bundling

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite dev server with HMR
- **API Server**: Express server with tsx
- **Database**: Drizzle migrations for schema management
- **Real-time**: WebSocket server integrated with Express

### Production Build
- **Frontend**: Vite builds to `dist/public`
- **Backend**: esbuild bundles server to `dist/index.js`
- **Static Assets**: Served via Express static middleware
- **Environment**: NODE_ENV controls build optimizations

### Database Management
- **Migrations**: Drizzle Kit handles schema migrations
- **Connection**: DATABASE_URL environment variable required
- **Dialect**: PostgreSQL with serverless adapter

### Key Scripts
- `npm run dev`: Development with hot reload
- `npm run build`: Production build
- `npm run start`: Production server
- `npm run db:push`: Apply database schema changes

The application implements a sophisticated blockchain system with a unique terminal interface, emphasizing real-time interaction and biometric validation for a next-generation blockchain experience.