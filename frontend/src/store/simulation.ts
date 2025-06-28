import { create } from 'zustand';
import { TrafficConfig, SessionStats, LiveSessionUpdate, LogEntry, AnalyticsData } from '@/types';

interface SimulationState {
  // Current simulation
  currentSimulation: {
    id: string | null;
    config: TrafficConfig | null;
    status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
    startedAt: Date | null;
    completedAt: Date | null;
  };

  // Real-time data
  stats: SessionStats;
  liveUpdates: LiveSessionUpdate[];
  logs: LogEntry[];
  analytics: AnalyticsData | null;

  // UI state
  isConfiguring: boolean;
  isMonitoring: boolean;
  selectedTab: string;

  // Actions
  setCurrentSimulation: (simulation: Partial<SimulationState['currentSimulation']>) => void;
  updateStats: (stats: Partial<SessionStats>) => void;
  addLiveUpdate: (update: LiveSessionUpdate) => void;
  addLog: (log: LogEntry) => void;
  setAnalytics: (analytics: AnalyticsData) => void;
  clearLiveData: () => void;
  setConfiguring: (isConfiguring: boolean) => void;
  setMonitoring: (isMonitoring: boolean) => void;
  setSelectedTab: (tab: string) => void;
  reset: () => void;
}

const initialStats: SessionStats = {
  total: 0,
  successful: 0,
  failed: 0,
  completed: 0,
  total_duration: 0,
  average_duration: 0,
  success_rate: 0,
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  currentSimulation: {
    id: null,
    config: null,
    status: 'idle',
    startedAt: null,
    completedAt: null,
  },

  stats: initialStats,
  liveUpdates: [],
  logs: [],
  analytics: null,

  isConfiguring: false,
  isMonitoring: false,
  selectedTab: 'overview',

  setCurrentSimulation: (simulation) =>
    set((state) => ({
      currentSimulation: { ...state.currentSimulation, ...simulation },
    })),

  updateStats: (newStats) =>
    set((state) => {
      const updatedStats = { ...state.stats, ...newStats };
      
      // Calculate derived values
      if (updatedStats.completed > 0) {
        updatedStats.average_duration = updatedStats.total_duration / updatedStats.successful;
        updatedStats.success_rate = (updatedStats.successful / updatedStats.completed) * 100;
      }

      return { stats: updatedStats };
    }),

  addLiveUpdate: (update) =>
    set((state) => {
      const newUpdates = [update, ...state.liveUpdates].slice(0, 100); // Keep last 100 updates
      return { liveUpdates: newUpdates };
    }),

  addLog: (log) =>
    set((state) => {
      const newLogs = [log, ...state.logs].slice(0, 500); // Keep last 500 logs
      return { logs: newLogs };
    }),

  setAnalytics: (analytics) => set({ analytics }),

  clearLiveData: () =>
    set({
      liveUpdates: [],
      logs: [],
      stats: initialStats,
    }),

  setConfiguring: (isConfiguring) => set({ isConfiguring }),
  setMonitoring: (isMonitoring) => set({ isMonitoring }),
  setSelectedTab: (selectedTab) => set({ selectedTab }),

  reset: () =>
    set({
      currentSimulation: {
        id: null,
        config: null,
        status: 'idle',
        startedAt: null,
        completedAt: null,
      },
      stats: initialStats,
      liveUpdates: [],
      logs: [],
      analytics: null,
      isConfiguring: false,
      isMonitoring: false,
      selectedTab: 'overview',
    }),
}));