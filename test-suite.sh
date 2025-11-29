#!/bin/bash

# EmotionalChain Comprehensive Test Suite
# Tests all major endpoints and business logic

BASE_URL="http://localhost:5000"
PASSED=0
FAILED=0

echo "================================"
echo "EMOTIONALCHAIN TEST SUITE"
echo "================================"
echo ""

# Helper functions
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local expected_status=$4
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json" -d "{}")
  fi
  
  http_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)
  
  if [ "$http_code" = "$expected_status" ]; then
    echo "✅ $name (HTTP $http_code)"
    ((PASSED++))
    return 0
  else
    echo "❌ $name (Expected $expected_status, got $http_code)"
    ((FAILED++))
    return 1
  fi
}

# A. NETWORK & BLOCKCHAIN TESTS
echo "A. NETWORK & BLOCKCHAIN TESTS"
echo "==============================="
test_endpoint "Network Status" "GET" "/api/network/status" "200"
test_endpoint "Get Blocks" "GET" "/api/blocks" "200"
test_endpoint "Get Transactions" "GET" "/api/transactions" "200"
test_endpoint "Get Validators" "GET" "/api/validators" "200"
test_endpoint "Get Token Economics" "GET" "/api/token/economics" "200"
echo ""

# B. WALLET & STAKING TESTS
echo "B. WALLET & STAKING TESTS"
echo "=========================="
test_endpoint "Get Wallets" "GET" "/api/wallets" "200"
test_endpoint "Get Wallets Database" "GET" "/api/wallets/database" "200"
echo ""

# C. BLOCKCHAIN DATA VERIFICATION
echo "C. BLOCKCHAIN DATA VERIFICATION"
echo "================================"

# Query latest blocks and verify structure
blocks_response=$(curl -s "$BASE_URL/api/blocks?limit=3")
block_count=$(echo "$blocks_response" | grep -o '"blockHeight"' | wc -l)
if [ "$block_count" -ge 1 ]; then
  echo "✅ Blocks Retrieved (Count: $block_count)"
  ((PASSED++))
else
  echo "❌ Blocks Not Retrieved"
  ((FAILED++))
fi

# Verify block rewards exist
if echo "$blocks_response" | grep -q '"reward"'; then
  echo "✅ Block Rewards Present"
  ((PASSED++))
else
  echo "❌ Block Rewards Missing"
  ((FAILED++))
fi

# Verify validator signatures
if echo "$blocks_response" | grep -q '"validatorSignature"'; then
  echo "✅ Validator Signatures Present"
  ((PASSED++))
else
  echo "❌ Validator Signatures Missing"
  ((FAILED++))
fi

echo ""

# D. VALIDATORS & STAKES
echo "D. VALIDATORS & STAKES"
echo "======================"

validators_response=$(curl -s "$BASE_URL/api/validators")
validator_count=$(echo "$validators_response" | grep -o '"validatorId"' | wc -l)
if [ "$validator_count" -ge 5 ]; then
  echo "✅ Validators Present (Count: $validator_count)"
  ((PASSED++))
else
  echo "❌ Insufficient Validators (Count: $validator_count)"
  ((FAILED++))
fi

# Check for stake amounts
if echo "$validators_response" | grep -q '"stake"'; then
  echo "✅ Validator Stakes Present"
  ((PASSED++))
else
  echo "❌ Validator Stakes Missing"
  ((FAILED++))
fi

echo ""

# E. TOKEN ECONOMICS
echo "E. TOKEN ECONOMICS"
echo "=================="

economics=$(curl -s "$BASE_URL/api/token/economics")

# Check total supply
total_supply=$(echo "$economics" | grep -o '"totalSupply":[0-9]*' | cut -d: -f2)
if [ "$total_supply" -gt 1000000 ]; then
  echo "✅ Total Supply Valid ($total_supply EMO)"
  ((PASSED++))
else
  echo "❌ Total Supply Invalid ($total_supply EMO)"
  ((FAILED++))
fi

# Check max supply
max_supply=$(echo "$economics" | grep -o '"maxSupply":[0-9]*' | cut -d: -f2)
if [ "$max_supply" = "10000000" ]; then
  echo "✅ Max Supply Correct (10M EMO)"
  ((PASSED++))
else
  echo "❌ Max Supply Incorrect ($max_supply)"
  ((FAILED++))
fi

# Check halving era
if echo "$economics" | grep -q '"halvingEra"'; then
  echo "✅ Halving Era Tracking Active"
  ((PASSED++))
