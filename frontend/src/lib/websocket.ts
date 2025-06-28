import { io, Socket } from 'socket.io-client';
import { LiveSessionUpdate, LogEntry } from '@/types';

export class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000'): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.socket?.connect();
      }, delay);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Simulation events
  onSimulationStart(callback: (data: { simulation_id: string }) => void): void {
    this.socket?.on('simulation_started', callback);
  }

  onSimulationComplete(callback: (data: { simulation_id: string; stats: any }) => void): void {
    this.socket?.on('simulation_completed', callback);
  }

  onSimulationError(callback: (data: { simulation_id: string; error: string }) => void): void {
    this.socket?.on('simulation_error', callback);
  }

  onSimulationStopped(callback: (data: { simulation_id: string }) => void): void {
    this.socket?.on('simulation_stopped', callback);
  }

  // Live updates
  onLiveUpdate(callback: (data: LiveSessionUpdate) => void): void {
    this.socket?.on('live_update', callback);
  }

  onLogUpdate(callback: (data: LogEntry) => void): void {
    this.socket?.on('log_update', callback);
  }

  onStatsUpdate(callback: (data: any) => void): void {
    this.socket?.on('stats_update', callback);
  }

  // Room management
  joinSimulation(simulationId: string): void {
    this.socket?.emit('join_simulation', { simulation_id: simulationId });
  }

  leaveSimulation(simulationId: string): void {
    this.socket?.emit('leave_simulation', { simulation_id: simulationId });
  }

  // Remove listeners
  off(event: string, callback?: Function): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  // Check connection status
  get connected(): boolean {
    return this.socket?.connected || false;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }
}

export const wsClient = new WebSocketClient();
export default wsClient;