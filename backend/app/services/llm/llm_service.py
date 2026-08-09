"""
LLM Service abstraction - supports OpenAI and rule-based fallback
"""
import json
import os
import re
from typing import List, Dict, Optional, Literal
from app.config import settings
from app.services.llm.prompts import (
    ANALYSIS_SYSTEM_PROMPT,
    ANALYSIS_USER_PROMPT_TEMPLATE,
    CHAT_SYSTEM_PROMPT,
    CHAT_USER_PROMPT_TEMPLATE,
    CONTRACT_FACT_PROMPT,
    CONTRACT_REASONING_PROMPT,
    LEGAL_INTERPRETATION_PROMPT
)
from app.services.llm.analyzer import analyze_contract_rule_based

QuestionType = Literal["CONTRACT_FACT", "CONTRACT_REASONING", "LEGAL_INTERPRETATION", "NOT_IN_DOCUMENT"]

def classify_question(user_question: str, contract_chunks: List[Dict]) -> QuestionType:
    """
    Classify the question type based on the question and available contract context.
    
    CONTRACT_FACT: Simple factual question with direct answer in contract
    CONTRACT_REASONING: Requires reasoning across multiple clauses
    LEGAL_INTERPRETATION: Requires legal knowledge/context
    NOT_IN_DOCUMENT: Information not present in contract
    """
    question_lower = user_question.lower()
    
    # Check if we have relevant contract chunks
    if not contract_chunks:
        return "NOT_IN_DOCUMENT"
    
    # Check if contract chunks contain relevant information
    contract_text = " ".join([c.get("text", "") for c in contract_chunks]).lower()
    
    # Keywords that suggest factual questions
    fact_keywords = ["what is", "how much", "how many", "who", "when", "where", "which", "amount", "price", "fee", "cost", "rent", "deposit", "salary", "payment", "date", "deadline", "duration", "period", "term", "address", "name", "phone", "email"]
    
    # Keywords that suggest reasoning questions
    reasoning_keywords = ["what happens if", "what if", "how does", "why", "explain", "relationship between", "difference between", "compare", "implication", "consequence", "effect", "impact", "terminate early", "early termination"]
    
    # Keywords that suggest legal interpretation
    legal_keywords = ["legal", "law", "statute", "regulation", "compliance", "liable", "liability", "rights", "obligations", "enforceable", "valid", "void", "jurisdiction", "court", "sue", "claim", "dispute", "interpret", "meaning", "binding"]
    
    # Check for reasoning questions first (they have priority)
    if any(keyword in question_lower for keyword in reasoning_keywords):
        # Check if relevant info exists in contract
        question_words = set(re.findall(r'\w+', question_lower))
        relevant_words = [w for w in question_words if len(w) > 3]
        matches = sum(1 for word in relevant_words if word in contract_text)
        
        if matches >= 2:
            return "CONTRACT_REASONING"
        else:
            return "NOT_IN_DOCUMENT"
    
    # Check for legal interpretation questions
    if any(keyword in question_lower for keyword in legal_keywords):
        return "LEGAL_INTERPRETATION"
    
    # Check for factual questions
    if any(keyword in question_lower for keyword in fact_keywords):
        # Check if answer exists in contract chunks
        question_words = set(re.findall(r'\w+', question_lower))
        relevant_words = [w for w in question_words if len(w) > 3]
        
        # Check if relevant words appear in contract text
        matches = sum(1 for word in relevant_words if word in contract_text)
        
        if matches >= 2 or any(word in contract_text for word in relevant_words if len(word) > 5):
            return "CONTRACT_FACT"
        else:
            return "NOT_IN_DOCUMENT"
    
    # Default: check if contract has relevant info
    question_words = set(re.findall(r'\w+', question_lower))
    relevant_words = [w for w in question_words if len(w) > 3]
    matches = sum(1 for word in relevant_words if word in contract_text)
    
    if matches >= 2:
        return "CONTRACT_FACT"
    else:
        return "NOT_IN_DOCUMENT"

