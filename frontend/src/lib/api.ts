const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API request failed");
  }
  return res.json();
}

/* ── Types ──────────────────────────────────────────────────────────────────── */
export interface OverviewData {
  dataset_id: string;
  n_samples: number;
  n_genes: number;
  groups: Record<string, number>;
  library_sizes: { sample_name: string; group_name: string; library_size: number }[];
  regulation_summary: { upregulated: number; downregulated: number; not_significant: number };
}

export interface DgeRow {
  Gene: string;
  logFC: number;
  p_value: number;
  "-log10(p_value)": number;
  Regulation: string;
}

export interface PcaData {
  variance_explained: number[];
  samples: { sample_name: string; group_name: string; PC1: number; PC2: number }[];
}

export interface GeneExplorerData {
  gene: string;
  stats: Record<string, { mean: number; median: number; std: number; min: number; max: number; count: number }>;
  raw_values: { group: string; value: number }[];
}

export interface Tp53Data {
  total_tp53_found: number;
  significant_tp53_count: number;
  activation_score: number;
  pathway_genes: DgeRow[];
  all_tp53_genes: DgeRow[];
}

export interface SarcomaOverview {
  Subtype: string;
  Samples: number;
  Upregulated: number;
  Downregulated: number;
  TopMarker: string;
  TopMarkerLogFC: number;
  TopMarkerPValue: number;
}

export interface HeatmapData {
  genes: string[];
  samples?: string[];
  groups?: string[];
  subtypes?: string[];
  matrix: { gene: string; sample?: string; group: string; value: number }[];
}

export interface DatasetExplorer {
  data: Record<string, unknown>[];
  total: number;
  genes: string[];
  display_genes: string[];
}

/* ── API Functions ──────────────────────────────────────────────────────────── */
export const api = {
  getOverview: (datasetId = "breast_cancer") =>
    fetchApi<OverviewData>(`/overview?dataset_id=${datasetId}`),

  getDataset: (params: { dataset_id?: string; search?: string; group?: string; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    sp.set("dataset_id", params.dataset_id || "breast_cancer");
    if (params.search) sp.set("search", params.search);
    if (params.group) sp.set("group", params.group);
    sp.set("page", String(params.page || 1));
    sp.set("pageSize", String(params.pageSize || 20));
    return fetchApi<DatasetExplorer>(`/dataset?${sp}`);
  },

  getDge: (params: { lfc?: number; p?: number; dataset_id?: string }) => {
    const sp = new URLSearchParams();
    sp.set("dataset_id", params.dataset_id || "breast_cancer");
    sp.set("lfc_thresh", String(params.lfc ?? 1.0));
    sp.set("p_thresh", String(params.p ?? 0.05));
    return fetchApi<DgeRow[]>(`/dge?${sp}`);
  },

  getVolcano: (params: { lfc?: number; p?: number; dataset_id?: string }) => {
    const sp = new URLSearchParams();
    sp.set("dataset_id", params.dataset_id || "breast_cancer");
    sp.set("lfc_thresh", String(params.lfc ?? 1.0));
    sp.set("p_thresh", String(params.p ?? 0.05));
    return fetchApi<DgeRow[]>(`/volcano?${sp}`);
  },

  getHeatmap: (params: { dataset_id?: string; top_n?: number; normalize?: boolean }) => {
    const sp = new URLSearchParams();
    sp.set("dataset_id", params.dataset_id || "breast_cancer");
    sp.set("top_n", String(params.top_n ?? 20));
    sp.set("normalize", String(params.normalize ?? true));
    return fetchApi<HeatmapData>(`/heatmap?${sp}`);
  },

  getPca: (datasetId = "breast_cancer") =>
    fetchApi<PcaData>(`/pca?dataset_id=${datasetId}`),

  getGeneList: (datasetId = "breast_cancer") =>
    fetchApi<{ genes: string[] }>(`/gene/list?dataset_id=${datasetId}`),

  // List available datasets
  listDatasets: () => fetchApi<{ id: string; name: string; description: string }[]>(`/datasets`),

  getGene: (geneName: string, datasetId = "breast_cancer") =>
    fetchApi<GeneExplorerData>(`/gene/${encodeURIComponent(geneName)}?dataset_id=${datasetId}`),

  getTp53: () => fetchApi<Tp53Data>("/tp53"),

  getSarcomaOverview: () => fetchApi<SarcomaOverview[]>("/sarcoma/overview"),

  getSarcomaPca: () => fetchApi<PcaData>("/sarcoma/pca"),

  getSarcomaHeatmap: (topN = 24) => fetchApi<HeatmapData>(`/sarcoma/heatmap?top_n=${topN}`),

  getSarcomaDge: (params: { type?: string; subtype?: string; subtype_b?: string; lfc?: number; p?: number }) => {
    const sp = new URLSearchParams();
    sp.set("type", params.type || "ovr");
    sp.set("subtype", params.subtype || "Osteosarcoma");
    if (params.subtype_b) sp.set("subtype_b", params.subtype_b);
    sp.set("lfc_thresh", String(params.lfc ?? 1.0));
    sp.set("p_thresh", String(params.p ?? 0.05));
    return fetchApi<DgeRow[]>(`/sarcoma/dge?${sp}`);
  },

  getExportUrl: (datasetId: string, type = "expression") =>
    `${API_BASE}/export/csv?dataset_id=${datasetId}&export_type=${type}`,
};

export default api;
