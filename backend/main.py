import sys
import os

# Add backend directory to path so imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, SessionLocal
from api.routes import router
import seed as seed_module
from database import DatasetModel

app = FastAPI(
    title="GeneScope AI API",
    description="Interactive Transcriptomic Biomarker Discovery Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.on_event("startup")
def startup():
    # Ensure database tables exist
    init_db()

    # Auto-seed example datasets when database is empty so sarcoma endpoints work
    db = SessionLocal()
    try:
        existing = db.query(DatasetModel).first()
        if not existing:
            # seed_module.main() will initialize DB and populate example datasets
            try:
                seed_module.main()
            except Exception:
                # If seeding fails during startup, don't crash the whole app
                pass
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "GeneScope AI API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
