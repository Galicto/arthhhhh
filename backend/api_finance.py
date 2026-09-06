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

class BudgetImpactRequest(BaseModel):
    expenseAmount: float
    expensePurpose: str
    expenseType: str
    marginCapital: float
    avgRevenue: float
    avgOperatingCost: float

@router.post("/budget-impact")
async def budget_impact(req: BudgetImpactRequest):
    # Dummy logic to just return a valid response based on inputs
    new_margin = req.marginCapital - req.expenseAmount
    if new_margin < 0:
        recommendation = "high risk"
        msg = f"This {req.expenseType} expense exceeds your available capital."
    elif new_margin < 10000:
        recommendation = "caution"
        msg = f"This reduces your margin capital significantly. Ensure this {req.expenseType} generates revenue quickly."
    else:
        recommendation = "safe"
        msg = "Your current capital supports this expense comfortably."

    return {
        "analysis": f"**Impact Analysis:**\n\n{msg}\n\n- **Remaining Capital:** ₹{new_margin:,.0f}\n- **Purpose:** {req.expensePurpose}\n\n*Note: This is a deterministic estimation.*",
        "recommendation": recommendation,
        "newMarginCapital": new_margin
    }
