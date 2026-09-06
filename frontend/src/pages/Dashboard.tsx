import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useState, useCallback } from 'react'
import SendAlgo from '../components/SendAlgo'
import MintNFT from '../components/MintNFT'
import AssetOptIn from '../components/AssetOptIn'
import Bank from '../components/Bank'
import DashboardLayout from '../components/DashboardLayout'
import { usePredX } from '../context/PredXContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { useOraclePrice } from '../hooks/useOraclePrice';
import algosdk from 'algosdk';
import ReactMarkdown from 'react-markdown';
import AnimatedNumber from '../components/AnimatedNumber';
import BalanceDisplay from '../components/BalanceDisplay'
import { getCryptoPrices, type CryptoTicker } from '../lib/stockApi'
import ExpenseImpactAgent from '../components/ExpenseImpactAgent'
import { useReveal, revealClass } from '../hooks/useReveal'

const USD_TO_INR = 85.5

// ─── Gemini AI Analysis ─────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

interface NewsItem {
  title: string
  summary: string
  status: 'RELEVANT' | 'EXPLORE' | 'ACTION' | 'CAUTION'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  category: string
}

interface AIAnalysis {
  marketSummary: string
  opportunities: { asset: string; action: string; reason: string; confidence: number }[]
  riskLevel: string
  allocation: { name: string; percent: number; color: string }[]
}

interface TradePositionRow {
  key: string
  symbol: string
  assetType: 'stock' | 'crypto'
  quantity: number
  investedAlgo: number
  avgEntryInr: number
  trades: number
}

const CURATED_NEWS: NewsItem[] = [
  { title: 'NSFDC Micro Finance Scheme', summary: 'For eligible small business projects up to ₹1.40 lakh. Arthniti can estimate margin capital, loan share, and repayment readiness.', status: 'RELEVANT', category: 'Concessional Credit', priority: 'HIGH' },
  { title: 'NSFDC Term Loan Scheme', summary: 'For larger income-generating projects. Compare project cost, margin contribution, repayment tenure, and business viability before applying.', status: 'RELEVANT', category: 'Business Finance', priority: 'HIGH' },
  { title: 'PM Vishwakarma Support', summary: 'Skill, toolkit, credit, and market-linkage support may be relevant for eligible traditional artisans and craftspeople.', status: 'EXPLORE', category: 'Artisan Enterprise', priority: 'MEDIUM' },
  { title: 'Udyam Registration Readiness', summary: 'Organise enterprise details, business category, and bank information to prepare for formal MSME registration where applicable.', status: 'ACTION', category: 'Ease of Business', priority: 'MEDIUM' },
  { title: 'Digital Market Access', summary: 'Create a WhatsApp Business profile, digital catalogue, and local Maps presence to reach nearby customers.', status: 'ACTION', category: 'Market Linkage', priority: 'MEDIUM' },
  { title: 'Local Saturation Alert', summary: 'Dairy and kirana businesses show higher competition in the selected district. Compare alternatives before using credit.', status: 'CAUTION', category: 'Hyper-Local Insight', priority: 'HIGH' },
]

