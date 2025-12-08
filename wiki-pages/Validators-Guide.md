# Validator Setup & Operations

## Validator Overview

21 global validators distributed across 7 continents:

| Region | Count |
|--------|-------|
| North America | 5 |
| Europe | 5 |
| Asia | 4 |
| South America | 2 |
| Africa | 2 |
| Oceania | 2 |
| Middle East | 1 |

## Requirements

### Hardware
- CPU: 8+ cores, 2+ GHz
- RAM: 16+ GB
- Storage: 500+ GB SSD
- Network: 100+ Mbps
- Uptime: 99%+

### Biometric Sensors
- Heart rate monitor (Polar H10, Apple Watch, etc.)
- ECG/HRV sensor
- Stress level monitor
- Temperature sensor
- Accuracy: ±2% or better

### Financial
- Minimum Stake: 10,000 EMO
- Hardware Cost: $50,000-$100,000
- Annual Operating: $10,000-$20,000
- Expected ROI: 5-12 months

## Setup Process

### Step 1: Hardware
1. Procure dedicated server or cloud instance
2. Install Ubuntu 22.04 LTS
3. Ensure low latency (<50ms)

### Step 2: Install EmotionalChain
```bash
git clone https://github.com/ChronoCoders/emotional-chain.git
cd emotional-chain
npm install
npx drizzle-kit migrate
npm run dev
```

### Step 3: Register Sensors
```bash
npm install polar-sdk
npm run calibrate:sensors
```

### Step 4: Start Node
```bash
npm run dev
# Verify: curl http://localhost:5000/api/validators
```

### Step 5: Register with Network
```bash
npm run stake 10000
npm run register-device
```

Status changes: PENDING → ACTIVE (24 hours)

## Daily Operations

### Monitor Status
```bash
curl http://localhost:5000/api/validators/your_id
npm run monitor:biometrics
npm run show:rewards
```

### Check Metrics
- Emotional Score: Should be > 0.7
- Uptime: Target 99%+
- Block Time: 5-10 seconds
- Latency: < 100ms

## Troubleshooting

### Low Emotional Score
- **Cause**: Sensor miscalibration, stress
- **Solution**: Re-calibrate sensors, maintain healthy lifestyle

### Offline Status
- **Cause**: Network issue, sensor disconnected
- **Solution**: Check internet connection, verify sensor battery

### No Rewards
- **Cause**: Not selected for validation
- **Solution**: Improve emotional authenticity, network latency

## Best Practices

### Security
✓ Use hardware wallet for stake  
✓ Enable 2FA on node access  
✓ Use VPN for remote management  
✗ Don't share private keys  
✗ Don't run on public WiFi

### Performance
✓ Maintain 99%+ uptime  
✓ Keep latency <100ms  
✓ Use SSD for storage  
✓ Monitor disk usage  
✗ Don't share server resources

### Health
✓ Sleep 7-9 hours nightly  
✓ Exercise 30+ minutes daily  
✓ Maintain stress <0.5  
✓ Regular health check-ups

## Rewards & Slashing

### Rewards
Monthly: ~24,843 EMO (~$100,000+ USD annually)

### Penalties
| Infraction | Penalty |
|-----------|---------|
| Offline >1h | -50% rewards |
| Invalid block | -10% stake |
| Double-signing | -30% stake |
| Biometric fraud | -100% stake |

## Validator Statistics

**Current Status**:
- Active: 20/21 validators
- Uptime: 99.7% average
- Emotional Score: 0.78 average
- Block Time: 7.2 seconds

---

Ready to become a validator? Start with [Getting Started](Getting-Started).
