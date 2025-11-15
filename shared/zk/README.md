# ZK Proof System - Implementation Status

## Current Status: **DEMONSTRATION/MOCK IMPLEMENTATION**

This threshold proof system is a **functional demonstration** of privacy-preserving concepts, NOT a production-ready ZK-SNARK implementation.

## What Works (Demo Mode)
✅ Privacy-preserving architecture (only commitments stored, not raw scores)  
✅ Periodic proof submission (10 min intervals + random jitter)  
✅ Replay attack prevention (15 min proof age limit)  
✅ Threshold verification (proves score > 75 without revealing actual score)  
✅ API endpoints for proof submission and verification  
✅ Database storage of proofs with commitments

## What's Mocked (Needs Production Implementation)

### ⚠️ CRITICAL: Hash Function Mismatch

**Current State:**
- TypeScript: Mock Poseidon (weighted byte sum mod BN128 field)
- Circom Circuit: Real Poseidon (circomlib implementation)
- **These are NOT compatible** - proofs generated in TS won't verify in circuit

**Production Path:**
```typescript
// Install circomlibjs
npm install circomlibjs

// Replace mock hash with real Poseidon
import { buildPoseidon } from "circomlibjs";

const poseidon = await buildPoseidon();
const commitment = poseidon([score, nonce]); // Returns field element
```

### ZK Proof Generation (Mock)

**Current:** Simple JSON structure with hashed values  
**Production Needed:**
1. Compile Circom circuit: `circom emotionalThreshold.circom --r1cs --wasm --sym`
2. Generate proving key: `snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit_0000.zkey`
3. Generate witness and proof:
```typescript
import { groth16 } from "snarkjs";

const { proof, publicSignals } = await groth16.fullProve(
  { score, nonce, threshold, commitment },
  "circuit.wasm",
  "circuit_final.zkey"
);
```

### ZK Proof Verification (Mock)

**Current:** JSON structure validation  
**Production Needed:**
```typescript
import { groth16 } from "snarkjs";
const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
const isValid = await groth16.verify(vKey, publicSignals, proof);
```

## Production Deployment Checklist

- [ ] Install circomlibjs: `npm install circomlibjs`
- [ ] Replace mock Poseidon with actual circomlibjs implementation
- [ ] Compile Circom circuit to R1CS and WASM
- [ ] Generate trusted setup (proving + verification keys)
- [ ] Integrate SnarkJS for real proof generation
- [ ] Integrate SnarkJS for real proof verification
- [ ] Add round-trip integration test (TS → Circuit → TS)
- [ ] Update commitment serialization (field elements, not hex strings)
- [ ] Audit cryptographic security
- [ ] Load test proof generation performance

## Security Considerations

⚠️ **DO NOT USE IN PRODUCTION WITHOUT:**
1. Cryptographic audit of ZK-SNARK implementation
2. Trusted setup ceremony for Groth16 proving keys
3. Security review of commitment scheme
4. Formal verification of Circom circuit logic
5. Performance testing under adversarial conditions

## Why Mock for Demo?

This project is positioned as a **research/demonstration platform** exploring human-centric consensus mechanisms (see replit.md). The mock implementation:
- Demonstrates privacy-preserving architecture
- Shows periodic proof submission flow
- Validates API and database design
- Provides clear upgrade path to production ZK-SNARKs
- Avoids complexity of trusted setup ceremony for demo

## Architecture Notes

**Batch Proof Coordinator is In-Memory:**
The `BatchProofCoordinator` class maintains an in-memory queue of proofs. It does **not** automatically pull from database tables. To use batch proofs:
1. Create a coordinator instance: `const coordinator = new BatchProofCoordinator()`
2. Queue proofs programmatically: `await coordinator.queueProof(thresholdProof)`
3. Or submit via API: `POST /api/batch-proofs/submit`

**Integration with Threshold Proofs:**
Currently, threshold proofs and batch proofs are separate systems:
- Threshold proofs are stored in `threshold_proofs` table
- Batch proofs are in-memory queued, then stored in `batch_proofs` table
- No automatic batching of threshold proofs (intentional for demo)

For production, you would integrate these by:
- Running a background service that monitors threshold proof submissions
- Automatically queuing them in the batch coordinator
- Periodically creating and submitting batches

## Files

- `thresholdProofs.ts` - Mock proof system (TypeScript)
- `batchProofs.ts` - Batch proof coordinator (in-memory queue)
- `emotionalThreshold.circom` - Circuit definition (ready for compilation)
- `README.md` - This file (implementation status)
