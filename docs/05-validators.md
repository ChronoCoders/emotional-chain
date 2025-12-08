# Validator Setup & Operations

## Validator Overview

EmotionalChain operates with exactly **21 global validators** distributed across 7 continents.

```
Total Validators: 21

Distribution by Continent:
  ├─ North America: 5 validators
  ├─ Europe: 5 validators
  ├─ Asia: 4 validators
  ├─ South America: 2 validators
  ├─ Africa: 2 validators
  ├─ Oceania: 2 validators
  └─ Middle East: 1 validator
```

## Validator Requirements

### Hardware Requirements

```
Minimum Specs:
  ├─ CPU: 8-core processor (2+ GHz)
  ├─ RAM: 16 GB
  ├─ Storage: 500 GB SSD (blockchain data)
  ├─ Network: 100 Mbps+ bandwidth
  └─ Uptime: 99%+ availability

Recommended Specs:
  ├─ CPU: 16-core processor (3+ GHz)
  ├─ RAM: 32 GB
  ├─ Storage: 1 TB NVMe SSD
  ├─ Network: 1 Gbps+ bandwidth
  └─ Redundant: Backup connection, UPS
```

### Biometric Sensor Requirements

```
Required Sensors:
  ├─ Heart Rate Monitor (wearable or chest strap)
  ├─ ECG/HRV Sensor (advanced monitoring)
  ├─ Stress Level Monitor (cortisol or EDA sensor)
  ├─ Body Temperature Sensor
  └─ Optional: Respiratory rate monitor

Sensor Specifications:
  ├─ Accuracy: ±2% or better
  ├─ Sample Rate: 1 Hz minimum
  ├─ Data Format: JSON over HTTPS/WebSocket
  ├─ Calibration: Monthly required
  └─ Battery: 24/7 operation with charging
```

**Approved Sensor Vendors:**
- Polar H10 (heart rate)
- Whoop Band (HRV + stress)
- Apple Watch (heart rate + ECG)
- Fitbit (heart rate + movement)
- Custom integrations welcome

### Financial Requirements

```
Minimum Stake: 10,000 EMO (~$5,000-50,000 USD)
Expected Hardware Cost: $50,000-100,000
Annual Operating Cost: $10,000-20,000

Expected Monthly Return: ~24,843 EMO
ROI Timeline: 5-12 months (depends on EMO price)
```

## Validator Setup Process

### Step 1: Hardware Setup

1. **Procure hardware**
   ```
   Option A: Dedicated Server
   - Rent from cloud provider (AWS, Digital Ocean, etc.)
   - Cost: $200-500/month
   - Advantage: Managed infrastructure, backups
   
   Option B: Bare Metal
   - Physical server in data center
   - Cost: $1,000-5,000 upfront + $500/month
   - Advantage: Better performance, full control
   ```

2. **Install operating system**
   ```bash
   # Ubuntu 22.04 LTS recommended
   sudo apt update && sudo apt upgrade
   sudo apt install -y nodejs npm postgresql git
   ```

3. **Configure network**
   ```bash
   # Ensure stable internet with low latency
   ping -c 5 8.8.8.8  # Should be <50ms
   mtr google.com     # Check route stability
   ```

### Step 2: Install EmotionalChain

1. **Clone repository**
   ```bash
   git clone https://github.com/ChronoCoders/emotional-chain.git
   cd emotional-chain
   npm install
   ```

2. **Set up database**
   ```bash
   # Install PostgreSQL
   sudo systemctl start postgresql
   createdb emotionalchain
   
   # Run migrations
   npx drizzle-kit migrate
   ```

3. **Configure environment**
   ```bash
   # Create .env file
   cat > .env << EOF
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@localhost/emotionalchain
   VALIDATOR_ID=your_validator_name
   VALIDATOR_ADDRESS=your_eth_address
   STAKE_AMOUNT=10000
   EOF
   ```

### Step 3: Register Biometric Sensors

