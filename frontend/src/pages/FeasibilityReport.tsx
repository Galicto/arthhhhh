import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { usePredX } from '../context/PredXContext';
import { BusinessItem, LocationProfile } from '../providers/types';
import SchemeMatcher from '../components/SchemeMatcher';
import LocalBusinessMap from '../components/LocalBusinessMap';
import { generateFeasibilityReport, FeasibilityReport as AIFeasibilityReport } from '../lib/geminiAdvisor';

export default function FeasibilityReport() {
  const { navigate } = usePredX();
  const [activeTab, setActiveTab] = useState<'report' | 'map'>('report');
  const [report, setReport] = useState<AIFeasibilityReport | null>(null);
  const [loading, setLoading] = useState(true);

  const profileStr = sessionStorage.getItem('arthniti-profile');
  const profile = profileStr ? JSON.parse(profileStr) : null;
  const businessStr = sessionStorage.getItem('arthniti-selected-business');
  const business: BusinessItem = businessStr ? JSON.parse(businessStr) : null;

  useEffect(() => {
    if (profile && business) {
      setLoading(true);
      generateFeasibilityReport({
        profile,
        business,
        financials: {}, // Not needed strictly for the text parts if we just pass context
        schemes: []
      }).then(r => {
        setReport(r);
        setLoading(false);
      });
    }
  }, [profile, business]);

  if (!profile || !business) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 pb-20 pt-20 text-center">
          <h2 className="text-2xl font-headline font-bold text-on-surface mb-4">No Report Data</h2>
          <button onClick={() => navigate('explore')} className="bg-[#FF5A00] text-white px-6 py-3 rounded-xl font-bold">Go Back to Explore</button>
        </div>
      </DashboardLayout>
    );
  }

  const surplus = business.avgRevenue - business.avgOperatingCost;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pb-20 pt-4">
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <button
              onClick={() => navigate('compare')}
              className="flex items-center text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors mb-2"
            >
              <span className="material-symbols-outlined mr-1 text-[14px]">arrow_back</span>
              Back to Comparison
            </button>
            <h1 className="text-3xl font-headline font-black tracking-tight text-on-surface mb-1">
              {business.name} Feasibility Report
            </h1>
            <p className="text-on-surface-variant font-body text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              {profile.location.district}, {profile.location.state}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('arthniti-chat')}
              className="flex items-center gap-2 bg-on-surface/5 border border-on-surface/10 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-on-surface/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              Ask Assistant
            </button>
            <button
              onClick={() => navigate('financial-plan')}
              className="flex items-center gap-2 bg-gradient-to-r from-[#FF5A00] to-[#FF8C00] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              View Passport
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-outline-variant/10 mb-6">
          <button
            onClick={() => setActiveTab('report')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'report' ? 'border-[#FF5A00] text-[#FF5A00]' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            Detailed Analysis
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'map' ? 'border-[#FF5A00] text-[#FF5A00]' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}
          >
            Local Business Map
            {profile.location.isDemoData && <span className="bg-amber-500/20 text-amber-500 text-[9px] px-1.5 py-0.5 rounded uppercase">Demo</span>}
          </button>
        </div>

        {activeTab === 'report' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Executive Summary */}
              <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center justify-between">
                  Executive Summary
                  {report?.citations && report.citations.length > 0 && (
                    <span className="text-[10px] bg-[#FF5A00]/20 text-[#FF5A00] px-2 py-1 rounded-md">AI Verified</span>
                  )}
                </h3>
                <p className="text-sm text-on-surface leading-relaxed mb-4">
                  {loading ? 'Analyzing data...' : report?.recommendationSummary}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-on-surface/5 rounded-xl p-3 border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">Viability Score</p>
                    <p className="text-xl font-bold text-[#00FFA3]">{business.demandProxyScore}</p>
                  </div>
                  <div className="bg-on-surface/5 rounded-xl p-3 border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">Competition</p>
                    <p className="text-xl font-bold text-on-surface capitalize">{business.competitorDensity}</p>
                  </div>
                  <div className="bg-on-surface/5 rounded-xl p-3 border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">Est. Surplus</p>
                    <p className="text-xl font-bold text-on-surface">₹{(surplus/1000).toFixed(0)}k</p>
                  </div>
                  <div className="bg-on-surface/5 rounded-xl p-3 border border-outline-variant/5">
                    <p className="text-[10px] text-on-surface-variant uppercase mb-1">Break-even</p>
                    <p className="text-xl font-bold text-on-surface">~{Math.ceil((business.avgOperatingCost * 3) / surplus)} mo</p>
                  </div>
                </div>
              </div>

              {/* AI Deep Dive */}
              <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Strategic Advisory</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                    <h4 className="text-emerald-500 font-bold text-xs uppercase mb-2">Why Recommended</h4>
                    <ul className="text-xs text-on-surface/80 space-y-1 list-disc pl-4">
                      {loading ? <li>Loading...</li> : report?.whyRecommended.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                    <h4 className="text-red-400 font-bold text-xs uppercase mb-2">Risks & Mitigations</h4>
                    <ul className="text-xs text-on-surface/80 space-y-1 list-disc pl-4">
                      {loading ? <li>Loading...</li> : report?.risks.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-on-surface mb-2">Data & Sources Provenance</h4>
                <div className="bg-on-surface/5 p-4 rounded-xl border border-outline-variant/5 text-xs text-on-surface/70">
                  {loading ? (
                    'Fetching source integrity...'
                  ) : report?.citations && report.citations.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-2">
                      {report.citations.map((c, i) => (
                        <li key={i}>
                          <span className="font-bold">{c.title}</span> ({c.retrievedAt}): {c.claim}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'Data sources fetched from standard mock proxy. Production external verification unavailable.'
                  )}
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Location Profile Context */}
              <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Location Context</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase">Primary Sectors</p>
                    <p className="text-sm font-semibold text-on-surface">{profile.location.primarySectors.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase">Population Base</p>
                    <p className="text-sm font-semibold text-on-surface">{profile.location.population?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>

              {/* Scheme Matcher */}
              <div className="bg-surface-container-high rounded-2xl p-6 border border-[#FF5A00]/20 shadow-[0_4px_20px_rgba(255,90,0,0.05)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#FF5A00]">assured_workload</span>
                  <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Scheme Matching</h3>
                </div>
                <p className="text-xs text-on-surface/60">Based on your {profile.isArtisan ? 'artisan' : ''} profile in {profile.location.state}.</p>
                
                <SchemeMatcher 
                  profile={{
                    state: profile.location.state,
                    category: business.category,
                    projectCost: business.avgOperatingCost * 6,
                    marginCapital: profile.marginCapital,
                    socialCategory: profile.socialCategory,
                    gender: profile.gender,
                    isArtisan: profile.isArtisan,
                    isExistingEnterprise: false,
                  }}
                />
              </div>

            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <LocalBusinessMap location={profile.location} business={business} />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
