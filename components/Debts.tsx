
import React, { useState } from 'react';
import { Debt, DebtType, Project } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { HandshakeIcon, PlusIcon, TrashIcon, CheckIcon, TrendingDownIcon, TrendingUpIcon } from './Icons';

interface DebtsProps {
  debts: Debt[];
  projects?: Project[];
  currency: string;
  onAddDebt: (type?: DebtType) => void;
  onDeleteDebt: (id: string) => void;
  onAddPayment: (id: string) => void;
  onSettle: (id: string, amount: number) => void;
  onUndoSettlement: (id: string) => void;
}

const DebtListSection: React.FC<{
    title: string;
    type: DebtType;
    debts: Debt[];
    projects: Project[];
    currency: string;
    icon: React.ReactNode;
    accentColor: string;
    bgColor: string;
    btnColor: string;
    onAdd: () => void;
    onSettle: (d: Debt) => void;
    onUndoSettlement: (id: string) => void;
    onPay: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ title, type, debts, projects, currency, icon, accentColor, bgColor, btnColor, onAdd, onSettle, onUndoSettlement, onPay, onDelete }) => {
    const [showHistory, setShowHistory] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

    // Filter and Sort
    const activeDebts = debts.filter(d => {
        const payments = d.payments || [];
        const paid = payments.reduce((s, p) => s + p.amount, 0);
        return d.amount - paid > 0;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    const settledDebts = debts.filter(d => {
        const payments = d.payments || [];
        const paid = payments.reduce((s, p) => s + p.amount, 0);
        return d.amount - paid <= 0;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    const totalOutstanding = activeDebts.reduce((sum, d) => {
        const payments = d.payments || [];
        const paid = payments.reduce((pSum, p) => pSum + p.amount, 0);
        return sum + (d.amount - paid);
    }, 0);

    const getProjectName = (id?: string) => {
        if (!id) return null;
        return projects.find(p => p.id === id)?.name;
    };

    return (
        <div className="flex flex-col h-full bg-slate-900/20 border-r border-slate-800 last:border-r-0 overflow-hidden">
            <div className={`p-6 border-b border-slate-800/50 ${bgColor}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                         <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${accentColor}`}>
                            {icon}
                         </div>
                         <div>
                             <h2 className="text-lg font-black text-white uppercase tracking-tight">{title}</h2>
                             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{activeDebts.length} Active Records</p>
                         </div>
                    </div>
                    <button onClick={onAdd} className={`p-3 rounded-xl text-white shadow-lg active:scale-95 transition-transform ${btnColor}`}>
                        <PlusIcon className="h-4 w-4" />
                    </button>
                </div>
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Outstanding</p>
                    <p className={`text-3xl font-black ${accentColor}`}>
                        {formatCurrency(totalOutstanding, currency)}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                 {activeDebts.length > 0 ? activeDebts.map(debt => {
                    const payments = debt.payments || [];
                    const paid = payments.reduce((s, p) => s + p.amount, 0);
                    const remaining = debt.amount - paid;
                    const isOverdue = new Date(debt.dueDate) < new Date() && remaining > 0;
                    const projectName = getProjectName(debt.projectId);

                    return (
                        <div key={debt.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative group hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wide truncate max-w-[150px]">{debt.personName}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold text-slate-500">Due: {formatDate(debt.dueDate)}</span>
                                        {isOverdue && <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded uppercase">Overdue</span>}
                                        {debt.isRecurring && <span className="text-[8px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase">Recurring</span>}
                                        {projectName && <span className="text-[8px] font-black bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded uppercase border border-teal-500/30 truncate max-w-[100px]">{projectName}</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black ${accentColor}`}>
                                        {formatCurrency(remaining, currency)}
                                    </p>
                                    {paid > 0 && <p className="text-[8px] text-slate-600 font-bold uppercase mt-0.5">Paid: {formatCurrency(paid, currency)}</p>}
                                </div>
                            </div>
                            
                            {debt.notes && (
                                <p className="text-[10px] text-slate-500 italic mb-3 line-clamp-2">"{debt.notes}"</p>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/50 mt-2">
                                <label className="flex items-center space-x-2 cursor-pointer group/label">
                                    <div className={`relative h-4 w-4 rounded border border-slate-600 group-hover/label:border-${type === 'Owes Me' ? 'emerald' : 'rose'}-500 bg-slate-950 flex items-center justify-center transition-all`}>
                                        <input 
                                            type="checkbox" 
                                            className="opacity-0 absolute inset-0 cursor-pointer" 
                                            checked={false}
                                            onChange={() => onSettle(debt)}
                                        />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest select-none text-slate-400 group-hover/label:text-white transition-colors">
                                        Mark Paid
                                    </span>
                                </label>

                                <div className="flex items-center space-x-1">
                                    <button onClick={() => onPay(debt.id)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[9px] font-black uppercase text-white transition-colors">
                                        Partial
                                    </button>
                                    {!debt.id.startsWith('PROJ_') && (
                                        <button onClick={() => setConfirmAction({ message: 'Delete this record?', onConfirm: () => { onDelete(debt.id); setConfirmAction(null); } })} className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors">
                                            <TrashIcon className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-10 opacity-30">
                        <HandshakeIcon className="h-12 w-12 mx-auto mb-2 text-slate-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No active records</p>
                    </div>
                )}

                {/* History Toggle */}
                {settledDebts.length > 0 && (
                    <div className="mt-8 border-t border-slate-800/50 pt-8">
                        <button 
                            onClick={() => setShowHistory(!showHistory)} 
                            className="w-full py-3 rounded-xl border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center justify-center space-x-2"
                        >
                            <span>{showHistory ? 'Hide' : 'Show'} Settled ({settledDebts.length})</span>
                        </button>

                        {showHistory && (
                            <div className="space-y-3 mt-4">
                                {settledDebts.map(debt => (
                                    <div key={debt.id} className="bg-slate-900/40 border border-slate-800/50 p-4 rounded-2xl flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
                                        <div className="flex items-center space-x-3">
                                             <label className="flex items-center space-x-3 cursor-pointer group/label">
                                                <div className="relative h-5 w-5 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center transition-all shadow-inner">
                                                    <input 
                                                        type="checkbox" 
                                                        className="opacity-0 absolute inset-0 cursor-pointer" 
                                                        checked={true}
                                                        onChange={() => onUndoSettlement(debt.id)}
                                                    />
                                                    <CheckIcon className="h-3 w-3 text-white" />
                                                </div>
                                            </label>
                                            <div>
                                                <p className="text-xs font-bold text-slate-300 uppercase line-through decoration-slate-500">{debt.personName}</p>
                                                <p className="text-[8px] font-black text-emerald-500 uppercase mt-0.5">Settled</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <p className="text-sm font-black text-slate-400">{formatCurrency(debt.amount, currency)}</p>
                                            {!debt.id.startsWith('PROJ_') && (
                                                <button onClick={() => setConfirmAction({ message: 'Delete history?', onConfirm: () => { onDelete(debt.id); setConfirmAction(null); } })} className="text-slate-600 hover:text-rose-400">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {confirmAction && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[120] flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
                    <div className="bg-slate-900 rounded-[32px] p-8 max-w-sm w-full border border-slate-800 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-black text-white mb-4 uppercase tracking-widest text-center">Confirm Action</h3>
                        <p className="text-slate-400 text-sm text-center mb-8">{confirmAction.message}</p>
                        <div className="flex space-x-3">
                            <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Cancel</button>
                            <button onClick={confirmAction.onConfirm} className="flex-1 py-3 bg-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white hover:bg-rose-400 transition-colors">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Debts: React.FC<DebtsProps> = ({ debts, projects = [], currency, onAddDebt, onDeleteDebt, onAddPayment, onSettle, onUndoSettlement }) => {
  const [activeMobileTab, setActiveMobileTab] = useState<'IOwe' | 'OwesMe'>('IOwe');
  const iOweDebts = debts.filter(d => d.type === 'I Owe');
  const owesMeDebts = debts.filter(d => d.type === 'Owes Me');

  const handleQuickSettle = (debt: Debt) => {
      const payments = debt.payments || [];
      const paid = payments.reduce((s, p) => s + p.amount, 0);
      const remaining = debt.amount - paid;
      
      onSettle(debt.id, remaining);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
        {/* Mobile Tab Switcher */}
        <div className="lg:hidden p-4 pb-0">
            <div className="bg-slate-900 p-1 rounded-xl flex border border-slate-800">
                <button 
                    onClick={() => setActiveMobileTab('IOwe')}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeMobileTab === 'IOwe' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500'}`}
                >
                    <TrendingDownIcon className="h-4 w-4" />
                    <span>I Owe ({iOweDebts.length})</span>
                </button>
                <button 
                    onClick={() => setActiveMobileTab('OwesMe')}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${activeMobileTab === 'OwesMe' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}
                >
                    <TrendingUpIcon className="h-4 w-4" />
                    <span>Owes Me ({owesMeDebts.length})</span>
                </button>
            </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden lg:divide-x divide-slate-800">
            {/* Left Column: I Owe (Payables) */}
            <div className={`flex-1 overflow-hidden ${activeMobileTab === 'IOwe' ? 'flex' : 'hidden lg:flex'}`}>
                <DebtListSection 
                    title="My Payables (I Owe)"
                    type="I Owe"
                    debts={iOweDebts}
                    projects={projects}
                    currency={currency}
                    icon={<TrendingDownIcon className="h-5 w-5 text-rose-400" />}
                    accentColor="text-rose-400"
                    bgColor="bg-rose-500/5"
                    btnColor="bg-rose-500 hover:bg-rose-400"
                    onAdd={() => onAddDebt('I Owe')}
                    onSettle={handleQuickSettle}
                    onUndoSettlement={onUndoSettlement}
                    onPay={onAddPayment}
                    onDelete={onDeleteDebt}
                />
            </div>

            {/* Right Column: They Owe Me (Receivables) */}
            <div className={`flex-1 overflow-hidden ${activeMobileTab === 'OwesMe' ? 'flex' : 'hidden lg:flex'}`}>
                <DebtListSection 
                    title="Receivables (Owes Me)"
                    type="Owes Me"
                    debts={owesMeDebts}
                    projects={projects}
                    currency={currency}
                    icon={<TrendingUpIcon className="h-5 w-5 text-emerald-400" />}
                    accentColor="text-emerald-400"
                    bgColor="bg-emerald-500/5"
                    btnColor="bg-emerald-500 hover:bg-emerald-400"
                    onAdd={() => onAddDebt('Owes Me')}
                    onSettle={handleQuickSettle}
                    onUndoSettlement={onUndoSettlement}
                    onPay={onAddPayment}
                    onDelete={onDeleteDebt}
                />
            </div>
        </div>
    </div>
  );
};

export default Debts;
