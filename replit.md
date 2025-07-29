# EmotionalChain Blockchain Application

## Overview

This project is a full-stack web application implementing **EmotionalChain**, the world's first emotion-powered blockchain using Proof of Emotion (PoE) consensus. The application features a terminal-style interface for interacting with blockchain operations, monitoring network status, and managing validators with biometric data integration.

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

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless adapter
- **Schema**: Comprehensive blockchain entities (blocks, transactions, validators, biometric data)

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