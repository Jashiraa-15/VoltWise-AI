from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class CellSchema(BaseModel):
    cell_number: int = Field(..., ge=1, le=4)
    voltage: float
    temperature: float
    internal_resistance_mohm: float = 18.5
    relative_health_pct: float = 98.0
    status: str = "Normal" # Normal, Warning, Critical

class TelemetryCreate(BaseModel):
    battery_id: str = "VW-EV-001"
    timestamp: Optional[datetime] = None
    cell_voltages: List[float] = Field(..., min_items=4, max_items=4)
    pack_voltage: float
    current: float
    temperature: float
    soc: Optional[float] = None
    soh: Optional[float] = None
    cycle_count: Optional[int] = None
    ambient_temp: Optional[float] = 25.0
    is_simulated: Optional[bool] = False

class TelemetryResponse(BaseModel):
    id: Optional[int] = None
    battery_id: str
    timestamp: datetime
    pack_voltage: float
    current: float
    power: float
    energy_wh: float
    temperature: float
    soc: float
    soh: float
    cycle_count: int
    cell_voltage_spread_mv: float
    ambient_temp: float
    is_simulated: bool
    cells: List[CellSchema] = []

    class Config:
        from_attributes = True

class BatteryOverview(BaseModel):
    battery_id: str
    model_name: str
    status: str
    vehicle_id: str
    chemistry: str
    nominal_capacity_ah: float
    pack_nominal_voltage: float
    
    # Live KPI card values
    soc: float
    soh: float
    rul_months: float
    rul_cycles: int
    risk_score: float
    risk_level: str # LOW, MEDIUM, HIGH
    temperature: float
    cycle_count: int
    
    # Secondary metrics
    pack_voltage: float
    current: float
    power: float
    energy_wh: float
    cell_voltage_spread_mv: float
    health_status: str
    primary_recommendation: str
    anomaly_count: int = 0

class HealthStatusResponse(BaseModel):
    battery_id: str
    soh_pct: float
    health_status: str # "Optimal (Good)", "Moderate (Fair)", "Degraded (Poor)", "Critical"
    health_category: str
    current_capacity_ah: float
    original_capacity_ah: float
    capacity_retention_pct: float
    degradation_rate_pct_per_100: float
    avg_internal_resistance_mohm: float
    total_cycles: int
    cycle_life_rating: int = 1500
    energy_wh: float
    soh_explanation: str
    assessment_label: str = "AI-estimated / prototype battery health assessment"

class CellAnalysisResponse(BaseModel):
    battery_id: str
    cells: List[CellSchema]
    max_voltage: float
    min_voltage: float
    spread_mv: float
    spread_status: str # "Normal", "Warning", "Critical"
    avg_temperature: float
    max_temperature_delta: float
    imbalance_risk: str
    diagnostic_summary: str
    avg_resistance_mohm: float

class CellPairwiseScore(BaseModel):
    cell_a: int
    cell_b: int
    match_score_pct: float
    delta_voltage_mv: float
    delta_resistance_mohm: float
    delta_health_pct: float
    status: str # "Compatible", "Moderate Mismatch", "Incompatible"

class CellCompatibilityGroup(BaseModel):
    group_name: str
    cells: List[int]
    compatibility_score_pct: float
    recommended_usage: str
    notes: str

class CellCompatibilityResponse(BaseModel):
    battery_id: str
    overall_pack_homogeneity_pct: float
    pairwise_matrix: List[CellPairwiseScore]
    compatible_groups: List[CellCompatibilityGroup]
    assessment_summary: str
    disclaimer: str = "Software compatibility screening does not substitute for certified physical cell isolation and thermal impedance testing."

class DegradationPoint(BaseModel):
    cycle: int
    soh_pct: float
    capacity_ah: float
    is_predicted: bool = False
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None

class DegradationResponse(BaseModel):
    battery_id: str
    current_cycle: int
    current_soh: float
    eol_threshold_pct: float = 80.0
    history: List[DegradationPoint]
    prediction: List[DegradationPoint]

class TemperaturePoint(BaseModel):
    timestamp: str
    temperature: float
    ambient_temp: float
    is_abnormal: bool
    warning_threshold: float = 42.0
    critical_threshold: float = 50.0

class TemperatureTrendResponse(BaseModel):
    battery_id: str
    current_temp: float
    ambient_temp: float
    peak_temp_24h: float
    min_temp_24h: float
    trend: List[TemperaturePoint]