class BaseLLMService:
    def analyze_contract(self, contract_text: str, title: str, contract_type: str, knowledge_context: List[Dict]) -> Dict:
        raise NotImplementedError

    def chat_with_contract(self, user_question: str, contract_title: str, contract_chunks: List[Dict], knowledge_chunks: List[Dict]) -> Dict:
        raise NotImplementedError

class RuleBasedLLMService(BaseLLMService):
    """Works without any external API - uses heuristics"""

    def analyze_contract(self, contract_text: str, title: str, contract_type: str, knowledge_context: List[Dict]) -> Dict:
        result = analyze_contract_rule_based(contract_text, title, knowledge_context)
        result["title"] = title  # ensure title
        return result

    def chat_with_contract(self, user_question: str, contract_title: str, contract_chunks: List[Dict], knowledge_chunks: List[Dict]) -> Dict:
        # Classify the question
        question_type = classify_question(user_question, contract_chunks)
        
        question_lower = user_question.lower()
        contract_text_combined = " ".join([c.get("text", "") for c in contract_chunks[:5]])

        # Build context
        relevant_contract_text = contract_text_combined[:2000]

        # Heuristic answer generation based on question type
        answer = ""
        sources = []

        if question_type == "NOT_IN_DOCUMENT":
            answer = "The contract does not specify this information."
            # Don't add sources for not-in-document cases
            return {"answer": answer, "sources": []}

        elif question_type == "CONTRACT_FACT":
            # Direct factual answer from contract
            if "rent" in question_lower:
                for chunk in contract_chunks:
                    if "rent" in chunk.get("text", "").lower():
                        answer = chunk.get("text", "")
                        sources.append({
                            "type": "contract",
                            "title": "Rent Clause",
                            "content": chunk.get("text","")[:300],
                            "relevance": 0.95
                        })
                        break
            elif "deposit" in question_lower:
                for chunk in contract_chunks:
                    if "deposit" in chunk.get("text", "").lower():
                        answer = chunk.get("text", "")
                        sources.append({
                            "type": "contract",
                            "title": "Deposit Clause", 
                            "content": chunk.get("text","")[:300],
                            "relevance": 0.95
                        })
                        break
            elif "arbitrator" in question_lower or "arbitration" in question_lower:
                for chunk in contract_chunks:
                    if "arbitr" in chunk.get("text", "").lower():
                        answer = chunk.get("text", "")
                        sources.append({
                            "type": "contract",
                            "title": "Arbitration Clause",
                            "content": chunk.get("text","")[:300],
                            "relevance": 0.95
                        })
                        break
            elif "parking" in question_lower:
                found = False
                for chunk in contract_chunks:
                    if "parking" in chunk.get("text", "").lower():
                        answer = chunk.get("text", "")
                        sources.append({
                            "type": "contract",
                            "title": "Parking Clause",
                            "content": chunk.get("text","")[:300],
                            "relevance": 0.95
                        })
                        found = True
                        break
                if not found:
                    answer = "The contract does not specify parking arrangements."
            else:
                # Generic factual answer - use the most relevant chunk based on keyword matching
                question_words = set(re.findall(r'\w+', question_lower))
                relevant_words = [w for w in question_words if len(w) > 3]
                
                best_chunk = None
                best_score = 0
                for chunk in contract_chunks:
                    chunk_text = chunk.get("text", "").lower()
                    score = sum(1 for word in relevant_words if word in chunk_text)
                    if score > best_score:
                        best_score = score
                        best_chunk = chunk
                
                if best_chunk and best_score > 0:
                    answer = best_chunk.get("text", "")
                    sources.append({
                        "type": "contract",
                        "title": "Relevant Contract Section",
                        "content": best_chunk.get("text","")[:300],
                        "relevance": 0.85
                    })
                else:
                    answer = f"I couldn't find specific information about '{user_question}' in the contract."

        elif question_type == "CONTRACT_REASONING":
            # Reasoning across clauses
            if "terminat" in question_lower:
                answer = f"Based on '{contract_title}': "
                notice_info = ""
                penalty_info = ""
                seen_chunks = set()  # Avoid duplicates
                
                for chunk in contract_chunks:
                    chunk_id = id(chunk)
                    if chunk_id in seen_chunks:
                        continue
                    seen_chunks.add(chunk_id)
                    
                    text = chunk.get("text", "").lower()
                    if "notice" in text and "terminat" in text:
                        notice_info = chunk.get("text", "")
                        sources.append({
                            "type": "contract",
                            "title": "Termination Notice Clause",
                            "content": chunk.get("text","")[:300],
                            "relevance": 0.9
                        })
                    if "penalty" in text or ("month" in text and "terminat" in text):
                        penalty_info = chunk.get("text", "")
                        sources.append({
                            "type": "contract", 
                            "title": "Termination Penalty Clause",
                            "content": chunk.get("text","")[:300],
                            "relevance": 0.9
                        })
                
                if notice_info:
                    answer += notice_info + " "
                if penalty_info and penalty_info != notice_info:  # Avoid duplicates
                    answer += penalty_info
                if not notice_info and not penalty_info:
                    # Fallback to first relevant chunk
                    for chunk in contract_chunks:
                        if "terminat" in chunk.get("text", "").lower():
                            answer = chunk.get("text", "")
                            sources.append({
                                "type": "contract",
                                "title": "Termination Clause",
                                "content": chunk.get("text","")[:300],
                                "relevance": 0.9
                            })
                            break

        elif question_type == "LEGAL_INTERPRETATION":
            # Include legal context
            answer = f"Regarding '{user_question}' in '{contract_title}':\n\n"
            if contract_chunks:
                answer += "Contract states: " + contract_chunks[0].get("text", "")[:400] + "\n\n"
                sources.append({
                    "type": "contract",
                    "title": "Contract Clause",
                    "content": contract_chunks[0].get("text","")[:300],
                    "relevance": 0.9
                })
            if knowledge_chunks:
                answer += "Legal context: " + knowledge_chunks[0].get("text", "")[:300] + "\n\n"
                sources.append({
                    "type": "knowledge_base",
                    "title": knowledge_chunks[0].get("metadata", {}).get("title", "Legal Knowledge"),
                    "content": knowledge_chunks[0].get("text","")[:300],
                    "relevance": 0.7,
                    "metadata": knowledge_chunks[0].get("metadata", {})
                })
            answer += "For definitive legal interpretation, consult a qualified attorney."

        if not answer.strip():
            answer = f"I couldn't find specific information about '{user_question}' in the available contract chunks."

        return {
            "answer": answer,
            "sources": sources
        }

