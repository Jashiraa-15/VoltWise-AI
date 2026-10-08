# VoltWise AI: Intelligent EV Battery Diagnostics & Lifecycle Decision Support System

[![Prototype](https://img.shields.io/badge/System-VoltWise%20AI%20v1.0-blue.svg)](https://github.com/voltwise/voltwise-ai)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.13-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite-61DAFB.svg)](https://react.dev)
[![Hardware Ready](https://img.shields.io/badge/Hardware-ESP32%20%2F%20BMS%20Ready-success.svg)](#future-hardware-integration)

**VoltWise AI** is a professional software prototype and decision support platform engineered for electric vehicle (EV) battery diagnostics, real-time multi-cell health telemetry, predictive remaining useful life (RUL) estimation, and automated circular-economy second-life repurposing recommendations.

---

## 1. System Architecture

```
                                 [ESP32 / BMS Hardware Sensor Node] (Future Data Ingest)
                                                    │
                                                    ▼
[Real-Time Battery Physics Simulator] ───► POST /api/telemetry
                                                    │
                                                    ▼
                                          [FastAPI Python Backend]
                                                    │
                   ┌────────────────────────────────┼────────────────────────────────┐
                   ▼                                ▼                                ▼
         [Electrochemical Analytics]       [AI RUL Estimator]             [Lifecycle Decision Engine]
         - 4S Cell Spread Diagnostics      - 95% Confidence Forecast      - 1st-Life Fleet EV Advisor
         - Capacity Retention Index        - Multi-Phase Knee Aging       - 2nd-Life BESS Screening
         - Thermal Anomaly Detection       - 80% & 60% EOL Windows        - Hydrometallurgical Recycling
                   │                                │                                │
                   └────────────────────────────────┼────────────────────────────────┘
                                                    │
                                                    ▼
                                          [SQLite Database (WAL)]
                                                    │
                                                    ▼
                                  [React 19 + TypeScript Dashboard]
```

---

## 2. Key Features

- **Battery Intelligence Overview**: Real-time KPI summaries (SOC, SOH, RUL, Multi-Factor Risk Score, Pack Temperature, Cycle Count) with interactive status badges and health gauges.
- **Micro-Diagnostics 4-Cell Analysis**: Real-time voltage, core temperature, and internal resistance ($m\Omega$) across individual cells with automatic spread calculation ($\Delta V = \text{Max} - \text{Min}$ in mV) and condition thresholds (Normal $<30\text{mV}$, Warning $30\text{–}70\text{mV}$, Critical $>70\text{mV}$).
- **Degradation & Thermal Forecasting**: Interactive historical cycle degradation curves ($0\text{--}1200+$ cycles) overlaid with AI-predicted trajectories and thermal anomaly alerts ($>42^\circ\text{C}$).
- **Multi-Factor AI Risk Assessment**: Weighted risk index integrating thermal stress (30%), cell divergence (25%), electrochemical aging velocity (25%), and dynamic load sag (20%).
- **Second-Life Decision Support Matrix**: Evaluates battery packs for second-life stationary energy storage (BESS), low-speed urban mobility, or closed-loop hydrometallurgical material recycling.
- **Configurable Battery Simulator**: Realistic electrochemical physical models (SOC-OCV curves, Joule heating, internal resistance voltage drops, cell imbalance drift, regenerative braking) supporting 6 operational scenarios:
  1. *Normal Operation*
  2. *High Temperature*
  3. *Cell Imbalance*
  4. *Rapid Degradation*
  5. *High Current*
  6. *Aging Battery*
- **Future ESP32 / BMS Ingestion Ready**: Fully functional `POST /api/telemetry` endpoint supporting physical microcontroller hardware ingestion without application redesign.

---

## 3. Project Directory Structure

```
VoltWise AI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes_batteries.py     # Diagnostics, telemetry, history & ingest endpoints
│   │   │   └── routes_simulation.py    # Simulation scenario and speed control routes
│   │   ├── ai/
│   │   │   └── rul_estimator.py        # Physics-informed RUL forecasting algorithms
│   │   ├── analytics/
│   │   │   └── battery_analytics.py    # Capacity retention, degradation rate & cell spread
│   │   ├── database/
│   │   │   ├── session.py              # SQLite connection & SQLAlchemy sessionmaker
│   │   │   └── seed.py                 # Realistic demo data seeding routines
│   │   ├── decision_engine/
│   │   │   └── risk_and_lifecycle.py   # Multi-factor risk engine & repurposing advisor
│   │   ├── models/
│   │   │   └── battery.py              # SQLAlchemy DB models for batteries, cells & history
│   │   ├── schemas/
│   │   │   └── battery.py              # Pydantic schemas and hardware ingestion formats
│   │   ├── simulator/
│   │   │   ├── battery_physics.py      # Electrochemical OCV, Joule thermal & IR physics
│   │   │   └── engine.py               # Singleton multi-pack state manager & tick loop
│   │   └── main.py                     # FastAPI application entrypoint with background loop
├── frontend/
│   ├── src/
│   │   ├── components/                 # Reusable UI cards, gauges & navigation bars
│   │   ├── pages/                      # Overview, Diagnostics, Health, Cells, Risk, History
│   │   ├── services/                   # REST API client
│   │   ├── types/                      # TypeScript data models
│   │   ├── App.tsx                     # Main dashboard container & router
│   │   └── main.tsx                    # React DOM bootstrap
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── voltwise.db                     # SQLite database file (auto-generated)
└── README.md
```

---

## 4. Getting Started

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### Step 1: Start Backend API Server
Open a terminal in the project root:
```bash
# Seed database & launch FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will initialize the SQLite database at `data/voltwise.db`, start the real-time simulation background loop, and serve API documentation at `http://127.0.0.1:8000/docs`.

### Step 2: Start Frontend Web Dashboard
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your web browser. Click **"Instant Demo Access"** to immediately enter the dashboard.

---

## 5. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/batteries` | List all tracked battery packs with live operational summaries |
| `GET` | `/api/batteries/{id}` | Retrieve comprehensive KPI overview for selected unit |
| `GET` | `/api/batteries/{id}/telemetry` | Real-time high-frequency telemetry and 4-cell voltages |
| `GET` | `/api/batteries/{id}/cells` | 4-cell voltage, temperature, impedance, and spread diagnostics |
| `GET` | `/api/batteries/{id}/health` | SOH condition, capacity retention, and degradation rate |
| `GET` | `/api/batteries/{id}/temperature` | 24-hour thermal trend and anomaly thresholds |
| `GET` | `/api/batteries/{id}/degradation` | Historical and predicted degradation series |
| `GET` | `/api/batteries/{id}/rul` | Remaining Useful Life prediction and confidence intervals |
| `GET` | `/api/batteries/{id}/risk` | Multi-factor composite risk evaluation and active alerts |
| `GET` | `/api/batteries/{id}/lifecycle` | 1st-Life vs 2nd-Life BESS repurposing recommendation |
| `GET` | `/api/batteries/{id}/history` | Auditable historical logs with search, filter, and pagination |
| `POST` | `/api/telemetry` | **Hardware Ingestion Endpoint** (ESP32 / BMS integration) |
| `GET` | `/api/simulation/status` | Simulator running state, active scenario, and speed |
| `POST` | `/api/simulation/control` | Control simulation action (`start`, `pause`, `reset`, `step`) |

---

## 6. Future Hardware Integration (ESP32 / BMS)

To transition from the built-in simulator to physical hardware, configure your microcontroller (ESP32, Raspberry Pi Pico W, or automotive BMS ECU) to send HTTP POST requests to `/api/telemetry`.

### Expected Hardware JSON Payload:
```json
{
  "battery_id": "VW-EV-001",
  "timestamp": "2026-10-08T12:00:00Z",
  "cell_voltages": [4.01, 4.00, 3.94, 3.99],
  "pack_voltage": 15.92,
  "current": 4.2,
  "temperature": 31.4,
  "ambient_temp": 25.0
}
```
The backend automatically computes cell voltage spread, assigns health statuses, logs records into SQLite, and streams the updates to the connected frontend in real-time.

---

## 7. License & Attribution

Built for the **VoltWise AI Intelligent EV Battery Diagnostics & Lifecycle Intelligence System**.
