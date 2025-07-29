import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { emotionalChainService } from "./services/emotionalchain";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await emotionalChainService.getTransactions(limit);
      res.json(transactions);
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
