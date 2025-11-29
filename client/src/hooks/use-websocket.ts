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
    const config = await response.json();
    console.log('Loaded WebSocket config from API:', config);
    return config;
  } catch (error) {
    console.error('Failed to fetch WebSocket config, using defaults:', error);
    // Fallback configuration with safe defaults
    const defaultConfig = {
      heartbeatInterval: 30000,
      reconnectAttempts: 5,
      reconnectDelay: 2000,
      fallbackHost: 'localhost',
      fallbackPort: 5000,
      retryLimit: 10,
      exponentialBackoffEnabled: true,
      maxBackoffDelay: 30000,
    };
    console.log('Using default WebSocket config:', defaultConfig);
    return defaultConfig;
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
    
    console.log('WebSocket config loaded:', config);
    let isCleaningUp = false;
    const calculateBackoffDelay = (attempt: number): number => {
      if (!config.exponentialBackoffEnabled) {
        return config.reconnectDelay;
      }
      const exponentialDelay = Math.min(
        config.reconnectDelay * Math.pow(2, attempt),
        config.maxBackoffDelay
      );
      // Add jitter (±25%) using secure random
      const randomByte = crypto.getRandomValues(new Uint8Array(1))[0];
      const jitter = exponentialDelay * 0.25 * ((randomByte / 255) - 0.5);
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
      
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        let wsUrl: string;
        
        if (useFallback && config) {
          const port = config?.fallbackPort ?? 5000;
          const host = config?.fallbackHost ?? 'localhost';
          wsUrl = `${protocol}//${host}:${port}/ws`;
        } else {
          const hostname = window.location.hostname;
          const port = window.location.port;
          // For Replit domains, don't specify port - use same as current page  
          if (hostname.includes('.replit.dev') || hostname.includes('.repl.co') || hostname.includes('.replit.app')) {
            wsUrl = `${protocol}//${hostname}/ws`;
          } else if (hostname === 'localhost') {
            // For localhost development - use port 5000 (same as HTTP server)
            wsUrl = `${protocol}//localhost:5000/ws`;
          } else {
            // Default case - try same host and port
            const portPart = port ? `:${port}` : '';
            wsUrl = `${protocol}//${hostname}${portPart}/ws`;
          }
        }
        console.log('Attempting WebSocket connection to:', wsUrl);
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;
        socket.onopen = () => {
          console.log('WebSocket connected successfully to:', wsUrl);
          setIsConnected(true);
          retryCountRef.current = 0;
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
            // Don't treat parsing errors as connection failures
          }
        };
        socket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          setIsConnected(false);
          stopHeartbeat();
          if (isCleaningUp || event.code === 1000) {
            return;
          }
          // Only reconnect if we haven't exceeded retry limit
          if (retryCountRef.current < config.retryLimit) {
            const delay = calculateBackoffDelay(retryCountRef.current);
            retryCountRef.current++;
            console.log(`WebSocket reconnection attempt ${retryCountRef.current} in ${delay}ms`);
            setTimeout(() => {
              if (!isCleaningUp && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
                // Never use fallback - only retry main connection
                connectWithFallback(false);
              }
            }, delay);
          } else {
            console.warn('WebSocket: Maximum retry attempts reached, giving up');
          }
        };
        socket.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          console.error('Failed URL was:', wsUrl);
          setIsConnected(false);
          stopHeartbeat();
        };
      } catch (error) {
        console.warn('WebSocket connection failed:', error);
        if (retryCountRef.current < config.retryLimit && !useFallback) {
          const delay = calculateBackoffDelay(retryCountRef.current);
          retryCountRef.current++;
          // Only retry without fallback for main connection
          setTimeout(() => connectWithFallback(false), delay);
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
