import csv
import io
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.battery import Battery, Telemetry, CellMeasurement, HealthHistory, RiskEvent, LifecycleDecision
from backend.app.schemas.battery import (
    BatteryOverview,
    TelemetryCreate,
    TelemetryResponse,
    HealthStatusResponse,
    CellAnalysisResponse,
    CellCompatibilityResponse,
    DegradationResponse,
    TemperatureTrendResponse,
    AnomalyListResponse,
    RiskScoreResponse,
    RULPredictionResponse,
    SecondLifeAssessmentResponse,
    LifecycleRecommendationResponse,
    HistoryListResponse,
    HistoryRecordResponse,
    BatteryReportResponse,
)
from backend.app.services import (
    AnalyticsService,
    SOHService,
    RULService,
    AnomalyService,
    RiskService,
    LifecycleService,
    SecondLifeService,
    SimulationService,
)
from backend.app.simulator.engine import simulation_engine

router = APIRouter(prefix="/api", tags=["Batteries & Diagnostics"])

@router.get("/batteries", response_model=List[BatteryOverview])
def list_batteries(db: Session = Depends(get_db)):
    """List all tracked EV batteries with live operational summaries."""
    db_batteries = db.query(Battery).all()
    results = []
    
    for b in db_batteries:
        telemetry = SimulationService.get_telemetry(b.id)
        if not telemetry:
            telemetry = {
                "soc": 68.0,
                "soh": 84.0,
                "cycle_count": 428,
                "temperature": 31.4,
                "pack_voltage": 15.92,
                "current": 4.2,
                "power": 66.86,
                "energy_wh": 510.0,
                "cell_voltage_spread_mv": 70.0
            }
            
        health = SOHService.estimate_soh(b.id, telemetry, b.nominal_capacity_ah)
        risk = RiskService.assess_risk(b.id, telemetry, simulation_engine.scenario)
        _, rul = RULService.predict_rul(b.id, telemetry, b.nominal_capacity_ah)
        lifecycle = LifecycleService.evaluate_lifecycle(b.id, telemetry, b.nominal_capacity_ah)
        anomalies = AnomalyService.detect_anomalies(b.id, telemetry, simulation_engine.scenario)
        
        results.append(BatteryOverview(
            battery_id=b.id,
            model_name=b.model_name,
            status=b.status,
            vehicle_id=b.vehicle_id,
            chemistry=b.chemistry,
            nominal_capacity_ah=b.nominal_capacity_ah,
            pack_nominal_voltage=b.pack_nominal_voltage,
            soc=telemetry["soc"],
            soh=telemetry["soh"],
            rul_months=rul.estimated_remaining_months,
            rul_cycles=rul.remaining_cycles,
            risk_score=risk.overall_risk_score,
            risk_level=risk.risk_level,
            temperature=telemetry["temperature"],
            cycle_count=telemetry["cycle_count"],
            pack_voltage=telemetry["pack_voltage"],
            current=telemetry["current"],
            power=telemetry["power"],
            energy_wh=telemetry.get("energy_wh", 510.0),
            cell_voltage_spread_mv=telemetry["cell_voltage_spread_mv"],
            health_status=health.health_status,
            primary_recommendation=lifecycle.primary_recommendation,
            anomaly_count=anomalies.total_count
        ))
        
    return results

