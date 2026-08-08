"""
Rule-based legal contract analyzer - works without external LLM API
Provides real heuristic analysis, not fake data
"""
import re
from typing import List, Dict, Tuple
import math

# Risk patterns - real heuristics
RISK_PATTERNS = [
    {
        "keywords": ["auto-renew", "automatic renewal", "evergreen", "automatically renew"],
        "title": "Automatic Renewal",
        "category": "renewal",
        "severity": "HIGH",
        "explanation": "Contract automatically renews unless you give advance notice. You could be locked in longer than intended.",
        "risk_level": "high"
    },
    {
        "keywords": ["90 days notice", "90 days' notice", "120 days notice", "6 months notice"],
        "title": "Long Notice Period for Termination",
        "category": "termination",
        "severity": "HIGH",
        "explanation": "Long notice period (90+ days) for termination is disadvantageous, especially for SaaS or service agreements where 30 days is standard.",
        "risk_level": "high"
    },
    {
        "keywords": ["unilateral", "sole discretion", "may change at any time", "right to modify"],
        "title": "Unilateral Modification Rights",
        "category": "modification",
        "severity": "HIGH",
        "explanation": "Vendor can change terms unilaterally without your consent. This creates uncertainty and risk.",
        "risk_level": "high"
    },
    {
        "keywords": ["price increase", "fee increase", "may increase fees", "up to 8%", "up to 10%"],
        "title": "Unilateral Price Increase",
        "category": "payment",
        "severity": "HIGH",
        "explanation": "Vendor may increase prices during term or at renewal without cap. Budget planning becomes difficult.",
        "risk_level": "high"
    },
    {
        "keywords": ["liability capped", "limitation of liability", "liability limited", "12 months of fees"],
        "title": "Limited Liability Cap",
        "category": "liability",
        "severity": "MEDIUM",
        "explanation": "Vendor's liability is capped. If they cause significant damages, you may not be fully compensated. Below industry norm.",
        "risk_level": "medium"
    },
    {
        "keywords": ["indemnify", "indemnification", "hold harmless"],
        "title": "Broad Indemnity Obligation",
        "category": "indemnity",
        "severity": "MEDIUM",
        "explanation": "You may be required to indemnify the other party for broad range of claims, potentially including their negligence.",
        "risk_level": "medium"
    },
    {
        "keywords": ["non-compete", "non compete", "restraint of trade", "not to compete"],
        "title": "Non-Compete Clause",
        "category": "employment",
        "severity": "HIGH",
        "explanation": "Non-compete restricts your ability to work elsewhere. Under Indian law, post-employment non-compete may be unenforceable under Section 27, but still risky.",
        "risk_level": "high"
    },
    {
        "keywords": ["liquidated damages", "early termination fee", "remaining contract value"],
        "title": "High Termination Penalty",
        "category": "termination",
        "severity": "HIGH",
        "explanation": "Early termination requires paying remaining contract value - significant financial penalty.",
        "risk_level": "high"
    },
    {
        "keywords": ["late payment", "1.5% per month", "interest on late", "penalty for late"],
        "title": "Late Payment Penalty",
        "category": "payment",
        "severity": "MEDIUM",
        "explanation": "Late payment attracts high penalty (1.5% per month = 18% per annum). Ensure timely payments.",
        "risk_level": "medium"
    },
    {
        "keywords": ["data usage", "use your data", "anonymized data", "product improvement"],
        "title": "Broad Data Usage Rights",
        "category": "data_privacy",
        "severity": "MEDIUM",
        "explanation": "Vendor may use your data beyond providing service, potentially for product improvement or analytics without additional consent.",
        "risk_level": "medium"
    },
    {
        "keywords": ["confidential", "confidentiality", "5 years", "perpetual confidentiality"],
        "title": "Long Confidentiality Period",
        "category": "nda",
        "severity": "LOW",
        "explanation": "Confidentiality obligation extends for long period (5+ years or perpetual). Ensure scope of confidential information is reasonable.",
        "risk_level": "low"
    },
    {
        "keywords": ["intellectual property", "ip assignment", "work for hire", "all inventions"],
        "title": "Broad IP Assignment",
        "category": "intellectual_property",
        "severity": "MEDIUM",
        "explanation": "IP assignment may be overly broad, claiming ownership beyond direct deliverables.",
        "risk_level": "medium"
    },
    {
        "keywords": ["security deposit", "deposit", "refundable"],
        "title": "Security Deposit Terms",
        "category": "payment",
        "severity": "MEDIUM",
        "explanation": "Check security deposit amount and refund conditions. Excessive deposit or vague deduction criteria is risky.",
        "risk_level": "medium"
    },
    {
        "keywords": ["force majeure"],
        "title": "Force Majeure",
        "category": "force_majeure",
        "severity": "LOW",
        "explanation": "Force majeure clause present - review covered events and termination rights if event continues.",
        "risk_level": "low"
    },
    {
        "keywords": ["arbitration", "dispute resolution"],
        "title": "Arbitration Clause",
        "category": "dispute",
        "severity": "LOW",
        "explanation": "Disputes resolved via arbitration. Check seat, venue, costs, and whether it's mutual.",
        "risk_level": "low"
    }
]

