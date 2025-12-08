# Proof of Emotion (PoE) Consensus

## What is Proof of Emotion?

Validators prove their legitimacy through real-time biometric data rather than computational power or cryptocurrency stake.

## How It Works

### Step 1: Biometric Collection
Validators submit continuous biometric data:
- Heart rate (HRV)
- Stress level
- Emotional state
- Body temperature
- Respiratory rate

### Step 2: Authenticity Scoring
System calculates emotional authenticity (0.0 - 1.0):
- Consistency check
- HRV pattern analysis
- Stress resilience
- Emotional stability

### Step 3: Validator Selection
Top 2/3 validators by score selected for consensus

### Step 4: Block Proposal & Voting
Selected validators propose blocks and vote

### Step 5: Consensus Achievement
≥2/3 validators approve → Block finalized

## Anomaly Detection

System detects suspicious behavior:

| Type | Signal | Action |
|------|--------|--------|
| Emotional Spike | Score 0.95+ | Investigate |
| Consensus Drift | Unusual votes | Scrutiny |
| Authenticity Drop | Score <0.4 | Suspend |
| Pattern Break | Behavioral change | Recalibration |

## Hybrid Model: PoE + PoS

**Proof of Emotion** ensures validator is real person  
**Proof of Stake** ensures economic incentive  
**Together** = Secure & resilient network

## Rewards & Penalties

### Rewards
- Base: 50 EMO per block
- Consistency: +10% if score > 0.8
- Uptime: +5% for 100% availability

### Penalties
- Low score (<0.5): -50% rewards
- Offline: -100% rewards
- Malicious: Slashing (loss of stake)

## Device Status

**Online**: Full voting power, 100% rewards  
**Offline**: 2 votes, 50% rewards

## Security

### Attack Prevention
- Sybil attacks: Impossible (biometrics are unique)
- Collusion: Detected via anomalies
- Spoofing: Device attestation prevents
- Eclipse: P2P redundancy across continents

### Privacy
- Zero-knowledge proofs (no health data exposed)
- Threshold proofs (no single validator controls proof)
- Data hashed and auto-purged after 90 days

## Byzantine Fault Tolerance

EmotionalChain handles up to 1/3 faulty validators:
- 21 total validators
- ≥14 required for consensus
- Emotionally authentic validators can't collude
- Impossible to fake multiple people's emotions

---

Learn more in [Token Economics](Token-Economics) for reward details.