const Dashboard: React.FC = () => {
  const { activeAddress } = useWallet()
  const { myPositions, myTrades, markets, navigate, isBalanceHidden, toggleBalanceVisibility, themeMode } = usePredX()
  const { algoPrice } = useOraclePrice()
  const [algoBalance, setAlgoBalance] = useState<number>(0)
  const [cryptoPrices, setCryptoPrices] = useState<CryptoTicker[]>([])

  const [sendAlgoModal, setSendAlgoModal] = useState(false)
  const [mintNftModal, setMintNftModal] = useState(false)
  const [assetOptInModal, setAssetOptInModal] = useState(false)
  const [bankModal, setBankModal] = useState(false)

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  // Fetch ALGO balance
  useEffect(() => {
    if (!activeAddress) return
    const fetchBalance = async () => {
      try {
        const algodClient = new algosdk.Algodv2(
          '',
          import.meta.env.VITE_ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
          ''
        )
        const info = await algodClient.accountInformation(activeAddress).do()
        setAlgoBalance(Number(info.amount) / 1_000_000)
      } catch (err) {
        console.error('Failed to fetch balance:', err)
      }
    }
    fetchBalance()
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [activeAddress])

  // Fetch crypto prices for overview
  useEffect(() => {
    const fetch_ = async () => {
      const prices = await getCryptoPrices()
      setCryptoPrices(prices)
    }
    fetch_()
    const id = setInterval(fetch_, 30000)
    return () => clearInterval(id)
  }, [])

  const activePredictionsCount = myPositions.filter(p => p.status === 'running').length
  const activeTradesCount = myTrades.length
  const totalActivePositions = activePredictionsCount + activeTradesCount

  const totalWagered = myPositions.reduce((acc, pos) => acc + pos.amount, 0) + myTrades.reduce((acc, t) => acc + t.algoAmount, 0)
  const totalPotential = myPositions.reduce((acc, pos) => acc + (pos.status === 'running' ? pos.potential : 0), 0)
  const usdBalance = algoPrice ? (algoBalance * algoPrice) : 0
  const inrBalance = usdBalance * USD_TO_INR

  const tradePositions = myTrades.reduce<Record<string, TradePositionRow>>((acc, trade) => {
    const key = `${trade.assetType}:${trade.symbol}`
    const entry = acc[key] ?? {
      key,
      symbol: trade.symbol,
      assetType: trade.assetType,
      quantity: 0,
      investedAlgo: 0,
      avgEntryInr: 0,
      trades: 0,
    }

    if (trade.side === 'buy') {
      entry.quantity += trade.quantity
      entry.investedAlgo += trade.algoAmount
      entry.avgEntryInr = entry.quantity > 0
        ? ((entry.avgEntryInr * (entry.quantity - trade.quantity)) + (trade.priceAtTradeINR * trade.quantity)) / entry.quantity
        : 0
    } else {
      entry.quantity -= trade.quantity
      entry.investedAlgo = Math.max(0, entry.investedAlgo - trade.algoAmount)
    }

    entry.trades += 1
    acc[key] = entry
    return acc
  }, {})

  const activeTradePositions = Object.values(tradePositions)
    .filter((position) => position.quantity > 0)
    .sort((a, b) => b.investedAlgo - a.investedAlgo)

  // ─── Arthniti Rural Enterprise Advisor Analysis ───────────────────────────────
  const runAIAnalysis = useCallback(async () => {
    setAiLoading(true)
    setAiError(null)

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Randomize scores slightly to simulate "refreshing" analysis
    const randomOffset = () => Math.floor(Math.random() * 5) - 2

    const analysis: AIAnalysis = {
      marketSummary: "Based on your selected district, local competition signals, and scheme-ready financial profile, Arthniti has identified priority enterprise opportunities. Focus on businesses with manageable repayment risk, clear local demand, and lower market saturation.",
      opportunities: [
        { asset: 'Agricultural Equipment Rental', action: 'RECOMMENDED', reason: 'Low local competition and strong demand from turmeric, paddy, and sugarcane activity.', confidence: 83 + randomOffset() },
        { asset: 'Tailoring & Garment Unit', action: 'VIABLE', reason: 'Stable local demand; start with low inventory and focus on school uniforms and alterations.', confidence: 76 + randomOffset() },
        { asset: 'Dairy & Milk Products', action: 'CAUTION', reason: 'Reliable demand, but high local competition and daily operating costs require careful planning.', confidence: 64 + randomOffset() },
        { asset: 'Grocery / Kirana Store', action: 'SATURATED', reason: 'High competition in the selected area; differentiate through delivery, digital payments, or essentials bundles.', confidence: 58 + randomOffset() }
      ],
      riskLevel: "Moderate Opportunity",
      allocation: [
        { name: 'Credit Component', percent: 60, color: '#8B5CF6' },
        { name: 'Applicant Margin', percent: 10, color: '#00FFA3' },
        { name: 'Working Capital', percent: 20, color: '#3B82F6' },
        { name: 'Emergency Buffer', percent: 10, color: '#F59E0B' }
      ]
    }
    setAiAnalysis(analysis)
    setAiLoading(false)
  }, [])

  // Auto-run analysis when data is ready
  useEffect(() => {
    if (cryptoPrices.length > 0 && !aiAnalysis && !aiLoading) {
      runAIAnalysis()
    }
  }, [cryptoPrices, aiAnalysis, aiLoading, runAIAnalysis])

  const sentimentBadge = (s: string) => {
    if (s === 'bullish') return 'bg-emerald-500/15 text-emerald-400'
    if (s === 'bearish') return 'bg-red-500/15 text-red-400'
    return 'bg-amber-500/15 text-amber-400'
  }

  const impactBadge = (i: string) => {
    if (i === 'high') return 'bg-red-500/10 text-red-400'
    if (i === 'medium') return 'bg-amber-500/10 text-amber-400'
    return 'bg-surface-container-highest text-on-surface-variant'
  }

  // ─── Scroll Reveal Hooks ────────────────────────────────────
  const headerReveal = useReveal({ delay: 0 });
  const stat0 = useReveal({ delay: 80 });
  const stat1 = useReveal({ delay: 160 });
  const stat2 = useReveal({ delay: 240 });
  const stat3 = useReveal({ delay: 320 });
  const aiPanelReveal = useReveal({ delay: 100 });
  const newsPanelReveal = useReveal({ delay: 200 });
  const cryptoReveal = useReveal({ delay: 100 });
  const opsReveal = useReveal({ delay: 50 });
  const op0 = useReveal({ delay: 100 });
  const op1 = useReveal({ delay: 180 });
  const op2 = useReveal({ delay: 260 });
  const op3 = useReveal({ delay: 340 });
  const positionsReveal = useReveal({ delay: 100 });
  const tradesTableReveal = useReveal({ delay: 150 });
  const predsTableReveal = useReveal({ delay: 250 });

  if (!activeAddress) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-6">account_balance_wallet</span>
          <h2 className="font-headline font-black text-2xl mb-2 text-on-surface">Connect Your Wallet</h2>
          <p className="text-sm text-on-surface-variant text-center max-w-md">
            Connect your Pera Wallet to view your portfolio dashboard, ALGO balance, and active market positions.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-4 md:px-8 pb-12 md:pb-8 pt-4">
        {/* Portfolio Header */}
        <section ref={headerReveal.ref} className={`mb-8 ${revealClass(headerReveal.isVisible, 'scale')}`}>
          <div className="bg-gradient-to-r from-surface-container-high to-surface-container/50 p-6 md:p-10 rounded-2xl border border-[#06B6D4]/15 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-[#06B6D4]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute left-0 bottom-0 w-48 h-48 bg-[#8B5CF6]/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <p className="text-on-surface-variant text-xs font-label uppercase tracking-widest mb-2">Portfolio Balance</p>
                <h1 className="text-4xl md:text-5xl font-headline font-black text-on-surface leading-tight">
                  <BalanceDisplay value={algoBalance} decimals={2} showIcon />
                  <span className="text-primary text-lg ml-2">ALGO</span>
                </h1>
                {algoPrice && !isBalanceHidden && (
                  <div className="flex flex-wrap gap-4 mt-2">
                    <p className="text-on-surface-variant text-sm">≈ <span className="text-[#3B82F6] font-semibold">$<AnimatedNumber value={usdBalance} decimals={2} /></span> <span className="text-xs opacity-60">USD</span></p>
                    <p className="text-on-surface-variant text-sm">≈ <span className="text-[#22C55E] font-semibold">₹<AnimatedNumber value={inrBalance} decimals={2} /></span> <span className="text-xs opacity-60">INR</span></p>
                  </div>
                )}
              </div>
              <div className="text-left md:text-right">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">Wallet</p>
                <p className="font-mono text-sm text-on-surface">{ellipseAddress(activeAddress, 8)}</p>
                <p className="text-[10px] text-[#8B5CF6] font-bold mt-1 uppercase tracking-widest">Algorand TestNet</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* ALGO Balance - Cyan/Teal */}
          <div ref={stat0.ref} className={`bg-surface-container p-6 rounded-xl border border-[#06B6D4]/15 relative overflow-hidden group hover:border-primary/30 transition-all ${revealClass(stat0.isVisible, 'up')}`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#06B6D4]/8 blur-2xl group-hover:bg-[#06B6D4]/12 transition-all"></div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              <span className="text-primary font-label text-[10px] uppercase tracking-widest">ALGO Balance</span>
            </div>
            <div className="text-2xl font-headline font-black text-on-surface mt-1">
              <BalanceDisplay value={algoBalance} decimals={4} />
            </div>
            {algoPrice && !isBalanceHidden && (
              <p className="text-[10px] text-on-surface-variant mt-0.5">₹{inrBalance.toFixed(2)} INR</p>
            )}
          </div>
          {/* Active Positions - Violet */}
          <div ref={stat1.ref} className={`bg-surface-container p-6 rounded-xl border border-[#8B5CF6]/10 relative overflow-hidden group hover:border-[#8B5CF6]/25 transition-all ${revealClass(stat1.isVisible, 'up')}`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#8B5CF6]/6 blur-2xl"></div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#8B5CF6] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>show_chart</span>
              <span className="text-[#8B5CF6] font-label text-[10px] uppercase tracking-widest">Active Positions</span>
            </div>
            <div className="text-2xl font-headline font-black text-on-surface mt-1"><AnimatedNumber value={totalActivePositions} /></div>
          </div>
          {/* Total Wagered - Amber */}
          <div ref={stat2.ref} className={`bg-surface-container p-6 rounded-xl border border-[#F59E0B]/10 relative overflow-hidden group hover:border-[#F59E0B]/25 transition-all ${revealClass(stat2.isVisible, 'up')}`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#F59E0B]/6 blur-2xl"></div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#F59E0B] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="text-[#F59E0B] font-label text-[10px] uppercase tracking-widest">Total Wagered</span>
            </div>
            <div className="text-2xl font-headline font-black text-on-surface mt-1"><AnimatedNumber value={totalWagered} decimals={2} /> <span className="text-xs opacity-50">ALGO</span></div>
          </div>
          {/* Potential Payout - Emerald */}
          <div ref={stat3.ref} className={`bg-surface-container p-6 rounded-xl border border-[#00FFA3]/10 relative overflow-hidden group hover:border-[#00FFA3]/25 transition-all ${revealClass(stat3.isVisible, 'up')}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFA3]/6 blur-xl"></div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[#00FFA3] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <span className="text-[#00FFA3] font-label text-[10px] uppercase tracking-widest">Potential Payout</span>
            </div>
            <div className="text-2xl font-headline font-black text-[#00FFA3] mt-1"><AnimatedNumber value={totalPotential} decimals={2} /> <span className="text-xs opacity-50">ALGO</span></div>
          </div>
        </section>

        {/* ─── NEW: AI Analysis + News Grid ───────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* ── AI Analyzer Panel ──────────────────────────── */}
          <div ref={aiPanelReveal.ref} className={`lg:col-span-5 space-y-6 ${revealClass(aiPanelReveal.isVisible, 'left')}`}>
            <div className="bg-surface-container rounded-xl border border-outline-variant/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-outline-variant/10 bg-gradient-to-r from-purple-500/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Arthniti Rural Enterprise Advisor</h3>
                    <p className="text-[10px] text-purple-400 font-bold">Hyper-Local Opportunity Engine</p>
                  </div>
                </div>
                <button
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1"
                  onClick={runAIAnalysis}
                  disabled={aiLoading}
                >
                  <span className={`material-symbols-outlined text-[14px] ${aiLoading ? 'animate-spin' : ''}`}>{aiLoading ? 'progress_activity' : 'refresh'}</span>
                  {aiLoading ? 'Analyzing...' : 'Refresh'}
                </button>
              </div>

              <div className="p-5 space-y-4">
                {aiLoading && !aiAnalysis ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="w-10 h-10 border-3 border-purple-400 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm text-on-surface-variant">Analyzing market conditions...</p>
                  </div>
                ) : aiAnalysis ? (
                  <>
                    {/* Market Summary */}
                    <div className="bg-surface-container-highest/30 rounded-lg p-4">
                      <p className="text-sm text-on-surface leading-relaxed">{aiAnalysis.marketSummary}</p>
                    </div>

                    {/* Opportunities */}
                    <div>
                      <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">PRIORITY ENTERPRISE OPPORTUNITIES</h4>
                      <div className="space-y-2">
                        {aiAnalysis.opportunities.map((opp, i) => (
                          <div key={i} className="flex items-center justify-between bg-surface-container-highest/20 rounded-lg px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-on-surface">{opp.asset}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                opp.action === 'RECOMMENDED' ? 'bg-emerald-500/15 text-emerald-400' :
                                opp.action === 'CAUTION' ? 'bg-amber-500/15 text-amber-400' :
                                opp.action === 'SATURATED' ? 'bg-red-500/15 text-red-400' :
                                'bg-blue-500/15 text-blue-400'
                              }`}>{opp.action}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-on-surface-variant hidden md:inline">{opp.reason}</span>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black"
                                style={{
                                  background: `conic-gradient(${opp.confidence >= 80 ? '#00FFA3' : opp.confidence >= 60 ? '#F59E0B' : '#EF4444'} ${opp.confidence}%, transparent 0%)`,
                                }}>
                                <span className="bg-surface-container rounded-full w-6 h-6 flex items-center justify-center text-on-surface">
                                  {opp.confidence}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk Level */}
                    <div className="flex items-center justify-between bg-surface-container-highest/20 rounded-lg px-3 py-2.5">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">LOCAL BUSINESS OUTLOOK</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400`}>{aiAnalysis.riskLevel}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* ── Resource Allocator ──────────────────────── */}
            {aiAnalysis && (
              <div className="bg-surface-container rounded-xl border border-outline-variant/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>donut_large</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">AI Resource Allocator</h3>
                    <p className="text-[10px] text-on-surface-variant">Suggested portfolio allocation</p>
                  </div>
                </div>
                <div className="p-5">
                  {/* Donut Chart with CSS */}
                  <div className="flex items-center justify-center mb-5">
                    <div className="relative w-36 h-36">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        {(() => {
                          let cumulative = 0
                          return aiAnalysis.allocation.map((item, i) => {
                            const offset = cumulative
                            cumulative += item.percent
                            return (
                              <circle
                                key={i}
                                cx="18" cy="18" r="14"
                                fill="none"
                                stroke={item.color}
                                strokeWidth="4"
                                strokeDasharray={`${item.percent * 0.88} ${88 - item.percent * 0.88}`}
                                strokeDashoffset={`${-offset * 0.88}`}
                                strokeLinecap="round"
                                className="transition-all duration-700"
                              />
                            )
                          })
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black font-headline text-on-surface">100%</span>
                        <span className="text-[9px] text-on-surface-variant">Allocated</span>
                      </div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="space-y-2">
                    {aiAnalysis.allocation.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-semibold text-on-surface">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant">{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── News, Opportunities & Agents ───────────────────────── */}
          <div ref={newsPanelReveal.ref} className={`lg:col-span-7 space-y-6 flex flex-col ${revealClass(newsPanelReveal.isVisible, 'right')}`}>
            <div className="shrink-0">
              <ExpenseImpactAgent />
            </div>
            
            <div className="bg-surface-container rounded-xl border border-outline-variant/10 overflow-hidden flex-1 flex flex-col">
              <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>newspaper</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Schemes, Support & Business Opportunities</h3>
                    <p className="text-[10px] text-on-surface-variant">Curated guidance for rural entrepreneurs</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Updated Guidance
                </div>
              </div>
              <div className="divide-y divide-outline-variant/5 overflow-y-auto custom-scrollbar flex-1 lg:max-h-[360px]">
                {CURATED_NEWS.map((news, i) => (
                  <div key={i} className="px-5 py-4 hover:bg-surface-container-highest/10 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-bold text-on-surface leading-snug flex-1">{news.title}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          news.status === 'RELEVANT' || news.status === 'ACTION' ? 'bg-emerald-500/15 text-emerald-400' :
                          news.status === 'CAUTION' ? 'bg-red-500/15 text-red-400' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>
                          {news.status}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant`}>
                          {news.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-2">{news.summary}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">{news.category}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-outline-variant/10 text-[9px] text-on-surface-variant text-center bg-surface-container-low/50">
                Scheme information is advisory and based on curated rules. Verify current eligibility and terms with the relevant SCA, bank, or official portal.
              </div>
            </div>
          </div>
        </section>

        {/* ── Live Crypto Ticker ──────────────────────────── */}
        {cryptoPrices.length > 0 && (
          <section ref={cryptoReveal.ref} className={`mb-8 ${revealClass(cryptoReveal.isVisible, 'up')}`}>
            <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
              Live Market Prices
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {cryptoPrices.slice(0, 6).map(c => (
                <div
                  key={c.symbol}
                  className="bg-surface-container p-4 rounded-xl border border-outline-variant/5 hover:border-primary-container/20 transition-all cursor-pointer"
                  onClick={() => navigate('trade', { symbol: c.symbol, assetType: 'crypto' })}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black text-on-surface">{c.displaySymbol}</span>
                    <span className={`text-[9px] font-bold ${c.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {c.priceChangePercent >= 0 ? '+' : ''}{c.priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-lg font-headline font-black text-on-surface">
                    ${c.lastPrice >= 1000 ? c.lastPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : c.lastPrice.toFixed(c.lastPrice >= 1 ? 2 : 4)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Operations Grid */}
        <section className="mb-8">
          <h3 ref={opsReveal.ref} className={`font-headline font-bold text-lg md:text-xl mb-6 ${revealClass(opsReveal.isVisible, 'fade')}`}>Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div ref={op0.ref} className={`bg-surface-container-high p-6 rounded-xl border border-outline-variant/5 cursor-pointer hover:border-[#3B82F6]/30 transition-all group ${revealClass(op0.isVisible, 'up')}`} onClick={() => setSendAlgoModal(true)}>
              <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-full flex items-center justify-center text-[#3B82F6] mb-4">
                <span className="material-symbols-outlined">send</span>
              </div>
              <h4 className="font-bold text-on-surface text-sm group-hover:text-[#3B82F6] transition-colors">Send ALGO</h4>
              <p className="text-[10px] text-on-surface-variant mt-1">Transfer ALGO to any address</p>
            </div>
            <div ref={op1.ref} className={`bg-surface-container-high p-6 rounded-xl border border-outline-variant/5 cursor-pointer hover:border-[#8B5CF6]/30 transition-all group ${revealClass(op1.isVisible, 'up')}`} onClick={() => setMintNftModal(true)}>
              <div className="w-10 h-10 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center text-[#8B5CF6] mb-4">
                <span className="material-symbols-outlined">palette</span>
              </div>
              <h4 className="font-bold text-on-surface text-sm group-hover:text-[#8B5CF6] transition-colors">Mint NFT</h4>
              <p className="text-[10px] text-on-surface-variant mt-1">Create ARC-3 NFTs</p>
            </div>
            <div ref={op2.ref} className={`bg-surface-container-high p-6 rounded-xl border border-outline-variant/5 cursor-pointer hover:border-primary/30 transition-all group ${revealClass(op2.isVisible, 'up')}`} onClick={() => setAssetOptInModal(true)}>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined">add_circle</span>
              </div>
              <h4 className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">Asset Opt-In</h4>
              <p className="text-[10px] text-on-surface-variant mt-1">Opt-in to receive any ASA</p>
            </div>
            <div ref={op3.ref} className={`bg-surface-container-high p-6 rounded-xl border border-outline-variant/5 cursor-pointer hover:border-[#22C55E]/30 transition-all group ${revealClass(op3.isVisible, 'up')}`} onClick={() => setBankModal(true)}>
              <div className="w-10 h-10 bg-[#22C55E]/10 rounded-full flex items-center justify-center text-[#22C55E] mb-4">
                <span className="material-symbols-outlined">account_balance</span>
              </div>
              <h4 className="font-bold text-on-surface text-sm group-hover:text-[#22C55E] transition-colors">Bank Contract</h4>
              <p className="text-[10px] text-on-surface-variant mt-1">Deposit & Withdraw</p>
            </div>
          </div>
        </section>

        {/* Positions Section */}
        <section ref={positionsReveal.ref} className={revealClass(positionsReveal.isVisible, 'fade')}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-bold text-lg md:text-xl">My Positions</h3>
            <button onClick={() => navigate('markets')} className="text-primary-container text-xs font-bold hover:underline">
              Explore Markets &rarr;
            </button>
          </div>

          <div className="space-y-6">
            <div ref={tradesTableReveal.ref} className={`bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden ${revealClass(tradesTableReveal.isVisible, 'up')}`}>
              <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container-highest/20 flex items-center justify-between">
                <h4 className="font-headline font-bold text-sm md:text-base">Trade Positions</h4>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  {activeTradePositions.length} active
                </span>
              </div>

              {activeTradePositions.length > 0 ? (
                <>
                  <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    <div className="col-span-3">Asset</div>
                    <div className="col-span-2 text-center">Type</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-center">Invested</div>
                    <div className="col-span-2 text-center">Avg Entry</div>
                    <div className="col-span-1 text-center">Trades</div>
                  </div>

                  {activeTradePositions.map((position) => (
                    <div
                      key={position.key}
                      className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-outline-variant/5 last:border-b-0 hover:bg-surface-container-highest/10 transition-colors cursor-pointer items-center"
                      onClick={() => navigate('trade', { symbol: position.assetType === 'crypto' ? `${position.symbol}USDT` : position.symbol, assetType: position.assetType })}
                    >
                      <div className="md:col-span-3">
                        <p className="font-bold text-sm text-on-surface line-clamp-1">{position.symbol}</p>
                        <p className="text-[10px] text-on-surface-variant">Tracked investment position</p>
                      </div>
                      <div className="md:col-span-2 md:text-center">
                        <span className={`font-bold text-[10px] px-2 py-0.5 rounded uppercase ${
                          position.assetType === 'crypto' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {position.assetType}
                        </span>
                      </div>
                      <div className="md:col-span-2 md:text-center">
                        <span className="font-bold text-sm">{position.quantity.toFixed(position.assetType === 'crypto' ? 6 : 2)}</span>
                      </div>
                      <div className="md:col-span-2 md:text-center">
                        <span className="font-bold text-sm text-primary-container">{position.investedAlgo.toFixed(2)} <span className="text-xs opacity-50">ALGO</span></span>
                      </div>
                      <div className="md:col-span-2 md:text-center">
                        <span className="font-bold text-sm">₹{position.avgEntryInr.toFixed(2)}</span>
                      </div>
                      <div className="md:col-span-1 md:text-center">
                        <span className="font-bold text-[11px] text-on-surface-variant">{position.trades}</span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">candlestick_chart</span>
                  <p className="text-sm text-on-surface-variant">No trade positions yet.</p>
                </div>
              )}
            </div>

            <div ref={predsTableReveal.ref} className={`bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden ${revealClass(predsTableReveal.isVisible, 'up')}`}>
              <div className="px-6 py-4 border-b border-outline-variant/10 bg-surface-container-highest/20 flex items-center justify-between">
                <h4 className="font-headline font-bold text-sm md:text-base">Prediction Positions</h4>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  {myPositions.length} active
                </span>
              </div>

              {myPositions.length > 0 ? (
                <>
                  <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/10">
                    <div className="col-span-5">Market</div>
                    <div className="col-span-2 text-center">Position</div>
                    <div className="col-span-2 text-center">Amount</div>
                    <div className="col-span-2 text-center">Potential</div>
                    <div className="col-span-1 text-center">Status</div>
                  </div>
                  {myPositions.map((pos) => {
                    const market = markets.find(m => m.id === pos.marketId)
                    return (
                      <div 
                        key={pos.id} 
                        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-outline-variant/5 last:border-b-0 hover:bg-surface-container-highest/10 transition-colors cursor-pointer items-center"
                        onClick={() => market && navigate('terminal', { marketId: market.id })}
                      >
                        <div className="md:col-span-5">
                          <p className="font-bold text-sm text-on-surface line-clamp-1">{market?.title || 'Unknown Market'}</p>
                          <p className="text-[10px] text-on-surface-variant">{market?.category || ''}</p>
                        </div>
                        <div className="md:col-span-2 md:text-center">
                          <span className={`font-bold text-sm ${pos.outcome === 'YES' ? 'text-[#00FFA3]' : 'text-[#FF4040]'}`}>{pos.outcome}</span>
                        </div>
                        <div className="md:col-span-2 md:text-center">
                          <span className="font-bold text-sm">{pos.amount} <span className="text-xs opacity-50">ALGO</span></span>
                        </div>
                        <div className="md:col-span-2 md:text-center">
                          <span className="font-bold text-sm text-primary-container">{pos.potential.toFixed(2)} <span className="text-xs opacity-50">ALGO</span></span>
                        </div>
                        <div className="md:col-span-1 md:text-center">
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded uppercase ${
                            pos.status === 'running' ? 'bg-primary-container/10 text-primary-container' :
                            pos.status === 'won' ? 'bg-green-500/10 text-green-400' :
                            'bg-error/10 text-error'
                          }`}>{pos.status}</span>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-2">analytics</span>
                  <p className="text-sm text-on-surface-variant">No prediction positions yet.</p>
                </div>
              )}
            </div>
          </div>

          {myPositions.length === 0 && activeTradePositions.length === 0 && (
            <div className="bg-surface-container-low p-12 rounded-xl border border-outline-variant/10 text-center flex flex-col items-center mt-6">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-4">analytics</span>
              <h4 className="text-on-surface font-headline font-bold mb-2">No Active Positions</h4>
              <p className="text-sm text-on-surface-variant mb-6 max-w-sm">You haven't placed any trades or predictions yet.</p>
              <button
                onClick={() => navigate('markets')}
                className="bg-primary-container text-on-primary px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-[0_0_15px_rgba(0,255,163,0.3)] transition-all"
              >
                View All Markets
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      <SendAlgo openModal={sendAlgoModal} closeModal={() => setSendAlgoModal(false)} />
      <MintNFT openModal={mintNftModal} closeModal={() => setMintNftModal(false)} />
      <AssetOptIn openModal={assetOptInModal} closeModal={() => setAssetOptInModal(false)} />
      <Bank openModal={bankModal} closeModal={() => setBankModal(false)} />
    </DashboardLayout>
  )
}

export default Dashboard
