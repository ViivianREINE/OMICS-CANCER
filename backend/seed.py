import numpy as np
import pandas as pd
from database import init_db, SessionLocal, DatasetModel, SampleModel, ExpressionModel

SARCOMA_SUBTYPES = ["Osteosarcoma", "Leiomyosarcoma", "Liposarcoma", "Rhabdomyosarcoma"]
SARCOMA_MARKER_GENES = {
    "Osteosarcoma": ["RUNX2", "SP7", "COL1A1", "ALPL", "IBSP", "BGLAP", "MMP13", "VEGFA"],
    "Leiomyosarcoma": ["ACTA2", "TAGLN", "MYH11", "DES", "CNN1", "CALD1", "MYLK", "TPM2"],
    "Liposarcoma": ["MDM2", "CDK4", "HMGA2", "PPARG", "CEBPA", "FABP4", "LPL", "ADIPOQ"],
    "Rhabdomyosarcoma": ["MYOD1", "MYOG", "PAX3", "PAX7", "DES", "MYF5", "MYH3", "TNNT3"],
}
PAN_SARCOMA_GENES = ["TP53", "RB1", "CDKN2A", "CCND1", "MKI67", "BCL2", "VEGFA", "MMP2", "MMP9", "PTEN"]

def seed_breast_cancer(db):
    print("Generating breast cancer dataset...")
    rng = np.random.default_rng(42)
    n_samples, n_genes = 120, 310

    gene_names = [f"gene_{i}" for i in range(n_genes - 10)] + [
        "tumor protein p53",
        "TP53 regulated inhibitor of apoptosis 1",
        "TP53 induced glycolysis regulatory phosphatase",
        "TP53 induced nuclear protein 1",
        "TP53 target 1",
        "mitogen-activated protein kinase 1",
        "C-C motif chemokine ligand 5",
        "stathmin 1",
        "cyclin dependent kinase 8",
        "BCL2 like 11",
    ]

    labels = np.array([0] * 60 + [1] * 60, dtype=np.int8)
    data   = rng.lognormal(mean=3, sigma=1, size=(n_samples, n_genes)).astype(np.float32)
    # Replicate Cell 7 scaling for metastatic samples
    data[60:, -10:] *= rng.uniform(1.5, 3.5, size=(60, 10)).astype(np.float32)

    # Insert Dataset
    dataset = DatasetModel(
        id="breast_cancer",
        name="Comparative Breast Cancer Progression Dataset",
        description="Dataset mapping breast cancer progression across primary and metastatic tumors."
    )
    db.add(dataset)
    db.commit()

    samples_to_insert = []
    for i in range(n_samples):
        group_name = "Primary" if labels[i] == 0 else "Metastatic"
        sample = SampleModel(
            dataset_id="breast_cancer",
            sample_name=f"GSM_BC_{i:03d}",
            group_name=group_name
        )
        db.add(sample)
        samples_to_insert.append(sample)
    
    db.commit() # commit samples to get their IDs

    # Prepare bulk insertions for expressions
    expressions_data = []
    for s_idx, sample in enumerate(samples_to_insert):
        for g_idx, gene_name in enumerate(gene_names):
            val = float(data[s_idx, g_idx])
            expressions_data.append({
                "sample_id": sample.id,
                "gene_name": gene_name,
                "expression_value": val
            })
    
    print(f"Bulk inserting {len(expressions_data)} breast cancer expression values...")
    db.bulk_insert_mappings(ExpressionModel, expressions_data)
    db.commit()
    print("Breast cancer seeding complete.")

def seed_sarcoma(db):
    print("Generating sarcoma dataset...")
    n_per_subtype = 35
    rng = np.random.default_rng(2026)
    
    genes = sorted(list(set(sum(SARCOMA_MARKER_GENES.values(), []) + PAN_SARCOMA_GENES + [
        f"SARC_GENE_{i:03d}" for i in range(1, 181)
    ])))
    
    rows, labels = [], []
    for subtype in SARCOMA_SUBTYPES:
        for _ in range(n_per_subtype):
            base = rng.normal(loc=7.0, scale=0.8, size=len(genes))
            row = dict(zip(genes, base))
            # Subtype marker signal
            for g in SARCOMA_MARKER_GENES[subtype]:
                row[g] += rng.normal(2.2, 0.35)
            # Shared tumor progression signal
            for g in ["MKI67", "VEGFA", "MMP2", "MMP9"]:
                row[g] += rng.normal(0.8, 0.25)
            # Specific contrast signals
            if subtype == "Osteosarcoma":
                for g in ["RUNX2", "COL1A1", "ALPL", "IBSP"]: row[g] += rng.normal(0.7, 0.2)
            elif subtype == "Leiomyosarcoma":
                for g in ["ACTA2", "TAGLN", "MYH11", "CNN1"]: row[g] += rng.normal(0.7, 0.2)
            elif subtype == "Liposarcoma":
                for g in ["MDM2", "CDK4", "PPARG", "FABP4"]: row[g] += rng.normal(0.7, 0.2)
            elif subtype == "Rhabdomyosarcoma":
                for g in ["MYOD1", "MYOG", "PAX3", "PAX7"]: row[g] += rng.normal(0.7, 0.2)
            
            rows.append(row)
            labels.append(subtype)

    # Insert Dataset
    dataset = DatasetModel(
        id="sarcoma",
        name="Comparative Sarcoma Subtype Analysis Dataset",
        description="Dataset analyzing gene markers across four sarcoma subtypes."
    )
    db.add(dataset)
    db.commit()

    samples_to_insert = []
    for i in range(len(labels)):
        sample = SampleModel(
            dataset_id="sarcoma",
            sample_name=f"GSM_SARC_{i:03d}",
            group_name=labels[i]
        )
        db.add(sample)
        samples_to_insert.append(sample)
    
    db.commit()

    # Prepare bulk expressions
    expressions_data = []
    for s_idx, sample in enumerate(samples_to_insert):
        row_expr = rows[s_idx]
        for gene_name in genes:
            val = float(row_expr[gene_name])
            expressions_data.append({
                "sample_id": sample.id,
                "gene_name": gene_name,
                "expression_value": val
            })
            
    print(f"Bulk inserting {len(expressions_data)} sarcoma expression values...")
    db.bulk_insert_mappings(ExpressionModel, expressions_data)
    db.commit()
    print("Sarcoma seeding complete.")

def main():
    init_db()
    db = SessionLocal()
    try:
        # Check if already seeded to avoid double seeding
        existing = db.query(DatasetModel).first()
        if existing:
            print("Database already contains data. Skipping seeding.")
            return
        seed_breast_cancer(db)
        seed_sarcoma(db)
        print("All datasets seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
