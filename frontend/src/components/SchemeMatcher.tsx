import React, { useEffect, useState } from 'react';
import { schemeProvider } from '../providers/MockProviders';
import { SchemeMatch } from '../providers/types';

interface SchemeMatcherProps {
  profile: {
    state: string;
    category: string;
    projectCost: number;
    marginCapital: number;
    socialCategory?: string;
    gender?: string;
    isArtisan?: boolean;
    isExistingEnterprise?: boolean;
    hasUdyam?: boolean;
  };
}

export default function SchemeMatcher({ profile }: SchemeMatcherProps) {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    schemeProvider.findMatches(profile).then(res => {
      setMatches(res);
      try {
        const prev = JSON.parse(sessionStorage.getItem('arthniti-scheme-matches') || '[]');
        const merged = [...prev];
        for (const m of res) {
          if (!merged.some((x: any) => x.schemeId === m.schemeId || x.name === m.name)) {
            merged.push(m);
          }
        }
        sessionStorage.setItem('arthniti-scheme-matches', JSON.stringify(merged));
      } catch { /* ignore */ }
      setIsLoading(false);
    });
  }, [profile]);

  if (isLoading) {
    return (
      <div className="py-4 flex justify-center">
        <div className="w-5 h-5 border-2 border-[#FF5A00] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-xs text-on-surface/50 p-4 bg-on-surface/5 rounded-xl text-center">
        No specific government schemes matched based on current profile.
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Relevant Schemes</h4>
      {matches.map((m, idx) => (
        <div key={idx} className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h5 className="text-sm font-bold text-on-surface leading-tight">{m.name}</h5>
              <p className="text-[10px] text-on-surface-variant">{m.agency}</p>
            </div>
            <a href={m.officialUrl} target="_blank" rel="noreferrer" className="shrink-0 w-6 h-6 bg-[#FF5A00]/10 text-[#FF5A00] rounded flex items-center justify-center hover:bg-[#FF5A00]/20 transition-colors" title="Official Source">
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </a>
          </div>
          
          <div className="bg-[#FF5A00]/5 text-[#FF5A00] text-[11px] p-2 rounded mb-3 border border-[#FF5A00]/10 font-medium">
            <span className="material-symbols-outlined text-[12px] align-middle mr-1">tips_and_updates</span>
            {m.whyRelevant}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
            <div>
              <span className="text-on-surface/50 block">Max Project Cost</span>
              <span className="font-semibold text-on-surface">{m.maxProjectCost ? `₹${m.maxProjectCost.toLocaleString('en-IN')}` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-on-surface/50 block">Description</span>
              <span className="font-semibold text-on-surface">{m.description || 'N/A'}</span>
            </div>
          </div>

          <div className="text-[10px] mb-3">
            <span className="text-on-surface/50 block mb-1">Required Documents to prepare:</span>
            <ul className="list-disc pl-4 text-on-surface/70 space-y-0.5">
              {(m.requiredDocuments || []).map((doc: string, i: number) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </div>
          
          <div className="bg-on-surface/5 p-3 rounded-xl border border-outline-variant/5 text-[9px] text-on-surface/70">
            <p className="font-bold mb-1">Data & Sources</p>
            {m.provenance ? (
              <ul className="list-disc pl-4">
                <li><span className="font-semibold">Source:</span> {m.provenance.source}</li>
                <li><span className="font-semibold">Confidence:</span> {m.provenance.confidence}</li>
                <li><span className="font-semibold">Retrieved:</span> {new Date(m.provenance.retrievedAt).toLocaleString()}</li>
              </ul>
            ) : (
              'Source metadata unavailable.'
            )}
          </div>
          
          <div className="mt-3 pt-2 border-t border-outline-variant/5 flex items-center justify-between text-[9px] text-on-surface/40">
            <span>Subject to bank approval</span>
            <span>{m.applicationRoute}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
