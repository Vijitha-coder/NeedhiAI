"""
LLM Service abstraction - supports OpenAI and rule-based fallback
"""
import json
import os
from typing import List, Dict, Optional
from app.config import settings
from app.services.llm.prompts import (
    ANALYSIS_SYSTEM_PROMPT,
    ANALYSIS_USER_PROMPT_TEMPLATE,
    CHAT_SYSTEM_PROMPT,
    CHAT_USER_PROMPT_TEMPLATE
)
from app.services.llm.analyzer import analyze_contract_rule_based

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
        # Simple keyword matching chat
        question_lower = user_question.lower()
        contract_text_combined = " ".join([c.get("text", "") for c in contract_chunks[:5]])

        # Build context
        relevant_contract_text = contract_text_combined[:2000]

        # Heuristic answer generation
        answer = ""
        sources = []

        # Detect intent
        if "terminat" in question_lower:
            answer += f"Based on your contract '{contract_title}':\n\n"
            # Find termination-related sentences
            for chunk in contract_chunks:
                if "terminat" in chunk.get("text", "").lower():
                    answer += f"Contract says: {chunk.get('text','')[:300]}...\n\n"
                    sources.append({
                        "type": "contract",
                        "title": "Termination Clause",
                        "content": chunk.get("text","")[:300],
                        "relevance": 0.9
                    })
                    break
            if knowledge_chunks:
                answer += f"Legal context: {knowledge_chunks[0].get('text','')[:200]}...\n\n"
                sources.append({
                    "type": "knowledge_base",
                    "title": knowledge_chunks[0].get("metadata", {}).get("title", "Legal Knowledge"),
                    "content": knowledge_chunks[0].get("text","")[:300],
                    "relevance": 0.7,
                    "metadata": knowledge_chunks[0].get("metadata", {})
                })

            answer += "Note: Termination procedures must be followed as specified. Consult a lawyer if penalty seems excessive."

        elif "renew" in question_lower:
            answer += f"Regarding renewal for '{contract_title}':\n\n"
            found = False
            for chunk in contract_chunks:
                if "renew" in chunk.get("text","").lower():
                    answer += f"Contract states: {chunk.get('text','')[:300]}...\n\n"
                    sources.append({
                        "type": "contract",
                        "title": "Renewal Clause",
                        "content": chunk.get("text","")[:300],
                        "relevance": 0.9
                    })
                    found = True
                    break
            if not found:
                answer += "No explicit auto-renewal clause found in retrieved chunks, but review full document.\n\n"

            if knowledge_chunks:
                answer += f"Legal context: Auto-renewal clauses are enforceable if clearly disclosed, but long notice periods may be scrutinized.\n"

        elif "payment" in question_lower or "fee" in question_lower or "price" in question_lower:
            answer += f"Payment terms in '{contract_title}':\n\n"
            for chunk in contract_chunks:
                if any(k in chunk.get("text","").lower() for k in ["pay", "fee", "price", "invoice"]):
                    answer += f"Contract says: {chunk.get('text','')[:300]}...\n\n"
                    break
            answer += "Check for late penalties and price increase caps. Standard net-30 is common."

        elif "risk" in question_lower:
            answer += f"Risks in '{contract_title}':\n\n"
            answer += "Based on analysis, review termination penalties, auto-renewal, liability caps, and data usage rights.\n\n"
            answer += "This is informational, not legal advice."

        elif "right" in question_lower:
            answer += f"Your rights under '{contract_title}':\n\n"
            for chunk in contract_chunks:
                if "right" in chunk.get("text","").lower():
                    answer += f"- {chunk.get('text','')[:200]}...\n"
                    if len(answer) > 800:
                        break
            answer += "\nAlso check SLA, data export, and audit rights."

        else:
            # Generic
            answer += f"Based on your contract '{contract_title}':\n\n"
            if contract_chunks:
                answer += f"Relevant contract excerpt: {contract_chunks[0].get('text','')[:400]}...\n\n"
            if knowledge_chunks:
                answer += f"Legal context: {knowledge_chunks[0].get('text','')[:300]}...\n\n"
            answer += f"Your question was: '{user_question}'. I searched the contract for relevant information. For specific legal interpretation, consult a qualified professional."

        if not answer.strip():
            answer = f"I couldn't find specific information about '{user_question}' in the available contract chunks. Please try rephrasing or ask about termination, payment, renewal, rights, or risks."

        # Ensure sources
        if not sources and contract_chunks:
            sources.append({
                "type": "contract",
                "title": "Contract Excerpt",
                "content": contract_chunks[0].get("text","")[:300],
                "relevance": 0.5
            })

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
            contract_str = "\n\n".join([f"Chunk {i+1}: {c.get('text','')[:600]}" for i, c in enumerate(contract_chunks[:5])])
            knowledge_str = "\n\n".join([f"{c.get('metadata',{}).get('title','')}: {c.get('text','')[:400]}" for c in knowledge_chunks[:3]])

            user_prompt = CHAT_USER_PROMPT_TEMPLATE.format(
                user_question=user_question,
                contract_title=contract_title,
                contract_chunks=contract_str,
                knowledge_chunks=knowledge_str or "No additional legal knowledge retrieved"
            )

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
            for c in contract_chunks[:3]:
                sources.append({
                    "type": "contract",
                    "title": "Contract Clause",
                    "content": c.get("text","")[:300],
                    "relevance": c.get("similarity", 0.8)
                })
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
