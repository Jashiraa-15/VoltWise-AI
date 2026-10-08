import datetime
from fastapi import APIRouter
from backend.app.schemas.battery import SimulationControlRequest, SimulationStatusResponse
from backend.app.simulator.engine import simulation_engine

router = APIRouter(prefix="/api/simulation", tags=["Simulation Engine"])

@router.get("/status", response_model=SimulationStatusResponse)
def get_simulation_status():
    """Get real-time simulation runtime status, active scenario, speed, and tick count."""
    return SimulationStatusResponse(
        is_running=simulation_engine.is_running,
        speed=simulation_engine.speed,
        scenario=simulation_engine.scenario,
        active_battery_id=simulation_engine.active_battery_id,
        tick_count=simulation_engine.tick_count,
        last_update=simulation_engine.last_update
    )

@router.post("/control", response_model=SimulationStatusResponse)
def control_simulation(payload: SimulationControlRequest):
    """Start, Pause, Reset, Change Speed, or Change Scenario."""
    simulation_engine.set_control(
        action=payload.action,
        speed=payload.speed,
        scenario=payload.scenario,
        battery_id=payload.battery_id
    )
    return SimulationStatusResponse(
        is_running=simulation_engine.is_running,
        speed=simulation_engine.speed,
        scenario=simulation_engine.scenario,
        active_battery_id=simulation_engine.active_battery_id,
        tick_count=simulation_engine.tick_count,
        last_update=simulation_engine.last_update
    )

@router.post("/tick", response_model=SimulationStatusResponse)
def step_simulation_tick():
    """Manually step simulation by 1 tick."""
    simulation_engine.tick()
    return SimulationStatusResponse(
        is_running=simulation_engine.is_running,
        speed=simulation_engine.speed,
        scenario=simulation_engine.scenario,
        active_battery_id=simulation_engine.active_battery_id,
        tick_count=simulation_engine.tick_count,
        last_update=simulation_engine.last_update
    )
