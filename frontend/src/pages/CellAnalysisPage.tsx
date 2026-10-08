import React, { useState, useEffect } from 'react';
import {
  Layers,
  Activity,
  Thermometer,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Info,
  CheckCircle,
  XCircle,
  Network,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { CellAnalysis, CellCompatibilityResponse, BatteryOverview } from '../types';
import { api } from '../services/api';

interface CellAnalysisPageProps {
  battery: BatteryOverview | null;
  cells: CellAnalysis | null;
}

export const CellAnalysisPage: React.FC<CellAnalysisPageProps> = ({
  battery,
  cells,
}) => {
  const bId = battery?.battery_id || 'VW-EV-001';
  const [compatibility, setCompatibility] = useState<CellCompatibilityResponse | null>(null);

  useEffect(() => {
    api.getCellCompatibility(bId)
      .then(setCompatibility)
      .catch((err) => console.warn('Compatibility fetch error:', err));
  }, [bId]);

  const cellList = cells?.cells || [
    { cell_number: 1, voltage: 4.01, temperature: 29.8, internal_resistance_mohm: 18.2, relative_health_pct: 98.5, status: 'Normal' },
    { cell_number: 2, voltage: 4.00, temperature: 30.1, internal_resistance_mohm: 18.5, relative_health_pct: 98.0, status: 'Normal' },
    { cell_number: 3, voltage: 3.94, temperature: 31.0, internal_resistance_mohm: 19.8, relative_health_pct: 96.0, status: 'Warning' },
    { cell_number: 4, voltage: 3.99, temperature: 30.2, internal_resistance_mohm: 18.3, relative_health_pct: 98.2, status: 'Normal' },
  ];

  const spreadMv = cells?.spread_mv ?? 70.0;
  const spreadStatus = cells?.spread_status ?? 'Warning';
  const maxV = cells?.max_voltage ?? 4.01;
  const minV = cells?.min_voltage ?? 3.94;

  const chartData = cellList.map((c) => ({
    name: `Cell ${c.cell_number}`,
    voltage: c.voltage,
    temperature: c.temperature,
    resistance: c.internal_resistance_mohm,
    health: c.relative_health_pct,
    status: c.status,
  }));

  const spreadBadgeClasses = {
    Normal: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Warning: 'bg-amber-100 text-amber-800 border-amber-300',
    Critical: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const barColors = {
    Normal: '#2563eb', // Blue
    Warning: '#f59e0b', // Amber
    Critical: '#ef4444', // Red
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              4-Cell Series Micro-Diagnostics & Compatibility Analysis
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${spreadBadgeClasses[spreadStatus]}`}>
              Spread: {spreadMv} mV ({spreadStatus})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time cell balancing, voltage divergence, and pairwise compatibility for <span className="font-mono font-semibold text-slate-700">{bId}</span>
          </p>
        </div>
      </div>

      {/* Spread Calculation KPI Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-blue-800/40">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              Cell Voltage Spread
            </span>
            <div className="text-3xl font-extrabold font-mono text-white mt-1">
              {spreadMv} <span className="text-sm font-normal text-blue-200">mV</span>
            </div>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${spreadBadgeClasses[spreadStatus]}`}>
              Status: {spreadStatus}
            </span>
          </div>

          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-xs text-blue-200">Maximum Cell</span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {maxV} V
            </div>
            <span className="text-[11px] text-blue-300">Upper voltage rail</span>
          </div>

          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-xs text-blue-200">Minimum Cell</span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {minV} V
            </div>
            <span className="text-[11px] text-blue-300">Lower voltage sag</span>
          </div>

          <div className="p-3 bg-white/10 rounded-xl border border-white/10">
            <span className="text-xs text-blue-200">Spread Formula</span>
            <div className="text-xs font-mono text-white font-semibold mt-1">
              Max - Min = ({maxV}V - {minV}V)
            </div>
            <span className="text-[11px] text-emerald-300 font-semibold">= {spreadMv} mV Delta</span>
          </div>
        </div>
      </div>

      {/* 4 Cells Detailed Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cellList.map((c) => (
          <div
            key={c.cell_number}
            className={`bg-white rounded-2xl p-5 border shadow-xs transition-all ${
              c.status === 'Critical'
                ? 'border-rose-300 ring-2 ring-rose-500/20'
                : c.status === 'Warning'
                ? 'border-amber-300 ring-2 ring-amber-500/20'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cell 0{c.cell_number}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  c.status === 'Critical'
                    ? 'bg-rose-100 text-rose-800'
                    : c.status === 'Warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {c.status}
              </span>
            </div>

            {/* Voltage */}
            <div className="mb-4">
              <span className="text-[11px] text-slate-400 font-medium">Voltage</span>
              <div className="text-2xl font-extrabold font-mono text-slate-900 mt-0.5">
                {c.voltage}{' '}
                <span className="text-xs font-normal text-slate-500">V</span>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                  Temperature:
                </span>
                <span className="font-mono font-bold text-slate-800">{c.temperature} °C</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  Internal IR:
                </span>
                <span className="font-mono font-bold text-slate-800">{c.internal_resistance_mohm} mΩ</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Relative Health:
                </span>
                <span className="font-mono font-bold text-emerald-600">{c.relative_health_pct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar Chart Comparing 4 Cell Voltages */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Cell Voltage Comparison Bar Chart (V)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-resolution delta inspection across all 4 series cells
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-blue-600" /> Nominal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-500" /> Divergent
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[3.5, 4.3]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '11px',
                }}
                formatter={(val: any) => [`${val} V`, 'Voltage']}
              />
              <ReferenceLine y={4.0} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '4.00V Baseline', fill: '#94a3b8', fontSize: 10 }} />
              <Bar dataKey="voltage" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={barColors[entry.status as keyof typeof barColors] || '#2563eb'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 font-semibold">Diagnostic Assessment:</strong>{' '}
            {cells?.diagnostic_summary || `Spread: ${spreadMv} mV. Imbalance tolerance within allowable limits.`}
          </div>
        </div>
      </div>

      {/* NEW: Cell Compatibility & Pairwise Match Matrix */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-600" />
              Cell Pairwise Compatibility Matrix & Clustering
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-parameter electrochemical similarity screening for second-life pack balancing
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Pack Homogeneity: {compatibility?.overall_pack_homogeneity_pct ?? 94.2}%
          </span>
        </div>

        {/* Compatible Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(compatibility?.compatible_groups || [
            {
              group_name: 'Group Alpha (Primary Tier)',
              cells: [1, 2, 4],
              compatibility_score_pct: 98.2,
              recommended_usage: 'Direct 3S Repurposing for Low-Speed Mobility or Telecom Backup',
              notes: 'High internal impedance homogeneity (<1.5 mΩ delta). Highly stable.'
            },
            {
              group_name: 'Group Beta (Isolated / Recondition)',
              cells: [3],
              compatibility_score_pct: 72.0,
              recommended_usage: 'Single Cell Pulse Reconditioning or Material Recycling',
              notes: 'Cell 3 exhibits impedance divergence and requires individual active balancing.'
            }
          ]).map((grp, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{grp.group_name}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  {grp.compatibility_score_pct}% Match
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Group Members:</span>
                {grp.cells.map((cn) => (
                  <span key={cn} className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono text-xs font-bold">
                    Cell 0{cn}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-700 font-medium">{grp.recommended_usage}</p>
              <p className="text-[11px] text-slate-400">{grp.notes}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{compatibility?.disclaimer || 'Software compatibility screening does not substitute for certified physical cell isolation and thermal impedance testing.'}</span>
        </div>
      </div>
    </div>
  );
};
