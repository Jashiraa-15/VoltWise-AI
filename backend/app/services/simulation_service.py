from typing import Dict, Any, Optional
from backend.app.simulator.engine import simulation_engine

class SimulationService:
    """
    Simulation Service:
    Manages physics simulation states, scenario transitions (NORMAL, AGING, CELL IMBALANCE,
    THERMAL STRESS, HIGH CURRENT, RAPID DEGRADATION, MULTI-FAULT), playback controls,
    and external hardware data synchronization.
    """

    @staticmethod
    def get_status() -> Dict[str, Any]:
        return {
            "is_running": simulation_engine.is_running,
            "speed": simulation_engine.speed,
            "scenario": simulation_engine.scenario,
            "tick_count": simulation_engine.tick_count,
            "active_battery_id": simulation_engine.active_battery_id
        }

    @staticmethod
    def control(
        action: Optional[str] = None,
        speed: Optional[float] = None,
        scenario: Optional[str] = None,
        battery_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if action == "start":
            simulation_engine.is_running = True
        elif action == "pause":
            simulation_engine.is_running = False
        elif action == "reset":
            simulation_engine.reset(battery_id or "VW-EV-001")
        elif action == "step":
            simulation_engine.step_once()

        if speed is not None:
            simulation_engine.speed = max(0.25, min(10.0, speed))

        if scenario is not None:
            simulation_engine.set_scenario(scenario)

        if battery_id is not None:
            simulation_engine.active_battery_id = battery_id

        return SimulationService.get_status()

    @staticmethod
    def get_telemetry(battery_id: str) -> Optional[Dict[str, Any]]:
        return simulation_engine.get_telemetry(battery_id)
