import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { emotionalChainService } from "./services/emotionalchain";
import { advancedFeaturesService } from "./services/advanced-features";
import { dataIntegrityAudit } from "./services/data-integrity-audit";
import configRouter from "./routes/config";

export async function registerRoutes(app: Express): Promise<Server> {
  // Internal configuration management API (admin-only)
  app.use("/internal", configRouter);

  // EmotionalChain API routes
  app.get("/api/network/status", async (req, res) => {
    try {
      const status = await emotionalChainService.getNetworkStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/blocks", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const blocks = await emotionalChainService.getBlocks(limit);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/transactions", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/transactions/stats", async (req, res) => {
    try {
      const totalCount = await storage.getTotalTransactionCount();
      const totalVolume = await storage.getTotalTransactionVolume();
      res.json({
        totalTransactions: totalCount,
        totalVolume: totalVolume
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/transactions/volume", async (req, res) => {
    try {
      const volumeData = await emotionalChainService.getTransactionVolume();
      res.json(volumeData);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/validators", async (req, res) => {
    try {
      const validators = await emotionalChainService.getValidators();
      res.json(validators);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/wallets/database", async (req, res) => {
    try {
      const wallets = await storage.getWalletsFromDatabase();
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.get("/api/biometric/:validatorId", async (req, res) => {
    try {
      const { validatorId } = req.params;
      const data = await emotionalChainService.getBiometricData(validatorId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post("/api/commands", async (req, res) => {
    try {
      const { command, args = [] } = req.body;
      const result = await emotionalChainService.executeCommand(command, args);
      res.json({ result });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Mining endpoints
  app.post('/api/mining/start', async (req, res) => {
    try {
      const result = await emotionalChainService.startMining();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start mining' });
    }
  });

  app.post('/api/mining/stop', async (req, res) => {
    try {
      const result = await emotionalChainService.stopMining();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to stop mining' });
    }
  });

  app.get('/api/mining/status', async (req, res) => {
    try {
      const status = await emotionalChainService.getMiningStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get mining status' });
    }
  });

  app.get('/api/token/economics', async (req, res) => {
    try {
      const economics = await emotionalChainService.getTokenEconomics();
      res.json(economics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get token economics' });
    }
  });

  // Wallet and transfer endpoints
  app.get('/api/wallet/:validatorId', async (req, res) => {
    try {
      const { validatorId } = req.params;
      const balance = await emotionalChainService.getWalletBalance(validatorId);
      
      res.json({
        validatorId,
        balance,
        currency: 'EMO'
      });
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
  });

  app.post('/api/transfer', async (req, res) => {
    try {
      const { from, to, amount } = req.body;
      
      const success = await emotionalChainService.transferEMO(from, to, amount);
      
      if (success) {
        res.json({ 
          success: true, 
          message: `Successfully transferred ${amount} EMO from ${from} to ${to}` 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Transfer failed - insufficient balance' 
        });
      }
    } catch (error) {
      console.error('Error processing transfer:', error);
      res.status(500).json({ error: 'Failed to process transfer' });
    }
  });

  app.get('/api/wallets', async (req, res) => {
    try {
      // CRITICAL: Force sync with blockchain before returning data
      await emotionalChainService.syncWalletWithBlockchain();
      
      const wallets = await emotionalChainService.getAllWallets();
      
      const walletsArray = Array.from(wallets.entries()).map(([validatorId, balance]) => ({
        validatorId,
        balance,
        currency: 'EMO'
      }));
      
      res.json(walletsArray);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      res.status(500).json({ error: 'Failed to fetch wallets' });
    }
  });

  app.get('/api/wallet/status/:validatorId', async (req, res) => {
    try {
      const { validatorId } = req.params;
      const walletStatus = await emotionalChainService.getWalletStatus(validatorId);
      res.json(walletStatus);
    } catch (error) {
      console.error('Error fetching wallet status:', error);
      res.status(500).json({ error: 'Failed to fetch wallet status' });
    }
  });

  // Sync wallet with blockchain
  app.post('/api/wallet/sync', async (req, res) => {
    try {
      await emotionalChainService.syncWalletWithBlockchain();
      res.json({ success: true, message: 'Wallet synced with blockchain' });
    } catch (error) {
      console.error('Error syncing wallet:', error);
      res.status(500).json({ error: 'Failed to sync wallet' });
    }
  });

  app.get('/api/validators', async (req, res) => {
    try {
      const validators = await emotionalChainService.getValidators();
      res.json(validators);
    } catch (error) {
      console.error('Error fetching validators:', error);
      res.status(500).json({ error: 'Failed to fetch validators' });
    }
  });

  // ===== ADVANCED FEATURES API ENDPOINTS =====
  
  // Smart Contracts
  app.get('/api/smart-contracts', async (req, res) => {
    try {
      const contracts = await advancedFeaturesService.getAllSmartContracts();
      res.json(contracts);
    } catch (error) {
      console.error('Error fetching smart contracts:', error);
      res.status(500).json({ error: 'Failed to fetch smart contracts' });
    }
  });

  app.get('/api/smart-contracts/:address', async (req, res) => {
    try {
      const contract = await advancedFeaturesService.getSmartContract(req.params.address);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }
      res.json(contract);
    } catch (error) {
      console.error('Error fetching smart contract:', error);
      res.status(500).json({ error: 'Failed to fetch smart contract' });
    }
  });

  // Wellness Goals
  app.get('/api/wellness-goals/:participant', async (req, res) => {
    try {
      const goals = await advancedFeaturesService.getWellnessGoalsByParticipant(req.params.participant);
      res.json(goals);
    } catch (error) {
      console.error('Error fetching wellness goals:', error);
      res.status(500).json({ error: 'Failed to fetch wellness goals' });
    }
  });

  // Quantum Key Pairs
  app.get('/api/quantum-keys', async (req, res) => {
    try {
      const keyPairs = await advancedFeaturesService.getAllQuantumKeyPairs();
      res.json(keyPairs);
    } catch (error) {
      console.error('Error fetching quantum key pairs:', error);
      res.status(500).json({ error: 'Failed to fetch quantum key pairs' });
    }
  });

  app.get('/api/quantum-keys/:validatorId', async (req, res) => {
    try {
      const keyPair = await advancedFeaturesService.getQuantumKeyPair(req.params.validatorId);
      if (!keyPair) {
        return res.status(404).json({ error: 'Quantum key pair not found' });
      }
      res.json(keyPair);
    } catch (error) {
      console.error('Error fetching quantum key pair:', error);
      res.status(500).json({ error: 'Failed to fetch quantum key pair' });
    }
  });

  // Privacy Proofs
  app.get('/api/privacy-proofs', async (req, res) => {
    try {
      const proofType = req.query.type as string;
      const validatorId = req.query.validatorId as string;
      const proofs = await advancedFeaturesService.getPrivacyProofs(proofType, validatorId);
      res.json(proofs);
    } catch (error) {
      console.error('Error fetching privacy proofs:', error);
      res.status(500).json({ error: 'Failed to fetch privacy proofs' });
    }
  });

  // Cross-Chain Bridge Transactions
  app.get('/api/bridge-transactions', async (req, res) => {
    try {
      const transactions = await advancedFeaturesService.getAllBridgeTransactions();
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching bridge transactions:', error);
      res.status(500).json({ error: 'Failed to fetch bridge transactions' });
    }
  });

  app.get('/api/bridge-transactions/:bridgeId', async (req, res) => {
    try {
      const transaction = await advancedFeaturesService.getBridgeTransaction(req.params.bridgeId);
      if (!transaction) {
        return res.status(404).json({ error: 'Bridge transaction not found' });
      }
      res.json(transaction);
    } catch (error) {
      console.error('Error fetching bridge transaction:', error);
      res.status(500).json({ error: 'Failed to fetch bridge transaction' });
    }
  });

  // AI Models
  app.get('/api/ai-models', async (req, res) => {
    try {
      const models = await advancedFeaturesService.getAllAiModels();
      res.json(models);
    } catch (error) {
      console.error('Error fetching AI models:', error);
      res.status(500).json({ error: 'Failed to fetch AI models' });
    }
  });

  app.get('/api/ai-models/:modelType', async (req, res) => {
    try {
      const model = await advancedFeaturesService.getActiveAiModel(req.params.modelType);
      if (!model) {
        return res.status(404).json({ error: 'AI model not found' });
      }
      res.json(model);
    } catch (error) {
      console.error('Error fetching AI model:', error);
      res.status(500).json({ error: 'Failed to fetch AI model' });
    }
  });

  // Biometric Devices
  app.get('/api/biometric-devices/:validatorId', async (req, res) => {
    try {
      const devices = await advancedFeaturesService.getValidatorBiometricDevices(req.params.validatorId);
      res.json(devices);
    } catch (error) {
      console.error('Error fetching biometric devices:', error);
      res.status(500).json({ error: 'Failed to fetch biometric devices' });
    }
  });

  // Data Integrity Verification Endpoint
  app.get('/api/data-integrity', async (req, res) => {
    try {
      const integrity = await advancedFeaturesService.verifyDataIntegrity();
      res.json({
        status: 'verified',
        timestamp: new Date().toISOString(),
        counts: integrity,
        message: 'All advanced features backed by authentic database data'
      });
    } catch (error) {
      console.error('Error verifying data integrity:', error);
      res.status(500).json({ error: 'Failed to verify data integrity' });
    }
  });

  // Comprehensive data integrity audit endpoint
  app.get('/api/data-audit', async (req, res) => {
    try {
      const auditResults = await dataIntegrityAudit.performComprehensiveAudit();
      res.json(auditResults);
    } catch (error) {
      console.error('Error performing data audit:', error);
      res.status(500).json({ error: 'Failed to perform data audit' });
    }
  });

  // Data integrity audit report endpoint
  app.get('/api/data-audit/report', async (req, res) => {
    try {
      const report = await dataIntegrityAudit.generateDataIntegrityReport();
      res.set('Content-Type', 'text/plain');
      res.send(report);
    } catch (error) {
      console.error('Error generating audit report:', error);
      res.status(500).json({ error: 'Failed to generate audit report' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection established');
    
    // Send initial data
    ws.send(JSON.stringify({ 
      type: 'connection', 
      message: 'Connected to EmotionalChain Terminal',
      timestamp: new Date().toISOString()
    }));

    // Periodic updates
    const updateInterval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          const networkStatus = await emotionalChainService.getNetworkStatus();
          const latestBlocks = await emotionalChainService.getBlocks(3);
          const latestTransactions = await emotionalChainService.getTransactions(5);
          const validators = await emotionalChainService.getValidators();
          const tokenEconomics = await emotionalChainService.getTokenEconomics();

          ws.send(JSON.stringify({
            type: 'update',
            data: {
              networkStatus,
              latestBlocks,
              latestTransactions,
              validators,
              tokenEconomics,
              timestamp: new Date().toISOString()
            }
          }));
        } catch (error) {
          console.error('Error sending WebSocket update:', error);
        }
      }
    }, 2000); // Send updates every 2 seconds

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'command') {
          const result = await emotionalChainService.executeCommand(data.command, data.args);
          ws.send(JSON.stringify({
            type: 'command_result',
            command: data.command,
            result,
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString()
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clearInterval(updateInterval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(updateInterval);
    });
  });

  return httpServer;
}
