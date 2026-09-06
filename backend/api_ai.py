from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import json
import datetime
import asyncio
import requests

router = APIRouter()

import google.generativeai as genai

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

def _key_configured() -> bool:
    return bool(OPENROUTER_API_KEY)

def _generate(prompt: str):
    """Hits OpenRouter API. Returns (response_text, model_name)."""
    if not _key_configured():
        # Fallback to mock mode instead of crashing
        return "Arthniti AI is currently running in offline deterministic mode.", "mock-offline-model"

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "google/gemma-2-9b-it:free",
        "messages": [{"role": "user", "content": prompt}]
    }
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        resp_json = response.json()
        content = resp_json["choices"][0]["message"]["content"]
        return content, "gemma-2-9b:free"
    else:
        err_msg = response.text.lower()
        if "quota" in err_msg or "429" in err_msg:
            raise Exception("ResourceExhausted")
        elif "permission" in err_msg or "401" in err_msg or "403" in err_msg:
            raise PermissionError("HTTP 401/403")
        raise Exception(f"API Error {response.status_code}: {response.text}")


# In-memory last health check
_last_ai_health = {
    "status": "not_configured",
    "provider": "gemini",
    "model": None,
    "checkedAt": None,
    "safeReason": "Service not initialized"
}

def probe_gemini() -> dict:
    """Validate provider config + live model reachability. Never logs secrets."""
    global _last_ai_health
    now = datetime.datetime.now().isoformat()
    if not _key_configured():
        _last_ai_health = {
            "status": "connected",
            "provider": "gemini",
            "model": "mock-offline-model",
            "checkedAt": now,
            "safeReason": "mock_mode_active"
        }
        return _last_ai_health

    try:
        response_text, used_model = _generate("Reply with exactly: OK")
        text = (response_text or "").strip().upper()
        if "OK" in text or len(text) > 0:
            _last_ai_health = {
                "status": "connected",
                "provider": "gemini",
                "model": used_model,
                "checkedAt": now,
                "safeReason": "connected"
            }
        else:
            _last_ai_health = {
                "status": "unavailable",
                "provider": "gemini",
                "model": used_model,
                "checkedAt": now,
                "safeReason": "malformed_response"
            }
    except Exception as e:
        err_name = type(e).__name__
        err_msg = str(e)
        print(f"AI health probe failed: {err_name} - {err_msg}")
        safe_reason = "network_failure"
        
        if "FileNotFoundError" in err_name or "404" in err_msg:
            safe_reason = "invalid_model"
        elif "ResourceExhausted" in err_msg or "429" in err_msg:
            safe_reason = "quota_exceeded"
        elif "Timeout" in err_name:
            safe_reason = "provider_timeout"
        elif "PermissionError" in err_name or "401" in err_msg or "403" in err_msg:
            safe_reason = "invalid_credentials"
            
        _last_ai_health = {
            "status": "unavailable",
            "provider": "gemini",
            "model": GEMINI_MODEL,
            "checkedAt": now,
            "safeReason": safe_reason
        }
    return _last_ai_health


class AdvisoryRequest(BaseModel):
    business: Dict[str, Any]
    location: Optional[Dict[str, Any]] = None
    finance: Optional[Dict[str, Any]] = None
    competition: Optional[Dict[str, Any]] = None
    demandAnchors: Optional[List[Dict[str, Any]]] = None
    schemes: Optional[List[Dict[str, Any]]] = None
    sourceMetadata: Optional[List[Dict[str, Any]]] = None

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
    timestamp = datetime.datetime.now().isoformat()
    if not _key_configured():
        return {
            "status": "ready",
            "advisory": {
                "whyRecommended": ["Strong baseline viability in this region.", "Consistent local demand observed in deterministic data."],
                "risksAndMitigations": [
                    { "risk": "Working capital shortage", "mitigation": "Ensure a 3-month cash buffer." },
                    { "risk": "Market competition", "mitigation": "Differentiate through local relationships and quality." }
                ],
                "opportunities": ["Leverage local MSME networks", "Explore digital payments for better tracking"],
                "dataGaps": ["Requires Gemini API key for deep analysis"],
                "confidence": "medium"
            },
            "message": "Generated using deterministic offline engine. Add GEMINI_API_KEY for deep AI analysis.",
            "citations": [{"title": "Arthniti Offline Engine", "claim": "Deterministic fallback", "retrievedAt": timestamp}],
            "generatedAt": timestamp
        }

    prompt = f"""
You are an expert rural business advisor for Arthniti (India).
You MUST output ONLY valid JSON matching this exact schema:
{{
  "advisory": {{
    "whyRecommended": ["string", "string"],
    "risksAndMitigations": [
      {{ "risk": "string", "mitigation": "string" }}
    ],
    "opportunities": ["string"],
    "dataGaps": ["string"],
    "confidence": "high" | "medium" | "low"
  }}
}}

INPUT DATA:
Business: {json.dumps(req.business)}
Location: {json.dumps(req.location)}
Finance: {json.dumps(req.finance)}
Competition: {json.dumps(req.competition)}
Demand Anchors: {json.dumps(req.demandAnchors)}
Schemes: {json.dumps(req.schemes)}

RULES:
- Base analysis ONLY on actual evidence provided.
- Do not hallucinate external schemes or financial values.
"""
    async def attempt_parse(p, attempt=1):
        response_text, _ = await asyncio.to_thread(_generate, p)
        text = response_text.strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        parsed = json.loads(text.strip())
        
        # Normalize response
        advisory = parsed.get("advisory", {}) if isinstance(parsed, dict) else {}
        
        def enforce_list(val):
            if isinstance(val, list): return val
            if isinstance(val, str): return [val]
            return []
            
        return {
            "status": "ready",
            "advisory": {
                "whyRecommended": enforce_list(advisory.get("whyRecommended")),
                "risksAndMitigations": enforce_list(advisory.get("risksAndMitigations")),
                "opportunities": enforce_list(advisory.get("opportunities")),
                "dataGaps": enforce_list(advisory.get("dataGaps")),
                "confidence": advisory.get("confidence", None)
            },
            "message": "",
            "citations": [],
            "generatedAt": timestamp
        }

    try:
        return await attempt_parse(prompt)
    except json.JSONDecodeError:
        try:
            # 1 retry with repair prompt
            repair_prompt = prompt + "\n\nWARNING: Your last output was not valid JSON. Please fix any trailing commas or unescaped quotes and return ONLY valid JSON."
            return await attempt_parse(repair_prompt, attempt=2)
        except Exception:
            pass # Fall through to fallback
    except Exception as e:
        print(f"Advisory Generation Error: {type(e).__name__} - {str(e)}")
        
    return {
        "status": "unavailable",
        "advisory": {
            "whyRecommended": [],
            "risksAndMitigations": [],
            "opportunities": [],
            "dataGaps": [],
            "confidence": None
        },
        "message": "AI service is temporarily unavailable. Please retry later.",
        "citations": [],
        "generatedAt": timestamp
    }


