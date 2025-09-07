#!/bin/bash
#
# EmotionalChain Network Deployment Script  
# Deploy multiple validator nodes for distributed network
#

set -e

echo "🌐 EmotionalChain Network Deployment"
echo "===================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
DEPLOYMENT_DIR="$PROJECT_DIR/deployments"

# Configuration
NETWORK_ID="${NETWORK_ID:-emotionalchain-mainnet}"
NUM_VALIDATORS="${NUM_VALIDATORS:-5}"
BASE_PORT="${BASE_PORT:-4001}"
DEPLOYMENT_TARGET="${DEPLOYMENT_TARGET:-local}" # local, docker, aws, gcp, azure

echo "🌐 Network ID: $NETWORK_ID"
echo "👥 Number of validators: $NUM_VALIDATORS"
echo "🎯 Deployment target: $DEPLOYMENT_TARGET"
echo "📁 Deployment directory: $DEPLOYMENT_DIR"

# Create deployment directory
mkdir -p "$DEPLOYMENT_DIR"

# Generate network configuration
echo "⚙️ Generating network configuration..."

# Create bootstrap nodes list (first 3 validators as bootstrap)
BOOTSTRAP_NODES=""
for ((i=0; i<3 && i<NUM_VALIDATORS; i++)); do
    if [ $i -gt 0 ]; then
        BOOTSTRAP_NODES="$BOOTSTRAP_NODES,"
    fi
    BOOTSTRAP_NODES="$BOOTSTRAP_NODES/ip4/127.0.0.1/tcp/$((BASE_PORT + i))"
done

echo "🔗 Bootstrap nodes: $BOOTSTRAP_NODES"

# Create network environment file
cat > "$DEPLOYMENT_DIR/network.env" << EOF
# EmotionalChain Network Configuration
NETWORK_ID=$NETWORK_ID
NUM_VALIDATORS=$NUM_VALIDATORS
BOOTSTRAP_NODES=$BOOTSTRAP_NODES
BASE_PORT=$BASE_PORT

