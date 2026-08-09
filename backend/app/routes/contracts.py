import os
import uuid
import json
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.models.user import User
from app.models.contract import Contract
from app.models.chat import ChatMessage
from app.utils.security import get_current_user
from app.config import settings
from app.schemas.contract import (
    ContractUploadResponse,
    ContractStatusResponse,
    ContractListItem,
    ContractDetailResponse,
    ContractAnalysisResponse
)
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse, ChatHistoryItem
from app.services.ocr.extractor import extract_text, clean_text, chunk_text
from app.services.rag.vector_store import get_contract_store, get_knowledge_store
from app.services.rag.knowledge_base import query_knowledge_base
from app.services.llm.llm_service import get_llm_service
from app.services.llm.analyzer import detect_contract_type

router = APIRouter(prefix="/contracts", tags=["contracts"])

def validate_file(file: UploadFile):
    # Check extension
    filename = file.filename.lower()
    ext = filename.split(".")[-1] if "." in filename else ""

    if ext not in settings.allowed_extensions_list:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}")

    # Size validation will be done after reading
    return ext

@router.post("/upload", response_model=ContractUploadResponse)
async def upload_contract(
    file: UploadFile = File(...),
    title: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ext = validate_file(file)

    # Save file
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()

            # Check size
            max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
            if len(content) > max_bytes:
                raise HTTPException(status_code=400, detail=f"File too large. Max {settings.MAX_FILE_SIZE_MB} MB")

            buffer.write(content)
            file_size = len(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Extract text
    try:
        raw_text, pages = extract_text(file_path, ext)
        cleaned = clean_text(raw_text)
    except Exception as e:
        cleaned = ""
        pages = 1
        print(f"Extraction failed: {e}")
        # Don't fail upload, but mark as needing manual review

    contract_title = title or file.filename.replace(f".{ext}", "").replace("_", " ").title()

    # Detect contract type
    ctype = detect_contract_type(contract_title, cleaned)

    # Create DB record
    contract = Contract(
        id=file_id,
        user_id=current_user.id,
        title=contract_title,
        type=ctype,
        file_name=file.filename,
        file_path=file_path,
        file_type=ext,
        file_size=file_size,
        status="uploaded",
        pages=pages,
        extracted_text=raw_text if 'raw_text' in locals() else "",
        cleaned_text=cleaned,
        summary="",
        risk_level="low",
        risk_score=0
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)

    # Index chunks into vector store for RAG
    try:
        chunks = chunk_text(cleaned)
        if chunks:
            store = get_contract_store()
            ids = [f"{file_id}_chunk_{i}" for i in range(len(chunks))]
            metadatas = [{"contract_id": file_id, "user_id": current_user.id, "chunk_index": i, "title": contract_title} for i in range(len(chunks))]
            store.add(ids=ids, texts=chunks, metadatas=metadatas)
    except Exception as e:
        print(f"Failed to index contract chunks: {e}")

    return ContractUploadResponse(
        id=contract.id,
        title=contract.title,
        file_name=contract.file_name,
        file_type=contract.file_type,
        status=contract.status,
        pages=contract.pages,
        created_at=contract.created_at
    )

@router.get("", response_model=List[ContractListItem])
def list_contracts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contracts = db.query(Contract).filter(Contract.user_id == current_user.id).order_by(Contract.created_at.desc()).all()

    result = []
    for c in contracts:
        # summary preview
        summary_preview = c.summary[:150] if c.summary else (c.cleaned_text[:150] if c.cleaned_text else "No summary")
        result.append(ContractListItem(
            id=c.id,
            title=c.title,
            type=c.type,
            file_name=c.file_name,
            status=c.status,
            risk_level=c.risk_level,
            risk_score=c.risk_score,
            pages=c.pages,
            summary=summary_preview,
            created_at=c.created_at,
            updated_at=c.updated_at
        ))

    return result

@router.get("/{contract_id}", response_model=ContractDetailResponse)
def get_contract(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.user_id == current_user.id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    analysis = None
    if contract.analysis_json:
        try:
            analysis_dict = json.loads(contract.analysis_json)
            analysis = ContractAnalysisResponse(**analysis_dict)
        except Exception as e:
            print(f"Failed to parse analysis json: {e}")

    preview = contract.cleaned_text[:500] if contract.cleaned_text else ""

    return ContractDetailResponse(
        id=contract.id,
        title=contract.title,
        type=contract.type,
        file_name=contract.file_name,
        file_type=contract.file_type,
        file_size=contract.file_size,
        status=contract.status,
        pages=contract.pages,
        risk_level=contract.risk_level,
        risk_score=contract.risk_score,
        summary=contract.summary,
        extracted_text_preview=preview,
        analysis=analysis,
        created_at=contract.created_at,
        updated_at=contract.updated_at
    )

@router.get("/{contract_id}/status", response_model=ContractStatusResponse)
def get_contract_status(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.user_id == current_user.id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    progress_map = {
        "uploaded": 10,
        "processing": 50,
        "analyzed": 100,
        "failed": 0
    }

    return ContractStatusResponse(
        id=contract.id,
        status=contract.status,
        progress=progress_map.get(contract.status, 0),
        message=f"Contract is {contract.status}"
    )

@router.post("/{contract_id}/analyze", response_model=ContractAnalysisResponse)
def analyze_contract(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.user_id == current_user.id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if not contract.cleaned_text or len(contract.cleaned_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Contract text is empty or too short, cannot analyze. Try re-uploading.")

    # Update status to processing
    contract.status = "processing"
    db.commit()

    try:
        # Retrieve relevant legal knowledge
        knowledge_results = query_knowledge_base(contract.cleaned_text[:1000], n_results=5)

        # Get LLM service
        llm_service = get_llm_service()

        analysis_result = llm_service.analyze_contract(
            contract_text=contract.cleaned_text,
            title=contract.title,
            contract_type=contract.type,
            knowledge_context=knowledge_results
        )

        # Ensure contract_id in result
        analysis_result["contract_id"] = contract.id

        # Validate and store
        # Calculate risk level/score already done in analyzer
        contract.analysis_json = json.dumps(analysis_result)
        contract.risk_level = analysis_result.get("risk_level", "medium").lower()
        contract.risk_score = analysis_result.get("risk_score", 50)
        contract.summary = analysis_result.get("summary", "")[:1000]
        contract.status = "analyzed"
        db.commit()

        # Return validated response
        # Ensure all expected fields exist
        return ContractAnalysisResponse(**analysis_result)

    except Exception as e:
        print(f"Analysis failed: {e}")
        contract.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.delete("/{contract_id}")
def delete_contract(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.user_id == current_user.id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Delete file
    try:
        if os.path.exists(contract.file_path):
            os.remove(contract.file_path)
    except Exception as e:
        print(f"Failed to delete file: {e}")

    # Delete from vector store
    try:
        store = get_contract_store()
        # Need to find all chunk ids for this contract - we stored with prefix
        # For simplicity, query and delete matching
        # Since our store doesn't support where delete, try known pattern
        # We'll attempt to delete by querying first
        # In-memory store: we need to list all
        if hasattr(store, 'store'):  # InMemory
            to_delete = [k for k, v in store.store.items() if v["metadata"].get("contract_id") == contract_id]
            store.delete(to_delete)
        else:
            # Chroma - try delete where
            # For now, attempt to delete by prefix - we know we created ids with contract_id
            # We'll query all and filter, or just brute force up to 100 chunks
            for i in range(100):
                try:
                    store.delete(ids=[f"{contract_id}_chunk_{i}"])
                except:
                    pass
    except Exception as e:
        print(f"Failed to delete vectors: {e}")

    # Delete chat history
    db.query(ChatMessage).filter(ChatMessage.contract_id == contract_id).delete()

    # Delete contract
    db.delete(contract)
    db.commit()

    return {"message": "Contract deleted successfully"}

@router.post("/{contract_id}/chat", response_model=ChatResponse)
def chat_with_contract(
    contract_id: str,
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.user_id == current_user.id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract.status != "analyzed":
        # Allow chat even if not analyzed but warn
        print(f"Contract not yet analyzed, chat may be limited")

    # Save user message
    user_msg = ChatMessage(
        contract_id=contract_id,
        user_id=current_user.id,
        role="user",
        content=chat_request.message
    )
    db.add(user_msg)
    db.commit()

    # Retrieve relevant contract chunks
    try:
        contract_store = get_contract_store()
        contract_chunks = contract_store.query(
            query_text=chat_request.message,
            n_results=5,
            where={"contract_id": contract_id}
        )
        # If no chunks with where filter, try without filter and filter manually
        if not contract_chunks:
            all_chunks = contract_store.query(query_text=chat_request.message, n_results=10)
            contract_chunks = [c for c in all_chunks if c["metadata"].get("contract_id") == contract_id][:5]

    except Exception as e:
        print(f"Contract retrieval failed: {e}")
        contract_chunks = []

    # Import question classification
    from app.services.llm.llm_service import classify_question
    
    # Classify question to determine if we need legal knowledge
    question_type = classify_question(chat_request.message, contract_chunks)
    
    # Only retrieve legal knowledge for interpretation questions
    knowledge_chunks = []
    if question_type == "LEGAL_INTERPRETATION":
        try:
            knowledge_chunks = query_knowledge_base(chat_request.message, n_results=3)
        except Exception as e:
            print(f"Knowledge retrieval failed: {e}")
            knowledge_chunks = []

    # If no contract chunks from vector store, fallback to using cleaned_text chunks
    if not contract_chunks and contract.cleaned_text:
        # Create simple chunks from text matching keywords
        from app.services.ocr.extractor import chunk_text
        all_chunks = chunk_text(contract.cleaned_text)
        # Simple keyword matching for relevant chunks
        q_lower = chat_request.message.lower()
        relevant = []
        for chunk in all_chunks:
            if any(word in chunk.lower() for word in q_lower.split() if len(word) > 3):
                relevant.append({"text": chunk, "metadata": {}, "similarity": 0.5})
            if len(relevant) >= 3:
                break
        if not relevant and all_chunks:
            relevant = [{"text": all_chunks[0], "metadata": {}, "similarity": 0.3}]
        contract_chunks = relevant

    # Generate answer via LLM service
    llm_service = get_llm_service()
    result = llm_service.chat_with_contract(
        user_question=chat_request.message,
        contract_title=contract.title,
        contract_chunks=contract_chunks,
        knowledge_chunks=knowledge_chunks
    )

    ai_answer = result.get("answer", "Sorry, I couldn't generate an answer.")
    sources = result.get("sources", [])

    # Save AI message
    ai_msg = ChatMessage(
        contract_id=contract_id,
        user_id=current_user.id,
        role="ai",
        content=ai_answer,
        sources=json.dumps(sources)
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ChatResponse(
        id=ai_msg.id,
        contract_id=contract_id,
        user_message=chat_request.message,
        ai_response=ai_answer,
        sources=sources,
        created_at=ai_msg.created_at
    )

@router.get("/{contract_id}/chat", response_model=ChatHistoryResponse)
def get_chat_history(
    contract_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.user_id == current_user.id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.contract_id == contract_id,
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc()).all()

    history = []
    for msg in messages:
        src = []
        if msg.sources:
            try:
                src = json.loads(msg.sources)
            except:
                src = []
        history.append(ChatHistoryItem(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            sources=src,
            created_at=msg.created_at
        ))

    return ChatHistoryResponse(contract_id=contract_id, messages=history)
