pragma circom 2.0.0;

/*
 * EmotionalChain Validator Eligibility Circuit
 * Proves that a validator meets all requirements for consensus participation
 * without revealing exact stake amounts or performance metrics
 */

template ValidatorEligibility() {
    // Private inputs - validator metrics
    signal private input emotionalScore;
    signal private input uptimePercentage;
    signal private input stakeAmount;
    signal private input validatorSalt;
    
    // Public inputs - minimum requirements
    signal input minEmotionalScore;
    signal input minUptime;
    signal input minStake;
    
    // Output signals
    signal output emotionalEligible;
    signal output uptimeEligible;
    signal output stakeEligible;
    signal output fullyEligible;
    
    // Emotional score check
    component emotionalCheck = GreaterEqThan(8);
    emotionalCheck.in[0] <== emotionalScore;
    emotionalCheck.in[1] <== minEmotionalScore;
    emotionalEligible <== emotionalCheck.out;
    
    // Uptime percentage check
    component uptimeCheck = GreaterEqThan(8);
    uptimeCheck.in[0] <== uptimePercentage;
    uptimeCheck.in[1] <== minUptime;
    uptimeEligible <== uptimeCheck.out;
    
    // Stake amount check (using 16-bit for larger numbers)
    component stakeCheck = GreaterEqThan(16);
    stakeCheck.in[0] <== stakeAmount;
    stakeCheck.in[1] <== minStake;
    stakeEligible <== stakeCheck.out;
    
    // All conditions must be met
    component and1 = AND();
    and1.a <== emotionalEligible;
    and1.b <== uptimeEligible;
    
    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== stakeEligible;
    
    fullyEligible <== and2.out;
    
    // Range validation
    component emotionalRange = Range(101); // 0-100 score
    emotionalRange.in <== emotionalScore;
    
    component uptimeRange = Range(101); // 0-100 percentage
    uptimeRange.in <== uptimePercentage;
    
    // Stake amount validation (up to 1M tokens)
    component stakeRange = Range16(1000000);
    stakeRange.in <== stakeAmount;
    
    // Privacy preservation with salt
    signal saltedEmotional;
    saltedEmotional <== emotionalScore + validatorSalt;
    
    // Reputation score calculation (private)
    signal reputationBonus;
    component reputationCalc = ReputationCalculator();
    reputationCalc.emotional <== emotionalScore;
    reputationCalc.uptime <== uptimePercentage;
    reputationBonus <== reputationCalc.bonus;
}

/*
 * Reputation calculator template
 * Calculates reputation bonus based on performance
 */
template ReputationCalculator() {
    signal input emotional;
    signal input uptime;
    signal output bonus;
    
    // Excellent performance (95+ emotional, 99+ uptime) = 20% bonus
    component excellentEmotional = GreaterEqThan(8);
    excellentEmotional.in[0] <== emotional;
    excellentEmotional.in[1] <== 95;
    
    component excellentUptime = GreaterEqThan(8);
    excellentUptime.in[0] <== uptime;
    excellentUptime.in[1] <== 99;
    
    component excellentAnd = AND();
    excellentAnd.a <== excellentEmotional.out;
    excellentAnd.b <== excellentUptime.out;
    
    // Good performance (85+ emotional, 97+ uptime) = 10% bonus
    component goodEmotional = GreaterEqThan(8);
    goodEmotional.in[0] <== emotional;
    goodEmotional.in[1] <== 85;
    
    component goodUptime = GreaterEqThan(8);
    goodUptime.in[0] <== uptime;
    goodUptime.in[1] <== 97;
    
    component goodAnd = AND();
    goodAnd.a <== goodEmotional.out;
    goodAnd.b <== goodUptime.out;
    
    // Calculate bonus (simplified: 20 for excellent, 10 for good, 0 otherwise)
    signal excellentBonus;
    excellentBonus <== excellentAnd.out * 20;
    
    signal goodBonus;
    goodBonus <== goodAnd.out * 10;
    
    // Use excellent bonus if excellent, otherwise good bonus
    component selector = Selector();
    selector.condition <== excellentAnd.out;
    selector.ifTrue <== 20;
    selector.ifFalse <== goodBonus;
    
    bonus <== selector.out;
}

/*
 * Selector template (ternary operator)
 */
template Selector() {
    signal input condition;
    signal input ifTrue;
    signal input ifFalse;
    signal output out;
    
    out <== condition * ifTrue + (1 - condition) * ifFalse;
}

/*
 * 16-bit range check for larger numbers
 */
template Range16(n) {
    signal input in;
    signal output out;
    
    component lt = LessThan(16);
    lt.in[0] <== in;
    lt.in[1] <== n;
    lt.out === 1;
    
    out <== in;
}

/*
 * 8-bit range check
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
 * Greater than or equal template (8-bit)
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
 * AND gate template
 */
template AND() {
    signal input a;
    signal input b;
    signal output out;
    
    out <== a * b;
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

component main = ValidatorEligibility();