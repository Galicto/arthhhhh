import React from 'react';
import DonutChart from '../components/DonutChart';
import { useWealthData, ALGO_TO_INR } from '../hooks/useWealthData';
import AnimatedNumber from '../components/AnimatedNumber';

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const TYPE_ICON: Record<string, string> = {
  Predictions: 'casino', Trading: 'candlestick_chart', Balance: 'account_balance_wallet',
};
const TYPE_COLOR: Record<string, string> = {
  Predictions: '#22C55E', Trading: '#8B5CF6', Balance: '#06B6D4',
};

export default function Income() {
  const {
    activeAddress, algoBalance, inrBalance, balanceLoading,
    totalWonINR, wonPositions,
    myTrades, totalSellAlgo, netTradeAlgo,
  } = useWealthData();

  const tradeIncomeINR = totalSellAlgo * ALGO_TO_INR;
  const totalIncomeINR = inrBalance + totalWonINR + tradeIncomeINR;

  const sourceSegments = [
    { label: `Wallet Balance (${algoBalance.toFixed(2)} ALGO)`, value: inrBalance, color: '#06B6D4' },
    { label: `Won Predictions (${wonPositions.length})`, value: totalWonINR, color: '#22C55E' },
    { label: `Trade Sales (${totalSellAlgo.toFixed(2)} ALGO)`, value: tradeIncomeINR, color: '#8B5CF6' },
  ].filter(s => s.value > 0);

  const statCards = [
    { label: 'Wallet (INR)', val: inrBalance, color: 'text-primary', icon: 'account_balance_wallet', sub: `${algoBalance.toFixed(2)} ALGO` },
    { label: 'Won Predictions', val: totalWonINR, color: 'text-[#22C55E]', icon: 'casino', sub: `${wonPositions.length} wins` },
    { label: 'Trade Revenue', val: tradeIncomeINR, color: 'text-[#8B5CF6]', icon: 'candlestick_chart', sub: `${totalSellAlgo.toFixed(2)} ALGO sold` },
    { label: 'Net Trade P&L', val: netTradeAlgo * ALGO_TO_INR, color: netTradeAlgo >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]', icon: netTradeAlgo >= 0 ? 'trending_up' : 'trending_down', sub: `${netTradeAlgo.toFixed(3)} ALGO net` },
  ];

  return (
    <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#06B6D4] to-[#3B82F6] flex items-center justify-center text-on-surface shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <span className="material-symbols-outlined text-[24px]">payments</span>
          </div>
          <div>
            <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight">Income Sources</h2>
            <p className="text-sm text-on-surface/50 font-body mt-1">
              {activeAddress
                ? `Pera Wallet · 1 ALGO = ₹${ALGO_TO_INR.toLocaleString()} INR (fixed rate)`
                : 'Connect your Pera Wallet to see income data.'}
            </p>
          </div>
        </div>

        {!activeAddress ? (
          <div className="bg-on-surface/5 backdrop-blur-xl border border-on-surface/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-600">account_balance_wallet</span>
            <p className="text-on-surface/60 font-body mt-3 font-medium">No wallet connected</p>
            <p className="text-sm text-on-surface/40 font-body mt-1">Connect your Pera Wallet to see income data.</p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map(({ label, val, color, icon, sub }) => (
                <div key={label} className="bg-on-surface/5 backdrop-blur-2xl border border-on-surface/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-3xl p-6 relative overflow-hidden group hover:border-on-surface/20 transition-colors">
                  <div className="absolute -top-10 -right-10 w-32 h-32 opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-700" style={{ background: color.replace('text-', '') }} />
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-on-surface/50 font-body font-bold uppercase tracking-widest">{label}</p>
                    <div className="bg-on-surface/5 p-2 rounded-xl border border-on-surface/5">
                      <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
                    </div>
                  </div>
                  <p className={`text-3xl font-black font-headline tracking-tight ${color}`}>
                    {balanceLoading && label === 'Wallet (INR)' ? '…' : (
                      <AnimatedNumber value={val} format={inr} />
                    )}
                  </p>
                  {sub && <p className="text-sm text-on-surface/40 font-body mt-2">{sub}</p>}
                </div>
              ))}
            </div>

            {/* Donut */}
            <div className="bg-on-surface/5 backdrop-blur-2xl border border-on-surface/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-3xl p-8">
              <h3 className="text-lg font-black font-headline text-on-surface tracking-tight mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#3B82F6]">pie_chart</span>
                Income by Source (Donut)
              </h3>
              {sourceSegments.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
                  <div className="w-48 h-48 mx-auto xl:mx-0">
                    <DonutChart
                      segments={sourceSegments}
                      centerLabel="Total Wealth"
                      centerValue={inr(totalIncomeINR)}
                      valueFormatter={inr}
                      showLegend={false}
                    />
                  </div>
                  <div className="space-y-4">
                    {sourceSegments.map(s => {
                      const pct = totalIncomeINR > 0 ? (s.value / totalIncomeINR) * 100 : 0;
                      const key = s.label.split(' (')[0].split(' ')[0];
                      return (
                        <div key={s.label} className="flex items-center gap-4">
                          <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                            <span className="material-symbols-outlined text-[20px]" style={{ color: s.color }}>{TYPE_ICON[key] ?? 'payments'}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-on-surface/70 font-medium truncate">{s.label}</span>
                              <div className="text-right ml-2 flex items-center gap-3">
                                <p className="text-xs text-on-surface/40 font-body bg-on-surface/5 px-2 py-0.5 rounded border border-on-surface/10">{pct.toFixed(0)}%</p>
                                <span className="text-lg font-bold font-headline text-on-surface tracking-tight">{inr(s.value)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface/40 font-body text-center py-12 bg-on-surface/5 rounded-2xl border border-on-surface/5">No income data yet. Make predictions or trades to get started.</p>
              )}
            </div>

            {/* Rate Card */}
            <div className="bg-gradient-to-r from-[#3B82F6]/10 to-transparent border border-[#3B82F6]/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#3B82F6]">currency_rupee</span>
                <h3 className="font-bold font-headline text-on-surface tracking-tight">Valuation Rate</h3>
              </div>
              <p className="text-sm text-on-surface/60 font-body">
                All ALGO values are converted at <span className="font-bold text-[#3B82F6]">₹{ALGO_TO_INR.toLocaleString('en-IN')} per 1 ALGO</span> (fixed rate).
                This is a fixed conversion used for financial planning purposes only.
              </p>
            </div>

            {/* Recent income credits — trade sells */}
            {myTrades.filter(t => t.side === 'sell').length > 0 && (
              <div className="bg-on-surface/5 backdrop-blur-xl border border-on-surface/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] rounded-xl overflow-hidden">
                <div className="p-5 border-b border-on-surface/10 flex items-center justify-between">
                  <h3 className="font-bold font-headline text-on-surface tracking-tight">Recent Trade Sales (Revenue)</h3>
                  <span className="text-xs text-on-surface/40 font-body">{myTrades.filter(t => t.side === 'sell').length} total</span>
                </div>
                <div className="overflow-y-auto max-h-72 divide-y divide-white/10">
                  {myTrades.filter(t => t.side === 'sell').slice(0, 10).map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-[#1F2630] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
                          <span className="material-symbols-outlined text-[20px] text-[#8B5CF6]">candlestick_chart</span>
                        </div>
                        <div>
                          <p className="text-sm text-on-surface/80 font-medium">{t.symbol}</p>
                          <p className="text-xs text-on-surface/40 font-body uppercase tracking-wider mt-0.5">Sell · {t.assetType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black font-headline tracking-tight text-[#8B5CF6]">+{t.algoAmount.toFixed(2)} ALGO</span>
                        <p className="text-xs text-on-surface/40 font-body mt-0.5">{inr(t.algoAmount * ALGO_TO_INR)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
  );
}
