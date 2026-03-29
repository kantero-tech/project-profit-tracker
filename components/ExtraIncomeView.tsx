import React, { useState, useMemo } from 'react';
import { ExtraIncome } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { WalletIcon, PlusIcon, TrashIcon, EditIcon } from './Icons';

interface ExtraIncomeProps {
  incomes: ExtraIncome[];
  currency: string;
  onAddIncome: () => void;
  onEditIncome: (id: string) => void;
  onDeleteIncome: (id: string) => void;
}

const ExtraIncomeView: React.FC<ExtraIncomeProps> = ({ incomes, currency, onAddIncome, onEditIncome, onDeleteIncome }) => {
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const sortedIncomes = useMemo(() => {
    return [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomes]);

  const totalIncome = useMemo(() => {
    return incomes.reduce((sum, i) => sum + i.amount, 0);
  }, [incomes]);

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
      <header className="px-6 py-6 shrink-0 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-white leading-none">Extra Income</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Non-Project Revenue</p>
          </div>
          <button 
            onClick={onAddIncome}
            className="bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl active:scale-95 transition-transform flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
          >
            <PlusIcon className="h-3 w-3" />
            <span>Add Income</span>
          </button>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Extra Income</p>
            <p className="text-3xl font-black text-emerald-400">{formatCurrency(totalIncome, currency)}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-24">
        <div className="space-y-3">
          {sortedIncomes.length > 0 ? sortedIncomes.map(income => (
            <div key={income.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-slate-700 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                  <WalletIcon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{income.source}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{formatDate(income.date)}</p>
                  {income.note && <p className="text-xs text-slate-400 mt-1">{income.note}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <p className="text-lg font-black text-emerald-400">+{formatCurrency(income.amount, currency)}</p>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEditIncome(income.id)} className="p-2 bg-slate-800 text-teal-400 rounded-xl hover:bg-slate-700 transition-colors">
                    <EditIcon className="h-4 w-4" />
                  </button>
                  <button onClick={() => {
                    setConfirmAction({
                      message: 'Are you sure you want to delete this income record?',
                      onConfirm: () => {
                        onDeleteIncome(income.id);
                        setConfirmAction(null);
                      }
                    });
                  }} className="p-2 bg-slate-800 text-rose-400 rounded-xl hover:bg-slate-700 transition-colors">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed">
              <WalletIcon className="h-8 w-8 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">No extra income recorded</p>
            </div>
          )}
        </div>
      </div>

      {confirmAction && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[24px] max-w-sm w-full shadow-2xl animate-slide-up">
                  <h3 className="text-lg font-black text-white mb-2">Confirm Action</h3>
                  <p className="text-sm text-slate-400 mb-6">{confirmAction.message}</p>
                  <div className="flex space-x-3">
                      <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-slate-800 text-white hover:bg-slate-700 transition-colors">Cancel</button>
                      <button onClick={confirmAction.onConfirm} className="flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-rose-500 text-white hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/20">Delete</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ExtraIncomeView;
