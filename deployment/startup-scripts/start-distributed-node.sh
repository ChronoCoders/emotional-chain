#!/bin/bash
#
# EmotionalChain Distributed Node Startup Script
# Starts a production validator node with distributed consensus
#

set -e

echo "🚀 Starting EmotionalChain Distributed Validator Node"
echo "=================================================="

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
NODE_ENV="${NODE_ENV:-production}"
VALIDATOR_ID="${VALIDATOR_ID:-validator-$(hostname)-$$}"
DATA_DIR="${DATA_DIR:-./validator-data/$VALIDATOR_ID}"

echo "📁 Project Directory: $PROJECT_DIR"
echo "🆔 Validator ID: $VALIDATOR_ID"
echo "💾 Data Directory: $DATA_DIR"
echo "🌐 Environment: $NODE_ENV"

# Create data directory
mkdir -p "$DATA_DIR"
echo "✅ Data directory created"

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18 or higher."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Change to project directory
cd "$PROJECT_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check environment variables
echo "🔧 Checking environment configuration..."

REQUIRED_VARS=(
    "DATABASE_URL"
    "BOOTSTRAP_NODES"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please set these variables or create a .env file with:"
    echo "DATABASE_URL=postgresql://username:password@host:port/database"
    echo "BOOTSTRAP_NODES=/ip4/127.0.0.1/tcp/4001,/dns4/bootstrap.emotionalchain.io/tcp/4001"
    exit 1
fi

echo "✅ Environment configuration valid"

# Database connectivity check
echo "🔗 Testing database connectivity..."
if ! timeout 10 node -e "
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
}).catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
});
" 2>/dev/null; then
    echo "❌ Database connection failed. Please check DATABASE_URL and network connectivity."
    exit 1
fi

# Generate validator configuration
echo "⚙️ Generating validator configuration..."
cat > "$DATA_DIR/validator-config.json" << EOF
{
  "validatorId": "$VALIDATOR_ID",
  "dataDir": "$DATA_DIR",
  "networkConfig": {
    "bootstrapNodes": $(echo $BOOTSTRAP_NODES | jq -Rc 'split(",")'),,
    "listenPort": ${LISTEN_PORT:-4001},
    "maxConnections": ${MAX_CONNECTIONS:-100}
  },
  "consensusConfig": {
    "minEmotionalScore": ${MIN_EMOTIONAL_SCORE:-70},
    "minAuthenticity": ${MIN_AUTHENTICITY:-0.7},
    "roundTimeout": ${ROUND_TIMEOUT:-30000}
  },
  "economicConfig": {
    "stakingAmount": ${STAKING_AMOUNT:-1000},
    "autoStaking": ${AUTO_STAKING:-true}
  },
  "biometricConfig": {
    "enabled": ${BIOMETRIC_ENABLED:-true},
    "deviceTypes": ["heartRate", "stressLevel", "focusLevel"],
    "deviceTimeout": ${DEVICE_TIMEOUT:-30000}
  }
}
EOF
echo "✅ Validator configuration generated"

# Create startup Node.js script
echo "📝 Creating validator startup script..."
cat > "$DATA_DIR/validator-node.js" << 'EOF'
const { DistributedBlockchainIntegration } = require('../../server/blockchain/DistributedBlockchainIntegration');
const { EmotionalChain } = require('../../server/blockchain/EmotionalChain');
const { EmotionalChainService } = require('../../server/services/emotionalchain');
const { ImmutableBlockchainService } = require('../../server/blockchain/ImmutableBlockchainService');
const config = require('./validator-config.json');

