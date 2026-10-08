import React from 'react';
import { Battery, Zap, ChevronDown, CheckCircle2, AlertCircle, Wifi, LogOut, Radio } from 'lucide-react';
import { BatteryOverview } from '../types';

interface HeaderProps {
  selectedBatteryId: string;
  batteries: BatteryOverview[];
  onSelectBattery: (batteryId: string) => void;
  isConnected: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedBatteryId,
  batteries,
  onSelectBattery,
  isConnected,
  onLogout,
}) => {
  const currentBattery = batteries.find((b) => b.battery_id === selectedBatteryId);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Brand / Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-xs">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">VoltWise AI</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Intelligent EV Battery Diagnostics & Lifecycle Decision Support
            </p>
          </div>
        </div>

        {/* Center & Right: Battery Selector & Status */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Hardware API status badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>ESP32 Ready: <code className="text-[11px] font-mono bg-slate-200/80 px-1 py-0.5 rounded">POST /api/telemetry</code></span>
          </div>

          {/* Backend Connection Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-600 text-[11px]">{isConnected ? 'API Connected' : 'Offline Mode'}</span>
          </div>

          {/* Battery Selector Dropdown */}
          <div className="relative">
            <label className="sr-only">Select Battery</label>
            <div className="flex items-center bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-1.5 transition-all cursor-pointer">
              <Battery className="w-4 h-4 text-blue-600 mr-2" />
              <div className="flex flex-col text-left mr-2">
                <span className="text-[10px] uppercase font-semibold text-slate-400 leading-tight">
                  Tracked Pack
                </span>
                <select
                  value={selectedBatteryId}
                  onChange={(e) => onSelectBattery(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                >
                  {batteries.map((b) => (
                    <option key={b.battery_id} value={b.battery_id}>
                      {b.battery_id} ({b.model_name.split('(')[0].trim()})
                    </option>
                  ))}
                  {batteries.length === 0 && (
                    <option value="VW-EV-001">VW-EV-001 (Default)</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
