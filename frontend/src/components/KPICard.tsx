import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  statusText?: string;
  statusType?: 'normal' | 'warning' | 'critical' | 'info';
  trendText?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  colorTheme?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  statusText,
  statusType = 'normal',
  trendText,
  trendDirection = 'neutral',
  colorTheme = 'blue',
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50/70',
      text: 'text-blue-600',
      border: 'border-blue-100',
      iconBg: 'bg-blue-600 text-white',
    },
    indigo: {
      bg: 'bg-indigo-50/70',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-600 text-white',
    },
    emerald: {
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
    },
    amber: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-600',
      border: 'border-amber-100',
      iconBg: 'bg-amber-600 text-white',
    },
    rose: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-600',
      border: 'border-rose-100',
      iconBg: 'bg-rose-600 text-white',
    },
    purple: {
      bg: 'bg-purple-50/70',
      text: 'text-purple-600',
      border: 'border-purple-100',
      iconBg: 'bg-purple-600 text-white',
    },
  };

  const statusBadgeMap = {
    normal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    critical: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const theme = colorMap[colorTheme];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="flex items-baseline space-x-1.5 pt-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
          </div>
        </div>
        <div className={`p-2.5 rounded-xl ${theme.iconBg} shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {statusText && (
          <span className={`px-2 py-0.5 rounded-full font-medium border text-[11px] ${statusBadgeMap[statusType]}`}>
            {statusText}
          </span>
        )}
        {trendText && (
          <span className="text-slate-500 flex items-center font-medium ml-auto">
            {trendDirection === 'up' && <span className="text-emerald-600 mr-1">↑</span>}
            {trendDirection === 'down' && <span className="text-rose-600 mr-1">↓</span>}
            {trendText}
          </span>
        )}
      </div>
    </div>
  );
};