@router.get("/batteries/{battery_id}", response_model=BatteryOverview)
def get_battery(battery_id: str, db: Session = Depends(get_db)):
    """Get complete overview KPI metrics for a selected battery."""
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail=f"Battery {battery_id} not found")

    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not available")

    health = SOHService.estimate_soh(battery_id, telemetry, battery.nominal_capacity_ah)
    risk = RiskService.assess_risk(battery_id, telemetry, simulation_engine.scenario)
    _, rul = RULService.predict_rul(battery_id, telemetry, battery.nominal_capacity_ah)
    lifecycle = LifecycleService.evaluate_lifecycle(battery_id, telemetry, battery.nominal_capacity_ah)
    anomalies = AnomalyService.detect_anomalies(battery_id, telemetry, simulation_engine.scenario)

    return BatteryOverview(
        battery_id=battery.id,
        model_name=battery.model_name,
        status=battery.status,
        vehicle_id=battery.vehicle_id,
        chemistry=battery.chemistry,
        nominal_capacity_ah=battery.nominal_capacity_ah,
        pack_nominal_voltage=battery.pack_nominal_voltage,
        soc=telemetry["soc"],
        soh=telemetry["soh"],
        rul_months=rul.estimated_remaining_months,
        rul_cycles=rul.remaining_cycles,
        risk_score=risk.overall_risk_score,
        risk_level=risk.risk_level,
        temperature=telemetry["temperature"],
        cycle_count=telemetry["cycle_count"],
        pack_voltage=telemetry["pack_voltage"],
        current=telemetry["current"],
        power=telemetry["power"],
        energy_wh=telemetry.get("energy_wh", 510.0),
        cell_voltage_spread_mv=telemetry["cell_voltage_spread_mv"],
        health_status=health.health_status,
        primary_recommendation=lifecycle.primary_recommendation,
        anomaly_count=anomalies.total_count
    )

@router.get("/batteries/{battery_id}/telemetry", response_model=TelemetryResponse)
def get_live_telemetry(battery_id: str):
    """Get live real-time battery parameters and 4-cell readings."""
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail=f"No telemetry found for battery {battery_id}")
    return telemetry

@router.get("/batteries/{battery_id}/cells", response_model=CellAnalysisResponse)
def get_cell_analysis(battery_id: str):
    """Get 4-cell voltage, temperature, health, and spread diagnostics."""
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail=f"No telemetry found for battery {battery_id}")
    return AnalyticsService.evaluate_cells(battery_id, telemetry)

@router.get("/batteries/{battery_id}/cell-compatibility", response_model=CellCompatibilityResponse)
def get_cell_compatibility(battery_id: str):
    """Get 4-cell pairwise match scoring and compatible cell groupings for second-life balancing."""
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail=f"No telemetry found for battery {battery_id}")
    return SecondLifeService.evaluate_cell_compatibility(battery_id, telemetry)

@router.get("/batteries/{battery_id}/anomalies", response_model=AnomalyListResponse)
def get_anomalies(battery_id: str):
    """Get deterministic multi-vector detected anomalies list with severities and thresholds."""
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail=f"No telemetry found for battery {battery_id}")
    return AnomalyService.detect_anomalies(battery_id, telemetry, simulation_engine.scenario)

@router.get("/batteries/{battery_id}/soh", response_model=HealthStatusResponse)
@router.get("/batteries/{battery_id}/health", response_model=HealthStatusResponse)
def get_battery_soh(battery_id: str, db: Session = Depends(get_db)):
    """Get AI-estimated prototype battery health assessment, SOH %, capacity retention, degradation rate, explanation."""
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    nominal_cap = battery.nominal_capacity_ah if battery else 51.0
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not found")
    return SOHService.estimate_soh(battery_id, telemetry, nominal_cap)

@router.get("/batteries/{battery_id}/temperature", response_model=TemperatureTrendResponse)
def get_temperature_trend(battery_id: str):
    """Get historical and live temperature trend with safety thresholds."""
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not found")
    return AnalyticsService.get_temperature_trend(
        battery_id=battery_id,
        current_temp=telemetry.get("temperature", 31.4),
        ambient_temp=telemetry.get("ambient_temp", 25.0)
    )

