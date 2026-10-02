import io
import pandas as pd
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db, DatasetModel, SampleModel, ExpressionModel
import services.analysis_service as analysis_service

router = APIRouter()

SARCOMA_SUBTYPES = ["Osteosarcoma", "Leiomyosarcoma", "Liposarcoma", "Rhabdomyosarcoma"]

# ── Overview ──────────────────────────────────────────────────────────────────
@router.get("/overview")
def get_overview(dataset_id: str = "breast_cancer", db: Session = Depends(get_db)):
    try:
        overview = analysis_service.get_dataset_overview(db, dataset_id)
        if not overview:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return overview
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Dataset Explorer ──────────────────────────────────────────────────────────
@router.get("/dataset")
def get_dataset(
    dataset_id: str = "breast_cancer",
    search: str = "",
    group: str = "All",
    page: int = 1,
    pageSize: int = 20,
    db: Session = Depends(get_db)
):
    try:
        pivoted, gene_cols = analysis_service.get_pivot_matrix(
            db, dataset_id, gene_filter=search if search else None, group_filter=group
        )
        if pivoted.empty:
            return {"data": [], "total": 0, "genes": [], "display_genes": []}

        total = len(pivoted)
        start = (page - 1) * pageSize
        end = start + pageSize

        meta_cols = ["sample_name", "group_name"]
        ordered_genes = sorted(gene_cols)
        display_genes = ordered_genes[:25]
        response_cols = meta_cols + display_genes

        paginated_df = pivoted.iloc[start:end][response_cols]
        data_records = paginated_df.round(4).to_dict(orient="records")

        return {"data": data_records, "total": total, "genes": ordered_genes, "display_genes": display_genes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── DGE ───────────────────────────────────────────────────────────────────────
@router.get("/dge")
def get_dge(
    dataset_id: str = "breast_cancer",
    lfc_thresh: float = 1.0,
    p_thresh: float = 0.05,
    case_group: str = "Metastatic",
    control_group: str = "Primary",
    db: Session = Depends(get_db)
):
    try:
        deg = analysis_service.run_dge(db, dataset_id, lfc_thresh, p_thresh, case_group, control_group)
        if deg.empty:
            return []
        return deg.round(6).to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Volcano ───────────────────────────────────────────────────────────────────
@router.get("/volcano")
def get_volcano(
    dataset_id: str = "breast_cancer",
    lfc_thresh: float = 1.0,
    p_thresh: float = 0.05,
    case_group: str = "Metastatic",
    control_group: str = "Primary",
    db: Session = Depends(get_db)
):
    try:
        deg = analysis_service.run_dge(db, dataset_id, lfc_thresh, p_thresh, case_group, control_group)
        if deg.empty:
            return []
        return deg.round(6).to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Heatmap ───────────────────────────────────────────────────────────────────
@router.get("/heatmap")
def get_heatmap(
    dataset_id: str = "breast_cancer",
    top_n: int = 20,
    normalize: bool = True,
    db: Session = Depends(get_db)
):
    try:
        heatmap_data = analysis_service.run_heatmap(db, dataset_id, top_n, normalize)
        return heatmap_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── PCA ───────────────────────────────────────────────────────────────────────
@router.get("/pca")
def get_pca(dataset_id: str = "breast_cancer", db: Session = Depends(get_db)):
    try:
        pca_data = analysis_service.run_pca(db, dataset_id)
        return pca_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Gene Explorer ─────────────────────────────────────────────────────────────
@router.get("/gene/list")
def get_gene_list(dataset_id: str = "breast_cancer", db: Session = Depends(get_db)):
    try:
        _, gene_cols = analysis_service.get_pivot_matrix(db, dataset_id)
        return {"genes": sorted(gene_cols)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/gene/{gene_name:path}")
def get_gene_details(gene_name: str, dataset_id: str = "breast_cancer", db: Session = Depends(get_db)):
    try:
        details = analysis_service.run_gene_explorer(db, dataset_id, gene_name)
        if not details:
            raise HTTPException(status_code=404, detail=f"Gene '{gene_name}' not found in dataset")
        return details
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── TP53 Pathway ──────────────────────────────────────────────────────────────
@router.get("/tp53")
def get_tp53_details(db: Session = Depends(get_db)):
    try:
        tp53_data = analysis_service.run_tp53_pathway(db)
        return tp53_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Sarcoma Overview ──────────────────────────────────────────────────────────
@router.get("/sarcoma/overview")
def get_sarcoma_overview(db: Session = Depends(get_db)):
    try:
        pivoted, _ = analysis_service.get_pivot_matrix(db, "sarcoma")
        ovr = analysis_service.run_sarcoma_ovr(db, 1.0, 0.05)

        summary_rows = []
        for subtype in SARCOMA_SUBTYPES:
            d = ovr[ovr["Subtype"] == subtype] if not ovr.empty else pd.DataFrame()
            samples_count = int((pivoted["group_name"] == subtype).sum()) if not pivoted.empty else 0
            up_degs = int((d["Regulation"] == "Upregulated").sum()) if not d.empty else 0
            dn_degs = int((d["Regulation"] == "Downregulated").sum()) if not d.empty else 0

            top_gene, top_lfc, top_p = "N/A", 0.0, 1.0
            if not d.empty:
                top_gene = str(d.iloc[0]["Gene"])
                top_lfc = float(d.iloc[0]["logFC"])
                top_p = float(d.iloc[0]["p_value"])

            summary_rows.append({
                "Subtype": subtype, "Samples": samples_count,
                "Upregulated": up_degs, "Downregulated": dn_degs,
                "TopMarker": top_gene, "TopMarkerLogFC": round(top_lfc, 3),
                "TopMarkerPValue": top_p
            })
        return summary_rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Sarcoma PCA ───────────────────────────────────────────────────────────────
@router.get("/sarcoma/pca")
def get_sarcoma_pca(db: Session = Depends(get_db)):
    try:
        return analysis_service.run_pca(db, "sarcoma")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Sarcoma Heatmap ───────────────────────────────────────────────────────────
@router.get("/sarcoma/heatmap")
def get_sarcoma_heatmap(top_n: int = 24, normalize: bool = True, db: Session = Depends(get_db)):
    try:
        pivoted, gene_cols = analysis_service.get_pivot_matrix(db, "sarcoma")
        if pivoted.empty:
            return {}

        ovr = analysis_service.run_sarcoma_ovr(db, 1.0, 0.05)

        selected_genes = []
        if not ovr.empty:
            for s in SARCOMA_SUBTYPES:
                selected_genes += ovr[
                    (ovr["Subtype"] == s) & (ovr["Regulation"] == "Upregulated")
                ].head(6)["Gene"].tolist()

        selected_genes = list(dict.fromkeys(selected_genes))[:top_n]
        if len(selected_genes) < 2:
            selected_genes = sorted(gene_cols)[:top_n]

        mean_mat = pivoted.groupby("group_name")[selected_genes].mean()
        # Reorder by subtype order
        available = [s for s in SARCOMA_SUBTYPES if s in mean_mat.index]
        mean_mat = mean_mat.loc[available]

        if normalize:
            row_stds = mean_mat.std(axis=1).replace(0, 1)
            heatmap_df = mean_mat.sub(mean_mat.mean(axis=1), axis=0).div(row_stds, axis=0)
        else:
            heatmap_df = mean_mat

        matrix_data = []
        for group in heatmap_df.index:
            for gene in heatmap_df.columns:
                matrix_data.append({
                    "group": str(group), "gene": str(gene),
                    "value": round(float(heatmap_df.loc[group, gene]), 4)
                })

        return {"genes": list(heatmap_df.columns), "subtypes": list(heatmap_df.index), "matrix": matrix_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Sarcoma DGE ───────────────────────────────────────────────────────────────
@router.get("/sarcoma/dge")
def get_sarcoma_dge(
    type: str = "ovr",
    subtype: str = "Osteosarcoma",
    subtype_b: str = "Leiomyosarcoma",
    lfc_thresh: float = 1.0,
    p_thresh: float = 0.05,
    db: Session = Depends(get_db)
):
    try:
        if type == "ovr":
            ovr = analysis_service.run_sarcoma_ovr(db, lfc_thresh, p_thresh)
            if ovr.empty:
                return []
            return ovr[ovr["Subtype"] == subtype].round(6).to_dict(orient="records")
        else:
            pair = analysis_service.run_sarcoma_pairwise(db, subtype, subtype_b, lfc_thresh, p_thresh)
            if pair.empty:
                return []
            return pair.round(6).to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Upload Dataset ────────────────────────────────────────────────────────────
@router.post("/upload-dataset")
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Query(...),
    id: str = Query(...),
    group_col: str = Query("Label"),
    db: Session = Depends(get_db)
):
    try:
        contents = await file.read()
        filename = file.filename or ""
        if filename.endswith(".csv") or filename.endswith(".txt"):
            df = pd.read_csv(io.BytesIO(contents), sep=None, engine="python")
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV, TXT, or XLSX.")

        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        sample_id_col = df.columns[0]
        if group_col not in df.columns:
            for alt in ["Subtype", "Class", "Type", "Group", "Label", "group_name"]:
                if alt in df.columns:
                    group_col = alt
                    break
            else:
                raise HTTPException(status_code=400, detail=f"Group column '{group_col}' not found.")

        gene_cols = [c for c in df.columns if c not in [sample_id_col, group_col]]
        if len(gene_cols) < 2:
            raise HTTPException(status_code=400, detail="Dataset must have at least 2 gene columns")

        existing = db.query(DatasetModel).filter(DatasetModel.id == id).first()
        if existing:
            db.delete(existing)
            db.commit()

        dataset = DatasetModel(id=id, name=name,
                               description=f"User uploaded: {filename} ({len(df)} samples, {len(gene_cols)} genes)")
        db.add(dataset)
        db.commit()

        samples_list = []
        for _, row in df.iterrows():
            s = SampleModel(dataset_id=id, sample_name=str(row[sample_id_col]), group_name=str(row[group_col]))
            db.add(s)
            samples_list.append(s)
        db.commit()

        expressions_data = []
        for s_idx, sample in enumerate(samples_list):
            row_data = df.iloc[s_idx]
            for gene in gene_cols:
                expressions_data.append({"sample_id": sample.id, "gene_name": gene,
                                         "expression_value": float(row_data[gene])})
        db.bulk_insert_mappings(ExpressionModel, expressions_data)
        db.commit()

        return {"success": True, "message": f"Loaded '{name}': {len(df)} samples, {len(gene_cols)} genes."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ── Export CSV ────────────────────────────────────────────────────────────────
@router.get("/export/csv")
def export_csv(
    dataset_id: str = "breast_cancer",
    export_type: str = "expression",
    lfc_thresh: float = 1.0,
    p_thresh: float = 0.05,
    db: Session = Depends(get_db)
):
    try:
        if export_type == "dge":
            df = analysis_service.run_dge(db, dataset_id, lfc_thresh, p_thresh)
            filename = f"{dataset_id}_DEG_results.csv"
        else:
            df, _ = analysis_service.get_pivot_matrix(db, dataset_id)
            filename = f"{dataset_id}_expression_matrix.csv"

        if df.empty:
            raise HTTPException(status_code=404, detail="No data to export")

        stream = io.StringIO()
        df.to_csv(stream, index=False)
        return StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Datasets list ─────────────────────────────────────────────────────────────
@router.get("/datasets")
def list_datasets(db: Session = Depends(get_db)):
    try:
        datasets = db.query(DatasetModel).all()
        return [{"id": d.id, "name": d.name, "description": d.description} for d in datasets]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
