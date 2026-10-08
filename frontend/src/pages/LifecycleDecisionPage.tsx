import React from 'react';
import {
  Recycle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Award,
  Layers,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckSquare,
  Building2,
  BatteryCharging,
  Factory,
  Car,
  Wrench,
  BatteryMedium,
  Trash2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { LifecycleRecommendation, BatteryOverview } from '../types';

interface LifecycleDecisionPageProps {
  battery: BatteryOverview | null;
  lifecycle: LifecycleRecommendation | null;
}

export const LifecycleDecisionPage: React.FC<LifecycleDecisionPageProps> = ({
  battery,
  lifecycle,
}) => {
  const bId = battery?.battery_id || 'VW-EV-001';
  const primaryRec = lifecycle?.primary_recommendation || battery?.primary_recommendation || 'CONTINUE USE';
  const suitabilityScore = lifecycle?.repurposing_suitability_score ?? 92.5;
  const economicValue = lifecycle?.economic_value_remaining_usd ?? 1420.0;
  const confidence = lifecycle?.confidence_pct ?? 94.2;
  const safetyOverride = lifecycle?.safety_override_active ?? false;
  const safetyReason = lifecycle?.safety_override_reason;
  const secondLife = lifecycle?.second_life_summary;

  const recCategory = lifecycle?.recommendation_category || 'CONTINUE';

  const categoryColorMap = {
    CONTINUE: 'from-emerald-950 via-teal-950 to-slate-900 border-emerald-500/30',
    SERVICE: 'from-amber-950 via-orange-950 to-slate-900 border-amber-500/30',
    SECOND_LIFE: 'from-indigo-950 via-blue-950 to-slate-900 border-indigo-500/30',
    RECYCLE: 'from-rose-950 via-slate-900 to-slate-950 border-rose-500/30',
  };

  const bgGradient = categoryColorMap[recCategory as keyof typeof categoryColorMap] || categoryColorMap.CONTINUE;

  const timelineStages = [
    { id: 'mfg', name: 'Manufacturing', icon: Factory, desc: 'Factory QA & Formation' },
    { id: 'CONTINUE', name: 'EV Use', icon: Car, desc: 'Primary Automotive (SOH ≥ 80%)' },
    { id: 'SERVICE', name: 'Service / Balancing', icon: Wrench, desc: 'Active Rebalancing & Diagnostics' },
    { id: 'SECOND_LIFE', name: 'Second Life (BESS)', icon: BatteryMedium, desc: 'Stationary Repurposing (65-80%)' },
    { id: 'RECYCLE', name: 'Recycling / Recovery', icon: Trash2, desc: 'Hydrometallurgical CAM Recovery' },
  ];

  const getStageActiveState = (stageId: string) => {
    if (stageId === 'mfg') return 'past';
    if (stageId === recCategory) return 'current';
    if (recCategory === 'CONTINUE' && stageId !== 'mfg') return 'future';
    if (recCategory === 'SERVICE' && (stageId === 'SECOND_LIFE' || stageId === 'RECYCLE')) return 'future';
    if (recCategory === 'SECOND_LIFE' && stageId === 'RECYCLE') return 'future';
    return 'past';
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Lifecycle Decision Center & Second-Life Advisor
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Confidence {confidence}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated multi-factor decision matrix (Continue Use, Service, Second-Life, Recycle) for <span className="font-mono font-semibold text-slate-700">{bId}</span>
          </p>
        </div>
      </div>

      {/* 5-Stage Lifecycle Timeline */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          Battery Lifecycle Stage Timeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {timelineStages.map((stg, i) => {
            const state = getStageActiveState(stg.id);
            const Icon = stg.icon;
            const isCurrent = state === 'current';
            const isPast = state === 'past';

            return (
              <div
                key={stg.id}
                className={`p-4 rounded-2xl border transition-all relative ${
                  isCurrent
                    ? 'bg-gradient-to-b from-indigo-50 to-blue-50/70 border-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                    : isPast
                    ? 'bg-slate-50/70 border-slate-200/80 text-slate-700'
                    : 'bg-slate-50/30 border-slate-200/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isCurrent ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200/70 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCurrent ? 'bg-indigo-600 text-white animate-pulse' : isPast ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCurrent ? 'Active Stage' : isPast ? 'Completed' : 'Upcoming'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-1">{stg.name}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{stg.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical Safety Override Warning if Active */}
      {safetyOverride && safetyReason && (
        <div className="bg-rose-50/90 backdrop-blur-md border-2 border-rose-300 rounded-2xl p-5 shadow-md flex items-start gap-4 animate-pulse">
          <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-rose-950 uppercase tracking-wide">
              Critical Safety Override Active
            </h4>
            <p className="text-xs text-rose-800 font-semibold mt-1">
              {safetyReason}
            </p>
            <p className="text-[11px] text-rose-700 mt-1">
              Safety rule overrides standard capacity-based recommendations to prevent thermal runaway or catastrophic cell degradation.
            </p>
          </div>
        </div>
      )}

      {/* Primary Recommendation Showcase Card with Glassmorphism */}
      <div className={`bg-gradient-to-br ${bgGradient} text-white rounded-3xl p-8 shadow-xl border backdrop-blur-md relative overflow-hidden`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Primary AI Recommendation
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {primaryRec}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-blue-200 uppercase font-semibold">Repurposing Score</span>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                {suitabilityScore} <span className="text-xs text-white font-normal">/ 100</span>
              </div>
            </div>

            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
              <span className="text-[10px] text-blue-200 uppercase font-semibold">Residual Value</span>
              <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
                ${economicValue}
              </div>
            </div>
          </div>
        </div>

        {/* Rationales */}
        <div className="border-t border-white/10 pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-200 mb-3">
            Diagnostic Decision Rationales
          </h4>
          <div className="space-y-2.5">
            {(lifecycle?.key_rationales || [
              'State of Health (84.0%) remains well above the 80% primary automotive retirement threshold.',
              'Cell impedance remains balanced with low thermal generation under dynamic C-rates.',
              'Projected remaining primary automotive lifespan exceeds 18 months (~380 cycles).',
            ]).map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-blue-100/90 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second-Life Screening Matrix Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Second-Life Repurposing Screening
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Electrochemical feasibility assessment for stationary energy storage (BESS) and backup power
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            Status: {secondLife?.status || 'Eligible for 2nd Life'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block mb-1">Stationary Energy Storage (BESS)</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Commercial/industrial solar peak-shaving and EV fast-charging buffer containers operating at 0.2C–0.5C.
            </p>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block mb-1">Backup Power UPS</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Telecom tower emergency standby and residential solar microgrid backup systems with climate control.
            </p>
          </div>

          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-800 block mb-1">Low-Demand Mobility</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Campus shuttles, golf carts, and warehouse AGVs requiring moderate acceleration duty cycles.
            </p>
          </div>
        </div>

        {/* Prototype Screening Disclaimer */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>{secondLife?.disclaimer || 'Prototype screening — not a certified safety assessment.'}</span>
        </div>
      </div>

      {/* Required Actions & Application Suitability Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Actions Checklist */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Engineering Action Plan
          </h4>
          <div className="space-y-2.5">
            {(lifecycle?.required_actions || [
              'Continue standard automotive fleet operations.',
              'Maintain standard periodic diagnostics schedule.',
            ]).map((act, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-800"
              >
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suitable Applications */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Approved Deployment Channels
          </h4>
          <div className="space-y-2.5">
            {(lifecycle?.suitable_applications || [
              'Primary Fleet Electric Vehicles',
              'High-Demand Fast-Charging Routes',
              'Urban Delivery & Logistics',
            ]).map((app, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs font-semibold text-emerald-900"
              >
                <span>{app}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  Approved
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
