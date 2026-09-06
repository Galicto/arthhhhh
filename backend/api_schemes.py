from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import datetime

router = APIRouter()

class SchemeMatchRequest(BaseModel):
    state: str = ""
    district: str = ""
    category: str = ""
    projectCost: float
    marginCapital: float
    socialCategory: str = ""
    gender: str = ""
    isArtisan: bool = False
    isExistingEnterprise: bool = False
    hasUdyam: bool = False

SCHEMES_DB = [
    {
        "schemeId": "pm_mudra",
        "name": "Pradhan Mantri MUDRA Yojana (PMMY)",
        "agency": "Ministry of Finance",
        "officialUrl": "https://www.mudra.org.in/",
        "description": "Provides collateral-free loans up to ₹10 Lakhs to non-corporate, non-farm small/micro enterprises.",
        "maxProjectCost": 1000000,
        "eligibilityRules": {
            "isExistingEnterprise": None
        },
        "requiredDocuments": [
            "Aadhaar Card",
            "PAN Card",
            "Proof of Identity/Address",
            "Business Plan/Quotations for machinery"
        ],
        "applicationRoute": "Apply through nearest bank branch or Udyamimitra portal."
    },
    {
        "schemeId": "pm_vishwakarma",
        "name": "PM Vishwakarma Yojana",
        "agency": "Ministry of MSME",
        "officialUrl": "https://pmvishwakarma.gov.in/",
        "description": "End-to-end support for traditional artisans and craftspeople, including collateral-free credit, skill training, and toolkit incentive.",
        "maxProjectCost": 300000,
        "eligibilityRules": {
            "isArtisan": True
        },
        "requiredDocuments": [
            "Aadhaar Card",
            "Mobile number linked to Aadhaar",
            "Bank Account Details",
            "Ration Card"
        ],
        "applicationRoute": "Apply via CSC (Common Service Centres) or pmvishwakarma.gov.in"
    }
]

@router.post("/match")
async def match_schemes(req: SchemeMatchRequest):
    timestamp = datetime.datetime.now().isoformat()
    results = []
    
    for scheme in SCHEMES_DB:
        is_match = True
        reason = ""
        
        if scheme.get("maxProjectCost") and req.projectCost > scheme["maxProjectCost"]:
            continue
            
        rules = scheme.get("eligibilityRules", {})
        
        if "isArtisan" in rules and rules["isArtisan"] == True and not req.isArtisan:
            is_match = False
            
        if is_match:
            if scheme["schemeId"] == "pm_vishwakarma":
                reason = "Specialized support for artisans with highly subsidized credit and toolkit incentives."
            elif scheme["schemeId"] == "pm_mudra":
                reason = f"Covers project cost up to ₹{scheme['maxProjectCost']} without collateral requirement."
            
            s_copy = dict(scheme)
            s_copy["whyRelevant"] = reason
            s_copy["provenance"] = {
                "source": "Official Ministry Data (Proxy DB)",
                "retrievedAt": timestamp,
                "confidence": "high",
                "dataType": "official"
            }
            results.append(s_copy)
            
    return results
