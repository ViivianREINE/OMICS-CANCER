"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Sliders, RefreshCw, AlertTriangle, Layers, Activity, Bone } from "lucide-react";
import api, { SarcomaOverview, PcaData, HeatmapData, DgeRow } from "@/lib/api";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <div className="h-64 skeleton w-full flex items-center justify-center font-serif italic text-[var(--mocha)]">Mounting cohort projections...</div>
});

export default function SarcomaAnalysisPage() {
  // Threshold sliders
  const [lfcThresh, setLfcThresh] = useState(1.0);
  const [pThresh, setPThresh] = useState(0.05);

  // Subtype selectors for tables
  const [compType, setCompType] = useState("ovr"); // "ovr" or "pairwise"
  const [selectedSubtype, setSelectedSubtype] = useState("Osteosarcoma");
  const [selectedSubtypeB, setSelectedSubtypeB] = useState("Leiomyosarcoma");

  // State data
  const [overview, setOverview] = useState<SarcomaOverview[]>([]);
  const [pcaData, setPcaData] = useState<PcaData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [dgeData, setDgeData] = useState<DgeRow[]>([]);
  
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingPca, setLoadingPca] = useState(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [loadingDge, setLoadingDge] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const SUBTYPES = ["Osteosarcoma", "Leiomyosarcoma", "Liposarcoma", "Rhabdomyosarcoma"];

  const SUBTYPE_COLORS = {
    Osteosarcoma: "#4C78A8",
    Leiomyosarcoma: "#F58518",
    Liposarcoma: "#54A24B",
    Rhabdomyosarcoma: "#B279A2",
  };

  // Load static dashboard values
  useEffect(() => {
    setLoadingOverview(true);
    setLoadingPca(true);
    setLoadingHeatmap(true);

    api.getSarcomaOverview()
      .then(setOverview)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingOverview(false));

    api.getSarcomaPca()
      .then(setPcaData)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingPca(false));

    api.getSarcomaHeatmap(24)
      .then(setHeatmapData)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingHeatmap(false));
  }, []);

  // Load dynamic DGE comparisons based on sliders and selections
  const loadDge = () => {
    setLoadingDge(true);
    api.getSarcomaDge({
      type: compType,
      subtype: selectedSubtype,
      subtype_b: selectedSubtypeB,
      lfc: lfcThresh,
      p: pThresh,
    })
      .then(setDgeData)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingDge(false));
  };

  useEffect(() => {
    loadDge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compType, selectedSubtype, selectedSubtypeB, lfcThresh, pThresh]);

  // Setup PCA Traces
  const pcaTraces: any[] = [];
  if (pcaData && pcaData.samples) {
    SUBTYPES.forEach((subtype) => {
      const groupSamples = pcaData.samples.filter((s) => s.group_name === subtype);
      const color = SUBTYPE_COLORS[subtype as keyof typeof SUBTYPE_COLORS] || "#CCCCCC";

      pcaTraces.push({
        x: groupSamples.map((s) => s.PC1),
        y: groupSamples.map((s) => s.PC2),
        text: groupSamples.map((s) => `${s.sample_name}<br>Subtype: ${s.group_name}<br>PC1: ${s.PC1.toFixed(3)}<br>PC2: ${s.PC2.toFixed(3)}`),
        mode: "markers",
        name: subtype,
        hoverinfo: "text",
        marker: {
          size: 8,
          color: color,
          opacity: 0.85,
          line: { color: "white", width: 0.5 },
        },
      });
    });
  }

  const pc1Var = pcaData?.variance_explained?.[0] ? (pcaData.variance_explained[0] * 100).toFixed(1) : "0.0";
  const pc2Var = pcaData?.variance_explained?.[1] ? (pcaData.variance_explained[1] * 100).toFixed(1) : "0.0";

  const pcaLayout = {
    title: {
      text: "PCA Subtype Clustering",
      font: { family: "Playfair Display, serif", size: 15, color: "#6D564A" },
    },
    xaxis: { title: `PC1 (${pc1Var}% Var)` },
    yaxis: { title: `PC2 (${pc2Var}% Var)` },
    hovermode: "closest",
    legend: { x: 0, y: 1.15, orientation: "h", font: { size: 9 } },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { t: 40, b: 45, l: 45, r: 10 },
  };

  // Setup Heatmap Traces
  let hz: number[][] = [];
  let hxLabels: string[] = [];
  let hyLabels: string[] = [];

  if (heatmapData && heatmapData.genes && heatmapData.subtypes && heatmapData.matrix) {
    hxLabels = heatmapData.genes;
    hyLabels = heatmapData.subtypes;

    hz = hyLabels.map(() => new Array(hxLabels.length).fill(0));

    const geneIndices = new Map(hxLabels.map((g, i) => [g, i]));
    const subtypeIndices = new Map(hyLabels.map((s, i) => [s, i]));

    heatmapData.matrix.forEach((cell) => {
      const gIdx = geneIndices.get(cell.gene);
      const sIdx = subtypeIndices.get(cell.group);
      if (gIdx !== undefined && sIdx !== undefined) {
        hz[sIdx][gIdx] = cell.value;
      }
    });
  }

  const heatmapTraces = [
    {
      z: hz,
      x: hxLabels,
      y: hyLabels,
      type: "heatmap",
      colorscale: "Viridis",
      colorbar: { title: "z-score", thickness: 12 },
    },
  ];

  const heatmapLayout = {
    title: {
      text: "Marker Expression Profiles",
      font: { family: "Playfair Display, serif", size: 15, color: "#6D564A" },
    },
    xaxis: {
      tickangle: -45,
      font: { family: "JetBrains Mono, monospace", size: 8 },
    },
    yaxis: {
      font: { family: "Inter, sans-serif", size: 10 },
    },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { t: 40, b: 60, l: 110, r: 10 },
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold font-serif">Comparative Sarcoma Subtype Analysis</h1>
        <p className="text-sm text-[var(--mocha)]">Evaluate marker expressions across Osteosarcoma, Leiomyosarcoma, Liposarcoma, and Rhabdomyosarcoma</p>
      </div>

      {/* Subtype overview summary table */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 font-serif">
          <Bone size={18} className="text-[var(--dusty-rose)]" />
          Subtype Summary Metrics
        </h3>
        <div className="overflow-x-auto">
          {loadingOverview ? (
            <div className="h-24 skeleton w-full" />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subtype</th>
                  <th className="text-center">Samples Count</th>
                  <th className="text-center">Upregulated DEGs</th>
                  <th className="text-center">Downregulated DEGs</th>
                  <th>Top Marker Gene</th>
                  <th className="text-center">Marker logFC</th>
                  <th className="text-center">Marker P-value</th>
                </tr>
              </thead>
              <tbody>
                {overview.map((row) => (
                  <tr key={row.Subtype}>
                    <td className="font-semibold" style={{ color: SUBTYPE_COLORS[row.Subtype as keyof typeof SUBTYPE_COLORS] }}>
                      {row.Subtype}
                    </td>
                    <td className="text-center font-mono-gene">{row.Samples}</td>
                    <td className="text-center font-mono-gene text-red-500 font-semibold">+{row.Upregulated}</td>
                    <td className="text-center font-mono-gene text-blue-500 font-semibold">-{row.Downregulated}</td>
                    <td className="font-mono-gene font-semibold">{row.TopMarker}</td>
                    <td className="text-center font-mono-gene">+{row.TopMarkerLogFC.toFixed(2)}</td>
                    <td className="text-center font-mono-gene">{row.TopMarkerPValue.toExponential(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Plots Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PCA plot */}
        <div className="glass-card p-4 min-h-[380px] flex flex-col justify-center">
          {loadingPca ? (
            <div className="h-64 skeleton" />
          ) : (
            <div className="w-full h-full">
              <Plot
                data={pcaTraces}
                layout={pcaLayout as any}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler={true}
                config={{ responsive: true, displayModeBar: false }}
              />
            </div>
          )}
        </div>

        {/* Heatmap plot */}
        <div className="glass-card p-4 min-h-[380px] flex flex-col justify-center">
          {loadingHeatmap ? (
            <div className="h-64 skeleton" />
          ) : (
            <div className="w-full h-full">
              <Plot
                data={heatmapTraces as any}
                layout={heatmapLayout as any}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler={true}
                config={{ responsive: true, displayModeBar: false }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Differential controls and DGE comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sliders panel */}
        <div className="glass-card p-6 space-y-6 lg:col-span-1">
          <h3 className="text-md font-bold flex items-center gap-2 border-b border-[var(--glass-border)] pb-2 font-serif">
            <Sliders size={16} className="text-[var(--dusty-rose)]" />
            Comparison Controls
          </h3>

          <div className="space-y-4">
            <div className="space-y-1 text-xs">
              <label className="font-semibold block">Comparison Type</label>
              <select
                value={compType}
                onChange={(e) => setCompType(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-cream)] border border-[var(--glass-border)] rounded-xl outline-none"
              >
                <option value="ovr">One-vs-Rest (Cohort vs Others)</option>
                <option value="pairwise">Pairwise (Subtype A vs B)</option>
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold block">Subtype A</label>
              <select
                value={selectedSubtype}
                onChange={(e) => setSelectedSubtype(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-cream)] border border-[var(--glass-border)] rounded-xl outline-none"
              >
                {SUBTYPES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {compType === "pairwise" && (
              <div className="space-y-1 text-xs">
                <label className="font-semibold block">Subtype B</label>
                <select
                  value={selectedSubtypeB}
                  onChange={(e) => setSelectedSubtypeB(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-cream)] border border-[var(--glass-border)] rounded-xl outline-none"
                >
                  {SUBTYPES.filter((s) => s !== selectedSubtype).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>logFC Cutoff</span>
                <span className="font-mono-gene text-[var(--dusty-rose)]">{lfcThresh.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
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
        </div>

        {/* DGE list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-cream)]/50">
              <h3 className="font-bold text-sm">
                Differentially Expressed Markers:{" "}
                <span className="text-[var(--dusty-rose)]">
                  {compType === "ovr" ? `${selectedSubtype} vs Rest` : `${selectedSubtype} vs ${selectedSubtypeB}`}
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[350px]">
              {loadingDge ? (
                <div className="p-8 text-center text-[var(--mocha)] space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--dusty-rose)]" />
                  <p className="font-serif italic text-xs">Computing subtype differential profiles...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-500 flex items-center justify-center gap-2">
                  <AlertTriangle size={16} /> {error}
                </div>
              ) : dgeData.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--mocha)]">No genes met the differential requirements.</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="font-mono-gene">Gene Symbol</th>
                      <th className="font-mono-gene text-center">logFC</th>
                      <th className="font-mono-gene text-center">P-value</th>
                      <th className="font-mono-gene text-center">-log10(p-value)</th>
                      <th className="font-mono-gene text-center">Regulation Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dgeData.map((row) => (
                      <tr key={row.Gene}>
                        <td className="font-semibold font-mono-gene">{row.Gene}</td>
                        <td className="text-center font-mono-gene">{row.logFC > 0 ? `+${row.logFC.toFixed(3)}` : row.logFC.toFixed(3)}</td>
                        <td className="text-center font-mono-gene">{row.p_value.toExponential(3)}</td>
                        <td className="text-center font-mono-gene">{row["-log10(p_value)"].toFixed(3)}</td>
                        <td className="text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            row.Regulation === "Upregulated" || row.Regulation.startsWith("Higher in")
                              ? "bg-green-500/10 text-green-700"
                              : row.Regulation === "Downregulated"
                              ? "bg-blue-500/10 text-blue-700"
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
