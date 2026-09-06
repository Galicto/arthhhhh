/**
 * financialCalculator.ts — Deterministic financial logic for Arthniti
 * 
 * No Gemini dependency. Pure calculations based on government scheme rules.
 * 
 * Moratorium Convention:
 * - During the moratorium period, interest accrues on the loan amount
 * - This accrued interest is capitalized (added to principal)
 * - EMI repayment begins AFTER the moratorium period
 * - The repayment schedule reflects the post-moratorium capitalized principal
 */

export type SchemeType = 'micro_finance' | 'term_loan';

export interface SchemeInfo {
  type: SchemeType;
  name: string;
  nameHi: string;
  maxLoan: number;
  annualInterestRate: number;
  tenureYears: number;
  moratoriumMonths: number;
  description: string;
  descriptionHi: string;
}

export interface FinancialResult {
  isEligible: boolean;
  ineligibleReason?: string;
  ineligibleReasonHi?: string;
  marginCapital: number;
  projectCost: number;
  loanAmount: number;
  scheme?: SchemeInfo;
  cappedLoanAmount?: number;     // if loanAmount exceeds scheme max
  monthlyEMI?: number;
  moratoriumInterest?: number;   // total interest accrued during moratorium
  capitalizedPrincipal?: number; // principal after moratorium interest is added
  totalRepayment?: number;
  totalInterestPaid?: number;
  repaymentSchedule?: QuarterlyPayment[];
  amortizationTable?: AmortizationRow[];
}

export interface QuarterlyPayment {
  quarter: number;
  year: number;
  quarterLabel: string;
  openingBalance: number;
  emiPerMonth: number;
  quarterlyPayment: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface AmortizationRow {
  month: number;
  openingBalance: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
  isMoratorium: boolean;
}

// ── Scheme Definitions ──────────────────────────────────────────────

const MICRO_FINANCE: SchemeInfo = {
  type: 'micro_finance',
  name: 'Micro Finance Scheme',
  nameHi: 'माइक्रो फाइनेंस योजना',
  maxLoan: 1_25_000,
  annualInterestRate: 6.5,
  tenureYears: 3,
  moratoriumMonths: 3,
  description: 'For small-scale micro enterprises with project cost up to ₹1,40,000. Maximum loan of ₹1,25,000 at 6.5% annual interest with 3-year repayment.',
  descriptionHi: 'परियोजना लागत ₹1,40,000 तक की लघु सूक्ष्म उद्यमों के लिए। ₹1,25,000 तक का ऋण 6.5% वार्षिक ब्याज पर 3 वर्ष की अवधि के साथ।',
};

const TERM_LOAN: SchemeInfo = {
  type: 'term_loan',
  name: 'Term Loan Scheme',
  nameHi: 'सावधि ऋण योजना',
  maxLoan: 45_00_000,
  annualInterestRate: 8.0,
  tenureYears: 7,
  moratoriumMonths: 6,
  description: 'For medium enterprises with project cost between ₹1,40,001 and ₹50,00,000. Maximum loan of ₹45,00,000 at 8% annual interest with 7-year repayment.',
  descriptionHi: '₹1,40,001 से ₹50,00,000 तक की परियोजना लागत वाले मध्यम उद्यमों के लिए। ₹45,00,000 तक का ऋण 8% वार्षिक ब्याज पर 7 वर्ष की अवधि के साथ।',
};

// ── Core Calculation Functions ──────────────────────────────────────

/**
 * Route to the appropriate scheme based on project cost.
 */
function routeScheme(projectCost: number): SchemeInfo | null {
  if (projectCost <= 1_40_000) return MICRO_FINANCE;
  if (projectCost <= 50_00_000) return TERM_LOAN;
  return null; // out of range
}

/**
 * Calculate monthly EMI using reducing balance method.
 * EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 */
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / tenureMonths;
  const factor = Math.pow(1 + r, tenureMonths);
  return (principal * r * factor) / (factor - 1);
}

/**
 * Generate full amortization table including moratorium period.
 */
