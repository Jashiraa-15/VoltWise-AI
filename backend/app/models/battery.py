import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Battery(Base):
    __tablename__ = "batteries"

    id = Column(String, primary_key=True, index=True) # e.g. VW-EV-001
    model_name = Column(String, nullable=False, default="VoltWise 4S Pro")
    pack_nominal_voltage = Column(Float, nullable=False, default=14.8)
    nominal_capacity_ah = Column(Float, nullable=False, default=51.0)
    chemistry = Column(String, nullable=False, default="NMC (LiNiMnCoO2)")
    cell_count = Column(Integer, nullable=False, default=4)
    manufacture_date = Column(String, default="2024-03-15")
    vehicle_id = Column(String, default="EV-FLEET-702")
    status = Column(String, default="Online / Monitoring")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    telemetries = relationship("Telemetry", back_populates="battery", cascade="all, delete-orphan")
    health_histories = relationship("HealthHistory", back_populates="battery", cascade="all, delete-orphan")
    risk_events = relationship("RiskEvent", back_populates="battery", cascade="all, delete-orphan")
    lifecycle_decisions = relationship("LifecycleDecision", back_populates="battery", cascade="all, delete-orphan")

class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    pack_voltage = Column(Float, nullable=False) # e.g. 15.92 V
    current = Column(Float, nullable=False) # e.g. 4.2 A (positive = discharge, negative = charge)
    power = Column(Float, nullable=False) # e.g. 66.86 W
    temperature = Column(Float, nullable=False) # e.g. 31.4 °C
    soc = Column(Float, nullable=False) # State of Charge % e.g. 68.0
    soh = Column(Float, nullable=False) # State of Health % e.g. 84.0
    cycle_count = Column(Integer, nullable=False, default=428)
    
    cell_voltage_spread_mv = Column(Float, nullable=False, default=0.0) # mV e.g. 70.0
    ambient_temp = Column(Float, default=25.0)
    is_simulated = Column(Boolean, default=True)

    battery = relationship("Battery", back_populates="telemetries")
    cells = relationship("CellMeasurement", back_populates="telemetry", cascade="all, delete-orphan")

class CellMeasurement(Base):
    __tablename__ = "cell_measurements"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    telemetry_id = Column(Integer, ForeignKey("telemetry.id"), nullable=False, index=True)
    battery_id = Column(String, nullable=False, index=True)
    cell_number = Column(Integer, nullable=False) # 1, 2, 3, 4
    
    voltage = Column(Float, nullable=False) # e.g. 4.01 V
    temperature = Column(Float, nullable=False) # e.g. 29.8 °C
    internal_resistance_mohm = Column(Float, default=18.5) # mOhm
    relative_health_pct = Column(Float, default=98.5) # %
    status = Column(String, default="Normal") # Normal, Warning, Critical

    telemetry = relationship("Telemetry", back_populates="cells")

class HealthHistory(Base):
    __tablename__ = "health_history"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    cycle_count = Column(Integer, nullable=False) # e.g. 0, 100, 200, 300, 400, 428
    soh_pct = Column(Float, nullable=False) # e.g. 100.0, 96.0, 93.0, 89.0, 84.0
    capacity_ah = Column(Float, nullable=False) # e.g. 42.8 Ah
    capacity_retention_pct = Column(Float, nullable=False) # e.g. 83.9%
    degradation_rate_pct_per_100 = Column(Float, default=1.7) # 1.7% / 100 cycles
    avg_internal_resistance_mohm = Column(Float, default=22.4)
    notes = Column(String, nullable=True)

    battery = relationship("Battery", back_populates="health_histories")

class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    risk_score = Column(Float, nullable=False) # 0 - 100 (e.g. 22)
    risk_level = Column(String, nullable=False) # Low, Moderate, High, Critical
    thermal_risk_score = Column(Float, default=15.0)
    imbalance_risk_score = Column(Float, default=20.0)
    degradation_risk_score = Column(Float, default=25.0)
    voltage_sag_risk_score = Column(Float, default=18.0)
    mitigation_recommendation = Column(Text, nullable=True)
    active_alerts = Column(Text, default="[]") # JSON list of alerts

    battery = relationship("Battery", back_populates="risk_events")

class LifecycleDecision(Base):
    __tablename__ = "lifecycle_decisions"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    battery_id = Column(String, ForeignKey("batteries.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    soh_pct = Column(Float, nullable=False) # e.g. 84.0
    rul_months = Column(Float, nullable=False) # e.g. 18.0
    rul_cycles = Column(Integer, nullable=False) # e.g. 380
    primary_recommendation = Column(String, nullable=False) # e.g. "1st Life: Continue Fleet EV"
    repurposing_suitability_score = Column(Float, default=88.5) # 0 - 100
    economic_value_remaining_usd = Column(Float, default=1420.0)
    confidence_pct = Column(Float, default=94.2)
    decision_rationales = Column(Text, default="[]") # JSON list of reasons

    battery = relationship("Battery", back_populates="lifecycle_decisions")
