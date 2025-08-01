# EmotionalChain Token Smart Contracts

This directory contains the smart contracts for the EmotionalChain native token (EMO) and cross-chain bridge infrastructure.

## Contract Overview

### 1. EMOToken.sol
- **Type**: Native ERC-20 token with biometric validation
- **Features**:
  - Emotional score-based transfer restrictions
  - Biometric authentication requirements
  - Wellness reward pools and staking mechanisms
  - Cross-chain bridge compatibility
  - Zero-knowledge proof integration

### 2. EMOBridge.sol
- **Type**: Cross-chain bridge contract
- **Supported Protocols**:
  - LayerZero (omnichain functionality)
  - Axelar (cross-chain messaging)
  - Wormhole (multi-chain bridging)
  - Custom relayer network with validator consensus

### 3. WrappedEMO.sol
- **Type**: Wrapped token for non-native chains
- **Chains**: Ethereum, Polygon, BSC, Avalanche, Arbitrum, Optimism
- **Features**: Standard ERC-20 with mint/burn for bridge operations

## Token Economics

```
Total Supply: 1,000,000,000 EMO (1 billion)
├── Staking Pool: 400,000,000 EMO (40%)
├── Wellness Pool: 200,000,000 EMO (20%)
├── Ecosystem Pool: 250,000,000 EMO (25%)
└── Team Allocation: 150,000,000 EMO (15%)
```

### Reward Structure
- **Base Staking Rate**: 5% APY
- **Wellness Multiplier**: Up to 1.5x for emotional score > 80%
- **Authenticity Multiplier**: Up to 2.0x for authenticity > 90%
- **Maximum APY**: 15%

## Deployment

### Prerequisites
```bash
npm install
cp .env.example .env
# Configure your environment variables
```

### Environment Variables
```bash
PRIVATE_KEY=your_private_key
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### Deploy to Networks

#### EmotionalChain Testnet
```bash
npm run deploy:testnet
```

#### Ethereum Sepolia (Testnet)
```bash
npm run deploy:sepolia
```

#### Polygon Mumbai (Testnet)
```bash
npm run deploy:mumbai
```

#### Mainnet Deployments
```bash
npm run deploy:ethereum
npm run deploy:polygon
```

## Cross-Chain Bridge Integration

### Supported Chains

| Chain | Chain ID | Protocol | Status |
|-------|----------|----------|--------|
| Ethereum | 1 | LayerZero, Wormhole | ✅ Ready |
| Polygon | 137 | LayerZero, Axelar | ✅ Ready |
| BSC | 56 | LayerZero, Wormhole | ✅ Ready |
| Avalanche | 43114 | LayerZero, Axelar | ✅ Ready |
| Arbitrum | 42161 | LayerZero, Wormhole | ✅ Ready |
| Optimism | 10 | LayerZero, Axelar | ✅ Ready |

### Bridge Flow

1. **Native → Wrapped**:
   - User calls `bridgeToChain()` on EmotionalChain
   - Tokens are locked/burned on source chain
   - Bridge validators sign the transaction
   - Wrapped tokens are minted on target chain

2. **Wrapped → Native**:
   - User calls `burnForBridge()` on target chain
   - Wrapped tokens are burned
   - Bridge processes the burn event
   - Native tokens are unlocked/minted on EmotionalChain

### Bridge Security

- **Multi-signature validation**: Requires 3+ validator signatures
- **Biometric authentication**: Emotional score ≥ 75 required for bridging
- **Rate limiting**: Minimum/maximum amounts per transaction
- **Pausable operations**: Emergency pause functionality
- **Fee structure**: 0.01 EMO bridge fee for operations

## Biometric Integration

### Emotional Score Calculation
```solidity
emotionalScore = (
  (100 - stressLevel) * 30% +    // Low stress weight
  focusLevel * 30% +             // Focus level weight  
  authenticity * 40%             // Authenticity weight
) / 100
```

### Authentication Requirements

| Operation | Min Score | Authenticity | Notes |
|-----------|-----------|--------------|-------|
| Standard Transfer | N/A | N/A | No restrictions |
| Emotional Transfer | 75 | N/A | Biometric proof required |
| High-Value Transfer | 75 | 90% | >10,000 EMO transfers |
| Validator Registration | 75 | N/A | Minimum 10,000 EMO stake |
| Bridge Operations | 75 | N/A | Cross-chain transfers |
| Staking | 60 | N/A | Reward pool participation |

## Development

### Testing
```bash
npm test
```

### Coverage
```bash
npm run coverage
```

### Gas Optimization
```bash
npm run gas-report
```

### Contract Verification
```bash
# After deployment
npm run verify:sepolia [CONTRACT_ADDRESS] [CONSTRUCTOR_ARGS]
npm run verify:mumbai [CONTRACT_ADDRESS] [CONSTRUCTOR_ARGS]
```

## Integration Guide

### For DeFi Protocols

#### Adding EMO Token Support
```solidity
import "./interfaces/IERC20.sol";

