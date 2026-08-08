from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)

class ChatSource(BaseModel):
    type: str  # contract, knowledge_base
    title: str
    content: str
    relevance: float = 0.0
    metadata: Optional[dict] = None

class ChatResponse(BaseModel):
    id: str
    contract_id: str
    user_message: str
    ai_response: str
    sources: List[ChatSource] = []
    created_at: datetime

class ChatHistoryItem(BaseModel):
    id: str
    role: str
    content: str
    sources: List[dict] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    contract_id: str
    messages: List[ChatHistoryItem]
