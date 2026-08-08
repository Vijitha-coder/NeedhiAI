"""
Legal Knowledge Base - curated educational content
"""
import os
import json
from typing import List, Dict
from pathlib import Path

KNOWLEDGE_DOCS = [
    {
        "id": "kb_indian_contract_act_1",
        "title": "Indian Contract Act - Essentials of a Valid Contract",
        "content": "Under Section 10 of the Indian Contract Act 1872, all agreements are contracts if they are made by free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not expressly declared to be void. Essential elements include offer and acceptance, intention to create legal relationship, lawful consideration, capacity of parties, free consent, lawful object, certainty of meaning.",
        "metadata": {
            "title": "Indian Contract Act - Essentials of a Valid Contract",
            "jurisdiction": "India",
            "source": "Indian Contract Act, 1872 - Section 10",
            "section": "Section 10",
            "year": "1872",
            "category": "contract_formation",
            "type": "statute_summary"
        }
    },
    {
        "id": "kb_termination_1",
        "title": "Termination Clauses - Indian Perspective",
        "content": "Termination clauses define conditions under which a contract can be ended. Under Indian law, termination can be for cause (breach) or for convenience. Courts require termination to be reasonable and often require prior notice period. Unilateral termination without notice may be considered breach. The party terminating must follow the procedure laid out in the contract. Automatic termination clauses must be clearly worded.",
        "metadata": {
            "title": "Termination Clauses - Indian Perspective",
            "jurisdiction": "India",
            "source": "Legal education summary based on Indian contract law principles",
            "section": "Termination",
            "year": "2024",
            "category": "termination",
            "type": "legal_concept"
        }
    },
    {
        "id": "kb_auto_renewal",
        "title": "Automatic Renewal Clauses - Risk and Legality",
        "content": "Automatic renewal (evergreen) clauses automatically extend a contract for successive periods unless one party provides timely notice of non-renewal. These clauses are enforceable in India if they are clearly disclosed and consented to. However, excessively long notice periods (e.g., 90 days or more for consumer or small business contracts) may be scrutinized under Section 23 and principles of unfair contracts. Best practice: require explicit notice 30 days before renewal, allow termination for convenience, and ensure renewal terms are not unilaterally altered.",
        "metadata": {
            "title": "Automatic Renewal Clauses - Risk and Legality",
            "jurisdiction": "India",
            "source": "Educational summary based on contract law precedents",
            "section": "Renewal",
            "year": "2024",
            "category": "renewal",
            "type": "risk_guideline"
        }
    },
    {
        "id": "kb_liability_cap",
        "title": "Limitation of Liability Clauses",
        "content": "Limitation of liability clauses cap the amount of damages one party can claim. Under Indian law, such clauses are generally enforceable in B2B contracts if reasonable and not unconscionable. However, liability cannot be limited for fraud, willful misconduct, or in cases violating public policy. Typical caps are 12 months of fees paid, total contract value, or a fixed amount. A cap below 12 months of fees may be considered low for SaaS or service agreements. Parties should ensure mutuality or justification for asymmetric caps.",
        "metadata": {
            "title": "Limitation of Liability Clauses",
            "jurisdiction": "India",
            "source": "Educational summary - Contract law",
            "section": "Liability",
            "year": "2024",
            "category": "liability",
            "type": "legal_concept"
        }
    },
    {
        "id": "kb_indemnity",
        "title": "Indemnity Clauses Under Indian Law",
        "content": "Indemnity under Section 124 of Indian Contract Act is a contract by which one party promises to save the other from loss caused by the promisor or any other person. Broad indemnity clauses that require one party to indemnify the other for all losses including those caused by the indemnified party's own negligence may be considered unfair. Best practice: mutual indemnity, carve-outs for willful misconduct, and clear scope of indemnified claims including third-party IP infringement.",
        "metadata": {
            "title": "Indemnity Clauses Under Indian Law",
            "jurisdiction": "India",
            "source": "Indian Contract Act, 1872 Section 124-125",
            "section": "Indemnity",
            "year": "1872",
            "category": "indemnity",
            "type": "statute_summary"
        }
    },
    {
        "id": "kb_employment_noncompete",
        "title": "Non-Compete Clause in Employment Contracts - India",
        "content": "Under Section 27 of Indian Contract Act, agreements in restraint of trade are void. Post-employment non-compete clauses are generally not enforceable in India, as held in multiple Supreme Court judgments including Superintendence Company v. Krishan Murgai. However, non-compete during employment is enforceable. Non-disclosure and non-solicitation clauses to protect trade secrets and client relationships may be enforceable if reasonable. A 2-year post-employment non-compete is typically considered unreasonable and likely unenforceable.",
        "metadata": {
            "title": "Non-Compete Clause in Employment Contracts - India",
            "jurisdiction": "India",
            "source": "Indian Contract Act Section 27, Judicial precedents",
            "section": "Section 27",
            "year": "2024",
            "category": "employment",
            "type": "case_law_summary"
        }
    },
    {
        "id": "kb_rental_deposit",
        "title": "Rental Agreement - Security Deposit Norms India",
        "content": "In India, residential rental security deposits typically range from 2-3 months rent in most cities, except in Bangalore where 6-10 months has been traditionally demanded but is increasingly regulated. Deposits above 3 months for residential lease may be considered excessive. The deposit must be refundable and terms of deduction must be clearly specified. Landlords cannot unreasonably withhold deposit. Interest on deposit is not typically required but transparency in usage for damages is required.",
        "metadata": {
            "title": "Rental Agreement - Security Deposit Norms India",
            "jurisdiction": "India",
            "source": "Model Tenancy Act 2021, State Rent Control Laws",
            "section": "Security Deposit",
            "year": "2021",
            "category": "lease",
            "type": "regulatory_summary"
        }
    },
    {
        "id": "kb_privacy_data",
        "title": "Data Protection and Privacy in Contracts",
        "content": "With India's Digital Personal Data Protection Act 2023, contracts that involve personal data processing must include data protection clauses. Broad data usage rights without consent, especially allowing vendor to use customer data for product improvement or marketing without anonymization or consent, may violate data protection principles. Clauses should specify purpose limitation, data retention, data export on termination (at least 30 days), security measures, and breach notification.",
        "metadata": {
            "title": "Data Protection and Privacy in Contracts",
            "jurisdiction": "India",
            "source": "Digital Personal Data Protection Act, 2023",
            "section": "Data Protection",
            "year": "2023",
            "category": "data_privacy",
            "type": "regulatory_summary"
        }
    },
    {
        "id": "kb_payment_late_fee",
        "title": "Late Payment Penalties and Interest",
        "content": "Late payment interest in B2B contracts in India commonly ranges from 1-1.5% per month. Under MSMED Act 2006, if buyer fails to make payment to micro/small supplier within 45 days, interest is 3x RBI bank rate. Penalty of 1.5% per month equals 18% per annum which is at higher end but may be enforceable if mutually agreed. Liquidated damages must be genuine pre-estimate of loss, not in terrorem, per Section 74 of Indian Contract Act.",
        "metadata": {
            "title": "Late Payment Penalties and Interest",
            "jurisdiction": "India",
            "source": "MSMED Act 2006, Indian Contract Act Section 74",
            "section": "Penalties",
            "year": "2024",
            "category": "payment",
            "type": "legal_concept"
        }
    },
    {
        "id": "kb_force_majeure",
        "title": "Force Majeure Clause",
        "content": "Force majeure excuses performance when extraordinary events beyond parties' control occur. Under Indian law, force majeure must be explicitly provided for in contract. Events typically include natural disasters, war, government actions, pandemics. Mere commercial hardship does not qualify. COVID-19 was recognized as force majeure in many contracts. Clause should define events, notification requirements, mitigation duties, and right to terminate if event continues beyond threshold (e.g., 60-90 days).",
        "metadata": {
            "title": "Force Majeure Clause",
            "jurisdiction": "India",
            "source": "Contract law educational summary",
            "section": "Force Majeure",
            "year": "2024",
            "category": "force_majeure",
            "type": "legal_concept"
        }
    },
    {
        "id": "kb_nda_confidentiality",
        "title": "NDA and Confidentiality Obligations",
        "content": "Non-Disclosure Agreements protect confidential information. Under Indian law, to be enforceable, NDA must define confidential information clearly, not overly broad. Mutual NDAs should have symmetrical obligations. Duration of confidentiality typically 2-5 years, longer for trade secrets. Obligations should exclude information that is public, independently developed, or rightfully received from third party. Unilateral perpetual confidentiality for all information may be considered overly broad and potentially unconscionable.",
        "metadata": {
            "title": "NDA and Confidentiality Obligations",
            "jurisdiction": "India",
            "source": "Contract principles, IT Act",
            "section": "Confidentiality",
            "year": "2024",
            "category": "nda",
            "type": "legal_concept"
        }
    },
    {
        "id": "kb_ip_assignment",
        "title": "Intellectual Property Assignment in Contracts",
        "content": "IP assignment clauses determine ownership of work product. In employment, Section 17(c) of Copyright Act states work created during employment belongs to employer if contract to that effect. For freelance, without explicit assignment, IP may remain with creator. Broad IP assignment claiming all work, even outside scope and after hours, may be considered overreaching. Freelancers should ensure clause is limited to deliverables specifically paid for, and includes payment terms linked to assignment.",
        "metadata": {
            "title": "Intellectual Property Assignment in Contracts",
            "jurisdiction": "India",
            "source": "Copyright Act 1957 Section 17, Contract principles",
            "section": "IP Assignment",
            "year": "1957",
            "category": "intellectual_property",
            "type": "legal_concept"
        }
    },
    {
        "id": "kb_consumer_protection",
        "title": "Consumer Protection Act and Unfair Contracts",
        "content": "Under Consumer Protection Act 2019, unfair contracts are defined under Section 2(46) as contracts causing significant change in consumer rights to detriment. Examples include permitting one party to assign contract without consent, imposing unreasonable charge or penalty, unilateral termination without cause, entitling one side to forfeit earnest money without right of refund. A clause may be declared unfair if it is one-sided and causes significant detriment.",
        "metadata": {
            "title": "Consumer Protection Act and Unfair Contracts",
            "jurisdiction": "India",
            "source": "Consumer Protection Act 2019 Section 2(46)",
            "section": "Unfair Contracts",
            "year": "2019",
            "category": "consumer_protection",
            "type": "statute_summary"
        }
    },
    {
        "id": "kb_dispute_resolution",
        "title": "Dispute Resolution - Arbitration Clause",
        "content": "Arbitration under Arbitration and Conciliation Act 1996 is common. Valid arbitration clause must be in writing and reflect agreement to arbitrate. Seat and venue should be specified. Unilateral arbitration clause (only one party can invoke) has been held unbalanced by some courts. Institutional vs ad hoc arbitration should be specified. Costs and language should be defined. Emergency arbitration provisions may be included.",
        "metadata": {
            "title": "Dispute Resolution - Arbitration Clause",
            "jurisdiction": "India",
            "source": "Arbitration and Conciliation Act 1996",
            "section": "Arbitration",
            "year": "1996",
            "category": "dispute_resolution",
            "type": "statute_summary"
        }
    },
    {
        "id": "kb_saas_sla",
        "title": "SaaS Agreements - SLA and Uptime Guarantees",
        "content": "Service Level Agreements for SaaS typically guarantee 99.5% to 99.99% uptime monthly. Remediies for SLA breach are usually service credits, not termination right unless uptime falls below threshold for consecutive months. 99.9% uptime allows ~43 minutes downtime per month. Data export rights on termination should be at least 30 days. Data location and GDPR/DPDP compliance increasingly important. Auto price increases should be capped (e.g., max 5-7% annually) and require 60-90 days notice.",
        "metadata": {
            "title": "SaaS Agreements - SLA and Uptime Guarantees",
            "jurisdiction": "Global/India",
            "source": "Industry best practices summary",
            "section": "SaaS",
            "year": "2024",
            "category": "saas",
            "type": "best_practice"
        }
    }
]

def get_all_knowledge_docs() -> List[Dict]:
    return KNOWLEDGE_DOCS

def load_knowledge_base_to_vector_store():
    """Load seed knowledge base into vector store"""
    from app.services.rag.vector_store import get_knowledge_store
    
    store = get_knowledge_store()
    
    ids = [doc["id"] for doc in KNOWLEDGE_DOCS]
    texts = [doc["content"] for doc in KNOWLEDGE_DOCS]
    metadatas = [doc["metadata"] for doc in KNOWLEDGE_DOCS]
    
    print(f"Loading {len(ids)} knowledge documents to vector store...")
    store.add(ids=ids, texts=texts, metadatas=metadatas)
    print("Knowledge base loaded")

def query_knowledge_base(query: str, n_results: int = 5) -> List[Dict]:
    from app.services.rag.vector_store import get_knowledge_store
    store = get_knowledge_store()
    return store.query(query_text=query, n_results=n_results)
