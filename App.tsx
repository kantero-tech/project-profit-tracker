
import React, { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Reports from './components/Reports';
import Settings from './components/Settings';
import GeneralExpenses from './components/GeneralExpenses';
import Debts from './components/Debts';
import ExtraIncomeView from './components/ExtraIncomeView';
import { AiAssistant } from './components/AiAssistant';
import { ProjectForm, IncomeForm, ExpenseForm, EditProjectForm, EditIncomeForm, EditExpenseForm, GeneralExpenseForm, EditGeneralExpenseForm, DebtForm, DebtPaymentForm, ExtraIncomeForm, EditExtraIncomeForm } from './components/Forms';
import { DashboardIcon, ProjectsIcon, ReportsIcon, SettingsIcon, PlusIcon, BuildingIcon, HandshakeIcon, WalletIcon } from './components/Icons';
import { Sparkles } from 'lucide-react';
import { APP_NAME } from './constants';
import { ExpenseType, DebtType } from './types';

type View = 'dashboard' | 'projects' | 'expenses' | 'debts' | 'extra_income' | 'reports' | 'settings';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [modal, setModal] = useState<{ type: string, targetId?: string, extraData?: any } | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAiAssistant, setShowAiAssistant] = useState(false);
    const { data, ...actions } = useAppData();

    // Generate Virtual Debts from Projects
    const projectDebts: any[] = data.projects.map(project => {
        const projectIncomes = data.incomes.filter(i => i.projectId === project.id);
        const totalPaid = projectIncomes.reduce((sum, i) => sum + i.amount, 0);
        
        // Only show if there is an outstanding balance
        // Or should we show all? Let's show all active ones (where totalValue > totalPaid)
        // Actually, user wants to see them.
        
        const payments = projectIncomes.map(i => ({
            id: i.id,
            amount: i.amount,
            date: i.date,
            note: i.note
        }));

        return {
            id: `PROJ_${project.id}`,
            projectId: project.id,
            personName: project.name, // Display Project Name as "Person"
            amount: project.totalValue,
            type: 'Owes Me', // Projects always owe ME money (revenue)
            dueDate: project.endDate || '',
            startDate: project.startDate,
            status: totalPaid >= project.totalValue ? 'Paid' : 'Unpaid',
            notes: `Project Client: ${project.clientInfo}`,
            payments: payments,
            isRecurring: false
        };
    }).filter(d => d.amount > 0); // Only valid projects

    // Combine manual debts and project debts
    const displayedDebts = [...data.debts, ...projectDebts];

    const appActions = {
        ...actions,
        setModal: (type: string, targetId?: string) => setModal({ type, targetId })
    };

    const handleSettleDebt = (id: string, amount: number) => {
        if (id.startsWith('PROJ_')) {
            // It's a project debt. Settle means adding an Income record.
            const projectId = id.replace('PROJ_', '');
            actions.addIncome({
                projectId,
                amount,
                date: new Date().toISOString(),
                note: 'Settled via Debt Quick Action'
            });
            return;
        }

        // 1. Record the payment to close the current debt
        actions.addDebtPayment(id, {
            amount,
            date: new Date().toISOString(),
            note: 'Settled via Quick Action'
        });

        // 2. Check if recurring and create next month's entry
        const debt = data.debts.find(d => d.id === id);
        if (debt && debt.isRecurring) {
            // Calculate next month dates
            const nextDueDate = new Date(debt.dueDate);
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            
            const nextStartDate = new Date(debt.startDate);
            nextStartDate.setMonth(nextStartDate.getMonth() + 1);

            actions.addDebt({
                personName: debt.personName,
                amount: debt.amount,
                type: debt.type,
                startDate: nextStartDate.toISOString(), // keep existing date format if implicit, but toISOString is safer for storage
                dueDate: nextDueDate.toISOString(),
                notes: debt.notes,
                status: 'Unpaid',
                payments: [],
                isRecurring: true
            });
        }
    };

    const handleAddDebtPayment = (id: string, payload: any) => {
        if (id.startsWith('PROJ_')) {
             const projectId = id.replace('PROJ_', '');
             actions.addIncome({
                 projectId,
                 amount: payload.amount,
                 date: payload.date,
                 note: payload.note
             });
        } else {
            actions.addDebtPayment(id, payload);
        }
    };

    const handleDeleteDebt = (id: string) => {
        if (id.startsWith('PROJ_')) {
            return;
        }
        actions.deleteDebt(id);
    };

    const handleModalSave = (payload: any) => {
        if (!modal) return;
        
        switch (modal.type) {
            case 'addProject':
                actions.addProject(payload);
                break;
            case 'editProject':
                actions.updateProject(payload);
                break;
            case 'addIncome':
                actions.addIncome(payload);
                break;
            case 'editIncome':
                actions.updateIncome(payload);
                break;
            case 'addExpense':
                actions.addExpense(payload);
                break;
            case 'editExpense':
                actions.updateExpense(payload);
                break;
            case 'addGeneralExpense':
                actions.addGeneralExpense(payload);
                break;
            case 'editGeneralExpense':
                actions.updateGeneralExpense(payload);
                break;
            case 'addDebt':
                actions.addDebt(payload);
                break;
            case 'addDebtPayment':
                if (modal.targetId) handleAddDebtPayment(modal.targetId, payload);
                break;
            case 'addExtraIncome':
                actions.addExtraIncome(payload);
                break;
            case 'editExtraIncome':
                actions.updateExtraIncome(payload);
                break;
        }
        setModal(null);
    };

    const renderModalContent = () => {
        if (!modal) return null;

        switch (modal.type) {
            case 'addProject':
                return <ProjectForm currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} />;
            case 'editProject':
                const projectToEdit = data.projects.find(p => p.id === modal.targetId);
                if (!projectToEdit) return null;

                const pIncomes = data.incomes.filter(i => i.projectId === projectToEdit.id).reduce((s, i) => s + i.amount, 0);
                const pExpenses = data.expenses.filter(e => e.projectId === projectToEdit.id).reduce((s, e) => s + e.amount, 0);
                const pDebts = data.debts.filter(d => d.projectId === projectToEdit.id && d.type === 'I Owe').reduce((s, d) => {
                    const payments = d.payments || [];
                    return s + (d.amount - payments.reduce((ps, p) => ps + p.amount, 0));
                }, 0);
                const pProfit = pIncomes - pExpenses;
                const activeProjectDebts = data.debts.filter(d => {
                    if (d.projectId !== projectToEdit.id) return false;
                    const payments = d.payments || [];
                    const paid = payments.reduce((ps, p) => ps + p.amount, 0);
                    return d.amount - paid > 0;
                });

                return <EditProjectForm 
                    project={projectToEdit} 
                    currency={data.currency} 
                    onSave={handleModalSave} 
                    onCancel={() => setModal(null)} 
                    stats={{
                        income: pIncomes,
                        expenses: pExpenses,
                        debts: pDebts,
                        profit: pProfit
                    }}
                    debtsList={activeProjectDebts}
                />;
            case 'addIncome':
                return <IncomeForm projectId={modal.targetId!} currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} />;
            case 'editIncome':
                const incomeToEdit = data.incomes.find(i => i.id === modal.targetId);
                return incomeToEdit ? <EditIncomeForm income={incomeToEdit} currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} /> : null;
            case 'addExpense':
                return <ExpenseForm projectId={modal.targetId!} categories={data.expenseCategories} currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} />;
            case 'editExpense':
                const expenseToEdit = data.expenses.find(e => e.id === modal.targetId);
                return expenseToEdit ? <EditExpenseForm expense={expenseToEdit} categories={data.expenseCategories} currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} /> : null;
            case 'addGeneralExpense':
                return <GeneralExpenseForm type={modal.extraData?.type} currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} />;
            case 'editGeneralExpense':
                const genExpenseToEdit = data.generalExpenses.find(e => e.id === modal.targetId);
                return genExpenseToEdit ? <EditGeneralExpenseForm expense={genExpenseToEdit} currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} /> : null;
            case 'addDebt':
                return <DebtForm currency={data.currency} defaultType={modal.extraData?.type} projects={data.projects} onSave={handleModalSave} onCancel={() => setModal(null)} />;
            case 'addDebtPayment':
                const debt = data.debts.find(d => d.id === modal.targetId);
                return debt ? <DebtPaymentForm debt={debt} currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} /> : null;
            case 'addExtraIncome':
                return <ExtraIncomeForm currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} />;
            case 'editExtraIncome':
                const extraIncomeToEdit = data.extraIncomes.find(i => i.id === modal.targetId);
                return extraIncomeToEdit ? <EditExtraIncomeForm income={extraIncomeToEdit} currency={data.currency} onSave={handleModalSave} onCancel={() => setModal(null)} /> : null;
            default:
                return null;
        }
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return (
                    <Dashboard 
                        projects={data.projects} 
                        expenses={data.expenses} 
                        incomes={data.incomes} 
                        generalExpenses={data.generalExpenses}
                        debts={data.debts}
                        extraIncomes={data.extraIncomes}
                        currency={data.currency} 
                    />
                );
            case 'projects':
                return <Projects data={data} actions={appActions} />;
            case 'expenses':
                return (
                    <GeneralExpenses 
                        expenses={data.generalExpenses} 
                        currency={data.currency} 
                        onAddExpense={(type) => setModal({ type: 'addGeneralExpense', extraData: { type } })} 
                        onEditExpense={(id) => setModal({ type: 'editGeneralExpense', targetId: id })}
                        onDeleteExpense={actions.deleteGeneralExpense}
                        onQuickAdd={(exp) => actions.addGeneralExpense(exp as any)}
                        onUpdateExpense={actions.updateGeneralExpense}
                    />
                );
            case 'debts':
                return (
                    <Debts 
                        debts={displayedDebts} 
                        projects={data.projects}
                        currency={data.currency} 
                        onAddDebt={(type) => setModal({ type: 'addDebt', extraData: { type } })} 
                        onDeleteDebt={handleDeleteDebt}
                        onAddPayment={(id) => setModal({ type: 'addDebtPayment', targetId: id })}
                        onSettle={handleSettleDebt}
                        onUndoSettlement={actions.undoSettlement}
                    />
                );
            case 'extra_income':
                return (
                    <ExtraIncomeView
                        incomes={data.extraIncomes}
                        currency={data.currency}
                        onAddIncome={() => setModal({ type: 'addExtraIncome' })}
                        onEditIncome={(id) => setModal({ type: 'editExtraIncome', targetId: id })}
                        onDeleteIncome={actions.deleteExtraIncome}
                    />
                );
            case 'reports':
                return <Reports projects={data.projects} expenses={data.expenses} incomes={data.incomes} generalExpenses={data.generalExpenses} debts={data.debts} extraIncomes={data.extraIncomes} currency={data.currency} />;
            case 'settings':
                return <Settings expenseCategories={data.expenseCategories} currency={data.currency} fullData={data} {...actions} />;
            default:
                return <Dashboard projects={data.projects} expenses={data.expenses} incomes={data.incomes} generalExpenses={data.generalExpenses} debts={data.debts} extraIncomes={data.extraIncomes} currency={data.currency} />;
        }
    };

    const navItems = [
        { id: 'dashboard' as View, label: 'Dashboard', icon: <DashboardIcon className="h-5 w-5"/> },
        { id: 'projects' as View, label: 'Projects', icon: <ProjectsIcon className="h-5 w-5"/> },
        { id: 'expenses' as View, label: 'Monthly Exp', icon: <BuildingIcon className="h-5 w-5"/> },
        { id: 'extra_income' as View, label: 'Extra Income', icon: <WalletIcon className="h-5 w-5"/> },
        { id: 'debts' as View, label: 'Debts', icon: <HandshakeIcon className="h-5 w-5"/> },
        { id: 'reports' as View, label: 'Reports', icon: <ReportsIcon className="h-5 w-5"/> },
        { id: 'settings' as View, label: 'Settings', icon: <SettingsIcon className="h-5 w-5"/> },
    ];

    return (
        <div className="flex h-[100dvh] print:h-auto bg-slate-950 text-slate-200 overflow-hidden print:overflow-visible select-none">
            {/* Professional Sidebar (Desktop Only) */}
            <aside className="hidden lg:flex print:hidden w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0 z-30 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                <div className="p-8 shrink-0">
                    <h1 className="text-sm font-black uppercase tracking-[0.4em] text-teal-400">{APP_NAME}</h1>
                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">Enterprise Console</p>
                </div>
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
                    {navItems.map(item => (
                        <SideNavItem key={item.id} label={item.label} icon={item.icon} isActive={activeView === item.id} onClick={() => setActiveView(item.id)} />
                    ))}
                </nav>
                <div className="p-4 space-y-2 shrink-0">
                    <button onClick={() => setShowAiAssistant(true)} className="w-full flex items-center justify-center space-x-3 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all font-black text-xs uppercase tracking-widest">
                        <Sparkles className="h-5 w-5" />
                        <span>Ask AI</span>
                    </button>
                    <button onClick={() => setModal({ type: 'addProject' })} className="w-full flex items-center justify-center space-x-3 bg-teal-500 hover:bg-teal-400 text-white p-4 rounded-2xl shadow-xl shadow-teal-900/20 transition-all font-black text-xs uppercase tracking-widest">
                        <PlusIcon className="h-5 w-5" />
                        <span>New Project</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Navigation / Drawer */}
            <div className={`lg:hidden print:hidden fixed inset-0 z-[100] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
                <aside className={`absolute top-0 left-0 h-full w-72 bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center shrink-0">
                        <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-400">{APP_NAME}</h1>
                        <button onClick={() => setIsMenuOpen(false)} className="text-slate-500 font-black text-xs">CLOSE</button>
                    </div>
                    <nav className="p-4 space-y-2 flex-1 overflow-y-auto no-scrollbar">
                        {navItems.map(item => (
                            <SideNavItem key={item.id} label={item.label} icon={item.icon} isActive={activeView === item.id} onClick={() => { setActiveView(item.id); setIsMenuOpen(false); }} />
                        ))}
                    </nav>
                    <div className="p-4 w-full border-t border-slate-800 space-y-2 bg-slate-900 shrink-0">
                        <button onClick={() => { setShowAiAssistant(true); setIsMenuOpen(false); }} className="w-full bg-indigo-600 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center space-x-2">
                            <Sparkles className="h-4 w-4" />
                            <span>Ask AI</span>
                        </button>
                        <button onClick={() => { setModal({ type: 'addProject' }); setIsMenuOpen(false); }} className="w-full bg-teal-500 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-white">
                            New Project
                        </button>
                    </div>
                </aside>
            </div>

            {/* Main Stage */}
            <main className="flex-1 relative overflow-hidden print:overflow-visible flex flex-col">
                {/* Mobile Header */}
                <header className="lg:hidden print:hidden flex flex-col shrink-0 z-20 bg-slate-900/50 backdrop-blur-lg border-b border-slate-800/50 pt-[env(safe-area-inset-top)]">
                    <div className="h-16 flex items-center justify-between px-4">
                        <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-teal-400">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        </button>
                        <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-white opacity-50">{APP_NAME}</h1>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => setShowAiAssistant(true)} className="p-2 text-indigo-400"><Sparkles className="h-5 w-5"/></button>
                            <button onClick={() => setModal({ type: 'addProject' })} className="p-2 -mr-2 text-teal-400"><PlusIcon className="h-6 w-6"/></button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto print:overflow-visible no-scrollbar bg-slate-950 pb-[env(safe-area-inset-bottom)]">
                    {renderView()}
                </div>
            </main>

            {showAiAssistant && <AiAssistant data={data} onClose={() => setShowAiAssistant(false)} />}

            {/* Modals */}
            {modal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" onClick={() => setModal(null)}>
                    <div className="w-full max-w-lg bg-slate-900 rounded-[32px] p-8 lg:p-10 shadow-2xl border border-slate-800 animate-slide-up max-h-[90vh] overflow-y-auto no-scrollbar" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-white mb-8 uppercase tracking-widest text-center">
                            {modal.type.replace(/([A-Z])/g, ' $1')}
                        </h2>
                        {renderModalContent()}
                    </div>
                </div>
            )}
        </div>
    );
};

const SideNavItem: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all group ${isActive ? 'bg-teal-500/10 text-teal-400 shadow-inner' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        <span className="text-xs font-black tracking-widest uppercase">{label}</span>
        {isActive && <div className="ml-auto h-1.5 w-1.5 bg-teal-400 rounded-full" />}
    </button>
);

export default App;
