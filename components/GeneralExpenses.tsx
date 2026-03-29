
import React, { useState, useMemo } from 'react';
import { GeneralExpense, ExpenseType } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { BuildingIcon, UserIcon, PlusIcon, TrashIcon, CheckIcon, EditIcon, ListIcon, LayoutGridIcon, ReceiptIcon } from './Icons';

interface GeneralExpensesProps {
  expenses: GeneralExpense[];
  currency: string;
  onAddExpense: (type: ExpenseType) => void;
  onEditExpense: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onQuickAdd: (expense: Partial<GeneralExpense>) => void;
  onUpdateExpense: (expense: GeneralExpense) => void;
}

type TabView = 'business_overview' | 'business_list' | 'other_business' | 'personal';

const GeneralExpenses: React.FC<GeneralExpensesProps> = ({ expenses, currency, onAddExpense, onEditExpense, onDeleteExpense, onQuickAdd, onUpdateExpense }) => {
  const [activeTab, setActiveTab] = useState<TabView>('business_overview');
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const currentExpenseType: ExpenseType = activeTab === 'personal' ? 'Personal' : activeTab === 'other_business' ? 'Other Business' : 'Business Fixed';

  const filteredHistory = useMemo(() => expenses.filter(e => e.type === currentExpenseType && e.status !== 'Pending').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [expenses, currentExpenseType]);
  
  const totalMonth = useMemo(() => {
    const now = new Date();
    return filteredHistory.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, e) => s + e.amount, 0);
  }, [filteredHistory]);

  // LOGIC FOR RECURRING BILLS STATUS
  const recurringBillsStatus = useMemo(() => {
      const now = new Date();
      // 1. Get all recurring expenses of this type from history (including Pending ones to catch new templates)
      const recurring = expenses.filter(e => e.type === currentExpenseType && e.isRecurring);
      
      // 2. Group by unique name to get "Templates" (use most recent amount)
      const templates = new Map<string, GeneralExpense>();
      recurring.forEach(e => {
           if (!templates.has(e.name) || new Date(e.date) > new Date(templates.get(e.name)!.date)) {
               templates.set(e.name, e);
           }
      });

      // 3. Check status for this month
      const statusList: { template: GeneralExpense; isPaid: boolean; paidEntry?: GeneralExpense; pendingEntry?: GeneralExpense }[] = [];
      
      templates.forEach(template => {
          // Find an entry for this month
          const monthEntry = expenses.find(e => {
              const d = new Date(e.date);
              return e.name === template.name && 
                     e.type === currentExpenseType &&
                     d.getMonth() === now.getMonth() && 
                     d.getFullYear() === now.getFullYear();
          });
          
          // It is paid if we found an entry AND it is NOT pending
          const isPaid = !!monthEntry && monthEntry.status !== 'Pending';

          statusList.push({
              template,
              isPaid,
              paidEntry: isPaid ? monthEntry : undefined,
              pendingEntry: (monthEntry && monthEntry.status === 'Pending') ? monthEntry : undefined
          });
      });

      // Sort: Pending first, then Paid
      return statusList.sort((a, b) => {
          if (a.isPaid === b.isPaid) return 0;
          return a.isPaid ? 1 : -1;
      });
  }, [expenses, currentExpenseType]);

  const dashboardMetrics = useMemo(() => {
      const pendingTotal = recurringBillsStatus.filter(b => !b.isPaid).reduce((sum, b) => sum + b.template.amount, 0);
      const paidTotal = totalMonth; // Already calculated for this month
      return {
          pending: pendingTotal,
          paid: paidTotal,
          total: pendingTotal + paidTotal
      };
  }, [recurringBillsStatus, totalMonth]);

  const handleTogglePay = (template: GeneralExpense, isPaid: boolean, paidEntry?: GeneralExpense, pendingEntry?: GeneralExpense) => {
      if (isPaid && paidEntry) {
          // Un-ticking: Convert to Pending
          onUpdateExpense({ ...paidEntry, status: 'Pending' });
      } else {
          // Ticking: Mark as Paid
          if (pendingEntry) {
              // Update existing pending entry to Paid
              onUpdateExpense({ ...pendingEntry, status: 'Paid' });
          } else {
              // Create new Paid entry
              onQuickAdd({ ...template, id: undefined, date: formatDate(new Date().toISOString()), status: 'Paid' });
          }
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
        <header className="px-6 py-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6 shrink-0">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Monthly Expenses</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">Overheads & Personal Costs</p>
            </div>
            <button onClick={() => onAddExpense(currentExpenseType)} className="flex items-center space-x-2 bg-rose-500 hover:bg-rose-400 text-white px-6 py-3 rounded-2xl shadow-xl shadow-rose-900/20 transition-all font-black text-[10px] uppercase tracking-widest">
                <PlusIcon className="h-4 w-4" />
                <span>Add {currentExpenseType === 'Business Fixed' ? 'Fixed Cost' : currentExpenseType === 'Other Business' ? 'Other Biz' : 'Expense'}</span>
            </button>
        </header>

        <div className="px-6 pb-2">
            {/* TABS */}
            <div className="flex items-center space-x-2 border-b border-slate-800 mb-6 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('business_overview')}
                    className={`pb-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'business_overview' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="flex items-center space-x-2">
                        <LayoutGridIcon className="h-3 w-3" />
                        <span>Biz Overview</span>
                    </div>
                    {activeTab === 'business_overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />}
                </button>
                
                <button 
                    onClick={() => setActiveTab('business_list')}
                    className={`pb-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'business_list' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="flex items-center space-x-2">
                        <ListIcon className="h-3 w-3" />
                        <span>Biz List</span>
                    </div>
                    {activeTab === 'business_list' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />}
                </button>

                <div className="h-4 w-px bg-slate-800 mx-2 shrink-0"></div>

                <button 
                    onClick={() => setActiveTab('other_business')}
                    className={`pb-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'other_business' ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="flex items-center space-x-2">
                        <ReceiptIcon className="h-3 w-3" />
                        <span>Other Biz</span>
                    </div>
                    {activeTab === 'other_business' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />}
                </button>

                <div className="h-4 w-px bg-slate-800 mx-2 shrink-0"></div>

                <button 
                    onClick={() => setActiveTab('personal')}
                    className={`pb-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0 ${activeTab === 'personal' ? 'text-pink-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="flex items-center space-x-2">
                        <UserIcon className="h-3 w-3" />
                        <span>Personal</span>
                    </div>
                    {activeTab === 'personal' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-pink-500 rounded-t-full" />}
                </button>
            </div>

            {/* DASHBOARD SUMMARY (Only for Overview, Other Biz, or Personal) */}
            {(activeTab === 'business_overview' || activeTab === 'other_business' || activeTab === 'personal') && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl overflow-hidden">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 truncate">Paid So Far</p>
                        <p className="text-[10px] sm:text-xs font-black text-emerald-400 truncate" title={formatCurrency(dashboardMetrics.paid, currency)}>
                            {formatCurrency(dashboardMetrics.paid, currency)}
                        </p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl overflow-hidden">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 truncate">Left to Pay</p>
                        <p className="text-[10px] sm:text-xs font-black text-rose-400 truncate" title={formatCurrency(dashboardMetrics.pending, currency)}>
                            {formatCurrency(dashboardMetrics.pending, currency)}
                        </p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl overflow-hidden">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 truncate">Total Budget</p>
                        <p className="text-[10px] sm:text-xs font-black text-white truncate" title={formatCurrency(dashboardMetrics.total, currency)}>
                            {formatCurrency(dashboardMetrics.total, currency)}
                        </p>
                    </div>
                </div>
            )}
        </div>

        {/* SECTION: Recurring Bills Status (Tick List) - Only for Overview, Other Biz, or Personal */}
        {(activeTab === 'business_overview' || activeTab === 'other_business' || activeTab === 'personal') && recurringBillsStatus.length > 0 && (
            <div className="px-6 py-4 space-y-6">
                
                {/* PENDING BILLS */}
                {recurringBillsStatus.some(b => !b.isPaid) && (
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Due This Month</p>
                        </div>
                        <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
                            {recurringBillsStatus.filter(b => !b.isPaid).map(({ template: t, isPaid, paidEntry, pendingEntry }) => (
                                <div 
                                    key={t.id} 
                                    className="shrink-0 bg-slate-900 border border-slate-700 shadow-lg p-4 rounded-2xl min-w-[160px] max-w-[180px] flex flex-col justify-between relative group transition-all duration-300 hover:border-slate-600"
                                >
                                    <div>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 truncate">{t.category}</p>
                                        <p className="text-[10px] font-black uppercase truncate mb-1 text-white">{t.name}</p>
                                        <p className="text-sm font-black mb-3 text-white truncate">{formatCurrency(t.amount, currency)}</p>
                                    </div>
                                    
                                    <label className="flex items-center space-x-3 cursor-pointer group/label mt-2 p-2 -mx-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                                        <div className="relative h-5 w-5 rounded-md border-2 border-slate-600 group-hover/label:border-emerald-500 bg-slate-950 flex items-center justify-center transition-all shadow-inner">
                                            <input 
                                                type="checkbox" 
                                                className="opacity-0 absolute inset-0 cursor-pointer" 
                                                checked={false}
                                                onChange={() => handleTogglePay(t, false, undefined, pendingEntry)}
                                            />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest select-none transition-colors text-slate-400 group-hover/label:text-white">
                                            Mark Paid
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PAID BILLS */}
                {recurringBillsStatus.some(b => b.isPaid) && (
                    <div>
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Completed This Month</p>
                        </div>
                        <div className="flex space-x-3 overflow-x-auto pb-2 opacity-60 hover:opacity-100 transition-opacity no-scrollbar">
                            {recurringBillsStatus.filter(b => b.isPaid).map(({ template: t, isPaid, paidEntry }) => (
                                <div 
                                    key={t.id} 
                                    className="shrink-0 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl min-w-[160px] max-w-[180px] flex flex-col justify-between relative group transition-all duration-300"
                                >
                                    <div>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 truncate">{t.category}</p>
                                        <p className="text-[10px] font-black uppercase truncate mb-1 text-slate-400 line-through">{t.name}</p>
                                        <p className="text-sm font-black mb-3 text-slate-500 truncate">{formatCurrency(t.amount, currency)}</p>
                                    </div>
                                    
                                    <label className="flex items-center space-x-3 cursor-pointer group/label mt-2 p-2 -mx-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                                        <div className="relative h-5 w-5 rounded-md border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center transition-all shadow-inner">
                                            <input 
                                                type="checkbox" 
                                                className="opacity-0 absolute inset-0 cursor-pointer" 
                                                checked={true}
                                                onChange={() => handleTogglePay(t, true, paidEntry)}
                                            />
                                            <CheckIcon className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest select-none transition-colors text-emerald-500">
                                            Paid
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* SECTION: History / Log - Only for List View, Other Biz, or Personal */}
        {(activeTab === 'business_list' || activeTab === 'other_business' || activeTab === 'personal') && (
            <div className="flex-1 overflow-y-auto px-6 pb-32 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/20">
                 <div className="p-4 rounded-[24px] bg-slate-900/40 border border-slate-800 flex justify-between items-center mb-4 sticky top-0 backdrop-blur-md z-10">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Paid This Month</span>
                    <span className="text-xl font-black text-white">{formatCurrency(totalMonth, currency)}</span>
                 </div>

                 {filteredHistory.length > 0 ? filteredHistory.map(item => (
                     <div key={item.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group hover:border-slate-700 transition-all">
                         <div className="flex items-center space-x-3 overflow-hidden">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${currentExpenseType === 'Business Fixed' ? 'bg-indigo-500/20 text-indigo-400' : currentExpenseType === 'Other Business' ? 'bg-amber-500/20 text-amber-400' : 'bg-pink-500/20 text-pink-400'}`}>
                                {currentExpenseType === 'Business Fixed' ? <BuildingIcon className="h-4 w-4" /> : currentExpenseType === 'Other Business' ? <ReceiptIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white uppercase truncate">{item.name}</p>
                                <p className="text-[8px] text-slate-500 font-black uppercase mt-0.5">
                                    {item.category} • {formatDate(item.date)}
                                    {item.isRecurring && <span className="ml-2 text-teal-500">RECURRING</span>}
                                </p>
                            </div>
                         </div>
                         <div className="flex items-center space-x-4 shrink-0">
                             <p className="text-sm font-black text-white">{formatCurrency(item.amount, currency)}</p>
                             <div className="flex space-x-1">
                                 <button onClick={() => onEditExpense(item.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                    <EditIcon className="h-4 w-4" />
                                 </button>
                                 <button onClick={() => setConfirmAction({ message: 'Delete this entry?', onConfirm: () => { onDeleteExpense(item.id); setConfirmAction(null); } })} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                                    <TrashIcon className="h-4 w-4" />
                                 </button>
                             </div>
                         </div>
                     </div>
                 )) : (
                     <div className="text-center py-10 opacity-30">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No expenses recorded for this view</p>
                     </div>
                 )}
            </div>
        )}
        
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

export default GeneralExpenses;
