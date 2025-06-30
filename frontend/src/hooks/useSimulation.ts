// src/hooks/useSimulation.ts
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface SimulationConfig {
  target_url: string;
  total_sessions: number;
  max_concurrent: number;
  headless?: boolean;
  returning_visitor_rate?: number;
  navigation_timeout?: number;
  max_retries_per_session?: number;
  mode_type?: string;
  network_type?: string;
  personas?: any[]; // Define a more specific type if needed
  device_distribution?: { [key: string]: number };
  country_distribution?: { [key: string]: number };
  age_distribution?: { [key: string]: number };
}

interface SimulationStats {
  sessions_completed?: number;
  sessions_failed?: number;
  total_requests?: number;
  average_response_time?: number;
  // Add more stats as needed
}

interface SimulationState {
  id: string | null;
  status: 'idle' | 'starting' | 'running' | 'stopping' | 'completed' | 'failed';
  config: SimulationConfig | null;
  stats: SimulationStats | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
}

interface UseSimulationResult {
  simulation: SimulationState;
  startSimulation: (config: SimulationConfig) => Promise<void>;
  stopSimulation: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  fetchSimulationStatus: (id: string) => Promise<void>;
}

export function useSimulation(): UseSimulationResult {
  const [simulation, setSimulation] = useState<SimulationState>({
    id: null,
    status: 'idle',
    config: null,
    stats: null,
    started_at: null,
    finished_at: null,
    error_message: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      toast.success('Connected to real-time updates!');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      toast.error('Disconnected from real-time updates.');
    });

    newSocket.on('simulation_started', (data: { simulation_id: string }) => {
      toast.success(`Simulation ${data.simulation_id} started!`);
      setSimulation((prev) => ({ ...prev, id: data.simulation_id, status: 'running' }));
      // Join the room for live updates
      newSocket.emit('join_simulation', { simulation_id: data.simulation_id });
    });

    newSocket.on('simulation_completed', (data: { simulation_id: string; stats: SimulationStats }) => {
      toast.success(`Simulation ${data.simulation_id} completed!`);
      setSimulation((prev) => ({
        ...prev,
        status: 'completed',
        stats: data.stats,
        finished_at: new Date().toISOString(),
      }));
    });

    newSocket.on('simulation_stopping', (data: { simulation_id: string }) => {
      toast(`Simulation ${data.simulation_id} is stopping...`);
      setSimulation((prev) => ({ ...prev, status: 'stopping' }));
    });

    newSocket.on('simulation_error', (data: { simulation_id: string; error: string }) => {
      toast.error(`Simulation ${data.simulation_id} failed: ${data.error}`);
      setSimulation((prev) => ({
        ...prev,
        status: 'failed',
        error_message: data.error,
        finished_at: new Date().toISOString(),
      }));
    });

    // Handle live stats updates (if backend emits them)
    newSocket.on('simulation_update', (data: { simulation_id: string; stats: SimulationStats }) => {
      setSimulation((prev) => {
        if (prev.id === data.simulation_id) {
          return { ...prev, stats: data.stats };
        }
        return prev;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [backendUrl]);

  const fetchSimulationStatus = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/simulation/${id}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSimulation((prev) => ({
          ...prev,
          id: data.data.id,
          status: data.data.status,
          stats: data.data.stats,
          started_at: data.data.created_at,
          finished_at: data.data.finished_at,
          error_message: data.data.error_message,
        }));
      } else {
        setError(data.error || 'Failed to fetch simulation status.');
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  const startSimulation = useCallback(async (config: SimulationConfig) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/simulation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setSimulation({
          id: data.data.simulation_id,
          status: 'starting',
          config,
          stats: null,
          started_at: new Date().toISOString(),
          finished_at: null,
          error_message: null,
        });
        toast.success(`Simulation request sent: ${data.data.simulation_id}`);
      } else {
        setError(data.error || 'Failed to start simulation.');
        toast.error(data.error || 'Failed to start simulation.');
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Error starting simulation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  const stopSimulation = useCallback(async () => {
    if (!simulation.id || (simulation.status !== 'running' && simulation.status !== 'stopping')) {
      toast.error('No active simulation to stop.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/simulation/${simulation.id}/stop`, {
        method: 'POST',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setSimulation((prev) => ({ ...prev, status: 'stopping' }));
        toast.success('Stop command sent.');
      } else {
        setError(data.error || 'Failed to stop simulation.');
        toast.error(data.error || 'Failed to stop simulation.');
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`Error stopping simulation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [simulation.id, simulation.status, backendUrl]);

  return { simulation, startSimulation, stopSimulation, isLoading, error, fetchSimulationStatus };
}
