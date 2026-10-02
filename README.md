# 🌸 GeneScope AI

### Interactive Transcriptomic Biomarker Discovery Platform

<p align="center">
  <em>From gene-expression data to interpretable molecular insight.</em>
</p>

<p align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.2.10-6D564A?style=for-the-badge\&logo=next.js\&logoColor=FFFDF9)
![React](https://img.shields.io/badge/React-19.2.4-DFA7C7?style=for-the-badge\&logo=react\&logoColor=FFFDF9)
![TypeScript](https://img.shields.io/badge/TypeScript-5-C4B7D4?style=for-the-badge\&logo=typescript\&logoColor=FFFDF9)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-E8A0BF?style=for-the-badge\&logo=fastapi\&logoColor=FFFDF9)
![Python](https://img.shields.io/badge/Python-3.10+-8B6F61?style=for-the-badge\&logo=python\&logoColor=FFFDF9)
![Docker](https://img.shields.io/badge/Docker-Ready-6D564A?style=for-the-badge\&logo=docker\&logoColor=FFFDF9)

</p>

<p align="center">

<a href="#-overview">Overview</a> · <a href="#-features">Features</a> · <a href="#-analysis-pipeline">Pipeline</a> · <a href="#-architecture">Architecture</a> · <a href="#-datasets">Datasets</a> · <a href="#-getting-started">Getting Started</a> · <a href="#-api">API</a> · <a href="#-deployment">Deployment</a>

</p>

---

## ✦ Overview

**GeneScope AI** is a full-stack computational biology platform designed to make transcriptomic analysis more interactive, interpretable, and accessible.

The platform transforms gene-expression matrices into an exploratory molecular analysis environment where users can investigate:

* comparative cancer gene-expression profiles
* differentially expressed genes
* metastatic versus primary tumor patterns
* sarcoma subtype-specific signatures
* principal component structure
* clustered expression heatmaps
* individual gene distributions
* TP53-associated transcriptional patterns
* downloadable analysis results
* custom uploaded expression datasets

Rather than presenting omics analysis as a collection of disconnected scripts, GeneScope AI brings the analytical workflow together inside a single web application.

> **GeneScope AI connects computational analysis with visual molecular storytelling.**

---

## 🌷 What It Does

GeneScope AI currently provides two major analysis tracks:

### 🎀 Breast Cancer Progression

The breast-cancer workflow compares:

**Primary Tumors → Metastatic Tumors**

and supports differential expression analysis, expression profiling, PCA, heatmap visualization, gene exploration, and TP53-focused analysis.

### 🌸 Sarcoma Subtype Profiling

The sarcoma workflow supports comparative exploration of:

| Sarcoma subtype  |
| ---------------- |
| Osteosarcoma     |
| Leiomyosarcoma   |
| Liposarcoma      |
| Rhabdomyosarcoma |

The application supports both:

**One-vs-Rest analysis**

and

**Pairwise subtype comparison**

for identifying subtype-associated expression differences.

---

# ✧ Core Features

## 01 · Interactive Dashboard

A centralized analysis dashboard provides a visual overview of the selected dataset, including:

* sample and gene metrics
* cohort/group distributions
* expression summaries
* differential-expression summaries
* interactive analytical visualizations
* quick navigation into deeper analysis modules

The application shell is designed around a glassmorphism-inspired research interface with rounded cards, subtle motion, and a muted rose/cream palette.

---

## 02 · Differential Gene Expression

GeneScope AI computes differential expression using **Welch's independent two-sample t-test** and calculates log fold change from group-level expression means.

For the breast-cancer workflow:

```text
Metastatic vs Primary
```

Genes are classified according to configurable:

```text
|logFC| ≥ threshold
p-value < threshold
```

into:

* Upregulated
* Downregulated
* Not Significant

The API exposes configurable `logFC` and `p-value` thresholds for reproducible exploratory comparisons.

---

## 03 · Volcano Analysis

The differential-expression results can be visualized as a volcano-style analytical view using:

```text
X-axis → logFC
Y-axis → -log10(p-value)
```

This makes it easier to inspect genes showing both substantial expression differences and statistical evidence.

---

## 04 · PCA

Principal Component Analysis is used to project the expression matrix into two dimensions.

The platform reports:

```text
PC1
PC2
Variance explained
Sample identity
Group identity
```

This supports rapid visual inspection of sample-level structure and separation between biological groups.

---

## 05 · Clustered Heatmaps

GeneScope AI generates expression heatmaps using:

* selectable top-gene subsets
* row-wise normalization
* hierarchical clustering
* Euclidean distance
* average linkage
* gene clustering
* sample clustering

For the breast-cancer workflow, the heatmap can use top differential-expression results.

For sarcoma, variable or subtype-associated genes can be used to construct the comparative matrix.

---

## 06 · Gene Explorer

The **Gene Explorer** enables focused analysis of an individual gene across available groups.

For a selected gene, the backend calculates:

```text
Mean
Median
Standard deviation
Minimum
Maximum
Sample count
Raw expression values
```

This creates a bridge between global transcriptomic patterns and gene-level inspection.

---

## 07 · TP53 Pathway Analysis

A dedicated TP53 analysis module provides a focused view of TP53-associated transcriptomic patterns.

The interface combines:

* pathway-level scoring
* TP53-related gene filtering
* target-gene visualization
* transcription-network diagrams
* fold-change visualization
* contextual target annotations

The current implementation includes a predefined set of TP53-related target markers used by the platform's seeded breast-cancer analysis workflow.

---

## 08 · Sarcoma Biomarker Exploration

Sarcoma analysis is built around four modeled subtypes:

```text
Osteosarcoma
Leiomyosarcoma
Liposarcoma
Rhabdomyosarcoma
```

The platform supports:

### One-vs-Rest

```text
Subtype A vs All Other Subtypes
```

### Pairwise

```text
Subtype A vs Subtype B
```

Each comparison can report:

```text
Gene
logFC
p-value
-log10(p-value)
Regulation
```

---

## 09 · Dataset Explorer

The Dataset Explorer allows users to inspect expression matrices through:

* sample metadata
* group information
* gene-level columns
* pagination
* gene search
* group filtering

The frontend can retrieve available genes and inspect expression values interactively rather than requiring direct manipulation of raw matrices.

---

## 10 · Custom Dataset Upload

GeneScope AI supports custom expression datasets through the backend upload endpoint.

Supported formats:

```text
CSV
TXT
XLSX
XLS
```

The uploader expects:

```text
First column → Sample identifier
One group column → Biological class / condition
Remaining columns → Gene-expression features
```

Recognized group-column alternatives include:

```text
Subtype
Class
Type
Group
Label
group_name
```

Uploaded datasets are inserted into the application's SQLAlchemy-backed database and immediately become available to the analytical API.

---

## 11 · Result Export

Analysis outputs can be exported as CSV files.

Supported exports include:

```text
Expression matrix
Differential-expression results
```

This allows downstream work in:

* Python
* R
* Excel
* statistical software
* manuscript preparation workflows

---

# 🧬 Analysis Pipeline

The analytical workflow follows a modular process:

```text
                    ┌───────────────────────┐
                    │   Expression Dataset  │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  Dataset Ingestion    │
                    │  + Metadata Mapping   │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Expression Matrix     │
                    │ Sample × Gene         │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
        Differential         PCA              Gene Explorer
        Expression                            & Statistics
              │
              ▼
        Volcano Analysis
              │
              ▼
        Significant /
        Ranked Genes
              │
              ▼
        Clustered Heatmap
              │
              ├──────────────► TP53 Analysis
              │
              └──────────────► Sarcoma Comparisons
```

---

# 🔬 Statistical Methods

## Differential Expression

The current backend implementation uses:

```python
scipy.stats.ttest_ind(
    case_data,
    control_data,
    equal_var=False,
    axis=0,
    nan_policy="omit"
)
```

which performs Welch's two-sample t-test.

For the breast-cancer workflow, log fold change is calculated as:

```text
logFC =
log2(mean(case) + 1)
−
log2(mean(control) + 1)
```

The default exploratory thresholds are:

```text
|logFC| ≥ 1.0
p-value < 0.05
```

These thresholds can be changed from the application.

### Important methodological note

GeneScope AI is currently positioned as an **exploratory transcriptomic analysis platform**.

For publication-grade RNA-seq differential-expression studies, additional steps such as raw-count-aware modeling, normalization appropriate to the experimental design, multiple-testing correction, batch-effect assessment, covariate modeling, and independent validation should be considered before drawing biological conclusions.

---

# 🌸 Seeded Example Data

The repository includes an automatically generated demonstration dataset so the application can be explored without first importing external data.

## Breast Cancer

The seeded breast-cancer dataset contains:

```text
120 samples
310 genes
60 Primary samples
60 Metastatic samples
```

The demonstration data is generated deterministically with a fixed random seed and includes a set of named molecular features used by the application for visualization and TP53-focused exploration.

## Sarcoma

The seeded sarcoma dataset models:

```text
4 subtypes
35 samples per subtype
140 total samples
```

The subtype-specific feature design includes representative marker genes associated with:

* osteogenic differentiation
* smooth-muscle lineage
* adipocytic biology
* myogenic differentiation

along with pan-sarcoma genes and additional synthetic features for demonstration.

> **The bundled datasets are demonstration data generated by the repository's seeding logic and should not be interpreted as clinical or experimentally validated patient data.**

---

# 🏗 Architecture

GeneScope AI follows a clean full-stack architecture:

```text
┌────────────────────────────────────────────────────┐
│                    Frontend                        │
│                                                    │
│ Next.js 16                                         │
│ React 19                                           │
│ TypeScript                                         │
│ Tailwind CSS                                       │
│ Recharts                                           │
│ Plotly                                             │
│ Framer Motion                                      │
│ Lucide React                                       │
└───────────────────────┬────────────────────────────┘
                        │
                        │ REST API
                        ▼
┌────────────────────────────────────────────────────┐
│                     Backend                        │
│                                                    │
│ FastAPI                                            │
│ Python                                             │
│ Pydantic                                           │
│ SQLAlchemy                                         │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│              Computational Layer                   │
│                                                    │
│ NumPy                                              │
│ Pandas                                             │
│ SciPy                                              │
│ scikit-learn                                       │
│ SciPy Hierarchical Clustering                      │
└───────────────────────┬────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│                    Data Layer                      │
│                                                    │
│ SQLite                                              │
│ DatasetModel                                       │
│ SampleModel                                        │
│ ExpressionModel                                    │
└────────────────────────────────────────────────────┘
```

---

# 🗂 Repository Structure

```text
OMICS-CANCER/
│
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       └── deploy.yml
│
├── backend/
│   ├── api/
│   │   └── routes.py
│   │
│   ├── services/
│   │   └── analysis_service.py
│   │
│   ├── database.py
│   ├── main.py
│   ├── seed.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── dataset/
│   │   │   ├── dge/
│   │   │   ├── export/
│   │   │   ├── gene-explorer/
│   │   │   ├── heatmap/
│   │   │   ├── pca/
│   │   │   ├── sarcoma/
│   │   │   ├── settings/
│   │   │   ├── tp53/
│   │   │   ├── volcano/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   │
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
│
├── scripts/
│   ├── build_and_push.sh
│   ├── deploy_remote.sh
│   └── link_audit.py
│
├── docker-compose.yml
├── DEPLOYMENT.md
├── README_DEPLOY.md
│
└── OMICS_PBL_Comparative_Gene_Expression_Analysis...
    └── .ipynb
```

---

# 🧰 Technology Stack

## Frontend

| Technology    | Purpose                              |
| ------------- | ------------------------------------ |
| Next.js       | Application framework                |
| React         | UI architecture                      |
| TypeScript    | Type-safe frontend development       |
| Tailwind CSS  | Styling                              |
| Recharts      | Statistical/data charts              |
| Plotly        | Interactive scientific visualization |
| Framer Motion | UI motion and transitions            |
| Lucide React  | Interface icons                      |

## Backend

| Technology | Purpose                      |
| ---------- | ---------------------------- |
| FastAPI    | REST API framework           |
| SQLAlchemy | Database ORM                 |
| Pydantic   | Data validation              |
| Uvicorn    | ASGI server                  |
| Python     | Analysis and backend runtime |

## Computational Biology / Data Science

| Technology   | Purpose                            |
| ------------ | ---------------------------------- |
| NumPy        | Numerical computation              |
| Pandas       | Data manipulation                  |
| SciPy        | Statistical testing and clustering |
| scikit-learn | Principal Component Analysis       |
| OpenPyXL     | Excel file support                 |

## Infrastructure

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| Docker         | Containerization               |
| Docker Compose | Multi-service orchestration    |
| GitHub Actions | CI/CD workflows                |
| SQLite         | Lightweight persistent storage |

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

```text
Node.js 18+
Python 3.10+
Docker
Docker Compose
```

---

## Option A · Run with Docker Compose

Clone the repository:

```bash
git clone https://github.com/ViivianREINE/OMICS-CANCER.git
cd OMICS-CANCER
```

Build the containers:

```bash
docker compose build
```

Start the services:

```bash
docker compose up -d
```

The application services are available at:

```text
Frontend → http://localhost:3000
Backend  → http://localhost:8000
API Docs → http://localhost:8000/docs
Health   → http://localhost:8000/health
```

To inspect logs:

```bash
docker compose logs -f
```

---

# 💻 Local Development

## Backend

Move into the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it.

### Windows

```bash
.venv\Scripts\activate
```

### macOS / Linux

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

---

## Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 🔌 API

GeneScope AI exposes a RESTful API through FastAPI.

### Overview

```http
GET /api/overview
```

### Dataset

```http
GET /api/dataset
```

### Differential Expression

```http
GET /api/dge
```

### Volcano Data

```http
GET /api/volcano
```

### Heatmap

```http
GET /api/heatmap
```

### PCA

```http
GET /api/pca
```

### Gene List

```http
GET /api/gene/list
```

### Individual Gene

```http
GET /api/gene/{gene_name}
```

### TP53 Analysis

```http
GET /api/tp53
```

### Sarcoma Overview

```http
GET /api/sarcoma/overview
```

### Sarcoma PCA

```http
GET /api/sarcoma/pca
```

### Sarcoma Heatmap

```http
GET /api/sarcoma/heatmap
```

### Sarcoma Differential Expression

```http
GET /api/sarcoma/dge
```

### Dataset Upload

```http
POST /api/upload-dataset
```

### CSV Export

```http
GET /api/export/csv
```

### Available Datasets

```http
GET /api/datasets
```

---

# 📊 Typical Workflow

A typical user session can follow:

```text
1. Open GeneScope AI
        ↓
2. Select a dataset
        ↓
3. Inspect sample / gene overview
        ↓
4. Explore PCA structure
        ↓
5. Inspect differential-expression results
        ↓
6. Examine volcano patterns
        ↓
7. Investigate clustered heatmaps
        ↓
8. Open individual genes
        ↓
9. Explore TP53 or sarcoma-specific analysis
        ↓
10. Export results
```

For custom research datasets:

```text
Upload Dataset
      ↓
Metadata Detection
      ↓
Database Ingestion
      ↓
Expression Matrix
      ↓
Analysis Modules
      ↓
Visualization
      ↓
Export
```

---

# 🎨 Design System

GeneScope AI intentionally uses a soft scientific-luxury visual identity.

### Core palette

```text
Cream        #F7F3EE
Off White    #FFFDF9
Blush Pink   #F7D6E6
Dusty Rose   #DFA7C7
Soft Rose    #E8A0BF
Mocha        #8B6F61
Cocoa        #6D564A
Lavender     #C4B7D4
```

### Typography

```text
Headings      → Playfair Display
Secondary     → Cormorant Garamond
Interface     → Inter
Gene / Data   → JetBrains Mono
```

### UI language

The frontend uses:

* soft glassmorphism
* translucent cards
* rounded 24px containers
* subtle shadows
* muted rose gradients
* responsive layouts
* animated loading states
* scientific data tables
* interactive visualizations
* lightweight motion effects

The result is intended to feel closer to a **modern computational-biology workspace** than a conventional analytics dashboard.

---

# 🐳 Deployment

The repository includes Docker-based deployment support and GitHub Actions workflows.

Build locally:

```bash
docker compose build --no-cache
```

Start:

```bash
docker compose up -d
```

The backend database is persisted using the Compose volume configuration.

For remote deployment, the repository includes helper scripts and deployment documentation.

See:

```text
DEPLOYMENT.md
README_DEPLOY.md
```

The repository also provides GitHub Actions workflows for CI/CD and container deployment.

---

# 🧪 Research & Educational Use

GeneScope AI is suitable for:

* bioinformatics coursework
* omics project demonstrations
* exploratory transcriptomic analysis
* biomarker-discovery workflows
* cancer genomics education
* computational-biology portfolios
* interactive data-visualization demonstrations
* research prototyping

It is particularly useful for demonstrating how:

```text
Biological question
        ↓
Expression data
        ↓
Statistical analysis
        ↓
Feature selection
        ↓
Visualization
        ↓
Biological interpretation
```

can be integrated into one computational environment.

---

# ⚠️ Scientific Scope & Limitations

GeneScope AI should be regarded as an **exploratory computational analysis platform**, not a clinical diagnostic system.

The included demonstration datasets are generated by the repository itself and are not substitutes for validated clinical cohorts or experimentally generated biological measurements.

For rigorous research studies, users should consider:

* raw-count-aware statistical models
* appropriate normalization
* multiple-testing correction
* batch-effect analysis
* biological covariates
* independent validation cohorts
* pathway databases and functional enrichment
* experimentally validated biomarkers
* external replication
* domain-expert interpretation

Results generated by the demonstration workflow should therefore be interpreted in the context of its data-generation and statistical assumptions.

---

# 🌱 Future Directions

Potential extensions include:

```text
RNA-seq count-aware differential expression
        ↓
Multiple-testing correction
        ↓
Batch-effect correction
        ↓
Pathway enrichment
        ↓
Gene Ontology analysis
        ↓
KEGG / Reactome integration
        ↓
Survival analysis
        ↓
Machine-learning biomarker ranking
        ↓
External dataset validation
        ↓
Multi-omics integration
```

Other possible extensions include:

* GEO / TCGA dataset retrieval
* automated annotation
* interactive pathway networks
* biomarker ranking
* ROC/AUC evaluation
* clinical metadata integration
* reproducible analysis reports
* publication-ready figure generation
* PostgreSQL-backed production deployment

---

# 📚 Notebook

The repository also contains the project notebook:

```text
OMICS_PBL_Comparative_Gene_Expression_Analysis_of_Cancer_Progression_and_Sarcoma_Subtypes_Using_Transcriptomic_Biomarker_Discovery_and_Interactive_Visualization.ipynb
```

The notebook serves as a computational companion to the interactive platform and provides the analytical/project context behind the application.

---

# 🤍 Project Philosophy

GeneScope AI was built around a simple principle:

> **Omics data should not remain trapped inside notebooks and spreadsheets.**

Modern transcriptomic analysis increasingly involves large, multidimensional datasets. GeneScope AI aims to make that information easier to interrogate by combining:

```text
Computational Biology
          +
Statistical Analysis
          +
Interactive Visualization
          +
Modern Web Engineering
```

into one cohesive experience.

---

# ✦ Project Identity

**Project:** GeneScope AI
**Repository:** OMICS-CANCER
**Domain:** Bioinformatics / Cancer Transcriptomics / Computational Biology
**Focus:** Transcriptomic biomarker discovery and comparative gene-expression analysis
**Architecture:** Full-stack web platform
**Primary languages:** Python + TypeScript

---

# 🌸 Author

Developed by **Priyam Parashar**

GitHub: [@ViivianREINE](https://github.com/ViivianREINE)

Project repository:
[OMICS-CANCER](https://github.com/ViivianREINE/OMICS-CANCER)

---

# 📄 License

Please add the repository's intended license here before publishing the project for external reuse.

A standard open-source option such as **MIT License** can be added if that matches your intended distribution model.

---

<p align="center">

### 🌷 GeneScope AI

<em>Explore expression. Discover patterns. Understand biology.</em>

</p>

<p align="center">
  <sub>Built at the intersection of bioinformatics, data science, and modern web engineering.</sub>
</p>
