# Token Economics - EMO

## Token Overview

**EMO** is the native cryptocurrency of EmotionalChain.

```
Token Name:     Emotion (EMO)
Maximum Supply: 100,000,000 EMO
Current Supply: ~11,520,000 EMO (as of 2025)
Circulating:    ~8,400,000 EMO
Decimals:       18
Standard:       ERC-20 compatible
```

## Supply Schedule

### Initial Distribution

```
Total Supply: 100,000,000 EMO

Distribution:
  ├─ Validator Reserves:    30,000,000 (30%)
  ├─ Foundation Treasury:   25,000,000 (25%)
  ├─ Community Rewards:     20,000,000 (20%)
  ├─ Early Supporters:      15,000,000 (15%)
  ├─ Development Team:       8,000,000 (8%)
  └─ Ecosystem Incentives:   2,000,000 (2%)
```

### Halving Schedule

Block rewards halve every 2,102,400 blocks (~4 years):

```
Era    Years    Block Range          Reward/Block   Annual Supply
─────────────────────────────────────────────────────────────────
1      0-4      0 - 2,102,399        50 EMO         5,256,000
2      4-8      2,102,400 - 4,204,799  25 EMO     2,628,000
3      8-12     4,204,800 - 6,307,199  12.5 EMO   1,314,000
4      12-16    6,307,200 - 8,409,599  6.25 EMO    657,000
...
∞      ∞        ∞                      → 0           → 0
```

**Asymptotic Supply**: Maximum approaches 100M but never exceeds

## Validator Rewards

### Block Validation Rewards

```
Base Reward:      50 EMO per block
Block Time:       ~5-10 seconds
Blocks/Day:       ~8,640 blocks
Annual Blocks:    ~3,153,600 blocks
Annual Emission:  ~157,680,000 EMO (unsustainable, reduced by halvings)
```

### Performance Bonuses

```
Bonus Type              Condition                Payout
────────────────────────────────────────────────────────
Consistency Bonus       Emotion Score > 0.8     +10% base reward
Uptime Reward          100% availability        +5% base reward
Accuracy Bonus         Unanimous consensus      +2% base reward
Security Bonus         Zero anomalies detected  +3% base reward
```

**Maximum Validator Reward:**
```
Base:              50 EMO
Consistency:       +5 EMO
Uptime:            +2.5 EMO
Accuracy:          +1 EMO
Security:          +1.5 EMO
─────────────────────────
Total:             60 EMO per block
```

### Staking Rewards

Validators earn 30% of their balance as staking rewards:

```
Staked EMO Example:

Total Owned:       1,000 EMO
Liquid (70%):      700 EMO (available for transactions)
Staked (30%):      300 EMO (earning rewards)

Monthly Staking APY: 12%
Monthly Staking Reward: 300 × (12% / 12) = 3 EMO/month

Annual Staking Reward: 300 × 12% = 36 EMO/year
```

## Economic Incentives

### Validator Economics

**Monthly Income (Active Validator):**
```
Blocks validated:     ~432 blocks/month
Base reward:          432 × 50 = 21,600 EMO
Consistency bonus:    21,600 × 10% = 2,160 EMO
Uptime reward:        21,600 × 5% = 1,080 EMO
Staking reward:       300 × 1% = 3 EMO
─────────────────────────────────────
Total:                24,843 EMO/month
Annual:               ~298,116 EMO/year
```

At current hypothetical price: ~$100,000 USD annual income

### Cost of Attack

```
What it takes to attack the network (>2/3 control):
  • Need >14 validators (out of 21)
  • Each validator requires:
    - Unique human validator (biometric unique)
    - Genuine emotional state (can't fake)
    - Network infrastructure
    - EMO stake (slashing risk)
    - Hardware/sensors (~$50,000 per node)
    
Attack Cost: 14 × $50,000 = $700,000+ minimum
Attack Reward: Destroy $100M+ network value
Still unprofitable long-term due to slashing penalties
```

## Token Utility

### 1. Validator Staking

Required for validator participation:
- Minimum stake: 10,000 EMO per validator
- Earning potential: 12%+ annual returns
- Slashing risk: Up to 30% for malicious behavior

### 2. Transaction Fees

Minimal transaction fees (0.001 EMO per transfer):
```
Example Transfer:
  Amount:    1,000 EMO
  Fee:       0.001 EMO
  Total:     1,000.001 EMO

Monthly transfers: 1,000
Monthly fees: 1 EMO
Annual fees: 12 EMO
```

### 3. Governance

Token holders participate in:
- Protocol upgrades voting
- Validator parameter adjustment
- Treasury fund allocation
- Risk management decisions

### 4. Health Data Marketplace

