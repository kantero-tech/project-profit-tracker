
import React, { useState, useMemo } from 'react';
import { Project, Expense, Income, ProjectStatus, AppData } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { PROJECT_STATUS_OPTIONS } from '../constants';
import { ChevronLeftIcon, WalletIcon, ReceiptIcon, SettingsIcon, ProjectsIcon, EditIcon, TrashIcon, DownloadIcon } from './Icons';

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ProjectListItem: React.FC<{ project: Project; incomes: Income[]; expenses: Expense[]; onClick: () => void; currency: string }> = ({ project, incomes, expenses, onClick, currency }) => {
    const totalIncome = incomes.filter(i => i.projectId === project.id).reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.filter(e => e.projectId === project.id).reduce((sum, e) => sum + e.amount, 0);
    const profit = totalIncome - totalExpense;
    const debt = Math.max(0, project.totalValue - totalIncome);
    const progress = project.totalValue > 0 ? (totalIncome / project.totalValue) * 100 : 0;
    
    return (
        <div onClick={onClick} className="bg-slate-900/50 border border-slate-800 p-6 rounded-[32px] hover:border-slate-600 transition-all group cursor-pointer active:scale-[0.98]">
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white text-lg truncate uppercase tracking-tight group-hover:text-teal-400 transition-colors">{project.name}</h3>
                    <p className="text-[10px] text-slate-500 truncate uppercase tracking-[0.2em] font-black mt-1">{project.clientInfo || 'UNSPECIFIED CLIENT'}</p>
                </div>
                <div className={`px-3 py-1.5 text-[8px] font-black rounded-xl uppercase tracking-[0.2em] ml-2 border ${
                    project.status === ProjectStatus.Completed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    project.status === ProjectStatus.Cancelled ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                    {project.status}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-700/20 text-center">
                    <p className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-1">Contract</p>
                    <p className="text-sm font-black text-white truncate">{formatCurrency(project.totalValue, currency)}</p>
                </div>
                <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-700/20 text-center relative overflow-hidden">
                    <p className="text-[7px] text-amber-500 font-black uppercase tracking-widest mb-1">Client Debt</p>
                    <p className={`text-sm font-black truncate ${debt > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
                        {formatCurrency(debt, currency)}
                    </p>
                </div>
                <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-700/20 text-center">
                    <p className="text-[7px] text-rose-500 font-black uppercase tracking-widest mb-1">Spent</p>
                    <p className="text-sm font-black text-rose-400 truncate">{formatCurrency(totalExpense, currency)}</p>
                </div>
                <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-700/20 text-center">
                    <p className="text-[7px] text-emerald-500 font-black uppercase tracking-widest mb-1">Profit</p>
                    <p className={`text-sm font-black truncate ${profit >= 0 ? 'text-emerald-400' : 'text-rose-600'}`}>
                        {formatCurrency(profit, currency)}
                    </p>
                </div>
            </div>
            
            <div className="pt-4 border-t border-slate-800/50">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Payment Progress</span>
                    <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out ${progress >= 100 ? 'bg-emerald-500' : 'bg-teal-500'}`} 
                        style={{ width: `${Math.min(progress, 100)}%` }} 
                    />
                </div>
            </div>
        </div>
    );
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProjectDetail: React.FC<{ 
    project: Project; 
    data: AppData; 
    actions: any; 
    onBack: () => void 
}> = ({ project, data, actions, onBack }) => {
    const pIncomes = useMemo(() => data.incomes.filter(i => i.projectId === project.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [data.incomes, project.id]);
    const pExpenses = useMemo(() => data.expenses.filter(e => e.projectId === project.id), [data.expenses, project.id]);
    
    const totalInc = useMemo(() => pIncomes.reduce((s, i) => s + i.amount, 0), [pIncomes]);
    const totalExp = useMemo(() => pExpenses.reduce((s, e) => s + e.amount, 0), [pExpenses]);
    const debt = Math.max(0, project.totalValue - totalInc);

    const groupedExpenses = useMemo(() => {
        const groups: Record<string, Expense[]> = {};
        pExpenses.forEach(e => {
            const cat = e.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(e);
        });
        // Sort expenses within groups by date descending
        Object.keys(groups).forEach(key => {
            groups[key].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
        return groups;
    }, [pExpenses]);

    const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.text(`Project Report: ${project.name}`, 14, 22);
        
        // Project Info
        doc.setFontSize(11);
        doc.text(`Client: ${project.clientInfo || 'Unspecified'}`, 14, 32);
        doc.text(`Status: ${project.status}`, 14, 38);
        doc.text(`Start Date: ${project.startDate}`, 14, 44);
        if (project.endDate) {
            doc.text(`End Date: ${project.endDate}`, 14, 50);
        }
        
        // Financial Summary
        doc.setFontSize(14);
        doc.text('Financial Summary', 14, 60);
        
        autoTable(doc, {
            startY: 65,
            head: [['Contract Total', 'Total Collected', 'Total Expenses', 'Profit', 'Pending Debt']],
            body: [[
                formatCurrency(project.totalValue, data.currency),
                formatCurrency(totalInc, data.currency),
                formatCurrency(totalExp, data.currency),
                formatCurrency(totalInc - totalExp, data.currency),
                formatCurrency(debt, data.currency)
            ]],
        });

        let finalY = (doc as any).lastAutoTable.finalY || 65;
        
        if (pIncomes.length > 0) {
            doc.setFontSize(14);
            doc.text('Income Log', 14, finalY + 15);
            
            autoTable(doc, {
                startY: finalY + 20,
                head: [['Date', 'Amount', 'Notes']],
                body: pIncomes.map(i => [
                    formatDate(i.date),
                    formatCurrency(i.amount, data.currency),
                    i.note || ''
                ]),
            });
            finalY = (doc as any).lastAutoTable.finalY || finalY + 20;
        }

        if (pExpenses.length > 0) {
            doc.setFontSize(14);
            doc.text('Expense Log', 14, finalY + 15);
            
            autoTable(doc, {
                startY: finalY + 20,
                head: [['Date', 'Category', 'Amount', 'Notes']],
                body: pExpenses.map(e => [
                    formatDate(e.date),
                    e.category || 'General',
                    formatCurrency(e.amount, data.currency),
                    e.note || ''
                ]),
            });
        }

        doc.save(`${project.name.replace(/\s+/g, '_')}_Report.pdf`);
    };

    const handleMarkCompleted = () => {
        setConfirmAction({
            message: 'Mark this project as fully completed?',
            onConfirm: () => {
                actions.updateProject({ 
                    ...project, 
                    status: ProjectStatus.Completed,
                    endDate: formatDate(new Date().toISOString()) 
                });
                setConfirmAction(null);
            }
        });
    };

    const handleDeleteIncome = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (actions.deleteIncome) {
            setConfirmAction({
                message: 'Are you sure you want to delete this income record?',
                onConfirm: () => {
                    actions.deleteIncome(id);
                    setConfirmAction(null);
                }
            });
        }
    };

    const handleDeleteExpense = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (actions.deleteExpense) {
            setConfirmAction({
                message: 'Are you sure you want to delete this expense record?',
                onConfirm: () => {
                    actions.deleteExpense(id);
                    setConfirmAction(null);
                }
            });
        }
    };

    const handleDeleteProject = () => {
        setConfirmAction({
            message: 'Are you sure you want to delete this ENTIRE project? This action cannot be undone and will delete all associated expenses and income records.',
            onConfirm: () => {
                actions.deleteProject(project.id);
                onBack();
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 animate-slide-up overflow-y-auto no-scrollbar pb-24">
            <div className="p-6 lg:p-10 flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-1/3 flex flex-col space-y-8">
                    <div className="flex items-center justify-between">
                        <button onClick={onBack} className="p-3 bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl hover:text-white transition-colors">
                            <ChevronLeftIcon className="h-5 w-5 pointer-events-none" />
                        </button>
                        <div className="flex space-x-2">
                             <button 
                                type="button"
                                onClick={handleExportPDF} 
                                className="flex items-center space-x-2 text-[10px] font-black uppercase text-indigo-400 bg-indigo-400/10 px-4 py-2 rounded-xl border border-indigo-400/20 active:scale-95 transition-transform"
                            >
                                <DownloadIcon className="h-4 w-4 pointer-events-none" />
                                <span className="hidden sm:inline">Export PDF</span>
                            </button>
                             <button 
                                type="button"
                                onClick={() => actions.setModal('editProject', project.id)} 
                                className="flex items-center space-x-2 text-[10px] font-black uppercase text-teal-400 bg-teal-400/10 px-4 py-2 rounded-xl border border-teal-400/20 active:scale-95 transition-transform"
                            >
                                <SettingsIcon className="h-4 w-4 pointer-events-none" />
                                <span className="hidden sm:inline">Modify</span>
                            </button>
                             <button 
                                type="button"
                                onClick={handleDeleteProject} 
                                className="flex items-center space-x-2 text-[10px] font-black uppercase text-rose-400 bg-rose-400/10 px-4 py-2 rounded-xl border border-rose-400/20 active:scale-95 transition-transform"
                            >
                                <TrashIcon className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">{project.name}</h2>
                        <div className="flex items-center space-x-2 mt-2">
                            <span className={`h-2 w-2 rounded-full ${project.status === ProjectStatus.Completed ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{project.status}</p>
                        </div>
                    </div>

                    {/* Outstanding Debt Highlight */}
                    <div className={`p-6 rounded-[24px] border border-slate-800 ${debt > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-900'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client Remaining Debt</p>
                            {debt > 0 && <span className="text-[8px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">PENDING COLLECTION</span>}
                        </div>
                        <p className={`text-3xl font-black ${debt > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                            {formatCurrency(debt, data.currency)}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                            <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase">Contract Total</p>
                                <p className="text-xs font-black text-white">{formatCurrency(project.totalValue, data.currency)}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase">Total Collected</p>
                                <p className="text-xs font-black text-emerald-400">{formatCurrency(totalInc, data.currency)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-3">
                        {project.status === ProjectStatus.Ongoing && (
                            <button onClick={handleMarkCompleted} className="w-full bg-slate-100 p-5 rounded-2xl flex items-center justify-center space-x-3 font-black text-xs uppercase tracking-widest text-slate-900 shadow-xl active:scale-95 transition-transform">
                                <CheckCircleIcon className="h-5 w-5 text-emerald-600 pointer-events-none" />
                                <span>Complete Project Now</span>
                            </button>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => actions.setModal('addIncome', project.id)} className="flex-1 bg-emerald-500 p-4 rounded-2xl flex items-center justify-center space-x-2 font-black text-[10px] uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                                <WalletIcon className="h-4 w-4 pointer-events-none" />
                                <span>Income</span>
                            </button>
                            <button onClick={() => actions.setModal('addExpense', project.id)} className="flex-1 bg-rose-500 p-4 rounded-2xl flex items-center justify-center space-x-2 font-black text-[10px] uppercase tracking-widest text-white shadow-lg shadow-rose-500/20 active:scale-95 transition-transform">
                                <ReceiptIcon className="h-4 w-4 pointer-events-none" />
                                <span>Expense</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 rounded-[24px] bg-slate-900/50 border border-slate-800/50">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3">EXECUTIVE NOTES</p>
                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                            {project.notes || 'No project briefing notes recorded.'}
                        </p>
                    </div>
                </div>

                <div className="flex-1 space-y-10">
                    <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-600 border-b border-slate-800 pb-2 flex justify-between items-center">
                            <span>Income Log</span>
                            <span className="text-emerald-400">+{formatCurrency(totalInc, data.currency)}</span>
                        </h3>
                         {pIncomes.length > 0 ? (
                            <div className="space-y-3">
                                {pIncomes.map(i => (
                                    <div key={i.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group">
                                        <div className="min-w-0 flex-1 mr-4">
                                            <p className="text-xs font-bold text-white uppercase truncate">{i.note || 'Income Received'}</p>
                                            <p className="text-[8px] text-slate-500 font-black uppercase mt-1">{formatDate(i.date)}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <p className="text-xs font-black text-emerald-400">+{formatCurrency(i.amount, data.currency)}</p>
                                            <div className="flex space-x-2">
                                                <button type="button" onClick={() => actions.setModal('editIncome', i.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                    <EditIcon className="h-4 w-4 pointer-events-none" />
                                                </button>
                                                <button type="button" onClick={(e) => handleDeleteIncome(e, i.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center py-6 opacity-20">
                                <p className="text-xs font-black uppercase tracking-widest">No income recorded</p>
                            </div>
                        )}
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-600 border-b border-slate-800 pb-2 flex justify-between items-center">
                            <span>Spending Log</span>
                            <span className="text-rose-400">-{formatCurrency(totalExp, data.currency)}</span>
                        </h3>
                        {/* Expenditure list logic */}
                        {Object.keys(groupedExpenses).length > 0 ? (
                            (Object.entries(groupedExpenses) as [string, Expense[]][]).map(([category, items]) => (
                                <div key={category} className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">{category}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {items.map(t => (
                                            <div key={t.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group">
                                                <div className="min-w-0 flex-1 mr-4">
                                                    <p className="text-xs font-bold text-white uppercase truncate">{t.description}</p>
                                                    <p className="text-[8px] text-slate-500 font-black uppercase mt-1">{formatDate(t.date)}</p>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                     <p className="text-xs font-black text-rose-400">-{formatCurrency(t.amount, data.currency)}</p>
                                                     <div className="flex space-x-1">
                                                        <button type="button" onClick={() => actions.setModal('editExpense', t.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                            <EditIcon className="h-4 w-4 pointer-events-none" />
                                                        </button>
                                                        <button type="button" onClick={(e) => handleDeleteExpense(e, t.id)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-20">
                                <p className="text-xs font-black uppercase tracking-widest">No expenses recorded</p>
                            </div>
                        )}
                    </section>
                </div>
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

const Projects: React.FC<{ data: AppData; actions: any }> = ({ data, actions }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ProjectStatus | 'All'>('All');

  const filtered = useMemo(() => data.projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.clientInfo.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || p.status === filter;
    return matchesSearch && matchesFilter;
  }), [data.projects, search, filter]);

  const selectedProject = useMemo(() => 
    data.projects.find(p => p.id === selectedProjectId) || null,
    [data.projects, selectedProjectId]
  );

  if (selectedProject) {
    return (
        <ProjectDetail 
            project={selectedProject} 
            data={data} 
            actions={actions} 
            onBack={() => setSelectedProjectId(null)} 
        />
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-[1400px] mx-auto animate-slide-up pb-24 overflow-y-auto no-scrollbar h-full">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Portfolio</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">{filtered.length} PROJECTS REGISTERED</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                    {['All', ...PROJECT_STATUS_OPTIONS].map(opt => (
                        <button key={opt} onClick={() => setFilter(opt as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === opt ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                            {opt}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="SEARCH ENTITIES..." 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-700" 
                    />
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {filtered.map(p => (
                <ProjectListItem key={p.id} project={p} incomes={data.incomes} expenses={data.expenses} currency={data.currency} onClick={() => setSelectedProjectId(p.id)} />
            ))}
        </div>
    </div>
  );
};

export default Projects;
