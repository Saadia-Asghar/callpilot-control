/**
 * WebSocket client for real-time updates
 * Connects to CallPilot backend WebSocket endpoint
 */

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptionId: string;
  private eventTypes: string[];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(subscriptionId: string, eventTypes: string[] = ['all']) {
    this.subscriptionId = subscriptionId;
    this.eventTypes = eventTypes;
    const typesParam = eventTypes.join(',');
    this.url = `${WS_URL}/ws/subscribe/${subscriptionId}?types=${typesParam}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected:', this.subscriptionId);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(data: any) {
    const eventType = data.type;
    const listeners = this.listeners.get(eventType) || this.listeners.get('all');
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data.data || data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  on(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export default WebSocketClient;
