# EmotionalChain Blockchain Application

## Overview

This project is a full-stack web application implementing **EmotionalChain**, the world's first emotion-powered blockchain using Proof of Emotion (PoE) consensus. The application features a terminal-style interface for interacting with blockchain operations, monitoring network status, and managing validators with biometric data integration. The vision is to create a secure, transparent, and user-centric blockchain network powered by human emotions, with potential applications in wellness, secure identity, and novel incentive structures.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Library**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom terminal theme
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with WebSocket support
- **Configuration**: Centralized system with Zod schema validation and environment variable overrides, ensuring zero hardcoded values.

### Core Blockchain Components
- **Blockchain Core**: EmotionalChain with PoE consensus.
- **Cryptographic Foundation**: KeyPair (secp256k1), Transactions with biometric data, MerkleTree, Blocks with PoE mining, EmotionalValidator for biometric authenticity.
- **Biometric Integration**: Multi-device support for heart rate, stress, and focus monitoring (e.g., Polar H10, Empatica E4, Muse 2) with cryptographic proof generation and hardware-secured BiometricWallet.
- **P2P Network**: libp2p implementation with custom EmotionalProtocol (Protobuf), ConsensusEngine (Byzantine fault-tolerant, 30-second rounds), PeerManager, and NetworkSecurity.
- **Persistent Storage**: PostgreSQL with Drizzle ORM replacing in-memory storage, featuring ACID transactions, replication, and caching.
- **Consensus Engine**: ProofOfEmotionEngine coordinating a three-phase consensus (PROPOSE → VOTE → COMMIT), dynamic EmotionalCommittee selection, and Byzantine tolerance.
- **Advanced Features**: EVM-compatible emotion-aware smart contracts, AI-enhanced consensus (TensorFlow.js), post-quantum cryptography, cross-chain bridges, and privacy layers (ZKPs).

### Infrastructure
- **Production Infrastructure**: NodeManager, LoadBalancer, Prometheus/Grafana monitoring, SecurityManager.
- **Containerization**: Docker for multi-stage builds.
- **Orchestration**: Kubernetes for deployment with auto-scaling and persistent storage.
- **CI/CD**: Automated testing, building, and deployment with zero-downtime updates.

### UI/UX Design
- **Terminal Interface**: ASCII art banner, green color scheme, real-time data streaming via WebSocket, command-line interface.
- **Public Explorer**: mempool.space-inspired public blockchain explorer (`/explorer`) with network overview, validator leaderboard, transaction/block browser, and wellness analytics.
- **Validator Dashboard**: Real-time monitoring within the terminal.

## External Dependencies

### Core
- **@neondatabase/serverless**: PostgreSQL serverless connection.
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: Server state management.
- **ws**: WebSocket server implementation.
- **express**: Web server framework.

### UI
- **@radix-ui/***: Accessible UI primitives.
- **tailwindcss**: Utility-first CSS framework.
- **lucide-react**: Icon library.
- **wouter**: Lightweight router.

### Development Tools
- **vite**: Build tool and dev server.
- **typescript**: Type checking.
- **tsx**: TypeScript execution.
- **esbuild**: Production bundling.