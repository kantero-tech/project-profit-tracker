
import React, { useState } from 'react';
import { Project, ProjectStatus, Expense, Income, GeneralExpense, DebtType, Debt, ExpenseType } from '../types';
import { PROJECT_STATUS_OPTIONS, BUSINESS_FIXED_CATEGORIES, OTHER_BUSINESS_CATEGORIES, PERSONAL_CATEGORIES } from '../constants';
import { formatDate, formatCurrency } from '../utils/helpers';

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-600" />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all appearance-none" />
);

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block">{children}</label>
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className="w-full bg-slate-800 border border-slate-700 text-white p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-slate-600 min-h-[100px]" />
);

export const ExtraIncomeForm: React.FC<{ onSave: (i: any) => void, onCancel: () => void, currency: string }> = ({ onSave, onCancel, currency }) => {
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: formatDate(new Date().toISOString()),
    note: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source || !formData.amount) return;
    onSave({ ...formData, amount: Number(formData.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Source</Label>
        <Input placeholder="E.G. CONSULTING, DIVIDENDS" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Amount ({currency})</Label>
          <Input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Input placeholder="OPTIONAL DETAILS" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
      </div>
      <div className="flex space-x-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
        <button type="submit" className="flex-1 py-4 bg-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20">Register</button>
      </div>
    </form>
  );
};

export const EditExtraIncomeForm: React.FC<{ income: any, onSave: (i: any) => void, onCancel: () => void, currency: string }> = ({ income, onSave, onCancel, currency }) => {
  const [formData, setFormData] = useState({
    ...income,
    amount: income.amount.toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source || !formData.amount) return;
    onSave({ ...formData, amount: Number(formData.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Source</Label>
        <Input value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Amount ({currency})</Label>
          <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
        </div>
        <div>
          <Label>Date</Label>
          <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
        </div>
      </div>
      <div>
        <Label>Notes</Label>
        <Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
      </div>
      <div className="flex space-x-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Discard</button>
        <button type="submit" className="flex-1 py-4 bg-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20">Update</button>
      </div>
    </form>
  );
};

export const ProjectForm: React.FC<{ onSave: (p: any) => void, onCancel: () => void, currency: string }> = ({ onSave, onCancel, currency }) => {
  const [formData, setFormData] = useState({
    name: '',
    clientInfo: '',
    startDate: formatDate(new Date().toISOString()),
    endDate: '',
    totalValue: '',
    status: ProjectStatus.Ongoing,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.totalValue) return;
    onSave({ ...formData, totalValue: Number(formData.totalValue) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input placeholder="E.G. LUXURY OFFICE FIT-OUT" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
      </div>
      <div>
        <Label>Client Brief</Label>
        <Input placeholder="CONTACT INFO & NOTES" value={formData.clientInfo} onChange={e => setFormData({...formData, clientInfo: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Contract ({currency})</Label>
          <Input type="number" placeholder="0.00" value={formData.totalValue} onChange={e => setFormData({...formData, totalValue: e.target.value})} required />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})}>
            {PROJECT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start</Label>
          <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
        </div>
        <div>
          <Label>Expected End</Label>
          <Input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
        </div>
      </div>
      <div className="flex space-x-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
        <button type="submit" className="flex-1 py-4 bg-teal-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-teal-500/20">Initialize</button>
      </div>
    </form>
  );
};

export const EditProjectForm: React.FC<{ 
    project: Project, 
    onSave: (p: any) => void, 
    onCancel: () => void, 
    currency: string,
    stats?: {
        income: number;
        expenses: number;
        debts: number;
        profit: number;
    },
    debtsList?: Debt[]
}> = ({ project, onSave, onCancel, currency, stats, debtsList = [] }) => {
    const [formData, setFormData] = useState({
      ...project,
      totalValue: project.totalValue.toString()
    });
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({ ...formData, totalValue: Number(formData.totalValue) });
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {stats && (
            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <div>
                    <Label>Total Income</Label>
                    <p className="text-emerald-400 font-black text-sm">{formatCurrency(stats.income, currency)}</p>
                </div>
                <div>
                    <Label>Total Expenses</Label>
                    <p className="text-rose-400 font-black text-sm">{formatCurrency(stats.expenses, currency)}</p>
                </div>
                <div>
                    <Label>Related Debts</Label>
                    <p className="text-amber-400 font-black text-sm">{formatCurrency(stats.debts, currency)}</p>
                </div>
                <div>
                    <Label>Net Profit</Label>
                    <p className={`font-black text-sm ${stats.profit >= 0 ? 'text-white' : 'text-rose-500'}`}>{formatCurrency(stats.profit, currency)}</p>
                </div>
            </div>
        )}

        {debtsList.length > 0 && (
            <div className="mb-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <Label>Active Debts</Label>
                <div className="space-y-2 mt-2">
                    {debtsList.map(debt => {
                        const payments = debt.payments || [];
                        const paid = payments.reduce((s, p) => s + p.amount, 0);
                        const remaining = debt.amount - paid;
                        return (
                            <div key={debt.id} className="flex justify-between items-center bg-slate-900 p-2 rounded-lg border border-slate-800">
                                <div>
                                    <p className="text-xs font-bold text-white">{debt.personName}</p>
                                    <p className="text-[9px] text-slate-500 uppercase">{debt.type}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-amber-400">{formatCurrency(remaining, currency)}</p>
                                    {paid > 0 && <p className="text-[8px] text-slate-500">Paid: {formatCurrency(paid, currency)}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        <div>
          <Label>Modify Title</Label>
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Contract ({currency})</Label>
            <Input type="number" value={formData.totalValue} onChange={e => setFormData({...formData, totalValue: e.target.value})} required />
          </div>
          <div>
            <Label>Process Status</Label>
            <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ProjectStatus})}>
              {PROJECT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </Select>
          </div>
        </div>
        <div>
            <Label>Client Briefing</Label>
            <Input value={formData.clientInfo} onChange={e => setFormData({...formData, clientInfo: e.target.value})} />
        </div>
        <div>
            <Label>Executive Notes</Label>
            <TextArea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
        </div>
        <div className="flex space-x-3 pt-6">
          <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Discard</button>
          <button type="submit" className="flex-1 py-4 bg-teal-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white">Save Changes</button>
        </div>
      </form>
    );
  };

export const IncomeForm: React.FC<{ projectId: string, onSave: (i: any) => void, onCancel: () => void, currency: string }> = ({ projectId, onSave, onCancel, currency }) => {
  const [formData, setFormData] = useState({
    amount: '',
    note: '',
    date: formatDate(new Date().toISOString())
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;
    onSave({ ...formData, amount: Number(formData.amount), projectId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Credit Amount ({currency})</Label>
        <Input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
      </div>
      <div>
        <Label>Transaction Reference</Label>
        <Input placeholder="E.G. DEPOSIT, MILESTONE 2" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
      </div>
      <div>
        <Label>Recorded Date</Label>
        <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
      </div>
      <div className="flex space-x-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
        <button type="submit" className="flex-1 py-4 bg-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20">Confirm Income</button>
      </div>
    </form>
  );
};

export const EditIncomeForm: React.FC<{ income: Income, onSave: (i: any) => void, onCancel: () => void, currency: string }> = ({ income, onSave, onCancel, currency }) => {
  const [formData, setFormData] = useState({
    ...income,
    amount: income.amount.toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;
    onSave({ ...formData, amount: Number(formData.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Credit Amount ({currency})</Label>
        <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
      </div>
      <div>
        <Label>Transaction Reference</Label>
        <Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
      </div>
      <div>
        <Label>Recorded Date</Label>
        <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
      </div>
      <div className="flex space-x-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
        <button type="submit" className="flex-1 py-4 bg-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20">Update Income</button>
      </div>
    </form>
  );
};

export const ExpenseForm: React.FC<{ projectId: string, categories: string[], onSave: (e: any) => void, onCancel: () => void, currency: string }> = ({ projectId, categories, onSave, onCancel, currency }) => {
  const [formData, setFormData] = useState({
    category: categories[0] || 'General',
    description: '',
    amount: '',
    date: formatDate(new Date().toISOString())
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    onSave({ ...formData, amount: Number(formData.amount), projectId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </Select>
        </div>
        <div>
          <Label>Debit ({currency})</Label>
          <Input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
        </div>
      </div>
      <div>
        <Label>Line Item Description</Label>
        <Input placeholder="E.G. 50KG CEMENT, DAY LABOR" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
      </div>
      <div>
        <Label>Recorded Date</Label>
        <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
      </div>
      <div className="flex space-x-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
        <button type="submit" className="flex-1 py-4 bg-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-rose-500/20">Confirm Expense</button>
      </div>
    </form>
  );
};

export const EditExpenseForm: React.FC<{ expense: Expense, categories: string[], onSave: (e: any) => void, onCancel: () => void, currency: string }> = ({ expense, categories, onSave, onCancel, currency }) => {
  const [formData, setFormData] = useState({
    ...expense,
    amount: expense.amount.toString()
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    onSave({ ...formData, amount: Number(formData.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </Select>
        </div>
        <div>
          <Label>Debit ({currency})</Label>
          <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
        </div>
      </div>
      <div>
        <Label>Line Item Description</Label>
        <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
      </div>
      <div>
        <Label>Recorded Date</Label>
        <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
      </div>
      <div className="flex space-x-3 pt-6">
        <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
        <button type="submit" className="flex-1 py-4 bg-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-rose-500/20">Update Expense</button>
      </div>
    </form>
  );
};

export const GeneralExpenseForm: React.FC<{ type: ExpenseType, onSave: (e: any) => void, onCancel: () => void, currency: string }> = ({ type, onSave, onCancel, currency }) => {
    const categories = type === 'Business Fixed' ? BUSINESS_FIXED_CATEGORIES : type === 'Other Business' ? OTHER_BUSINESS_CATEGORIES : PERSONAL_CATEGORIES;
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        category: categories[0],
        date: formatDate(new Date().toISOString()),
        isRecurring: false,
        status: 'Paid' as 'Paid' | 'Pending'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // If recurring, respect the status. If not recurring, it's always Paid.
        const finalStatus = formData.isRecurring ? formData.status : 'Paid';
        onSave({ ...formData, type, amount: Number(formData.amount), status: finalStatus });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Description</Label>
                <Input placeholder={type === 'Business Fixed' ? "E.G. SHOP RENT" : type === 'Other Business' ? "E.G. FLIGHT TICKETS" : "E.G. GROCERIES"} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Cost ({currency})</Label>
                    <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                </div>
            </div>
            <div>
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-xl">
                     <input 
                        type="checkbox" 
                        id="recurring" 
                        checked={formData.isRecurring} 
                        onChange={e => {
                            const isRecurring = e.target.checked;
                            // If checking recurring, default to Pending (unpaid) as requested
                            setFormData({
                                ...formData, 
                                isRecurring,
                                status: isRecurring ? 'Pending' : 'Paid'
                            });
                        }} 
                        className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500"
                     />
                     <label htmlFor="recurring" className="text-xs font-bold text-slate-400">Save as recurring monthly bill</label>
                </div>

                {formData.isRecurring && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl ml-4">
                        <input 
                            type="checkbox" 
                            id="status" 
                            checked={formData.status === 'Paid'} 
                            onChange={e => setFormData({...formData, status: e.target.checked ? 'Paid' : 'Pending'})} 
                            className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label htmlFor="status" className="text-xs font-bold text-emerald-400">Mark as already paid for this month?</label>
                    </div>
                )}
            </div>

            <div className="flex space-x-3 pt-6">
                <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-rose-500/20">Record</button>
            </div>
        </form>
    );
};

export const EditGeneralExpenseForm: React.FC<{ expense: GeneralExpense, onSave: (e: any) => void, onCancel: () => void, currency: string }> = ({ expense, onSave, onCancel, currency }) => {
    const categories = expense.type === 'Business Fixed' ? BUSINESS_FIXED_CATEGORIES : expense.type === 'Other Business' ? OTHER_BUSINESS_CATEGORIES : PERSONAL_CATEGORIES;
    const [formData, setFormData] = useState({
        ...expense,
        amount: expense.amount.toString(),
        status: expense.status || 'Paid'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label>Description</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                </div>
                <div>
                    <Label>Cost ({currency})</Label>
                    <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                </div>
            </div>
            <div>
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            
            <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-xl">
                     <input 
                        type="checkbox" 
                        id="recurring" 
                        checked={formData.isRecurring} 
                        onChange={e => setFormData({...formData, isRecurring: e.target.checked})} 
                        className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500"
                     />
                     <label htmlFor="recurring" className="text-xs font-bold text-slate-400">Recurring Bill?</label>
                </div>

                {formData.isRecurring && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl ml-4">
                        <input 
                            type="checkbox" 
                            id="status" 
                            checked={formData.status === 'Paid'} 
                            onChange={e => setFormData({...formData, status: e.target.checked ? 'Paid' : 'Pending'})} 
                            className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                        />
                        <label htmlFor="status" className="text-xs font-bold text-emerald-400">Mark as Paid</label>
                    </div>
                )}
            </div>

            <div className="flex space-x-3 pt-6">
                <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-rose-500/20">Update</button>
            </div>
        </form>
    );
};

export const DebtForm: React.FC<{ onSave: (d: any) => void, onCancel: () => void, currency: string, defaultType?: DebtType, projects?: Project[] }> = ({ onSave, onCancel, currency, defaultType, projects = [] }) => {
    const [formData, setFormData] = useState({
        personName: '',
        amount: '',
        type: (defaultType || 'I Owe') as DebtType,
        startDate: formatDate(new Date().toISOString()),
        dueDate: '',
        notes: '',
        status: 'Unpaid',
        payments: [],
        isRecurring: false,
        projectId: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Person / Entity</Label>
                    <Input placeholder="NAME" value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} required />
                </div>
                <div>
                    <Label>Type</Label>
                    <Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as DebtType})}>
                        <option value="Owes Me">They Owe Me</option>
                        <option value="I Owe">I Owe Them</option>
                    </Select>
                </div>
            </div>
            <div>
                <Label>Related Project (Optional)</Label>
                <Select value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}>
                    <option value="">-- Personal / General --</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </Select>
            </div>
            <div>
                <Label>Total Amount ({currency})</Label>
                <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                </div>
                <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required />
                </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-xl">
                 <input 
                    type="checkbox" 
                    id="debtRecurring" 
                    checked={formData.isRecurring} 
                    onChange={e => setFormData({...formData, isRecurring: e.target.checked})} 
                    className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500"
                 />
                 <label htmlFor="debtRecurring" className="text-xs font-bold text-slate-400">Recurring Monthly Bill?</label>
            </div>
            <div>
                <Label>Notes</Label>
                <TextArea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <div className="flex space-x-3 pt-6">
                <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-teal-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-teal-500/20">Create Record</button>
            </div>
        </form>
    );
};

export const DebtPaymentForm: React.FC<{ debt: Debt, onSave: (p: any) => void, onCancel: () => void, currency: string }> = ({ debt, onSave, onCancel, currency }) => {
    const [formData, setFormData] = useState({
        amount: '',
        date: formatDate(new Date().toISOString()),
        note: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, amount: Number(formData.amount) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div className="bg-slate-800 p-4 rounded-xl mb-4">
                 <p className="text-[10px] uppercase text-slate-500 font-bold">Total Debt</p>
                 <p className="text-lg font-black text-white">{currency} {debt.amount.toLocaleString()}</p>
             </div>
             <div>
                <Label>Payment Amount ({currency})</Label>
                <Input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
            </div>
             <div>
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div>
                <Label>Note (Optional)</Label>
                <Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
            </div>
            <div className="flex space-x-3 pt-6">
                <button type="button" onClick={onCancel} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-emerald-500/20">Record Payment</button>
            </div>
        </form>
    );
};
