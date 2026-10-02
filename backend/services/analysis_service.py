import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from scipy.stats import ttest_ind, t as t_dist
from sklearn.decomposition import PCA
from scipy.cluster.hierarchy import linkage, dendrogram
from database import SampleModel, ExpressionModel, DatasetModel

SARCOMA_SUBTYPES = ["Osteosarcoma", "Leiomyosarcoma", "Liposarcoma", "Rhabdomyosarcoma"]

def get_pivot_matrix(db: Session, dataset_id: str, gene_filter: str = None, group_filter: str = None):
    """
    Helper function to query database and pivot expressions into a pandas DataFrame.
    Rows: Samples (with metadata: sample_name, group_name)
    Columns: Gene names
    """
    # Base query joining samples and expressions
    query = db.query(
        SampleModel.sample_name,
        SampleModel.group_name,
        ExpressionModel.gene_name,
        ExpressionModel.expression_value
    ).join(
        ExpressionModel, SampleModel.id == ExpressionModel.sample_id
    ).filter(
        SampleModel.dataset_id == dataset_id
    )

    if group_filter and group_filter != "All":
        query = query.filter(SampleModel.group_name == group_filter)
        
    df = pd.DataFrame(query.all(), columns=["sample_name", "group_name", "gene_name", "expression_value"])
    if df.empty:
        return pd.DataFrame(), []

    # Pivot: rows=sample_name, group_name; columns=gene_name
    pivoted = df.pivot(index=["sample_name", "group_name"], columns="gene_name", values="expression_value")
    
    if gene_filter:
        filtered_cols = [c for c in pivoted.columns if gene_filter.lower() in c.lower()]
        pivoted = pivoted[filtered_cols]

    return pivoted.reset_index(), list(pivoted.columns)

def get_dataset_overview(db: Session, dataset_id: str):
    """
    Returns metrics and summary stats for the dashboard page.
    """
    pivoted, gene_cols = get_pivot_matrix(db, dataset_id)
    if pivoted.empty:
        return {}

    n_samples = len(pivoted)
    n_genes = len(gene_cols)
    groups = pivoted["group_name"].value_counts().to_dict()

    # Calculate library sizes: sum of expression values row-wise
    lib_sizes = pivoted[gene_cols].sum(axis=1)
    lib_size_data = []
    for idx, row in pivoted.iterrows():
        lib_size_data.append({
            "sample_name": row["sample_name"],
            "group_name": row["group_name"],
            "library_size": float(lib_sizes[idx])
        })

    # Default DGE numbers for Breast Cancer
    up_count, dn_count, ns_count = 0, 0, 0
    if dataset_id == "breast_cancer":
        dge_results = run_dge(db, "breast_cancer", lfc_thresh=1.0, p_thresh=0.05)
        up_count = int((dge_results["Regulation"] == "Upregulated").sum())
        dn_count = int((dge_results["Regulation"] == "Downregulated").sum())
        ns_count = int((dge_results["Regulation"] == "Not Significant").sum())
    elif dataset_id == "sarcoma":
        # Sum upregulated genes across all subtype comparisons
        ovr = run_sarcoma_ovr(db, lfc_thresh=1.0, p_thresh=0.05)
        up_count = int((ovr["Regulation"] == "Upregulated").sum())
        dn_count = int((ovr["Regulation"] == "Downregulated").sum())
        ns_count = int((ovr["Regulation"] == "Not Significant").sum())

    return {
        "dataset_id": dataset_id,
        "n_samples": n_samples,
        "n_genes": n_genes,
        "groups": groups,
        "library_sizes": lib_size_data,
        "regulation_summary": {
            "upregulated": up_count,
            "downregulated": dn_count,
            "not_significant": ns_count
        }
    }

