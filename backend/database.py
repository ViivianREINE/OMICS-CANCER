import os
from sqlalchemy import create_engine, Column, String, Integer, Float, ForeignKey, Index
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
os.makedirs(DATABASE_DIR, exist_ok=True)
DATABASE_URL = f"sqlite:///{os.path.join(DATABASE_DIR, 'genescope.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DatasetModel(Base):
    __tablename__ = "datasets"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    samples = relationship("SampleModel", back_populates="dataset", cascade="all, delete-orphan")

class SampleModel(Base):
    __tablename__ = "samples"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    sample_name = Column(String, nullable=False)
    group_name = Column(String, nullable=False) # e.g. "Primary", "Metastatic", "Osteosarcoma", etc.
    
    dataset = relationship("DatasetModel", back_populates="samples")
    expressions = relationship("ExpressionModel", back_populates="sample", cascade="all, delete-orphan")

class ExpressionModel(Base):
    __tablename__ = "expressions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sample_id = Column(Integer, ForeignKey("samples.id"), nullable=False)
    gene_name = Column(String, nullable=False)
    expression_value = Column(Float, nullable=False)
    
    sample = relationship("SampleModel", back_populates="expressions")

# Indexes to ensure fast queries
Index("ix_expressions_sample_id_gene", ExpressionModel.sample_id, ExpressionModel.gene_name)
Index("ix_expressions_gene_name", ExpressionModel.gene_name)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
