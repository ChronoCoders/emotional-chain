# EmotionalChain: Proof of Emotion Blockchain

A production-ready blockchain platform utilizing **Proof of Emotion (PoE)** consensus that validates transactions using real-time biometric data. EmotionalChain combines emotional intelligence with Byzantine fault tolerance to create a secure, privacy-preserving network.

## Features

### Core Blockchain
- **Proof of Emotion (PoE) Consensus**: Validates transactions using real-time biometric data (heart rate, stress levels, emotional state)
- **EMO Token**: Native cryptocurrency with 100M max supply and halving schedule
- **21 Global Validators**: Distributed across 7 continents with device-based reward/voting adjustments
  - North America: 5 validators
  - Europe: 5 validators
  - Asia: 4 validators
  - South America: 2 validators
  - Africa: 2 validators
  - Oceania: 2 validators
  - Middle East: 1 validator
- **Byzantine Fault Tolerance**: Secure consensus mechanism resistant to malicious actors
- **Hybrid Consensus**: Proof of Emotion (PoE) + Proof of Stake (PoS) model

### Privacy & Security
- **Zero-Knowledge Proofs**: Privacy-preserving transaction validation
- **Three-Tier Attestation**: Device registration with multi-layer verification
- **Threshold Proofs**: Inference attack prevention
- **Batch Proofs**: Advanced privacy mechanisms
- **Rate Limiting**: Enterprise-grade API protection

### Enterprise Use Cases
- **Health Data Marketplace**: Secure trading of wellness data with privacy guarantees
- **Wellness Insurance Integration**: Rewards-based insurance tied to biometric health metrics
- **Corporate Wellness Platform**: Enterprise employee wellness programs with transparent incentives

## Getting Started

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm or yarn
- PostgreSQL (optional for local setup; in-memory storage available)

### Local Setup (Windows/Mac/Linux)

1. **Clone the repository**
```bash
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment** (optional)
Create a `.env.local` file for custom settings:
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/emotionalchain
```

4. **Start the application**
```bash
npm run dev
```

The application will start on `http://localhost:5000`

### Replit Setup

1. Fork or open this repository in Replit
2. Click "Run" to start the application
3. The platform automatically provisions a PostgreSQL database
4. Access the live app via the Replit URL

## Project Structure

```
emotional-chain/
├── server/                      # Backend (Express.js + TypeScript)
│   ├── blockchain/             # Core blockchain logic
│   │   ├── EmotionalChain.ts   # Main blockchain implementation
│   │   ├── EmotionalWallet.ts  # Wallet system
│   │   └── ProofOfEmotion.ts   # PoE consensus mechanism
│   ├── validators/             # Validator management
│   │   └── distribution.ts     # Geographic distribution
│   ├── services/               # Business logic
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Security & auth
│   ├── db.ts                   # Database connection
│   ├── storage.ts              # Data persistence
│   └── index.ts                # Server entry point
│
├── client/                      # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── pages/              # Application pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities & helpers
│   │   ├── App.tsx             # Main app component
│   │   └── index.css           # Global styles
│   └── index.html              # HTML entry point
│
├── shared/                      # Shared code
│   ├── schema.ts               # Database schema & types
│   ├── config.ts               # Configuration
│   └── types/                  # Shared TypeScript types
│
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── vite.config.ts              # Vite build config
└── drizzle.config.ts           # Database migrations
```

## Core Concepts

### Proof of Emotion (PoE)
Validators prove their emotional authenticity through continuous biometric monitoring:
- Heart rate variability
- Stress levels
- Emotional state markers
- Real-time validation metrics

### Wallet System
- **Send EMO**: Transfer tokens between validators
- **Receive EMO**: Earn rewards from validation and staking
- **Store EMO**: Secure on-chain storage with liquid and staked components
  - 70% Liquid: Available for immediate transactions
  - 30% Staked: Locked in network earning rewards

### Validator Model
**Permanent + Tiered Device Status:**
- **Online Validators**: Full voting power (5 votes) + full rewards (100%)
- **Offline Validators**: Reduced voting power (2 votes) + partial rewards (50%)

## API Endpoints

### Blockchain
- `GET /api/blocks` - Retrieve recent blocks
- `GET /api/blocks/:height` - Get block by height
- `GET /api/transactions` - List transactions
- `POST /api/transfer` - Send EMO tokens

### Validators
- `GET /api/validators` - List all validators
- `GET /api/validators/:id` - Get validator details
- `GET /api/validators/distribution` - View geographic distribution

### Wallets
- `GET /api/wallet/:validatorId` - Get wallet balance
- `GET /api/wallets` - List all wallets
- `GET /api/wallets/database` - Wallet data from database

### Biometric Data
- `GET /api/biometric/:validatorId` - Latest biometric readings
- `POST /api/biometric` - Submit biometric data

### Network Stats
- `GET /api/network-stats` - Real-time network statistics
- `GET /api/explorer` - Blockchain explorer data

## Configuration

Edit `shared/config.ts` to customize:
- Validator count and distribution
- EMO token parameters (supply, halving schedule)
- PoE sensitivity thresholds
- Consensus parameters
- Network timeouts

## Development

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm run test
```

### TypeScript Type Checking
```bash
npm run type-check
```

### Database Migrations
```bash
npx drizzle-kit migrate
```

## Technology Stack

### Backend
- **Express.js**: Web framework
- **TypeScript**: Type-safe development
- **Drizzle ORM**: Database management
- **Zod**: Schema validation
- **PostgreSQL/Neon**: Database (Replit) or in-memory (local)

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool & dev server
- **Tailwind CSS**: Styling
- **Wouter**: Lightweight routing
- **TanStack Query**: Data fetching & caching
- **Shadcn/UI**: Component library
- **Lucide React**: Icons

### Blockchain Libraries
- **Web3.js**: Ethereum interop
- **Ethers.js**: Smart contract interaction
- **LibP2P**: P2P networking
- **zk-SNARK**: Zero-knowledge proofs

## Security

- **Rate Limiting**: Protects APIs from abuse
- **CORS Configuration**: Whitelist trusted origins
- **Input Validation**: Zod schema validation on all endpoints
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content security headers
- **Message Authentication**: Nonce-based replay attack prevention

## Data Persistence

### Replit
- **PostgreSQL Database**: Automatic provisioning via Neon
- **Permanent Storage**: All blocks, validators, and transactions persist
- **19,874+ Blocks**: Current blockchain state stored

### Local
- **Option 1 - In-Memory**: Quick testing (data resets on restart)
- **Option 2 - PostgreSQL**: Local persistent storage
  ```bash
  # Install PostgreSQL, then:
  createdb emotionalchain
  export DATABASE_URL="postgresql://postgres@localhost/emotionalchain"
  npm run dev
  ```

## Performance

- **Consensus Time**: ~5-10 seconds per block
- **Transaction Throughput**: 100+ TPS
- **Latency**: <1s average
- **Network Nodes**: 21 global validators

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For questions or issues:
- Open an issue on GitHub
- Check existing documentation
- Review the blockchain explorer for network status

## Roadmap

- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] Multi-chain bridge support
- [ ] DAO governance
- [ ] NFT marketplace for health data
- [ ] Enhanced biometric sensors

---

**Built with ❤️ and real emotions on the blockchain**