def run_dge(db: Session, dataset_id: str, lfc_thresh: float = 1.0, p_thresh: float = 0.05, case_group: str = "Metastatic", control_group: str = "Primary"):
    """
    Computes Welch's t-test and LogFold Change dynamically.
    For breast_cancer: case="Metastatic", control="Primary"
    """
    pivoted, gene_cols = get_pivot_matrix(db, dataset_id)
    if pivoted.empty:
        return pd.DataFrame()

    case_data = pivoted[pivoted["group_name"] == case_group][gene_cols].values.astype(np.float64)
    control_data = pivoted[pivoted["group_name"] == control_group][gene_cols].values.astype(np.float64)

    if case_data.shape[0] < 2 or control_data.shape[0] < 2:
        return pd.DataFrame()

    # Welch's t-test
    t_stats, p_values = ttest_ind(case_data, control_data, equal_var=False, axis=0, nan_policy="omit")
    
    # Log Fold Change calculation
    # Replicate logfc = np.log2(case_mean + 1) - np.log2(control_mean + 1)
    case_mean = case_data.mean(0)
    control_mean = control_data.mean(0)
    logfc = np.log2(case_mean + 1) - np.log2(control_mean + 1)

    deg = pd.DataFrame({
        "Gene": gene_cols,
        "logFC": logfc,
        "p_value": p_values,
    })
    
    # Clip p-values to avoid -log10(0)
    deg["-log10(p_value)"] = -np.log10(np.clip(deg["p_value"].astype(np.float64), 1e-300, 1.0))
    # Use inclusive thresholding for reproducibility (>=) and consistent p-value check
    deg["Regulation"] = np.select(
        [(deg["logFC"] >= lfc_thresh) & (deg["p_value"] < p_thresh),
         (deg["logFC"] <= -lfc_thresh) & (deg["p_value"] < p_thresh)],
        ["Upregulated", "Downregulated"], default="Not Significant"
    )

    return deg.sort_values("p_value").reset_index(drop=True)

def run_pca(db: Session, dataset_id: str):
    """
    Runs PCA and returns coordinates for all samples.
    """
    pivoted, gene_cols = get_pivot_matrix(db, dataset_id)
    if pivoted.empty:
        return {}

    x = pivoted[gene_cols].values.astype(np.float64)
    pca = PCA(n_components=2, random_state=42)
    pcs = pca.fit_transform(x)
    
    variance_explained = [float(v) for v in pca.explained_variance_ratio_]

    samples_pca = []
    for idx, row in pivoted.iterrows():
        samples_pca.append({
            "sample_name": row["sample_name"],
            "group_name": row["group_name"],
            "PC1": float(pcs[idx, 0]),
            "PC2": float(pcs[idx, 1])
        })

    return {
        "variance_explained": variance_explained,
        "samples": samples_pca
    }

def run_heatmap(db: Session, dataset_id: str, top_n: int = 20, normalize: bool = True):
    """
    Returns clustered heatmap matrix: sorted rows (genes) and columns (samples).
    For breast_cancer: uses top N significant genes from DGE.
    For sarcoma: uses top N most variable genes based on variance.
    """
    pivoted, gene_cols = get_pivot_matrix(db, dataset_id)
    if pivoted.empty:
        return {}

    # Determine which genes to include
    if dataset_id == "breast_cancer":
        dge_results = run_dge(db, "breast_cancer")
        sig_genes = dge_results.head(top_n)["Gene"].tolist()
    else: # sarcoma
        # calculate variance
        variance = pivoted[gene_cols].var(axis=0)
        sig_genes = variance.nlargest(top_n).index.tolist()

    if len(sig_genes) < 2:
        return {}

    # Extract expressions subset
    subset_df = pivoted[sig_genes].T # Rows: Genes, Columns: Samples
    subset_values = subset_df.values.astype(np.float64)

    # Normalize if requested (z-score row-wise)
    if normalize:
        row_means = subset_values.mean(axis=1, keepdims=True)
        row_stds = subset_values.std(axis=1, ddof=1, keepdims=True)
        row_stds[row_stds == 0] = 1.0 # prevent division by zero
        subset_values = (subset_values - row_means) / row_stds

    # Hierarchical Clustering using linkage
    try:
        # Linkage for genes (rows)
        gene_linkage = linkage(subset_values, method="average", metric="euclidean")
        gene_order = dendrogram(gene_linkage, no_plot=True)["leaves"]
    except Exception:
        gene_order = list(range(len(sig_genes)))

    try:
        # Linkage for samples (columns)
        sample_linkage = linkage(subset_values.T, method="average", metric="euclidean")
        sample_order = dendrogram(sample_linkage, no_plot=True)["leaves"]
    except Exception:
        sample_order = list(range(len(pivoted)))

    # Order genes & samples
    ordered_genes = [sig_genes[i] for i in gene_order]
    ordered_samples = [pivoted.iloc[i]["sample_name"] for i in sample_order]
    ordered_groups = [pivoted.iloc[i]["group_name"] for i in sample_order]

    # Reorder data values matrix
    ordered_matrix = subset_values[gene_order][:, sample_order]

    # Prepare response
    matrix_data = []
    for g_idx, gene in enumerate(ordered_genes):
        for s_idx, sample in enumerate(ordered_samples):
            matrix_data.append({
                "gene": gene,
                "sample": sample,
                "group": ordered_groups[s_idx],
                "value": float(ordered_matrix[g_idx, s_idx])
            })

    return {
        "genes": ordered_genes,
        "samples": ordered_samples,
        "groups": ordered_groups,
        "matrix": matrix_data
    }

