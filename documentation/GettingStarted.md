# EmotionalChain SDK - Getting Started Guide

Welcome to EmotionalChain, the world's first emotion-powered blockchain! This guide will help you build applications that use biometric data and emotional consensus for authentic, human-centered blockchain interactions.

## Quick Start

### Installation

```bash
npm install @emotionalchain/sdk
# Or for React applications
npm install @emotionalchain/react
```

### Basic Usage

```typescript
import { EmotionalChain } from '@emotionalchain/sdk';

const client = new EmotionalChain({
  endpoint: 'https://mainnet.emotionalchain.io',
  apiKey: 'your-api-key'
});

// Connect to the network
await client.connect();

// Create a wallet
const wallet = await client.wallet.createWallet();

// Send a transaction with emotional authentication
const tx = await client.sendTransaction({
  from: wallet.address,
  to: '0x742d35Cc6Cb8e8532',
  amount: 100,
  requireEmotionalAuth: true
});
```

## Core Concepts

### 1. Emotional Authenticity

EmotionalChain uses real biometric data to verify the emotional state of users. This prevents automated attacks and ensures human authenticity in blockchain interactions.

**Supported Biometric Devices:**
- Heart rate monitors (Polar H10, Garmin, Fitbit)
- Stress sensors (Empatica E4, BioHarness)
- Focus monitors (Muse 2, OpenBCI, Emotiv)

### 2. Proof of Emotion Consensus

Our unique consensus mechanism selects validators based on their emotional authenticity and biometric data quality, creating a more human-centered blockchain.

### 3. EMO Token Economics

EMO tokens are earned through emotional validation and consensus participation. Higher emotional scores lead to greater rewards.

## SDK Components

### EmotionalChain Client

The main SDK client provides access to all blockchain functionality:

```typescript
import { EmotionalChain, EmotionalChainConfig } from '@emotionalchain/sdk';

const config: EmotionalChainConfig = {
  endpoint: 'https://mainnet.emotionalchain.io',
  apiKey: 'your-api-key',
  network: 'mainnet',
  timeout: 30000
};

const client = new EmotionalChain(config);
```

### Wallet Management

Create and manage wallets with emotional authentication:

```typescript
// Create a new wallet
const wallet = await client.wallet.createWallet();

// Import existing wallet
const importedWallet = await client.wallet.importWallet('your-private-key-or-mnemonic');

// Get balance
const balance = await client.wallet.getBalance(wallet.address);

// Send transaction
const tx = await client.wallet.sendTransaction({
  from: wallet.address,
  to: 'recipient-address',
  amount: 50
});
```

### Biometric Integration

Connect to biometric devices and monitor emotional state:

```typescript
// Scan for available devices
const devices = await client.biometric.scanForDevices();

// Connect to a device
await client.biometric.connectDevice(devices[0].id);

// Start monitoring
await client.biometric.startMonitoring();

// Get current emotional state
const emotionalState = await client.biometric.getCurrentEmotionalScore();

// Authenticate with biometrics
const authResult = await client.biometric.authenticate();
```

### Consensus Monitoring

Track network consensus and validator performance:

```typescript
// Get current consensus round
const currentRound = await client.consensus.getCurrentRound();

// Get validator information
const validators = await client.consensus.getValidators();

// Get network statistics
const networkStats = await client.consensus.getNetworkStats();

// Listen for consensus events
client.consensus.onConsensusRound((round) => {
  console.log('New consensus round:', round.emotionalScores);
});
```

### Real-time Updates

Subscribe to blockchain events via WebSocket:

```typescript
// Connect to WebSocket
await client.websocket.connect();

// Subscribe to consensus rounds
await client.websocket.subscribeToConsensusRounds();

// Listen for new blocks
client.websocket.onNewBlock((block) => {
  console.log('New block:', block);
});

// Subscribe to transaction updates
await client.websocket.subscribeToTransactions(wallet.address);
```

## React Integration

For React applications, use our React SDK hooks:

