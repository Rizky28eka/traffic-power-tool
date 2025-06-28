import { ApiResponse, PaginatedResponse, TrafficConfig, Preset, SimulationRun, AnalyticsData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Configuration endpoints
  async validateConfig(config: Partial<TrafficConfig>): Promise<ApiResponse<boolean>> {
    return this.request('/api/config/validate', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getDefaultConfig(): Promise<ApiResponse<TrafficConfig>> {
    return this.request('/api/config/default');
  }

  // Simulation endpoints
  async startSimulation(config: TrafficConfig): Promise<ApiResponse<{ simulation_id: string }>> {
    return this.request('/api/simulation/start', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async stopSimulation(simulationId: string): Promise<ApiResponse<boolean>> {
    return this.request(`/api/simulation/${simulationId}/stop`, {
      method: 'POST',
    });
  }

  async getSimulationStatus(simulationId: string): Promise<ApiResponse<SimulationRun>> {
    return this.request(`/api/simulation/${simulationId}/status`);
  }

  async getSimulationLogs(simulationId: string): Promise<ApiResponse<string[]>> {
    return this.request(`/api/simulation/${simulationId}/logs`);
  }

  // Analytics endpoints
  async getAnalytics(simulationId: string): Promise<ApiResponse<AnalyticsData>> {
    return this.request(`/api/analytics/${simulationId}`);
  }

  async exportAnalytics(
    simulationId: string,
    format: 'csv' | 'excel' | 'json'
  ): Promise<ApiResponse<{ download_url: string }>> {
    return this.request(`/api/analytics/${simulationId}/export?format=${format}`);
  }

  // Presets endpoints
  async getPresets(): Promise<PaginatedResponse<Preset>> {
    return this.request('/api/presets');
  }

  async createPreset(preset: Omit<Preset, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Preset>> {
    return this.request('/api/presets', {
      method: 'POST',
      body: JSON.stringify(preset),
    });
  }

  async updatePreset(id: string, preset: Partial<Preset>): Promise<ApiResponse<Preset>> {
    return this.request(`/api/presets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(preset),
    });
  }

  async deletePreset(id: string): Promise<ApiResponse<boolean>> {
    return this.request(`/api/presets/${id}`, {
      method: 'DELETE',
    });
  }

  // History endpoints
  async getSimulationHistory(): Promise<PaginatedResponse<SimulationRun>> {
    return this.request('/api/history');
  }

  async getSimulationById(id: string): Promise<ApiResponse<SimulationRun>> {
    return this.request(`/api/history/${id}`);
  }

  async deleteSimulation(id: string): Promise<ApiResponse<boolean>> {
    return this.request(`/api/history/${id}`, {
      method: 'DELETE',
    });
  }

  // Personas endpoints
  async getDefaultPersonas(): Promise<ApiResponse<any[]>> {
    return this.request('/api/personas/default');
  }

  async generateRandomPersonas(count: number, countries?: string[]): Promise<ApiResponse<any[]>> {
    return this.request('/api/personas/generate', {
      method: 'POST',
      body: JSON.stringify({ count, countries }),
    });
  }

  // System endpoints
  async getSystemInfo(): Promise<ApiResponse<any>> {
    return this.request('/api/system/info');
  }

  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request('/api/health');
  }
}

export const apiClient = new ApiClient();
export default apiClient;