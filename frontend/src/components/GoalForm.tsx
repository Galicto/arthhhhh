import { useState, useEffect } from 'react';
import type { FinancialGoal } from '../types/wealthTypes';
import GoalAgentPlan from './GoalAgentPlan';

const GOALS_KEY = 'predx-finance-goals';

function loadGoals(): FinancialGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGoals(goals: FinancialGoal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

const categories: { value: FinancialGoal['category']; label: string; icon: string }[] = [
  { value: 'retirement',     label: 'Retirement',     icon: '🏖️' },
  { value: 'home',           label: 'Home Purchase',  icon: '🏠' },
  { value: 'education',      label: 'Education',      icon: '🎓' },
  { value: 'emergency_fund', label: 'Emergency Fund', icon: '🛡️' },
  { value: 'vehicle',        label: 'Vehicle',        icon: '🚗' },
  { value: 'travel',         label: 'Travel',         icon: '✈️' },
  { value: 'wedding',        label: 'Wedding',        icon: '💍' },
  { value: 'other',          label: 'Other',          icon: '🎯' },
];

const priorities: { value: FinancialGoal['priority']; label: string; color: string; glow: string; border: string }[] = [
  { value: 'high',   label: 'High',   color: '#EF4444', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]', border: 'border-[#EF4444]/40' },
  { value: 'medium', label: 'Medium', color: '#F59E0B', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]', border: 'border-[#F59E0B]/40' },
  { value: 'low',    label: 'Low',    color: '#22C55E', glow: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]', border: 'border-[#22C55E]/40' },
];

const defaultForm = {
  title: '',
  category: 'other' as FinancialGoal['category'],
  targetAmount: '',
  currentSavings: '',
  targetDate: '',
  priority: 'medium' as FinancialGoal['priority'],
  notes: '',
};

function getCategoryIcon(cat: FinancialGoal['category']) {
  return categories.find(c => c.value === cat)?.icon ?? '🎯';
}
function getCategoryLabel(cat: FinancialGoal['category']) {
  return categories.find(c => c.value === cat)?.label ?? 'Other';
}
function getPriorityMeta(p: FinancialGoal['priority']) {
  return priorities.find(x => x.value === p) ?? priorities[1];
}

interface GoalFormProps {
  onGoalsChanged?: (goals: FinancialGoal[]) => void;
}

export default function GoalForm({ onGoalsChanged }: GoalFormProps) {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => { setGoals(loadGoals()); }, []);

  const persistGoals = (updated: FinancialGoal[]) => {
    setGoals(updated);
    saveGoals(updated);
    onGoalsChanged?.(updated);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Goal title is required';
    if (!form.targetAmount || Number(form.targetAmount) <= 0) errs.targetAmount = 'Enter a valid target amount';
    if (Number(form.currentSavings) < 0) errs.currentSavings = 'Cannot be negative';
    if (!form.targetDate) errs.targetDate = 'Target date is required';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const entry: FinancialGoal = {
      id: editingId ?? crypto.randomUUID(),
      title: form.title.trim(),
      category: form.category,
      targetAmount: Number(form.targetAmount),
      currentSavings: Number(form.currentSavings) || 0,
      targetDate: form.targetDate,
      priority: form.priority,
      notes: form.notes.trim() || undefined,
    };
    const updated = editingId ? goals.map(g => g.id === editingId ? entry : g) : [...goals, entry];
    persistGoals(updated);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleEdit = (goal: FinancialGoal) => {
    setEditingId(goal.id);
    setForm({ title: goal.title, category: goal.category, targetAmount: String(goal.targetAmount), currentSavings: String(goal.currentSavings), targetDate: goal.targetDate, priority: goal.priority, notes: goal.notes ?? '' });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => persistGoals(goals.filter(g => g.id !== id));

  const handleCancel = () => { setEditingId(null); setForm(defaultForm); setErrors({}); };

  // Glass-style classes
  const glassCard = 'relative bg-on-surface/[0.04] backdrop-blur-2xl border border-on-surface/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]';
  const glassInput = (field: string) =>
    `w-full bg-on-surface/[0.03] backdrop-blur-md border ${errors[field] ? 'border-[#EF4444]/60' : 'border-on-surface/[0.08]'} rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/20 focus:outline-none focus:border-[#FF6B00]/50 focus:bg-on-surface/[0.05] focus:shadow-[0_0_20px_rgba(255,107,0,0.08)] transition-all duration-300`;
  const glassSelect = 'w-full bg-on-surface/[0.03] backdrop-blur-md border border-on-surface/[0.08] rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-[#FF6B00]/50 transition-all duration-300';
  const disposable = Math.max(0, monthlyIncome - monthlyExpenses);

  return (
    <div className="space-y-8">
      {/* ── Monthly Financials ── */}
      <div className={`${glassCard} p-6 overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#22C55E]/[0.03] to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#22C55E]/20 to-[#22C55E]/5 border border-[#22C55E]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#22C55E] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface/80">Your Monthly Financials</h3>
              <p className="text-[10px] text-on-surface/30 font-body">Used by AI Goal Planner to compute SIP targets</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-on-surface/30 font-body uppercase tracking-widest mb-2">Monthly Income (₹)</label>
              <input type="number" value={monthlyIncome || ''} onChange={e => setMonthlyIncome(Number(e.target.value) || 0)} placeholder="e.g. 80000" min="0" className={glassInput('')} />
            </div>
            <div>
              <label className="block text-[10px] text-on-surface/30 font-body uppercase tracking-widest mb-2">Monthly Expenses (₹)</label>
              <input type="number" value={monthlyExpenses || ''} onChange={e => setMonthlyExpenses(Number(e.target.value) || 0)} placeholder="e.g. 50000" min="0" className={glassInput('')} />
            </div>
          </div>
          {monthlyIncome > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${glassCard} !rounded-xl !p-0 !shadow-none bg-[#22C55E]/[0.06] border-[#22C55E]/20`} style={{padding: '8px 16px'}}>
                <span className="material-symbols-outlined text-[#22C55E] text-sm">savings</span>
                <span className="text-xs text-on-surface/40 font-body">Disposable:</span>
                <span className="text-sm font-bold text-[#22C55E]">₹{disposable.toLocaleString('en-IN')}<span className="text-[10px] font-normal text-on-surface/30">/mo</span></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Goal Form ── */}
      <div className={`${glassCard} p-6 overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B00]/20 to-[#FF8C00]/5 border border-[#FF6B00]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#FF6B00] text-base">{editingId ? 'edit' : 'add_circle'}</span>
            </div>
            <h2 className="text-sm font-bold text-on-surface/80">{editingId ? 'Edit Financial Goal' : 'Add Financial Goal'}</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] text-on-surface/30 font-body uppercase tracking-widest mb-2">Goal Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Buy a house in Mumbai" className={glassInput('title')} />
                {errors.title && <p className="text-[#EF4444] text-xs mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.title}</p>}
              </div>
              <div>
                <label className="block text-[10px] text-on-surface/30 font-body uppercase tracking-widest mb-2">Target Amount (₹)</label>
                <input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} placeholder="0" min="0" className={glassInput('targetAmount')} />
                {errors.targetAmount && <p className="text-[#EF4444] text-xs mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.targetAmount}</p>}
              </div>
              <div>
                <label className="block text-[10px] text-on-surface/30 font-body uppercase tracking-widest mb-2">Target Date</label>
                <input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} className={glassInput('targetDate')} />
                {errors.targetDate && <p className="text-[#EF4444] text-xs mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.targetDate}</p>}
              </div>
            </div>

            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[#FF6B00]/80 text-xs font-bold font-body uppercase tracking-widest flex items-center gap-1.5 hover:text-[#FF8C00] transition-colors group">
              <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>expand_more</span>
              {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-on-surface/[0.05] animate-[fadeIn_0.3s_ease]">
                <div>
                  <label className="block text-[10px] text-on-surface/30 font-body uppercase tracking-widest mb-2">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as FinancialGoal['category'] })} className={glassSelect}>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-on-surface/30 font-body uppercase tracking-widest mb-2">Priority</label>
                  <div className="flex gap-2">
                    {priorities.map(p => (
                      <button key={p.value} type="button" onClick={() => setForm({ ...form, priority: p.value })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
                          form.priority === p.value
                            ? `bg-[${p.color}]/15 text-[${p.color}] border-[${p.color}]/40 ${p.glow}`
                            : 'bg-on-surface/[0.03] text-on-surface/40 border-on-surface/[0.08] hover:bg-on-surface/[0.06]'
                        }`}
                        style={form.priority === p.value ? { backgroundColor: `${p.color}15`, color: p.color, borderColor: `${p.color}40` } : {}}
                      >{p.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-on-surface/30 font-body uppercase tracking-widest mb-2">Current Savings (₹)</label>
                  <input type="number" value={form.currentSavings} onChange={e => setForm({ ...form, currentSavings: e.target.value })} placeholder="0" min="0" className={glassInput('currentSavings')} />
                </div>
                <div>
                  <label className="block text-[10px] text-on-surface/30 font-body uppercase tracking-widest mb-2">Notes <span className="normal-case opacity-50">(optional)</span></label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={1} placeholder="Additional details..." className={glassSelect + ' resize-none'} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit"
                className="relative bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] text-on-surface text-sm font-semibold px-7 py-3 rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(255,107,0,0.35)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden group">
                <span className="relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">{editingId ? 'save' : 'add'}</span>
                  {editingId ? 'Update Goal' : 'Add Goal'}
                </span>
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel}
                  className="bg-on-surface/[0.05] hover:bg-on-surface/[0.08] text-on-surface/50 font-body text-sm font-semibold px-6 py-3 rounded-xl border border-on-surface/[0.08] transition-all duration-300">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* ── Goals Grid ── */}
      {goals.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2962FF]/20 to-[#2962FF]/5 border border-[#2962FF]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#2962FF] text-base" style={{ fontVariationSettings: "'FILL' 1" }}>track_changes</span>
            </div>
            <h2 className="text-sm font-bold text-on-surface/80">Your Goals</h2>
            <span className="text-[10px] bg-on-surface/[0.06] text-on-surface/40 px-2 py-0.5 rounded-full font-bold">{goals.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {goals.map(goal => {
              const progress = goal.targetAmount > 0 ? Math.min((goal.currentSavings / goal.targetAmount) * 100, 100) : 0;
              const remaining = goal.targetAmount - goal.currentSavings;
              const targetDate = new Date(goal.targetDate);
              const today = new Date();
              const monthsLeft = Math.max(0, (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth()));
              const pMeta = getPriorityMeta(goal.priority);
              const progressColor = progress >= 100 ? '#22C55E' : progress >= 50 ? '#2962FF' : '#F59E0B';

              return (
                <div key={goal.id}
                  className={`${glassCard} p-5 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-on-surface/[0.12] hover:translate-y-[-2px] overflow-hidden ${editingId === goal.id ? '!border-[#2962FF]/40 shadow-[0_0_30px_rgba(41,98,255,0.12)]' : ''}`}>
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-on-surface/[0.02] to-transparent pointer-events-none" />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-on-surface/[0.06] border border-on-surface/[0.08] flex items-center justify-center text-xl shadow-inner">
                          {getCategoryIcon(goal.category)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-on-surface">{goal.title}</h3>
                          <p className="text-[10px] text-on-surface/30 font-body uppercase tracking-wider">{getCategoryLabel(goal.category)}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border"
                        style={{ backgroundColor: `${pMeta.color}12`, color: pMeta.color, borderColor: `${pMeta.color}30` }}>
                        {goal.priority}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-on-surface/30 font-body">Progress</span>
                        <span className="font-bold" style={{ color: progressColor }}>{progress.toFixed(1)}%</span>
                      </div>
                      <div className="relative w-full h-2.5 bg-on-surface/[0.06] rounded-full overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-on-surface/[0.02] to-transparent" />
                        <div className="h-full rounded-full transition-all duration-700 ease-out relative"
                          style={{ width: `${progress}%`, backgroundColor: progressColor, boxShadow: `0 0 12px ${progressColor}40` }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-on-surface/20 to-transparent rounded-full" />
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] mt-1.5">
                        <span className="text-on-surface/25 font-body">₹{goal.currentSavings.toLocaleString('en-IN')}</span>
                        <span className="text-on-surface/40 font-body font-medium">₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-on-surface/[0.03] rounded-xl px-3 py-2.5 border border-on-surface/[0.05]">
                        <p className="text-[9px] text-on-surface/25 font-body uppercase tracking-wider">Remaining</p>
                        <p className="text-sm font-bold text-on-surface/70 mt-0.5">₹{Math.max(0, remaining).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="bg-on-surface/[0.03] rounded-xl px-3 py-2.5 border border-on-surface/[0.05]">
                        <p className="text-[9px] text-on-surface/25 font-body uppercase tracking-wider">Target Date</p>
                        <p className="text-sm font-bold text-on-surface/70 mt-0.5">{targetDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
                      </div>
                      {monthsLeft > 0 && (
                        <div className="bg-on-surface/[0.03] rounded-xl px-3 py-2.5 border border-on-surface/[0.05]">
                          <p className="text-[9px] text-on-surface/25 font-body uppercase tracking-wider">Time Left</p>
                          <p className="text-sm font-bold text-[#2962FF] mt-0.5">{monthsLeft} months</p>
                        </div>
                      )}
                      {monthsLeft > 0 && remaining > 0 && (
                        <div className="bg-on-surface/[0.03] rounded-xl px-3 py-2.5 border border-on-surface/[0.05]">
                          <p className="text-[9px] text-on-surface/25 font-body uppercase tracking-wider">Monthly Needed</p>
                          <p className="text-sm font-bold text-[#FF6B00] mt-0.5">₹{(remaining / monthsLeft).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                      )}
                    </div>

                    {goal.notes && (
                      <p className="text-xs text-on-surface/30 font-body italic border-t border-on-surface/[0.05] pt-3 mb-3">{goal.notes}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-on-surface/[0.05]">
                      <button onClick={() => handleEdit(goal)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-[#FF6B00]/80 hover:text-[#FF6B00] text-xs font-medium py-2 rounded-xl hover:bg-[#FF6B00]/10 transition-all duration-300">
                        <span className="material-symbols-outlined text-sm">edit</span>Edit
                      </button>
                      <button onClick={() => handleDelete(goal.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-[#EF4444]/50 hover:text-[#EF4444] text-xs font-medium py-2 rounded-xl hover:bg-[#EF4444]/10 transition-all duration-300">
                        <span className="material-symbols-outlined text-sm">delete</span>Delete
                      </button>
                    </div>

                    <GoalAgentPlan goal={goal} monthlyIncome={monthlyIncome} monthlyExpenses={monthlyExpenses} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className={`${glassCard} p-12 text-center`}>
          <div className="w-16 h-16 rounded-2xl bg-on-surface/[0.04] border border-on-surface/[0.06] flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <p className="text-sm text-on-surface/30 font-body">No financial goals added yet.</p>
          <p className="text-xs text-on-surface/20 font-body mt-1">Add your first goal above to get started.</p>
        </div>
      )}
    </div>
  );
}
