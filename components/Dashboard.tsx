
import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { Project, Expense, Income, GeneralExpense, Debt, ProjectStatus, ExtraIncome } from '../types';
import { formatCurrency } from '../utils/helpers';
import { TrendingUpIcon, WalletIcon, TrendingDownIcon, BuildingIcon, HandshakeIcon, ActivityIcon } from './Icons';

interface DashboardProps {
  projects: Project[];
  expenses: Expense[];
  incomes: Income[];
  generalExpenses: GeneralExpense[];
  debts: Debt[];
  extraIncomes: ExtraIncome[];
  currency: string;
}

const StatCard: React.FC<{ title: string; value: string | number; subText?: string; icon: React.ReactNode; color: string; currency?: string; badge?: string }> = ({ title, value, subText, icon, color, currency = 'RWF', badge }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-[24px] flex flex-col justify-between relative overflow-hidden group min-h-[110px]">
    {badge && <div className="absolute top-3 right-3 text-[7px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase z-10">{badge}</div>}
    <div className="flex justify-between items-start mb-2 relative z-10">
      <div className={`p-2 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
        {icon}
      </div>
      {subText && <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1 text-right max-w-[50%] leading-tight">{subText}</span>}
    </div>
    <div className="relative z-10 mt-auto">
      <p className="text-[8px] uppercase tracking-wider text-slate-500 font-black mb-0.5 truncate">{title}</p>
      <p className="text-[10px] sm:text-xs md:text-sm font-black text-white truncate leading-none" title={typeof value === 'number' ? formatCurrency(value, currency) : value}>
        {typeof value === 'number' ? formatCurrency(value, currency) : value}
      </p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ projects, expenses, incomes, generalExpenses, debts, extraIncomes, currency }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // --- 1. PROJECT COUNTS ---
    const totalProjects = projects.length;
    const finishedProjects = projects.filter(p => p.status === ProjectStatus.Completed).length;
    const activeProjects = projects.filter(p => p.status === ProjectStatus.Ongoing).length;
    const cancelledProjects = projects.filter(p => p.status === ProjectStatus.Cancelled).length;

    // --- 2. INCOME & EXPENSE SPLIT (ALL TIME) ---
    // Gross Revenue (Project Income)
    const grossIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    // Extra Income
    const extraIncomeTotal = extraIncomes.reduce((sum, i) => sum + i.amount, 0);

    // Project Expenses (Direct Costs)
    const projectExpensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    // General Expenses (Overhead + Personal)
    const generalExpensesTotal = generalExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Total All Expenses
    const totalAllExpenses = projectExpensesTotal + generalExpensesTotal;

    // True Net Profit
    const netProfitAllTime = grossIncome + extraIncomeTotal - totalAllExpenses;


    // --- 3. LIABILITIES & FORECASTING ---
    // Debts (Payables - I Owe)
    const calculateRemaining = (d: Debt) => {
        const payments = d.payments || [];
        return d.amount - payments.reduce((s, p) => s + p.amount, 0);
    };

    const iOweDebts = debts.filter(d => d.type === 'I Owe');
    const totalDebtPayables = iOweDebts.reduce((sum, d) => sum + calculateRemaining(d), 0);

    // Debt Breakdown
    const projectDebtsOwe = debts
        .filter(d => d.type === 'I Owe' && d.projectId && calculateRemaining(d) > 0)
        .reduce((sum, d) => sum + calculateRemaining(d), 0);

    const otherDebtsOwe = debts
        .filter(d => d.type === 'I Owe' && !d.projectId && calculateRemaining(d) > 0)
        .reduce((sum, d) => sum + calculateRemaining(d), 0);

    const projectDebtsOwesMe = debts
        .filter(d => d.type === 'Owes Me' && d.projectId && calculateRemaining(d) > 0)
        .reduce((sum, d) => sum + calculateRemaining(d), 0);

    const otherDebtsOwesMe = debts
        .filter(d => d.type === 'Owes Me' && !d.projectId && calculateRemaining(d) > 0)
        .reduce((sum, d) => sum + calculateRemaining(d), 0);

    // Estimated Upcoming Bills (Monthly Expenses Left to Pay)
    // Logic: Find recurring templates, check if they exist in current month. If not, add to estimate.
    const recurringMap = new Map<string, number>();
    generalExpenses.filter(e => e.isRecurring).forEach(e => {
        // Keep the most recent amount for this expense name
        recurringMap.set(e.name, e.amount);
    });

    let estBillsRemaining = 0;
    recurringMap.forEach((amount, name) => {
        // Check if we have an entry for this name in the current month
        const hasPaidThisMonth = generalExpenses.some(e => {
            const d = new Date(e.date);
            return e.name === name && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        if (!hasPaidThisMonth) {
            estBillsRemaining += amount;
        }
    });


    // --- 4. MONTHLY SNAPSHOT ---
    const monthIncomes = incomes.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthExtraIncomes = extraIncomes.filter(i => {
      const d = new Date(i.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthProjectExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthGeneralExpenses = generalExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const monthRevenue = monthIncomes.reduce((s, i) => s + i.amount, 0) + monthExtraIncomes.reduce((s, i) => s + i.amount, 0);
    const monthProjSpend = monthProjectExpenses.reduce((s, e) => s + e.amount, 0);
    const monthGenSpend = monthGeneralExpenses.reduce((s, e) => s + e.amount, 0);
    const monthTotalSpend = monthProjSpend + monthGenSpend;
    const monthNetProfit = monthRevenue - monthTotalSpend;

    // --- 5. CHART DATA (Last 6 Months Net Profit) ---
    const chartData: any[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthIdx = d.getMonth();
        const yearIdx = d.getFullYear();
        const label = d.toLocaleString('default', { month: 'short' });

        const mInc = incomes.filter(x => new Date(x.date).getMonth() === monthIdx && new Date(x.date).getFullYear() === yearIdx).reduce((s,x) => s + x.amount, 0);
        const mExtraInc = extraIncomes.filter(x => new Date(x.date).getMonth() === monthIdx && new Date(x.date).getFullYear() === yearIdx).reduce((s,x) => s + x.amount, 0);
        const mExpP = expenses.filter(x => new Date(x.date).getMonth() === monthIdx && new Date(x.date).getFullYear() === yearIdx).reduce((s,x) => s + x.amount, 0);
        const mExpG = generalExpenses.filter(x => new Date(x.date).getMonth() === monthIdx && new Date(x.date).getFullYear() === yearIdx).reduce((s,x) => s + x.amount, 0);
        
        chartData.push({ name: label, value: mInc + mExtraInc - (mExpP + mExpG) });
    }

    // --- 6. PROJECT GROWTH (Cumulative Revenue & Profit) ---
    const growthData: any[] = [];
    
    // Calculate base (everything before 6 months ago)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of that month
    
    let accRevenue = incomes.filter(i => i.projectId && new Date(i.date) < sixMonthsAgo).reduce((s, i) => s + i.amount, 0);
    let accExpenses = expenses.filter(e => e.projectId && new Date(e.date) < sixMonthsAgo).reduce((s, e) => s + e.amount, 0);

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthIdx = d.getMonth();
        const yearIdx = d.getFullYear();
        const label = d.toLocaleString('default', { month: 'short' });

        // Monthly Project Income/Expenses
        const mInc = incomes.filter(x => x.projectId && new Date(x.date).getMonth() === monthIdx && new Date(x.date).getFullYear() === yearIdx).reduce((s,x) => s + x.amount, 0);
        const mExp = expenses.filter(x => x.projectId && new Date(x.date).getMonth() === monthIdx && new Date(x.date).getFullYear() === yearIdx).reduce((s,x) => s + x.amount, 0);
        
        accRevenue += mInc;
        accExpenses += mExp;

        growthData.push({
            name: label,
            revenue: accRevenue,
            profit: accRevenue - accExpenses
        });
    }

    return { 
      totalProjects, finishedProjects, activeProjects,
      grossIncome, extraIncomeTotal, projectExpensesTotal, generalExpensesTotal, netProfitAllTime,
      totalDebtPayables, estBillsRemaining,
      projectDebtsOwe, otherDebtsOwe, projectDebtsOwesMe, otherDebtsOwesMe,
      monthRevenue, monthTotalSpend, monthNetProfit, monthProjSpend, monthGenSpend,
      chartData, growthData
    };
  }, [incomes, expenses, generalExpenses, projects, debts, extraIncomes]);

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-24">
          
          {/* Header */}
          <div className="flex flex-col">
              <h1 className="text-3xl font-black text-white tracking-tight">Executive Dashboard</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Full Business Overview</p>
          </div>

          {/* SECTION 1: PROJECT COUNTERS (ACCURATE) */}
          <section className="grid grid-cols-3 gap-3">
               <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-[24px] text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Executed</p>
                    <p className="text-2xl font-black text-white">{stats.totalProjects}</p>
               </div>
               <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-[24px] text-center">
                    <p className="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest mb-1">Finished</p>
                    <p className="text-2xl font-black text-emerald-400">{stats.finishedProjects}</p>
               </div>
               <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-[24px] text-center">
                    <p className="text-[8px] font-black text-blue-500/70 uppercase tracking-widest mb-1">Active</p>
                    <p className="text-2xl font-black text-blue-400">{stats.activeProjects}</p>
               </div>
          </section>

          {/* SECTION 2: HERO NET INCOME (ALL TIME) */}
          <section className="bg-gradient-to-br from-teal-600 to-emerald-800 p-6 rounded-[32px] shadow-2xl shadow-emerald-900/20 relative overflow-hidden group">
               <div className="absolute -right-6 -bottom-6 opacity-20">
                    <WalletIcon className="h-48 w-48 text-white rotate-12" />
               </div>
               <div className="relative z-10">
                   <div className="flex justify-between items-start">
                       <div>
                           <p className="text-emerald-100/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">True Net Income (All Time)</p>
                           <h2 className="text-4xl font-black text-white">{formatCurrency(stats.netProfitAllTime, currency)}</h2>
                       </div>
                   </div>
                   <div className="mt-4 pt-4 border-t border-emerald-400/30 flex space-x-6">
                       <div>
                           <p className="text-[8px] font-black text-emerald-200 uppercase tracking-widest">Project Rev</p>
                           <p className="text-sm font-black text-white">{formatCurrency(stats.grossIncome, currency)}</p>
                       </div>
                       <div>
                           <p className="text-[8px] font-black text-emerald-200 uppercase tracking-widest">Extra Income</p>
                           <p className="text-sm font-black text-white">+{formatCurrency(stats.extraIncomeTotal, currency)}</p>
                       </div>
                       <div>
                           <p className="text-[8px] font-black text-emerald-200 uppercase tracking-widest">Total Spent</p>
                           <p className="text-sm font-black text-white opacity-80">-{formatCurrency(stats.projectExpensesTotal + stats.generalExpensesTotal, currency)}</p>
                       </div>
                   </div>
               </div>
          </section>

          {/* SECTION 3: PROJECT GROWTH CHART */}
          <section className="bg-slate-900/40 border border-slate-800 p-5 rounded-[24px]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Project Growth (Cumulative)</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.growthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} dy={10} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                            itemStyle={{ fontWeight: 800 }}
                            formatter={(value: number) => [formatCurrency(value, currency), '']}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#14b8a6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#fbbf24" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
              </div>
          </section>

          {/* SECTION 4: EXPENSE DIFFERENTIATION (ALL TIME) */}
          <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 px-1">Expense Breakdown (All Time)</h3>
              <div className="grid grid-cols-2 gap-3">
                    <StatCard 
                    title="Project Costs" 
                    value={stats.projectExpensesTotal} 
                    color="text-amber-400 bg-amber-500" 
                    icon={<BuildingIcon className="h-4 w-4" />} 
                    subText="Materials, Labor, etc."
                    currency={currency}
                    />
                    <StatCard 
                    title="Overhead / Personal" 
                    value={stats.generalExpensesTotal} 
                    color="text-rose-400 bg-rose-500" 
                    icon={<ActivityIcon className="h-4 w-4" />} 
                    subText="Fixed, Other & Personal"
                    currency={currency}
                    />
              </div>
          </section>

          {/* SECTION 5: DEBT PORTFOLIO */}
          <section>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 px-1">Debt Portfolio</h3>
              <div className="grid grid-cols-2 gap-3">
                  {/* I OWE */}
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-[24px] space-y-3">
                      <div className="flex items-center space-x-2 mb-2">
                          <TrendingDownIcon className="h-4 w-4 text-rose-500" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-rose-400">Total I Owe</p>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Project Related</span>
                          <span className="text-xs font-black text-white">{formatCurrency(stats.projectDebtsOwe, currency)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Other / Personal</span>
                          <span className="text-xs font-black text-white">{formatCurrency(stats.otherDebtsOwe, currency)}</span>
                      </div>
                  </div>

                  {/* OWES ME */}
                  <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-[24px] space-y-3">
                      <div className="flex items-center space-x-2 mb-2">
                          <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Total Owes Me</p>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Project Related</span>
                          <span className="text-xs font-black text-white">{formatCurrency(stats.projectDebtsOwesMe, currency)}</span>
                      </div>
                      <div className="flex justify-between items-end">
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Other / Personal</span>
                          <span className="text-xs font-black text-white">{formatCurrency(stats.otherDebtsOwesMe, currency)}</span>
                      </div>
                  </div>
              </div>
          </section>

          {/* SECTION 6: LIABILITIES & FORECASTING */}
          <section className="bg-slate-900/40 border border-slate-800 p-5 rounded-[24px]">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Pending Payments</h3>
               <div className="grid grid-cols-2 gap-4 divide-x divide-slate-800">
                   <div className="pr-2">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Outstanding Debts</p>
                       <p className="text-xl font-black text-rose-400">{formatCurrency(stats.totalDebtPayables, currency)}</p>
                       <p className="text-[8px] text-slate-600 mt-1 font-bold">Money I Owe</p>
                   </div>
                   <div className="pl-6">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Est. Upcoming Bills</p>
                       <p className={`text-xl font-black ${stats.estBillsRemaining > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                           {formatCurrency(stats.estBillsRemaining, currency)}
                       </p>
                       <p className="text-[8px] text-slate-600 mt-1 font-bold">Recurring items not yet paid this month</p>
                   </div>
               </div>
          </section>

          {/* SECTION 7: MONTHLY SNAPSHOT */}
          <section className="space-y-3 pt-2">
                <div className="flex justify-between items-center px-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">This Month's Performance</h3>
                    <span className="text-[8px] font-black text-teal-400 bg-teal-400/10 px-2 py-1 rounded-full uppercase">
                        {new Date().toLocaleString('default', { month: 'long' })}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl">
                         <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Earned</p>
                         <p className="text-xs font-black text-white">{formatCurrency(stats.monthRevenue, currency)}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl">
                         <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Spent</p>
                         <p className="text-xs font-black text-rose-400">{formatCurrency(stats.monthTotalSpend, currency)}</p>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-2xl">
                         <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Net</p>
                         <p className={`text-xs font-black ${stats.monthNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(stats.monthNetProfit, currency)}</p>
                    </div>
                </div>
          </section>

          {/* SECTION 8: 6 MONTH PROFIT TREND */}
          <section className="bg-slate-900/40 border border-slate-800 p-5 rounded-[24px]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Net Profit Trend (6m)</h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chartData}>
                        <defs>
                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }}
                            itemStyle={{ fontWeight: 800 }}
                            formatter={(value: number) => [formatCurrency(value, currency), 'Net Profit']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </section>

      </div>
    </div>
  );
};

export default Dashboard;