# Database (shared for local deployment)
DATABASE_URL=${DATABASE_URL:-postgresql://localhost:5432/emotionalchain}

# Network settings
MIN_VALIDATORS=4
TARGET_VALIDATORS=$NUM_VALIDATORS
CONSENSUS_TIMEOUT=30000
ROUND_TIMEOUT=30000

# Economic parameters
MINIMUM_STAKE=1000
BLOCK_REWARD=10
SLASHING_ENABLED=true

# Security
BYZANTINE_FAULT_TOLERANCE=true
MAX_BYZANTINE_RATIO=0.33
PARTITION_RECOVERY=true

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090

# Biometrics
BIOMETRIC_ENABLED=true
MIN_EMOTIONAL_SCORE=70
MIN_AUTHENTICITY=0.7
DEVICE_TIMEOUT=30000
EOF

echo "✅ Network configuration generated"

# Function to deploy local validators
deploy_local_validators() {
    echo "🖥️ Deploying $NUM_VALIDATORS local validators..."
    
    # Create validator startup scripts
    for ((i=0; i<NUM_VALIDATORS; i++)); do
        VALIDATOR_ID="validator-$(printf %02d $((i+1)))"
        LISTEN_PORT=$((BASE_PORT + i))
        API_PORT=$((5000 + i))
        
        echo "🏗️ Setting up validator $VALIDATOR_ID (ports: $LISTEN_PORT, $API_PORT)..."
        
        VALIDATOR_DIR="$DEPLOYMENT_DIR/$VALIDATOR_ID"
        mkdir -p "$VALIDATOR_DIR"
        
        # Create validator-specific environment
        cat > "$VALIDATOR_DIR/.env" << EOF
VALIDATOR_ID=$VALIDATOR_ID
LISTEN_PORT=$LISTEN_PORT
PORT=$API_PORT
BOOTSTRAP_NODES=$BOOTSTRAP_NODES
STAKING_AMOUNT=10000
AUTO_STAKING=true
EOF
        
        # Create validator startup script
        cat > "$VALIDATOR_DIR/start.sh" << 'EOF'
#!/bin/bash
set -e

VALIDATOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$(dirname "$VALIDATOR_DIR")")"

echo "🚀 Starting validator: $VALIDATOR_ID"

# Load environment
set -a
source "$VALIDATOR_DIR/.env"
source "$PROJECT_DIR/deployments/network.env"
set +a

export DATA_DIR="$VALIDATOR_DIR/data"
cd "$PROJECT_DIR"

# Start the distributed node
exec bash deployment/startup-scripts/start-distributed-node.sh
EOF
        
        chmod +x "$VALIDATOR_DIR/start.sh"
        
        echo "✅ Validator $VALIDATOR_ID configured"
    done
    
    # Create network management script
    cat > "$DEPLOYMENT_DIR/manage-network.sh" << EOF
#!/bin/bash
#
# Network Management Script
#

DEPLOYMENT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
ACTION="\${1:-help}"

case "\$ACTION" in
    start)
        echo "🚀 Starting EmotionalChain network..."
        for i in \$(seq 1 $NUM_VALIDATORS); do
            VALIDATOR_ID="validator-\$(printf %02d \$i)"
            echo "Starting \$VALIDATOR_ID..."
            cd "\$DEPLOYMENT_DIR/\$VALIDATOR_ID"
            nohup ./start.sh > validator.log 2>&1 &
            echo \$! > validator.pid
            sleep 2
        done
        echo "✅ Network started with $NUM_VALIDATORS validators"
        ;;
        
    stop)
        echo "🛑 Stopping EmotionalChain network..."
        for i in \$(seq 1 $NUM_VALIDATORS); do
            VALIDATOR_ID="validator-\$(printf %02d \$i)"
            PIDFILE="\$DEPLOYMENT_DIR/\$VALIDATOR_ID/validator.pid"
            if [ -f "\$PIDFILE" ]; then
                PID=\$(cat "\$PIDFILE")
                if kill "\$PID" 2>/dev/null; then
                    echo "Stopped \$VALIDATOR_ID (PID: \$PID)"
                else
                    echo "⚠️ Failed to stop \$VALIDATOR_ID (PID: \$PID)"
                fi
                rm -f "\$PIDFILE"
            else
                echo "⚠️ No PID file for \$VALIDATOR_ID"
            fi
        done
        echo "✅ Network stopped"
        ;;
        
    status)
        echo "📊 EmotionalChain Network Status"
        echo "==============================="
        for i in \$(seq 1 $NUM_VALIDATORS); do
            VALIDATOR_ID="validator-\$(printf %02d \$i)"
            PIDFILE="\$DEPLOYMENT_DIR/\$VALIDATOR_ID/validator.pid"
            if [ -f "\$PIDFILE" ]; then
                PID=\$(cat "\$PIDFILE")
                if kill -0 "\$PID" 2>/dev/null; then
                    echo "✅ \$VALIDATOR_ID: Running (PID: \$PID)"
                else
                    echo "❌ \$VALIDATOR_ID: Not running (stale PID file)"
                fi
            else
                echo "⚫ \$VALIDATOR_ID: Stopped"
            fi
        done
        ;;
        
    logs)
        VALIDATOR="\${2:-validator-01}"
        if [ -f "\$DEPLOYMENT_DIR/\$VALIDATOR/validator.log" ]; then
            tail -f "\$DEPLOYMENT_DIR/\$VALIDATOR/validator.log"
        else
            echo "❌ Log file not found for \$VALIDATOR"
            exit 1
        fi
        ;;
        
    clean)
        echo "🧹 Cleaning deployment..."
        ./manage-network.sh stop
        for i in \$(seq 1 $NUM_VALIDATORS); do
            VALIDATOR_ID="validator-\$(printf %02d \$i)"
            rm -rf "\$DEPLOYMENT_DIR/\$VALIDATOR_ID/data"
            rm -f "\$DEPLOYMENT_DIR/\$VALIDATOR_ID/validator.log"
        done
        echo "✅ Deployment cleaned"
        ;;
        
    help|*)
        echo "EmotionalChain Network Management"
        echo ""
        echo "Usage: \$0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  start       Start all validator nodes"
        echo "  stop        Stop all validator nodes"  
        echo "  status      Show network status"
        echo "  logs [val]  Show logs (default: validator-01)"
        echo "  clean       Stop and clean all data"
        echo "  help        Show this help"
        ;;
esac
EOF
    
    chmod +x "$DEPLOYMENT_DIR/manage-network.sh"
    
    echo "✅ Local validator deployment ready"
    echo "   Start network: $DEPLOYMENT_DIR/manage-network.sh start"
    echo "   Check status: $DEPLOYMENT_DIR/manage-network.sh status"
}