```tsx
import { 
  EmotionalChainProvider, 
  useEmotionalWallet, 
  useBiometricAuth,
  useConsensusMonitor 
} from '@emotionalchain/react';

function App() {
  return (
    <EmotionalChainProvider config={{ endpoint: 'https://mainnet.emotionalchain.io' }}>
      <MyDApp />
    </EmotionalChainProvider>
  );
}

function MyDApp() {
  const { wallet, connect, emotionalScore } = useEmotionalWallet();
  const { devices, authenticate } = useBiometricAuth();
  const { currentRound, validators } = useConsensusMonitor();

  return (
    <div>
      {wallet ? (
        <div>
          <p>Wallet: {wallet.address}</p>
          <p>Emotional Score: {emotionalScore}%</p>
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## Common Use Cases

### 1. Wellness Tracking DApp

Build applications that track user wellness with authentic biometric data:

```typescript
class WellnessTracker {
  async recordWellnessSession() {
    // Authenticate with biometrics
    const authResult = await client.biometric.authenticate();
    
    // Create wellness record
    const wellnessData = {
      timestamp: Date.now(),
      emotionalScore: authResult.overall,
      stress: authResult.stress,
      focus: authResult.focus,
      authenticity: authResult.authenticity
    };
    
    // Store on blockchain with emotional proof
    const tx = await client.sendTransaction({
      from: wallet.address,
      to: wellnessContractAddress,
      amount: 0,
      data: JSON.stringify(wellnessData),
      requireEmotionalAuth: true
    });
    
    return tx;
  }
}
```

### 2. Biometric-Secured Payments

Create payment systems that require emotional authentication:

```typescript
async function authenticatedPayment(to: string, amount: number) {
  try {
    // Verify emotional state meets threshold
    const emotionalScore = await client.biometric.getCurrentEmotionalScore();
    if (emotionalScore < 75) {
      throw new Error('Emotional score too low for secure payment');
    }
    
    // Send payment with biometric proof
    const tx = await client.sendTransaction({
      from: wallet.address,
      to,
      amount,
      requireEmotionalAuth: true,
      emotionalThreshold: 75
    });
    
    return tx;
  } catch (error) {
    console.error('Payment failed:', error);
    throw error;
  }
}
```

### 3. Emotional NFT Marketplace

Build NFT platforms where emotional authenticity affects value:

```typescript
class EmotionalNFT {
  async mintEmotionalNFT(metadata: any) {
    // Generate emotional proof
    const emotionalState = await client.biometric.authenticate();
    const proof = await client.biometric.generateProof(emotionalState.overall);
    
    // Enhanced metadata with emotional data
    const enhancedMetadata = {
      ...metadata,
      emotionalScore: emotionalState.overall,
      authenticity: emotionalState.authenticity,
      biometricProof: proof,
      timestamp: Date.now()
    };
    
    // Mint NFT with emotional authentication
    const tx = await client.sendTransaction({
      from: wallet.address,
      to: nftContractAddress,
      amount: 0,
      data: JSON.stringify(enhancedMetadata),
      requireEmotionalAuth: true
    });
    
    return tx;
  }
}
```

## Testing Your DApp

Use our comprehensive testing framework:

```typescript
import { EmotionalChainTester, MockDataGenerator } from '@emotionalchain/testing';