Using EMO in enterprise health data platform:
```
Scenario: Corporate Wellness Program

Health Data Value: Company pays $100 EMO for anonymized employee wellness data
User Participation:  Employees earn 10 EMO per month sharing data
Annual Per Employee: 120 EMO
Platform Fee:        10% (10 EMO)
Company Savings:     Healthier workforce, insurance discounts
```

## Price Discovery Model

### Market Dynamics

```
Demand Factors:
  ├─ Validator participation
  ├─ Transaction volume
  ├─ Enterprise adoption
  ├─ Staking yields
  └─ Token scarcity (halving)

Supply Factors:
  ├─ Block rewards
  ├─ Staking emissions
  ├─ Community rewards
  └─ Validator exits (selling)
```

### Equilibrium Price

Expected price evolution:

```
Year    Supply (M)    Demand       Price (Est.)
─────────────────────────────────────────────
2025    11.52 M       Low-Medium   $0.50 - $1.00
2026    16.78 M       Medium       $1.00 - $2.00
2027    21.54 M       Medium-High  $2.00 - $5.00
2028    25.80 M       High         $5.00 - $10.00
2029    30.06 M       High         $10.00 - $20.00
```

*Note: This is speculative. Actual price depends on adoption.*

## Enterprise Token Economics

### Health Data Marketplace Model

```
Data Provider (Employee):
  ├─ Earns: 10 EMO/month (wellness data)
  ├─ Value: $50-100 per month
  └─ Annual: 120 EMO ($6,000 potential value)

Data Buyer (Insurance/Corp):
  ├─ Pays: $100 EMO per dataset
  ├─ Data: 1,000 employee profiles
  ├─ Cost: 100,000 EMO ($5M-10M value)
  └─ ROI: Personalized wellness programs

Platform (EmotionalChain):
  ├─ Facilitates: All transactions
  ├─ Fee: 1% ($1M from example)
  └─ Value: Network growth, adoption
```

### Insurance Integration

```
Participant:    Wellness Insured
Annual Premium: $5,000
EMO Incentive:  Earn 100 EMO for meeting health goals

Value:
  ├─ Insurer saves on claims (healthier customers)
  ├─ User saves on premium (gets 100 EMO = ~$500)
  ├─ EMO gains adoption (10,000 users × 100 EMO = 1M EMO/year)
  └─ Network effect grows
```

## Deflationary Mechanisms

### 1. Transaction Fees

Small portion burned:
```
Transaction Fee:   0.001 EMO
Burn Amount:       0.0001 EMO (10%)
To Validator:      0.0009 EMO
```

### 2. Slashing Penalties

Malicious validators forfeit stake:
```
Validator Stake:     10,000 EMO
Slashing Penalty:    30%
Burned:              3,000 EMO (removed from supply)
```

### 3. Token Buyback

Foundation can repurchase from market:
```
Annual Revenue:  Treasury EMO from fees
Buyback:         10% of revenue
Burn:            Reduce circulating supply
Effect:          Increase scarcity, support price
```

## Long-term Economics

### Sustainability Analysis

```
2025-2029 (High Emission Phase):
  Annual Inflation: ~15-20%
  Main Driver: Block rewards
  Pressure: Downward on price

2029-2033 (Maturation Phase):
  Annual Inflation: ~5-10%
  Main Driver: Staking rewards
  Pressure: Stabilization

2033+ (Equilibrium Phase):
  Annual Inflation: <1%
  Main Driver: Transaction fees, staking
  Pressure: Minimal
  
Long-term: Fees sustain validator rewards
```

### Network Value Equation

```
Network Value = (Annual Validator Rewards) / (Discount Rate)

Example (2029):
  Block Reward:        25 EMO
  Blocks/Year:         3,153,600
  Annual Block Rewards: 78,840,000 EMO
  Discount Rate:       10% (market assumption)
  Network Value:       $788,400,000 (at $1 EMO)
                       $3,942,000,000 (at $5 EMO)
```

## Comparison to Other Blockchains

```
             Bitcoin    Ethereum   EmotionalChain
─────────────────────────────────────────────────
Max Supply: 21M BTC    Unlimited  100M EMO
Halving:    Every 4yr  None       Every 4yr
Consensus:  PoW        PoS        PoE + PoS
Validator:  Miners     30k+       21 global
Energy:     210 TWh/yr 25 TWh/yr  ~1 GWh/yr
Emission:   Decreasing Decreasing Decreasing
```

## Getting Started with EMO

1. **Earn EMO**: Run a validator node
2. **Stake EMO**: Lock in staking rewards (12% APY)
3. **Use EMO**: Transfer between validators
4. **Enterprise**: Participate in health data marketplace

See `docs/05-validators.md` for validator setup guide.
