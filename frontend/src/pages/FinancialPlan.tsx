import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { usePredX } from '../context/PredXContext';
import { useLanguage } from '../lib/i18n';
import { calculateFinancials, calculateScenarioFinancials, calculateRepaymentReadiness, formatINR, type ScenarioType } from '../lib/financialCalculator';
import { generatePDFReport } from '../lib/pdfExport';
import { BusinessItem, LocationProfile, SchemeMatch } from '../providers/types';
import { schemeProvider } from '../providers/MockProviders';

export default function FinancialPlan() {
  const { navigate } = usePredX();
  const { t, lang } = useLanguage();
  const [scenario, setScenario] = useState<ScenarioType>('expected');
  const [schemeMatches, setSchemeMatches] = useState<SchemeMatch[]>([]);

  const profileStr = sessionStorage.getItem('arthniti-profile');
  const profile = profileStr ? JSON.parse(profileStr) : null;
  const businessStr = sessionStorage.getItem('arthniti-selected-business');
  const business: BusinessItem = businessStr ? JSON.parse(businessStr) : null;

  useEffect(() => {
    if (profile && business) {
      schemeProvider.findMatches({
        state: profile.location.state,
        category: business.category,
        projectCost: business.avgOperatingCost * 6,
        marginCapital: profile.marginCapital,
        socialCategory: profile.socialCategory,
        gender: profile.gender,
        isArtisan: profile.isArtisan,
        isExistingEnterprise: false,
      }).then(setSchemeMatches);
    }
  }, [profile, business]);

  if (!profile || !business) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 pb-20 pt-20 text-center">
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-4">No Financial Data</h2>
          <button onClick={() => navigate('explore')} className="bg-[#FF5A00] text-white px-6 py-3 rounded-xl font-bold">Go Back to Explore</button>
        </div>
      </DashboardLayout>
    );
  }

  const financials = calculateFinancials(profile.marginCapital);
  const { revenue: scenRev, operatingCost: scenCost, surplus: scenSurplus } = calculateScenarioFinancials(scenario, business.avgRevenue, business.avgOperatingCost);
  const emiVal = financials.monthlyEMI || 0;
  const readiness = calculateRepaymentReadiness(scenSurplus, emiVal);

  const handleDownloadPDF = () => {
    generatePDFReport({
      location: profile.location,
      business,
      marginCapital: profile.marginCapital,
      financials,
      schemeMatches
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pb-12 pt-4">
        {/* Header */}
        <section className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button onClick={() => navigate('feasibility')} className="text-on-surface/50 text-xs font-body font-semibold hover:text-on-surface transition-colors flex items-center gap-1 mb-2">
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>Back to Report
            </button>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface">Viability Passport & Financial Plan</h1>
            <p className="text-on-surface/50 text-sm font-body mt-1">
              {business.name} — {profile.location.district}
            </p>
          </div>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-gradient-to-r from-[#FF5A00] to-[#FF8C00] text-white px-6 py-3 rounded-xl text-sm font-body font-bold hover:shadow-[0_0_20px_rgba(255,90,0,0.3)] transition-all active:scale-95">
            <span className="material-symbols-outlined text-[18px]">download</span>Generate Viability Passport
          </button>
        </section>

        {/* Financial Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-on-surface/5 backdrop-blur-xl p-5 rounded-2xl border border-on-surface/10">
            <span className="text-[10px] font-label text-on-surface/50 uppercase tracking-widest block mb-2">Project Cost (Est.)</span>
            <span className="text-2xl font-headline font-bold text-on-surface">₹{(business.avgOperatingCost * 6).toLocaleString('en-IN')}</span>
          </div>
          <div className="bg-on-surface/5 backdrop-blur-xl p-5 rounded-2xl border border-on-surface/10 border-b-2 border-b-[#FF5A00]">
            <span className="text-[10px] font-label text-on-surface/50 uppercase tracking-widest block mb-2">Required Credit</span>
            <span className="text-2xl font-headline font-bold text-on-surface">{formatINR(financials.principalAmount)}</span>
          </div>
          <div className="bg-on-surface/5 backdrop-blur-xl p-5 rounded-2xl border border-on-surface/10">
            <span className="text-[10px] font-label text-on-surface/50 uppercase tracking-widest block mb-2">Monthly EMI</span>
            <span className="text-2xl font-headline font-bold text-on-surface">{formatINR(financials.monthlyEMI)}</span>
          </div>
          <div className="bg-on-surface/5 backdrop-blur-xl p-5 rounded-2xl border border-on-surface/10">
            <span className="text-[10px] font-label text-on-surface/50 uppercase tracking-widest block mb-2">Credit Tenure</span>
            <span className="text-2xl font-headline font-bold text-on-surface">{financials.tenureMonths} mo <span className="text-sm font-normal text-on-surface/50">@{financials.interestRatePercent}%</span></span>
          </div>
        </section>

        {/* Scenario Simulator */}
        <section className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-headline font-bold text-on-surface">Scenario Simulator</h3>
              <p className="text-sm text-on-surface/60">Test if you can repay the EMI if business fluctuates.</p>
            </div>
            <div className="flex bg-on-surface/5 p-1 rounded-xl mt-4 md:mt-0">
              <button
                onClick={() => setScenario('optimistic')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${scenario === 'optimistic' ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'text-on-surface/60 hover:text-on-surface'}`}
              >Optimistic</button>
              <button
                onClick={() => setScenario('expected')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${scenario === 'expected' ? 'bg-[#FF5A00]/20 text-[#FF5A00]' : 'text-on-surface/60 hover:text-on-surface'}`}
              >Expected</button>
              <button
                onClick={() => setScenario('conservative')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${scenario === 'conservative' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'text-on-surface/60 hover:text-on-surface'}`}
              >Conservative</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-on-surface/5 rounded-xl p-4">
              <span className="text-[10px] uppercase text-on-surface/50 mb-1 block">Est. Revenue</span>
              <span className="text-lg font-bold">₹{scenRev.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-on-surface/5 rounded-xl p-4">
              <span className="text-[10px] uppercase text-on-surface/50 mb-1 block">Est. Operating Cost</span>
              <span className="text-lg font-bold">₹{scenCost.toLocaleString('en-IN')}</span>
            </div>
            <div className={`rounded-xl p-4 border ${readiness.status === 'safe' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : readiness.status === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
              <span className="text-[10px] uppercase opacity-70 mb-1 block">Repayment Readiness</span>
              <span className="text-lg font-bold">{readiness.score}/100</span>
              <p className="text-xs mt-1">{readiness.label}</p>
            </div>
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
