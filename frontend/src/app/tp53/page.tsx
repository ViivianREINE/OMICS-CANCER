"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Brain, CheckCircle, RefreshCw, AlertTriangle, HelpCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import api, { Tp53Data } from "@/lib/api";

export default function Tp53PathwayPage() {
  const [data, setData] = useState<Tp53Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    api.getTp53()
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pathway target descriptions
  const targetDescriptions: Record<string, string> = {
    "tumor protein p53": "Master transcription factor. Regulates DNA repair, cell cycle checkpoints, and apoptotic pathways.",
    "TP53 regulated inhibitor of apoptosis 1": "Crucial pro-survival brake. Highly upregulated to prevent premature apoptosis during genome repair cycles.",
    "TP53 induced glycolysis regulatory phosphatase": "Metabolic reprogrammer. Diverts glucose to the pentose phosphate pathway to supply NADPH for cellular defense.",
    "TP53 induced nuclear protein 1": "Nuclear stress factor. Promotes cell cycle arrest and cooperates with p53 to activate downstream targets.",
    "TP53 target 1": "Activated directly by p53. Linked to cellular stress mitigation and apoptotic initiation signaling.",
  };

  // Convert pathway genes to chart data
  const chartData = data?.pathway_genes.map((g) => ({
    name: g.Gene.replace("TP53 induced ", "").replace("TP53 regulated ", "").replace("tumor protein ", ""),
    logFC: g.logFC,
    Regulation: g.Regulation,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold font-serif">TP53 Pathway Analysis Suite</h1>
        <p className="text-sm text-[var(--mocha)]">Investigate molecular signaling, transcription targets, and pathway activation metrics</p>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-[var(--mocha)] space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--dusty-rose)]" />
          <p className="font-serif italic">Analyzing pathway signaling nodes...</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-red-500 flex items-center justify-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      ) : !data ? (
        <div className="glass-card p-8 text-center text-[var(--mocha)]">No TP53 pathway data returned.</div>
      ) : (
        <div className="space-y-6">
          {/* Top row: Score left, Diagram right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activation Score */}
            <div className="glass-card p-6 flex flex-col justify-between items-center text-center">
              <div className="w-full text-left">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-1 font-serif">
                  <Brain size={18} className="text-[var(--dusty-rose)]" />
                  Pathway Score
                </h3>
                <p className="text-xs text-[var(--mocha)]">Calculated activation score based on target transcripts</p>
              </div>

              <div className="relative w-44 h-44 my-4 flex items-center justify-center">
                {/* SVG circular track */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="88" cy="88" r="76" stroke="var(--glass-border)" strokeWidth="12" fill="transparent" />
                  <motion.circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke="var(--dusty-rose)"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={477}
                    initial={{ strokeDashoffset: 477 }}
                    animate={{ strokeDashoffset: 477 - (477 * data.activation_score) / 100 }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-bold font-mono-gene text-[var(--cocoa)]">
                    {data.activation_score.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-[var(--mocha)] uppercase tracking-wider mt-1">Active</span>
                </div>
              </div>

              <div className="text-xs text-green-600 font-semibold bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <CheckCircle size={14} /> Significant TP53 Target Activation Detected
              </div>
            </div>

            {/* Pathway Diagram */}
            <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-1 font-serif">
                  <Activity size={18} className="text-[var(--dusty-rose)]" />
                  TP53 Transcription Network
                </h3>
                <p className="text-xs text-[var(--mocha)]">Cellular signaling flow from oncogenic stress to cell cycle arrest / apoptosis</p>
              </div>

              {/* Responsive SVG Diagram */}
              <div className="h-48 flex items-center justify-center bg-[var(--bg-primary)]/50 rounded-2xl border border-[var(--glass-border)] p-4">
                <svg className="w-full h-full text-xs font-mono-gene text-[var(--mocha)]" viewBox="0 0 500 160">
                  {/* Stress block */}
                  <rect x="10" y="55" width="90" height="50" rx="10" fill="var(--bg-cream)" stroke="var(--glass-border)" strokeWidth="1.5" />
                  <text x="55" y="80" textAnchor="middle" fill="var(--cocoa)" fontWeight="bold">DNA Stress</text>
                  <text x="55" y="92" textAnchor="middle" fontSize="8" fill="var(--mocha)">Oncogenes</text>

                  {/* Arrow 1 */}
                  <line x1="100" y1="80" x2="140" y2="80" stroke="var(--mocha)" strokeWidth="1.5" markerEnd="url(#arrow)" />

                  {/* TP53 Core Node */}
                  <rect x="140" y="45" width="100" height="70" rx="15" fill="var(--blush-pink)" stroke="var(--dusty-rose)" strokeWidth="2" />
                  <text x="190" y="80" textAnchor="middle" fill="#4a2c3a" fontWeight="bold" fontSize="13">Active TP53</text>
                  <text x="190" y="95" textAnchor="middle" fontSize="8" fill="#4a2c3a">Transcription</text>

                  {/* Branching arrows */}
                  <path d="M 240 80 L 290 40" fill="none" stroke="var(--mocha)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <path d="M 240 80 L 290 80" fill="none" stroke="var(--mocha)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  <path d="M 240 80 L 290 120" fill="none" stroke="var(--mocha)" strokeWidth="1.5" markerEnd="url(#arrow)" />

                  {/* Targets */}
                  <rect x="290" y="15" width="180" height="35" rx="8" fill="var(--bg-cream)" stroke="var(--glass-border)" strokeWidth="1.2" />
                  <text x="380" y="36" textAnchor="middle" fontSize="9" fill="var(--cocoa)">TP53 Induced Nuclear Protein 1</text>

                  <rect x="290" y="62" width="180" height="35" rx="8" fill="var(--bg-cream)" stroke="var(--glass-border)" strokeWidth="1.2" />
                  <text x="380" y="83" textAnchor="middle" fontSize="9" fill="var(--cocoa)">TP53 Apoptotic Inhibitor 1</text>

                  <rect x="290" y="108" width="180" height="35" rx="8" fill="var(--bg-cream)" stroke="var(--glass-border)" strokeWidth="1.2" />
                  <text x="380" y="129" textAnchor="middle" fontSize="9" fill="var(--cocoa)">TP53 Glycolysis Phosphatase</text>

                  {/* Arrow markers */}
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--mocha)" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Bar Chart and Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar chart LogFC */}
            <div className="glass-card p-6 lg:col-span-2 flex flex-col justify-between min-h-[350px]">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-1 font-serif">
                  <Activity size={18} className="text-[var(--dusty-rose)]" />
                  Target Fold Change Projections
                </h3>
                <p className="text-xs text-[var(--mocha)] mb-4">Significant transcription logFC increases across metastatic states</p>
              </div>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                    <XAxis dataKey="name" fontSize={9} stroke="var(--mocha)" />
                    <YAxis stroke="var(--mocha)" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-cream)",
                        borderColor: "var(--glass-border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="logFC" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="var(--dusty-rose)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Target Descriptions */}
            <div className="glass-card p-6 space-y-4 max-h-[350px] overflow-y-auto">
              <h3 className="text-lg font-bold border-b border-[var(--glass-border)] pb-2 font-serif">Pathway Annotation</h3>
              <div className="space-y-3">
                {data.pathway_genes.map((gene) => (
                  <div key={gene.Gene} className="text-xs space-y-1">
                    <span className="font-bold text-[var(--cocoa)] font-mono-gene block">{gene.Gene}</span>
                    <p className="text-[11px] text-[var(--mocha)] leading-relaxed">{targetDescriptions[gene.Gene] || "Upregulated TP53 transcriptional signaling target node."}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
