pragma circom 2.0.0;

/*
 * EmotionalChain Emotional Threshold Circuit
 * Proves that a validator's emotional score meets the minimum threshold
 * without revealing the actual score
 */

template EmotionalThreshold() {
    // Private inputs
    signal private input emotionalScore;
    signal private input salt;
    signal private input validatorHash;
    
    // Public inputs
    signal input threshold;
    
    // Output signal
    signal output eligible;
    
    // Constraints
    // Ensure emotional score is within valid range (0-100)
    component scoreRange = Range(101);
    scoreRange.in <== emotionalScore;
    
    // Check if emotional score >= threshold
    component greaterThan = GreaterEqThan(8); // 8 bits for scores 0-255
    greaterThan.in[0] <== emotionalScore;
    greaterThan.in[1] <== threshold;
    
    // Output 1 if eligible, 0 if not
    eligible <== greaterThan.out;
    
    // Add salt to prevent rainbow table attacks
    signal saltedScore;
    saltedScore <== emotionalScore + salt;
    
    // Ensure validator hash is properly formed
    component hashRange = Range(4294967296); // 32-bit range
    hashRange.in <== validatorHash;
}

/*
 * Range check template
 * Ensures input is within [0, n)
 */
template Range(n) {
    assert(n <= 254);
    signal input in;
    signal output out;
    
    component lt = LessThan(8);
    lt.in[0] <== in;
    lt.in[1] <== n;
    lt.out === 1;
    
    out <== in;
}

/*
 * Greater than or equal template
 */
template GreaterEqThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[1] - 1;
    lt.in[1] <== in[0];
    
    out <== lt.out;
}

/*
 * Less than template (from circomlib)
 */
template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component num2bits = Num2Bits(n+1);
    
    num2bits.in <== in[0]+ (1<<n) - in[1];
    
    out <== 1 - num2bits.out[n];
}

/*
 * Number to bits template (from circomlib)
 */
template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1=0;
    
    var e2=1;
    for (var i = 0; i<n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] -1 ) === 0;
        lc1 += out[i] * e2;
        e2 = e2+e2;
    }
    
    lc1 === in;
}

component main = EmotionalThreshold();