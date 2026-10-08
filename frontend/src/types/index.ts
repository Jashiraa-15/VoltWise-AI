export interface CellData {
  cell_number: number;
  voltage: number;
  temperature: number;
  internal_resistance_mohm: number;
  relative_health_pct: number;
  status: 'Normal' | 'Warning' | 'Critical';
}

export interface TelemetryData {
  id?: number;
  battery_id: string;
  timestamp: string;
  pack_voltage: number;
  current: number;
  power: number;
  energy_wh: number;
  temperature: number;
  soc: number;
  soh: number;
  cycle_count: number;
  cell_voltage_spread_mv: number;
  ambient_temp: number;
  is_simulated: boolean;
  cells: CellData[];
}

export interface BatteryOverview {
  battery_id: string;
  model_name: string;
  status: string;
  vehicle_id: string;
  chemistry: string;
  nominal_capacity_ah: number;
  pack_nominal_voltage: number;
  
  // Live KPI values
  soc: number;
  soh: number;
  rul_months: number;
  rul_cycles: number;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  temperature: number;
  cycle_count: number;
  
  pack_voltage: number;
  current: number;
  power: number;
  energy_wh: number;
  cell_voltage_spread_mv: number;
  health_status: string;
  primary_recommendation: string;
  anomaly_count: number;
}

export interface HealthStatus {
  battery_id: string;
  soh_pct: number;
  health_status: string;
  health_category: 'Good' | 'Fair' | 'Poor' | 'Critical' | string;
  current_capacity_ah: number;
  original_capacity_ah: number;
  capacity_retention_pct: number;
  degradation_rate_pct_per_100: number;
  avg_internal_resistance_mohm: number;
  total_cycles: number;
  cycle_life_rating: number;
  energy_wh: number;
  soh_explanation: string;
  assessment_label: string;
}

export interface CellAnalysis {
  battery_id: string;
  cells: CellData[];
  max_voltage: number;
  min_voltage: number;
  spread_mv: number;
  spread_status: 'Normal' | 'Warning' | 'Critical';
  avg_temperature: number;
  max_temperature_delta: number;
  imbalance_risk: string;
  diagnostic_summary: string;
  avg_resistance_mohm: number;
}

export interface CellPairwiseScore {
  cell_a: number;
  cell_b: number;
  match_score_pct: number;
  delta_voltage_mv: number;
  delta_resistance_mohm: number;
  delta_health_pct: number;
  status: 'Compatible' | 'Moderate Mismatch' | 'Incompatible' | string;
}

export interface CellCompatibilityGroup {
  group_name: string;
  cells: number[];
  compatibility_score_pct: number;
  recommended_usage: string;
  notes: string;
}

export interface CellCompatibilityResponse {
  battery_id: string;
  overall_pack_homogeneity_pct: number;
  pairwise_matrix: CellPairwiseScore[];
  compatible_groups: CellCompatibilityGroup[];
  assessment_summary: string;
  disclaimer: string;
}

export interface DegradationPoint {
  cycle: number;
  soh_pct: number;
  capacity_ah: number;
  is_predicted: boolean;
  confidence_lower?: number;
  confidence_upper?: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
}

export interface DegradationData {
  battery_id: string;
  current_cycle: number;
  current_soh: number;
  eol_threshold_pct: number;
  history: DegradationPoint[];
  prediction: DegradationPoint[];
}

export interface TemperaturePoint {
  timestamp: string;
  temperature: number;
  ambient_temp: number;
  is_abnormal: boolean;
  warning_threshold: number;
  critical_threshold: number;
}

export interface TemperatureTrend {
  battery_id: string;
  current_temp: number;
  ambient_temp: number;
  peak_temp_24h: number;
  min_temp_24h: number;
  trend: TemperaturePoint[];
}

export interface AnomalyItem {
  id: string;
  anomaly_type: string;
  severity: 'Warning' | 'Critical' | string;
  affected_cell: string;
  timestamp: string;
  measured_value: string;
  threshold: string;
  explanation: string;
}

export interface AnomalyListResponse {
  battery_id: string;
  anomalies: AnomalyItem[];
  total_count: number;
  highest_severity: 'None' | 'Warning' | 'Critical' | string;
}

