/**
 * geminiAdvisor.ts — AI-powered feasibility analysis for Arthniti
 * Delegates all AI processing to the Arthniti Python backend.
 */

import type { FinancialResult, ViabilityFactor } from './financialCalculator';
import { LocationProfile, BusinessItem } from '../providers/types';

export interface FeasibilityReport {
  recommendationSummary: string;
  whyRecommended: string[];
  risks: string[];
  riskMitigations: string[];
  opportunities: string[];
  questionsForUser: string[];
  dataGaps: string[];
  confidenceExplanation: string;
  citations: {
    title: string;
    url: string;
    retrievedAt: string;
    claim: string;
  }[];
}

export interface AdvisorInput {
  profile: any;
  business: any;
  financials: any;
  schemes: any[];
}

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export type ChatResult =
  | { ok: true; response: string }
  | { ok: false; statusCode: number; message: string };

export async function generateFeasibilityReport(input: AdvisorInput): Promise<FeasibilityReport> {
  try {
    const res = await fetch(`${API_BASE}/api/ai/advisory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw new Error(`Backend AI error: ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error('Arthniti Backend AI Advisor failed:', err);
    return {
      recommendationSummary: "AI Advisory is currently unavailable.",
      whyRecommended: [],
      risks: ["System is operating in offline mode."],
      riskMitigations: [],
      opportunities: [],
      questionsForUser: [],
      dataGaps: ["Could not reach backend API."],
      confidenceExplanation: "Low confidence due to API unavailability.",
      citations: []
    };
  }
}

export async function chatWithAdvisor(
  message: string,
  fullContext?: {
    language?: string;
    location?: any;
    businessDiscoveryResults?: any[];
    selectedBusinesses?: any[];
    comparison?: any;
    financialPlan?: any;
    schemeMatches?: any[];
    sourceMetadata?: any[];
    context?: any;
  }
): Promise<ChatResult> {
  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        ...fullContext
      }),
    });

    if (!res.ok) {
      let detail = 'AI service is unavailable. Retry after the service is restored.';
      try {
        const errBody = await res.json();
        if (typeof errBody?.detail === 'string') detail = errBody.detail;
      } catch { /* ignore */ }
      return { ok: false, statusCode: res.status, message: detail };
    }

    const data = await res.json();
    return { ok: true, response: data.response };
  } catch (err) {
    console.error('Chat error:', err);
    return {
      ok: false,
      statusCode: 0,
      message: 'AI service is unavailable. Retry after the service is restored.',
    };
  }
}

export async function fetchAiHealth(): Promise<{
  status: 'connected' | 'unavailable' | 'not_configured';
  provider: string;
  safeMessage: string;
  lastCheckedAt: string;
}> {
  const res = await fetch(`${API_BASE}/api/ai/health`);
  if (!res.ok) throw new Error(`health_${res.status}`);
  const data = await res.json();
  return {
    status: data.status,
    provider: data.provider || 'gemini',
    safeMessage: data.safeMessage || data.message || '',
    lastCheckedAt: data.lastCheckedAt || '',
  };
}
