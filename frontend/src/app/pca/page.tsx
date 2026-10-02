"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Sliders, RefreshCw, AlertTriangle, Layers, PieChart } from "lucide-react";
import api, { PcaData } from "@/lib/api";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <div className="h-96 skeleton w-full flex items-center justify-center font-serif italic text-[var(--mocha)]">Mapping PCA dimensions...</div>
});

export default function PcaPage() {
  const [datasetId, setDatasetId] = useState("breast_cancer");
  const [pointSize, setPointSize] = useState(10);
  const [colorScheme, setColorScheme] = useState("RoseMocha");

  const [data, setData] = useState<PcaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    api.getPca(datasetId)
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
  }, [datasetId]);

  // Color mapping based on color schemes
  const getColorMaps = () => {
    if (colorScheme === "LavenderPink") {
      return {
        Primary: "#9B8EC4", // Lavender
        Metastatic: "#D4618C", // Pink
        Osteosarcoma: "#4C78A8",
        Leiomyosarcoma: "#F58518",
        Liposarcoma: "#54A24B",
        Rhabdomyosarcoma: "#B279A2",
      };
    } else if (colorScheme === "Classic") {
      return {
        Primary: "#6dbf7e",
        Metastatic: "#e8836e",
        Osteosarcoma: "#4C78A8",
        Leiomyosarcoma: "#F58518",
        Liposarcoma: "#54A24B",
        Rhabdomyosarcoma: "#B279A2",
      };
    } else {
      // RoseMocha default
      return {
        Primary: "#8B6F61", // Mocha
        Metastatic: "#DFA7C7", // Dusty Rose
        Osteosarcoma: "#4C78A8",
        Leiomyosarcoma: "#F58518",
        Liposarcoma: "#54A24B",
        Rhabdomyosarcoma: "#B279A2",
      };
    }
  };

  const colors = getColorMaps();

  // Group coordinates by sample group
  const traces: any[] = [];
  if (data && data.samples) {
    const groups = Array.from(new Set(data.samples.map((s) => s.group_name)));
    groups.forEach((group) => {
      const groupSamples = data.samples.filter((s) => s.group_name === group);
      const color = colors[group as keyof typeof colors] || "#CCCCCC";

      traces.push({
        x: groupSamples.map((s) => s.PC1),
        y: groupSamples.map((s) => s.PC2),
        text: groupSamples.map((s) => `${s.sample_name}<br>Group: ${s.group_name}<br>PC1: ${s.PC1.toFixed(3)}<br>PC2: ${s.PC2.toFixed(3)}`),
        mode: "markers",
        name: group,
        hoverinfo: "text",
        marker: {
          size: pointSize,
          color: color,
          opacity: 0.85,
          line: { color: "white", width: 0.8 },
        },
      });
    });
  }

  // Plotly layout details
  const pc1Var = data?.variance_explained?.[0] ? (data.variance_explained[0] * 100).toFixed(1) : "0.0";
  const pc2Var = data?.variance_explained?.[1] ? (data.variance_explained[1] * 100).toFixed(1) : "0.0";

  const layout = {
    title: {
      text: "PCA Dimensionality Reduction",
      font: { family: "Playfair Display, serif", size: 18, color: "#6D564A" },
    },
    xaxis: {
      title: `PC1 (${pc1Var}% Variance)`,
      gridcolor: "rgba(109, 86, 74, 0.08)",
      zerolinecolor: "rgba(109, 86, 74, 0.2)",
    },
    yaxis: {
      title: `PC2 (${pc2Var}% Variance)`,
      gridcolor: "rgba(109, 86, 74, 0.08)",
      zerolinecolor: "rgba(109, 86, 74, 0.2)",
    },
    hovermode: "closest",
    legend: {
      x: 0,
      y: 1.12,
      orientation: "h",
    },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { t: 50, b: 50, l: 50, r: 20 },
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold font-serif">PCA Dimensionality Analysis</h1>
        <p className="text-sm text-[var(--mocha)]">Deconstruct variance projections and evaluate cohort clustering</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-6 lg:col-span-1">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
            <Sliders size={18} className="text-[var(--dusty-rose)]" />
            PCA Controls
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
            {/* Point Size slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Scatter Node Size</span>
                <span className="font-mono-gene text-[var(--dusty-rose)]">{pointSize}px</span>
              </div>
              <input
                type="range"
                min="6"
                max="20"
                step="1"
                value={pointSize}
                onChange={(e) => setPointSize(parseInt(e.target.value))}
                className="w-full accent-[var(--dusty-rose)]"
              />
            </div>

            {/* Color Scheme selector */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold block">Color Theme</label>
              <select
                value={colorScheme}
                onChange={(e) => setColorScheme(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-cream)] border border-[var(--glass-border)] rounded-xl outline-none"
              >
                <option value="RoseMocha">Mocha & Rose (Premium theme)</option>
                <option value="LavenderPink">Lavender & Pink</option>
                <option value="Classic">Notebook Standard (Green/Red)</option>
              </select>
            </div>
          </div>

          {/* Variance statistics card */}
          {data && (
            <div className="p-4 rounded-2xl bg-[var(--bg-cream)] border border-[var(--glass-border)] space-y-3 text-xs">
              <span className="font-bold flex items-center gap-1"><PieChart size={14} /> Variance Explained</span>
              <div className="space-y-1 font-mono-gene text-[var(--cocoa)]">
                <div className="flex justify-between">
                  <span>PC1 Component:</span>
                  <span className="font-bold">{pc1Var}%</span>
                </div>
                <div className="flex justify-between">
                  <span>PC2 Component:</span>
                  <span className="font-bold">{pc2Var}%</span>
                </div>
                <hr className="border-[var(--glass-border)] my-1" />
                <div className="flex justify-between text-[var(--dusty-rose)]">
                  <span>Cumulative:</span>
                  <span className="font-bold">{(parseFloat(pc1Var) + parseFloat(pc2Var)).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={loadData}
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Recalculate PCA
          </button>
        </div>

        {/* Scatter Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-6 flex flex-col justify-center min-h-[500px]">
            {loading ? (
              <div className="p-12 text-center text-[var(--mocha)] space-y-4">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--dusty-rose)]" />
                <p className="font-serif italic">Decomposing multidimensional variance values...</p>
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
                  config={{ responsive: true }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