def run_gene_explorer(db: Session, dataset_id: str, gene_name: str):
    """
    Returns expression distributions and summary metrics for a specific gene.
    """
    query = db.query(
        SampleModel.group_name,
        ExpressionModel.expression_value
    ).join(
        ExpressionModel, SampleModel.id == ExpressionModel.sample_id
    ).filter(
        SampleModel.dataset_id == dataset_id,
        ExpressionModel.gene_name == gene_name
    )

    df = pd.DataFrame(query.all(), columns=["group", "value"])
    if df.empty:
        return {}

    # Stats per group
    stats = {}
    for group, grp_df in df.groupby("group"):
        vals = grp_df["value"].values
        stats[group] = {
            "mean": float(vals.mean()),
            "median": float(np.median(vals)),
            "std": float(vals.std(ddof=1)) if len(vals) > 1 else 0.0,
            "min": float(vals.min()),
            "max": float(vals.max()),
            "count": int(len(vals))
        }

    # Raw list of values for boxplot/histograms
    raw_data = df.to_dict(orient="records")

    return {
        "gene": gene_name,
        "stats": stats,
        "raw_values": raw_data
    }

def run_tp53_pathway(db: Session):
    """
    Specific logic to compute TP53 pathway analysis metrics.
    Identifies 4 upregulated TP53 target genes.
    """
    # Run DGE for breast cancer
    dge = run_dge(db, "breast_cancer", lfc_thresh=1.0, p_thresh=0.05)
    if dge.empty:
        return {}

    # Filter TP53 related genes
    tp53_mask = dge["Gene"].str.contains("TP53", case=False, na=False)
    tp53_genes_df = dge[tp53_mask]

    # Specific requested pathway markers
    target_markers = [
        "TP53 target 1",
        "TP53 induced nuclear protein 1",
        "TP53 regulated inhibitor of apoptosis 1",
        "TP53 induced glycolysis regulatory phosphatase"
    ]
    
    # Ensure they are in the dataframe
    pathway_genes = dge[dge["Gene"].isin(target_markers)].to_dict(orient="records")
    all_tp53 = tp53_genes_df.to_dict(orient="records")

    # Activation Score calculation
    # In breast cancer, metastatic samples have significantly upregulated TP53 targets due to scaling.
    # Score represents percentage of pathologically active expression compared to baseline.
    # Score = sum of logFC of pathway genes / sum of maximum expected logFC * 100
    significant_up = [g for g in pathway_genes if g["Regulation"] == "Upregulated"]
    
    # Calculate a score from 0-100%
    if pathway_genes:
        avg_logfc = np.mean([g["logFC"] for g in pathway_genes])
        # scale logFC range (around 0 to 3.5) into a 0-100 score
        activation_score = float(np.clip((avg_logfc / 3.0) * 100, 0, 100))
    else:
        activation_score = 0.0

    return {
        "total_tp53_found": len(all_tp53),
        "significant_tp53_count": len([g for g in all_tp53 if g["Regulation"] != "Not Significant"]),
        "activation_score": activation_score,
        "pathway_genes": pathway_genes,
        "all_tp53_genes": all_tp53
    }

