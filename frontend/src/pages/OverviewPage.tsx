import React from 'react';
import {
  BatteryCharging,
  HeartPulse,
  Clock,
  AlertTriangle,
  Thermometer,
  RotateCcw,
  Zap,
  Gauge,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Info,
  Brain,
  ShieldAlert,
  Sparkles,
  BarChart3,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  BatteryOverview,
  TelemetryData,
  HealthStatus,
  CellAnalysis,
  RiskScore,
  AnomalyListResponse,
  NavPage,
} from '../types';
import { KPICard } from '../components/KPICard';
import { CircularHealthGauge } from '../components/CircularHealthGauge';

interface OverviewPageProps {
  battery: BatteryOverview | null;
  batteries?: BatteryOverview[];
  telemetry: TelemetryData | null;
  health: HealthStatus | null;
  cells: CellAnalysis | null;
  risk: RiskScore | null;
  anomalies: AnomalyListResponse | null;
  onNavigate: (page: NavPage) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  battery,
  batteries = [],
  telemetry,
  health,
  cells,
  risk,
  anomalies,
  onNavigate,
}) => {
  const bId = battery?.battery_id || 'VW-EV-001';
  const soc = telemetry?.soc ?? battery?.soc ?? 68;
  const soh = telemetry?.soh ?? battery?.soh ?? 84;
  const rulMonths = battery?.rul_months ?? 18;
  const rulCycles = battery?.rul_cycles ?? 380;
  const riskScore = risk?.overall_risk_score ?? battery?.risk_score ?? 22;
  const riskLevel = risk?.risk_level ?? battery?.risk_level ?? 'LOW';
  const temp = telemetry?.temperature ?? battery?.temperature ?? 31.4;
  const cycles = telemetry?.cycle_count ?? battery?.cycle_count ?? 428;

  const packVoltage = telemetry?.pack_voltage ?? 15.92;
  const current = telemetry?.current ?? 4.2;
  const power = telemetry?.power ?? 66.86;
  const energyWh = telemetry?.energy_wh ?? battery?.energy_wh ?? 510.0;
  const spreadMv = cells?.spread_mv ?? telemetry?.cell_voltage_spread_mv ?? 70.0;

  const activeAnomalies = anomalies?.anomalies || [];

  // Fleet aggregate statistics
  const totalFleet = batteries.length || 1;
  const healthyCount = batteries.filter((b) => b.soh >= 80 && b.risk_level === 'LOW').length || 1;
  const atRiskCount = batteries.filter((b) => b.risk_level === 'MEDIUM' || (b.soh < 80 && b.soh >= 65)).length || 1;
  const criticalCount = batteries.filter((b) => b.risk_level === 'HIGH' || b.soh < 65).length || 1;
  const avgSoc = batteries.length ? Math.round(batteries.reduce((acc, b) => acc + b.soc, 0) / batteries.length) : soc;
  const avgSoh = batteries.length ? Math.round(batteries.reduce((acc, b) => acc + b.soh, 0) / batteries.length) : soh;
  const avgRul = batteries.length ? Math.round((batteries.reduce((acc, b) => acc + b.rul_months, 0) / batteries.length) * 10) / 10 : rulMonths;
  const totalFleetAnomalies = batteries.reduce((acc, b) => acc + (b.anomaly_count || 0), 0) + activeAnomalies.length;

  // Cell voltage data for chart
  const cellChartData = cells?.cells?.map((c) => ({
    name: `Cell ${c.cell_number}`,
    voltage: c.voltage,
    temp: c.temperature,
    ir: c.internal_resistance_mohm,
  })) || [
    { name: 'Cell 1', voltage: 4.01, temp: 29.8, ir: 18.2 },
    { name: 'Cell 2', voltage: 4.00, temp: 30.1, ir: 18.5 },
    { name: 'Cell 3', voltage: 3.94, temp: 31.0, ir: 19.8 },
    { name: 'Cell 4', voltage: 3.99, temp: 30.2, ir: 18.3 },
  ];

  const primaryRec = battery?.primary_recommendation || 'SERVICE / MAINTENANCE';

  const getRecStyles = (rec: string) => {
    if (rec.includes('CONTINUE')) {
      return {
        bg: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-300 text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    }
    if (rec.includes('SERVICE')) {
      return {
        bg: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 text-amber-900',
        badge: 'bg-amber-100 text-amber-900 border-amber-200',
        dot: 'bg-amber-500',
      };
    }
    if (rec.includes('SECOND')) {
      return {
        bg: 'from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-300 text-cyan-900',
        badge: 'bg-cyan-100 text-cyan-900 border-cyan-200',
        dot: 'bg-cyan-500',
      };
    }
    return {
      bg: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-300 text-rose-900',
      badge: 'bg-rose-100 text-rose-900 border-rose-200',
      dot: 'bg-rose-500',
    };
  };

  const recStyles = getRecStyles(primaryRec);

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Top Glassmorphism Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-950 text-white shadow-xl border border-white/10 backdrop-blur-md">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-indigo-300 border border-white/10 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Intelligent Battery Intelligence Platform
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {battery?.status || 'Online / Connected'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              VoltWise AI Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-normal leading-relaxed">
              Tagline: <em className="text-indigo-300 font-medium">"From Battery Data to Lifecycle Decisions."</em> Complete end-to-end diagnostics: <span className="font-semibold text-white">MONITOR → DIAGNOSE → PREDICT → ASSESS RISK → DECIDE</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <button
              onClick={() => onNavigate('ai-diagnostics')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md transition-all cursor-pointer border border-white/20"
            >
              <Brain className="w-4 h-4" />
              AI Diagnostics Engine
            </button>
            <button
              onClick={() => onNavigate('live-diagnostics')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-cyan-300" />
              Live Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Summary Glassmorphic Banner */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-600" />
            Connected EV Fleet Aggregate Status
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            Selected Unit: <strong className="text-slate-700 font-mono">{bId}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Batteries</span>
            <span className="text-xl font-bold text-slate-900 mt-1">{totalFleet}</span>
            <span className="text-[9px] text-slate-500 mt-0.5">Automotive Packs</span>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Healthy</span>
            <span className="text-xl font-bold text-emerald-800 mt-1">{healthyCount}</span>
            <span className="text-[9px] text-emerald-600 mt-0.5">SOH ≥ 80% / Low Risk</span>
          </div>
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">At Risk</span>
            <span className="text-xl font-bold text-amber-800 mt-1">{atRiskCount}</span>
            <span className="text-[9px] text-amber-600 mt-0.5">Service Recommended</span>
          </div>
          <div className="bg-rose-50/70 border border-rose-200/70 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Critical</span>
            <span className="text-xl font-bold text-rose-800 mt-1">{criticalCount}</span>
            <span className="text-[9px] text-rose-600 mt-0.5">High Impedance / Aging</span>
          </div>
          <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Average SOC</span>
            <span className="text-xl font-bold text-blue-900 mt-1">{avgSoc}%</span>
            <span className="text-[9px] text-blue-600 mt-0.5">Pack Charge Level</span>
          </div>
          <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Average SOH</span>
            <span className="text-xl font-bold text-indigo-900 mt-1">{avgSoh}%</span>
            <span className="text-[9px] text-indigo-600 mt-0.5">Capacity Retention</span>
          </div>
          <div className="bg-purple-50/70 border border-purple-200/70 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Average RUL</span>
            <span className="text-xl font-bold text-purple-900 mt-1">{avgRul} mo</span>
            <span className="text-[9px] text-purple-600 mt-0.5">To 80% Cutoff</span>
          </div>
          <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Anomalies</span>
            <span className="text-xl font-bold text-slate-800 mt-1">{totalFleetAnomalies}</span>
            <span className="text-[9px] text-slate-500 mt-0.5">Across All Packs</span>
          </div>
        </div>
      </div>

      {/* Prominent Lifecycle Decision Card */}
      <div className={`rounded-2xl p-6 border bg-gradient-to-r ${recStyles.bg} shadow-sm backdrop-blur-md relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/90 shadow-xs flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                AI Lifecycle Prescription ({bId})
              </span>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {primaryRec}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${recStyles.badge} flex items-center gap-1.5`}>
                  <span className={`w-2 h-2 rounded-full ${recStyles.dot} animate-ping`} />
                  Confidence: 86%
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                • <strong>Why?</strong> SOH: {soh}% | Cell spread: {spreadMv} mV | Temperature: {temp}°C | Risk Level: {riskLevel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={() => onNavigate('lifecycle-decision')}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              View Analysis & Second-Life Suitability
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Anomaly Banner if Any Detected */}
      {activeAnomalies.length > 0 && (
        <div className="bg-amber-50/90 backdrop-blur-md border border-amber-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-amber-900">
                    Active Diagnostic Anomaly Detected ({activeAnomalies.length} Flag{activeAnomalies.length > 1 ? 's' : ''})
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 uppercase">
                    {anomalies?.highest_severity || 'Warning'}
                  </span>
                </div>
                <div className="mt-1 space-y-1">
                  {activeAnomalies.slice(0, 2).map((a) => (
                    <p key={a.id} className="text-xs text-amber-800 font-medium">
                      • <strong className="font-bold">{a.anomaly_type}</strong> on {a.affected_cell}: {a.explanation}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('ai-risk')}
              className="text-xs font-bold text-amber-900 underline hover:text-amber-950 shrink-0 ml-4 cursor-pointer"
            >
              Inspect Risk Matrix →
            </button>
          </div>
        </div>
      )}

      {/* Top 6 KPI Cards with Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="State of Charge"
          value={soc}
          unit="%"
          icon={BatteryCharging}
          statusText={soc > 20 ? 'Optimal' : 'Low Charge'}
          statusType={soc > 20 ? 'normal' : 'warning'}
          trendText="Discharging"
          trendDirection="down"
          colorTheme="blue"
        />

        <KPICard
          title="State of Health"
          value={soh}
          unit="%"
          icon={HeartPulse}
          statusText={soh >= 80 ? 'Good' : (soh >= 70 ? 'Fair' : 'Degraded')}
          statusType={soh >= 80 ? 'normal' : 'warning'}
          trendText={`${health?.degradation_rate_pct_per_100 ?? 1.7}% / 100 cyc`}
          trendDirection="down"
          colorTheme="emerald"
        />

        <KPICard
          title="Remaining Useful Life"
          value={rulMonths}
          unit="months"
          icon={Clock}
          statusText="To 80% EOL"
          statusType="info"
          trendText={`~${rulCycles} cycles`}
          trendDirection="neutral"
          colorTheme="indigo"
        />

        <KPICard
          title="Risk Score"
          value={riskScore}
          unit="/ 100"
          icon={AlertTriangle}
          statusText={`${riskLevel} RISK`}
          statusType={riskLevel === 'LOW' ? 'normal' : (riskLevel === 'MEDIUM' ? 'warning' : 'critical')}
          trendText={riskLevel === 'LOW' ? 'Nominal' : 'Advisory Active'}
          trendDirection="neutral"
          colorTheme="purple"
        />

        <KPICard
          title="Battery Temp"
          value={temp}
          unit="°C"
          icon={Thermometer}
          statusText={temp < 40 ? 'Nominal' : (temp < 48 ? 'Elevated' : 'Critical')}
          statusType={temp < 40 ? 'normal' : (temp < 48 ? 'warning' : 'critical')}
          trendText="Ambient 25°C"
          trendDirection="up"
          colorTheme="amber"
        />

        <KPICard
          title="Cycle Count"
          value={cycles}
          unit="cycles"
          icon={RotateCcw}
          statusText="4S Li-ion"
          statusType="normal"
          trendText="1500 Rated"
          trendDirection="up"
          colorTheme="blue"
        />
      </div>

      {/* Main Condition Section & Live Parameters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Circular Health Gauge Section */}
        <div className="lg:col-span-7 space-y-4">
          <CircularHealthGauge
            soh={soh}
            status={(health?.health_category as any) || (soh >= 80 ? 'Good' : 'Fair')}
            currentCapacity={health?.current_capacity_ah ?? 42.8}
            originalCapacity={health?.original_capacity_ah ?? 51.0}
            capacityRetention={health?.capacity_retention_pct ?? 83.9}
            degradationRate={health?.degradation_rate_pct_per_100 ?? 1.7}
            totalCycles={cycles}
          />

          {/* Transparent SOH Explanation Card */}
          <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{health?.assessment_label || 'AI-estimated / prototype battery health assessment'}</span>
            </div>
            <p className="text-slate-600 font-medium">
              {health?.soh_explanation || `SOH is estimated at ${soh}% based on measured capacity retention of ${health?.capacity_retention_pct ?? 83.9}% across ${cycles} cycles.`}
            </p>
          </div>
        </div>

        {/* Right: Live Battery Parameters */}
        <div className="lg:col-span-5 bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Live Operational Metrics
                </h3>
                <span className="text-xs text-slate-400">4S Pack Sensor Feed</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {power.toFixed(1)} W
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Pack Voltage:</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{packVoltage.toFixed(2)} V</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Current Draw:</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{current.toFixed(2)} A</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Energy Throughput:</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{energyWh.toFixed(1)} Wh</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Cell Voltage Spread (ΔV):</span>
                <span className={`text-sm font-bold font-mono ${spreadMv > 50 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {spreadMv.toFixed(1)} mV
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">AFE Sampling Rate: 1000ms</span>
            <button
              onClick={() => onNavigate('cell-analysis')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Inspect 4S Cells <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4S Cell Micro-Diagnostics Bar Chart */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              4-Cell Real-Time Voltage Distribution (4S Configuration)
            </h3>
            <span className="text-xs text-slate-400">
              Individual cell potential balance with internal impedance mapping
            </span>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
            Spread: {spreadMv.toFixed(1)} mV ({cells?.spread_status || 'Normal'})
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cellChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[3.6, 4.2]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
                        <span className="font-bold block text-slate-200">{data.name}</span>
                        <div className="mt-1 space-y-0.5 text-slate-300">
                          <p>Voltage: <strong className="text-emerald-400 font-mono">{data.voltage} V</strong></p>
                          <p>Temp: <strong className="text-amber-400 font-mono">{data.temp} °C</strong></p>
                          <p>Impedance: <strong className="text-indigo-300 font-mono">{data.ir} mΩ</strong></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="voltage" radius={[8, 8, 0, 0]}>
                {cellChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.voltage < 3.90
                        ? '#f43f5e'
                        : entry.voltage < 3.96
                        ? '#f59e0b'
                        : '#3b82f6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
