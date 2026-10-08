import React from 'react';
import {
  LayoutDashboard,
  Brain,
  Activity,
  HeartPulse,
  TrendingDown,
  Layers,
  AlertTriangle,
  Recycle,
  History,
  Settings,
  Zap,
  Cpu,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { NavPage } from '../types';

interface SidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
  selectedBatteryId: string;
}

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'ai-diagnostics', label: 'AI Diagnostics', icon: Brain, badge: 'Pipeline' },
  { id: 'live-diagnostics', label: 'Live Diagnostics', icon: Activity, badge: 'Live' },
  { id: 'battery-health', label: 'Battery Health', icon: HeartPulse },
  { id: 'rul-prediction', label: 'RUL Prediction', icon: TrendingDown },
  { id: 'cell-analysis', label: 'Cell Analysis', icon: Layers, badge: '4S' },
  { id: 'ai-risk', label: 'AI Risk', icon: AlertTriangle },
  { id: 'lifecycle-decision', label: 'Lifecycle Decision', icon: Recycle, badge: '2nd Life' },
  { id: 'battery-history', label: 'Battery History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  selectedBatteryId,
}) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-screen sticky top-0 shrink-0 z-40 select-none">
      {/* Top Brand */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              VoltWise AI
            </h2>
            <span className="text-[11px] font-medium text-slate-400">
              Battery Intelligence
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Diagnostics & Analytics
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold shadow-xs border border-blue-100/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                      isActive
                        ? 'bg-blue-200/70 text-blue-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-2 rounded-2xl border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-700">Active Unit</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
            Online
          </span>
        </div>
        <div className="text-xs font-mono font-bold text-blue-700">
          {selectedBatteryId}
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
          <span>4S NMC Architecture</span>
          <span>51.0 Ah</span>
        </div>
      </div>
    </aside>
  );
};
