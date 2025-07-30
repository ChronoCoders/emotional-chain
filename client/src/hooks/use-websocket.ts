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

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname;
    const port = window.location.port || (protocol === "wss:" ? "443" : "80");
    const wsUrl = `${protocol}//${hostname}${port ? `:${port}` : ""}/ws`;
    
    const connect = () => {
      try {
        console.log(`🔗 Attempting WebSocket connection to: ${wsUrl}`);
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          console.log('WebSocket connected to EmotionalChain');
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            setLastMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          
          // Only reconnect if it wasn't closed intentionally (code 1000)
          if (event.code !== 1000) {
            setTimeout(() => {
              if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
                connect();
              }
            }, 5000); // Increased to 5 seconds to reduce spam
          }
        };

        socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
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