class AnomalyItem(BaseModel):
    id: str
    anomaly_type: str # "Cell Voltage Imbalance", "High Temperature", "Abnormal Current", "Rapid Voltage Drop", "Unusual Degradation"
    severity: str # "Warning", "Critical"
    affected_cell: str # "Cell 1", "Cell 2", "Cell 3", "Cell 4", "Pack Bus"
    timestamp: str
    measured_value: str
    threshold: str
    explanation: str

class AnomalyListResponse(BaseModel):
    battery_id: str
    anomalies: List[AnomalyItem]
    total_count: int
    highest_severity: str # "None", "Warning", "Critical"

class RiskContributionItem(BaseModel):
    factor: str
    points: float
    max_points: float
    status: str # "Normal", "Warning", "Critical"
    measured_value: str
    explanation: str

class RiskScoreResponse(BaseModel):
    battery_id: str
    overall_risk_score: float # 0 - 100
    risk_level: str # "LOW" (0-30), "MEDIUM" (31-60), "HIGH" (61-100)
    thermal_risk_score: float
    imbalance_risk_score: float
    degradation_risk_score: float
    voltage_sag_risk_score: float
    anomaly_risk_score: float
    breakdown_contributions: List[RiskContributionItem]
    active_alerts: List[str]
    mitigation_recommendation: str

class RULPredictionResponse(BaseModel):
    battery_id: str
    current_soh: float
    current_cycle: int
    eol_threshold_pct: float = 80.0
    estimated_eol_cycle: int
    remaining_cycles: int
    estimated_remaining_months: float
    confidence_score: float # 0 - 100 %
    estimated_eol_date: str
    degradation_rate_pct_per_100: float
    calculation_explanation: str
    insufficient_data: bool = False
    methodology: str = "Physics-Informed Empirical Degradation & Electrochemical Aging Model"
    trajectory: List[DegradationPoint]

class SecondLifeAssessmentResponse(BaseModel):
    battery_id: str
    soh_pct: float
    capacity_retention_pct: float
    second_life_suitability_score: float # 0 - 100
    status: str # "Eligible for 2nd Life", "Conditionally Eligible", "Ineligible (Recycle)"
    economic_value_remaining_usd: float
    confidence_pct: float
    reasons: List[str]
    potential_applications: List[str]
    disclaimer: str = "Prototype screening — not a certified safety assessment."

class LifecycleRecommendationResponse(BaseModel):
    battery_id: str
    soh_pct: float
    current_cycle: int
    primary_recommendation: str # "CONTINUE USE", "SERVICE / MAINTENANCE", "SECOND-LIFE EVALUATION", "RECYCLE / RETIRE"
    recommendation_category: str
    safety_override_active: bool
    safety_override_reason: Optional[str] = None
    repurposing_suitability_score: float
    economic_value_remaining_usd: float
    confidence_pct: float
    key_rationales: List[str]
    required_actions: List[str]
    suitable_applications: List[str]
    unsuitable_applications: List[str]
    second_life_summary: Optional[SecondLifeAssessmentResponse] = None

class HistoryRecordResponse(BaseModel):
    id: int
    date: str
    battery_id: str
    soc: float
    soh: float
    temperature: float
    cycle: int
    risk: float
    risk_level: str
    lifecycle_recommendation: str
    pack_voltage: float
    current: float
    power: float
    energy_wh: float
    cell_voltage_spread_mv: float
    cells: List[float]

class HistoryListResponse(BaseModel):
    total: int
    records: List[HistoryRecordResponse]

class SimulationControlRequest(BaseModel):
    action: str = "start" # "start", "pause", "reset", "step"
    speed: Optional[float] = 1.0 # 0.5, 1.0, 2.0, 5.0
    scenario: Optional[str] = "Normal Operation"
    battery_id: Optional[str] = "VW-EV-001"

class SimulationStatusResponse(BaseModel):
    is_running: bool
    speed: float
    scenario: str
    active_battery_id: str
    tick_count: int
    last_update: str

class BatteryReportResponse(BaseModel):
    battery_id: str
    model_name: str
    vehicle_id: str
    chemistry: str
    generated_at: str
    current_soh: float
    current_soc: float
    pack_voltage: float
    current: float
    power: float
    energy_wh: float
    temperature: float
    cycle_count: int
    rul_months: float
    rul_cycles: int
    risk_score: float
    risk_level: str
    cell_voltage_spread_mv: float
    cell_voltages: List[float]
    temperature_status: str
    detected_anomalies: List[AnomalyItem]
    lifecycle_recommendation: str
    second_life_suitability_score: float
    second_life_status: str
    soh_explanation: str
    mitigation_guidance: str
    disclaimer: str
