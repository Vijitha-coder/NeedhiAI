# Legal Knowledge Base

This folder contains curated educational legal knowledge used for Retrieval-Augmented Generation (RAG) in NeedhiAI.

## Contents

The knowledge base is seeded with educational summaries of:

- Indian Contract Act 1872 essentials
- Termination, Renewal, Liability, Indemnity, Non-compete, Privacy, etc.
- Consumer Protection Act 2019 unfair contract definitions
- Model Tenancy Act, DPDP Act 2023, MSMED, Arbitration Act, etc.

Each document includes metadata:

- title
- jurisdiction
- source
- section
- year
- category
- content

## Source & Disclaimer

**All content in this knowledge base is for educational/demo purposes only.**

- Do not consider as legal advice
- Summaries are based on public statutes and general legal principles
- Not fabricated - based on actual laws but simplified for understanding
- Users should consult qualified lawyer for legal decisions

## Adding More Documents

To add more documents:

1. Create a JSON file with fields: title, jurisdiction, source, section, year, category, content
2. Place in this folder
3. Update backend/app/services/rag/knowledge_base.py to include new doc OR implement dynamic loader

Architecture is modular - vector DB can be replaced, embedding provider configurable.

## Legal Notice

This knowledge base does NOT replace a lawyer. It is informational.