describe('My DApp Tests', () => {
  const tester = new EmotionalChainTester({
    network: 'testnet',
    mockMode: true
  });

  beforeAll(async () => {
    await tester.setupTestEnvironment();
  });

  afterAll(async () => {
    await tester.teardownTestEnvironment();
  });

  test('should authenticate with biometrics', async () => {
    const result = await tester.testBiometricAuthentication();
    expect(result.passed).toBe(true);
  });

  test('should send emotional transaction', async () => {
    const result = await tester.testFullEmotionalTransaction();
    expect(result.passed).toBe(true);
  });
});
```

## Best Practices

### 1. Error Handling

Always implement comprehensive error handling:

```typescript
try {
  const tx = await client.sendTransaction(txRequest);
  console.log('Transaction sent:', tx.hash);
} catch (error) {
  if (client.isNetworkError(error)) {
    console.error('Network error - check connection');
  } else if (client.isAPIError(error)) {
    console.error('API error:', client.getErrorCode(error));
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

### 2. Biometric Device Management

Handle device connection states properly:

```typescript
// Check device status before monitoring
const devices = await client.biometric.getDeviceStatus();
const connectedDevices = devices.filter(d => d.status === 'connected');

if (connectedDevices.length === 0) {
  // Scan and connect to devices
  const availableDevices = await client.biometric.scanForDevices();
  if (availableDevices.length > 0) {
    await client.biometric.connectDevice(availableDevices[0].id);
  }
}

// Always stop monitoring when done
await client.biometric.stopMonitoring();
```

### 3. Transaction Monitoring

Monitor transaction status for better UX:

```typescript
const tx = await client.sendTransaction(txRequest);

// Show pending state
console.log('Transaction pending:', tx.hash);

// Wait for confirmation
try {
  const confirmedTx = await client.waitForTransaction(tx.hash, 60000);
  console.log('Transaction confirmed:', confirmedTx);
} catch (error) {
  console.error('Transaction timeout or failed');
}
```

### 4. Resource Cleanup

Always clean up resources:

```typescript
// Component unmount or app shutdown
await client.biometric.stopMonitoring();
await client.websocket.disconnect();
await client.destroy();
```

## Security Considerations

### 1. API Key Management

Never expose API keys in client-side code:

```typescript
// ❌ Don't do this
const client = new EmotionalChain({
  endpoint: 'https://mainnet.emotionalchain.io',
  apiKey: 'sk-123456789' // Exposed in browser
});

// ✅ Use environment variables or secure proxy
const client = new EmotionalChain({
  endpoint: 'https://mainnet.emotionalchain.io',
  apiKey: process.env.EMOTIONAL_CHAIN_API_KEY
});
```

### 2. Private Key Security

Use secure key storage methods:

```typescript
// ✅ Good - use hardware wallets or secure enclaves
const wallet = await client.wallet.connectHardwareWallet('ledger');

// ✅ Good - use encrypted key storage
const encryptedKey = await secureStorage.get('wallet_key');
const wallet = await client.wallet.importWallet(decryptKey(encryptedKey));
```

### 3. Biometric Privacy

Respect user privacy with biometric data:

```typescript
// Configure privacy-preserving biometric processing
client.biometric.updateConfig({
  enableAntiSpoofing: true,
  enableLivenessDetection: true,
  privacyMode: true // Don't store raw biometric data
});
```

## Performance Optimization

### 1. Connection Management

Reuse connections efficiently:

```typescript
// ✅ Create one client instance per application
const globalClient = new EmotionalChain(config);

// ✅ Share across components
export { globalClient as emotionalChainClient };
```

### 2. Caching

Cache frequently accessed data:

```typescript
// Cache network info
let cachedNetworkInfo: any = null;
let cacheExpiry = 0;

async function getNetworkInfo() {
  if (cachedNetworkInfo && Date.now() < cacheExpiry) {
    return cachedNetworkInfo;
  }
  
  cachedNetworkInfo = await client.getNetworkInfo();
  cacheExpiry = Date.now() + 30000; // Cache for 30 seconds
  
  return cachedNetworkInfo;
}
```

### 3. Batch Operations

Batch multiple operations when possible:

```typescript
// ✅ Batch multiple wallet balance checks
const addresses = ['0x123...', '0x456...', '0x789...'];
const balances = await Promise.all(
  addresses.map(addr => client.wallet.getBalance(addr))
);
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Increase timeout values in configuration
   - Check network connectivity
   - Verify endpoint URL

2. **Biometric Device Not Found**
   - Ensure devices are powered on and in pairing mode
   - Check device compatibility
   - Try rescanning for devices

3. **Transaction Failures**
   - Verify sufficient balance
   - Check emotional score meets threshold
   - Ensure proper biometric authentication

4. **WebSocket Disconnections**
   - Implement reconnection logic
   - Handle connection state changes
   - Use exponential backoff for retries

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
const client = new EmotionalChain({
  endpoint: 'https://mainnet.emotionalchain.io',
  apiKey: 'your-api-key',
  logLevel: 'debug' // Enable debug logging
});

// Listen for debug events
client.on('apiCall', (data) => {
  console.log('API Call:', data.url, data.duration + 'ms');
});
```

## Next Steps

1. **Explore Example DApps**: Check out our complete example applications in the `/examples` directory
2. **Join the Community**: Connect with other developers building on EmotionalChain
3. **Read API Documentation**: Dive deeper into specific SDK methods and parameters
4. **Contribute**: Help improve the SDK by contributing to our open-source repositories

## Support

- **Documentation**: [docs.emotionalchain.io](https://docs.emotionalchain.io)
- **GitHub**: [github.com/emotionalchain](https://github.com/emotionalchain)
- **Discord**: [discord.gg/emotionalchain](https://discord.gg/emotionalchain)
- **Email**: support@emotionalchain.io

Start building emotionally authentic applications today! 🧠❤️⛓️