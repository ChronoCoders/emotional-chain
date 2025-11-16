# EmotionalChain - Proof of Emotion Blockchain

## Overview

EmotionalChain is a pioneering blockchain network utilizing Proof of Emotion (PoE) consensus, securing the network through real-time emotional and physiological data from validators. This human-centric blockchain leverages biometric devices (heart rate monitors, EEG sensors) to ensure validators maintain specific emotional fitness levels for participation. It integrates advanced cryptography, zero-knowledge proofs, Byzantine fault tolerance, and distributed P2P networking to establish a network where emotional authenticity and wellness are fundamental to security. The project aims to create a scalable, privacy-preserving, and economically sustainable blockchain.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for development and bundling. It employs Shadcn UI (New York style) with Radix UI primitives and TailwindCSS for styling, following an atomic design pattern. The project structure isolates client code, uses centralized path aliases, and supports theming with dark mode.

### Backend Architecture

The backend is developed with Node.js and TypeScript, primarily using Express.js. The core innovation is the custom Proof of Emotion consensus engine, which includes biometric data validation from hardware devices, a zero-knowledge proof system for privacy, and a multi-phase consensus mechanism (PROPOSE → VOTE → COMMIT).

**Key Features:**

*   **Biometric Integration:** Supports various device types (heart rate, EEG, stress, focus monitors) with Web Bluetooth and USB APIs, featuring cryptographic authenticity proofs and anti-spoofing.
*   **Cryptographic Layer:** Utilizes @noble/curves and @noble/hashes for production-grade cryptography, ECDSA signatures, Merkle trees, and integrates zero-knowledge proof circuits (Circom/SnarkJS) and post-quantum cryptography (CRYSTALS-Dilithium, CRYSTALS-Kyber).
*   **Consensus Architecture:** Features an emotional scoring algorithm, validator selection based on emotional fitness, Byzantine fault detection, dynamic reward calculation, and slashing mechanisms.
*   **P2P Network Layer:** Built on libp2p with multiple transport protocols (TCP, WebSockets, WebRTC), DHT for peer discovery (Kademlia), and Pub/Sub messaging (GossipSub for optimized block propagation).
*   **Scalability Solutions:** Implements a hierarchical validator network (PRIMARY, SECONDARY, LIGHT tiers) with varying bandwidth, uptime, and stake requirements, and optimized P2P networking with topic-based routing and header-only propagation for bandwidth efficiency.
*   **Advanced Features:** Includes EVM-compatible smart contract layer, cross-chain bridges, AI-powered consensus optimization using TensorFlow, quantum-resistant cryptography, and a privacy layer.
*   **Tokenomics & Gaming Prevention:** Implements a fixed-cap token supply (100,000,000 EMO), a halving schedule for block rewards, and multi-signal gaming prevention using cross-correlation analysis and anomaly detection across multiple biometric signals.
*   **Hybrid Consensus:** Combines PoE with Proof of Stake (PoS), requiring a minimum stake and emotional fitness for optimal rewards.
*   **Device Attestation:** A three-tier system for biometric device attestation (Commodity, Medical, HSM) with varying trust multipliers.

### Data Storage Solutions

PostgreSQL is used as the primary database, accessed via Neon serverless and Drizzle ORM for type-safe operations. The schema defines tables for validators, blocks, transactions, biometric commitments (privacy-safe hashes), ZK proof records, smart contracts, and wellness goals. GDPR-compliant privacy architecture focuses on client-side biometric processing, commitment-only storage, and comprehensive GDPR service endpoints for erasure, access, and consent management.

### Authentication and Authorization

A biometric wallet system secures private keys using biometric seed derivation and multi-factor biometric authentication. Validator authentication relies on cryptographic key pairs, emotional authenticity, and a reputation scoring system.

## External Dependencies

*   **Cloud Providers:** AWS SDK (EC2, ECS, S3) and Google Cloud (Compute Engine, Storage, Monitoring) for multi-cloud deployment.
*   **Blockchain Integrations:** Polkadot API, LayerZero, Axelar, Wormhole for cross-chain capabilities, and EVM-compatible smart contract support.
*   **AI/ML Services:** TensorFlow.js for consensus optimization and custom neural networks for anomaly detection.
*   **Monitoring:** OpenTelemetry for distributed tracing and Prometheus for metrics.
*   **Cryptographic Libraries:** @noble/curves, @noble/hashes, Circomlib, and SnarkJS.
*   **Development Tools:** TypeScript, Vite, Replit-specific plugins, and ESBuild.
*   **Smart Contract Development:** Hardhat framework and OpenZeppelin contracts.
*   **Compliance:** GDPR compliance systems and SOC 2 Type II controls.