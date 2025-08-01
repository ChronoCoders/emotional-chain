import { EventEmitter } from 'eventemitter3';
import { io, Socket } from 'socket.io-client';
import { CONFIG } from '../shared/config';
/**
 * WebSocketSDK - Real-time WebSocket connection management
 * 
 * @example
 * ```typescript
 * const ws = new WebSocketSDK({
 *   endpoint: 'wss://mainnet.emotionalchain.io/ws',
 *   apiKey: 'your-api-key'
 * });
 * 
 * await ws.connect();
 * ws.subscribe('consensusRound');
 * ws.on('consensusRound', (data) => console.log(data));
 * ```
 */
export interface WebSocketConfig {
  endpoint: string;
  apiKey?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  timeout?: number;
  pingInterval?: number;
  pongTimeout?: number;
}
export interface Subscription {
  id: string;
  type: string;
  filters?: Record<string, any>;
  active: boolean;
  subscribedAt: number;
}
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  subscription?: string;
}
export class WebSocketSDK extends EventEmitter {
  private config: WebSocketConfig;
  private socket?: Socket;
  private subscriptions = new Map<string, Subscription>();
  private messageQueue: any[] = [];
  private connected = false;
  private connecting = false;
  private reconnectTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;
  private connectionAttempts = 0;
  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnectAttempts: CONFIG.network.protocols.websocket.reconnectAttempts,
      reconnectDelay: CONFIG.network.protocols.websocket.reconnectDelay,
      timeout: CONFIG.network.timeouts.websocket,
      pingInterval: CONFIG.network.protocols.websocket.heartbeatInterval,
      pongTimeout: CONFIG.network.timeouts.connection / 2,
      ...config
    };
  }
  // Connection management
  async connect(): Promise<void> {
    if (this.connected || this.connecting) {
      return;
    }
    this.connecting = true;
    try {
      await this.establishConnection();
      this.connected = true;
      this.connecting = false;
      this.connectionAttempts = 0;
      this.emit('connected');
      // Process queued messages
      this.processMessageQueue();
      // Restore subscriptions
      this.restoreSubscriptions();
      // Start ping/pong
      this.startPing();
    } catch (error) {
      this.connecting = false;
      this.connected = false;
      this.emit('error', error);
      // Attempt reconnection
      this.scheduleReconnect();
      throw error;
    }
  }
  private async establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socketOptions: any = {
        transports: ['websocket', 'polling'],
        timeout: this.config.timeout,
        forceNew: true
      };
      // Add authentication if API key provided
      if (this.config.apiKey) {
        socketOptions.auth = {
          apiKey: this.config.apiKey
        };
      }
      this.socket = io(this.config.endpoint, socketOptions);
      const connectTimeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.timeout);
      this.socket.on('connect', () => {
        clearTimeout(connectTimeout);
        this.setupEventHandlers();
        resolve();
      });
      this.socket.on('connect_error', (error) => {
        clearTimeout(connectTimeout);
        reject(error);
      });
    });
  }
  private setupEventHandlers(): void {
    if (!this.socket) return;
    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.stopPing();
      this.emit('disconnected', reason);
      // Attempt reconnection unless manually disconnected
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });
    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
    this.socket.on('pong', () => {
      this.emit('pong');
    });
    // Handle incoming messages
    this.socket.on('message', (message: WebSocketMessage) => {
      this.handleMessage(message);
    });
    // Handle specific event types
    this.socket.on('consensusRound', (data) => {
      this.emit('consensusRound', data);
    });
    this.socket.on('newBlock', (data) => {
      this.emit('newBlock', data);
    });
    this.socket.on('transaction', (data) => {
      this.emit('transaction', data);
    });
    this.socket.on('validatorUpdate', (data) => {
      this.emit('validatorUpdate', data);
    });
    this.socket.on('biometricUpdate', (data) => {
      this.emit('biometricUpdate', data);
    });
    this.socket.on('networkAlert', (data) => {
      this.emit('networkAlert', data);
    });
    this.socket.on('subscriptionConfirmed', (data) => {
      const subscription = this.subscriptions.get(data.id);
      if (subscription) {
        subscription.active = true;
        this.emit('subscriptionConfirmed', subscription);
      }
    });
    this.socket.on('subscriptionError', (data) => {
      this.emit('subscriptionError', data);
    });
  }
  private handleMessage(message: WebSocketMessage): void {
    this.emit('message', message);
    // Route to specific handlers based on type
    if (message.type) {
      this.emit(message.type, message.data);
    }
    // Route to subscription handlers
    if (message.subscription) {
      this.emit(`subscription:${message.subscription}`, message.data);
    }
  }
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.stopPing();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
    this.connected = false;
    this.connecting = false;
    this.connectionAttempts = 0;
    // Clear subscriptions
    this.subscriptions.clear();
    this.emit('disconnected', 'manual');
  }
  // Reconnection logic
  private scheduleReconnect(): void {
    if (this.connectionAttempts >= (this.config.reconnectAttempts || 5)) {
      this.emit('reconnectFailed');
      return;
    }
    const delay = this.config.reconnectDelay! * Math.pow(2, this.connectionAttempts); // Exponential backoff
    this.connectionAttempts++;
    this.emit('reconnecting', {
      attempt: this.connectionAttempts,
      delay
    });
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        this.emit('reconnectError', error);
      });
    }, delay);
  }
  // Ping/Pong for connection health
  private startPing(): void {
    if (!this.config.pingInterval) return;
    this.pingTimer = setInterval(() => {
      if (this.connected && this.socket) {
        this.socket.emit('ping');
      }
    }, this.config.pingInterval);
  }
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
  }
  // Message handling
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }
  private sendMessage(message: any): void {
    if (!this.connected || !this.socket) {
      this.messageQueue.push(message);
      return;
    }
    this.socket.emit('message', message);
  }
  // Subscription management
  async subscribe(type: string, filters?: Record<string, any>): Promise<string> {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: Subscription = {
      id: subscriptionId,
      type,
      filters,
      active: false,
      subscribedAt: Date.now()
    };
    this.subscriptions.set(subscriptionId, subscription);
    const subscribeMessage = {
      action: 'subscribe',
      id: subscriptionId,
      type,
      filters
    };
    this.sendMessage(subscribeMessage);
    return subscriptionId;
  }
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return;
    }
    const unsubscribeMessage = {
      action: 'unsubscribe',
      id: subscriptionId
    };
    this.sendMessage(unsubscribeMessage);
    this.subscriptions.delete(subscriptionId);
    this.emit('unsubscribed', subscriptionId);
  }
  async unsubscribeAll(): Promise<void> {
    const subscriptionIds = Array.from(this.subscriptions.keys());
    for (const id of subscriptionIds) {
      await this.unsubscribe(id);
    }
  }
  private restoreSubscriptions(): void {
    for (const subscription of this.subscriptions.values()) {
      const subscribeMessage = {
        action: 'subscribe',
        id: subscription.id,
        type: subscription.type,
        filters: subscription.filters
      };
      this.sendMessage(subscribeMessage);
    }
  }
  // Convenience subscription methods
  async subscribeToConsensusRounds(): Promise<string> {
    return this.subscribe('consensusRound');
  }
  async subscribeToBlocks(): Promise<string> {
    return this.subscribe('newBlock');
  }
  async subscribeToTransactions(address?: string): Promise<string> {
    const filters = address ? { address } : undefined;
    return this.subscribe('transaction', filters);
  }
  async subscribeToValidatorUpdates(validatorId?: string): Promise<string> {
    const filters = validatorId ? { validatorId } : undefined;
    return this.subscribe('validatorUpdate', filters);
  }
  async subscribeToBiometricData(deviceId?: string): Promise<string> {
    const filters = deviceId ? { deviceId } : undefined;
    return this.subscribe('biometricUpdate', filters);
  }
  async subscribeToNetworkAlerts(severity?: 'info' | 'warning' | 'critical'): Promise<string> {
    const filters = severity ? { severity } : undefined;
    return this.subscribe('networkAlert', filters);
  }
  // Custom event handlers
  onMessage(callback: (message: WebSocketMessage) => void): () => void {
    this.on('message', callback);
    return () => this.off('message', callback);
  }
  onConsensusRound(callback: (data: any) => void): () => void {
    this.on('consensusRound', callback);
    return () => this.off('consensusRound', callback);
  }
  onNewBlock(callback: (block: any) => void): () => void {
    this.on('newBlock', callback);
    return () => this.off('newBlock', callback);
  }
  onTransaction(callback: (tx: any) => void): () => void {
    this.on('transaction', callback);
    return () => this.off('transaction', callback);
  }
  onValidatorUpdate(callback: (validator: any) => void): () => void {
    this.on('validatorUpdate', callback);
    return () => this.off('validatorUpdate', callback);
  }
  onBiometricUpdate(callback: (data: any) => void): () => void {
    this.on('biometricUpdate', callback);
    return () => this.off('biometricUpdate', callback);
  }
  onNetworkAlert(callback: (alert: any) => void): () => void {
    this.on('networkAlert', callback);
    return () => this.off('networkAlert', callback);
  }
  onConnected(callback: () => void): () => void {
    this.on('connected', callback);
    return () => this.off('connected', callback);
  }
  onDisconnected(callback: (reason: string) => void): () => void {
    this.on('disconnected', callback);
    return () => this.off('disconnected', callback);
  }
  onError(callback: (error: Error) => void): () => void {
    this.on('error', callback);
    return () => this.off('error', callback);
  }
  onReconnecting(callback: (data: { attempt: number; delay: number }) => void): () => void {
    this.on('reconnecting', callback);
    return () => this.off('reconnecting', callback);
  }
  // Utility methods
  isConnected(): boolean {
    return this.connected;
  }
  isConnecting(): boolean {
    return this.connecting;
  }
  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.connected) return 'connected';
    if (this.connecting) return 'connecting';
    return 'disconnected';
  }
  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }
  getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.active);
  }
  hasSubscription(type: string): boolean {
    return Array.from(this.subscriptions.values()).some(s => s.type === type);
  }
  getConnectionAttempts(): number {
    return this.connectionAttempts;
  }
  getQueueLength(): number {
    return this.messageQueue.length;
  }
  // Configuration
  updateConfig(updates: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  getConfig(): WebSocketConfig {
    return { ...this.config };
  }
  // Statistics
  getConnectionStats(): {
    connected: boolean;
    connecting: boolean;
    connectionAttempts: number;
    subscriptions: number;
    activeSubscriptions: number;
    queueLength: number;
    uptime: number;
  } {
    return {
      connected: this.connected,
      connecting: this.connecting,
      connectionAttempts: this.connectionAttempts,
      subscriptions: this.subscriptions.size,
      activeSubscriptions: this.getActiveSubscriptions().length,
      queueLength: this.messageQueue.length,
      uptime: this.connected ? Date.now() : 0
    };
  }
  // Helper methods
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // Cleanup
  async destroy(): Promise<void> {
    await this.disconnect();
    this.removeAllListeners();
  }
}