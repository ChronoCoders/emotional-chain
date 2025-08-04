/**
 * EmotionalChain WebSocket Reconnection Manager
 * Handles robust client-server reconnection with exponential backoff
 */

import { EventEmitter } from 'eventemitter3';
import WebSocket from 'ws';

export interface ReconnectionConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export interface ConnectionState {
  isConnected: boolean;
  retryCount: number;
  lastConnected: number;
  lastPing: number;
  latency: number;
}

export class WebSocketReconnectionManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: ReconnectionConfig;
  private state: ConnectionState;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private url: string;
  private protocols?: string[];

  constructor(
    url: string, 
    config: Partial<ReconnectionConfig> = {},
    protocols?: string[]
  ) {
    super();
    
    this.url = url;
    this.protocols = protocols;
    
    this.config = {
      maxRetries: 10,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      heartbeatInterval: 30000,
      connectionTimeout: 10000,
      ...config
    };

    this.state = {
      isConnected: false,
      retryCount: 0,
      lastConnected: 0,
      lastPing: 0,
      latency: 0
    };
  }

  /**
   * Establish WebSocket connection with automatic reconnection
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      await this.createConnection();
    } catch (error) {
      console.error('Initial connection failed:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Create new WebSocket connection
   */
  private async createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeout);

      try {
        this.ws = new WebSocket(this.url, this.protocols);
        
        this.ws.on('open', () => {
          clearTimeout(connectionTimeout);
          this.onConnectionOpen();
          resolve();
        });

        this.ws.on('message', (data) => {
          this.onMessage(data);
        });

        this.ws.on('close', (code, reason) => {
          clearTimeout(connectionTimeout);
          this.onConnectionClose(code, reason.toString());
        });

        this.ws.on('error', (error) => {
          clearTimeout(connectionTimeout);
          this.onConnectionError(error);
          reject(error);
        });

        this.ws.on('pong', () => {
          this.onPong();
        });

      } catch (error) {
        clearTimeout(connectionTimeout);
        reject(error);
      }
    });
  }

  /**
   * Handle successful connection
   */
  private onConnectionOpen(): void {
    this.state.isConnected = true;
    this.state.retryCount = 0;
    this.state.lastConnected = Date.now();
    
    this.startHeartbeat();
    this.emit('connected');
    
    console.log('WebSocket connected successfully');
  }

  /**
   * Handle connection close
   */
  private onConnectionClose(code: number, reason: string): void {
    this.state.isConnected = false;
    this.stopHeartbeat();
    
    this.emit('disconnected', { code, reason });
    
    console.log(`WebSocket connection closed: ${code} - ${reason}`);
    
    // Attempt reconnection unless explicitly closed
    if (code !== 1000) { // 1000 = normal closure
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection error
   */
  private onConnectionError(error: Error): void {
    this.emit('error', error);
    console.error('WebSocket error:', error);
  }

  /**
   * Handle incoming message
   */
  private onMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle internal protocol messages
      if (message.type === 'pong') {
        this.onPong();
        return;
      }
      
      this.emit('message', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.emit('message', data);
    }
  }

  /**
   * Handle pong response
   */
  private onPong(): void {
    const now = Date.now();
    this.state.latency = now - this.state.lastPing;
    this.emit('latency', this.state.latency);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.state.retryCount >= this.config.maxRetries) {
      this.emit('maxRetriesReached');
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.config.initialDelay * Math.pow(this.config.backoffFactor, this.state.retryCount),
      this.config.maxDelay
    );

    this.state.retryCount++;
    
    this.emit('reconnecting', { 
      attempt: this.state.retryCount, 
      delay,
      maxRetries: this.config.maxRetries 
    });

    console.log(`Reconnecting in ${delay}ms (attempt ${this.state.retryCount}/${this.config.maxRetries})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.createConnection();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.ping();
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Send ping to server
   */
  private ping(): void {
    if (!this.isConnected()) {
      return;
    }

    this.state.lastPing = Date.now();
    
    try {
      if (this.ws) {
        this.ws.ping();
      }
    } catch (error) {
      console.error('Failed to send ping:', error);
    }

    // Set timeout for pong response
    this.pingTimer = setTimeout(() => {
      console.warn('Ping timeout - connection may be dead');
      this.disconnect();
    }, 5000);
  }

  /**
   * Send message through WebSocket
   */
  send(data: any): boolean {
    if (!this.isConnected()) {
      console.warn('Cannot send message - not connected');
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws!.send(message);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  /**
   * Close connection
   */
  disconnect(): void {
    // Clear all timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.state.isConnected = false;
    this.emit('disconnected', { code: 1000, reason: 'Client disconnect' });
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.state.isConnected && 
           this.ws !== null && 
           this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Reset retry count (useful for manual reconnection)
   */
  resetRetryCount(): void {
    this.state.retryCount = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ReconnectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default WebSocketReconnectionManager;