class OpenAILLMService(BaseLLMService):
    def __init__(self):
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL
        self.base_url = settings.LLM_BASE_URL
        self.available = bool(self.api_key)
        if not self.available:
            print("OpenAI API key not set, fallback to rule-based")
            self.fallback = RuleBasedLLMService()
        else:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
            except Exception as e:
                print(f"OpenAI client init failed: {e}")
                self.available = False
                self.fallback = RuleBasedLLMService()

    def _build_knowledge_context(self, knowledge_chunks: List[Dict]) -> str:
        if not knowledge_chunks:
            return "No specific legal knowledge retrieved."
        parts = []
        for i, kc in enumerate(knowledge_chunks[:5], 1):
            meta = kc.get("metadata", {})
            parts.append(f"{i}. {meta.get('title','')} ({meta.get('source','')}): {kc.get('text','')[:400]}")
        return "\n".join(parts)

    def analyze_contract(self, contract_text: str, title: str, contract_type: str, knowledge_context: List[Dict]) -> Dict:
        if not self.available:
            return self.fallback.analyze_contract(contract_text, title, contract_type, knowledge_context)

        try:
            knowledge_str = self._build_knowledge_context(knowledge_context)

            # Truncate contract text if too long
            max_chars = 12000
            truncated_text = contract_text[:max_chars]
            if len(contract_text) > max_chars:
                truncated_text += "\n\n[Truncated for length...]"

            user_prompt = ANALYSIS_USER_PROMPT_TEMPLATE.format(
                title=title,
                contract_type=contract_type,
                contract_text=truncated_text,
                knowledge_context=knowledge_str
            )

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"} if "gpt-4" in self.model or "gpt-3.5" in self.model else None
            )

            content = response.choices[0].message.content

            # Try parse JSON
            try:
                parsed = json.loads(content)
                # Ensure required fields
                if "risk_level" not in parsed:
                    parsed["risk_level"] = "medium"
                if "risk_score" not in parsed:
                    parsed["risk_score"] = 50
                return parsed
            except json.JSONDecodeError:
                # Try extract JSON from markdown
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    return parsed
                else:
                    raise ValueError("LLM did not return valid JSON")

        except Exception as e:
            print(f"OpenAI analysis failed: {e}, fallback to rule-based")
            return self.fallback.analyze_contract(contract_text, title, contract_type, knowledge_context)

    def chat_with_contract(self, user_question: str, contract_title: str, contract_chunks: List[Dict], knowledge_chunks: List[Dict]) -> Dict:
        if not self.available:
            return self.fallback.chat_with_contract(user_question, contract_title, contract_chunks, knowledge_chunks)

        try:
            # Classify the question
            question_type = classify_question(user_question, contract_chunks)
            
            contract_str = "\n\n".join([f"Chunk {i+1}: {c.get('text','')[:600]}" for i, c in enumerate(contract_chunks[:5])])
            knowledge_str = "\n\n".join([f"{c.get('metadata',{}).get('title','')}: {c.get('text','')[:400]}" for c in knowledge_chunks[:3]])

            # Select appropriate prompt based on question type
            if question_type == "CONTRACT_FACT":
                user_prompt = CONTRACT_FACT_PROMPT.format(
                    user_question=user_question,
                    contract_title=contract_title,
                    contract_chunks=contract_str
                )
            elif question_type == "CONTRACT_REASONING":
                user_prompt = CONTRACT_REASONING_PROMPT.format(
                    user_question=user_question,
                    contract_title=contract_title,
                    contract_chunks=contract_str
                )
            elif question_type == "LEGAL_INTERPRETATION":
                user_prompt = LEGAL_INTERPRETATION_PROMPT.format(
                    user_question=user_question,
                    contract_title=contract_title,
                    contract_chunks=contract_str,
                    knowledge_chunks=knowledge_str or "No additional legal knowledge retrieved"
                )
            else:  # NOT_IN_DOCUMENT
                # Return a direct response without calling LLM
                return {
                    "answer": "The contract does not specify this information.",
                    "sources": []
                }

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": CHAT_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )

            answer = response.choices[0].message.content

            sources = []
            # Only add sources that are relevant to the question type
            if question_type != "NOT_IN_DOCUMENT":
                for c in contract_chunks[:3]:
                    sources.append({
                        "type": "contract",
                        "title": "Contract Clause",
                        "content": c.get("text","")[:300],
                        "relevance": c.get("similarity", 0.8)
                    })
            
            # Only add legal knowledge for interpretation questions
            if question_type == "LEGAL_INTERPRETATION":
                for k in knowledge_chunks[:2]:
                    sources.append({
                        "type": "knowledge_base",
                        "title": k.get("metadata", {}).get("title", "Legal Knowledge"),
                        "content": k.get("text","")[:300],
                        "relevance": k.get("similarity", 0.6),
                        "metadata": k.get("metadata", {})
                    })

            return {"answer": answer, "sources": sources}

        except Exception as e:
            print(f"OpenAI chat failed: {e}, fallback")
            return self.fallback.chat_with_contract(user_question, contract_title, contract_chunks, knowledge_chunks)

def get_llm_service() -> BaseLLMService:
    provider = settings.LLM_PROVIDER.lower()

    if provider == "openai":
        return OpenAILLMService()
    elif provider == "local_rule_based":
        return RuleBasedLLMService()
    else:  # auto
        if settings.LLM_API_KEY:
            service = OpenAILLMService()
            if service.available:
                return service
        return RuleBasedLLMService()
