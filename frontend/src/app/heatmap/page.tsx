"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Sliders, RefreshCw, AlertTriangle, Download, ToggleLeft, ToggleRight } from "lucide-react";
import api, { HeatmapData } from "@/lib/api";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <div className="h-96 skeleton w-full flex items-center justify-center font-serif italic text-[var(--mocha)]">Compiling heatmap dimensions...</div>
});

export default function HeatmapPage() {
  const [datasetId, setDatasetId] = useState("breast_cancer");
  const [topN, setTopN] = useState(20);
  const [normalize, setNormalize] = useState(true);
  const [palette, setPalette] = useState("Viridis");

  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const plotRef = useRef<any>(null);

  const loadData = () => {
    setLoading(true);
    api.getHeatmap({ dataset_id: datasetId, top_n: topN, normalize })
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
  }, [datasetId, topN, normalize]);

  // Pivot 1D array into 2D grid for Plotly Heatmap
  let z: number[][] = [];
  let xLabels: string[] = [];
  let yLabels: string[] = [];

  if (data && data.genes && data.samples && data.matrix) {
    xLabels = data.samples;
    yLabels = data.genes;
    
    // Initialize 2D array
    z = yLabels.map(() => new Array(xLabels.length).fill(0));

    const geneIndices = new Map(yLabels.map((g, i) => [g, i]));
    const sampleIndices = new Map(xLabels.map((s, i) => [s, i]));

    data.matrix.forEach((cell) => {
      const gIdx = geneIndices.get(cell.gene);
      const sIdx = sampleIndices.get(cell.sample || "");
      if (gIdx !== undefined && sIdx !== undefined) {
        z[gIdx][sIdx] = cell.value;
      }
    });
  }

  // Choose Plotly colorscale
  const getColorscale = () => {
    switch (palette) {
      case "Coolwarm":
        return "RdBu";
      case "YlOrRd":
        return "YlOrRd";
      case "Viridis":
      default:
        return "Viridis";
    }
  };

  // Plotly layout config
  const layout = {
    title: {
      text: `Clustered Heatmap (Top ${topN} DEGs)`,
      font: { family: "Playfair Display, serif", size: 18, color: "#6D564A" },
    },
    xaxis: {
      title: "Samples (Clustered)",
      showticklabels: false, // hide sample names as there are 120 of them
      ticks: "",
    },
    yaxis: {
      title: "Genes (Clustered)",
      font: { family: "JetBrains Mono, monospace", size: 10 },
      tickmode: "linear",
    },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { t: 50, b: 40, l: 150, r: 20 },
    autosize: true,
  };

  const traces = [
    {
      z: z,
      x: xLabels,
      y: yLabels,
      type: "heatmap",
      colorscale: getColorscale(),
      colorbar: {
        title: normalize ? "z-score" : "Expression",
        titleside: "right",
      },
      hoverongaps: false,
    },
  ];

  // Manual image downloader using Plotly library
  const downloadImage = (format: "png" | "svg") => {
    if (typeof window !== "undefined") {
      const PlotlyLib = require("plotly.js-dist-min");
      const plotEl = document.getElementById("plotly-heatmap-id");
      if (plotEl) {
        PlotlyLib.downloadImage(plotEl, {
          format: format,
          filename: `genescope_heatmap_${datasetId}`,
          height: 600,
          width: 900,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold font-serif">Expression Clustered Heatmap</h1>
        <p className="text-sm text-[var(--mocha)]">Perform hierarchical clustering on samples and significant gene dimensions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-6 lg:col-span-1">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-[var(--glass-border)] pb-3">
            <Sliders size={18} className="text-[var(--dusty-rose)]" />
            Heatmap Controls
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

          {/* Number of genes slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Display Top N Genes</span>
              <span className="font-mono-gene text-[var(--dusty-rose)]">{topN}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={topN}
              onChange={(e) => setTopN(parseInt(e.target.value))}
              className="w-full accent-[var(--dusty-rose)]"
            />
          </div>

          {/* Normalization Toggle */}
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>z-score Normalize (row-wise)</span>
            <button
              onClick={() => setNormalize(!normalize)}
              className="text-[var(--dusty-rose)] focus:outline-none"
            >
              {normalize ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          {/* Palette switcher */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold block">Color Palette</label>
            <select
              value={palette}
              onChange={(e) => setPalette(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-cream)] border border-[var(--glass-border)] rounded-xl outline-none"
            >
              <option value="Viridis">Viridis (Purple-Green-Yellow)</option>
              <option value="Coolwarm">Coolwarm (Blue-White-Red)</option>
              <option value="YlOrRd">Yellow-Orange-Red</option>
            </select>
          </div>

          {/* Export triggers */}
          <div className="pt-4 border-t border-[var(--glass-border)] space-y-2">
            <span className="text-[10px] uppercase font-bold text-[var(--mocha)] block mb-2">Export Image</span>
            <button
              onClick={() => downloadImage("png")}
              className="w-full btn-secondary py-2 flex items-center justify-center gap-2 text-xs"
            >
              <Download size={12} /> Download PNG
            </button>
            <button
              onClick={() => downloadImage("svg")}
              className="w-full btn-secondary py-2 flex items-center justify-center gap-2 text-xs"
            >
              <Download size={12} /> Download SVG
            </button>
          </div>
        </div>

        {/* Heatmap Canvas */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass-card p-6 flex flex-col justify-center min-h-[500px]">
            {loading ? (
              <div className="p-12 text-center text-[var(--mocha)] space-y-4">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--dusty-rose)]" />
                <p className="font-serif italic">Computing tree linkage distance matrices...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2">
                <AlertTriangle size={18} /> {error}
              </div>
            ) : !data || xLabels.length === 0 ? (
              <div className="p-8 text-center text-[var(--mocha)]">No data available for heatmap.</div>
            ) : (
              <div className="w-full h-[500px]" id="plotly-heatmap-container-id">
                <Plot
                  divId="plotly-heatmap-id"
                  data={traces as any}
                  layout={layout as any}
                  style={{ width: "100%", height: "100%" }}
                  useResizeHandler={true}
                  config={{ responsive: true, displayModeBar: false }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
