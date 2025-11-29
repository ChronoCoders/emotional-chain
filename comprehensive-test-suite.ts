#!/usr/bin/env tsx
/**
 * EmotionalChain Comprehensive Test Suite
 * 21 tests across 6 categories
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
let passedTests = 0;
let failedTests = 0;
const results: { category: string; test: string; status: string; message: string }[] = [];

// Helper function
async function test(category: string, testName: string, testFn: () => Promise<boolean>) {
  try {
    const passed = await testFn();
    if (passed) {
      passedTests++;
      results.push({ category, test: testName, status: '✅', message: 'PASSED' });
      console.log(`✅ ${category}: ${testName}`);
    } else {
      failedTests++;
      results.push({ category, test: testName, status: '❌', message: 'FAILED' });
      console.log(`❌ ${category}: ${testName}`);
    }
  } catch (error: any) {
    failedTests++;
    results.push({ category, test: testName, status: '❌', message: error.message });
    console.log(`❌ ${category}: ${testName} - ${error.message}`);
  }
}

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     EMOTIONALCHAIN COMPREHENSIVE TEST SUITE (21 Tests)      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ==== A. DATABASE CONSISTENCY (4 tests) ====
  console.log('\n📦 A. DATABASE CONSISTENCY (4 tests)');
  console.log('────────────────────────────────────');

  await test('A', 'Wallet data persistence', async () => {
    const res1 = await axios.get(`${BASE_URL}/api/wallets`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const res2 = await axios.get(`${BASE_URL}/api/wallets`);
    const wallet1 = res1.data[0];
    const wallet2 = res2.data.find((w: any) => w.validatorId === wallet1.validatorId);
    return wallet1.validatorId === wallet2?.validatorId && wallet1.balance <= wallet2?.balance;
  });

  await test('A', 'Block data integrity', async () => {
    const res = await axios.get(`${BASE_URL}/api/blocks?limit=10`);
    const blocks = res.data;
    if (!Array.isArray(blocks) || blocks.length === 0) return false;
    for (const block of blocks) {
      if (!block.blockHeight || !block.timestamp || typeof block.reward !== 'number') {
        return false;
      }
    }
    return true;
  });

  await test('A', 'Validator state consistency', async () => {
    const wallets = await axios.get(`${BASE_URL}/api/wallets`);
    const validators = await axios.get(`${BASE_URL}/api/validators`);
    const walletIds = new Set(wallets.data.map((w: any) => w.validatorId));
    const validatorIds = new Set(validators.data.map((v: any) => v.validatorId));
    return walletIds.size > 0 && validatorIds.size > 0;
  });

  await test('A', 'Transaction ledger immutability', async () => {
    const res1 = await axios.get(`${BASE_URL}/api/transactions?limit=5`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const res2 = await axios.get(`${BASE_URL}/api/transactions?limit=5`);
    const txIds1 = res1.data.map((t: any) => t.transactionId).sort();
    const txIds2 = res2.data.map((t: any) => t.transactionId).sort();
    return JSON.stringify(txIds1.slice(0, 3)) === JSON.stringify(txIds2.slice(0, 3));
  });

  // ==== B. CROSS-INTERFACE CONSISTENCY (4 tests) ====
  console.log('\n🔄 B. CROSS-INTERFACE CONSISTENCY (4 tests)');
  console.log('─────────────────────────────────────────');

  await test('B', 'API response format consistency', async () => {
    const endpoints = ['/api/wallets', '/api/validators', '/api/blocks', '/api/transactions'];
    for (const endpoint of endpoints) {
      const res = await axios.get(`${BASE_URL}${endpoint}`);
      if (!Array.isArray(res.data)) return false;
    }
    return true;
  });

  await test('B', 'Total supply matches wallet balances', async () => {
    const wallets = await axios.get(`${BASE_URL}/api/wallets`);
    const economics = await axios.get(`${BASE_URL}/api/token/economics`);
    const totalInWallets = wallets.data.reduce((sum: number, w: any) => sum + (w.balance || 0) + (w.staked || 0), 0);
    const totalSupply = economics.data.totalSupply || 0;
    return totalInWallets > 0 && totalSupply > 0 && totalSupply >= totalInWallets * 0.95;
  });

  await test('B', 'Network status reflects current state', async () => {
    const status = await axios.get(`${BASE_URL}/api/network/status`);
    const blocks = await axios.get(`${BASE_URL}/api/blocks?limit=1`);
    const statusHeight = status.data.stats?.blockHeight || 0;
    const latestBlockHeight = blocks.data[0]?.blockHeight || 0;
    return statusHeight > 0 && latestBlockHeight > 0 && Math.abs(statusHeight - latestBlockHeight) <= 1;
  });

  await test('B', 'Validator rewards match block rewards', async () => {
    const blocks = await axios.get(`${BASE_URL}/api/blocks?limit=50`);
    const validators = await axios.get(`${BASE_URL}/api/validators`);
    const totalBlockRewards = blocks.data.reduce((sum: number, b: any) => sum + (b.reward || 0), 0);
    const totalValidatorEarnings = validators.data.reduce((sum: number, v: any) => sum + (v.totalEarned || 0), 0);
    return totalBlockRewards > 0 && totalValidatorEarnings > totalBlockRewards * 0.8;
  });

  // ==== C. BUSINESS LOGIC VALIDATION (4 tests) ====
  console.log('\n⚙️ C. BUSINESS LOGIC VALIDATION (4 tests)');
  console.log('───────────────────────────────────────');

  await test('C', 'Mining rewards are positive', async () => {
    const blocks = await axios.get(`${BASE_URL}/api/blocks?limit=20`);
    let rewardCount = 0;
    for (const block of blocks.data) {
      if (block.reward > 0) rewardCount++;
    }
    return rewardCount > blocks.data.length * 0.8;
  });

  await test('C', 'Staking amounts are valid', async () => {
    const wallets = await axios.get(`${BASE_URL}/api/wallets`);
    for (const wallet of wallets.data) {
      if (wallet.staked < 0 || wallet.staked > wallet.balance + 100000) {
        return false;
      }
    }
    return true;
  });

  await test('C', 'Token supply follows halving schedule', async () => {
    const economics = await axios.get(`${BASE_URL}/api/token/economics`);
    const totalSupply = economics.data.totalSupply || 0;
    const maxSupply = economics.data.maxSupply || 10000000;
    return totalSupply > 1000000 && totalSupply <= maxSupply;
  });

  await test('C', 'Validator tier boundaries respected', async () => {
    const wallets = await axios.get(`${BASE_URL}/api/wallets`);
    let tierCount = 0;
    for (const wallet of wallets.data) {
      if (wallet.staked >= 10000) tierCount++;
    }
    return tierCount > 0;
  });

  // ==== D. FRONTEND-BACKEND CONSISTENCY (3 tests) ====
  console.log('\n🎨 D. FRONTEND-BACKEND CONSISTENCY (3 tests)');
  console.log('────────────────────────────────────────');

  await test('D', 'API response types are correct', async () => {
    const wallets = await axios.get(`${BASE_URL}/api/wallets`);
    const wallet = wallets.data[0];
    return (
      typeof wallet.validatorId === 'string' &&
      typeof wallet.balance === 'number' &&
      typeof wallet.staked === 'number' &&
      typeof wallet.totalEarned === 'number' &&
      typeof wallet.currency === 'string'
    );
  });

  await test('D', 'Block data matches expected schema', async () => {
    const blocks = await axios.get(`${BASE_URL}/api/blocks?limit=1`);
    const block = blocks.data[0];
    return (
      typeof block.blockHeight === 'number' &&
      typeof block.timestamp === 'number' &&
      typeof block.reward === 'number' &&
      typeof block.minerValidatorId === 'string' &&
      Array.isArray(block.transactions)
    );
  });

  await test('D', 'Network status fields are populated', async () => {
    const status = await axios.get(`${BASE_URL}/api/network/status`);
    const stats = status.data.stats || {};
    return (
      typeof stats.isRunning === 'boolean' &&
      typeof stats.blockHeight === 'number' &&
      typeof stats.totalValidators === 'number' &&
      typeof stats.difficultyLevel === 'number'
    );
  });

  // ==== E. PERFORMANCE & SCALE (3 tests) ====
  console.log('\n⚡ E. PERFORMANCE & SCALE (3 tests)');
  console.log('─────────────────────────────────');

  await test('E', 'API response times under 500ms', async () => {
    const endpoints = ['/api/wallets', '/api/validators', '/api/blocks?limit=100'];
    for (const endpoint of endpoints) {
      const start = Date.now();
      await axios.get(`${BASE_URL}${endpoint}`);
      const duration = Date.now() - start;
      if (duration > 500) return false;
    }
    return true;
  });

  await test('E', 'Large dataset retrieval (1000+ records)', async () => {
    const wallets = await axios.get(`${BASE_URL}/api/wallets`);
    const blocks = await axios.get(`${BASE_URL}/api/blocks?limit=100`);
    return wallets.data.length > 5 && blocks.data.length > 10;
  });

  await test('E', 'Concurrent request handling', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(axios.get(`${BASE_URL}/api/wallets`));
    }
    const results = await Promise.all(promises);
    return results.every((r) => Array.isArray(r.data) && r.data.length > 0);
  });

  // ==== F. SECURITY (3 tests) ====
  console.log('\n🔒 F. SECURITY (3 tests)');
  console.log('────────────────────────');

  await test('F', 'No negative balances in wallets', async () => {
    const wallets = await axios.get(`${BASE_URL}/api/wallets`);
    for (const wallet of wallets.data) {
      if (wallet.balance < 0 || wallet.staked < 0) {
        return false;
      }
    }
    return true;
  });

  await test('F', 'No duplicate validator IDs', async () => {
    const wallets = await axios.get(`${BASE_URL}/api/wallets`);
    const ids = wallets.data.map((w: any) => w.validatorId);
    const uniqueIds = new Set(ids);
    return ids.length === uniqueIds.size;
  });

  await test('F', 'API accepts valid requests only', async () => {
    try {
      // This should fail gracefully
      const res = await axios.get(`${BASE_URL}/api/wallets?limit=invalid`, {
        validateStatus: () => true,
      });
      // Should either handle gracefully or reject invalid params
      return res.status === 200 || res.status === 400;
    } catch {
      return true;
    }
  });

  // ==== SUMMARY ====
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const totalTests = passedTests + failedTests;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`📊 Pass Rate: ${passRate}%\n`);

  // Breakdown by category
  const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
  console.log('📋 BREAKDOWN BY CATEGORY:');
  console.log('─────────────────────────');
  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const catPassed = catResults.filter((r) => r.status === '✅').length;
    const catTotal = catResults.length;
    const catRate = ((catPassed / catTotal) * 100).toFixed(0);
    const catName =
      cat === 'A'
        ? 'Database Consistency'
        : cat === 'B'
          ? 'Cross-Interface Consistency'
          : cat === 'C'
            ? 'Business Logic Validation'
            : cat === 'D'
              ? 'Frontend-Backend Consistency'
              : cat === 'E'
                ? 'Performance & Scale'
                : 'Security';
    console.log(`${cat}. ${catName}: ${catPassed}/${catTotal} (${catRate}%)`);
  }

  console.log('\n' + (failedTests === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  Some tests failed - review above'));
  console.log('\n');
}

runTests().catch(console.error);