RIGHTS_KEYWORDS = [
    "right to audit", "access to platform", "uptime sla", "data export", "right to terminate",
    "right to", "entitled to", "may request"
]

OBLIGATIONS_KEYWORDS = [
    "shall pay", "must pay", "obligation to", "required to", "shall not", "must not",
    "responsible for", "agree to"
]

def detect_risks(contract_text: str) -> List[Dict]:
    risks = []
    text_lower = contract_text.lower()

    for pattern in RISK_PATTERNS:
        matched = []
        evidence_snippet = ""
        for kw in pattern["keywords"]:
            if kw.lower() in text_lower:
                matched.append(kw)
                # Find context around keyword
                idx = text_lower.find(kw.lower())
                if idx != -1 and not evidence_snippet:
                    start = max(0, idx - 50)
                    end = min(len(contract_text), idx + len(kw) + 100)
                    evidence_snippet = contract_text[start:end].strip()

        if matched:
            # Try to find clause reference
            clause_ref = find_clause_reference(contract_text, matched[0])

            risks.append({
                "title": pattern["title"],
                "severity": pattern["severity"],
                "explanation": pattern["explanation"],
                "clause_reference": clause_ref,
                "evidence": evidence_snippet[:300] if evidence_snippet else f"Contains: {', '.join(matched[:2])}",
                "category": pattern["category"],
                "risk_level": pattern["risk_level"]
            })

    return risks

def find_clause_reference(text: str, keyword: str) -> str:
    # Look for nearby Clause X or Section Y
    idx = text.lower().find(keyword.lower())
    if idx == -1:
        return "General"

    window_start = max(0, idx - 300)
    window = text[window_start:idx + 100]

    # Regex for Clause/Section
    patterns = [
        r'Clause\s+\d+(\.\d+)*',
        r'Section\s+\d+(\.\d+)*',
        r'Article\s+\d+',
        r'§\s*\d+',
    ]
    for pat in patterns:
        matches = list(re.finditer(pat, window, re.IGNORECASE))
        if matches:
            return matches[-1].group(0)

    return "General"

def extract_rights_obligations(contract_text: str) -> Tuple[List[str], List[str]]:
    sentences = re.split(r'[.!?]\s+', contract_text)
    rights = []
    obligations = []

    for sent in sentences:
        sent_lower = sent.lower().strip()
        if len(sent) < 20:
            continue

        for rk in RIGHTS_KEYWORDS:
            if rk.lower() in sent_lower and len(rights) < 10:
                # Clean sentence
                clean = sent.strip()[:200]
                if clean and clean not in rights:
                    rights.append(clean)
                break

        for ok in OBLIGATIONS_KEYWORDS:
            if ok.lower() in sent_lower and len(obligations) < 10:
                clean = sent.strip()[:200]
                if clean and clean not in obligations:
                    obligations.append(clean)
                break

    return rights[:8], obligations[:8]

def extract_deadlines(contract_text: str) -> List[Dict]:
    deadlines = []
    # Look for date patterns and deadline keywords
    deadline_patterns = [
        r'(\d+\s+days?\s+(?:notice|before|after|within))',
        r'(termination.*?(\d+)\s+days)',
        r'(payment.*?net[-\s]?(\d+))',
        r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
        r'(within\s+\d+\s+days?)',
        r'(by\s+\d{1,2}\s+\w+\s+\d{4})',
    ]

    for pat in deadline_patterns:
        matches = re.finditer(pat, contract_text, re.IGNORECASE)
        for m in matches:
            desc = m.group(0).strip()[:150]
            deadlines.append({
                "description": desc,
                "date": None,
                "clause_reference": find_clause_reference(contract_text, desc[:20]),
                "importance": "high" if "termination" in desc.lower() or "payment" in desc.lower() else "medium"
            })
            if len(deadlines) >= 8:
                break
        if len(deadlines) >= 8:
            break

    return deadlines

