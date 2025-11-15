pragma circom 2.0.0;

include "circomlib/comparators.circom";
include "circomlib/poseidon.circom";

/**
 * EmotionalThreshold ZK Circuit
 * 
 * Proves: score > threshold WITHOUT revealing actual score
 * 
 * Private Inputs (not revealed on-chain):
 *   - score: Actual emotional score (0-100)
 *   - nonce: Random value for commitment privacy
 * 
 * Public Inputs (visible on-chain):
 *   - threshold: Minimum score required (e.g., 75)
 *   - commitment: Hash commitment to hide score
 * 
 * Output:
 *   - isValid: 1 if score > threshold AND commitment is correct, else 0
 */
template EmotionalThreshold() {
    // Private inputs (not revealed)
    signal input score;
    signal input nonce;
    
    // Public inputs (visible on-chain)
    signal input threshold;
    signal input commitment;
    
    // Output: 1 if valid, 0 if invalid
    signal output isValid;
    
    // Step 1: Verify commitment matches hash(score, nonce)
    // Using Poseidon hash for ZK-friendly hashing
    component hasher = Poseidon(2);
    hasher.inputs[0] <== score;
    hasher.inputs[1] <== nonce;
    
    // Commitment must match the hash
    commitment === hasher.out;
    
    // Step 2: Verify score > threshold
    // Using 8-bit comparison (supports scores 0-255)
    component comp = GreaterThan(8);
    comp.in[0] <== score;
    comp.in[1] <== threshold;
    
    // Output is 1 if score > threshold, 0 otherwise
    isValid <== comp.out;
}

// Main component with public inputs declared
component main {public [threshold, commitment]} = EmotionalThreshold();