async function startDistributedValidator() {
    try {
        console.log('🏗️ Initializing distributed validator node:', config.validatorId);
        
        // Initialize core blockchain components
        const emotionalChain = new EmotionalChain();
        const emotionalChainService = new EmotionalChainService();
        const immutableBlockchain = new ImmutableBlockchainService();
        
        // Wait for blockchain initialization
        console.log('⏳ Waiting for blockchain initialization...');
        await emotionalChain.waitForInitialization(30000);
        
        // Initialize distributed integration
        console.log('🌐 Initializing distributed blockchain integration...');
        const integration = new DistributedBlockchainIntegration(
            emotionalChain,
            emotionalChainService, 
            immutableBlockchain
        );
        
        // Enable distributed mode
        console.log('🚀 Enabling distributed consensus mode...');
        const distributedEnabled = await integration.enableDistributedMode({
            networkId: process.env.NETWORK_ID || 'emotionalchain-mainnet',
            bootstrapNodes: config.networkConfig.bootstrapNodes,
            minValidators: parseInt(process.env.MIN_VALIDATORS || '4'),
            targetValidators: parseInt(process.env.TARGET_VALIDATORS || '21')
        });
        
        if (!distributedEnabled) {
            throw new Error('Failed to enable distributed consensus mode');
        }
        
        // Deploy this validator node
        console.log('🏗️ Deploying validator node to distributed network...');
        await integration.deployValidatorNode(config);
        
        console.log('✅ Distributed validator node started successfully');
        console.log(`🆔 Validator ID: ${config.validatorId}`);
        console.log(`🌐 Network: ${process.env.NETWORK_ID || 'emotionalchain-mainnet'}`);
        console.log(`💾 Data Directory: ${config.dataDir}`);
        console.log(`🔗 Bootstrap Nodes: ${config.networkConfig.bootstrapNodes.join(', ')}`);
        
        // Set up graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}. Shutting down validator node gracefully...`);
            
            try {
                await integration.disableDistributedMode();
                console.log('✅ Validator node stopped successfully');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };
        
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        
        // Status monitoring loop
        setInterval(async () => {
            try {
                const networkStatus = integration.getNetworkStatus();
                const validatorStatus = integration.getValidatorNodeStatus(config.validatorId);
                
                console.log(`📊 Status: ${networkStatus.networkOperational ? 'OPERATIONAL' : 'DEGRADED'} | ` +
                          `Validators: ${networkStatus.validatorCount}/${process.env.TARGET_VALIDATORS || 21} | ` +
                          `Consensus: ${networkStatus.consensusHealth.toFixed(1)}% | ` +
                          `Latency: ${networkStatus.networkLatency}ms`);
                          
                if (validatorStatus.exists) {
                    console.log(`🏗️ Validator: ${validatorStatus.status.isActive ? 'ACTIVE' : 'INACTIVE'} | ` +
                              `Blocks: ${validatorStatus.metrics.blocksValidated} | ` +
                              `Earnings: ${validatorStatus.metrics.earnings.toFixed(2)} EMO`);
                }
            } catch (error) {
                console.warn('⚠️ Status monitoring error:', error.message);
            }
        }, 60000); // Every minute
        
        // Keep process alive
        console.log('🔄 Validator node running. Press Ctrl+C to stop.');
        
    } catch (error) {
        console.error('❌ Failed to start distributed validator:', error);
        process.exit(1);
    }
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

// Start validator
startDistributedValidator();
EOF

echo "✅ Validator startup script created"

# Set permissions
chmod +x "$DATA_DIR/validator-node.js"

# Create systemd service file (optional)
if command -v systemctl &> /dev/null && [ "$EUID" -eq 0 ]; then
    echo "🔧 Creating systemd service..."
    
    SERVICE_FILE="/etc/systemd/system/emotionalchain-validator-$VALIDATOR_ID.service"
    cat > "$SERVICE_FILE" << EOF
[Unit]
Description=EmotionalChain Validator Node ($VALIDATOR_ID)
After=network.target
Wants=network.target

[Service]
Type=simple
User=emotionalchain
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node $DATA_DIR/validator-node.js
Restart=always
RestartSec=10
Environment=NODE_ENV=$NODE_ENV
Environment=VALIDATOR_ID=$VALIDATOR_ID
Environment=DATA_DIR=$DATA_DIR
EnvironmentFile=-/etc/emotionalchain/validator.env

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$DATA_DIR

# Resource limits
LimitNOFILE=65535
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    echo "✅ Systemd service created: $SERVICE_FILE"
    echo "   Start with: systemctl start emotionalchain-validator-$VALIDATOR_ID"
    echo "   Enable on boot: systemctl enable emotionalchain-validator-$VALIDATOR_ID"
else
    echo "ℹ️ Systemd not available or insufficient privileges - service file not created"
fi

# Start validator node
echo ""
echo "🚀 Starting distributed validator node..."
echo "   Press Ctrl+C to stop"
echo ""

cd "$DATA_DIR"
exec node validator-node.js