contract YourDeFiProtocol {
    IERC20 public emoToken = IERC20(0x[EMO_TOKEN_ADDRESS]);
    
    function addLiquidity(uint256 amount) external {
        emoToken.transferFrom(msg.sender, address(this), amount);
        // Your liquidity logic
    }
}
```

#### Cross-Chain DeFi Integration
```solidity
import "./interfaces/IEMOBridge.sol";

contract CrossChainDeFi {
    IEMOBridge public emoBridge = IEMOBridge(0x[BRIDGE_ADDRESS]);
    
    function bridgeAndStake(uint256 amount, Chain targetChain) external {
        emoBridge.bridgeTokens(
            msg.sender,
            amount,
            targetChain,
            Protocol.LAYERZERO
        );
    }
}
```

### For Wallet Integration

#### Biometric Authentication
```typescript
import { ethers } from 'ethers';

const emoToken = new ethers.Contract(EMO_TOKEN_ADDRESS, EMO_ABI, signer);

// Submit biometric proof before transfers
await emoToken.submitBiometricProof(
  heartRate,      // 60-100 BPM
  stressLevel,    // 0-100
  focusLevel,     // 0-100  
  authenticity,   // 0-100
  proofHash       // Zero-knowledge proof hash
);

// Transfer with emotional authentication
await emoToken.transferWithEmotionalAuth(recipient, amount);
```

## Security Considerations

### Smart Contract Security
- ✅ OpenZeppelin base contracts
- ✅ ReentrancyGuard protection
- ✅ Pausable emergency controls
- ✅ Multi-signature validation
- ✅ Comprehensive access controls

### Bridge Security
- ✅ Validator consensus requirements
- ✅ Transaction replay protection
- ✅ Rate limiting and amount caps
- ✅ Emergency pause mechanisms
- ✅ Multi-protocol redundancy

### Biometric Privacy
- ✅ Zero-knowledge proof generation
- ✅ On-chain hash storage only
- ✅ Off-chain encrypted biometric data
- ✅ Cryptographic commitments
- ✅ Range proofs for validation

## Audit Status

| Contract | Auditor | Status | Report |
|----------|---------|--------|--------|
| EMOToken.sol | Pending | 🟡 In Progress | TBD |
| EMOBridge.sol | Pending | 🟡 In Progress | TBD |
| WrappedEMO.sol | Pending | 🟡 In Progress | TBD |

## Mainnet Deployment Plan

### Phase 1: Testnet Validation
- ✅ Deploy on EmotionalChain testnet
- ✅ Deploy wrapped tokens on testnets
- ⏳ Comprehensive testing and validation
- ⏳ Security audit completion

### Phase 2: Mainnet Deployment
- ⏳ Deploy EMOToken on EmotionalChain mainnet
- ⏳ Deploy bridges on target chains
- ⏳ Initialize validator network
- ⏳ Enable cross-chain functionality

### Phase 3: DeFi Integration
- ⏳ List on major DEXs (Uniswap, SushiSwap, QuickSwap)
- ⏳ Integrate with lending protocols (Aave, Compound)
- ⏳ Enable yield farming opportunities
- ⏳ Launch governance token functionality

## Support

For technical questions and support:
- GitHub Issues: [EmotionalChain Repository]
- Documentation: [docs.emotionalchain.io]
- Discord: [EmotionalChain Community]
- Email: dev@emotionalchain.io