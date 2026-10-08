import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.database.session import Base, engine
from backend.app.database.seed import seed_database
from backend.app.simulator.engine import simulation_engine
from backend.app.api.routes_batteries import router as batteries_router
from backend.app.api.routes_simulation import router as simulation_router

# Background task for auto-ticking simulation
simulation_task = None

async def run_simulation_loop():
    """Background continuous simulation loop."""
    print("VoltWise AI Simulation Engine started in background.")
    try:
        while True:
            if simulation_engine.is_running:
                simulation_engine.tick()
            # Tick every 1.5 seconds / speed
            sleep_sec = max(0.2, 1.5 / max(0.1, simulation_engine.speed))
            await asyncio.sleep(sleep_sec)
    except asyncio.CancelledError:
        print("Simulation loop stopped.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed baseline data
    Base.metadata.create_all(bind=engine)
    seed_database()
    
    # Start background simulation loop
    loop_task = asyncio.create_task(run_simulation_loop())
    yield
    # Shutdown
    loop_task.cancel()
    try:
        await loop_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="VoltWise AI",
    description="Intelligent EV Battery Diagnostics and Lifecycle Decision Support System API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for local development and Vercel cloud deployment
frontend_env_url = os.getenv("FRONTEND_URL", "").strip()
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if frontend_env_url:
    allowed_origins.append(frontend_env_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if frontend_env_url else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app" if frontend_env_url else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(batteries_router)
app.include_router(simulation_router)

@app.get("/")
def root():
    return {
        "system": "VoltWise AI",
        "description": "Intelligent EV Battery Diagnostics & Lifecycle Intelligence",
        "version": "1.0.0",
        "status": "Online",
        "documentation": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "simulation_running": simulation_engine.is_running,
        "active_scenario": simulation_engine.scenario,
        "speed": simulation_engine.speed,
        "active_battery": simulation_engine.active_battery_id,
        "database": "connected"
    }
