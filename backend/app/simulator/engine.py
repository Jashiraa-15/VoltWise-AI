import asyncio
import datetime
import math
import random
import threading
import time
from typing import Dict, List, Optional
from backend.app.database.session import SessionLocal
from backend.app.models.battery import Battery, Telemetry, CellMeasurement, HealthHistory, RiskEvent, LifecycleDecision
from backend.app.simulator.battery_physics import BatteryPhysicsModel

class BatteryState:
    def __init__(
        self,
        battery_id: str,
        soc: float,
        soh: float,
        cycle_count: int,
        nominal_capacity: float,
        current_capacity: float,
        temp: float,
        cell_resistances: List[float],
        cell_offsets: List[float]
    ):
        self.battery_id = battery_id
        self.soc = soc
        self.soh = soh
        self.cycle_count = cycle_count
        self.nominal_capacity = nominal_capacity
        self.current_capacity = current_capacity
        self.temperature = temp
        self.cell_resistances = cell_resistances
        self.cell_offsets = cell_offsets
        self.current = 4.2
        self.energy_wh = round(14.8 * current_capacity * (soc / 100.0), 1)
        self.last_telemetry: Optional[Dict] = None

class SimulationEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SimulationEngine, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        self.is_running = True
        self.speed = 1.0
        self.scenario = "Normal Operation"
        self.active_battery_id = "VW-EV-001"
        self.tick_count = 0
        self.last_update = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        self.battery_states: Dict[str, BatteryState] = {
            "VW-EV-001": BatteryState(
                battery_id="VW-EV-001",
                soc=68.0,
                soh=84.0,
                cycle_count=428,
                nominal_capacity=51.0,
                current_capacity=42.8,
                temp=31.4,
                cell_resistances=[18.2, 18.5, 19.8, 18.3],
                cell_offsets=[0.02, 0.01, -0.05, 0.00]
            ),
            "VW-EV-002": BatteryState(
                battery_id="VW-EV-002",
                soc=54.0,
                soh=78.2,
                cycle_count=680,
                nominal_capacity=51.0,
                current_capacity=39.8,
                temp=34.6,
                cell_resistances=[24.0, 23.5, 38.0, 24.2],
                cell_offsets=[0.03, 0.02, -0.09, 0.01]
            ),
            "VW-EV-003": BatteryState(
                battery_id="VW-EV-003",
                soc=42.0,
                soh=71.8,
                cycle_count=942,
                nominal_capacity=51.0,
                current_capacity=36.6,
                temp=37.8,
                cell_resistances=[32.0, 31.5, 35.0, 33.0],
                cell_offsets=[0.01, -0.02, -0.04, 0.02]
            )
        }
        
        self.generate_initial_tick()

    def generate_initial_tick(self):
        for b_id in self.battery_states.keys():
            self._compute_state_for_battery(b_id, is_init=True)

    def _compute_state_for_battery(self, battery_id: str, is_init: bool = False) -> Dict:
        state = self.battery_states[battery_id]
        norm_scen = BatteryPhysicsModel.normalize_scenario_name(self.scenario)
        
        # Calculate load current based on scenario
        if norm_scen in ["HIGH CURRENT", "MULTI-FAULT"]:
            target_current = 24.0 + math.sin(self.tick_count * 0.4) * 11.0 + random.uniform(-1.5, 2.5)
        elif norm_scen == "THERMAL STRESS":
            target_current = 7.2 + math.sin(self.tick_count * 0.2) * 2.2
        elif norm_scen == "AGING" and battery_id == "VW-EV-003":
            target_current = 5.2 + math.cos(self.tick_count * 0.1) * 1.5
        else:
            target_current = 4.2 + math.sin(self.tick_count * 0.25) * 1.8 + random.uniform(-0.3, 0.3)
            if self.tick_count % 20 == 0:
                target_current = -2.5 # Regen braking
        
        state.current = round(target_current, 2)
        
        # SOC decrement / charge
        delta_t = 1.0 * self.speed
        delta_soc = (state.current * delta_t) / (state.current_capacity * 3600.0) * 100.0
        state.soc = round(max(5.0, min(100.0, state.soc - delta_soc)), 2)
        
        # Auto-recharge cycle loop for continuous presentation
        if state.soc <= 15.0:
            state.soc = 85.0
            state.cycle_count += 1
            if norm_scen in ["RAPID DEGRADATION", "MULTI-FAULT"]:
                state.soh = round(max(45.0, state.soh - 0.18), 2)
            else:
                state.soh = round(max(45.0, state.soh - 0.02), 2)
            state.current_capacity = round(state.nominal_capacity * (state.soh / 100.0), 2)

        # Ambient temp
        ambient = 25.0
        if norm_scen in ["THERMAL STRESS", "MULTI-FAULT"]:
            ambient = 39.5

        # Electrochemical pack calculation
        phys = BatteryPhysicsModel.calculate_pack_state(
            soc=state.soc,
            soh=state.soh,
            current=state.current,
            ambient_temp=ambient,
            prev_temp=state.temperature,
            scenario=self.scenario,
            cell_resistances=state.cell_resistances,
            cell_offsets=state.cell_offsets,
            time_step_sec=delta_t
        )
        
        state.temperature = phys["temperature"]
        state.energy_wh = round(phys["pack_voltage"] * state.current_capacity * (state.soc / 100.0), 1)
        
        telemetry_dict = {
            "battery_id": battery_id,
            "timestamp": datetime.datetime.now(datetime.timezone.utc),
            "pack_voltage": phys["pack_voltage"],
            "current": state.current,
            "power": phys["power"],
            "energy_wh": state.energy_wh,
            "temperature": phys["temperature"],
            "soc": state.soc,
            "soh": state.soh,
            "cycle_count": state.cycle_count,
            "cell_voltage_spread_mv": phys["spread_mv"],
            "ambient_temp": ambient,
            "is_simulated": True,
            "cells": [
                {
                    "cell_number": i + 1,
                    "voltage": phys["cell_voltages"][i],
                    "temperature": phys["cell_temperatures"][i],
                    "internal_resistance_mohm": phys["effective_resistances"][i],
                    "relative_health_pct": phys["cell_healths"][i],
                    "status": phys["cell_statuses"][i]
                }
                for i in range(4)
            ]
        }
        state.last_telemetry = telemetry_dict
        return telemetry_dict

    def tick(self):
        """Advances simulation by 1 step for all batteries."""
        self.tick_count += 1
        self.last_update = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        for b_id in self.battery_states.keys():
            self._compute_state_for_battery(b_id)

    def get_telemetry(self, battery_id: str) -> Optional[Dict]:
        if battery_id not in self.battery_states:
            return None
        state = self.battery_states[battery_id]
        if state.last_telemetry is None:
            self._compute_state_for_battery(battery_id)
        return state.last_telemetry

    def update_external_telemetry(
        self,
        battery_id: str,
        cell_voltages: List[float],
        pack_voltage: float,
        current: float,
        temperature: float,
        soc: Optional[float] = None,
        soh: Optional[float] = None,
        ambient_temp: float = 25.0
    ) -> Dict:
        """
        Receives real ESP32 / BMS telemetry (hardware ingest), calculates physics & analytics,
        and seamlessly updates active state.
        """
        if battery_id not in self.battery_states:
            self.battery_states[battery_id] = BatteryState(
                battery_id=battery_id,
                soc=soc if soc is not None else 70.0,
                soh=soh if soh is not None else 85.0,
                cycle_count=100,
                nominal_capacity=51.0,
                current_capacity=43.0,
                temp=temperature,
                cell_resistances=[20.0, 20.0, 20.0, 20.0],
                cell_offsets=[0.0, 0.0, 0.0, 0.0]
            )
        
        state = self.battery_states[battery_id]
        state.temperature = temperature
        state.current = current
        if soc is not None:
            state.soc = soc
        if soh is not None:
            state.soh = soh

        max_v = max(cell_voltages)
        min_v = min(cell_voltages)
        spread_mv = round((max_v - min_v) * 1000.0, 1)
        power = round(pack_voltage * current, 2)
        state.energy_wh = round(pack_voltage * state.current_capacity * (state.soc / 100.0), 1)

        cell_list = []
        for i, v in enumerate(cell_voltages):
            dev = abs(v - (pack_voltage / 4.0)) * 1000.0
            status = "Critical" if dev > 65 or temperature > 48 else ("Warning" if dev > 30 or temperature > 40 else "Normal")
            cell_list.append({
                "cell_number": i + 1,
                "voltage": round(v, 3),
                "temperature": round(temperature + (i * 0.2 - 0.3), 1),
                "internal_resistance_mohm": 20.0,
                "relative_health_pct": round(state.soh, 1),
                "status": status
            })

        telemetry_dict = {
            "battery_id": battery_id,
            "timestamp": datetime.datetime.now(datetime.timezone.utc),
            "pack_voltage": round(pack_voltage, 2),
            "current": round(current, 2),
            "power": power,
            "energy_wh": state.energy_wh,
            "temperature": round(temperature, 1),
            "soc": state.soc,
            "soh": state.soh,
            "cycle_count": state.cycle_count,
            "cell_voltage_spread_mv": spread_mv,
            "ambient_temp": ambient_temp,
            "is_simulated": False,
            "cells": cell_list
        }
        state.last_telemetry = telemetry_dict
        return telemetry_dict

    def set_control(self, action: str, speed: Optional[float] = None, scenario: Optional[str] = None, battery_id: Optional[str] = None):
        if action == "start":
            self.is_running = True
        elif action == "pause":
            self.is_running = False
        elif action == "reset":
            self.tick_count = 0
            self.battery_states["VW-EV-001"] = BatteryState(
                battery_id="VW-EV-001",
                soc=68.0,
                soh=84.0,
                cycle_count=428,
                nominal_capacity=51.0,
                current_capacity=42.8,
                temp=31.4,
                cell_resistances=[18.2, 18.5, 19.8, 18.3],
                cell_offsets=[0.02, 0.01, -0.05, 0.00]
            )
            self.battery_states["VW-EV-002"] = BatteryState(
                battery_id="VW-EV-002",
                soc=54.0,
                soh=78.2,
                cycle_count=680,
                nominal_capacity=51.0,
                current_capacity=39.8,
                temp=34.6,
                cell_resistances=[24.0, 23.5, 38.0, 24.2],
                cell_offsets=[0.03, 0.02, -0.09, 0.01]
            )
            self.battery_states["VW-EV-003"] = BatteryState(
                battery_id="VW-EV-003",
                soc=42.0,
                soh=71.8,
                cycle_count=942,
                nominal_capacity=51.0,
                current_capacity=36.6,
                temp=37.8,
                cell_resistances=[32.0, 31.5, 35.0, 33.0],
                cell_offsets=[0.01, -0.02, -0.04, 0.02]
            )
            self.generate_initial_tick()
        elif action == "step":
            self.tick()

        if speed is not None and speed > 0:
            self.speed = speed
        if scenario:
            self.scenario = scenario
        if battery_id and battery_id in self.battery_states:
            self.active_battery_id = battery_id

simulation_engine = SimulationEngine()
