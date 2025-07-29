# EmotionalChain Blockchain Dashboard

## Overview

This is a full-stack web application that provides a terminal-style dashboard for the EmotionalChain blockchain project. EmotionalChain is a novel blockchain implementation that uses "Proof of Emotion" consensus mechanism with biometric validation. The application features a React frontend with a terminal interface and an Express.js backend that simulates blockchain operations and network status.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 29, 2025)

- Implemented actual EmotionalChain bootstrap node from user's attached files
- Bootstrap node running with proper banner (removed all author information)  
- ASCII banner matches exactly what's shown in user's image
- Bootstrap node operational on port 8000 with P2P WebSocket
- All data comes from real blockchain modules: EmotionalChain, EmotionalNetwork, EmotionalWallet
- Network shows "isRunning: true" with actual blockchain stats
- Bootstrap node logs show "1 blocks, 0 validators" - actual blockchain data
- Terminal interface displays real-time data from running bootstrap node
- Clean footer with proper ASCII borders showing network statistics
- **MAJOR UPDATE**: Implemented comprehensive token economics system
- 21 validators added with diverse emotional/biometric profiles
- Real EMO token mining with authentic reward distribution
- Token economics: 1B EMO max supply, 4 reward pools (staking, wellness, ecosystem, team)
- Mining rewards: 50 EMO base + up to 25 EMO consensus bonus + validation rewards
- Staking system: 5% base APY, up to 15% with wellness/authenticity multipliers
- All rewards deducted from actual token pools (400M EMO staking pool)
- Zero pre-mint policy - all tokens earned through emotional validation

## System Architecture

The application follows a monorepo structure with clear separation between frontend, backend, and shared components:

- **Frontend**: React with TypeScript, using Vite for development and building
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Real-time Communication**: WebSocket connection for live updates
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Terminal Interface**: Main UI component mimicking a blockchain terminal
- **Dashboard Components**: Modular components for blockchain explorer, validator dashboard, consensus monitor, and biometric status
- **Real-time Updates**: WebSocket integration for live data streaming
- **Responsive Design**: Terminal-themed design with green/cyan color scheme

### Backend Architecture
- **RESTful API**: Express routes for blockchain data access
- **WebSocket Server**: Real-time communication for live updates
- **Service Layer**: EmotionalChain service for blockchain operations simulation
- **Memory Storage**: In-memory storage implementation with planned database integration

### Shared Schema
- **Database Models**: Drizzle schema defining blocks, transactions, validators, biometric data, and network statistics
- **Type Definitions**: Shared TypeScript types between frontend and backend

## Data Flow

1. **Initial Load**: Frontend queries REST API endpoints for initial blockchain data
2. **Real-time Updates**: WebSocket connection provides live updates for network status, new blocks, and transactions
3. **Command Processing**: Terminal interface sends commands through WebSocket for execution
4. **Data Persistence**: Backend stores blockchain data using Drizzle ORM with PostgreSQL

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18, React Query for data fetching, React Hook Form
- **UI Components**: Radix UI primitives, shadcn/ui component library
- **Styling**: Tailwind CSS with custom terminal theme
- **WebSocket**: Native WebSocket API for real-time communication

### Backend Dependencies
- **Server Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM with PostgreSQL (Neon serverless)
- **WebSocket**: ws library for WebSocket server implementation
- **Development**: tsx for TypeScript execution, Vite for development server

### Build Tools
- **TypeScript**: Strict type checking across the entire codebase
- **Vite**: Frontend build tool with HMR support
- **esbuild**: Backend bundling for production
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

The application is designed for deployment on platforms like Replit or similar cloud environments:

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for direct TypeScript execution
- **Database**: Environment-based configuration with DATABASE_URL

### Production
- **Frontend**: Static build output served by Express
- **Backend**: Bundled with esbuild for Node.js execution
- **Database**: PostgreSQL connection via environment variables
- **Process Management**: Single Node.js process serving both frontend and backend

### Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Build Scripts**: Separate build processes for frontend and backend
- **Static Serving**: Express serves built frontend assets in production

The architecture supports both development and production environments with appropriate tooling for each context, following modern full-stack TypeScript patterns with emphasis on type safety and developer experience.