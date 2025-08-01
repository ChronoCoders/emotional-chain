import { useEffect, useRef, useState } from 'react';
interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  command?: string;
  result?: string;
  timestamp: string;
}
interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  sendCommand: (command: string, args?: string[]) => void;
}
interface WebSocketConfig {
  heartbeatInterval: number;
  reconnectAttempts: number;
  reconnectDelay: number;
  fallbackHost: string;
  fallbackPort: number;
  retryLimit: number;
  exponentialBackoffEnabled: boolean;
  maxBackoffDelay: number;
}
// Get WebSocket configuration from API
async function getWebSocketConfig(): Promise<WebSocketConfig> {
  try {
    const response = await fetch('/api/config/websocket');
    if (!response.ok) {
      throw new Error(`Failed to fetch WebSocket config: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch WebSocket config, using defaults:', error);
    // Fallback configuration with safe defaults
    return {
      heartbeatInterval: 30000,
      reconnectAttempts: 5,
      reconnectDelay: 2000,
      fallbackHost: 'localhost',
      fallbackPort: 8080,
      retryLimit: 10,
      exponentialBackoffEnabled: true,
      maxBackoffDelay: 30000,
    };
  }
}
export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [config, setConfig] = useState<WebSocketConfig | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  // Load configuration on mount
  useEffect(() => {
    getWebSocketConfig().then(setConfig);
  }, []);
  useEffect(() => {
    if (!config) return;
    let isCleaningUp = false;
    const calculateBackoffDelay = (attempt: number): number => {
      if (!config.exponentialBackoffEnabled) {
        return config.reconnectDelay;
      }
      const exponentialDelay = Math.min(
        config.reconnectDelay * Math.pow(2, attempt),
        config.maxBackoffDelay
      );
      // Add jitter (±25%)
      const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
      return Math.floor(exponentialDelay + jitter);
    };
    const startHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      heartbeatRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
      }, config.heartbeatInterval);
    };
    const stopHeartbeat = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
    const connectWithFallback = (useFallback = false) => {
      if (isCleaningUp) return;
      // Validate configuration before attempting connection
      if (!config.fallbackHost || !config.fallbackPort) {
        console.error('🚨 WebSocket Configuration Error: Missing required fallback parameters');
        return;
      }
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        let wsUrl: string;
        if (useFallback) {
          wsUrl = `${protocol}//${config.fallbackHost}:${config.fallbackPort}/ws`;
        } else {
          const hostname = window.location.hostname;
          const port = window.location.port;
          wsUrl = port ? `${protocol}//${hostname}:${port}/ws` : `${protocol}//${hostname}/ws`;
        }
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;
        socket.onopen = () => {
          setIsConnected(true);
          retryCountRef.current = 0; // Reset retry count on successful connection
          startHeartbeat();
        };
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type !== 'pong') { // Don't log heartbeat responses
              setLastMessage(message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        socket.onclose = (event) => {
          setIsConnected(false);
          stopHeartbeat();
          if (isCleaningUp || event.code === 1000) {
            return; // Intentional close, don't reconnect
          }
          // Attempt reconnection with exponential backoff
          if (retryCountRef.current < config.retryLimit) {
            const delay = calculateBackoffDelay(retryCountRef.current);
            retryCountRef.current++;
            setTimeout(() => {
              if (!isCleaningUp && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
                // Try fallback if primary connection fails repeatedly
                const shouldUseFallback = retryCountRef.current > Math.floor(config.retryLimit / 2);
                connectWithFallback(shouldUseFallback);
              }
            }, delay);
          } else {
            console.error('🚨 WebSocket: Maximum retry attempts reached. Connection abandoned.');
          }
        };
        socket.onerror = (error) => {
          setIsConnected(false);
          stopHeartbeat();
        };
      } catch (error) {
        console.error('🚨 Error creating WebSocket connection:', error);
        if (retryCountRef.current < config.retryLimit) {
          const delay = calculateBackoffDelay(retryCountRef.current);
          retryCountRef.current++;
          setTimeout(() => connectWithFallback(true), delay);
        }
      }
    };
    // Initial connection attempt
    connectWithFallback();
    return () => {
      isCleaningUp = true;
      stopHeartbeat();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [config]);
  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected - message queued');
    }
  };
  const sendCommand = (command: string, args: string[] = []) => {
    sendMessage({
      type: 'command',
      command,
      args,
      timestamp: new Date().toISOString()
    });
  };
  return {
    isConnected,
    lastMessage,
    sendMessage,
    sendCommand
  };
}