def run_sarcoma_ovr(db: Session, lfc_thresh: float = 1.0, p_thresh: float = 0.05):
    """
    Computes One-vs-Rest differential expression for all 4 sarcoma subtypes.
    """
    pivoted, gene_cols = get_pivot_matrix(db, "sarcoma")
    if pivoted.empty:
        return pd.DataFrame()

    results = []
    for subtype in SARCOMA_SUBTYPES:
        case = pivoted[pivoted["group_name"] == subtype][gene_cols].values.astype(np.float64)
        rest = pivoted[pivoted["group_name"] != subtype][gene_cols].values.astype(np.float64)
        
        if case.shape[0] < 2 or rest.shape[0] < 2:
            continue
            
        t_stats, p_values = ttest_ind(case, rest, equal_var=False, axis=0, nan_policy="omit")
        logfc = case.mean(0) - rest.mean(0) # Standard logFC for sarcoma subtype
        
        df = pd.DataFrame({
            "Subtype": subtype,
            "Gene": gene_cols,
            "logFC": logfc,
            "p_value": p_values
        })
        
        df["-log10(p_value)"] = -np.log10(np.clip(df["p_value"].astype(np.float64), 1e-300, 1.0))
        # Inclusive thresholding for sarcoma OVR
        df["Regulation"] = np.select(
            [(df["logFC"] >= lfc_thresh) & (df["p_value"] < p_thresh),
             (df["logFC"] <= -lfc_thresh) & (df["p_value"] < p_thresh)],
            ["Upregulated", "Downregulated"], default="Not Significant"
        )
        results.append(df)

    if not results:
        return pd.DataFrame()
        
    final_df = pd.concat(results, ignore_index=True)
    return final_df.sort_values(["p_value", "logFC"], ascending=[True, False]).reset_index(drop=True)

def run_sarcoma_pairwise(db: Session, subtype_a: str, subtype_b: str, lfc_thresh: float = 1.0, p_thresh: float = 0.05):
    """
    Computes Pairwise differential expression between subtype_a and subtype_b.
    """
    pivoted, gene_cols = get_pivot_matrix(db, "sarcoma")
    if pivoted.empty:
        return pd.DataFrame()

    a_data = pivoted[pivoted["group_name"] == subtype_a][gene_cols].values.astype(np.float64)
    b_data = pivoted[pivoted["group_name"] == subtype_b][gene_cols].values.astype(np.float64)

    if a_data.shape[0] < 2 or b_data.shape[0] < 2:
        return pd.DataFrame()

    t_stats, p_values = ttest_ind(a_data, b_data, equal_var=False, axis=0, nan_policy="omit")
    logfc = a_data.mean(0) - b_data.mean(0)

    df = pd.DataFrame({
        "Comparison": f"{subtype_a} vs {subtype_b}",
        "Gene": gene_cols,
        "logFC": logfc,
        "p_value": p_values
    })
    df["-log10(p_value)"] = -np.log10(np.clip(df["p_value"].astype(np.float64), 1e-300, 1.0))
    # For pairwise comparisons, standardize regulation labels to Up/Down for UI compatibility
    df["Regulation"] = np.select(
        [(df["logFC"] >= lfc_thresh) & (df["p_value"] < p_thresh),
         (df["logFC"] <= -lfc_thresh) & (df["p_value"] < p_thresh)],
        ["Upregulated", "Downregulated"], default="Not Significant"
    )
    return df.sort_values(["p_value", "logFC"], ascending=[True, False]).reset_index(drop=True)