function generateAmortization(
  loanAmount: number,
  annualRate: number,
  tenureYears: number,
  moratoriumMonths: number,
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const monthlyRate = annualRate / 100 / 12;
  let balance = loanAmount;

  // Moratorium period: interest accrues and is capitalized
  for (let m = 1; m <= moratoriumMonths; m++) {
    const interestAccrued = balance * monthlyRate;
    const newBalance = balance + interestAccrued;
    rows.push({
      month: m,
      openingBalance: Math.round(balance * 100) / 100,
      emi: 0,
      principalPaid: 0,
      interestPaid: 0,
      closingBalance: Math.round(newBalance * 100) / 100,
      isMoratorium: true,
    });
    balance = newBalance;
  }

  // Post-moratorium: regular EMI payments
  const repaymentMonths = tenureYears * 12 - moratoriumMonths;
  const emi = calculateEMI(balance, annualRate, repaymentMonths);

  for (let m = moratoriumMonths + 1; m <= tenureYears * 12; m++) {
    const interest = balance * monthlyRate;
    const principal = emi - interest;
    const newBalance = Math.max(0, balance - principal);
    rows.push({
      month: m,
      openingBalance: Math.round(balance * 100) / 100,
      emi: Math.round(emi * 100) / 100,
      principalPaid: Math.round(principal * 100) / 100,
      interestPaid: Math.round(interest * 100) / 100,
      closingBalance: Math.round(newBalance * 100) / 100,
      isMoratorium: false,
    });
    balance = newBalance;
  }

  return rows;
}

/**
 * Aggregate amortization rows into quarterly payments.
 */
function generateQuarterlySchedule(amortization: AmortizationRow[]): QuarterlyPayment[] {
  const quarters: QuarterlyPayment[] = [];
  const nonMoratorium = amortization.filter(r => !r.isMoratorium);
  
  for (let i = 0; i < nonMoratorium.length; i += 3) {
    const chunk = nonMoratorium.slice(i, i + 3);
    if (chunk.length === 0) break;
    
    const qNum = Math.floor(i / 3) + 1;
    const year = Math.ceil(qNum / 4);
    const qInYear = ((qNum - 1) % 4) + 1;
    
    quarters.push({
      quarter: qNum,
      year,
      quarterLabel: `Y${year} Q${qInYear}`,
      openingBalance: chunk[0].openingBalance,
      emiPerMonth: chunk[0].emi,
      quarterlyPayment: Math.round(chunk.reduce((s, r) => s + r.emi, 0) * 100) / 100,
      principalPaid: Math.round(chunk.reduce((s, r) => s + r.principalPaid, 0) * 100) / 100,
      interestPaid: Math.round(chunk.reduce((s, r) => s + r.interestPaid, 0) * 100) / 100,
      closingBalance: chunk[chunk.length - 1].closingBalance,
    });
  }

  return quarters;
}

// ── Main Calculation Entry Point ─────────────────────────────────

