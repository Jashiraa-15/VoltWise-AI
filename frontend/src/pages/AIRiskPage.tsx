import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Thermometer,
  Layers,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  Plus,
  Info,
} from 'lucide-react';
import { RiskScore, AnomalyListResponse, BatteryOverview } from '../types';

interface AIRiskPageProps {
  battery: BatteryOverview | null;
  risk: RiskScore | null;
  anomalies: AnomalyListResponse | null;
}

export const AIRiskPage: React.FC<AIRiskPageProps> = ({ battery, risk, anomalies }) => {
  const bId = battery?.battery_id || 'VW-EV-001';
  const overallScore = risk?.overall_risk_score ?? battery?.risk_score ?? 22.0;
  const riskLevel = risk?.risk_level ?? battery?.risk_level ?? 'LOW';

  const riskBadgeClasses = {
    LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
    HIGH: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const contributions = risk?.breakdown_contributions || [
    { factor: 'Cell Imbalance', points: 8.0, max_points: 30.0, status: 'Normal', measured_value: '70 mV', explanation: 'Series spread delta across 4S pack' },
    { factor: 'Temperature Stress', points: 4.0, max_points: 30.0, status: 'Normal', measured_value: '31.4 °C', explanation: 'Pack core thermal operating envelope' },
    { factor: 'Electrochemical Aging', points: 7.0, max_points: 25.0, status: 'Normal', measured_value: '84% SOH', explanation: 'SOH fade across 428 cycles' },
    { factor: 'Anomaly Flags', points: 2.0, max_points: 15.0, status: 'Normal', measured_value: '0 Critical', explanation: 'Threshold violation penalty' },
    { factor: 'Dynamic Current Load', points: 1.0, max_points: 10.0, status: 'Normal', measured_value: '4.2 A', explanation: 'Dynamic bus discharge rate' },
  ];

  const detectedList = anomalies?.anomalies || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              AI Multi-Factor Risk Assessment & Anomaly Detection
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskBadgeClasses[riskLevel as keyof typeof riskBadgeClasses] || riskBadgeClasses.LOW}`}>
              {riskLevel} RISK ({overallScore}/100)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Transparent additive risk scoring & multi-vector safety telemetry for <span className="font-mono font-semibold text-slate-700">{bId}</span>
          </p>
        </div>
      </div>

      {/* Main Risk Gauge Banner & Formula Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-r border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Composite Risk Index
          </span>
          <div className="text-5xl font-extrabold font-mono text-slate-900 mt-2">
            {overallScore}{' '}
            <span className="text-base font-normal text-slate-400">/ 100</span>
          </div>
          <div className="mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskBadgeClasses[riskLevel as keyof typeof riskBadgeClasses] || riskBadgeClasses.LOW}`}>
              {riskLevel} RISK (0-30 Low, 31-60 Medium, 61-100 High)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Sum of cell imbalance, thermal load, aging velocity, current sag, and anomalies
          </p>
        </div>

        <div className="md:col-span-8 space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            AI Safety Mitigation Guidance
          </h4>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
            {risk?.mitigation_recommendation || 'Continue standard scheduled operations. Active thermal management optimal.'}
          </div>

          <div className="mt-3">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Active Operational Alerts
            </h5>
            <div className="space-y-1.5">
              {(risk?.active_alerts || ['All primary diagnostic vectors operating within nominal thresholds.']).map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs font-medium text-slate-700 p-2.5 rounded-lg bg-blue-50/60 border border-blue-100"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{alert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Itemized Points Contribution List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Transparent Risk Points Breakdown (Sum = {overallScore} pts)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact mathematical point contributions from each diagnostic vector
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {contributions.map((c, i) => (
            <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>{c.factor}</span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-slate-900">
                  +{c.points}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {c.max_points}</span>
                </div>
                <div className="text-[11px] font-mono font-bold text-blue-700 mt-0.5">
                  {c.measured_value}
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                {c.explanation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detected Anomalies Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Deterministic Anomaly Detection Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated multi-rule inspection (Cell imbalance, thermal limits, current surges, voltage sag)
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border">
            {detectedList.length} Active Anomaly Record{detectedList.length !== 1 ? 's' : ''}
          </span>
        </div>

        {detectedList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-700 block">No Active Anomalies Detected</span>
            <span className="text-[11px] text-slate-400">All cell voltages, temperatures, and currents are within safe design thresholds.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-semibold">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Anomaly Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Affected Entity</th>
                  <th className="py-3 px-4">Measured Value</th>
                  <th className="py-3 px-4">Safety Threshold</th>
                  <th className="py-3 px-4">Diagnostic Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detectedList.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{a.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{a.anomaly_type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{a.affected_cell}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{a.measured_value}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{a.threshold}</td>
                    <td className="py-3 px-4 text-slate-700">{a.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
