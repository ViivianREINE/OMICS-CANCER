"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Award,
  BookOpen,
  PieChart as PieIcon,
  BarChart4,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import api, { OverviewData } from "@/lib/api";

export default function Dashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    api.getOverview("breast_cancer")
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (!mounted) return null;

  // Custom colors for premium theme
  const PIE_COLORS = ["#8B6F61", "#DFA7C7"]; // Cocoa, Dusty Rose
  const REGULATION_COLORS = ["#D4618C", "#9B8EC4", "#D9D0C7"]; // Pink, Lavender, Beige

  // Mock data/fallback in case API is loading or fails
  const stats = {
    samples: data?.n_samples ?? 120,
    genes: data?.n_genes ?? 310,
    upregulated: data?.regulation_summary?.upregulated ?? 9,
    downregulated: data?.regulation_summary?.downregulated ?? 0,
    primary: data?.groups["Primary"] ?? 60,
    metastatic: data?.groups["Metastatic"] ?? 60,
  };

  const pieData = [
    { name: "Primary Tumors", value: stats.primary },
    { name: "Metastatic Tumors", value: stats.metastatic },
  ];

  const regData = [
    { name: "Upregulated", value: stats.upregulated },
    { name: "Downregulated", value: stats.downregulated },
    { name: "Not Significant", value: stats.genes - stats.upregulated - stats.downregulated },
  ];

  // Map library sizes to show density distribution
  const libSizes = data?.library_sizes ?? [];
  const chartData = libSizes.map((item, index) => ({
    name: item.sample_name,
    size: Math.round(item.library_size),
    group: item.group_name,
  })).sort((a, b) => a.size - b.size);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-12 relative overflow-hidden"
      >
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--blush-pink)]/50 text-[var(--cocoa)] text-xs font-semibold tracking-wider uppercase">
            <Activity className="w-3.5 h-3.5 text-[var(--dusty-rose)] animate-pulse" />
            Precision Oncology Research Suite
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--cocoa)] leading-tight">
            Comparative Gene Expression <br />
            <span className="font-serif italic font-normal text-[var(--dusty-rose)]">
              Analysis of Cancer Progression
            </span>
          </h1>
          <p className="text-base md:text-lg text-[var(--mocha)] leading-relaxed">
            Interactive transcriptomic biomarker discovery using differential expression analysis,
            pathway analysis, and machine learning. Replicate Welch's t-test evaluations, 
            dimensional PCA breakdowns, and sarcoma subclass insights.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/dge" className="btn-primary flex items-center gap-2 shadow-lg">
              Launch Analysis <ArrowUpRight size={16} />
            </Link>
            <Link href="/dataset" className="btn-secondary flex items-center gap-2">
              Explore Dataset <Layers size={16} />
            </Link>
          </div>
        </div>

        {/* Decorative Floating Nodes inside Glass */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center w-80 h-80 pointer-events-none">
          <div className="dna-helix relative w-24 h-48 flex items-center justify-between">
            {Array.from({ length: 8 }).map((_, idx) => (
              <motion.div
                key={idx}
                className="absolute w-3 h-3 rounded-full bg-[var(--dusty-rose)]"
                style={{
                  top: `${idx * 24}px`,
                  left: idx % 2 === 0 ? "10px" : "60px",
                }}
                animate={{
                  x: idx % 2 === 0 ? [0, 50, 0] : [0, -50, 0],
                  scale: [1, 0.7, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: idx * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </motion.section>

      {/* KPI Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Samples", value: stats.samples, desc: "Sequenced profiles", icon: BookOpen },
          { label: "Genes Analyzed", value: stats.genes, desc: "Probe set size", icon: Award },
          { label: "Upregulated Genes", value: stats.upregulated, desc: "logFC > 1, p < 0.05", icon: TrendingUp },
          { label: "Downregulated Genes", value: stats.downregulated, desc: "logFC < -1, p < 0.05", icon: TrendingUp },
          { label: "Primary Tumors", value: stats.primary, desc: "Stage baseline", icon: Layers },
          { label: "Metastatic Tumors", value: stats.metastatic, desc: "Malignant profiles", icon: Activity },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="kpi-card flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-[var(--mocha)] uppercase tracking-wider">
                  {kpi.label}
                </span>
                <Icon size={16} className="text-[var(--dusty-rose)] opacity-70" />
              </div>
              <div>
                <span className="text-3xl font-bold font-mono-gene text-[var(--cocoa)]">
                  {kpi.value}
                </span>
                <p className="text-[10px] text-[var(--mocha)] mt-1">{kpi.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Charts Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sample distribution */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
              <PieIcon size={18} className="text-[var(--dusty-rose)]" />
              Sample Distribution
            </h3>
            <p className="text-xs text-[var(--mocha)]">Primary vs metastatic sample group balances</p>
          </div>
          <div className="h-56 flex items-center justify-center">
            {loading ? (
              <div className="w-full h-full skeleton" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-cream)",
                      borderColor: "var(--glass-border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex justify-around text-xs text-[var(--mocha)]">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[0] }} />
              Primary ({stats.primary})
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[1] }} />
              Metastatic ({stats.metastatic})
            </span>
          </div>
        </div>

        {/* Library Size boxplot/density */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[350px] lg:col-span-2">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
              <BarChart4 size={18} className="text-[var(--dusty-rose)]" />
              Library Size Distribution
            </h3>
            <p className="text-xs text-[var(--mocha)]">
              Sum expression profiles per sample (Primary vs Metastatic groups)
            </p>
          </div>
          <div className="h-56">
            {loading ? (
              <div className="w-full h-full skeleton" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLib" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--dusty-rose)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--dusty-rose)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={["dataMin - 100", "dataMax + 100"]} stroke="var(--mocha)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-cream)",
                      borderColor: "var(--glass-border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="size"
                    stroke="var(--dusty-rose)"
                    fillOpacity={1}
                    fill="url(#colorLib)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="text-[10px] text-[var(--mocha)] flex justify-between">
            <span>Minimum size: ~{chartData[0]?.size ?? 8000}</span>
            <span>Maximum size: ~{chartData[chartData.length - 1]?.size ?? 14000}</span>
          </div>
        </div>
      </section>

      {/* Regulation overview summary */}
      <section className="glass-card p-6">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
          <TrendingUp size={18} className="text-[var(--dusty-rose)]" />
          Gene Regulation Summary
        </h3>
        <p className="text-xs text-[var(--mocha)] mb-6">
          Distribution of differentially expressed genes based on current settings (|logFC| &gt; 1, p &lt; 0.05)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="h-44 md:col-span-2">
            {loading ? (
              <div className="w-full h-full skeleton" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--glass-border)" />
                  <XAxis type="number" stroke="var(--mocha)" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="var(--mocha)" fontSize={10} width={100} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-cream)",
                      borderColor: "var(--glass-border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {regData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={REGULATION_COLORS[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="font-semibold text-red-500 block mb-1">Upregulated ({stats.upregulated})</span>
              <p className="text-[10px] text-[var(--mocha)]">Statistically higher expression in metastatic cancer progression.</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="font-semibold text-blue-500 block mb-1">Downregulated ({stats.downregulated})</span>
              <p className="text-[10px] text-[var(--mocha)]">Suppressed expressions indicating pathway silencing in progressed states.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
