import datetime
import random
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.models.battery import (
    Battery,
    Telemetry,
    CellMeasurement,
    HealthHistory,
    RiskEvent,
    LifecycleDecision,
)

def seed_database():
    """Initializes schema and seeds realistic baseline and historical data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Battery).count() > 0:
            print("Database already contains batteries. Skipping seed.")
            return

        print("Seeding database with realistic EV battery datasets...")

        # 1. Batteries
        batteries_data = [
            Battery(
                id="VW-EV-001",
                model_name="VoltWise 4S Pro (Fleet Standard)",
                pack_nominal_voltage=14.8,
                nominal_capacity_ah=51.0,
                chemistry="NMC (LiNiMnCoO2)",
                cell_count=4,
                manufacture_date="2024-03-15",
                vehicle_id="EV-FLEET-702",
                status="Online / Monitoring"
            ),
            Battery(
                id="VW-EV-002",
                model_name="VoltWise 4S Dual (Moderate Mileage)",
                pack_nominal_voltage=14.8,
                nominal_capacity_ah=51.0,
                chemistry="NMC (LiNiMnCoO2)",
                cell_count=4,
                manufacture_date="2023-08-20",
                vehicle_id="EV-FLEET-419",
                status="Online / Monitoring"
            ),
            Battery(
                id="VW-EV-003",
                model_name="VoltWise 4S Max (Aging Pack / 2nd Life Candidate)",
                pack_nominal_voltage=14.8,
                nominal_capacity_ah=51.0,
                chemistry="NMC (LiNiMnCoO2)",
                cell_count=4,
                manufacture_date="2022-11-10",
                vehicle_id="EV-EXP-104",
                status="Online / Monitoring"
            ),
        ]
        db.add_all(batteries_data)
        db.commit()

        # 2. Historical Telemetry and Cells
        now = datetime.datetime.utcnow()
        
        configs = [
            {"id": "VW-EV-001", "base_soc": 68.0, "base_soh": 84.0, "cycles": 428, "base_temp": 31.4, "v_cells": [4.01, 4.00, 3.94, 3.99]},
            {"id": "VW-EV-002", "base_soc": 54.0, "base_soh": 78.2, "cycles": 680, "base_temp": 34.6, "v_cells": [3.89, 3.88, 3.79, 3.87]},
            {"id": "VW-EV-003", "base_soc": 42.0, "base_soh": 71.8, "cycles": 942, "base_temp": 37.8, "v_cells": [3.78, 3.77, 3.71, 3.75]},
        ]

        for cfg in configs:
            b_id = cfg["id"]
            
            # Generate 40 historical telemetry timestamps over past 5 days
            for i in range(40, -1, -1):
                t_stamp = now - datetime.timedelta(hours=i * 3, minutes=random.randint(0, 50))
                
                # SOH progression backwards in time
                hist_soh = round(cfg["base_soh"] + (i * 0.05), 1)
                hist_cycles = max(10, cfg["cycles"] - int(i * 1.5))
                
                # SOC variation
                hist_soc = round(max(20.0, min(95.0, cfg["base_soc"] + math_sin_wave(i) * 25.0)), 1)
                hist_current = round(3.8 + (math_sin_wave(i * 2) * 2.2), 2)
                hist_temp = round(cfg["base_temp"] + (random.random() - 0.5) * 3.0, 1)
                
                # Cells with realistic spread
                spread_base = 0.07 if b_id == "VW-EV-001" else (0.10 if b_id == "VW-EV-002" else 0.06)
                c_base = 3.6 + (hist_soc / 100.0) * 0.55
                
                cell_v1 = round(c_base + 0.02 + (random.random() - 0.5) * 0.01, 2)
                cell_v2 = round(c_base + 0.01 + (random.random() - 0.5) * 0.01, 2)
                cell_v3 = round(c_base - spread_base + (random.random() - 0.5) * 0.01, 2)
                cell_v4 = round(c_base + 0.00 + (random.random() - 0.5) * 0.01, 2)
                
                c_voltages = [cell_v1, cell_v2, cell_v3, cell_v4]
                pack_v = round(sum(c_voltages), 2)
                power = round(pack_v * hist_current, 2)
                spread_mv = round((max(c_voltages) - min(c_voltages)) * 1000.0, 1)

                t_record = Telemetry(
                    battery_id=b_id,
                    timestamp=t_stamp,
                    pack_voltage=pack_v,
                    current=hist_current,
                    power=power,
                    temperature=hist_temp,
                    soc=hist_soc,
                    soh=hist_soh,
                    cycle_count=hist_cycles,
                    cell_voltage_spread_mv=spread_mv,
                    ambient_temp=25.0,
                    is_simulated=True
                )
                db.add(t_record)
                db.flush() # get t_record.id

                # Add cell measurements for this record
                for c_idx, v in enumerate(c_voltages):
                    dev = abs(v - (pack_v / 4.0)) * 1000.0
                    status = "Critical" if dev > 60 else ("Warning" if dev > 30 else "Normal")
                    db.add(CellMeasurement(
                        telemetry_id=t_record.id,
                        battery_id=b_id,
                        cell_number=c_idx + 1,
                        voltage=v,
                        temperature=round(hist_temp + (c_idx * 0.3 - 0.4), 1),
                        internal_resistance_mohm=18.5 if c_idx != 2 else 24.0,
                        relative_health_pct=round(hist_soh * (0.97 if c_idx == 2 else 1.0), 1),
                        status=status
                    ))

            # Health History Milestones
            milestones = [
                (0, 100.0, 51.0, 100.0, 1.2),
                (100, 96.0, 49.0, 96.1, 1.4),
                (200, 93.0, 47.4, 92.9, 1.5),
                (300, 89.0, 45.4, 89.0, 1.6),
                (400, 85.0, 43.4, 85.1, 1.7),
                (cfg["cycles"], cfg["base_soh"], round(51.0 * (cfg["base_soh"] / 100.0), 1), cfg["base_soh"], 1.7)
            ]
            for m_cycle, m_soh, m_cap, m_ret, m_deg in milestones:
                if m_cycle <= cfg["cycles"]:
                    db.add(HealthHistory(
                        battery_id=b_id,
                        timestamp=now - datetime.timedelta(days=int((cfg["cycles"] - m_cycle) * 1.4)),
                        cycle_count=m_cycle,
                        soh_pct=m_soh,
                        capacity_ah=m_cap,
                        capacity_retention_pct=m_ret,
                        degradation_rate_pct_per_100=m_deg,
                        avg_internal_resistance_mohm=19.5 + (m_cycle / 100.0) * 1.2
                    ))

            # Risk event baseline
            db.add(RiskEvent(
                battery_id=b_id,
                timestamp=now,
                risk_score=22.0 if b_id == "VW-EV-001" else (48.0 if b_id == "VW-EV-002" else 65.0),
                risk_level="Low" if b_id == "VW-EV-001" else ("Moderate" if b_id == "VW-EV-002" else "High"),
                thermal_risk_score=15.0 if b_id == "VW-EV-001" else 35.0,
                imbalance_risk_score=20.0 if b_id == "VW-EV-001" else 58.0,
                degradation_risk_score=25.0 if b_id == "VW-EV-001" else 60.0,
                voltage_sag_risk_score=18.0 if b_id == "VW-EV-001" else 42.0,
                mitigation_recommendation="Nominal operation profile active."
            ))

            # Lifecycle Decision baseline
            primary_rec = "1st Life: Continue Fleet EV" if cfg["base_soh"] >= 80 else ("2nd Life: Stationary Energy Storage (BESS)" if cfg["base_soh"] >= 70 else "Recycle: Direct Hydrometallurgical Extraction")
            db.add(LifecycleDecision(
                battery_id=b_id,
                timestamp=now,
                soh_pct=cfg["base_soh"],
                rul_months=18.0 if b_id == "VW-EV-001" else (8.5 if b_id == "VW-EV-002" else 2.0),
                rul_cycles=380 if b_id == "VW-EV-001" else (180 if b_id == "VW-EV-002" else 45),
                primary_recommendation=primary_rec,
                repurposing_suitability_score=92.5 if b_id == "VW-EV-001" else (86.0 if b_id == "VW-EV-002" else 74.0),
                economic_value_remaining_usd=1420.0 if b_id == "VW-EV-001" else (850.0 if b_id == "VW-EV-002" else 410.0),
                confidence_pct=94.2
            ))

        db.commit()
        print("Database seeded successfully with realistic telemetry, health history, and risk events!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

def math_sin_wave(val: float) -> float:
    import math
    return math.sin(val * 0.5)

if __name__ == "__main__":
    seed_database()