1. **Install sensor software**
   ```bash
   # Example with Polar H10
   npm install polar-sdk
   
   # Configure sensor connection
   cat > sensor-config.json << EOF
   {
     "type": "polar_h10",
     "device_id": "your_device_id",
     "api_key": "your_api_key",
     "sampling_rate": 1,
     "reconnect_interval": 5
   }
   EOF
   ```

2. **Test sensor connection**
   ```bash
   npm run test:sensors
   # Should output real-time heart rate data
   ```

3. **Calibrate sensors**
   ```bash
   npm run calibrate:sensors
   # Run for 30 minutes at rest, light activity, stress
   # System learns your baseline emotional patterns
   ```

### Step 4: Start Validator Node

1. **Start the application**
   ```bash
   npm run dev  # Development
   # OR
   npm run build && npm start  # Production
   ```

2. **Verify node is running**
   ```bash
   curl http://localhost:5000/api/validators
   # Should return list of validators including yours
   ```

3. **Monitor performance**
   ```bash
   # View logs
   tail -f logs/validator.log
   
   # Check emotional authenticity score
   curl http://localhost:5000/api/validators/your_id
   # Score should be > 0.7
   ```

### Step 5: Register with Network

1. **Stake EMO tokens**
   ```bash
   # Via API or CLI
   npm run stake 10000
   # Creates on-chain record of your 10,000 EMO stake
   ```

2. **Register device**
   ```bash
   npm run register-device
   # Links biometric sensors to your validator account
   # Creates three-tier attestation
   ```

3. **Wait for activation**
   ```
   Status: PENDING (0-24 hours)
   ├─ Network validates credentials
   ├─ Confirms stake
   ├─ Tests biometric sensors
   └─ Checks geographic distribution
   
   Status: ACTIVE (then onwards)
   ├─ Full voting rights
   ├─ Block proposal eligibility
   ├─ Reward participation
   └─ Online status granted
   ```

## Ongoing Operations

### Daily Monitoring

```bash
# Check validator status
curl http://localhost:5000/api/validators/your_id

# Monitor biometric feed
npm run monitor:biometrics
# Output:
#   Heart Rate: 72 BPM
#   Stress Level: 0.35
#   Emotion Score: 0.82
#   Status: ONLINE

# Check rewards
npm run show:rewards
# Output:
#   Last 24h: 432 EMO
#   Monthly: 12,948 EMO
#   Annual: 155,376 EMO
```

### Weekly Maintenance

```bash
# Update software
git pull
npm install
npm run build

# Verify no anomalies
npm run check:anomalies
# Should return: No anomalies detected

# Check database integrity
npm run db:check
# All tables healthy
```

### Monthly Tasks

```bash
# Calibrate sensors
npm run calibrate:sensors
# Recalibrate emotional baseline

# Verify stake
npm run verify:stake
# Confirm 10,000 EMO still staked

# Review performance
npm run report:monthly
# Detailed validator report
```

## Troubleshooting

### Issue: Low Emotional Authenticity Score

```
Problem: Score < 0.5, rewards reduced
Causes:
  1. Sensor miscalibration
  2. High stress/anxiety
  3. Inconsistent biometric patterns
  4. Device sensor malfunction

Solutions:
  1. Re-calibrate sensors: npm run calibrate:sensors
  2. Ensure consistent sleep/diet/exercise
  3. Verify sensor battery levels
  4. Check sensor connections
  5. Replace sensor if faulty
```

### Issue: Offline Status

```
Problem: Validator marked offline, reduced voting power
Causes:
  1. Network connectivity lost
  2. Sensor connection interrupted
  3. Node process crashed
  4. High latency (>5s)

Solutions:
  1. Check internet: ping 8.8.8.8
  2. Verify sensor via: npm run test:sensors
  3. Restart node: npm run restart
  4. Check latency: mtr google.com
  5. Ensure 100% uptime requirement
```

### Issue: No Block Rewards

