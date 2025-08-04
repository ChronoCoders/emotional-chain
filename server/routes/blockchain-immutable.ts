/**
 * Immutable Blockchain API Routes
 * Enterprise-grade blockchain operations with true immutability
 */

import { Router } from 'express';
import { emotionalChainService } from '../services/emotionalchain';
import { ImmutableBlockchainService } from '../blockchain/ImmutableBlockchainService';

const router = Router();
const immutableBlockchain = new ImmutableBlockchainService();

// Get blockchain state (balances from immutable source)
router.get('/state', async (req, res) => {
  try {
    const state = immutableBlockchain.getAllBalancesFromBlockchain();
    
    res.json({
      success: true,
      data: {
        balances: state,
        timestamp: new Date().toISOString(),
        source: 'blockchain_immutable'
      }
    });
  } catch (error) {
    console.error('BLOCKCHAIN IMMUTABILITY: Failed to get state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blockchain state'
    });
  }
});

// Get specific wallet balance from blockchain
router.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = immutableBlockchain.getBalanceFromBlockchain(address);
    
    res.json({
      success: true,
      data: {
        address,
        balance,
        currency: 'EMO',
        source: 'blockchain_immutable',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('BLOCKCHAIN IMMUTABILITY: Failed to get balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve balance from blockchain'
    });
  }
});

// Get transactions from blockchain (immutable source)
router.get('/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await immutableBlockchain.getTransactionsFromBlockchain(limit);
    
    res.json({
      success: true,
      data: {
        transactions: transactions.map(tx => ({
          id: tx.id,
          from: tx.from,
          to: tx.to,
          amount: tx.amount,
          fee: tx.fee || 0,
          timestamp: tx.timestamp,
          blockNumber: tx.blockNumber,
          emotionalProofHash: tx.emotionalProofHash
        })),
        count: transactions.length,
        source: 'blockchain_immutable',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('BLOCKCHAIN IMMUTABILITY: Failed to get transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transactions from blockchain'
    });
  }
});

// Create new transaction on blockchain
router.post('/transaction', async (req, res) => {
  try {
    const { from, to, amount, emotionalProofHash = '', signature = '' } = req.body;
    
    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: from, to, amount'
      });
    }
    
    const transaction = await immutableBlockchain.createTransaction(
      from,
      to,
      parseFloat(amount),
      emotionalProofHash,
      signature
    );
    
    console.log(`BLOCKCHAIN IMMUTABILITY: Transaction created ${transaction.id}`);
    
    res.json({
      success: true,
      data: {
        transaction: {
          id: transaction.id,
          from: transaction.from,
          to: transaction.to,
          amount: transaction.amount,
          fee: transaction.fee,
          timestamp: transaction.timestamp,
          emotionalProofHash: transaction.emotionalProofHash
        },
        message: 'Transaction created and added to pending pool'
      }
    });
  } catch (error) {
    console.error('BLOCKCHAIN IMMUTABILITY: Transaction creation failed:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Transaction creation failed'
    });
  }
});

// Verify blockchain integrity
router.get('/verify', async (req, res) => {
  try {
    const verification = await immutableBlockchain.verifyBlockchainIntegrity();
    
    res.json({
      success: true,
      data: {
        valid: verification.valid,
        errors: verification.errors,
        timestamp: new Date().toISOString(),
        message: verification.valid ? 'Blockchain integrity verified' : 'Blockchain integrity issues found'
      }
    });
  } catch (error) {
    console.error('BLOCKCHAIN IMMUTABILITY: Verification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify blockchain integrity'
    });
  }
});

// Get pending transactions count
router.get('/pending', async (req, res) => {
  try {
    const pendingCount = immutableBlockchain.getPendingTransactionCount();
    
    res.json({
      success: true,
      data: {
        pendingTransactions: pendingCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('BLOCKCHAIN IMMUTABILITY: Failed to get pending transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending transaction count'
    });
  }
});

export default router;