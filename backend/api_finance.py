from fastapi import APIRouter
from pydantic import BaseModel
import finance_engine
import datetime

router = APIRouter()

class FinanceRequest(BaseModel):
    marginCapital: float
    avgRevenue: float
    avgOperatingCost: float

@router.post("/calculate")
async def calculate_finance(req: FinanceRequest):
    base_fin = finance_engine.calculate_financials(req.marginCapital)
    scenarios = finance_engine.calculate_scenario_financials(req.marginCapital, req.avgRevenue, req.avgOperatingCost)
    readiness = finance_engine.calculate_repayment_readiness(req.marginCapital, req.avgRevenue, req.avgOperatingCost)
    
    timestamp = datetime.datetime.now().isoformat()
    
    return {
        "base": base_fin,
        "scenarios": scenarios,
        "readiness": readiness,
        "provenance": {
            "source": "Arthniti Backend Finance Engine",
            "retrievedAt": timestamp,
            "confidence": "high",
            "dataType": "deterministic calculation"
        }
    }

class FinancialPlanRequest(BaseModel):
    projectCost: float
    applicantMargin: float
    requiredCredit: float
    annualInterestRate: float
    tenureMonths: int
    monthlyRevenue: float = 0
    monthlyOperatingCost: float = 0

@router.post("/plan")
async def financial_plan(req: FinancialPlanRequest):
    import math
    timestamp = datetime.datetime.now().isoformat()
    errors = []

    if req.projectCost <= 0: 
        req.projectCost = max(50000, req.applicantMargin) # Fallback to prevent divide by zero / breaking
    if req.applicantMargin < 0: 
        req.applicantMargin = 0
    if req.requiredCredit < 0: 
        req.requiredCredit = 0 # If they have more margin than cost, they don't need a loan!
        
    if req.monthlyRevenue < 0: req.monthlyRevenue = 0
    if req.monthlyOperatingCost < 0: req.monthlyOperatingCost = 0
    
    # Deterministic fallback for credit terms if scheme data missing
    if req.annualInterestRate <= 0: 
        req.annualInterestRate = 10.0 # Default MSME rate
    if req.tenureMonths <= 0:
        req.tenureMonths = 60 # Default 5 years
        
    if any(math.isnan(val) for val in [req.projectCost, req.applicantMargin, req.requiredCredit, req.annualInterestRate, req.tenureMonths, req.monthlyRevenue, req.monthlyOperatingCost]):
        errors.append("NaN input detected")

    if len(errors) > 0:
        return {
            "status": "incomplete",
            "financials": {
                "projectCost": None, "applicantMargin": None, "requiredCredit": None,
                "annualInterestRate": None, "tenureMonths": None, "monthlyEmi": None,
                "monthlyRevenue": None, "monthlyOperatingCost": None, "monthlySurplus": None,
                "emiToSurplusRatio": None, "repaymentReadinessScore": None
            },
            "validationErrors": errors,
            "message": "Credit plan unavailable — verified scheme terms are required.",
            "source": {"retrievedAt": timestamp}
        }

    monthly_emi = finance_engine.calculate_emi(req.requiredCredit, req.annualInterestRate, req.tenureMonths)
    monthly_surplus = max(0, req.monthlyRevenue - req.monthlyOperatingCost)
    
    if monthly_surplus > 0:
        emi_to_surplus_ratio = min(100.0, (monthly_emi / monthly_surplus) * 100)
    else:
        emi_to_surplus_ratio = 100.0 if monthly_emi > 0 else 0.0

    readiness = 0
    msg = ""
    if monthly_emi > req.monthlyRevenue:
        msg = "This business plan is not financially viable under current assumptions."
        readiness = 0
    elif emi_to_surplus_ratio < 35:
        msg = "Your expected surplus easily covers the EMI."
        readiness = 90
    elif emi_to_surplus_ratio <= 50:
        msg = "EMI is manageable, but takes up a significant portion of surplus."
        readiness = 70
    elif emi_to_surplus_ratio <= 80:
        msg = "Caution: EMI is high relative to surplus."
        readiness = 40
    else:
        msg = "EMI exceeds safe limits. High risk of default."
        readiness = 20

    return {
        "status": "ready",
        "financials": {
            "projectCost": req.projectCost,
            "applicantMargin": req.applicantMargin,
            "requiredCredit": req.requiredCredit,
            "annualInterestRate": req.annualInterestRate,
            "tenureMonths": req.tenureMonths,
            "monthlyEmi": monthly_emi,
            "monthlyRevenue": req.monthlyRevenue,
            "monthlyOperatingCost": req.monthlyOperatingCost,
            "monthlySurplus": monthly_surplus,
            "emiToSurplusRatio": emi_to_surplus_ratio,
            "repaymentReadinessScore": readiness
        },
        "projection": [
            {"month": "Month 1-3", "revenue": req.monthlyRevenue * 3, "expenses": req.monthlyOperatingCost * 3 + monthly_emi * 3, "status": "Stabilization Phase"},
            {"month": "Month 4-6", "revenue": req.monthlyRevenue * 3 * 1.05, "expenses": req.monthlyOperatingCost * 3 + monthly_emi * 3, "status": "Growth Phase"},
            {"month": "Month 7-12", "revenue": req.monthlyRevenue * 6 * 1.10, "expenses": req.monthlyOperatingCost * 6 + monthly_emi * 6, "status": "Expansion Phase"}
        ],
        "detailedReport": {
            "summary": "This deterministic financial plan models your business over the next 12 months, factoring in operating costs and debt service obligations.",
            "cashflowHealth": msg,
            "capitalAllocation": [
                {"category": "Operating Expenses", "percentage": 60, "note": "Standard MSME benchmark for daily operations."},
                {"category": "Debt Repayment", "percentage": round(emi_to_surplus_ratio, 1), "note": "Portion of surplus allocated to EMI."},
                {"category": "Retained Earnings", "percentage": max(0, 100 - 60 - round(emi_to_surplus_ratio, 1)), "note": "Reinvest back into the business."}
            ],
            "riskAssessment": "Low" if readiness >= 70 else "Medium" if readiness >= 40 else "High",
            "nextSteps": [
                "Maintain a strict ledger of daily operating costs.",
                "Set aside 3 months of EMI as an emergency buffer.",
                "Re-evaluate pricing strategy in Month 4 to boost margins."
            ]
        },
        "validationErrors": [],
        "message": msg,
        "source": {
            "retrievedAt": timestamp,
            "name": "Arthniti Deterministic Engine"
        }
    }

