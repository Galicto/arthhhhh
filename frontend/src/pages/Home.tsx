import { useWallet } from '@txnlab/use-wallet-react'
import React, { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import ConnectWallet from '../components/ConnectWallet'
import CinematicBackground from '../components/CinematicBackground'
import { usePredX } from '../context/PredXContext'
import { ellipseAddress } from '../utils/ellipseAddress'
import { useOraclePrice } from '../hooks/useOraclePrice'
import algosdk from 'algosdk'
import { useReveal, revealClass } from '../hooks/useReveal'
import AnimatedNumber from '../components/AnimatedNumber'

const USD_TO_INR = 85.5

const Home: React.FC = () => {
  const { activeAddress } = useWallet()
  const { myPositions, markets, navigate, isBalanceHidden, toggleBalanceVisibility } = usePredX()
  const { algoPrice } = useOraclePrice()
  const [algoBalance, setAlgoBalance] = useState<number>(0)
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)

  const toggleWalletModal = () => setOpenWalletModal(!openWalletModal)

  /* ─── Scroll Reveal Hooks ─── */
  const welcomeReveal = useReveal({ delay: 0 });
  const balanceReveal = useReveal({ delay: 80 });
  const positionsReveal = useReveal({ delay: 160 });
  const wageredReveal = useReveal({ delay: 240 });
  const payoutReveal = useReveal({ delay: 320 });
  const actionsReveal = useReveal({ delay: 100 });
  const predictionsReveal = useReveal({ delay: 150 });

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

  const activePredictions = myPositions.filter(p => p.status === 'running')
  const totalWagered = myPositions.reduce((acc, pos) => acc + pos.amount, 0)
  const totalPotential = myPositions.reduce((acc, pos) => acc + (pos.status === 'running' ? pos.potential : 0), 0)
  const usdBalance = algoPrice ? (algoBalance * algoPrice) : 0
  const inrBalance = usdBalance * USD_TO_INR

  /* ─── LOGGED-OUT: Premium Login Gateway ─── */
  if (!activeAddress) {
    return (
      <DashboardLayout>
        {/* Cinematic animated background */}
        <CinematicBackground onSplineClick={toggleWalletModal} />
        
        {/* Full-screen login gateway */}
        <div className="arthniti-gateway">
          {/* Login panel */}
          <div className="arthniti-login-panel">
            {/* Brand identity */}
            <div className="arthniti-login-brand">
              <img 
                src="/logo-transparent.png" 
                alt="Arthniti" 
                className="arthniti-login-logo" 
              />
              <h1 className="arthniti-login-title">Arthniti</h1>
            </div>

            {/* Decorative separator */}
            <div className="arthniti-login-separator">
              <div className="arthniti-login-separator-line"></div>
              <div className="arthniti-login-separator-diamond"></div>
              <div className="arthniti-login-separator-line"></div>
            </div>

            {/* Tagline */}
            <p className="arthniti-login-tagline">
              Private market intelligence begins here.
            </p>

            {/* Connect CTA */}
            <button
              className="arthniti-login-cta"
              onClick={toggleWalletModal}
            >
              <span className="arthniti-login-cta-icon material-symbols-outlined">account_balance_wallet</span>
              <span>Connect Wallet</span>
            </button>

            {/* Subtle network indicator */}
            <div className="arthniti-login-network">
              <div className="arthniti-login-network-dot"></div>
              <span>Algorand TestNet</span>
            </div>
          </div>



        </div>

        <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      </DashboardLayout>
    )
  }


  /* ─── LOGGED-IN: Full Dashboard (unchanged) ─── */
  return (
    <DashboardLayout>
      <div className="px-4 md:px-8 pb-12 md:pb-8 pt-4">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="bg-on-surface/5 backdrop-blur-xl p-6 md:p-10 rounded-3xl border border-on-surface/10 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-primary/15 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
            
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-on-surface mb-2 relative z-10">
              Welcome Back.
            </h1>
            <p className="text-on-surface/60 max-w-xl text-sm md:text-base relative z-10 font-body">
              Connected as <span className="text-primary font-semibold">{ellipseAddress(activeAddress, 6)}</span>. Predict real-world events powered by the Algorand blockchain.
            </p>
          </div>
        </section>

        {/* Balance + Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* ALGO Balance */}
          <div className="bg-on-surface/5 backdrop-blur-xl p-6 rounded-2xl border border-on-surface/10 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)] group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] group-hover:bg-primary/20 transition-colors"></div>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-on-surface/50 font-body text-xs uppercase tracking-widest font-semibold">ALGO Balance</span>
              <button
                onClick={toggleBalanceVisibility}
                className="text-on-surface/30 hover:text-on-surface transition-colors bg-on-surface/5 backdrop-blur-md p-1.5 rounded-lg border border-on-surface/10"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isBalanceHidden ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <div className="text-4xl font-headline font-normal text-on-surface mt-3 relative z-10 tracking-tight">
              {isBalanceHidden ? '****' : <AnimatedNumber value={algoBalance} decimals={2} />} <span className="text-lg text-on-surface/40">ALGO</span>
            </div>
            {algoPrice && !isBalanceHidden && (
              <div className="flex items-center gap-2 mt-2 relative z-10">
                <span className="text-xs text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20 font-bold">+{((algoBalance * algoPrice) * 0.05).toFixed(2)}%</span>
                <p className="text-xs text-on-surface/40 font-body">≈ $<AnimatedNumber value={usdBalance} decimals={2} /> USD</p>
              </div>
            )}
          </div>

          <div className="bg-on-surface/5 backdrop-blur-xl p-6 rounded-2xl border border-on-surface/10 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)] group hover:border-on-surface/20 transition-colors">
            <div className="flex justify-between items-start relative z-10">
              <span className="text-on-surface/50 font-body text-xs uppercase tracking-widest font-semibold">Active Positions</span>
              <div className="bg-on-surface/5 backdrop-blur-md border border-on-surface/10 p-1.5 rounded-lg text-on-surface/40"><span className="material-symbols-outlined text-[16px]">monitoring</span></div>
            </div>
            <div className="text-4xl font-headline font-normal text-on-surface mt-3 relative z-10 tracking-tight"><AnimatedNumber value={activePredictions.length} /></div>
            <div className="text-xs text-on-surface/40 mt-2 relative z-10 font-body">Currently open positions</div>
          </div>

          <div className="bg-on-surface/5 backdrop-blur-xl p-6 rounded-2xl border border-on-surface/10 relative overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.2)] group hover:border-on-surface/20 transition-colors">
            <div className="flex justify-between items-start relative z-10">
              <span className="text-on-surface/50 font-body text-xs uppercase tracking-widest font-semibold">Total Wagered</span>
              <div className="bg-on-surface/5 backdrop-blur-md border border-on-surface/10 p-1.5 rounded-lg text-on-surface/40"><span className="material-symbols-outlined text-[16px]">account_balance_wallet</span></div>
            </div>
            <div className="text-4xl font-headline font-normal text-on-surface mt-3 relative z-10 tracking-tight"><AnimatedNumber value={totalWagered} decimals={2} /> <span className="text-lg text-on-surface/40">ALGO</span></div>
            <div className="text-xs text-on-surface/40 mt-2 relative z-10 font-body">$<AnimatedNumber value={totalWagered * (algoPrice || 0)} decimals={2} /> USD</div>
          </div>

          <div className="bg-on-surface/5 backdrop-blur-xl p-6 rounded-2xl border border-[#22C55E]/30 relative overflow-hidden shadow-[0_4px_20px_rgba(34,197,94,0.1)] group hover:border-[#22C55E]/60 transition-colors">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#22C55E]/10 blur-[40px] group-hover:bg-[#22C55E]/20 transition-colors"></div>
            <div className="flex justify-between items-start relative z-10">
              <span className="text-[#22C55E] font-body text-xs uppercase tracking-widest font-semibold">Potential Payout</span>
              <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 p-1.5 rounded-lg text-[#22C55E]"><span className="material-symbols-outlined text-[16px]">payments</span></div>
            </div>
            <div className="text-4xl font-headline font-normal text-[#22C55E] mt-3 relative z-10 tracking-tight"><AnimatedNumber value={totalPotential} decimals={2} /> <span className="text-lg opacity-50">ALGO</span></div>
            <div className="text-xs text-[#22C55E]/60 mt-2 relative z-10 font-body">If all predictions win</div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          <div 
            className="bg-gradient-to-br from-[#3B82F6]/20 to-on-surface/5 backdrop-blur-xl p-6 md:p-8 rounded-2xl flex justify-between items-center cursor-pointer group border border-[#3B82F6]/40 hover:border-[#3B82F6]/80 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all"
            onClick={() => navigate('markets')}
          >
            <div>
              <h3 className="font-headline font-bold text-on-surface text-xl md:text-2xl">Explore Markets</h3>
              <p className="text-on-surface/70 font-body text-sm mt-1">Browse live prediction markets from Polymarket</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#3B82F6] flex items-center justify-center text-on-surface shadow-[0_4px_15px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </div>
          <div 
            className="bg-on-surface/5 backdrop-blur-xl p-6 md:p-8 rounded-2xl flex justify-between items-center cursor-pointer group border border-on-surface/10 hover:border-on-surface/30 transition-all"
            onClick={() => navigate('dashboard')}
          >
            <div>
              <h3 className="font-headline font-bold text-on-surface text-xl md:text-2xl">My Portfolio</h3>
              <p className="text-on-surface/60 font-body text-sm mt-1">View detailed positions and history</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-on-surface/10 border border-on-surface/20 flex items-center justify-center text-on-surface/70 group-hover:bg-on-surface/20 group-hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </div>
        </section>

        {/* Recent Positions */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-bold text-lg md:text-xl text-on-surface">Recent Predictions</h3>
            <button 
              onClick={() => navigate('dashboard')}
              className="text-[#3B82F6] text-xs font-bold hover:text-[#60A5FA] uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              View all <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {myPositions.length > 0 ? (
            <div className="bg-on-surface/5 backdrop-blur-2xl rounded-3xl border border-on-surface/10 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              {myPositions.slice(0, 5).map((pos) => {
                const market = markets.find(m => m.id === pos.marketId)
                return (
                  <div key={pos.id} className="p-4 md:p-6 border-b border-on-surface/5 last:border-b-0 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-on-surface/5 transition-colors cursor-pointer group"
                    onClick={() => market && navigate('terminal', { marketId: market.id })}
                  >
                    <div>
                      <div className="text-xs text-on-surface/50 font-body uppercase tracking-widest font-bold mb-1">{market?.category || 'Market'}</div>
                      <div className="font-bold font-headline text-on-surface text-sm md:text-base group-hover:text-[#3B82F6] transition-colors">{market?.title || 'Unknown Market'}</div>
                    </div>
                    <div className="flex items-center gap-6 md:gap-12 text-sm bg-on-surface/10 p-3 rounded-2xl border border-on-surface/5">
                      <div>
                        <span className="text-on-surface/40 font-body text-[10px] uppercase tracking-widest block mb-1 font-bold">Position</span>
                        <span className={`font-black tracking-wider ${pos.outcome === 'YES' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>{pos.outcome}</span>
                      </div>
                      <div>
                        <span className="text-on-surface/40 font-body text-[10px] uppercase tracking-widest block mb-1 font-bold">Amount</span>
                        <span className="font-bold text-on-surface">{pos.amount} <small className="text-[10px] font-normal text-on-surface/40">ALGO</small></span>
                      </div>
                      <div className="text-right">
                        <span className="text-on-surface/40 font-body text-[10px] uppercase tracking-widest block mb-1 font-bold">Status</span>
                        <span className={`font-bold tracking-widest text-[10px] px-2 py-0.5 rounded uppercase ${
                          pos.status === 'running' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' :
                          pos.status === 'won' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                          'bg-[#EF4444]/10 text-[#EF4444]'
                        }`}>{pos.status}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-on-surface/5 backdrop-blur-xl p-16 rounded-3xl border border-on-surface/10 text-center flex flex-col items-center shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
              <div className="w-20 h-20 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] text-[#3B82F6]">analytics</span>
              </div>
              <h4 className="text-on-surface font-headline font-bold text-2xl mb-2">No Predictions Yet</h4>
              <p className="text-sm text-on-surface/60 mb-8 max-w-sm font-body leading-relaxed">Head over to Markets to start predicting on real-world events and build your portfolio.</p>
              <button 
                onClick={() => navigate('markets')}
                className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-on-surface px-8 py-3 rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all scale-100 active:scale-95 uppercase tracking-wider"
              >
                Browse Markets
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}

export default Home
