import React from 'react';
import {
  HeartPulse,
  TrendingDown,
  Activity,
  Zap,
  ShieldCheck,
  Thermometer,
  Layers,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import {
  BatteryOverview,
  HealthStatus,
  DegradationData,
  TemperatureTrend,
} from '../types';
import { CircularHealthGauge } from '../components/CircularHealthGauge';

interface BatteryHealthPageProps {
  battery: BatteryOverview | null;
  health: HealthStatus | null;
  degradation: DegradationData | null;
  temperatureTrend: TemperatureTrend | null;
}

export const BatteryHealthPage: React.FC<BatteryHealthPageProps> = ({
  battery,
  health,
  degradation,
  temperatureTrend,
}) => {
  const bId = battery?.battery_id || 'VW-EV-001';
  const soh = health?.soh_pct ?? battery?.soh ?? 84.0;
  const cycles = health?.total_cycles ?? battery?.cycle_count ?? 428;

  // Combine historical and predicted series for clean Recharts display
  const combinedDegradationChartData = React.useMemo(() => {
    if (!degradation) {
      return [
        { cycle: 0, historical: 100, predicted: null, capacity: 51.0 },
        { cycle: 100, historical: 96, predicted: null, capacity: 49.0 },
        { cycle: 200, historical: 93, predicted: null, capacity: 47.4 },
        { cycle: 300, historical: 89, predicted: null, capacity: 45.4 },
        { cycle: 400, historical: 85, predicted: null, capacity: 43.4 },
        { cycle: 428, historical: 84, predicted: 84, capacity: 42.8 },
        { cycle: 500, historical: null, predicted: 80.5, capacity: 41.0 },
        { cycle: 600, historical: null, predicted: 77.2, capacity: 39.4 },
        { cycle: 700, historical: null, predicted: 74.0, capacity: 37.7 },
        { cycle: 800, historical: null, predicted: 70.8, capacity: 36.1 },
        { cycle: 900, historical: null, predicted: 67.5, capacity: 34.4 },
        { cycle: 1000, historical: null, predicted: 64.0, capacity: 32.6 },
      ];
    }

    const dataMap: { [key: number]: any } = {};

    degradation.history.forEach((pt) => {
      dataMap[pt.cycle] = {
        cycle: pt.cycle,
        historical: pt.soh_pct,
        predicted: null,
        capacity: pt.capacity_ah,
      };
    });

    if (degradation.history.length > 0) {
      const lastHist = degradation.history[degradation.history.length - 1];
      if (dataMap[lastHist.cycle]) {
        dataMap[lastHist.cycle].predicted = lastHist.soh_pct;
      }
    }

    degradation.prediction.forEach((pt) => {
      if (dataMap[pt.cycle]) {
        dataMap[pt.cycle].predicted = pt.soh_pct;
      } else {
        dataMap[pt.cycle] = {
          cycle: pt.cycle,
          historical: null,
          predicted: pt.soh_pct,
          capacity: pt.capacity_ah,
          confidence_lower: pt.confidence_lower,
          confidence_upper: pt.confidence_upper,
        };
      }
    });

    return Object.values(dataMap).sort((a, b) => a.cycle - b.cycle);
  }, [degradation]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Battery Health & Degradation Analytics
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              SOH {soh}% • {health?.health_status || 'Optimal (Good)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical aging curve and capacity retention diagnostics for <span className="font-mono font-semibold text-slate-700">{bId}</span>
          </p>
        </div>
      </div>

      {/* Main Condition Gauge */}
      <div className="space-y-4">
        <CircularHealthGauge
          soh={soh}
          status={(health?.health_category as any) || 'Good'}
          currentCapacity={health?.current_capacity_ah ?? 42.8}
          originalCapacity={health?.original_capacity_ah ?? 51.0}
          capacityRetention={health?.capacity_retention_pct ?? 83.9}
          degradationRate={health?.degradation_rate_pct_per_100 ?? 1.7}
          totalCycles={cycles}
        />

        {/* Prototype Health Assessment Explanation Banner */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{health?.assessment_label || 'AI-estimated / prototype battery health assessment'}</span>
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            {health?.soh_explanation || `SOH is evaluated at ${soh}% based on empirical capacity retention of ${health?.capacity_retention_pct ?? 83.9}% across ${cycles} cycles.`}
          </p>
        </div>
      </div>

      {/* Interactive Historical & Predicted Degradation Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-blue-600" />
              Historical vs Predicted Degradation Curve
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cycle count progression vs State of Health (SOH %) with 80% and 60% EOL thresholds
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="font-semibold text-slate-700">Historical Measured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="font-semibold text-slate-700">AI Predicted Trajectory</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedDegradationChartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="cycle"
                label={{ value: 'Battery Cycles', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <YAxis
                domain={[50, 105]}
                label={{ value: 'State of Health (SOH %)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                }}
                formatter={(value: any, name: any) => [
                  `${value}% SOH`,
                  name === 'historical' ? 'Historical Tested' : 'AI Projected',
                ]}
                labelFormatter={(label) => `Cycle #${label}`}
              />
              <ReferenceLine
                y={80}
                label={{ value: '80% 1st-Life Automotive EOL Limit', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <ReferenceLine
                y={60}
                label={{ value: '60% 2nd-Life Recycling Threshold', fill: '#d97706', fontSize: 10, position: 'insideTopRight' }}
                stroke="#d97706"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="historical"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
                name="historical"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#f59e0b' }}
                activeDot={{ r: 6 }}
                name="predicted"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Temperature Trend Over Time */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-600" />
              Thermal Trend Over Time & Anomaly Highlighting
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous temperature profile with abnormal thermal boundary highlighting (&gt;42°C Warning, &gt;50°C Critical)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Peak 24h: {temperatureTrend?.peak_temp_24h ?? 34.2} °C
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={temperatureTrend?.trend || []}
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis domain={[20, 60]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '11px',
                }}
                formatter={(val: any) => [`${val} °C`, 'Core Temp']}
              />
              <ReferenceLine
                y={42}
                label={{ value: 'Warning Threshold (42°C)', fill: '#f59e0b', fontSize: 10 }}
                stroke="#f59e0b"
                strokeDasharray="3 3"
              />
              <ReferenceLine
                y={50}
                label={{ value: 'Critical Limit (50°C)', fill: '#ef4444', fontSize: 10 }}
                stroke="#ef4444"
                strokeDasharray="3 3"
              />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#tempGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