@router.get("/batteries/{battery_id}/degradation", response_model=DegradationResponse)
def get_degradation_chart(
    battery_id: str,
    eol_threshold: float = Query(80.0, ge=50.0, le=95.0, description="Configurable SOH EOL threshold"),
    db: Session = Depends(get_db)
):
    """Get historical cycle degradation vs predicted future degradation trajectory."""
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    nominal_cap = battery.nominal_capacity_ah if battery else 51.0
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not found")
    deg, _ = RULService.predict_rul(battery_id, telemetry, nominal_cap, eol_threshold)
    return deg

@router.get("/batteries/{battery_id}/rul", response_model=RULPredictionResponse)
def get_rul_prediction(
    battery_id: str,
    eol_threshold: float = Query(80.0, ge=50.0, le=95.0, description="Configurable SOH EOL threshold"),
    db: Session = Depends(get_db)
):
    """Get Remaining Useful Life (RUL) estimation, confidence score, EOL dates, and calculation explanation."""
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    nominal_cap = battery.nominal_capacity_ah if battery else 51.0
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not found")
    _, rul = RULService.predict_rul(battery_id, telemetry, nominal_cap, eol_threshold)
    return rul

@router.get("/batteries/{battery_id}/risk", response_model=RiskScoreResponse)
def get_risk_assessment(battery_id: str):
    """Get transparent itemized AI risk scoring (0-30 LOW, 31-60 MEDIUM, 61-100 HIGH)."""
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not found")
    return RiskService.assess_risk(battery_id, telemetry, simulation_engine.scenario)

@router.get("/batteries/{battery_id}/second-life", response_model=SecondLifeAssessmentResponse)
def get_second_life_assessment(battery_id: str, db: Session = Depends(get_db)):
    """Get second-life repurposing screening for stationary BESS or backup storage."""
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    nominal_cap = battery.nominal_capacity_ah if battery else 51.0
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not found")
    return SecondLifeService.evaluate_second_life(battery_id, telemetry, nominal_cap)

@router.get("/batteries/{battery_id}/lifecycle", response_model=LifecycleRecommendationResponse)
def get_lifecycle_decision(battery_id: str, db: Session = Depends(get_db)):
    """Get lifecycle decision support (CONTINUE USE, SERVICE, SECOND LIFE, RECYCLE) with safety override."""
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    nominal_cap = battery.nominal_capacity_ah if battery else 51.0
    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not found")
    return LifecycleService.evaluate_lifecycle(battery_id, telemetry, nominal_cap)