def extract_key_clauses(contract_text: str) -> List[Dict]:
    clauses = []
    # Common clause titles to look for
    clause_types = [
        ("Termination", ["termination", "terminate"]),
        ("Payment", ["payment", "fees", "price", "invoice"]),
        ("Renewal", ["renewal", "renew", "auto-renew"]),
        ("Confidentiality", ["confidential", "non-disclosure", "nda"]),
        ("Liability", ["liability", "limitation of liability", "damages"]),
        ("Indemnity", ["indemnity", "indemnification"]),
        ("Data Protection", ["data", "privacy", "personal data"]),
        ("Intellectual Property", ["intellectual property", "ip", "ownership"]),
        ("Force Majeure", ["force majeure"]),
        ("Dispute Resolution", ["dispute", "arbitration", "jurisdiction"]),
        ("Non-Compete", ["non-compete", "non compete", "restraint"]),
    ]

    for title, keywords in clause_types:
        for kw in keywords:
            idx = contract_text.lower().find(kw.lower())
            if idx != -1:
                start = max(0, idx - 100)
                end = min(len(contract_text), idx + 400)
                snippet = contract_text[start:end].strip()
                # Find risk for this clause
                risk = "low"
                for rp in RISK_PATTERNS:
                    if any(k.lower() in snippet.lower() for k in rp["keywords"]):
                        risk = rp["risk_level"]
                        break

                clauses.append({
                    "title": title,
                    "content": snippet[:400],
                    "type": title.lower().replace(" ", "_"),
                    "page_reference": find_clause_reference(contract_text, kw),
                    "risk_level": risk
                })
                break

        if len(clauses) >= 10:
            break

    return clauses

def calculate_risk_score(risks: List[Dict]) -> Tuple[str, int]:
    if not risks:
        return "low", 20

    score = 0
    high_count = sum(1 for r in risks if r["severity"] == "HIGH")
    medium_count = sum(1 for r in risks if r["severity"] == "MEDIUM")

    score = high_count * 25 + medium_count * 10
    # Cap and add base
    score = min(95, score + 15)

    if high_count >= 3 or score >= 70:
        level = "high"
    elif high_count >= 1 or medium_count >= 2 or score >= 40:
        level = "medium"
    else:
        level = "low"

    return level, score

def generate_summary(contract_text: str, title: str, risks: List[Dict]) -> str:
    # Extract first few sentences as basis
    sentences = re.split(r'[.!?]\s+', contract_text)[:5]
    word_count = len(contract_text.split())

    # Determine contract type from title and text
    contract_type = "contract"
    if "rental" in title.lower() or "lease" in title.lower():
        contract_type = "rental/lease agreement"
    elif "employment" in title.lower():
        contract_type = "employment contract"
    elif "saas" in title.lower() or "subscription" in title.lower():
        contract_type = "SaaS subscription agreement"
    elif "nda" in title.lower():
        contract_type = "non-disclosure agreement"

    summary = f"This is a {contract_type} titled '{title}'. "

    if word_count:
        summary += f"The document contains approximately {word_count} words. "

    if risks:
        high_risks = [r for r in risks if r["severity"] == "HIGH"]
        if high_risks:
            summary += f"We identified {len(risks)} clauses requiring attention, including {len(high_risks)} high-severity risks: {', '.join([r['title'] for r in high_risks[:3]])}. "
        else:
            summary += f"We found {len(risks)} clauses that merit review. "
    else:
        summary += "No major risky patterns were automatically detected, but manual review is still recommended. "

    # Add context from main clauses
    if "termination" in contract_text.lower():
        summary += "It includes termination provisions that should be carefully reviewed for notice periods and penalties. "
    if "payment" in contract_text.lower():
        summary += "Payment terms and potential penalties are specified and should be verified. "

    summary += "This summary is informational and not legal advice. Consult a qualified lawyer for high-risk decisions."

    return summary

def detect_contract_type(title: str, text: str) -> str:
    combined = (title + " " + text[:500]).lower()
    if "rental" in combined or "lease" in combined:
        return "Lease"
    elif "employment" in combined:
        return "Employment"
    elif "saas" in combined or "subscription" in combined:
        return "Service Agreement"
    elif "nda" in combined or "non-disclosure" in combined:
        return "NDA"
    elif "freelance" in combined:
        return "Freelance"
    elif "service" in combined:
        return "Service Agreement"
    elif "sale" in combined or "purchase" in combined:
        return "Sale Agreement"
    else:
        return "General"

