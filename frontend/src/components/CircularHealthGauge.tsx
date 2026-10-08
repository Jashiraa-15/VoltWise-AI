import React from 'react';
import { ShieldCheck, Zap, Activity, BatteryCharging } from 'lucide-react';

interface CircularHealthGaugeProps {
  soh: number;
  status: 'Good' | 'Fair' | 'Degraded' | 'Critical';
  currentCapacity: number;
  originalCapacity: number;
  capacityRetention: number;
  degradationRate: number;
  totalCycles: number;
}

export const CircularHealthGauge: React.FC<CircularHealthGaugeProps> = ({
  soh,
  status,
  currentCapacity,
  originalCapacity,
  capacityRetention,
  degradationRate,
  totalCycles,
}) => {
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (soh / 100) * circumference;

  // Determine colors based on SOH
  let strokeColor = '#2563eb'; // Blue
  let statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  if (soh >= 85) {
    strokeColor = '#10b981'; // Emerald
    statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (soh >= 75) {
    strokeColor = '#2563eb'; // Blue
    statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (soh >= 65) {
    strokeColor = '#f59e0b'; // Amber
    statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else {
    strokeColor = '#ef4444'; // Red
    statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Battery Health Condition
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Electrochemical State of Health (SOH) & Capacity Diagnostics
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass}`}>
          Status: {status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Circular Gauge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg height="176" width="176" className="rotate-[-90deg] transform">
              {/* Background Circle */}
              <circle
                stroke="#f1f5f9"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx="88"
                cy="88"
              />
              {/* Progress Circle */}
              <circle
                stroke={strokeColor}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx="88"
                cy="88"
              />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                State of Health
              </span>
              <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight my-0.5">
                {soh}%
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {status} Health
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 text-center">
            Tested across {totalCycles} full charge-discharge cycles
          </span>
        </div>

        {/* Right: Metrics Grid */}
        <div className="lg:col-span-7 grid grid-cols-2 gap-3.5">
          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <BatteryCharging className="w-4 h-4 text-blue-600" />
              Current Capacity
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">
              {currentCapacity} <span className="text-xs font-normal text-slate-500">Ah</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Usable discharge energy</div>
          </div>

          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Zap className="w-4 h-4 text-slate-500" />
              Original Capacity
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">
              {originalCapacity} <span className="text-xs font-normal text-slate-500">Ah</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Factory nominal rating</div>
          </div>

          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Activity className="w-4 h-4 text-indigo-600" />
              Capacity Retention
            </div>
            <div className="text-xl font-bold font-mono text-indigo-600">
              {capacityRetention}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Remaining pack integrity</div>
          </div>

          <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-1">
              <Activity className="w-4 h-4 text-amber-600" />
              Degradation Rate
            </div>
            <div className="text-xl font-bold font-mono text-amber-600">
              {degradationRate}% <span className="text-xs font-normal text-slate-500">/ 100 cyc</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Aging velocity index</div>
          </div>
        </div>
      </div>
    </div>
  );
};
