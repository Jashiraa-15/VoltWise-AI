import React, { useState } from 'react';
import { Zap, ShieldCheck, Cpu, ArrowRight, Lock, Mail, BatteryCharging } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('engineer@voltwise.ai');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin();
    }, 400);
  };

  const handleDemoAccess = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="max-w-md w-full">
        {/* Top Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/30">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">VoltWise AI</h1>
          <p className="text-sm text-blue-200/80 mt-1 font-medium">
            Intelligent EV Battery Diagnostics & Lifecycle Intelligence
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Engineering Portal</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Sign in to monitor fleet telemetry and lifecycle decisions
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="engineer@voltwise.ai"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[11px] text-slate-400 uppercase font-semibold">Or</span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              {/* Demo Access Button */}
              <button
                type="button"
                onClick={handleDemoAccess}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                Instant Demo Access (Prototype Mode)
              </button>
            </div>
          </form>

          {/* Highlights */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500 font-medium">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 mb-1" />
              <span>4S Li-ion Model</span>
            </div>
            <div className="flex flex-col items-center">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600 mb-1" />
              <span>Live Simulation</span>
            </div>
            <div className="flex flex-col items-center">
              <Cpu className="w-3.5 h-3.5 text-indigo-600 mb-1" />
              <span>ESP32 Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