export interface RiskContributionItem {
  factor: string;
  points: number;
  max_points: number;
  status: 'Normal' | 'Warning' | 'Critical' | string;
  measured_value: string;
  explanation: string;
}

export interface RiskScore {
  battery_id: string;
  overall_risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  thermal_risk_score: number;
  imbalance_risk_score: number;
  degradation_risk_score: number;
  voltage_sag_risk_score: number;
  anomaly_risk_score: number;
  breakdown_contributions: RiskContributionItem[];
  active_alerts: string[];
  mitigation_recommendation: string;
}

export interface RULPrediction {
  battery_id: string;
  current_soh: number;
  current_cycle: number;
  eol_threshold_pct: number;
  estimated_eol_cycle: number;
  remaining_cycles: number;
  estimated_remaining_months: number;
  confidence_score: number;
  estimated_eol_date: string;
  degradation_rate_pct_per_100: number;
  calculation_explanation: string;
  insufficient_data: boolean;
  methodology?: string;
  trajectory: DegradationPoint[];
}

export interface SecondLifeAssessment {
  battery_id: string;
  soh_pct: number;
  capacity_retention_pct: number;
  second_life_suitability_score: number;
  status: string;
  economic_value_remaining_usd: number;
  confidence_pct: number;
  reasons: string[];
  potential_applications: string[];
  disclaimer: string;
}

export interface LifecycleRecommendation {
  battery_id: string;
  soh_pct: number;
  current_cycle: number;
  primary_recommendation: 'CONTINUE USE' | 'SERVICE / MAINTENANCE' | 'SECOND-LIFE REPURPOSING' | 'SECOND-LIFE EVALUATION' | 'RECYCLE / RETIRE' | string;
  recommendation_category: string;
  safety_override_active: boolean;
  safety_override_reason?: string | null;
  repurposing_suitability_score: number;
  economic_value_remaining_usd: number;
  confidence_pct: number;
  key_rationales: string[];
  required_actions: string[];
  suitable_applications: string[];
  unsuitable_applications: string[];
  second_life_summary?: SecondLifeAssessment | null;
}

export interface HistoryRecord {
  id: number;
  date: string;
  battery_id: string;
  soc: number;
  soh: number;
  temperature: number;
  cycle: number;
  risk: number;
  risk_level: string;
  lifecycle_recommendation: string;
  pack_voltage: number;
  current: number;
  power: number;
  energy_wh: number;
  cell_voltage_spread_mv: number;
  cells: number[];
}

export interface HistoryListResponse {
  total: number;
  records: HistoryRecord[];
}

export interface BatteryReport {
  battery_id: string;
  model_name: string;
  vehicle_id: string;
  chemistry: string;
  generated_at: string;
  current_soh: number;
  current_soc: number;
  pack_voltage: number;
  current: number;
  power: number;
  energy_wh: number;
  temperature: number;
  cycle_count: number;
  rul_months: number;
  rul_cycles: number;
  risk_score: number;
  risk_level: string;
  cell_voltage_spread_mv: number;
  cell_voltages: number[];
  temperature_status: string;
  detected_anomalies: AnomalyItem[];
  lifecycle_recommendation: string;
  second_life_suitability_score: number;
  second_life_status: string;
  soh_explanation: string;
  mitigation_guidance: string;
  disclaimer: string;
}

export interface SimulationStatus {
  is_running: boolean;
  speed: number;
  scenario: string;
  active_battery_id: string;
  tick_count: number;
  last_update?: string;
}

export type ScenarioType = 
  | 'NORMAL'
  | 'Normal Operation'
  | 'AGING'
  | 'Aging Battery'
  | 'CELL IMBALANCE'
  | 'Cell Imbalance'
  | 'THERMAL STRESS'
  | 'High Temperature'
  | 'HIGH CURRENT'
  | 'High Current'
  | 'RAPID DEGRADATION'
  | 'Rapid Degradation'
  | 'MULTI-FAULT'
  | 'Multi-Fault';

export type NavPage =
  | 'overview'
  | 'ai-diagnostics'
  | 'live-diagnostics'
  | 'battery-health'
  | 'rul-prediction'
  | 'cell-analysis'
  | 'ai-risk'
  | 'lifecycle-decision'
  | 'battery-history'
  | 'settings';
