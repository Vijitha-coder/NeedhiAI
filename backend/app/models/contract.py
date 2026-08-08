from sqlalchemy import Column, String, DateTime, Integer, Text, Float
from datetime import datetime
import uuid
from app.database.database import Base

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True, nullable=False)

    title = Column(String, nullable=False)
    type = Column(String, default="General")
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, default=0)

    status = Column(String, default="uploaded")  # uploaded, processing, analyzed, failed
    pages = Column(Integer, default=1)

    extracted_text = Column(Text, default="")
    cleaned_text = Column(Text, default="")

    # Analysis JSON stored as text
    analysis_json = Column(Text, default="")

    risk_level = Column(String, default="low")  # low, medium, high
    risk_score = Column(Integer, default=0)

    summary = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
