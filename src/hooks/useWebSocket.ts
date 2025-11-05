import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  message_type: string;
  data: any;
}

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = ({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    console.log('=== WebSocket Connect Debug ===');
    console.log('Current WebSocket state:', wsRef.current?.readyState);
    console.log('URL to connect to:', url);
    
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('🔔 WebSocket already connected or connecting, skipping');
      return;
    }

    // Don't connect if URL is empty or invalid
    if (!url || url.trim() === '') {
      console.log('❌ WebSocket URL is empty, skipping connection');
      setConnectionStatus('disconnected');
      return;
    }

    // Clean up any existing connection
    if (wsRef.current) {
      console.log('🔔 Cleaning up existing WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
    }

    console.log('✅ Attempting WebSocket connection to:', url);
    try {
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('🔔 WebSocket connected successfully');
        console.log('🔔 WebSocket readyState:', wsRef.current?.readyState);
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        onOpen?.();
        
        // Start ping interval to keep connection alive
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('🔔 Sending ping to keep connection alive');
            wsRef.current.send(JSON.stringify({ message_type: 'ping' }));
          } else {
            console.log('🔔 WebSocket not open, clearing ping interval');
            clearInterval(pingInterval);
          }
        }, 30000); // Ping every 30 seconds (less frequent to reduce connection churn)
        
        // Store ping interval ID for cleanup
        (wsRef.current as any).pingInterval = pingInterval;
      };

      wsRef.current.onmessage = (event) => {
        try {
          console.log('🔔 Raw WebSocket message received:', event.data);
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('🔔 Parsed message:', message);
          console.log('🔔 WebSocket readyState when receiving message:', wsRef.current?.readyState);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔔 WebSocket disconnected:', event.code, event.reason, 'Clean close:', event.wasClean);
        console.log('🔔 WebSocket readyState on close:', wsRef.current?.readyState);
        console.log('🔔 shouldReconnectRef.current:', shouldReconnectRef.current);
        console.log('🔔 Stack trace for WebSocket close:');
        console.trace();
        
        // Clear ping interval
        if ((wsRef.current as any)?.pingInterval) {
          clearInterval((wsRef.current as any).pingInterval);
        }
        
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onClose?.();

        // Always attempt to reconnect unless it's a clean close with code 1000
        if (shouldReconnectRef.current && event.code !== 1000) {
          reconnectAttemptsRef.current++;
          console.log(`🔔 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔔 Reconnecting WebSocket...');
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionStatus('error');
          console.error('🔔 Max reconnection attempts reached');
          shouldReconnectRef.current = false; // Stop trying to reconnect
        } else if (event.wasClean && event.code === 1000) {
          console.log('🔔 WebSocket closed cleanly, not reconnecting');
          shouldReconnectRef.current = false; // Stop trying to reconnect
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    console.log('Manually disconnecting WebSocket');
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const resetReconnection = useCallback(() => {
    console.log('Resetting WebSocket reconnection state');
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔔 Sending WebSocket message:', message);
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket is not connected. Cannot send message.');
    return false;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    console.log('useWebSocket useEffect triggered with URL:', url);
    // Only connect if URL is valid and we're not already connected/connecting
    if (url && url.trim() !== '') {
      console.log('URL is valid, attempting connection');
      shouldReconnectRef.current = true;
      connect();
    } else {
      console.log('URL is invalid or empty, skipping connection');
    }
    
    return () => {
      // Clean up on unmount or URL change
      console.log('useWebSocket cleanup triggered');
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
    };
  }, [url]); // Remove connect and disconnect from dependencies

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    reconnect,
    disconnect,
    resetReconnection,
  };
};
