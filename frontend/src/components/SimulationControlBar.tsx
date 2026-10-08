import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Cpu, Radio, Sparkles, AlertTriangle } from 'lucide-react';
import { ScenarioType, SimulationStatus } from '../types';

interface SimulationControlBarProps {
  status: SimulationStatus | null;
  onControl: (action: 'start' | 'pause' | 'reset' | 'step', speed?: number, scenario?: ScenarioType) => void;
  onScenarioChange: (scenario: ScenarioType) => void;
}

const SCENARIOS: { label: ScenarioType; name: string; desc: string; isFault?: boolean }[] = [
  { label: 'Normal Operation', name: 'NORMAL', desc: 'Balanced 4S cells (<25mV spread), nominal thermal dissipation, stable SOH.' },
  { label: 'Aging Battery', name: 'AGING', desc: 'Pack with 940+ cycles, elevated baseline impedance, SOH ~72%, reduced RUL.' },
  { label: 'Cell Imbalance', name: 'CELL IMBALANCE', desc: 'Cell 3 internal resistance rises causing >75mV dynamic spread & warning alert.', isFault: true },
  { label: 'High Temperature', name: 'THERMAL STRESS', desc: 'Ambient stress (39.5°C) driving core pack temp >48°C and thermal anomaly flags.', isFault: true },
  { label: 'High Current', name: 'HIGH CURRENT', desc: 'High dynamic discharge spikes (24-38A) causing power surge (>500W) and load sag.', isFault: true },
  { label: 'Rapid Degradation', name: 'RAPID DEGRADATION', desc: 'Accelerated capacity loss rate (>3.5%/100 cyc) simulating severe cycle stress.', isFault: true },
  { label: 'Multi-Fault', name: 'MULTI-FAULT', desc: 'Combined high thermal (>48°C) + severe cell 3 imbalance (>90mV) + load spikes + rapid fade.', isFault: true },
];

export const SimulationControlBar: React.FC<SimulationControlBarProps> = ({
  status,
  onControl,
  onScenarioChange,
}) => {
  const isRunning = status?.is_running ?? true;
  const currentScenario = (status?.scenario as ScenarioType) || 'Normal Operation';
  const currentSpeed = status?.speed ?? 1.0;

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-blue-800/40">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Mode Title and Status */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-300">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                Simulation Engine Active
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Tick #{status?.tick_count ?? 0}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Active Scenario: <span className="font-semibold text-white">{currentScenario}</span>
            </p>
          </div>
        </div>

        {/* Center: Scenario Selector */}
        <div className="flex-1 max-w-md">
          <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Select Operational Simulation Scenario:
          </label>
          <select
            value={currentScenario}
            onChange={(e) => onScenarioChange(e.target.value as ScenarioType)}
            className="w-full bg-slate-800/95 text-white text-xs rounded-xl border border-slate-700 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
          >
            {SCENARIOS.map((s) => (
              <option key={s.label} value={s.label} className="bg-slate-900 text-white">
                {s.isFault ? '⚠️ ' : '✅ '}{s.label} — {s.desc.slice(0, 48)}...
              </option>
            ))}
          </select>
        </div>

        {/* Right: Controls & Speed */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Play/Pause */}
          <button
            onClick={() => onControl(isRunning ? 'pause' : 'start')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isRunning
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                : 'bg-emerald-400 hover:bg-emerald-500 text-slate-950'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Start
              </>
            )}
          </button>

          {/* Reset */}
          <button
            onClick={() => onControl('reset')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title="Reset telemetry baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>

          {/* Step Tick */}
          <button
            onClick={() => onControl('step')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title="Advance 1 simulation step"
          >
            <FastForward className="w-3.5 h-3.5" /> Step
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700">
            {[0.5, 1.0, 2.0, 5.0].map((spd) => (
              <button
                key={spd}
                onClick={() => onControl('start', spd)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  currentSpeed === spd
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
