from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import json
import datetime
import google.generativeai as genai

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Prefer env override; default to a currently listed flash model for new API keys
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-flash-latest")
# Fallbacks if primary is unavailable to this key/quota
GEMINI_MODEL_FALLBACKS = [
    m.strip() for m in (os.getenv("GEMINI_MODEL_FALLBACKS") or "").split(",") if m.strip()
] or [
    "models/gemini-flash-latest",
    "models/gemini-flash-lite-latest",
    "models/gemini-pro-latest",
    "models/gemini-3.6-flash",
    "models/gemini-2.5-flash",
]

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY.strip().strip('"'))

# In-memory last health check (no secrets)
_last_ai_health = {
    "status": "not_configured",
    "lastCheckedAt": None,
    "safeMessage": "",
}


def _key_configured() -> bool:
    key = (GEMINI_API_KEY or "").strip().strip('"')
    return bool(key and len(key) >= 10)


def _generate(prompt: str):
    """Try primary model then fallbacks. Raises last error if all fail."""
    models = [GEMINI_MODEL] + [m for m in GEMINI_MODEL_FALLBACKS if m != GEMINI_MODEL]
    last_err = None
    for model_name in models:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt, request_options={"timeout": 45})
            return response, model_name
        except Exception as e:
            last_err = e
            print(f"Gemini model {model_name} failed: {type(e).__name__}")
            continue
    raise last_err or RuntimeError("No Gemini model available")


def probe_gemini() -> dict:
    """Validate provider config + live model reachability. Never logs secrets."""
    global _last_ai_health
    now = datetime.datetime.now().isoformat()
    if not _key_configured():
        _last_ai_health = {
            "status": "not_configured",
            "provider": "gemini",
            "safeMessage": "AI service is unavailable. Retry after the service is restored.",
            "lastCheckedAt": now,
            "model": GEMINI_MODEL,
        }
        return _last_ai_health

    try:
        response, used_model = _generate("Reply with exactly: OK")
        text = (response.text or "").strip().upper()
        if "OK" in text or len(text) > 0:
            _last_ai_health = {
                "status": "connected",
                "provider": "gemini",
                "safeMessage": "AI advisory is ready.",
                "lastCheckedAt": now,
                "model": used_model,
            }
        else:
            _last_ai_health = {
                "status": "unavailable",
                "provider": "gemini",
                "safeMessage": "AI service is unavailable. Retry after the service is restored.",
                "lastCheckedAt": now,
                "model": used_model,
            }
    except Exception as e:
        err_name = type(e).__name__
        print(f"AI health probe failed: {err_name}")
        msg = "AI service is unavailable. Retry after the service is restored."
        # Quotas / permission — still no raw provider payload to client
        if "ResourceExhausted" in err_name or "429" in str(e):
            msg = "AI service is unavailable. Retry after the service is restored."
        _last_ai_health = {
            "status": "unavailable",
            "provider": "gemini",
            "safeMessage": msg,
            "lastCheckedAt": now,
            "model": GEMINI_MODEL,
        }
    return _last_ai_health


class AdvisoryRequest(BaseModel):
    profile: Dict[str, Any]
    business: Dict[str, Any]
    financials: Dict[str, Any]
    schemes: List[Dict[str, Any]]


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    location: Optional[Dict[str, Any]] = None
    businessDiscoveryResults: Optional[List[Dict[str, Any]]] = None
    selectedBusinesses: Optional[List[Dict[str, Any]]] = None
    comparison: Optional[Dict[str, Any]] = None
    financialPlan: Optional[Dict[str, Any]] = None
    schemeMatches: Optional[List[Dict[str, Any]]] = None
    sourceMetadata: Optional[List[Dict[str, Any]]] = None
    context: Optional[Dict[str, Any]] = None


