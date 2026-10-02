"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Download, Upload, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import api, { DatasetExplorer } from "@/lib/api";

export default function DatasetExplorerPage() {
  const [datasetId, setDatasetId] = useState("breast_cancer");
  const [datasetsList, setDatasetsList] = useState<{ id: string; name: string; description: string }[]>([]);
  
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [data, setData] = useState<DatasetExplorer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [uploadGroupCol, setUploadGroupCol] = useState("Label");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Fetch datasets list
  const fetchDatasets = () => {
    api.listDatasets()
      .then(setDatasetsList)
      .catch(() => {});
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const loadData = () => {
    setLoading(true);
    api.getDataset({ dataset_id: datasetId, search, group, page, pageSize })
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
  }, [datasetId, search, group, page, pageSize]);

  // Handle uploading custom dataset
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadName || !uploadId) {
      setUploadError("Please fill in all fields and select a file.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await fetch(
        `http://localhost:8000/api/upload-dataset?name=${encodeURIComponent(uploadName)}&id=${encodeURIComponent(
          uploadId
        )}&group_col=${encodeURIComponent(uploadGroupCol)}`,
        {
          method: "POST",
          body: formData,
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Upload failed");

      setUploadSuccess(json.message || "Dataset uploaded successfully!");
      setUploadFile(null);
      setUploadName("");
      setUploadId("");
      fetchDatasets();
      setDatasetId(uploadId); // switch to new dataset
      setTimeout(() => setUploadOpen(false), 2000);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Heatmap gradient calculations
  const getCellColor = (val: unknown) => {
    const num = Number(val);
    if (isNaN(num)) return {};
    // Breast cancer lognormal values scale up to 15-20 usually. Let's cap scaling at 12.0
    const intensity = Math.min(num / 12.0, 1.0);
    return {
      backgroundColor: `rgba(223, 167, 199, ${intensity * 0.5})`, // blending dusty rose
      color: intensity > 0.6 ? "#4a2c3a" : "inherit",
    };
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">Transcriptomic Dataset Explorer</h1>
          <p className="text-sm text-[var(--mocha)]">Upload, query, and review mRNA gene expression profiles</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Select Dataset dropdown */}
          <select
            value={datasetId}
            onChange={(e) => {
              setDatasetId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm bg-[var(--bg-cream)] border border-[var(--glass-border)] rounded-xl outline-none"
          >
            <option value="breast_cancer">Comparative Breast Cancer (GSE21050)</option>
            <option value="sarcoma">Comparative Sarcoma subtypes</option>
            {datasetsList.filter(d => d.id !== "breast_cancer" && d.id !== "sarcoma").map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <button
            onClick={() => setUploadOpen(true)}
            className="btn-primary flex items-center gap-2 text-xs py-2 px-4"
          >
            <Upload size={14} /> Upload Custom
          </button>
          
          <a
            href={api.getExportUrl(datasetId, "expression")}
            download
            className="btn-secondary flex items-center gap-2 text-xs py-2 px-4"
          >
            <Download size={14} /> Export CSV
          </a>
        </div>
      </div>

      {/* Upload Modal overlay */}
      <AnimatePresence>
        {uploadOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md space-y-4"
            >
              <h3 className="text-xl font-bold">Upload Custom Dataset</h3>
              <p className="text-xs text-[var(--mocha)]">
                Files must be CSV, TXT, or Excel. The first column will be treated as Sample ID.
              </p>
              
              <form onSubmit={handleUpload} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Dataset ID (alphanumeric, no spaces)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. gse_prostate"
                    value={uploadId}
                    onChange={(e) => setUploadId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Dataset Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Comparative Prostate Cancer Analysis"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Group Column Header</label>
                  <input
                    type="text"
                    placeholder="Label (default)"
                    value={uploadGroupCol}
                    onChange={(e) => setUploadGroupCol(e.target.value)}
                    className="w-full p-2.5 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Select File</label>
                  <input
                    type="file"
                    required
                    accept=".csv,.txt,.xlsx,.xls"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full p-2"
                  />
                </div>

                {uploadError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} /> {uploadError}
                  </div>
                )}

                {uploadSuccess && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 rounded-xl">
                    {uploadSuccess}
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadOpen(false);
                      setUploadError(null);
                    }}
                    className="btn-secondary py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="btn-primary py-2 flex items-center gap-2"
                  >
                    {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Upload"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Query Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mocha)]" />
          <input
            type="text"
            placeholder="Search genes... (e.g. TP53)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl outline-none text-sm placeholder-[var(--mocha)]/60"
          />
        </div>

        <div className="flex gap-4 items-center w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-sm text-[var(--mocha)]">
            <Filter size={14} /> Group:
            <select
              value={group}
              onChange={(e) => {
                setGroup(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1.5 bg-[var(--bg-cream)] border border-[var(--glass-border)] rounded-xl outline-none"
            >
              <option value="All">All Groups</option>
              {datasetId === "breast_cancer" ? (
                <>
                  <option value="Primary">Primary</option>
                  <option value="Metastatic">Metastatic</option>
                </>
              ) : datasetId === "sarcoma" ? (
                <>
                  <option value="Osteosarcoma">Osteosarcoma</option>
                  <option value="Leiomyosarcoma">Leiomyosarcoma</option>
                  <option value="Liposarcoma">Liposarcoma</option>
                  <option value="Rhabdomyosarcoma">Rhabdomyosarcoma</option>
                </>
              ) : (
                <>
                  <option value="0">Group 0 / Case</option>
                  <option value="1">Group 1 / Control</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          {loading ? (
            <div className="p-12 text-center text-[var(--mocha)] space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--dusty-rose)]" />
              <p className="font-serif italic">Loading expression matrix...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : !data || data.data.length === 0 ? (
            <div className="p-8 text-center text-[var(--mocha)]">No samples or matching genes found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="left-0 z-20 bg-[var(--bg-cream)] font-mono-gene">Sample Name</th>
                  <th className="font-mono-gene">Regulation Group</th>
                  {data.display_genes.map((gene) => (
                    <th key={gene} className="font-mono-gene text-center min-w-[120px]">{gene}</th>
                  ))}
                  {data.genes.length > data.display_genes.length && (
                    <th className="font-mono-gene text-[var(--mocha)] text-xs italic">+{data.genes.length - 25} more genes</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.data.map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold text-[var(--cocoa)] font-mono-gene">{String(row.sample_name)}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        row.group_name === "Metastatic" || ["Osteosarcoma", "Leiomyosarcoma", "Liposarcoma", "Rhabdomyosarcoma"].includes(String(row.group_name))
                          ? "bg-[var(--blush-pink)] text-[var(--cocoa)]"
                          : "bg-[var(--glass-border)] text-[var(--mocha)]"
                      }`}>
                        {String(row.group_name)}
                      </span>
                    </td>
                    {data.display_genes.map((gene) => {
                      const val = row[gene];
                      return (
                        <td
                          key={gene}
                          className="font-mono-gene text-center"
                          style={getCellColor(val)}
                        >
                          {typeof val === "number" ? val.toFixed(4) : String(val)}
                        </td>
                      );
                    })}
                    {data.genes.length > data.display_genes.length && (
                      <td className="text-center text-[var(--mocha)]/50 font-serif italic">...</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        {!loading && data && data.total > 0 && (
          <div className="p-4 border-t border-[var(--glass-border)] bg-[var(--bg-cream)]/50 flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
            <span className="text-[var(--mocha)]">
              Showing samples {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="btn-secondary py-1 px-3 flex items-center gap-1 disabled:opacity-50"
              >
                <ChevronLeft size={12} /> Prev
              </button>
              <span className="px-3 py-1 flex items-center text-[var(--cocoa)] font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="btn-secondary py-1 px-3 flex items-center gap-1 disabled:opacity-50"
              >
                Next <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