@router.get("/batteries/{battery_id}/history", response_model=HistoryListResponse)
def get_battery_history(
    battery_id: str,
    search: Optional[str] = Query(None, description="Search term for recommendations or date"),
    risk_filter: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH)"),
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get historical telemetry log records with search, filter, and pagination."""
    query = db.query(Telemetry).filter(Telemetry.battery_id == battery_id).order_by(Telemetry.timestamp.desc())
    all_records = query.all()
    
    transformed = []
    for row in all_records:
        rec_cells = [c.voltage for c in row.cells] if row.cells else [4.01, 4.00, 3.94, 3.99]
        risk_val = 22.0 if row.soh >= 80 else (45.0 if row.soh >= 75 else 68.0)
        risk_lvl = "LOW" if risk_val <= 30 else ("MEDIUM" if risk_val <= 60 else "HIGH")
        rec = "CONTINUE USE" if row.soh >= 80 else ("SECOND-LIFE REPURPOSING" if row.soh >= 65 else "RECYCLE / RETIRE")
        
        item = HistoryRecordResponse(
            id=row.id,
            date=row.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            battery_id=row.battery_id,
            soc=row.soc,
            soh=row.soh,
            temperature=row.temperature,
            cycle=row.cycle_count,
            risk=risk_val,
            risk_level=risk_lvl,
            lifecycle_recommendation=rec,
            pack_voltage=row.pack_voltage,
            current=row.current,
            power=row.power,
            energy_wh=round(row.pack_voltage * 51.0 * (row.soc / 100.0), 1),
            cell_voltage_spread_mv=row.cell_voltage_spread_mv,
            cells=rec_cells
        )
        
        if search:
            s_lower = search.lower()
            if s_lower not in item.lifecycle_recommendation.lower() and s_lower not in item.date and s_lower not in item.risk_level.lower():
                continue
                
        if risk_filter and risk_filter.upper() != "ALL" and item.risk_level.upper() != risk_filter.upper():
            continue
            
        transformed.append(item)

    total = len(transformed)
    start_idx = (page - 1) * limit
    paginated = transformed[start_idx : start_idx + limit]

    return HistoryListResponse(total=total, records=paginated)

@router.get("/batteries/{battery_id}/export/csv")
def export_battery_csv(battery_id: str, db: Session = Depends(get_db)):
    """Export complete battery historical telemetry and diagnostics as a downloadable CSV file."""
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    telemetries = db.query(Telemetry).filter(Telemetry.battery_id == battery_id).order_by(Telemetry.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # CSV Header
    writer.writerow([
        "Timestamp",
        "Battery ID",
        "Model Name",
        "Pack Voltage (V)",
        "Current (A)",
        "Power (W)",
        "Energy (Wh)",
        "Temperature (C)",
        "SOC (%)",
        "SOH (%)",
        "Cycle Count",
        "Cell Spread (mV)",
        "Cell 1 (V)",
        "Cell 2 (V)",
        "Cell 3 (V)",
        "Cell 4 (V)",
        "Risk Level",
        "Lifecycle Recommendation"
    ])
    
    for t in telemetries:
        cell_v = [c.voltage for c in t.cells] if t.cells else [4.01, 4.00, 3.94, 3.99]
        while len(cell_v) < 4:
            cell_v.append(3.95)
            
        risk_lvl = "LOW" if t.soh >= 80 else ("MEDIUM" if t.soh >= 70 else "HIGH")
        rec = "CONTINUE USE" if t.soh >= 80 else ("SECOND-LIFE REPURPOSING" if t.soh >= 65 else "RECYCLE / RETIRE")
        energy_wh = round(t.pack_voltage * 51.0 * (t.soc / 100.0), 1)

        writer.writerow([
            t.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            t.battery_id,
            battery.model_name,
            t.pack_voltage,
            t.current,
            t.power,
            energy_wh,
            t.temperature,
            t.soc,
            t.soh,
            t.cycle_count,
            t.cell_voltage_spread_mv,
            cell_v[0],
            cell_v[1],
            cell_v[2],
            cell_v[3],
            risk_lvl,
            rec
        ])

    output.seek(0)
    filename = f"voltwise_{battery_id}_telemetry_export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/batteries/{battery_id}/report", response_model=BatteryReportResponse)
def get_battery_report(battery_id: str, db: Session = Depends(get_db)):
    """Generate comprehensive diagnostic summary report for the selected battery."""
    battery = db.query(Battery).filter(Battery.id == battery_id).first()
    if not battery:
        raise HTTPException(status_code=404, detail="Battery not found")

    telemetry = SimulationService.get_telemetry(battery_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Telemetry not found")

    health = SOHService.estimate_soh(battery_id, telemetry, battery.nominal_capacity_ah)
    risk = RiskService.assess_risk(battery_id, telemetry, simulation_engine.scenario)
    _, rul = RULService.predict_rul(battery_id, telemetry, battery.nominal_capacity_ah)
    lifecycle = LifecycleService.evaluate_lifecycle(battery_id, telemetry, battery.nominal_capacity_ah)
    anomalies = AnomalyService.detect_anomalies(battery_id, telemetry, simulation_engine.scenario)
    cells = [c.get("voltage", 4.0) if isinstance(c, dict) else c.voltage for c in telemetry.get("cells", [])]

    temp_val = telemetry.get("temperature", 31.4)
    temp_status = "Nominal (< 35°C)" if temp_val < 35.0 else ("Elevated (35-42°C)" if temp_val < 42.0 else "Critical (> 42°C)")

    return BatteryReportResponse(
        battery_id=battery_id,
        model_name=battery.model_name,
        vehicle_id=battery.vehicle_id,
        chemistry=battery.chemistry,
        generated_at=datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        current_soh=telemetry.get("soh", 84.0),
        current_soc=telemetry.get("soc", 68.0),
        pack_voltage=telemetry.get("pack_voltage", 15.92),
        current=telemetry.get("current", 4.2),
        power=telemetry.get("power", 66.86),
        energy_wh=telemetry.get("energy_wh", 510.0),
        temperature=temp_val,
        cycle_count=telemetry.get("cycle_count", 428),
        rul_months=rul.estimated_remaining_months,
        rul_cycles=rul.remaining_cycles,
        risk_score=risk.overall_risk_score,
        risk_level=risk.risk_level,
        cell_voltage_spread_mv=telemetry.get("cell_voltage_spread_mv", 70.0),
        cell_voltages=cells,
        temperature_status=temp_status,
        detected_anomalies=anomalies.anomalies,
        lifecycle_recommendation=lifecycle.primary_recommendation,
        second_life_suitability_score=lifecycle.repurposing_suitability_score,
        second_life_status=lifecycle.second_life_summary.status if lifecycle.second_life_summary else "Eligible for 2nd Life",
        soh_explanation=health.soh_explanation,
        mitigation_guidance=risk.mitigation_recommendation,
        disclaimer="VoltWise AI Prototype Diagnostic Report — generated for engineering evaluation and decision support."
    )

@router.post("/telemetry", response_model=TelemetryResponse)
def ingest_hardware_telemetry(payload: TelemetryCreate, db: Session = Depends(get_db)):
    """
    HARDWARE INGESTION ENDPOINT:
    Direct ESP32 + BQ76920 + INA226 + NTC sensor ingestion endpoint.
    Accepts raw 4-cell voltages, pack voltage, current, temperature.
    Integrates seamlessly into database and real-time state.
    """
    b = db.query(Battery).filter(Battery.id == payload.battery_id).first()
    if not b:
        b = Battery(
            id=payload.battery_id,
            model_name="VoltWise Custom Hardware Pack",
            pack_nominal_voltage=payload.pack_voltage,
            nominal_capacity_ah=51.0,
            status="Online / ESP32 Connected"
        )
        db.add(b)
        db.commit()
        db.refresh(b)

    processed = simulation_engine.update_external_telemetry(
        battery_id=payload.battery_id,
        cell_voltages=payload.cell_voltages,
        pack_voltage=payload.pack_voltage,
        current=payload.current,
        temperature=payload.temperature,
        soc=payload.soc,
        soh=payload.soh,
        ambient_temp=payload.ambient_temp or 25.0
    )

    db_telemetry = Telemetry(
        battery_id=payload.battery_id,
        timestamp=datetime.datetime.now(datetime.timezone.utc),
        pack_voltage=processed["pack_voltage"],
        current=processed["current"],
        power=processed["power"],
        temperature=processed["temperature"],
        soc=processed["soc"],
        soh=processed["soh"],
        cycle_count=processed["cycle_count"],
        cell_voltage_spread_mv=processed["cell_voltage_spread_mv"],
        ambient_temp=processed["ambient_temp"],
        is_simulated=False
    )
    db.add(db_telemetry)
    db.commit()
    db.refresh(db_telemetry)

    for c in processed["cells"]:
        db.add(CellMeasurement(
            telemetry_id=db_telemetry.id,
            battery_id=payload.battery_id,
            cell_number=c["cell_number"],
            voltage=c["voltage"],
            temperature=c["temperature"],
            internal_resistance_mohm=c["internal_resistance_mohm"],
            relative_health_pct=c["relative_health_pct"],
            status=c["status"]
        ))
    db.commit()

    return processed