```
Problem: Not receiving validator rewards
Causes:
  1. Insufficient emotional authenticity
  2. Not selected for block validation
  3. Proposed invalid blocks
  4. Network connectivity issues

Debug:
  npm run show:rewards
  npm run show:status
  npm run show:blocks-validated

Solutions:
  1. Improve emotional authenticity (calibrate sensors)
  2. Improve network latency
  3. Ensure stake is confirmed
  4. Contact support if persistent
```

## Best Practices

### Security

```
DO:
  ✓ Use hardware wallet for stake
  ✓ Enable 2FA on node access
  ✓ Use VPN for remote management
  ✓ Keep private keys encrypted
  ✓ Use firewall restrictions

DON'T:
  ✗ Share private keys
  ✗ Run validator on public WiFi
  ✗ Use default passwords
  ✗ Expose sensitive logs
  ✗ Run multiple validators with same hardware
```

### Performance

```
DO:
  ✓ Maintain 99%+ uptime
  ✓ Keep latency <100ms
  ✓ Monitor disk usage
  ✓ Use SSD for storage
  ✓ Maintain stable network

DON'T:
  ✗ Share server with other services
  ✗ Use WiFi instead of wired connection
  ✗ Let disk fill up (75%+ utilization)
  ✗ Run without redundancy
  ✗ Ignore system updates
```

### Health

```
DO:
  ✓ Sleep 7-9 hours nightly
  ✓ Exercise 30+ minutes daily
  ✓ Maintain stress <0.5 level
  ✓ Regular health check-ups
  ✓ Proper nutrition

WHY:
  Healthy validators maintain high authenticity scores,
  leading to better block selection and rewards.
```

## Validator Slashing

Validators face penalties for:

```
Infraction                    Penalty           Cause
────────────────────────────────────────────────────
Offline >1 hour              -50% rewards      Network issue
Invalid block proposal        -10% stake        Bad block
Double-signing               -30% stake        Consensus violation
Biometric fraud              -100% stake       Sensor spoofing
Byzantine behavior           -100% stake       Attempted attack
```

Example:
```
Original Stake: 10,000 EMO
Double-Signing Penalty: 30%
Lost: 3,000 EMO
Remaining: 7,000 EMO
```

## Advanced Configuration

### Multi-Validator Setup (Not Recommended)

```
IMPORTANT: One validator per person
  ├─ Biometric data is unique to individual
  ├─ Running 2+ validators = fraudulent
  ├─ System detects via emotional anomalies
  ├─ Results in slashing of all involved stakes
  └─ Permanently banned from network
```

### Custom Sensor Integration

```typescript
// server/biometric/custom-sensor.ts
export class CustomSensorIntegration {
  async submitBiometricData(data: {
    heartRate: number;
    stressLevel: number;
    emotionalState: string;
    timestamp: number;
  }) {
    // Validate and submit to network
  }
}
```

## Validator Statistics

**Current State (2025):**

```
Total Validators: 21
Online: 20 (95.2%)
Offline: 1 (temporary maintenance)

Geographic Distribution:
  North America: 5/5 (100%)
  Europe: 5/5 (100%)
  Asia: 4/4 (100%)
  South America: 2/2 (100%)
  Africa: 2/2 (100%)
  Oceania: 2/2 (100%)
  Middle East: 1/1 (100%)

Average Emotional Score: 0.78
Average Uptime: 99.7%
Average Block Time: 7.2 seconds
Network Consensus: Stable
```

## Getting Help

- **Documentation**: See `docs/06-api.md` for biometric API
- **Troubleshooting**: Check validator logs with `npm run logs`
- **Support**: Create GitHub issue with system info
- **Community**: Join Discord validator channel

## Next Steps

1. **Set up hardware** following Step 1 above
2. **Install EmotionalChain** following Step 2
3. **Register sensors** following Step 3
4. **Start validator node** following Step 4
5. **Monitor performance** with daily checks
6. **Optimize rewards** by maintaining health

See `docs/06-api.md` for detailed API endpoints.
