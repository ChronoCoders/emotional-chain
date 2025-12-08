# Getting Started Guide

## Quick Start (5 minutes)

### Prerequisites
- Node.js 20.19.6+
- npm 10.0.0+
- Git

### Installation

```bash
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
npm install
npm run dev
```

Open: **http://localhost:5000**

## Platform Setup

### Windows
```powershell
# 1. Install Node.js from https://nodejs.org/
# 2. In PowerShell:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 3. Clone and install
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
npm install
npm run dev
```

### macOS
```bash
brew install node@20
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
npm install
npm run dev
```

### Linux (Ubuntu)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
npm install
npm run dev
```

### Replit
1. Click "Open in Replit" on GitHub
2. Click "Run"
3. App starts automatically

## Data Persistence

### Option 1: In-Memory (Default)
```bash
npm run dev
```
**Good for**: Quick testing (data resets on restart)

### Option 2: Local PostgreSQL
```bash
createdb emotionalchain
export DATABASE_URL="postgresql://postgres@localhost/emotionalchain"
npx drizzle-kit migrate
npm run dev
```

### Option 3: Replit (Automatic)
PostgreSQL auto-provisioned on Replit. No setup needed.

## Project Navigation

| Page | URL | Purpose |
|------|-----|---------|
| Landing | `/` | Project overview |
| Dashboard | `/dashboard` | Wallet & account |
| Validator | `/validator` | Validator stats |
| Explorer | `/explorer` | Blocks & transactions |
| Admin | `/admin` | System configuration |

## Common Tasks

### 1. View Blockchain
Go to: http://localhost:5000/explorer

### 2. Check Validator Status
Go to: http://localhost:5000/validator

### 3. Make a Transfer
Dashboard → Send EMO → Enter recipient & amount

### 4. Monitor Network
Explorer → Real-time network statistics

## API Testing

```bash
# View validators
curl http://localhost:5000/api/validators

# Check network stats
curl http://localhost:5000/api/network-stats

# List recent blocks
curl http://localhost:5000/api/blocks

# View transactions
curl http://localhost:5000/api/transactions
```

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000
kill -9 <PID>
npm run dev
```

### Database Connection Error
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL
# Or set it:
export DATABASE_URL="postgresql://..."
```

### Module Not Found
```bash
npm install
npm run dev
```

## Next Steps

1. Read [Architecture Overview](Architecture)
2. Understand [Proof of Emotion](Proof-of-Emotion)
3. Learn [Token Economics](Token-Economics)
4. Set up [Validator Node](Validators-Guide)

## File Structure

```
emotional-chain/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types
├── docs/            # Documentation
└── package.json     # Dependencies
```

## Development Workflow

1. Edit code (client/src or server/)
2. Changes auto-reload via Vite HMR
3. Check browser console for frontend errors
4. Check terminal for backend logs
5. Use `npm run dev` to restart

## Resources

- GitHub: https://github.com/ChronoCoders/emotional-chain
- Node.js: https://nodejs.org/
- Express: https://expressjs.com/
- React: https://react.dev/
- PostgreSQL: https://www.postgresql.org/

---

**Ready to dive deeper?** Check out [Proof of Emotion](Proof-of-Emotion) to understand how the blockchain works.