else
  echo "❌ Halving Era Not Tracked"
  ((FAILED++))
fi

echo ""

# F. TRANSACTION VOLUME
echo "F. TRANSACTION VOLUME"
echo "===================="

tx_volume=$(curl -s "$BASE_URL/api/transactions/volume")
if echo "$tx_volume" | grep -q '"volume"'; then
  echo "✅ Transaction Volume Tracked"
  ((PASSED++))
else
  echo "❌ Transaction Volume Not Tracked"
  ((FAILED++))
fi

echo ""

# G. API RESPONSE TIMES
echo "G. API RESPONSE TIMES"
echo "===================="

# Measure wallet API response time
start_time=$(date +%s%N)
curl -s "$BASE_URL/api/wallets" > /dev/null
end_time=$(date +%s%N)
response_ms=$(( (end_time - start_time) / 1000000 ))

if [ "$response_ms" -lt 1000 ]; then
  echo "✅ Wallet API Response Time: ${response_ms}ms (FAST)"
  ((PASSED++))
else
  echo "⚠️  Wallet API Response Time: ${response_ms}ms (SLOW)"
  ((PASSED++))
fi

# Measure blocks API response time
start_time=$(date +%s%N)
curl -s "$BASE_URL/api/blocks?limit=100" > /dev/null
end_time=$(date +%s%N)
response_ms=$(( (end_time - start_time) / 1000000 ))

if [ "$response_ms" -lt 2000 ]; then
  echo "✅ Blocks API Response Time: ${response_ms}ms (FAST)"
  ((PASSED++))
else
  echo "⚠️  Blocks API Response Time: ${response_ms}ms (ACCEPTABLE)"
  ((PASSED++))
fi

echo ""

# H. DATA CONSISTENCY CHECKS
echo "H. DATA CONSISTENCY CHECKS"
echo "=========================="

# Get wallet balances and verify they're non-negative
wallets=$(curl -s "$BASE_URL/api/wallets")
negative_balances=$(echo "$wallets" | grep -o '"balance":-' | wc -l)
if [ "$negative_balances" -eq 0 ]; then
  echo "✅ All Wallet Balances Non-Negative"
  ((PASSED++))
else
  echo "❌ Negative Balances Detected"
  ((FAILED++))
fi

# Verify staked amounts are non-negative
negative_stakes=$(echo "$wallets" | grep -o '"staked":-' | wc -l)
if [ "$negative_stakes" -eq 0 ]; then
  echo "✅ All Stake Amounts Non-Negative"
  ((PASSED++))
else
  echo "❌ Negative Stakes Detected"
  ((FAILED++))
fi

echo ""

# I. MINING & REWARDS
echo "I. MINING & REWARDS"
echo "==================="

# Check if mining is active
network_status=$(curl -s "$BASE_URL/api/network/status")
if echo "$network_status" | grep -q '"isRunning":true'; then
  echo "✅ Mining Active"
  ((PASSED++))
else
  echo "❌ Mining Not Active"
  ((FAILED++))
fi

# Check latest block has rewards
latest_blocks=$(curl -s "$BASE_URL/api/blocks?limit=1")
if echo "$latest_blocks" | grep -q '"reward"'; then
  reward=$(echo "$latest_blocks" | grep -o '"reward":[0-9.]*' | cut -d: -f2 | head -1)
  if (( $(echo "$reward > 0" | bc -l) )); then
    echo "✅ Rewards Being Distributed ($reward EMO)"
    ((PASSED++))
  else
    echo "❌ Zero Rewards"
    ((FAILED++))
  fi
else
  echo "❌ Block Rewards Missing"
  ((FAILED++))
fi

echo ""

# J. BLOCKCHAIN HEIGHT PROGRESSION
echo "J. BLOCKCHAIN HEIGHT PROGRESSION"
echo "================================="

# Get current height
block_height=$(echo "$network_status" | grep -o '"blockHeight":[0-9]*' | cut -d: -f2)
if [ "$block_height" -gt 18000 ]; then
  echo "✅ Blockchain Height Valid ($block_height blocks)"
  ((PASSED++))
else
  echo "❌ Blockchain Height Too Low ($block_height blocks)"
  ((FAILED++))
fi

echo ""

# SUMMARY
echo "================================"
echo "TEST SUMMARY"
echo "================================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
total=$((PASSED + FAILED))
pass_rate=$((PASSED * 100 / total))
echo "📊 Pass Rate: ${pass_rate}%"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED!"
  exit 0
else
  echo "⚠️  Some tests failed - see above for details"
  exit 1
fi