# Function to deploy Docker validators
deploy_docker_validators() {
    echo "🐳 Deploying $NUM_VALIDATORS Docker validators..."
    
    # Create docker-compose.yml
    cat > "$DEPLOYMENT_DIR/docker-compose.yml" << EOF
version: '3.8'

services:
EOF

    for ((i=0; i<NUM_VALIDATORS; i++)); do
        VALIDATOR_ID="validator-$(printf %02d $((i+1)))"
        LISTEN_PORT=$((BASE_PORT + i))
        API_PORT=$((5000 + i))
        
        cat >> "$DEPLOYMENT_DIR/docker-compose.yml" << EOF
  $VALIDATOR_ID:
    build:
      context: ..
      dockerfile: deployment/docker/Dockerfile.validator
    container_name: emotionalchain-$VALIDATOR_ID
    restart: unless-stopped
    environment:
      - VALIDATOR_ID=$VALIDATOR_ID
      - LISTEN_PORT=$LISTEN_PORT
      - PORT=$API_PORT
      - BOOTSTRAP_NODES=$BOOTSTRAP_NODES
      - STAKING_AMOUNT=10000
    env_file:
      - network.env
    ports:
      - "$LISTEN_PORT:$LISTEN_PORT"
      - "$API_PORT:$API_PORT"
    volumes:
      - ${VALIDATOR_ID}-data:/app/validator-data
    networks:
      - emotionalchain
    depends_on:
      - postgres
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

EOF
    done
    
    # Add database service
    cat >> "$DEPLOYMENT_DIR/docker-compose.yml" << EOF
  postgres:
    image: postgres:15
    container_name: emotionalchain-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=emotionalchain
      - POSTGRES_USER=emotionalchain
      - POSTGRES_PASSWORD=password123
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - emotionalchain

volumes:
EOF

    for ((i=0; i<NUM_VALIDATORS; i++)); do
        VALIDATOR_ID="validator-$(printf %02d $((i+1)))"
        echo "  ${VALIDATOR_ID}-data:" >> "$DEPLOYMENT_DIR/docker-compose.yml"
    done
    
    cat >> "$DEPLOYMENT_DIR/docker-compose.yml" << EOF
  postgres-data:

networks:
  emotionalchain:
    driver: bridge
EOF

    # Create Dockerfile
    mkdir -p "$DEPLOYMENT_DIR/docker"
    cat > "$DEPLOYMENT_DIR/docker/Dockerfile.validator" << EOF
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Create validator user
RUN addgroup -g 1001 -S validator && \\
    adduser -S validator -u 1001

# Create data directory
RUN mkdir -p /app/validator-data && \\
    chown -R validator:validator /app/validator-data

# Switch to validator user
USER validator

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \\
  CMD node -e "console.log('Validator health check')" || exit 1

# Start validator
CMD ["bash", "deployment/startup-scripts/start-distributed-node.sh"]
EOF
    
    # Update database URL for Docker
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://emotionalchain:password123@postgres:5432/emotionalchain|' "$DEPLOYMENT_DIR/network.env"
    
    echo "✅ Docker deployment ready"
    echo "   Start network: cd $DEPLOYMENT_DIR && docker-compose up -d"
    echo "   Check logs: cd $DEPLOYMENT_DIR && docker-compose logs -f"
}

# Deploy based on target
case "$DEPLOYMENT_TARGET" in
    local)
        deploy_local_validators
        ;;
    docker)
        deploy_docker_validators
        ;;
    aws|gcp|azure)
        echo "☁️ Cloud deployment target: $DEPLOYMENT_TARGET"
        echo "   Cloud deployment requires additional setup and credentials"
        echo "   Please refer to deployment/cloud-deployment/ for cloud-specific instructions"
        ;;
    *)
        echo "❌ Unknown deployment target: $DEPLOYMENT_TARGET"
        echo "   Supported targets: local, docker, aws, gcp, azure"
        exit 1
        ;;
esac

echo ""
echo "✅ Network deployment completed!"
echo ""
echo "📁 Deployment directory: $DEPLOYMENT_DIR"
echo "🌐 Network ID: $NETWORK_ID" 
echo "👥 Validators: $NUM_VALIDATORS"
echo "🔗 Bootstrap nodes: $BOOTSTRAP_NODES"
echo ""
echo "Next steps:"
echo "1. Review configuration in $DEPLOYMENT_DIR/network.env"
echo "2. Start the network using the generated management scripts"
echo "3. Monitor network health through the dashboard"
echo ""