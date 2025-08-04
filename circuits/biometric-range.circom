pragma circom 2.0.0;

/*
 * EmotionalChain Biometric Range Circuit
 * Proves that biometric readings are within valid ranges
 * without revealing actual values
 */

template BiometricRange() {
    // Private inputs - actual biometric values
    signal private input heartRate;
    signal private input stressLevel;
    signal private input focusLevel;
    signal private input authenticity;
    signal private input salt;
    
    // Public inputs - threshold values
    signal input thresholdHeart;
    signal input thresholdStress;
    signal input thresholdFocus;
    
    // Output signals
    signal output heartValid;
    signal output stressValid;
    signal output focusValid;
    signal output allValid;
    
    // Heart rate validation (should be >= threshold)
    component heartCheck = GreaterEqThan(8);
    heartCheck.in[0] <== heartRate;
    heartCheck.in[1] <== thresholdHeart;
    heartValid <== heartCheck.out;
    
    // Stress level validation (should be <= threshold)
    component stressCheck = LessEqThan(8);
    stressCheck.in[0] <== stressLevel;
    stressCheck.in[1] <== thresholdStress;
    stressValid <== stressCheck.out;
    
    // Focus level validation (should be >= threshold)
    component focusCheck = GreaterEqThan(8);
    focusCheck.in[0] <== focusLevel;
    focusCheck.in[1] <== thresholdFocus;
    focusValid <== focusCheck.out;
    
    // Authenticity validation (should be >= 70%)
    component authCheck = GreaterEqThan(8);
    authCheck.in[0] <== authenticity;
    authCheck.in[1] <== 70;
    
    // All conditions must be valid
    component and1 = AND();
    and1.a <== heartValid;
    and1.b <== stressValid;
    
    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== focusValid;
    
    component and3 = AND();
    and3.a <== and2.out;
    and3.b <== authCheck.out;
    
    allValid <== and3.out;
    
    // Range checks to ensure inputs are valid
    component heartRange = Range(201); // 0-200 BPM
    heartRange.in <== heartRate;
    
    component stressRange = Range(101); // 0-100%
    stressRange.in <== stressLevel;
    
    component focusRange = Range(101); // 0-100%
    focusRange.in <== focusLevel;
    
    component authRange = Range(101); // 0-100%
    authRange.in <== authenticity;
    
    // Add salt for privacy
    signal saltedHeart;
    saltedHeart <== heartRate + salt;
}

/*
 * Less than or equal template
 */
template LessEqThan(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[0];
    lt.in[1] <== in[1] + 1;
    
    out <== lt.out;
}

/*
 * AND gate template
 */
template AND() {
    signal input a;
    signal input b;
    signal output out;
    
    out <== a * b;
}

/*
 * Range check template
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
 * Less than template
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
 * Number to bits template
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

component main = BiometricRange();