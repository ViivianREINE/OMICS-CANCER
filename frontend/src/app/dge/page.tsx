"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sliders, RefreshCw, Download, ArrowUpRight, TrendingUp, AlertTriangle } from "lucide-react";
import api, { DgeRow } from "@/lib/api";

export default function DifferentialExpressionPage() {
  const [datasetId, setDatasetId] = useState("breast_cancer");
  const [lfcThresh, setLfcThresh] = useState(1.0);
  const [pThresh, setPThresh] = useState(0.05);
  
  // Breast cancer defaults
  const [caseGroup, setCaseGroup] = useState("Metastatic");
  const [controlGroup, setControlGroup] = useState("Primary");
  
  const [data, setData] = useState<DgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load results from backend
  const loadDge = () => {
    setLoading(true);
    // For sarcoma, we need custom group selection, or default OVR comparative selection
    // In our backend, the base /api/dge endpoint takes case_group & control_group
    api.getDge({ lfc: lfcThresh, p: pThresh, dataset_id: datasetId })
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, lfcThresh, pThresh, caseGroup, controlGroup]);

  // Derived metrics
  const upregulated = data.filter((g) => g.Regulation === "Upregulated");
  const downregulated = data.filter((g) => g.Regulation === "Downregulated");
  const notSignificant = data.filter((g) => g.Regulation === "Not Significant");

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold">Differential Gene Expression</h1>
        <p className="text-sm text-[var(--mocha)]">Run Welch's t-test and compute log2 Fold Change values dynamically</p>
      </div>

      {/* Grid: Controls left, Table right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
              <Sliders size={18} className="text-[var(--dusty-rose)]" />
              Analysis Parameters
            </h3>

            {/* Select Dataset */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold block">Target Dataset</label>
              <select
                value={datasetId}
                onChange={(e) => {
                  setDatasetId(e.target.value);
                  if (e.target.value === "sarcoma") {
                    setCaseGroup("Osteosarcoma");
                    setControlGroup("Leiomyosarcoma");
                  } else {
                    setCaseGroup("Metastatic");
                    setControlGroup("Primary");
                  }
                }}
                className="w-full px-3 py-2 bg-[var(--bg-cream)] border border-[var(--glass-border)] rounded-xl outline-none"
              >
                <option value="breast_cancer">Comparative Breast Cancer (GSE21050)</option>
                <option value="sarcoma">Comparative Sarcoma subtypes</option>
              </select>
            </div>

            {/* Threshold Sliders */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Log Fold Change (|logFC|)</span>
                  <span className="font-mono-gene text-[var(--dusty-rose)]">{lfcThresh.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={lfcThresh}
                  onChange={(e) => setLfcThresh(parseFloat(e.target.value))}
                  className="w-full accent-[var(--dusty-rose)]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>P-value Threshold</span>
                  <span className="font-mono-gene text-[var(--dusty-rose)]">{pThresh.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.001"
                  max="0.1"
                  step="0.005"
                  value={pThresh}
                  onChange={(e) => setPThresh(parseFloat(e.target.value))}
                  className="w-full accent-[var(--dusty-rose)]"
                />
              </div>
            </div>

            {/* Group selectors */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold block">Case Group</label>
                <input
                  type="text"
                  readOnly
                  value={caseGroup}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl text-[var(--mocha)] select-none outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold block">Control Group</label>
                <input
                  type="text"
                  readOnly
                  value={controlGroup}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl text-[var(--mocha)] select-none outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={loadDge}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Re-calculate
              </button>
            </div>
          </div>

          {/* DGE Stat Summary Cards */}
          {(!loading && !error) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-[var(--mocha)]">Upregulated</span>
                <span className="block text-2xl font-bold font-mono-gene text-red-500 mt-1">{upregulated.length}</span>
              </div>
              <div className="glass-card p-4 text-center">
                <span className="text-[10px] uppercase font-bold text-[var(--mocha)]">Downregulated</span>
                <span className="block text-2xl font-bold font-mono-gene text-blue-500 mt-1">{downregulated.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-4 flex items-center justify-between">
            <h3 className="font-bold text-lg">Statistical Output ({data.length} genes)</h3>
            
            <a
              href={api.getExportUrl(datasetId, "dge") + `&lfc_thresh=${lfcThresh}&p_thresh=${pThresh}`}
              download
              className="btn-secondary py-1.5 px-3 flex items-center gap-2 text-xs"
            >
              <Download size={14} /> Export Results
            </a>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              {loading ? (
                <div className="p-12 text-center text-[var(--mocha)] space-y-4">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--dusty-rose)]" />
                  <p className="font-serif italic">Computing statistical matrices...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
                  <AlertTriangle size={18} /> {error}
                </div>
              ) : data.length === 0 ? (
                <div className="p-8 text-center text-[var(--mocha)]">No genes met the threshold criteria.</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="font-mono-gene">Gene Symbol</th>
                      <th className="font-mono-gene text-center">log2 Fold Change</th>
                      <th className="font-mono-gene text-center">P-value</th>
                      <th className="font-mono-gene text-center">-log10(p-value)</th>
                      <th className="font-mono-gene text-center">Regulation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <tr key={row.Gene}>
                        <td className="font-semibold text-[var(--cocoa)] font-mono-gene">{row.Gene}</td>
                        <td className="text-center font-mono-gene">
                          {row.logFC > 0 ? `+${row.logFC.toFixed(4)}` : row.logFC.toFixed(4)}
                        </td>
                        <td className="text-center font-mono-gene">{row.p_value.toExponential(4)}</td>
                        <td className="text-center font-mono-gene">{row["-log10(p_value)"].toFixed(4)}</td>
                        <td className="text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.Regulation === "Upregulated"
                              ? "bg-red-500/15 text-red-700"
                              : row.Regulation === "Downregulated"
                              ? "bg-blue-500/15 text-blue-700"
                              : "bg-[var(--glass-border)] text-[var(--mocha)]"
                          }`}>
                            {row.Regulation}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
