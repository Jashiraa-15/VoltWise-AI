import {
  BatteryOverview,
  TelemetryData,
  HealthStatus,
  CellAnalysis,
  CellCompatibilityResponse,
  DegradationData,
  TemperatureTrend,
  AnomalyListResponse,
  RiskScore,
  RULPrediction,
  SecondLifeAssessment,
  LifecycleRecommendation,
  HistoryListResponse,
  BatteryReport,
  SimulationStatus,
  ScenarioType,
} from '../types';

const RAW_ENV_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const BASE_URL = (() => {
  if (!RAW_ENV_URL) return '/api';
  const clean = RAW_ENV_URL.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
})();

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${res.status}: ${errorText}`);
  }
  return res.json();
}

export const api = {
  async getBatteries(): Promise<BatteryOverview[]> {
    const res = await fetch(`${BASE_URL}/batteries`);
    return handleResponse<BatteryOverview[]>(res);
  },

  async getBattery(id: string): Promise<BatteryOverview> {
    const res = await fetch(`${BASE_URL}/batteries/${id}`);
    return handleResponse<BatteryOverview>(res);
  },

  async getTelemetry(id: string): Promise<TelemetryData> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/telemetry`);
    return handleResponse<TelemetryData>(res);
  },

  async getCells(id: string): Promise<CellAnalysis> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/cells`);
    return handleResponse<CellAnalysis>(res);
  },

  async getCellCompatibility(id: string): Promise<CellCompatibilityResponse> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/cell-compatibility`);
    return handleResponse<CellCompatibilityResponse>(res);
  },

  async getAnomalies(id: string): Promise<AnomalyListResponse> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/anomalies`);
    return handleResponse<AnomalyListResponse>(res);
  },

  async getSOH(id: string): Promise<HealthStatus> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/soh`);
    return handleResponse<HealthStatus>(res);
  },

  async getHealth(id: string): Promise<HealthStatus> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/health`);
    return handleResponse<HealthStatus>(res);
  },

  async getTemperatureTrend(id: string): Promise<TemperatureTrend> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/temperature`);
    return handleResponse<TemperatureTrend>(res);
  },

  async getDegradation(id: string, eol_threshold: number = 80.0): Promise<DegradationData> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/degradation?eol_threshold=${eol_threshold}`);
    return handleResponse<DegradationData>(res);
  },

  async getRUL(id: string, eol_threshold: number = 80.0): Promise<RULPrediction> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/rul?eol_threshold=${eol_threshold}`);
    return handleResponse<RULPrediction>(res);
  },

  async getRisk(id: string): Promise<RiskScore> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/risk`);
    return handleResponse<RiskScore>(res);
  },

  async getSecondLife(id: string): Promise<SecondLifeAssessment> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/second-life`);
    return handleResponse<SecondLifeAssessment>(res);
  },

  async getLifecycle(id: string): Promise<LifecycleRecommendation> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/lifecycle`);
    return handleResponse<LifecycleRecommendation>(res);
  },

  async getHistory(
    id: string,
    params?: { search?: string; risk_filter?: string; page?: number; limit?: number }
  ): Promise<HistoryListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.risk_filter) query.append('risk_filter', params.risk_filter);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${BASE_URL}/batteries/${id}/history${queryString}`);
    return handleResponse<HistoryListResponse>(res);
  },

  async getReport(id: string): Promise<BatteryReport> {
    const res = await fetch(`${BASE_URL}/batteries/${id}/report`);
    return handleResponse<BatteryReport>(res);
  },

  getExportCsvUrl(id: string): string {
    return `${BASE_URL}/batteries/${id}/export/csv`;
  },

  async getSimulationStatus(): Promise<SimulationStatus> {
    const res = await fetch(`${BASE_URL}/simulation/status`);
    return handleResponse<SimulationStatus>(res);
  },

  async controlSimulation(params: {
    action?: 'start' | 'pause' | 'reset' | 'step';
    speed?: number;
    scenario?: ScenarioType | string;
    battery_id?: string;
  }): Promise<SimulationStatus> {
    const res = await fetch(`${BASE_URL}/simulation/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse<SimulationStatus>(res);
  },

  async sendHardwareTelemetry(payload: {
    battery_id: string;
    cell_voltages: number[];
    pack_voltage: number;
    current: number;
    temperature: number;
    ambient_temp?: number;
  }): Promise<TelemetryData> {
    const res = await fetch(`${BASE_URL}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<TelemetryData>(res);
  },

  async postHardwareTelemetry(payload: {
    battery_id: string;
    cell_voltages: number[];
    pack_voltage: number;
    current: number;
    temperature: number;
    ambient_temp?: number;
  }): Promise<TelemetryData> {
    return this.sendHardwareTelemetry(payload);
  },
};
