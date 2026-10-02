"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, RefreshCw, AlertTriangle, Activity } from "lucide-react";
import api, { GeneExplorerData } from "@/lib/api";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <div className="h-64 skeleton w-full flex items-center justify-center font-serif italic text-[var(--mocha)]">Compiling distribution curves...</div>
});

export default function GeneExplorerPage() {
  const [datasetId, setDatasetId] = useState("breast_cancer");
  const [geneList, setGeneList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGene, setSelectedGene] = useState("tumor protein p53");
  
  const [data, setData] = useState<GeneExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load gene list
  useEffect(() => {
    api.getGeneList(datasetId)
      .then((res) => {
        setGeneList(res.genes);
        if (res.genes.length > 0) {
          // If previous gene not in new list, pick first one
          if (!res.genes.includes(selectedGene)) {
            const firstGene = res.genes.find(g => g.toLowerCase().includes("p53")) || res.genes[0];
            setSelectedGene(firstGene);
          }
        }
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  // Load gene expression details
  const loadGeneDetails = () => {
    if (!selectedGene) return;
    setLoading(true);
    api.getGene(selectedGene, datasetId)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGeneDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGene, datasetId]);

  // Filter dropdown genes based on search query
  const filteredGenes = geneList.filter((g) =>
    g.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Plotly chart configurations
  const histTraces: any[] = [];
  const boxTraces: any[] = [];

  const groupColors = {
    Primary: "#8B6F61", // Mocha
    Metastatic: "#DFA7C7", // Dusty Rose
    Osteosarcoma: "#4C78A8",
    Leiomyosarcoma: "#F58518",
    Liposarcoma: "#54A24B",
    Rhabdomyosarcoma: "#B279A2",
  };

  if (data && data.raw_values) {
    const groups = Array.from(new Set(data.raw_values.map((v) => v.group)));
    
    groups.forEach((group) => {
      const vals = data.raw_values.filter((v) => v.group === group).map((v) => v.value);
      const color = groupColors[group as keyof typeof groupColors] || "#CCCCCC";

      // Histogram trace
      histTraces.push({
        x: vals,
        type: "histogram",
        name: group,
        opacity: 0.65,
        marker: { color: color, line: { color: "white", width: 0.5 } },
        nbinsx: 20,
      });

      // Boxplot trace with overlaid jitter points
      boxTraces.push({
        y: vals,
        type: "box",
        name: group,
        boxpoints: "all",
        jitter: 0.3,
        pointpos: -1.8,
        marker: { color: color, size: 3.5 },
        line: { width: 1.5 },
      });
    });
  }

  const histLayout = {
    title: {
      text: "Expression Histogram",
      font: { family: "Playfair Display, serif", size: 16, color: "#6D564A" },
    },
    xaxis: { title: "Expression Value" },
    yaxis: { title: "Sample Count" },
    barmode: "overlay",
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { t: 40, b: 40, l: 40, r: 10 },
    legend: { x: 0.8, y: 1.1 },
  };

  const boxLayout = {
    title: {
      text: "Expression Boxplot with Stripplot",
      font: { family: "Playfair Display, serif", size: 16, color: "#6D564A" },
    },
    yaxis: { title: "Expression Value" },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    margin: { t: 40, b: 40, l: 40, r: 10 },
    showlegend: false,
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold font-serif">Searchable Gene Explorer Laboratory</h1>
        <p className="text-sm text-[var(--mocha)]">Review expression densities, statistical quartiles, and sample dispersions for individual markers</p>
      </div>

      {/* Grid: Search left, Results right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Gene selector */}
        <div className="glass-card p-6 space-y-4 lg:col-span-1">
          <h3 className="text-lg font-bold border-b border-[var(--glass-border)] pb-2 flex items-center gap-1.5">
            <Search size={18} className="text-[var(--dusty-rose)]" />
            Marker Selection
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

          <div className="space-y-2">
            <label className="text-xs font-semibold block">Filter Gene list</label>
            <input
              type="text"
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl outline-none text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold block">Select Gene</label>
            <div className="max-h-[300px] overflow-y-auto border border-[var(--glass-border)] rounded-xl p-1 bg-[var(--bg-cream)]">
              {filteredGenes.length === 0 ? (
                <div className="text-xs text-[var(--mocha)] text-center py-4">No matching symbols</div>
              ) : (
                filteredGenes.map((gene) => (
                  <button
                    key={gene}
                    onClick={() => setSelectedGene(gene)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono-gene transition-colors ${
                      selectedGene === gene
                        ? "bg-[var(--blush-pink)] text-[var(--cocoa)] font-bold"
                        : "hover:bg-[var(--blush-pink)]/30 text-[var(--mocha)]"
                    }`}
                  >
                    {gene}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="glass-card p-12 text-center text-[var(--mocha)] space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--dusty-rose)]" />
              <p className="font-serif italic">Loading expression profile data...</p>
            </div>
          ) : error ? (
            <div className="glass-card p-8 text-center text-red-500 flex items-center justify-center gap-2">
              <AlertTriangle size={18} /> {error}
            </div>
          ) : !data ? (
            <div className="glass-card p-8 text-center text-[var(--mocha)]">Select a gene symbol to load explorer details.</div>
          ) : (
            <div className="space-y-6">
              {/* Statistics Card */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4 font-serif">
                  <Activity size={18} className="text-[var(--dusty-rose)]" />
                  Statistical Cohort Breakdown: <span className="font-mono-gene text-[var(--dusty-rose)]">{data.gene}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(data.stats).map(([group, stat]) => (
                    <div key={group} className="p-4 rounded-2xl bg-[var(--bg-cream)] border border-[var(--glass-border)] text-xs space-y-2">
                      <span className="font-bold text-[var(--cocoa)] tracking-wide uppercase text-[10px]">{group} Cohort</span>
                      <div className="grid grid-cols-2 gap-2 font-mono-gene text-[var(--mocha)]">
                        <div>Mean: <span className="font-bold text-[var(--cocoa)]">{stat.mean.toFixed(4)}</span></div>
                        <div>Median: <span className="font-bold text-[var(--cocoa)]">{stat.median.toFixed(4)}</span></div>
                        <div>Std Dev: <span className="font-bold text-[var(--cocoa)]">{stat.std.toFixed(4)}</span></div>
                        <div>Samples: <span className="font-bold text-[var(--cocoa)]">{stat.count}</span></div>
                        <div className="col-span-2">Range: <span className="font-bold text-[var(--cocoa)]">[{stat.min.toFixed(3)}, {stat.max.toFixed(3)}]</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 min-h-[350px]">
                  <Plot
                    data={histTraces}
                    layout={histLayout as any}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                    config={{ responsive: true, displayModeBar: false }}
                  />
                </div>
                <div className="glass-card p-6 min-h-[350px]">
                  <Plot
                    data={boxTraces}
                    layout={boxLayout as any}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                    config={{ responsive: true, displayModeBar: false }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
