"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Printer, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react";
import api, { OverviewData, Tp53Data, SarcomaOverview } from "@/lib/api";

export default function ExportPage() {
  const [bcOverview, setBcOverview] = useState<OverviewData | null>(null);
  const [tp53Data, setTp53Data] = useState<Tp53Data | null>(null);
  const [sarcOverview, setSarcOverview] = useState<SarcomaOverview[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getOverview("breast_cancer"),
      api.getTp53(),
      api.getSarcomaOverview()
    ])
      .then(([bc, tp53, sarc]) => {
        setBcOverview(bc);
        setTp53Data(tp53);
        setSarcOverview(sarc);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      window.print(); // Fallback print utility
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Report & Publishing Hub</h1>
          <p className="text-sm text-[var(--mocha)]">Compile, format, and download clinical research sheets</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="btn-secondary py-2 flex items-center gap-2 text-xs"
          >
            <Printer size={14} /> Print Summary
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="btn-primary py-2 flex items-center gap-2 text-xs"
          >
            {isExporting ? <RefreshCw className="animate-spin" size={14} /> : <FileText size={14} />}
            {isExporting ? "Compiling..." : "Export PDF Report"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-[var(--mocha)] space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--dusty-rose)]" />
          <p className="font-serif italic">Compiling research metadata...</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-red-500 flex items-center justify-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Printable Report Summary Preview */}
          <div className="glass-card p-8 lg:col-span-2 space-y-6 bg-white dark:bg-[#211e1b] print:shadow-none print:border-none print:p-0" id="printable-report-preview">
            <div className="border-b-2 border-[var(--glass-border)] pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold font-serif text-[var(--cocoa)]">GeneScope AI Platform Report</h2>
                <p className="text-xs text-[var(--mocha)]">Generated on: {new Date().toLocaleDateString()} | Clinical Biomarker Summary</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--dusty-rose)] block">Research Sheet</span>
                <span className="text-xs font-semibold text-[var(--mocha)] block">ID: GSE21050-SARC-PBL</span>
              </div>
            </div>

            {/* Section A: Breast Cancer */}
            <div className="space-y-3">
              <h3 className="text-md font-bold font-serif text-[var(--cocoa)] border-b border-[var(--glass-border)] pb-1">
                A. Breast Cancer Progression Evaluator
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono-gene text-[var(--mocha)]">
                <div>Samples: <span className="font-bold text-[var(--cocoa)]">{bcOverview?.n_samples}</span></div>
                <div>Genes: <span className="font-bold text-[var(--cocoa)]">{bcOverview?.n_genes}</span></div>
                <div>Upregulated: <span className="font-bold text-red-500">+{bcOverview?.regulation_summary.upregulated}</span></div>
                <div>Downregulated: <span className="font-bold text-blue-500">-{bcOverview?.regulation_summary.downregulated}</span></div>
              </div>
            </div>

            {/* Section B: TP53 Pathway */}
            <div className="space-y-3">
              <h3 className="text-md font-bold font-serif text-[var(--cocoa)] border-b border-[var(--glass-border)] pb-1">
                B. TP53 Pathway Transcripts
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono-gene text-[var(--mocha)]">
                <div>Pathway Score: <span className="font-bold text-[var(--cocoa)]">{tp53Data?.activation_score.toFixed(1)}%</span></div>
                <div>Significant Targets: <span className="font-bold text-[var(--cocoa)]">{tp53Data?.significant_tp53_count} / {tp53Data?.total_tp53_found}</span></div>
              </div>
            </div>

            {/* Section C: Sarcoma subtypes */}
            <div className="space-y-3">
              <h3 className="text-md font-bold font-serif text-[var(--cocoa)] border-b border-[var(--glass-border)] pb-1">
                C. Sarcoma Subtype Comparisons
              </h3>
              <table className="w-full text-left text-[11px] text-[var(--mocha)] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] font-bold text-[var(--cocoa)]">
                    <th className="py-2">Subtype</th>
                    <th className="py-2 text-center">Samples</th>
                    <th className="py-2 text-center">Upregulated DEGs</th>
                    <th className="py-2">Top Biomarker Marker</th>
                  </tr>
                </thead>
                <tbody>
                  {sarcOverview.map((sub) => (
                    <tr key={sub.Subtype} className="border-b border-[var(--glass-border)]">
                      <td className="py-2 font-semibold">{sub.Subtype}</td>
                      <td className="py-2 text-center font-mono-gene">{sub.Samples}</td>
                      <td className="py-2 text-center font-mono-gene text-red-500 font-semibold">+{sub.Upregulated}</td>
                      <td className="py-2 font-mono-gene font-semibold">{sub.TopMarker}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick downloads block */}
          <div className="glass-card p-6 space-y-4 h-fit">
            <h3 className="text-lg font-bold border-b border-[var(--glass-border)] pb-2 font-serif">Quick Downloads</h3>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[var(--bg-cream)] border border-[var(--glass-border)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--cocoa)] block">Expression Matrix</span>
                  <span className="text-[10px] text-[var(--mocha)]">Raw mRNA transcript matrix</span>
                </div>
                <a
                  href={api.getExportUrl("breast_cancer", "expression")}
                  download
                  className="p-2 bg-[var(--blush-pink)] hover:bg-[var(--blush-pink)]/70 rounded-xl text-[var(--cocoa)]"
                >
                  <Download size={14} />
                </a>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-cream)] border border-[var(--glass-border)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--cocoa)] block">DGE Welsh's Results</span>
                  <span className="text-[10px] text-[var(--mocha)]">logFC & p-value results</span>
                </div>
                <a
                  href={api.getExportUrl("breast_cancer", "dge")}
                  download
                  className="p-2 bg-[var(--blush-pink)] hover:bg-[var(--blush-pink)]/70 rounded-xl text-[var(--cocoa)]"
                >
                  <Download size={14} />
                </a>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--bg-cream)] border border-[var(--glass-border)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--cocoa)] block">Sarcoma Expression Matrix</span>
                  <span className="text-[10px] text-[var(--mocha)]">Marker gene matrix for 4 types</span>
                </div>
                <a
                  href={api.getExportUrl("sarcoma", "expression")}
                  download
                  className="p-2 bg-[var(--blush-pink)] hover:bg-[var(--blush-pink)]/70 rounded-xl text-[var(--cocoa)]"
                >
                  <Download size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