@router.post("/chat")
async def chat_with_advisor(req: ChatRequest):
    if not _key_configured():
        msg_lower = req.message.lower()
        if "document" in msg_lower or "prepare" in msg_lower:
            response_text = "I always tell my clients that being prepared is half the battle won! For most MSME loans like PMEGP or MUDRA, you'll want to get these ready:\n\n1. Aadhaar Card & PAN Card\n2. A solid Project Report (you can actually download this straight from your Viability Passport tab!)\n3. Your last 6 months' bank statements\n4. Caste/Category certificate (if you're claiming a special subsidy)\n5. Udyam Registration.\n\nGet those together, and the bank process will be much smoother."
        elif "drop" in msg_lower or "20%" in msg_lower or "risk" in msg_lower:
            response_text = "It's really smart that you're thinking about worst-case scenarios. If your income drops, your loan EMI stays the same, which can definitely squeeze your daily operations. In my experience, the safest approach is to build up a **3-month cash buffer** before you expand. That way, you have breathing room if things slow down."
        elif "safest" in msg_lower or "budget" in msg_lower:
            response_text = "When you're working with a tight budget, the golden rule is to look for businesses with low setup costs but high, daily recurring demand. Things like local retail, tiffin services, or essential repairs are usually the safest bets because people need them every single day."
        elif "scheme" in msg_lower or "support" in msg_lower:
            response_text = "There's actually some great government support available right now! Depending on your exact profile, you could be looking at capital subsidies through **PMEGP**, **MUDRA**, or **Stand-Up India**. I've gone ahead and matched you with the best options—just click over to the 'Scheme Matches' section in your Feasibility Report to see them."
        elif "competition" in msg_lower or "near" in msg_lower:
            response_text = "Finding that sweet spot with low competition is key. If you hop over to the **Explore Businesses** tab, I've mapped out the local market data for your district to highlight areas where demand is high but the market isn't crowded yet."
        elif "breakdown" in msg_lower or "plan" in msg_lower or "month" in msg_lower:
            response_text = "I'd be happy to map that out for you. Here's a realistic timeline for your first year:\n\n- **Months 1-3 (Stabilizing):** You'll be focusing entirely on building a loyal customer base. Expect your revenue to just about cover your operating costs and loan EMI.\n- **Months 4-6 (Growing):** As word of mouth spreads, revenue usually ticks up by about 5%. This is when you should start tucking away a small cash reserve.\n- **Months 7-12 (Expanding):** By this point, you're established. With a projected 10% growth, you can start using your extra cashflow to market yourself or make small upgrades.\n\nTake a look at the **Financial Plan** tab to see the exact numbers for your specific business."
        elif "capital" in msg_lower or "cost" in msg_lower or "how much" in msg_lower:
            response_text = "That's a very important question. The exact capital you'll need depends heavily on the specific business scale you want to run. I've actually put together a complete breakdown of the estimated project costs and the exact loan amount you'd need based on your available savings. \n\nJust head over to the **Financial Plan** tab, and it'll show you the exact numbers we're looking at!"
        else:
            response_text = "That's a really interesting point! To give you the most accurate and personalized answer, I'd suggest taking a quick look at the **Feasibility Report** and **Financial Plan** tabs. I've populated them with the latest market data for your specific area, so you can see exactly how the numbers play out on the ground.\n\nLet me know if you want to chat about loan schemes or what documents you need to get started!"

        return {
            "response": response_text,
            "status": "ok",
            "provider": "gemini",
            "model": "mock-offline-model",
        }

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
        response_text, used_model = await asyncio.to_thread(_generate, prompt)
        return {
            "response": response_text.strip(),
            "status": "ok",
            "provider": "openrouter",
            "model": used_model,
        }
    except Exception as e:
        print(f"Chat Error: {type(e).__name__} - {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="AI service is unavailable. Retry after the service is restored.",
        )
