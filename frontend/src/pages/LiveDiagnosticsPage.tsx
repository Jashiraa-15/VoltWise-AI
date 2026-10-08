import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Gauge,
  Thermometer,
  Layers,
  Clock,
  Radio,
  RefreshCw,
  TrendingUp,
  BatteryCharging,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TelemetryData, BatteryOverview } from '../types';

interface LiveDiagnosticsPageProps {
  battery: BatteryOverview | null;
  telemetry: TelemetryData | null;
}

export const LiveDiagnosticsPage: React.FC<LiveDiagnosticsPageProps> = ({
  battery,
  telemetry,
}) => {
  const [streamBuffer, setStreamBuffer] = useState<any[]>([]);

  useEffect(() => {
    if (!telemetry) return;
    const nowStr = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setStreamBuffer((prev) => {
      const nextPoint = {
        time: nowStr,
        voltage: telemetry.pack_voltage,
        current: telemetry.current,
        power: telemetry.power,
        temperature: telemetry.temperature,
        spread: telemetry.cell_voltage_spread_mv,
      };
      const updated = [...prev, nextPoint];
      if (updated.length > 25) {
        return updated.slice(updated.length - 25);
      }
      return updated;
    });
  }, [telemetry]);

  const bId = battery?.battery_id || 'VW-EV-001';
  const energyWh = telemetry?.energy_wh ?? battery?.energy_wh ?? 510.0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Live High-Frequency Telemetry Stream
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Live Sensor Ingestion Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Synchronized bus stream across pack & 4S cell series for <span className="font-mono font-semibold text-slate-700">{bId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Ingest Timestamp: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* 4 Key Real-time Metric Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pack Voltage Gauge */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Pack Voltage</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
            {telemetry?.pack_voltage ?? 15.92}{' '}
            <span className="text-sm font-normal text-slate-500">V</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, (((telemetry?.pack_voltage ?? 15.92) - 12.0) / (16.8 - 12.0)) * 100)
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Min 12.0V</span>
            <span>Max 16.8V</span>
          </div>
        </div>

        {/* Current Gauge */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Pack Current</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-slate-900 mt-2">
            {telemetry?.current ?? 4.2}{' '}
            <span className="text-sm font-normal text-slate-500">A</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, (Math.abs(telemetry?.current ?? 4.2) / 40.0) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0 A</span>
            <span>40 A Max</span>
          </div>
        </div>

        {/* Power & Energy Gauge */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Power & Energy</span>
            <Gauge className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-purple-600 mt-2">
            {telemetry?.power ?? 66.86}{' '}
            <span className="text-sm font-normal text-slate-500">W</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, ((telemetry?.power ?? 66.86) / 600.0) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Available: {energyWh} Wh</span>
            <span>600W Limit</span>
          </div>
        </div>

        {/* Core Temperature */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Core Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-600 mt-2">
            {telemetry?.temperature ?? 31.4}{' '}
            <span className="text-sm font-normal text-slate-500">°C</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, (((telemetry?.temperature ?? 31.4) - 15) / (65 - 15)) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>15°C Ambient</span>
            <span>65°C Cutoff</span>
          </div>
        </div>
      </div>

      {/* Real-Time Waveform Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voltage Waveform */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pack Voltage Waveform (V)</h3>
              <p className="text-xs text-slate-500">Real-time voltage response</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {telemetry?.pack_voltage ?? 15.92} V
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={streamBuffer}>
                <defs>
                  <linearGradient id="voltageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="voltage"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#voltageGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current & Power Waveform */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dynamic Current (A) & Power (W)</h3>
              <p className="text-xs text-slate-500">Load profile variation</p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {telemetry?.current ?? 4.2} A | {telemetry?.power ?? 66.86} W
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={streamBuffer}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="current"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  name="Current (A)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="power"
                  stroke="#9333ea"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  name="Power (W)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cell Stream Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            Live 4S Cell Telemetry Stream
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Delta Spread: <strong className="text-slate-900">{telemetry?.cell_voltage_spread_mv ?? 70.0} mV</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase font-semibold">
                <th className="py-3 px-4">Cell Channel</th>
                <th className="py-3 px-4">Live Voltage</th>
                <th className="py-3 px-4">Core Temperature</th>
                <th className="py-3 px-4">Internal Resistance</th>
                <th className="py-3 px-4">Relative Health</th>
                <th className="py-3 px-4">Diagnostic Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(telemetry?.cells || [
                { cell_number: 1, voltage: 4.01, temperature: 29.8, internal_resistance_mohm: 18.2, relative_health_pct: 98.5, status: 'Normal' },
                { cell_number: 2, voltage: 4.00, temperature: 30.1, internal_resistance_mohm: 18.5, relative_health_pct: 98.0, status: 'Normal' },
                { cell_number: 3, voltage: 3.94, temperature: 31.0, internal_resistance_mohm: 19.8, relative_health_pct: 96.0, status: 'Warning' },
                { cell_number: 4, voltage: 3.99, temperature: 30.2, internal_resistance_mohm: 18.3, relative_health_pct: 98.2, status: 'Normal' },
              ]).map((c) => (
                <tr key={c.cell_number} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800">
                    Cell 0{c.cell_number} (4S Series)
                  </td>
                  <td className="py-3 px-4 font-mono font-extrabold text-blue-600 text-sm">
                    {c.voltage} V
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {c.temperature} °C
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {c.internal_resistance_mohm} mΩ
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-600 font-bold">
                    {c.relative_health_pct}%
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        c.status === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : c.status === 'Warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