export function calculateFinancials(marginCapital: number): FinancialResult {
  // Validate input
  if (!marginCapital || marginCapital <= 0) {
    return {
      isEligible: false,
      ineligibleReason: 'Please enter a valid margin capital amount greater than ₹0.',
      ineligibleReasonHi: 'कृपया ₹0 से अधिक एक वैध मार्जिन पूंजी राशि दर्ज करें।',
      marginCapital: 0,
      projectCost: 0,
      loanAmount: 0,
    };
  }

  const projectCost = marginCapital / 0.10;     // 10% margin model
  const loanAmount = projectCost * 0.90;          // 90% loan

  const scheme = routeScheme(projectCost);

  if (!scheme) {
    return {
      isEligible: false,
      ineligibleReason: `Your projected project cost of ₹${projectCost.toLocaleString('en-IN')} exceeds the maximum supported limit of ₹50,00,000. Please contact your nearest NSFDC/channelizing agency for enterprise-level financing.`,
      ineligibleReasonHi: `आपकी अनुमानित परियोजना लागत ₹${projectCost.toLocaleString('en-IN')} अधिकतम समर्थित सीमा ₹50,00,000 से अधिक है। उद्यम-स्तरीय वित्तपोषण के लिए कृपया अपनी निकटतम NSFDC/चैनलाइज़िंग एजेंसी से संपर्क करें।`,
      marginCapital,
      projectCost,
      loanAmount,
    };
  }

  // Cap loan to scheme maximum
  const cappedLoan = Math.min(loanAmount, scheme.maxLoan);

  // Generate full amortization
  const amortization = generateAmortization(
    cappedLoan,
    scheme.annualInterestRate,
    scheme.tenureYears,
    scheme.moratoriumMonths,
  );

  // Moratorium interest
  const moratoriumRows = amortization.filter(r => r.isMoratorium);
  const moratoriumInterest = moratoriumRows.length > 0
    ? moratoriumRows[moratoriumRows.length - 1].closingBalance - cappedLoan
    : 0;

  const capitalizedPrincipal = cappedLoan + moratoriumInterest;

  // EMI (post-moratorium)
  const repaymentMonths = scheme.tenureYears * 12 - scheme.moratoriumMonths;
  const monthlyEMI = calculateEMI(capitalizedPrincipal, scheme.annualInterestRate, repaymentMonths);

  // Quarterly schedule
  const repaymentSchedule = generateQuarterlySchedule(amortization);

  // Totals
  const totalRepayment = moratoriumInterest + (monthlyEMI * repaymentMonths);
  const totalInterestPaid = totalRepayment - cappedLoan;

  return {
    isEligible: true,
    marginCapital,
    projectCost,
    loanAmount,
    scheme,
    cappedLoanAmount: cappedLoan,
    monthlyEMI: Math.round(monthlyEMI * 100) / 100,
    moratoriumInterest: Math.round(moratoriumInterest * 100) / 100,
    capitalizedPrincipal: Math.round(capitalizedPrincipal * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    repaymentSchedule,
    amortizationTable: amortization,
  };
}

// ── Formatting Helpers ──────────────────────────────────────────────

export const formatINR = (n: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const formatINRDetailed = (n: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

// ── Deterministic Scenario & Scoring Logic ────────────────────────────

export interface ScenarioOutput {
  revenue: number;
  operatingCost: number;
  surplus: number;
}

export type ScenarioType = 'conservative' | 'expected' | 'optimistic';

export function calculateScenarioFinancials(
  scenario: ScenarioType,
  baselineRevenue: number,
  baselineCost: number
): ScenarioOutput {
  let revMultiplier = 1;
  let costMultiplier = 1;
  
  if (scenario === 'conservative') {
    revMultiplier = 0.8;
    costMultiplier = 1.1;
  } else if (scenario === 'optimistic') {
    revMultiplier = 1.2;
    costMultiplier = 0.9;
  }
  
  const revenue = baselineRevenue * revMultiplier;
  const operatingCost = baselineCost * costMultiplier;
  const surplus = revenue - operatingCost;
  
  return { revenue, operatingCost, surplus };
}

export interface ReadinessOutput {
  ratio: number;
  status: 'Comfortable' | 'Caution' | 'High Risk';
}

export function calculateRepaymentReadiness(surplus: number, emi: number): ReadinessOutput {
  if (surplus <= 0) return { ratio: 100, status: 'High Risk' };
  
  const ratio = (emi / surplus) * 100;
  
  let status: 'Comfortable' | 'Caution' | 'High Risk' = 'Comfortable';
  if (ratio > 50) status = 'High Risk';
  else if (ratio >= 35) status = 'Caution';
  
  return { ratio, status };
}

export interface ViabilityFactor {
  name: string;
  score: number;
  weight: number;
  status: 'Strong' | 'Moderate' | 'Needs Attention';
}

export interface ViabilityResult {
  totalScore: number;
  factors: ViabilityFactor[];
}

export function calculateViabilityScore(
  demandProxyScore: number,
  competitorDensity: 'low' | 'medium' | 'high',
  skillLevel: 'None' | 'Beginner' | 'Experienced' | '',
  emiToSurplusRatio: number,
  marginCapital: number,
  projectCost: number
): ViabilityResult {
  const demandScore = demandProxyScore;
  const compScore = competitorDensity === 'low' ? 90 : competitorDensity === 'medium' ? 60 : 30;
  const skillScore = skillLevel === 'Experienced' ? 95 : skillLevel === 'Beginner' ? 60 : 30;
  
  let emiScore = 0;
  if (emiToSurplusRatio < 35) emiScore = 90;
  else if (emiToSurplusRatio <= 50) emiScore = 60;
  else emiScore = 20;
  
  const marginPct = (marginCapital / projectCost) * 100;
  let capScore = 50;
  if (marginPct >= 20) capScore = 95;
  else if (marginPct >= 15) capScore = 80;
  else if (marginPct >= 10) capScore = 70;
  
  const totalScore = (demandScore * 0.3) + (compScore * 0.2) + (skillScore * 0.2) + (emiScore * 0.2) + (capScore * 0.1);
  
  const getStatus = (s: number): 'Strong' | 'Moderate' | 'Needs Attention' => {
    if (s >= 75) return 'Strong';
    if (s >= 50) return 'Moderate';
    return 'Needs Attention';
  };
  
  return {
    totalScore: Math.round(totalScore),
    factors: [
      { name: 'Local Demand Proxy', score: demandScore, weight: 30, status: getStatus(demandScore) },
      { name: 'Competition', score: compScore, weight: 20, status: getStatus(compScore) },
      { name: 'Skill Fit', score: skillScore, weight: 20, status: getStatus(skillScore) },
      { name: 'EMI Affordability', score: emiScore, weight: 20, status: getStatus(emiScore) },
      { name: 'Capital Readiness', score: capScore, weight: 10, status: getStatus(capScore) }
    ]
  };
}
