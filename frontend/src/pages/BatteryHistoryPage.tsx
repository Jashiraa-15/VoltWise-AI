import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Download,
  FileText,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { HistoryRecord, BatteryOverview, BatteryReport } from '../types';
import { api } from '../services/api';

interface BatteryHistoryPageProps {
  battery: BatteryOverview | null;
}

export const BatteryHistoryPage: React.FC<BatteryHistoryPageProps> = ({ battery }) => {
  const bId = battery?.battery_id || 'VW-EV-001';
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  // Report Modal state
  const [reportData, setReportData] = useState<BatteryReport | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory(bId, {
        search: search || undefined,
        risk_filter: riskFilter !== 'All' ? riskFilter : undefined,
        page,
        limit: 12,
      });
      setRecords(data.records);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [bId, page, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleExportCsv = () => {
    const exportUrl = api.getExportCsvUrl(bId);
    window.open(exportUrl, '_blank');
  };

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReportModalOpen(true);
    try {
      const rep = await api.getReport(bId);
      setReportData(rep);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Historical Battery Telemetry Logs & Reports
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {total} Total Logs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Auditable lifecycle dataset records for <span className="font-mono font-semibold text-slate-700">{bId}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Battery CSV
          </button>

          {/* Generate Report Button */}
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate Battery Report
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:w-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by date or recommendation..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-medium"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent font-bold text-slate-900 focus:outline-hidden cursor-pointer ml-1"
            >
              <option value="All">All Levels</option>
              <option value="LOW">LOW Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="HIGH">HIGH Risk</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearch('');
              setRiskFilter('All');
              setPage(1);
              fetchHistory();
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-semibold">
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Battery ID</th>
                <th className="py-3 px-4">SOC</th>
                <th className="py-3 px-4">SOH</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Lifecycle Recommendation</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Loading historical telemetry logs...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No historical records found.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-600">{r.date}</td>
                    <td className="py-3 px-4 font-bold text-blue-700">{r.battery_id}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.soc}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">{r.soh}%</td>
                    <td className="py-3 px-4 font-mono text-amber-600">{r.temperature}°C</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{r.cycle}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.risk_level === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : r.risk_level === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {r.risk} ({r.risk_level})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {r.lifecycle_recommendation}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(r);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing page <strong className="text-slate-800">{page}</strong> of{' '}
            <strong className="text-slate-800">{totalPages}</strong> ({total} records)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Telemetry Record #{selectedRecord.id}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Timestamp: {selectedRecord.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">Pack Voltage</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {selectedRecord.pack_voltage} V
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">Current</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {selectedRecord.current} A
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">Power</span>
                  <div className="text-sm font-bold font-mono text-indigo-600 mt-0.5">
                    {selectedRecord.power} W
                  </div>
                </div>
              </div>

              {/* 4 Cell Voltages */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>4S Cell Voltages</span>
                  <span className="font-mono text-slate-500">
                    Delta: {selectedRecord.cell_voltage_spread_mv} mV
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {selectedRecord.cells.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded-xl border border-slate-200 text-center"
                    >
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Cell 0{idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-600">
                        {v} V
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation and Risk */}
              <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-xs space-y-1">
                <span className="font-bold text-blue-900 block">
                  Lifecycle Decision: {selectedRecord.lifecycle_recommendation}
                </span>
                <p className="text-blue-800 font-medium">
                  Risk evaluated at {selectedRecord.risk}/100 ({selectedRecord.risk_level}) across {selectedRecord.cycle} operational cycles.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battery Diagnostic Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-2xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    VoltWise AI Diagnostic & Lifecycle Summary Report
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Unit: {bId} • Generated: {reportData?.generated_at || 'Now'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reportLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Generating comprehensive battery diagnostic report...
              </div>
            ) : reportData ? (
              <div className="space-y-6 text-xs text-slate-700">
                {/* Executive Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">State of Health</span>
                    <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">{reportData.current_soh}%</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Remaining RUL</span>
                    <div className="text-lg font-bold font-mono text-blue-600 mt-0.5">{reportData.rul_months} mo</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Composite Risk</span>
                    <div className="text-lg font-bold font-mono text-purple-600 mt-0.5">{reportData.risk_score} / 100</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Cell Spread</span>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">{reportData.cell_voltage_spread_mv} mV</div>
                  </div>
                </div>

                {/* SOH Explanation */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-1">Health Assessment Rationale</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">{reportData.soh_explanation}</p>
                </div>

                {/* Lifecycle & 2nd-Life Recommendation */}
                <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-indigo-950">Lifecycle Recommendation</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-200 text-indigo-900">
                      {reportData.lifecycle_recommendation}
                    </span>
                  </div>
                  <p className="text-indigo-900 font-medium">
                    Second-Life Suitability: <strong>{reportData.second_life_suitability_score}/100</strong> ({reportData.second_life_status})
                  </p>
                </div>

                {/* Anomaly Inspection List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900">Detected Operational Anomalies ({reportData.detected_anomalies.length})</h4>
                  {reportData.detected_anomalies.length === 0 ? (
                    <p className="text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-medium">
                      ✓ No threshold violations or critical anomalies detected.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {reportData.detected_anomalies.map((anom) => (
                        <div key={anom.id} className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px]">
                          <strong>{anom.anomaly_type}</strong> ({anom.severity}) on {anom.affected_cell}: {anom.explanation}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-3">
                  {reportData.disclaimer}
                </p>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download Full CSV
              </button>
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
