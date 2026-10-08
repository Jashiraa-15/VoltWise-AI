import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  Activity,
  AlertTriangle,
  HeartPulse,
  TrendingDown,
  ShieldCheck,
  Recycle,
  CheckCircle,
  Info,
  Layers,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Sliders,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import {
  HealthStatus,
  RULPrediction,
  AnomalyListResponse,
  RiskScore,
  LifecycleRecommendation,
  TelemetryData,
} from '../types';
import { CircularHealthGauge } from '../components/CircularHealthGauge';

interface AIDiagnosticsPageProps {
  batteryId: string;
  onNavigate: (page: any) => void;
}

export const AIDiagnosticsPage: React.FC<AIDiagnosticsPageProps> = ({ batteryId, onNavigate }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [rul, setRul] = useState<RULPrediction | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyListResponse | null>(null);
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [lifecycle, setLifecycle] = useState<LifecycleRecommendation | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hData, rData, aData, rkData, lData, tData] = await Promise.all([
        api.getSOH(batteryId),
        api.getRUL(batteryId, 80.0),
        api.getAnomalies(batteryId),
        api.getRisk(batteryId),
        api.getLifecycle(batteryId),
        api.getTelemetry(batteryId),
      ]);
      setHealth(hData);
      setRul(rData);
      setAnomalies(aData);
      setRisk(rkData);
      setLifecycle(lData);
      setTelemetry(tData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load AI Diagnostics data', err);
      setError('Unable to retrieve AI intelligence pipeline results. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [batteryId]);

  const pipelineStages = [
    { name: 'Telemetry Ingest', status: 'Active', desc: '1-5Hz multi-vector sensor stream' },
    { name: 'Data Validation', status: 'Pass', desc: 'Pydantic schema & CRC check' },
    { name: 'Analytics Core', status: 'Optimal', desc: 'Cell spread & IR impedance' },
    { name: 'SOH Estimator', status: `${health?.soh_pct ?? 84}%`, desc: 'Hybrid capacity & ML regression' },
    { name: 'RUL Prediction', status: `${rul?.estimated_remaining_months ?? 18} mo`, desc: 'Degradation trajectory' },
    { name: 'Anomaly Engine', status: `${anomalies?.total_count ?? 0} active`, desc: 'Statistical outlier classifier' },
    { name: 'Risk Scoring', status: `${risk?.overall_risk_score ?? 24}/100`, desc: 'Additive penalty index' },
    { name: 'Lifecycle Engine', status: lifecycle?.recommendation_category ?? 'Decision', desc: 'Decision matrix with safety override' },
  ];

  const getRecBadge = (rec: string = '') => {
    if (rec.includes('CONTINUE')) {
      return { bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' };
    }
    if (rec.includes('SERVICE')) {
      return { bg: 'bg-amber-500/10 text-amber-700 border-amber-300', dot: 'bg-amber-500' };
    }
    if (rec.includes('SECOND')) {
      return { bg: 'bg-cyan-500/10 text-cyan-700 border-cyan-300', dot: 'bg-cyan-500' };
    }
    return { bg: 'bg-rose-500/10 text-rose-700 border-rose-300', dot: 'bg-rose-500' };
  };

  const recBadge = getRecBadge(lifecycle?.primary_recommendation);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-12">
          <Brain className="w-80 h-80 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Core AI Intelligence Pipeline
              </span>
              <span className="text-xs text-slate-400 font-mono">Battery: {batteryId}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              AI Diagnostics & Lifecycle Decision Support
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Real-time multi-stage intelligence converting raw electrochemical telemetry into actionable lifecycle prescriptions.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Intelligence
          </button>
        </div>
      </div>

      {/* End-to-End Pipeline Workflow Strip */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-indigo-600" />
          End-to-End Data Pipeline Execution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {pipelineStages.map((stage, idx) => (
            <div
              key={idx}
              className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex flex-col justify-between relative group hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step 0{idx + 1}</span>
                <p className="text-xs font-bold text-slate-800 leading-tight mt-0.5">{stage.name}</p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200/60">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100/70 text-indigo-700">
                  {stage.status}
                </span>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Prominent Lifecycle Decision Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Primary AI Lifecycle Recommendation
                </span>
                {lifecycle?.safety_override_active && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Safety Override Active
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-3">
                {lifecycle?.primary_recommendation ?? 'EVALUATING...'}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${recBadge.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${recBadge.dot} animate-pulse`} />
                  Confidence: {lifecycle?.confidence_pct ?? 86}%
                </span>
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Next Recommended Action:{' '}
                <strong className="text-slate-800">
                  {lifecycle?.required_actions?.[0] ?? 'Continue regular diagnostic monitoring.'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center">
            <button
              onClick={() => onNavigate('lifecycle-decision')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              View Full Lifecycle Analysis
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Why this recommendation? Supporting Rationales */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Electrochemical Health
            </span>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              SOH: <strong>{health?.soh_pct}%</strong> | Capacity:{' '}
              <strong>{health?.current_capacity_ah} Ah</strong> ({health?.capacity_retention_pct}% retention)
            </p>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Thermal & Balance Profile
            </span>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              Spread: <strong>{telemetry?.cell_voltage_spread_mv} mV</strong> | Core Temp:{' '}
              <strong>{telemetry?.temperature}°C</strong>
            </p>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Residual Economic Suitability
            </span>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              2nd-Life Score: <strong>{lifecycle?.repurposing_suitability_score}/100</strong> | Est. Value:{' '}
              <strong>${lifecycle?.economic_value_remaining_usd} USD</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 4 Diagnostic Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: SOH Estimation & Degradation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">1. SOH Estimation & Health</h3>
                  <span className="text-[10px] text-slate-400">Hybrid Empirical + ML Degradation Model</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                {health?.health_category}
              </span>
            </div>

            <div className="flex items-center gap-6 my-4">
              <CircularHealthGauge
                soh={health?.soh_pct ?? 84}
                status={(health?.health_category as any) || 'Good'}
                currentCapacity={health?.current_capacity_ah ?? 42.8}
                originalCapacity={health?.original_capacity_ah ?? 51.0}
                capacityRetention={health?.capacity_retention_pct ?? 83.9}
                degradationRate={health?.degradation_rate_pct_per_100 ?? 1.7}
                totalCycles={health?.total_cycles ?? 428}
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Capacity Retention:</span>
                  <span className="font-bold text-slate-800">{health?.capacity_retention_pct}%</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Degradation Velocity:</span>
                  <span className="font-bold text-slate-800">{health?.degradation_rate_pct_per_100}% / 100 cyc</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                  <span className="text-slate-500">Accumulated Cycles:</span>
                  <span className="font-bold text-slate-800">{health?.total_cycles} / 1,500</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                AI SOH Explanation
              </span>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{health?.soh_explanation}"
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('battery-health')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            View Degradation Curves <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section 2: RUL Prediction */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">2. RUL Prediction Engine</h3>
                  <span className="text-[10px] text-slate-400">Configurable EOL Cutoff (80% Default)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                {rul?.confidence_score}% Confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
                <span className="text-[11px] font-medium text-blue-600 block">Remaining Useful Life</span>
                <span className="text-2xl font-bold text-blue-950 mt-1 block">
                  {rul?.estimated_remaining_months} <span className="text-xs font-normal text-slate-500">months</span>
                </span>
                <span className="text-[10px] text-slate-500">~{rul?.remaining_cycles} operating cycles</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-medium text-slate-500 block">Projected EOL Target</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  ~{rul?.estimated_eol_cycle} <span className="text-xs font-normal text-slate-500">cycles</span>
                </span>
                <span className="text-[10px] text-slate-500">{rul?.estimated_eol_date}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                AI RUL Explanation
              </span>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{rul?.calculation_explanation}"
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('rul-prediction')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            Configure EOL Cutoff & View Trajectory <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section 3: Anomaly Detection */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">3. Deterministic Anomaly Engine</h3>
                  <span className="text-[10px] text-slate-400">Cell Imbalance, Thermal Sag & Current Spikes</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                {anomalies?.total_count} Active Flags
              </span>
            </div>

            <div className="space-y-2.5 my-3">
              {anomalies?.anomalies && anomalies.anomalies.length > 0 ? (
                anomalies.anomalies.slice(0, 2).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">{a.anomaly_type}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{a.explanation}</p>
                    <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                      <span>Affected: {a.affected_cell}</span>
                      <span>Measured: {a.measured_value}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  All sensor vectors operating within standard tolerances.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai-risk')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            Inspect All Anomaly Vectors <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section 4: Transparent Additive Risk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">4. Transparent Additive Risk Index</h3>
                  <span className="text-[10px] text-slate-400">Itemized Multi-Vector Score (0-100)</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                risk?.risk_level === 'LOW' ? 'bg-emerald-100 text-emerald-800' :
                risk?.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                'bg-rose-100 text-rose-800'
              }`}>
                {risk?.overall_risk_score} / 100 ({risk?.risk_level})
              </span>
            </div>

            <div className="space-y-1.5 my-3">
              {risk?.breakdown_contributions.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">{c.factor}</span>
                  <span className="font-bold text-indigo-700 font-mono">+{c.points} pts</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 mt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                AI Risk Explanation
              </span>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{risk?.mitigation_recommendation}"
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai-risk')}
            className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            View Complete Risk Breakdown <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Safety Disclaimer */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-slate-500 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong>Prototype Diagnostic AI Assessment:</strong> VoltWise AI algorithms provide predictive decision support
          based on electrochemical models and statistical screening. Not certified laboratory equipment. Physical high-voltage safety validation is required prior to battery repurposing.
        </p>
      </div>
    </div>
  );
};