class DebtHealthRequest(BaseModel):
    financialPlan: dict

@router.post("/analyse")
async def analyse_debt_health(req: DebtHealthRequest):
    import asyncio
    import api_ai
    timestamp = datetime.datetime.now().isoformat()
    try:
        plan = req.financialPlan
        ratio = plan.get('emiToSurplusRatio', 0)
        
        prompt = f"You are a rural debt advisor. Analyze this micro-business debt health briefly (2-3 sentences). Focus on EMI-to-Surplus ratio risk. Plan: {plan}"
        summary, _ = await asyncio.to_thread(api_ai._generate, prompt)
        
        return {
            "status": "ready",
            "analysis": {
                "executiveSummary": summary.strip(),
                "riskLevel": "High" if ratio > 60 else "Medium" if ratio > 40 else "Low",
                "recommendedActions": ["Maintain a 3-month EMI buffer", "Track daily operating costs closely"]
            },
            "retrievedAt": timestamp
        }
    except Exception as e:
        print(f"Debt analysis error: {e}")
        return {
            "status": "error",
            "analysis": None,
            "message": "Debt health analysis unavailable.",
            "retrievedAt": timestamp
        }

class BudgetImpactRequest(BaseModel):
    expenseAmount: float
    expensePurpose: str
    expenseType: str
    marginCapital: float
    avgRevenue: float
    avgOperatingCost: float

@router.post("/budget-impact")
async def budget_impact(req: BudgetImpactRequest):
    import asyncio
    import api_ai
    
    prompt = f"""
    You are a rural business finance advisor. A micro-entrepreneur is considering an expense.
    Expense Amount: ₹{req.expenseAmount}
    Purpose: {req.expensePurpose}
    Type: {req.expenseType}
    Business Average Monthly Revenue: ₹{req.avgRevenue}
    Business Average Monthly Operating Cost: ₹{req.avgOperatingCost}
    Available Capital: ₹{req.marginCapital}
    
    Provide a short, concise analysis (max 3 sentences) on the impact of this expense on their financial goals.
    Is it a safe investment or risky? Give concrete advice. Do not output markdown, just plain text.
    """
    try:
        response_text, _ = await asyncio.to_thread(api_ai._generate, prompt)
        return {"analysis": response_text.strip()}
    except Exception as e:
        print("Budget impact error:", e)
        # Deterministic fallback
        impact_ratio = (req.expenseAmount / max(1, req.marginCapital)) * 100
        if impact_ratio > 30:
            analysis = f"This {req.expensePurpose} expense takes up {impact_ratio:.1f}% of your available capital. This is a high-risk move; ensure it directly increases revenue."
        else:
            analysis = f"This {req.expensePurpose} expense seems manageable within your current capital reserves."
        return {"analysis": analysis}
