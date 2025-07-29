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

          ws.send(JSON.stringify({
            type: 'update',
            data: {
              networkStatus,
              latestBlocks,
              latestTransactions,
              validators,
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
