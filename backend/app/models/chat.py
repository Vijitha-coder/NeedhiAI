from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from datetime import datetime
import uuid
from app.database.database import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    contract_id = Column(String, index=True, nullable=False)
    user_id = Column(String, index=True, nullable=False)

    role = Column(String, nullable=False)  # user, ai
    content = Column(Text, nullable=False)
    sources = Column(Text, default="")  # JSON string of sources

    created_at = Column(DateTime, default=datetime.utcnow)
