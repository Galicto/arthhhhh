import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Income from './Income';
import Expenses from './Expenses';
import Investments from './Investments';
import Debt from './Debt';

type Tab = 'income' | 'expenses' | 'investments' | 'debt';

export default function WealthOverview() {
  const [activeTab, setActiveTab] = useState<Tab>('income');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'income', label: 'Income', icon: 'trending_up' },
    { id: 'expenses', label: 'Expenses', icon: 'trending_down' },
    { id: 'investments', label: 'Investments', icon: 'account_balance' },
    { id: 'debt', label: 'Debt', icon: 'credit_card' },
  ];

  return (
    <DashboardLayout>
      <div className="px-4 md:px-8 pb-12 pt-6">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-headline text-on-surface tracking-tight">Wealth Hub</h2>
          <p className="text-sm text-on-surface/40 font-body mt-0.5">
            Manage your complete financial picture across income, expenses, investments, and debt.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-on-surface/10 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id
                ? 'bg-[#2962FF] text-on-surface shadow-md shadow-[#2962FF]/20'
                : 'bg-on-surface/5 backdrop-blur-xl border border-on-surface/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] text-on-surface/60 font-body hover:text-on-surface/80 hover:border-[#3a4a5f]'
                }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'income' && <Income />}
          {activeTab === 'expenses' && <Expenses />}
          {activeTab === 'investments' && <Investments />}
          {activeTab === 'debt' && <Debt />}
        </div>
      </div>
    </DashboardLayout>
  );
}
