import math
import random
from typing import Dict, List, Tuple

class BatteryPhysicsModel:
    """
    Realistic Li-ion 4S battery pack electrochemical and thermal physics simulator.
    """

    @staticmethod
    def normalize_scenario_name(scenario: str) -> str:
        s = scenario.strip().upper()
        if s in ["NORMAL", "NORMAL OPERATION"]:
            return "NORMAL"
        elif s in ["AGING", "AGING BATTERY"]:
            return "AGING"
        elif s in ["CELL IMBALANCE", "IMBALANCE"]:
            return "CELL IMBALANCE"
        elif s in ["THERMAL STRESS", "HIGH TEMPERATURE", "THERMAL"]:
            return "THERMAL STRESS"
        elif s in ["HIGH CURRENT", "CURRENT"]:
            return "HIGH CURRENT"
        elif s in ["RAPID DEGRADATION", "DEGRADATION"]:
            return "RAPID DEGRADATION"
        elif s in ["MULTI-FAULT", "MULTI FAULT", "MULTIFAULT"]:
            return "MULTI-FAULT"
        return "NORMAL"

    @staticmethod
    def soc_to_ocv_cell(soc: float) -> float:
        """
        NMC Lithium-ion Open Circuit Voltage (OCV) curve vs SOC (0 to 100%).
        """
        s = max(0.0, min(100.0, soc)) / 100.0
        # Smooth electrochemical empirical OCV model
        base_v = 3.38 + 0.65 * s + 0.17 * (s ** 2)
        if s > 0.85:
            base_v += (s - 0.85) * 0.45
        if s < 0.15:
            base_v -= (0.15 - s) * 0.95
        return round(max(3.00, min(4.22, base_v)), 4)

    @staticmethod
    def calculate_pack_state(
        soc: float,
        soh: float,
        current: float, # Positive = discharging, Negative = charging
        ambient_temp: float,
        prev_temp: float,
        scenario: str,
        cell_resistances: List[float],
        cell_offsets: List[float],
        time_step_sec: float = 1.0
    ) -> Dict:
        norm_scen = BatteryPhysicsModel.normalize_scenario_name(scenario)
        base_ocv = BatteryPhysicsModel.soc_to_ocv_cell(soc)
        
        temp_stress = 0.0
        imbalance_multiplier = [1.0, 1.0, 1.0, 1.0]
        
        if norm_scen == "THERMAL STRESS":
            temp_stress = 18.0
        elif norm_scen == "CELL IMBALANCE":
            imbalance_multiplier = [0.99, 1.01, 0.91, 1.00]
        elif norm_scen == "AGING":
            imbalance_multiplier = [0.96, 0.98, 0.94, 0.97]
        elif norm_scen == "MULTI-FAULT":
            temp_stress = 16.5
            imbalance_multiplier = [0.98, 1.01, 0.89, 0.99]

        cell_voltages = []
        cell_temps = []
        cell_statuses = []
        cell_healths = []
        effective_resistances = []
        
        for i in range(4):
            r_mohm = cell_resistances[i]
            if (norm_scen in ["CELL IMBALANCE", "MULTI-FAULT"]) and i == 2:
                r_mohm *= 2.4 # Cell 3 exhibits higher internal resistance
            elif norm_scen == "AGING":
                r_mohm *= 1.65
            
            effective_resistances.append(round(r_mohm, 1))
            r_ohm = r_mohm / 1000.0
            v_drop = current * r_ohm
            
            c_offset = cell_offsets[i] * imbalance_multiplier[i]
            noise = (random.random() - 0.5) * 0.003
            
            v_cell = base_ocv - v_drop + c_offset + noise
            v_cell = round(max(2.75, min(4.25, v_cell)), 3)
            cell_voltages.append(v_cell)
            
            c_temp = prev_temp + (i * 0.35 - 0.5) + (temp_stress * 0.22)
            c_temp += (random.random() - 0.5) * 0.15
            cell_temps.append(round(c_temp, 1))
            
            c_health = round(soh * (0.94 if i == 2 and norm_scen in ["CELL IMBALANCE", "MULTI-FAULT"] else 1.0) + (random.random() - 0.5) * 0.4, 1)
            c_health = max(50.0, min(100.0, c_health))
            cell_healths.append(c_health)

        pack_voltage = round(sum(cell_voltages), 2)
        power = round(pack_voltage * current, 2)
        
        max_v = max(cell_voltages)
        min_v = min(cell_voltages)
        spread_mv = round((max_v - min_v) * 1000.0, 1)
        
        # Determine cell statuses
        for i in range(4):
            dev_from_mean = abs(cell_voltages[i] - (pack_voltage / 4.0)) * 1000.0
            if dev_from_mean > 65.0 or cell_temps[i] > 48.0:
                cell_statuses.append("Critical")
            elif dev_from_mean > 30.0 or cell_temps[i] > 40.0:
                cell_statuses.append("Warning")
            else:
                cell_statuses.append("Normal")

        # Thermal evolution (Joule heating + ambient dissipation)
        r_pack_ohm = sum(effective_resistances) / 1000.0
        q_gen = (current ** 2) * r_pack_ohm
        
        c_thermal = 350.0
        h_dissipation = 2.2
        target_ambient = ambient_temp + temp_stress
        
        delta_q = q_gen - h_dissipation * (prev_temp - target_ambient)
        delta_temp = (delta_q / c_thermal) * time_step_sec
        new_temp = round(prev_temp + delta_temp + (random.random() - 0.5) * 0.05, 1)
        new_temp = max(15.0, min(75.0, new_temp))

        return {
            "cell_voltages": cell_voltages,
            "cell_temperatures": cell_temps,
            "cell_statuses": cell_statuses,
            "cell_healths": cell_healths,
            "effective_resistances": effective_resistances,
            "pack_voltage": pack_voltage,
            "power": power,
            "temperature": new_temp,
            "spread_mv": spread_mv,
            "max_v": max_v,
            "min_v": min_v
        }
