"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Sliders, RefreshCw, AlertTriangle } from "lucide-react";
import api, { DgeRow } from "@/lib/api";

// Dynamically load React-Plotly to bypass SSR issues
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <div className="h-96 skeleton w-full flex items-center justify-center font-serif italic text-[var(--mocha)]">Mounting Plotly canvas...</div>
});

export default function VolcanoPlotPage() {
  const [datasetId, setDatasetId] = useState("breast_cancer");
  const [lfcThresh, setLfcThresh] = useState(1.0);
  const [pThresh, setPThresh] = useState(0.05);

  const [data, setData] = useState<DgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    api.getVolcano({ lfc: lfcThresh, p: pThresh, dataset_id: datasetId })
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId, lfcThresh, pThresh]);

  // Separate data points by regulation status
  const up = data.filter((g) => g.Regulation === "Upregulated");
  const down = data.filter((g) => g.Regulation === "Downregulated");
  const ns = data.filter((g) => g.Regulation === "Not Significant");

  // Get top 10 significant genes (sorted by p_value) for labeling
  const topLabels = [...up, ...down]
    .sort((a, b) => a.p_value - b.p_value)
    .slice(0, 10);

  // Configure Plotly traces
  const traces = [
    {
      x: ns.map((g) => g.logFC),
      y: ns.map((g) => g["-log10(p_value)"]),
      text: ns.map((g) => `${g.Gene}<br>logFC: ${g.logFC.toFixed(3)}<br>p-val: ${g.p_value.toExponential(3)}`),
      mode: "markers",
      name: `Not Significant (${ns.length})`,
      hoverinfo: "text",
      marker: {
        color: "#D9D0C7", // Beige
        size: 6,
        opacity: 0.5,
      },
    },
    {
      x: up.map((g) => g.logFC),
      y: up.map((g) => g["-log10(p_value)"]),
      text: up.map((g) => `${g.Gene}<br>logFC: ${g.logFC.toFixed(3)}<br>p-val: ${g.p_value.toExponential(3)}`),
      mode: "markers",
      name: `Upregulated (${up.length})`,
      hoverinfo: "text",
      marker: {
        color: "#D4618C", // Pink
        size: 8,
        opacity: 0.85,
      },
    },
    {
      x: down.map((g) => g.logFC),
      y: down.map((g) => g["-log10(p_value)"]),
      text: down.map((g) => `${g.Gene}<br>logFC: ${g.logFC.toFixed(3)}<br>p-val: ${g.p_value.toExponential(3)}`),
      mode: "markers",
      name: `Downregulated (${down.length})`,
      hoverinfo: "text",
      marker: {
        color: "#9B8EC4", // Lavender
        size: 8,
        opacity: 0.85,
      },
    },
  ];

  // Annotations for top 10 genes
  const annotations = topLabels.map((g) => ({
    x: g.logFC,
    y: g["-log10(p_value)"],
    text: g.Gene,
    xanchor: "center",
    yanchor: "bottom",
    showarrow: false,
    font: {
      family: "JetBrains Mono, monospace",
      size: 9,
      color: g.Regulation === "Upregulated" ? "#4a2c3a" : "#2c2a4a",
    },
  }));

  // Plotly Layout
  const layout = {
    title: {
      text: "Interactive Volcano Plot",
      font: { family: "Playfair Display, serif", size: 20, color: "#6D564A" },
    },
    xaxis: {
      title: "Log2 Fold Change (logFC)",
      font: { family: "Inter, sans-serif" },
      gridcolor: "rgba(109, 86, 74, 0.08)",
      zerolinecolor: "rgba(109, 86, 74, 0.2)",
    },
    yaxis: {
      title: "-log10(P-value)",
      font: { family: "Inter, sans-serif" },
      gridcolor: "rgba(109, 86, 74, 0.08)",
      zerolinecolor: "rgba(109, 86, 74, 0.2)",
    },
    hovermode: "closest",
    legend: {
      x: 0,
      y: 1.15,
      orientation: "h",
      font: { size: 11 },
    },
    shapes: [
      // Left vertical threshold line
      {
        type: "line",
        x0: -lfcThresh,
        x1: -lfcThresh,
        y0: 0,
        y1: Math.max(...data.map((g) => g["-log10(p_value)"]), 10) * 1.05,
        line: { color: "rgba(109, 86, 74, 0.5)", width: 1.5, dash: "dash" },
      },
      // Right vertical threshold line
      {
        type: "line",
        x0: lfcThresh,
        x1: lfcThresh,
        y0: 0,
        y1: Math.max(...data.map((g) => g["-log10(p_value)"]), 10) * 1.05,
        line: { color: "rgba(109, 86, 74, 0.5)", width: 1.5, dash: "dash" },
      },
      // Horizontal p-value threshold line
      {
        type: "line",
        x0: Math.min(...data.map((g) => g.logFC), -2) * 1.05,
        x1: Math.max(...data.map((g) => g.logFC), 2) * 1.05,
        y0: -Math.log10(pThresh),
        y1: -Math.log10(pThresh),
        line: { color: "rgba(109, 86, 74, 0.5)", width: 1.5, dash: "dash" },
      },
    ],
    annotations: annotations,
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { t: 60, b: 50, l: 50, r: 20 },
    autosize: true,
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold font-serif">Volcano Plot Discovery</h1>
        <p className="text-sm text-[var(--mocha)]">Interact with gene expressions to discover statistical significance markers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-6 lg:col-span-1">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
            <Sliders size={18} className="text-[var(--dusty-rose)]" />
            Plot Adjustments
          </h3>

          <div className="space-y-1 text-xs">
            <label className="font-semibold block">Dataset</label>
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-cream)] border border-[var(--glass-border)] rounded-xl outline-none"
            >
              <option value="breast_cancer">Comparative Breast Cancer (GSE21050)</option>
              <option value="sarcoma">Comparative Sarcoma subtypes</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>FC Cutoff (|logFC|)</span>
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
                <span>Significance (p)</span>
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

          <button
            onClick={loadData}
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Plot
          </button>
        </div>

        {/* Volcano Chart Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-6 flex flex-col justify-center min-h-[500px]">
            {loading ? (
              <div className="p-12 text-center text-[var(--mocha)] space-y-4">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--dusty-rose)]" />
                <p className="font-serif italic">Compiling Plotly scatter nodes...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
                <AlertTriangle size={18} /> {error}
              </div>
            ) : (
              <div className="w-full h-[500px]">
                <Plot
                  data={traces as any}
                  layout={layout as any}
                  style={{ width: "100%", height: "100%" }}
                  useResizeHandler={true}
                  config={{ responsive: true, displayModeBar: true }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
