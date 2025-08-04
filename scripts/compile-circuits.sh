#!/bin/bash

# EmotionalChain Circuit Compilation Script
# Compiles Circom circuits for zero-knowledge proof generation

set -e

echo "🔧 EmotionalChain Circuit Compilation"
echo "===================================="

# Check if Circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ Circom not found. Installing..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux installation
        wget https://github.com/iden3/circom/releases/latest/download/circom-linux-amd64
        chmod +x circom-linux-amd64
        sudo mv circom-linux-amd64 /usr/local/bin/circom
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS installation
        if command -v brew &> /dev/null; then
            brew install circom
        else
            echo "❌ Please install Homebrew or download Circom manually"
            exit 1
        fi
    else
        echo "❌ Unsupported operating system. Please install Circom manually."
        exit 1
    fi
fi

# Check if SnarkJS is available
if ! command -v snarkjs &> /dev/null; then
    echo "📦 Installing SnarkJS..."
    npm install -g snarkjs
fi

# Create build directory
mkdir -p circuits/build
cd circuits

echo "🏗️  Compiling circuits..."

# Compile emotional-threshold circuit
echo "   → Compiling emotional-threshold.circom"
circom emotional-threshold.circom --r1cs --wasm --sym -o build/

# Compile biometric-range circuit  
echo "   → Compiling biometric-range.circom"
circom biometric-range.circom --r1cs --wasm --sym -o build/

# Compile validator-eligibility circuit
echo "   → Compiling validator-eligibility.circom"
circom validator-eligibility.circom --r1cs --wasm --sym -o build/

echo "🔑 Generating proving and verification keys..."

# Generate trusted setup for each circuit
circuits=("emotional-threshold" "biometric-range" "validator-eligibility")

for circuit in "${circuits[@]}"; do
    echo "   → Processing $circuit"
    
    # Powers of tau ceremony (Phase 1)
    if [ ! -f "build/pot12_0000.ptau" ]; then
        echo "     • Generating powers of tau"
        snarkjs powersoftau new bn128 12 build/pot12_0000.ptau -v
        snarkjs powersoftau contribute build/pot12_0000.ptau build/pot12_0001.ptau --name="First contribution" -v -e="random text"
        snarkjs powersoftau prepare phase2 build/pot12_0001.ptau build/pot12_final.ptau -v
    fi
    
    # Circuit-specific setup (Phase 2)
    echo "     • Generating zero-knowledge key"
    snarkjs groth16 setup build/${circuit}.r1cs build/pot12_final.ptau build/${circuit}_0000.zkey
    
    echo "     • Contributing to ceremony"
    snarkjs zkey contribute build/${circuit}_0000.zkey build/${circuit}_final.zkey --name="1st Contributor" -v -e="random text"
    
    echo "     • Exporting verification key"
    snarkjs zkey export verificationkey build/${circuit}_final.zkey build/${circuit}_vkey.json
    
    echo "     • Verifying key"
    snarkjs zkey verify build/${circuit}.r1cs build/pot12_final.ptau build/${circuit}_final.zkey
done

echo "📋 Generating circuit information..."

# Generate circuit info files
for circuit in "${circuits[@]}"; do
    echo "Circuit: $circuit" > build/${circuit}_info.txt
    echo "R1CS constraints: $(snarkjs r1cs info build/${circuit}.r1cs | grep 'Number of constraints' | awk '{print $4}')" >> build/${circuit}_info.txt
    echo "Proving key size: $(wc -c < build/${circuit}_final.zkey) bytes" >> build/${circuit}_info.txt
    echo "Verification key size: $(wc -c < build/${circuit}_vkey.json) bytes" >> build/${circuit}_info.txt
    echo "Compilation date: $(date)" >> build/${circuit}_info.txt
done

echo "🧪 Running circuit tests..."

# Test emotional-threshold circuit
echo "   → Testing emotional-threshold circuit"
node -e "
const circomlib = require('circomlib');
const snarkjs = require('snarkjs');

async function testCircuit() {
    try {
        const input = {
            emotionalScore: 75,
            threshold: 60,
            salt: 12345,
            validatorHash: 98765
        };
        
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            'build/emotional-threshold.wasm',
            'build/emotional-threshold_final.zkey'
        );
        
        console.log('     ✅ Circuit test passed');
        console.log('     📊 Public signal:', publicSignals[0]);
    } catch (error) {
        console.log('     ❌ Circuit test failed:', error.message);
    }
}

testCircuit();
"

echo "📊 Circuit compilation summary:"
echo "   • Circuits compiled: ${#circuits[@]}"
echo "   • Build directory: $(pwd)/build"
echo "   • Total build size: $(du -sh build/ | cut -f1)"

# List generated files
echo ""
echo "📁 Generated files:"
find build/ -name "*.zkey" -o -name "*.json" -o -name "*.wasm" | sort

echo ""
echo "✅ Circuit compilation complete!"
echo "   Circuits are ready for zero-knowledge proof generation."
echo "   Use PrivacyLayer.ts to generate and verify proofs."

cd ..
echo ""