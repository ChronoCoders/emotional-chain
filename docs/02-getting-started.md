# Getting Started Guide

## Quick Start (5 minutes)

### Prerequisites
- Node.js 20.19.6 or higher
- npm 10.0.0 or higher
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:5000
```

That's it! The application is running with in-memory storage.

## Detailed Setup

### Windows Setup

1. **Install Node.js**
   - Download from https://nodejs.org/
   - Use LTS version (v20.19.6)
   - Add to PATH during installation

2. **Verify installation**
```powershell
node --version
npm --version
```

3. **Clone and run**
```powershell
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
npm install
npm run dev
```

4. **Troubleshooting**
   - If you get PowerShell execution error:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
   - Use PowerShell instead of Command Prompt
   - Ensure Node.js is in PATH: `node --version`

### macOS Setup

1. **Install Node.js with Homebrew**
```bash
brew install node@20
```

2. **Verify installation**
```bash
node --version  # v20.x.x
npm --version
```

3. **Clone and run**
```bash
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
npm install
npm run dev
```

### Linux Setup (Ubuntu/Debian)

1. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Verify installation**
```bash
node --version
npm --version
```

3. **Clone and run**
```bash
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
npm install
npm run dev
```

### Replit Setup

1. Click "Open in Replit" button on GitHub repository
2. Replit automatically provisions PostgreSQL database
3. Click "Run" button
4. App starts automatically on Replit's provided URL

## Data Persistence Options

### Option 1: In-Memory Storage (Default Local)

Best for: Quick testing, development

```bash
npm run dev
```

**Pros:**
- No setup required
- Fast startup
- Good for experimentation

**Cons:**
- Data resets on server restart
- Not suitable for production

### Option 2: Local PostgreSQL

Best for: Local development with persistent data

**Setup:**

1. **Install PostgreSQL**
   - Windows: https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql@15`
   - Linux: `sudo apt-get install postgresql`

2. **Create database**
```bash
createdb emotionalchain
```

3. **Set environment variable**

Windows (PowerShell):
```powershell
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/emotionalchain"
```

macOS/Linux:
```bash
export DATABASE_URL="postgresql://postgres@localhost:5432/emotionalchain"
```

4. **Run migrations**
```bash
npx drizzle-kit migrate
```

5. **Start application**
```bash
npm run dev
```

### Option 3: Replit PostgreSQL (Production)

Best for: Cloud hosting with automatic setup

- Replit automatically provisions PostgreSQL
- Environment variable `DATABASE_URL` automatically set
- Automatic backups
- Zero configuration needed

## Project Navigation

### Frontend Pages

**Landing Page** (`/`)
- Project overview
- Key features
- Call-to-action

**Dashboard** (`/dashboard`)
- Wallet information
- Account balance
- Transaction history
- Network statistics

**Validator Dashboard** (`/validator`)
- Validator metrics
- Biometric data display
- Rewards tracking
- Performance statistics

**Explorer** (`/explorer`)
- Block browser
- Transaction search
- Validator directory
- Network analytics

**Admin Panel** (`/admin`)
- System configuration
- Validator management
- Network monitoring
- Statistics

### API Endpoints

**Blockchain**
```
GET  /api/blocks
GET  /api/blocks/:height
GET  /api/transactions
POST /api/transfer
```

**Validators**
```
GET /api/validators
GET /api/validators/:id
GET /api/validators/distribution
```

**Wallets**
```
GET /api/wallet/:validatorId
GET /api/wallets
```

**Biometric**
```
GET /api/biometric/:validatorId
POST /api/biometric
```

## Development Workflow

### 1. Start Dev Server
```bash
npm run dev
```

The server will:
- Watch for file changes
- Auto-reload on TypeScript changes
- Start on http://localhost:5000

### 2. Edit Code

Frontend files: `client/src/`
Backend files: `server/`
Shared types: `shared/`

### 3. See Changes

- Frontend: Auto-reload via Vite HMR
- Backend: Auto-restart on file changes
- TypeScript: Full type checking

### 4. Debug

**Browser Console:**
- Open DevTools (F12)
- Check Network tab for API calls
- View Console for errors

**Backend Logs:**
- Check Shell/Terminal output
- Server logs show API requests
- Error traces display in console

## Common Tasks

### View Blockchain Data

1. Go to `http://localhost:5000/explorer`
2. Browse blocks and transactions
3. Search by height or hash

### Check Validator Status

1. Go to `http://localhost:5000/validator`
2. View validator metrics
3. Check biometric data

### Make a Transfer

1. Go to `http://localhost:5000/dashboard`
2. Click "Send EMO"
3. Enter recipient and amount
4. Confirm transaction

### Monitor Network

1. Go to `http://localhost:5000/explorer`
2. View real-time statistics
3. Check validator distribution

## Troubleshooting

### Port Already in Use

If port 5000 is in use:
```bash
# Find process on port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Then restart
npm run dev
```

### Database Connection Error

```
Error: DATABASE_URL must be set
```

**Solution:**
```bash
# Set environment variable
export DATABASE_URL="postgresql://user:pass@localhost/emotionalchain"
npm run dev
```

### Module Not Found

```
Error: Cannot find module '@shared/schema'
```

**Solution:**
- Install dependencies: `npm install`
- Rebuild TypeScript: `npm run dev`

### WebSocket Connection Error (Vite dev server)

```
Failed to construct 'WebSocket': The URL 'wss://localhost:undefined/...' is invalid
```

**Note:** This is a development-only cosmetic error in Vite HMR and doesn't affect app functionality.

### TypeScript Errors

Ensure type checking passes:
```bash
npm run type-check
```

Or let the TypeScript language server handle it automatically.

## Next Steps

1. **Explore the codebase**
   - Read `docs/01-architecture.md` for system design
   - Review `server/blockchain/EmotionalChain.ts` for core logic
   - Check `client/src/pages/` for UI implementation

2. **Understand the concepts**
   - Read `docs/03-proof-of-emotion.md` for PoE consensus
   - Review `docs/04-token-economics.md` for EMO token details
   - Check `docs/05-validators.md` for validator system

3. **Make contributions**
   - Check GitHub issues for tasks
   - Create a feature branch
   - Submit pull requests

4. **Deploy**
   - Read `docs/deployment.md` for hosting options
   - Set up Replit or local PostgreSQL
   - Configure environment variables

## Resources

- **GitHub Repository**: https://github.com/ChronoCoders/emotional-chain
- **Node.js Documentation**: https://nodejs.org/docs/
- **Express.js Guide**: https://expressjs.com/
- **React Documentation**: https://react.dev/
- **PostgreSQL Manual**: https://www.postgresql.org/docs/

## Getting Help

- Check the FAQ in `docs/`
- Review GitHub issues
- Check error logs in browser console or terminal
- Read API documentation in `docs/06-api.md`
