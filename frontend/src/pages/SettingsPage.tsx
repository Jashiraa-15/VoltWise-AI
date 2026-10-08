import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Radio,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sliders,
  Code,
  FileCode,
  Sparkles,
  Info,
} from 'lucide-react';
import { SimulationStatus, ScenarioType, BatteryOverview } from '../types';
import { api } from '../services/api';

interface SettingsPageProps {
  battery: BatteryOverview | null;
  simStatus: SimulationStatus | null;
  onControlSim: (action: 'start' | 'pause' | 'reset' | 'step', speed?: number, scenario?: ScenarioType) => void;
  onScenarioChange: (scenario: ScenarioType) => void;
  onRefreshData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  battery,
  simStatus,
  onControlSim,
  onScenarioChange,
  onRefreshData,
}) => {
  const bId = battery?.battery_id || 'VW-EV-001';
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        battery_id: bId,
        cell_voltages: [4.05, 4.04, 3.98, 4.02],
        pack_voltage: 16.09,
        current: 5.1,
        temperature: 32.2,
        ambient_temp: 25.0,
      },
      null,
      2
    )
  );
  const [injectResult, setInjectResult] = useState<any>(null);
  const [injectLoading, setInjectLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInject = async () => {
    setInjectLoading(true);
    setErrorMsg(null);
    try {
      const parsed = JSON.parse(testPayload);
      const res = await api.postHardwareTelemetry(parsed);
      setInjectResult(res);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to inject hardware packet');
    } finally {
      setInjectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              System Configuration & Hardware API Testing Suite
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              ESP32 + BQ76920 Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure battery telemetry simulator parameters and test live ESP32 BMS ingestion
          </p>
        </div>
      </div>

      {/* Future ESP32 Hardware Integration Testing Suite */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
              ESP32 / BMS Hardware Telemetry Ingest Tester
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Send raw sensor packets directly to <code className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">POST /api/telemetry</code>
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            Hardware Endpoint Active
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: JSON Input */}
          <div className="lg:col-span-7 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Microcontroller JSON Sensor Payload (ESP32 + BQ76920 + INA226 + NTC)
            </label>
            <textarea
              rows={9}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() =>
                  setTestPayload(
                    JSON.stringify(
                      {
                        battery_id: bId,
                        cell_voltages: [4.01, 4.00, 3.94, 3.99],
                        pack_voltage: 15.92,
                        current: 4.2,
                        temperature: 31.4,
                      },
                      null,
                      2
                    )
                  )
                }
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
              >
                Reset to Standard 4S Spec
              </button>

              <button
                onClick={handleInject}
                disabled={injectLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {injectLoading ? 'Transmitting...' : 'Transmit Packet to API'}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Right: Response Inspector */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Backend Ingestion Response
              </span>
              {injectResult ? (
                <pre className="text-[11px] font-mono text-slate-800 bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto max-h-56">
                  {JSON.stringify(injectResult, null, 2)}
                </pre>
              ) : (
                <div className="text-xs text-slate-400 p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  Click "Transmit Packet to API" to simulate live ESP32 microcontroller packet ingestion.
                </div>
              )}
            </div>

            <div className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              <strong className="text-slate-700">Architecture Note:</strong> When physical hardware is connected, your ESP32 Wi-Fi or LTE client will post identical payloads to this exact URL with zero backend alterations required.
            </div>
          </div>
        </div>
      </div>

      {/* Microcontroller Firmware Snippet Reference */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Code className="w-5 h-5 text-blue-600" />
          ESP32 + BQ76920 + INA226 C++ Firmware Routine
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Example HTTP POST routine for ESP32 Arduino framework:
        </p>

        <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

void sendTelemetryToVoltWise() {
  HTTPClient http;
  http.begin("http://your-server-ip:8000/api/telemetry");
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["battery_id"] = "VW-EV-001";
  JsonArray cells = doc.createNestedArray("cell_voltages");
  cells.add(readCellVoltage(1)); // BQ76920 Cell 1
  cells.add(readCellVoltage(2)); // BQ76920 Cell 2
  cells.add(readCellVoltage(3)); // BQ76920 Cell 3
  cells.add(readCellVoltage(4)); // BQ76920 Cell 4
  doc["pack_voltage"] = readPackVoltage(); // BQ76920 Pack V
  doc["current"] = readCurrent(); // INA226 Hall / Shunt A
  doc["temperature"] = readNTC(); // NTC Thermistor °C

  String requestBody;
  serializeJson(doc, requestBody);
  int httpResponseCode = http.POST(requestBody);
  http.end();
}`}
        </pre>
      </div>
    </div>
  );
};
