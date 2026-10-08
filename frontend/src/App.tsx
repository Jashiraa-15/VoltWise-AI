import React, { useState, useEffect, useCallback } from 'react';
import {
  NavPage,
  BatteryOverview,
  TelemetryData,
  HealthStatus,
  CellAnalysis,
  DegradationData,
  TemperatureTrend,
  AnomalyListResponse,
  RiskScore,
  RULPrediction,
  LifecycleRecommendation,
  SimulationStatus,
  ScenarioType,
} from './types';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SimulationControlBar } from './components/SimulationControlBar';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { AIDiagnosticsPage } from './pages/AIDiagnosticsPage';
import { LiveDiagnosticsPage } from './pages/LiveDiagnosticsPage';
import { BatteryHealthPage } from './pages/BatteryHealthPage';
import { RULPredictionPage } from './pages/RULPredictionPage';
import { CellAnalysisPage } from './pages/CellAnalysisPage';
import { AIRiskPage } from './pages/AIRiskPage';
import { LifecycleDecisionPage } from './pages/LifecycleDecisionPage';
import { BatteryHistoryPage } from './pages/BatteryHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AlertCircle, Menu, X } from 'lucide-react';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activePage, setActivePage] = useState<NavPage>('overview');
  const [selectedBatteryId, setSelectedBatteryId] = useState('VW-EV-001');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Datasets
  const [batteries, setBatteries] = useState<BatteryOverview[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [cells, setCells] = useState<CellAnalysis | null>(null);
  const [degradation, setDegradation] = useState<DegradationData | null>(null);
  const [temperatureTrend, setTemperatureTrend] = useState<TemperatureTrend | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyListResponse | null>(null);
  const [risk, setRisk] = useState<RiskScore | null>(null);
  const [rul, setRul] = useState<RULPrediction | null>(null);
  const [lifecycle, setLifecycle] = useState<LifecycleRecommendation | null>(null);
  const [simStatus, setSimStatus] = useState<SimulationStatus | null>(null);

  const [isConnected, setIsConnected] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Load baseline battery list
  const loadBatteries = useCallback(async () => {
    try {
      const data = await api.getBatteries();
      setBatteries(data);
      setIsConnected(true);
      setErrorBanner(null);
    } catch (err: any) {
      console.warn('Backend offline or starting:', err);
      setIsConnected(false);
      setErrorBanner('Backend API offline or initializing. Operating with cached simulator state.');
    }
  }, []);

  // Load detailed datasets for selected battery
  const loadBatteryData = useCallback(async (bId: string) => {
    try {
      const [tData, hData, cData, dData, tempTrend, anomData, rData, rulData, lData, sStatus] =
        await Promise.all([
          api.getTelemetry(bId).catch(() => null),
          api.getHealth(bId).catch(() => null),
          api.getCells(bId).catch(() => null),
          api.getDegradation(bId).catch(() => null),
          api.getTemperatureTrend(bId).catch(() => null),
          api.getAnomalies(bId).catch(() => null),
          api.getRisk(bId).catch(() => null),
          api.getRUL(bId).catch(() => null),
          api.getLifecycle(bId).catch(() => null),
          api.getSimulationStatus().catch(() => null),
        ]);

      if (tData) setTelemetry(tData);
      if (hData) setHealth(hData);
      if (cData) setCells(cData);
      if (dData) setDegradation(dData);
      if (tempTrend) setTemperatureTrend(tempTrend);
      if (anomData) setAnomalies(anomData);
      if (rData) setRisk(rData);
      if (rulData) setRul(rulData);
      if (lData) setLifecycle(lData);
      if (sStatus) setSimStatus(sStatus);
      setIsConnected(true);
    } catch (err) {
      console.error('Error fetching battery data:', err);
      setIsConnected(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBatteries();
    loadBatteryData(selectedBatteryId);
  }, [loadBatteries, loadBatteryData, selectedBatteryId]);

  // Real-time continuous telemetry polling loop (every 1.5 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [liveTel, liveCells, liveAnom, liveSim] = await Promise.all([
          api.getTelemetry(selectedBatteryId).catch(() => null),
          api.getCells(selectedBatteryId).catch(() => null),
          api.getAnomalies(selectedBatteryId).catch(() => null),
          api.getSimulationStatus().catch(() => null),
        ]);

        if (liveTel) {
          setTelemetry(liveTel);
          setIsConnected(true);
          setErrorBanner(null);
        }
        if (liveCells) setCells(liveCells);
        if (liveAnom) setAnomalies(liveAnom);
        if (liveSim) setSimStatus(liveSim);
      } catch {
        setIsConnected(false);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedBatteryId]);

  // Simulation controls handler
  const handleControlSim = async (
    action: 'start' | 'pause' | 'reset' | 'step',
    speed?: number,
    scenario?: ScenarioType
  ) => {
    try {
      const res = await api.controlSimulation({
        action,
        speed,
        scenario,
        battery_id: selectedBatteryId,
      });
      setSimStatus(res);
      // Immediately reload data to show instant impact of scenario change
      await loadBatteryData(selectedBatteryId);
      await loadBatteries();
    } catch (err) {
      console.error('Failed to control simulation:', err);
    }
  };

  const handleScenarioChange = (scenario: ScenarioType) => {
    handleControlSim('start', undefined, scenario);
  };

  const selectedBattery =
    batteries.find((b) => b.battery_id === selectedBatteryId) || null;

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Persistent Left Sidebar on Desktop */}
      <div className="hidden md:block">
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            setActivePage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          selectedBatteryId={selectedBatteryId}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="w-72 bg-white h-full shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b">
              <span className="font-bold text-sm">Navigation Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <Sidebar
              activePage={activePage}
              onNavigate={(page) => {
                setActivePage(page);
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              selectedBatteryId={selectedBatteryId}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <div className="relative">
          <Header
            selectedBatteryId={selectedBatteryId}
            batteries={batteries}
            onSelectBattery={(bId) => {
              setSelectedBatteryId(bId);
              loadBatteryData(bId);
            }}
            isConnected={isConnected}
            onLogout={() => setIsAuthenticated(false)}
          />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden absolute top-4 left-3 p-2 bg-slate-100 rounded-xl text-slate-700 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Global Alert Banner if Backend is Disconnected */}
        {errorBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorBanner}</span>
            </div>
            <button
              onClick={() => {
                loadBatteries();
                loadBatteryData(selectedBatteryId);
              }}
              className="font-bold underline ml-4 hover:text-amber-900 cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Main Body */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Universal Simulation Control Toolbar */}
          <SimulationControlBar
            status={simStatus}
            onControl={handleControlSim}
            onScenarioChange={handleScenarioChange}
          />

          {/* Page Routing */}
          {activePage === 'overview' && (
            <OverviewPage
              battery={selectedBattery}
              batteries={batteries}
              telemetry={telemetry}
              health={health}
              cells={cells}
              risk={risk}
              anomalies={anomalies}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'ai-diagnostics' && (
            <AIDiagnosticsPage
              batteryId={selectedBatteryId}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'live-diagnostics' && (
            <LiveDiagnosticsPage
              battery={selectedBattery}
              telemetry={telemetry}
            />
          )}

          {activePage === 'battery-health' && (
            <BatteryHealthPage
              battery={selectedBattery}
              health={health}
              degradation={degradation}
              temperatureTrend={temperatureTrend}
            />
          )}

          {activePage === 'rul-prediction' && (
            <RULPredictionPage
              battery={selectedBattery}
              rul={rul}
            />
          )}

          {activePage === 'cell-analysis' && (
            <CellAnalysisPage
              battery={selectedBattery}
              cells={cells}
            />
          )}

          {activePage === 'ai-risk' && (
            <AIRiskPage
              battery={selectedBattery}
              risk={risk}
              anomalies={anomalies}
            />
          )}

          {activePage === 'lifecycle-decision' && (
            <LifecycleDecisionPage
              battery={selectedBattery}
              lifecycle={lifecycle}
            />
          )}

          {activePage === 'battery-history' && (
            <BatteryHistoryPage battery={selectedBattery} />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              battery={selectedBattery}
              simStatus={simStatus}
              onControlSim={handleControlSim}
              onScenarioChange={handleScenarioChange}
              onRefreshData={() => loadBatteryData(selectedBatteryId)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