def analyze_contract_rule_based(contract_text: str, title: str, knowledge_context: List[Dict] = None) -> Dict:
    """
    Main rule-based analysis function - produces structured output
    """
    if not contract_text or len(contract_text.strip()) < 50:
        return {
            "title": title,
            "risk_level": "medium",
            "risk_score": 50,
            "summary": "Contract text is too short or could not be extracted properly. Please upload a clearer document. If this is a scanned document, ensure OCR is available and image quality is good.",
            "key_clauses": [],
            "risks": [{
                "title": "Unreadable or Empty Document",
                "severity": "HIGH",
                "explanation": "Contract text extraction failed or document is empty. Cannot perform proper analysis.",
                "clause_reference": "General",
                "evidence": contract_text[:200] if contract_text else "No text extracted",
                "category": "extraction_failure"
            }],
            "rights": [],
            "obligations": [],
            "penalties": [],
            "deadlines": [],
            "pros": [],
            "cons": ["Document could not be properly read - risk of missing critical clauses"],
            "renewal": [],
            "termination": [],
            "payment_clauses": [],
            "missing_clauses": ["Unable to determine due to extraction failure"],
            "sources": [],
            "warnings": ["Text extraction failed - analysis limited"]
        }

    # Core analysis
    risks = detect_risks(contract_text)
    rights, obligations = extract_rights_obligations(contract_text)
    deadlines = extract_deadlines(contract_text)
    key_clauses = extract_key_clauses(contract_text)
    risk_level, risk_score = calculate_risk_score(risks)
    summary = generate_summary(contract_text, title, risks)

    # Extract specific clause types
    renewal = []
    termination = []
    payment = []
    penalties = []

    sentences = re.split(r'[.!?]\s+', contract_text)
    for sent in sentences:
        low = sent.lower()
        if "renew" in low and len(renewal) < 5:
            renewal.append(sent.strip()[:200])
        if ("terminat" in low or "cancel" in low) and len(termination) < 5:
            termination.append(sent.strip()[:200])
        if ("pay" in low or "fee" in low or "price" in low) and len(payment) < 5:
            payment.append(sent.strip()[:200])
        if ("penalty" in low or "late" in low or "fine" in low or "damages" in low) and len(penalties) < 5:
            penalties.append(sent.strip()[:200])

    # Pros/Cons based on risks
    pros = []
    cons = []

    if risk_level == "low":
        pros.append("Contract appears to have balanced, standard terms")
        pros.append("No high-severity risky clauses detected automatically")
    elif risk_level == "medium":
        pros.append("Most terms appear standard, with some negotiable points")
        cons.append(f"{len([r for r in risks if r['severity']=='HIGH'])} high-risk clauses need attention")

    # Add generic pros
    if "sla" in contract_text.lower() or "uptime" in contract_text.lower():
        pros.append("Includes service level guarantees (SLA) for uptime")
    if "data export" in contract_text.lower():
        pros.append("Provides data export rights on termination")
    if "audit" in contract_text.lower():
        pros.append("Includes audit rights")

    for risk in risks:
        if risk["severity"] == "HIGH" and len(cons) < 8:
            cons.append(f"{risk['title']}: {risk['explanation'][:120]}")

    if not pros:
        pros = ["Contract is readable and contains standard contractual structure"]

    if not cons and risks:
        cons = [r["title"] for r in risks[:5]]

    # Missing clauses heuristic
    missing = []
    text_lower = contract_text.lower()
    if "termination" not in text_lower:
        missing.append("Termination clause - how contract can be ended")
    if "liability" not in text_lower:
        missing.append("Limitation of liability - cap on damages")
    if "dispute" not in text_lower and "arbitration" not in text_lower:
        missing.append("Dispute resolution mechanism")
    if "force majeure" not in text_lower:
        missing.append("Force majeure - handling of unforeseen events")
    if "confidential" not in text_lower and "nda" not in title.lower():
        missing.append("Confidentiality clause")

    # Sources from knowledge context
    sources = []
    if knowledge_context:
        for kc in knowledge_context[:5]:
            meta = kc.get("metadata", {})
            sources.append({
                "title": meta.get("title", "Legal Knowledge"),
                "jurisdiction": meta.get("jurisdiction", "India"),
                "source": meta.get("source", "Educational summary"),
                "section": meta.get("section", ""),
                "relevance": kc.get("similarity", 0)
            })

    return {
        "title": title,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "summary": summary,
        "key_clauses": key_clauses,
        "risks": risks,
        "rights": rights[:8] if rights else ["Review contract for explicit rights - standard rights may be implied"],
        "obligations": obligations[:8] if obligations else ["Payment and compliance obligations present - review specifics"],
        "penalties": penalties[:5],
        "deadlines": deadlines[:6],
        "pros": pros[:6],
        "cons": cons[:6],
        "renewal": renewal[:4],
        "termination": termination[:4],
        "payment_clauses": payment[:4],
        "missing_clauses": missing[:5],
        "sources": sources,
        "warnings": [
            "This analysis is AI-generated for informational purposes and does not constitute legal advice.",
            "Consult a qualified legal professional for high-risk decisions."
        ]
    }
