import { useState, useEffect } from 'react';

type WebSocketMessage = {
  type: string;
  data: any;
};

type WebSocketEventHandler = (data: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private handlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private isConnecting = false;
  private currentEndpoint: 'transactions' | 'wallet' | 'goals' | null = null;

  constructor(url: string) {
    this.url = url;
  }

  setToken(token: string) {
    this.token = token;
    if (this.ws?.readyState === WebSocket.OPEN && this.currentEndpoint) {
      this.disconnect();
      this.connect(this.currentEndpoint);
    }
  }

  connect(endpoint: 'transactions' | 'wallet' | 'goals') {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.currentEndpoint = endpoint;
    const wsUrl = `${this.url}/ws/${endpoint}/`;
    
    if (this.token) {
      // Append token as query parameter for authentication
      const url = new URL(wsUrl);
      url.searchParams.append('token', this.token);
      this.ws = new WebSocket(url.toString());
    } else {
      this.ws = new WebSocket(wsUrl);
    }

    this.ws.onopen = () => {
      console.log(`WebSocket connected to ${endpoint}`);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        const handlers = this.handlers.get(message.type);
        if (handlers) {
          handlers.forEach(handler => handler(message.data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error(`WebSocket error (${endpoint}):`, error);
      this.isConnecting = false;
      // Don't auto-reconnect on error to prevent infinite loops
      this.ws?.close();
      this.ws = null;
    };

    this.ws.onclose = () => {
      console.log(`WebSocket disconnected from ${endpoint}`);
      this.isConnecting = false;
      this.ws = null;
      
      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Reconnecting to ${endpoint} (attempt ${this.reconnectAttempts})...`);
        setTimeout(() => this.connect(endpoint), this.reconnectDelay);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.currentEndpoint = null;
  }

  on(eventType: string, handler: WebSocketEventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  off(eventType: string, handler: WebSocketEventHandler) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }
}

// Create singleton instances for each endpoint
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export const transactionsWS = new WebSocketManager(WS_URL);
export const walletWS = new WebSocketManager(WS_URL);
export const goalsWS = new WebSocketManager(WS_URL);

// React hook for WebSocket connections
export function useWebSocket(endpoint: 'transactions' | 'wallet' | 'goals') {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsManager = endpoint === 'transactions' ? transactionsWS : 
                      endpoint === 'wallet' ? walletWS : goalsWS;
    
    const token = localStorage.getItem('access_token');
    if (token) {
      wsManager.setToken(token);
      wsManager.connect(endpoint);
      setIsConnected(true);
    }

    return () => {
      wsManager.disconnect();
      setIsConnected(false);
    };
  }, [endpoint]);

  const subscribe = (eventType: string, handler: WebSocketEventHandler) => {
    const wsManager = endpoint === 'transactions' ? transactionsWS : 
                      endpoint === 'wallet' ? walletWS : goalsWS;
    wsManager.on(eventType, handler);
    
    return () => {
      wsManager.off(eventType, handler);
    };
  };

  return { isConnected, subscribe };
}
