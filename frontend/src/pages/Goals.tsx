import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import GoalForm from '../components/GoalForm';

export default function Goals() {
  return (
    <DashboardLayout>
      <div className="px-4 md:px-8 pb-12 pt-6 space-y-8 relative">
        {/* Ambient glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FF6B00]/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 -right-48 w-[500px] h-[500px] bg-[#2962FF]/6 rounded-full blur-[140px]" />
          <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-[#22C55E]/5 rounded-full blur-[100px]" />
        </div>

        {/* Header */}
        <div className="flex items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] flex items-center justify-center shadow-lg shadow-[#FF6B00]/25">
                <span className="material-symbols-outlined text-on-surface text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
              </div>
              <h2 className="text-2xl font-bold font-headline text-on-surface tracking-tight">Financial Goals</h2>
            </div>
            <p className="text-sm text-on-surface/40 font-body ml-[52px]">
              Set your financial milestones and track progress towards them.
            </p>
          </div>
        </div>

        <GoalForm />
      </div>
    </DashboardLayout>
  );
}
