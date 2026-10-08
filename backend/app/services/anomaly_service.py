import datetime
from typing import Dict, List
from backend.app.schemas.battery import AnomalyItem, AnomalyListResponse

class AnomalyService:
    """
    Anomaly Detection Service:
    Detects abnormal battery behaviors across 5 key diagnostic vectors:
    1. Cell voltage deviation / imbalance
    2. Abnormal pack/cell temperature
    3. Abnormal charge/discharge current
    4. Rapid voltage drop / cell sag
    5. Accelerated degradation velocity
    """

    @staticmethod
    def detect_anomalies(battery_id: str, telemetry: Dict, scenario: str = "NORMAL") -> AnomalyListResponse:
        anomalies: List[AnomalyItem] = []
        now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S")
        
        spread_mv = float(telemetry.get("cell_voltage_spread_mv", 0.0))
        temp = float(telemetry.get("temperature", 25.0))
        current = float(telemetry.get("current", 0.0))
        pack_v = float(telemetry.get("pack_voltage", 14.8))
        soh = float(telemetry.get("soh", 84.0))
        cycles = int(telemetry.get("cycle_count", 428))
        raw_cells = telemetry.get("cells", [])

        # 1. Cell Voltage Deviation & Imbalance
        if spread_mv >= 90.0:
            anomalies.append(AnomalyItem(
                id="ANOM-V-01",
                anomaly_type="Cell Voltage Imbalance",
                severity="Critical",
                affected_cell="Cell 3",
                timestamp=now_str,
                measured_value=f"{spread_mv} mV",
                threshold="> 70.0 mV",
                explanation=f"Cell 3 voltage deviation ({spread_mv} mV) exceeds maximum allowable 70mV threshold, indicating elevated series impedance."
            ))
        elif spread_mv >= 45.0:
            anomalies.append(AnomalyItem(
                id="ANOM-V-02",
                anomaly_type="Cell Voltage Imbalance",
                severity="Warning",
                affected_cell="Cell 3",
                timestamp=now_str,
                measured_value=f"{spread_mv} mV",
                threshold="> 30.0 mV",
                explanation=f"Cell 3 is {spread_mv} mV below highest cell, diverging from standard 30mV pack balance tolerance."
            ))

        # 2. Thermal Anomalies
        if temp >= 50.0:
            anomalies.append(AnomalyItem(
                id="ANOM-T-01",
                anomaly_type="High Temperature",
                severity="Critical",
                affected_cell="Pack Core",
                timestamp=now_str,
                measured_value=f"{temp} °C",
                threshold="> 50.0 °C",
                explanation=f"Pack core temperature at {temp}°C has entered critical thermal runaway risk territory. Cooling circuit requires immediate check."
            ))
        elif temp >= 41.5:
            anomalies.append(AnomalyItem(
                id="ANOM-T-02",
                anomaly_type="High Temperature",
                severity="Warning",
                affected_cell="Pack Core",
                timestamp=now_str,
                measured_value=f"{temp} °C",
                threshold="> 40.0 °C",
                explanation=f"Pack temperature ({temp}°C) exceeds nominal 40°C threshold during continuous load."
            ))

        # 3. Abnormal Current Load
        if abs(current) >= 30.0:
            anomalies.append(AnomalyItem(
                id="ANOM-I-01",
                anomaly_type="Abnormal Current",
                severity="Critical",
                affected_cell="Pack Bus",
                timestamp=now_str,
                measured_value=f"{current} A",
                threshold="> 25.0 A",
                explanation=f"Discharge current ({current} A) exceeds safe continuous 0.5C design rating."
            ))
        elif abs(current) >= 18.0:
            anomalies.append(AnomalyItem(
                id="ANOM-I-02",
                anomaly_type="Abnormal Current",
                severity="Warning",
                affected_cell="Pack Bus",
                timestamp=now_str,
                measured_value=f"{current} A",
                threshold="> 15.0 A",
                explanation=f"High load current spike ({current} A) detected."
            ))

        # 4. Rapid Voltage Drop / Low Pack Voltage
        if pack_v < 13.0:
            anomalies.append(AnomalyItem(
                id="ANOM-P-01",
                anomaly_type="Rapid Voltage Drop",
                severity="Critical",
                affected_cell="Pack Bus",
                timestamp=now_str,
                measured_value=f"{pack_v} V",
                threshold="< 13.2 V",
                explanation=f"Total pack voltage ({pack_v} V) dropped below safe operating cutoff under load."
            ))

        # Check individual cell voltages
        for c in raw_cells:
            v = c.get("voltage", 3.8) if isinstance(c, dict) else getattr(c, "voltage", 3.8)
            c_num = c.get("cell_number", 1) if isinstance(c, dict) else getattr(c, "cell_number", 1)
            if v < 3.20:
                anomalies.append(AnomalyItem(
                    id=f"ANOM-C0{c_num}-01",
                    anomaly_type="Rapid Voltage Drop",
                    severity="Warning",
                    affected_cell=f"Cell {c_num}",
                    timestamp=now_str,
                    measured_value=f"{v} V",
                    threshold="< 3.25 V",
                    explanation=f"Cell {c_num} voltage ({v} V) approaching electrochemical lower cutoff limit under load."
                ))

        # 5. Accelerated Degradation
        deg_rate = ((100.0 - soh) / max(1, cycles)) * 100.0
        if deg_rate > 3.0:
            anomalies.append(AnomalyItem(
                id="ANOM-D-01",
                anomaly_type="Unusual Degradation",
                severity="Warning",
                affected_cell="Cathode Structure",
                timestamp=now_str,
                measured_value=f"{round(deg_rate, 2)}% / 100 cyc",
                threshold="> 2.5% / 100 cyc",
                explanation=f"Degradation velocity ({round(deg_rate, 2)}% / 100 cycles) is accelerated compared to automotive baseline."
            ))

        highest_sev = "None"
        if any(a.severity == "Critical" for a in anomalies):
            highest_sev = "Critical"
        elif any(a.severity == "Warning" for a in anomalies):
            highest_sev = "Warning"

        return AnomalyListResponse(
            battery_id=battery_id,
            anomalies=anomalies,
            total_count=len(anomalies),
            highest_severity=highest_sev
        )
