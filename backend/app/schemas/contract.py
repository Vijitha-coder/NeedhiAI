from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class RiskItem(BaseModel):
    title: str
    severity: Severity
    explanation: str
    clause_reference: Optional[str] = None
    evidence: Optional[str] = None
    category: Optional[str] = None

class ClauseItem(BaseModel):
    title: str
    content: str
    type: str
    page_reference: Optional[str] = None
    risk_level: Optional[RiskLevel] = None

class DeadlineItem(BaseModel):
    description: str
    date: Optional[str] = None
    clause_reference: Optional[str] = None
    importance: Optional[str] = None

class ContractUploadResponse(BaseModel):
    id: str
    title: str
    file_name: str
    file_type: str
    status: str
    pages: int
    created_at: datetime

class ContractStatusResponse(BaseModel):
    id: str
    status: str
    progress: int
    message: str

class ContractAnalysisResponse(BaseModel):
    contract_id: str
    title: str
    risk_level: str
    risk_score: int
    summary: str
    key_clauses: List[ClauseItem] = []
    risks: List[RiskItem] = []
    rights: List[str] = []
    obligations: List[str] = []
    penalties: List[str] = []
    deadlines: List[DeadlineItem] = []
    pros: List[str] = []
    cons: List[str] = []
    renewal: List[str] = []
    termination: List[str] = []
    payment_clauses: List[str] = []
    missing_clauses: List[str] = []
    sources: List[dict] = []
    warnings: List[str] = []

class ContractListItem(BaseModel):
    id: str
    title: str
    type: str
    file_name: str
    status: str
    risk_level: str
    risk_score: int
    pages: int
    summary: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ContractDetailResponse(BaseModel):
    id: str
    title: str
    type: str
    file_name: str
    file_type: str
    file_size: int
    status: str
    pages: int
    risk_level: str
    risk_score: int
    summary: str
    extracted_text_preview: str
    analysis: Optional[ContractAnalysisResponse] = None
    created_at: datetime
    updated_at: datetime
