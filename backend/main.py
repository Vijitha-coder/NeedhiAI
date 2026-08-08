from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.config import settings
from app.database.database import init_db
from app.routes import auth, contracts
from app.services.rag.knowledge_base import load_knowledge_base_to_vector_store

app = FastAPI(
    title="NeedhiAI LegaliSec API",
    description="AI-Powered Legal Contract Simplifier & Contextual Rights Navigator - Backend API",
    version="1.0.0"
)

# CORS
origins = settings.cors_origins_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(contracts.router)

@app.on_event("startup")
async def startup_event():
    print("Initializing database...")
    init_db()
    print("Database initialized")

    # Load knowledge base
    try:
        print("Loading knowledge base...")
        load_knowledge_base_to_vector_store()
        print("Knowledge base loaded")
    except Exception as e:
        print(f"Failed to load knowledge base: {e}")

@app.get("/")
def root():
    return {
        "message": "NeedhiAI LegaliSec API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "disclaimer": "This API provides informational assistance only and does not constitute legal advice. Consult a qualified legal professional for high-risk decisions."
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "env": settings.APP_ENV}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