@router.post("/advisory")
async def generate_advisory(req: AdvisoryRequest):
    if not _key_configured():
        raise HTTPException(status_code=503, detail="AI service is unavailable. Retry after the service is restored.")

    prompt = f"""
You are an expert rural business advisor for Arthniti (India).
You MUST output ONLY valid JSON matching this schema:
{{
  "recommendationSummary": "String",
  "whyRecommended": ["String"],
  "risks": ["String"],
  "riskMitigations": ["String"],
  "opportunities": ["String"],
  "questionsForUser": ["String"],
  "dataGaps": ["String"],
  "confidenceExplanation": "String",
  "citations": [
    {{
      "title": "String",
      "url": "String",
      "retrievedAt": "String",
      "claim": "String"
    }}
  ]
}}

INPUT DATA (DO NOT HALLUCINATE OUTSIDE OF THIS):
Profile: {json.dumps(req.profile)}
Business: {json.dumps(req.business)}
Financials: {json.dumps(req.financials)}
Schemes: {json.dumps(req.schemes)}

RULES:
- Never invent nearby businesses, job listings, scheme terms, eligibility, or financial figures.
- Never calculate EMI or margin yourself — use the provided Financials.
- Never guarantee loans. Use 'may be eligible'.
- If data is missing, note it in dataGaps.
- Cite only sources present in the input.
"""
    try:
        response, used_model = _generate(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except json.JSONDecodeError:
        print("Advisory JSON parse error — raw text was not valid JSON")
        raise HTTPException(status_code=502, detail="AI returned an unparseable response. Please try again.")
    except Exception as e:
        print(f"Advisory Generation Error: {type(e).__name__}")
        raise HTTPException(status_code=502, detail="AI service is unavailable. Retry after the service is restored.")


@router.post("/chat")
async def chat_with_advisor(req: ChatRequest):
    if not _key_configured():
        raise HTTPException(
            status_code=503,
            detail="AI service is unavailable. Retry after the service is restored.",
        )

    lang_note = {
        "en": "Respond in clear English.",
        "hi": "Respond in Hindi (Devanagari).",
        "te": "Respond in Telugu.",
    }.get(req.language, "Respond in clear English.")

    has_discovery = bool(req.businessDiscoveryResults)
    has_schemes = bool(req.schemeMatches)
    has_comparison = bool(req.comparison)
    has_finance = bool(req.financialPlan)

    prompt = f"""You are Arthniti Assistant — a grounded financial advisor for rural micro-entrepreneurs in India.
{lang_note}
Keep answers practical and concise (3–8 sentences). Use Markdown. No raw HTML.

CRITICAL GROUNDING RULES — violation is not allowed:
1. Use ONLY the context JSON below. Do NOT invent nearby businesses, job listings, government scheme terms, eligibility, loan approvals, or financial calculations.
2. If a field is null/empty, say the data is not available in the user's session — do not invent it.
3. Never claim provider data exists when discovery results are empty.
4. SAFE LANGUAGE: Never say "You are eligible" or "You will get a loan". Use "You may be eligible" / "Verify with your bank/SCA".
5. When referencing schemes, only use schemeMatches or matchedSchemes present in context; cite officialUrl if present.
6. When comparing businesses, use comparison / selectedBusinesses / businessDiscoveryResults only.
7. Cite sources from sourceMetadata or provenance fields when available.
8. Always suggest a concrete next step (explore, compare, verify documents, visit bank).

CONTEXT AVAILABILITY:
- discovery: {has_discovery}
- schemes: {has_schemes}
- comparison: {has_comparison}
- financialPlan: {has_finance}

Context JSON:
Location: {json.dumps(req.location)}
Discovery Results: {json.dumps(req.businessDiscoveryResults)}
Selected Businesses: {json.dumps(req.selectedBusinesses)}
Comparison: {json.dumps(req.comparison)}
Financial Plan: {json.dumps(req.financialPlan)}
Scheme Matches: {json.dumps(req.schemeMatches)}
Source Metadata: {json.dumps(req.sourceMetadata)}
Other Context: {json.dumps(req.context)}

User Question: {req.message}
"""
    try:
        response, used_model = _generate(prompt)
        return {
            "response": response.text.strip(),
            "status": "ok",
            "provider": "gemini",
            "model": used_model,
        }
    except Exception as e:
        print(f"Chat Error: {type(e).__name__}")
        raise HTTPException(
            status_code=503,
            detail="AI service is unavailable. Retry after the service is restored.",
        )
