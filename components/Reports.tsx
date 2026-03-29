
import React, { useMemo, useState } from 'react';
import { Project, Expense, Income, GeneralExpense, Debt, ProjectStatus, ExtraIncome } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { TrendingUpIcon, TrendingDownIcon, WalletIcon, ActivityIcon, BuildingIcon, UserIcon, CalendarIcon } from './Icons';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';
import { Filter } from 'lucide-react';

interface ReportsProps {
  projects: Project[];
  expenses: Expense[];
  incomes: Income[];
  generalExpenses: GeneralExpense[];
  debts: Debt[];
  extraIncomes: ExtraIncome[];
  currency: string;
}

const SummaryCard: React.FC<{ title: string; value: number; currency: string; color: string; icon: React.ReactNode }> = ({ title, value, currency, color, icon }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl flex flex-col justify-between">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-1.5 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
        {icon}
      </div>
    </div>
    <div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      <p className={`text-sm font-black mt-0.5 truncate ${value < 0 ? 'text-rose-400' : 'text-white'}`}>
        {formatCurrency(value, currency)}
      </p>
    </div>
  </div>
);

const Reports: React.FC<ReportsProps> = ({ projects, expenses, incomes, generalExpenses, debts, extraIncomes, currency }) => {
    // Date Filtering State
    const [dateFilterType, setDateFilterType] = useState<'all' | 'month' | 'custom'>('month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Filter Data based on Range
    const filteredData = useMemo(() => {
        let start: Date | null = null;
        let end: Date | null = null;

        if (dateFilterType === 'month') {
            const [y, m] = selectedMonth.split('-').map(Number);
            start = new Date(y, m - 1, 1);
            end = new Date(y, m, 0, 23, 59, 59);
        } else if (dateFilterType === 'custom' && customStart && customEnd) {
            start = new Date(customStart);
            end = new Date(customEnd);
            end.setHours(23, 59, 59);
        }

        const isInRange = (dateStr: string) => {
            if (!start || !end) return true;
            const d = new Date(dateStr);
            return d >= start && d <= end;
        };

        const fIncomes = incomes.filter(i => isInRange(i.date));
        const fExtraIncomes = extraIncomes.filter(i => isInRange(i.date));
        const fExpenses = expenses.filter(e => isInRange(e.date));
        const fGeneralExpenses = generalExpenses.filter(e => isInRange(e.date));
        
        // Projects are included if they have activity in this range OR started/ended in this range
        const fProjects = projects.filter(p => {
            if (!start || !end) return true;
            const pStart = new Date(p.startDate);
            const pEnd = p.endDate ? new Date(p.endDate) : new Date();
            // Overlap logic
            return pStart <= end && pEnd >= start;
        });

        return { fIncomes, fExtraIncomes, fExpenses, fGeneralExpenses, fProjects, start, end };
    }, [incomes, extraIncomes, expenses, generalExpenses, projects, dateFilterType, selectedMonth, customStart, customEnd]);

    const stats = useMemo(() => {
        const { fIncomes, fExtraIncomes, fExpenses, fGeneralExpenses, fProjects } = filteredData;

        // 1. Financials
        const projectIncome = fIncomes.reduce((sum, i) => sum + i.amount, 0);
        const extraIncome = fExtraIncomes.reduce((sum, i) => sum + i.amount, 0);
        const projectExpense = fExpenses.reduce((sum, e) => sum + e.amount, 0);
        const projectProfit = projectIncome - projectExpense;

        const businessFixed = fGeneralExpenses.filter(e => e.type === 'Business Fixed').reduce((sum, e) => sum + e.amount, 0);
        const otherBusiness = fGeneralExpenses.filter(e => e.type === 'Other Business').reduce((sum, e) => sum + e.amount, 0);
        const personalExpenses = fGeneralExpenses.filter(e => e.type === 'Personal').reduce((sum, e) => sum + e.amount, 0);

        const netBusinessProfit = projectProfit + extraIncome - businessFixed - otherBusiness;
        const netCashflow = netBusinessProfit - personalExpenses;

        // 2. Project List Analysis
        const projectList = fProjects.map(p => {
            const pInc = fIncomes.filter(i => i.projectId === p.id).reduce((s, i) => s + i.amount, 0);
            const pExp = fExpenses.filter(e => e.projectId === p.id).reduce((s, e) => s + e.amount, 0);
            return {
                ...p,
                periodRevenue: pInc,
                periodExpense: pExp,
                periodProfit: pInc - pExp
            };
        }).sort((a, b) => b.periodRevenue - a.periodRevenue);

        // 3. Client Analysis
        const clientMap = new Map<string, { name: string, count: number, revenue: number, historyCount: number }>();
        
        // Check history for returning status
        const allClientHistory = new Map<string, number>();
        projects.forEach(p => {
            const name = p.clientInfo || 'Unknown';
            allClientHistory.set(name, (allClientHistory.get(name) || 0) + 1);
        });

        fProjects.forEach(p => {
            const name = p.clientInfo || 'Unknown';
            if (!clientMap.has(name)) {
                clientMap.set(name, { 
                    name, 
                    count: 0, 
                    revenue: 0, 
                    historyCount: allClientHistory.get(name) || 0 
                });
            }
            const c = clientMap.get(name)!;
            c.count += 1;
            // Add revenue from this project IN THIS PERIOD
            const pRev = fIncomes.filter(i => i.projectId === p.id).reduce((s, i) => s + i.amount, 0);
            c.revenue += pRev;
        });

        const clientList = Array.from(clientMap.values()).sort((a, b) => b.revenue - a.revenue);

        // 4. Monthly Chart Data (for the selected range)
        // If range is small, show days? For now keep months if range > 1 month, else days?
        // Let's stick to aggregating by day if it's a single month, or month if it's 'all'
        
        const chartDataMap = new Map<string, any>();
        const isSingleMonth = dateFilterType === 'month';

        const addToChart = (dateStr: string, key: string, amount: number) => {
            const d = new Date(dateStr);
            let k = '';
            let label = '';

            if (isSingleMonth) {
                k = `${d.getDate()}`;
                label = `${d.getDate()}`;
            } else {
                k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            }

            if (!chartDataMap.has(k)) {
                chartDataMap.set(k, { label, income: 0, expense: 0 });
            }
            chartDataMap.get(k)[key] += amount;
        };

        fIncomes.forEach(i => addToChart(i.date, 'income', i.amount));
        fExtraIncomes.forEach(i => addToChart(i.date, 'income', i.amount));
        fExpenses.forEach(e => addToChart(e.date, 'expense', e.amount));
        fGeneralExpenses.forEach(e => addToChart(e.date, 'expense', e.amount));

        const chartData = Array.from(chartDataMap.values());
        // Sort? Map keys are not sorted.
        // If single month, sort by day number.
        if (isSingleMonth) {
            chartData.sort((a, b) => Number(a.label) - Number(b.label));
        } else {
            // Sort by date string logic if needed, but here label is formatted. 
            // Simplified: just rely on input order or re-sort if needed.
        }

        // 5. Debts Summary
        const activeDebts = debts.filter(d => {
            const payments = d.payments || [];
            const paid = payments.reduce((s, p) => s + p.amount, 0);
            return d.amount - paid > 0;
        });

        const totalOwedToMe = activeDebts.filter(d => d.type === 'Owes Me').reduce((sum, d) => {
            const payments = d.payments || [];
            const paid = payments.reduce((s, p) => s + p.amount, 0);
            return sum + (d.amount - paid);
        }, 0);

        const totalIOwe = activeDebts.filter(d => d.type === 'I Owe').reduce((sum, d) => {
            const payments = d.payments || [];
            const paid = payments.reduce((s, p) => s + p.amount, 0);
            return sum + (d.amount - paid);
        }, 0);

        return {
            projectIncome, extraIncome, projectExpense, projectProfit,
            businessFixed, otherBusiness, personalExpenses, netBusinessProfit, netCashflow,
            projectList, clientList, chartData,
            totalOwedToMe, totalIOwe, activeDebts
        };
    }, [filteredData, projects, debts]);
    
    return (
        <div className="h-full print:h-auto flex flex-col bg-slate-950 overflow-hidden print:overflow-visible relative">
            <header className="px-6 py-6 shrink-0 space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-white leading-none">Financial Reports</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                            {dateFilterType === 'all' ? 'All Time' : 
                             dateFilterType === 'month' ? new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) :
                             'Custom Range'}
                        </p>
                    </div>
                    <div className="flex space-x-2 print:hidden">
                        <button onClick={() => window.print()} className="bg-slate-900 border border-slate-800 text-teal-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl active:scale-95 transition-transform">
                            Print
                        </button>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 print:hidden">
                    <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                        <button onClick={() => setDateFilterType('month')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dateFilterType === 'month' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Month</button>
                        <button onClick={() => setDateFilterType('custom')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dateFilterType === 'custom' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Range</button>
                        <button onClick={() => setDateFilterType('all')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dateFilterType === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>All Time</button>
                    </div>

                    {dateFilterType === 'month' && (
                        <input 
                            type="month" 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500"
                        />
                    )}

                    {dateFilterType === 'custom' && (
                        <div className="flex items-center space-x-2">
                            <input 
                                type="date" 
                                value={customStart} 
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500"
                            />
                            <span className="text-slate-600">-</span>
                            <input 
                                type="date" 
                                value={customEnd} 
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-teal-500"
                            />
                        </div>
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto print:overflow-visible no-scrollbar px-6 pb-24 space-y-6">
                {/* Top Level KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <SummaryCard title="Project Rev" value={stats.projectIncome} currency={currency} color="text-teal-400 bg-teal-500" icon={<TrendingUpIcon className="h-4 w-4" />} />
                    <SummaryCard title="Extra Income" value={stats.extraIncome} currency={currency} color="text-emerald-400 bg-emerald-500" icon={<WalletIcon className="h-4 w-4" />} />
                    <SummaryCard title="Expenses" value={stats.projectExpense + stats.businessFixed + stats.otherBusiness} currency={currency} color="text-rose-400 bg-rose-500" icon={<TrendingDownIcon className="h-4 w-4" />} />
                    <SummaryCard title="Net Profit" value={stats.netBusinessProfit} currency={currency} color="text-emerald-400 bg-emerald-500" icon={<ActivityIcon className="h-4 w-4" />} />
                    <SummaryCard title="Cashflow" value={stats.netCashflow} currency={currency} color="text-amber-400 bg-amber-500" icon={<WalletIcon className="h-4 w-4" />} />
                </div>

                {/* JOBS / PROJECTS LIST */}
                <section className="bg-slate-900/40 border border-slate-800 p-5 rounded-[24px]">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Jobs & Projects Activity</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    <th className="pb-3 pl-2">Job Name</th>
                                    <th className="pb-3">Client</th>
                                    <th className="pb-3 text-right">Revenue</th>
                                    <th className="pb-3 text-right">Expenses</th>
                                    <th className="pb-3 text-right pr-2">Profit</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-bold text-slate-300">
                                {stats.projectList.length > 0 ? stats.projectList.map(p => (
                                    <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 pl-2">
                                            <div className="text-white">{p.name}</div>
                                            <div className="text-[8px] text-slate-600 uppercase font-black">{p.status}</div>
                                        </td>
                                        <td className="py-3 text-slate-400">{p.clientInfo}</td>
                                        <td className="py-3 text-right text-emerald-400">{formatCurrency(p.periodRevenue, currency)}</td>
                                        <td className="py-3 text-right text-rose-400">{formatCurrency(p.periodExpense, currency)}</td>
                                        <td className="py-3 text-right pr-2 text-white">{formatCurrency(p.periodProfit, currency)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-[10px] uppercase text-slate-600">No jobs active in this period</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* CLIENT ANALYSIS & DEBTS SUMMARY */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-[24px]">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Client Analysis</h3>
                        <div className="space-y-3">
                            {stats.clientList.length > 0 ? stats.clientList.map((c, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs">
                                            {c.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white">{c.name}</p>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-[8px] text-slate-500 font-black uppercase">{c.count} Jobs</span>
                                                {c.historyCount > 1 && <span className="text-[7px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-black">Returning</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-emerald-400">{formatCurrency(c.revenue, currency)}</p>
                                </div>
                            )) : (
                                <p className="text-center text-[10px] uppercase text-slate-600 py-6">No clients in this period</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-[24px]">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Debts Summary</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Owed To Me</p>
                                <p className="text-lg font-black text-emerald-400 mt-1">{formatCurrency(stats.totalOwedToMe, currency)}</p>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">I Owe</p>
                                <p className="text-lg font-black text-rose-400 mt-1">{formatCurrency(stats.totalIOwe, currency)}</p>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-2">
                            {stats.activeDebts.length > 0 ? stats.activeDebts.map(debt => {
                                const payments = debt.payments || [];
                                const paid = payments.reduce((s, p) => s + p.amount, 0);
                                const remaining = debt.amount - paid;
                                return (
                                    <div key={debt.id} className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                        <div>
                                            <p className="text-xs font-bold text-white">{debt.personName}</p>
                                            <p className="text-[9px] text-slate-500 uppercase">{debt.type}</p>
                                        </div>
                                        <p className={`text-sm font-black ${debt.type === 'Owes Me' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatCurrency(remaining, currency)}
                                        </p>
                                    </div>
                                );
                            }) : (
                                <p className="text-center text-[10px] uppercase text-slate-600 py-4">No active debts</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* FINANCIAL TREND */}
                <section className="grid grid-cols-1 gap-6">
                    <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-[24px]">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Financial Trend</h3>
                        <div className="h-48 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData}>
                                    <XAxis dataKey="label" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        cursor={{fill: '#1e293b', opacity: 0.4}}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                                        itemStyle={{ fontWeight: 800 }}
                                    />
                                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                                    <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Reports;
