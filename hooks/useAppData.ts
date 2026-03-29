
import { useState, useEffect, useCallback } from 'react';
import { AppData, Project, Expense, Income, ExtraIncome, GeneralExpense, Debt, DebtPayment } from '../types';
import { LOCAL_STORAGE_KEY, DEFAULT_EXPENSE_CATEGORIES } from '../constants';
import { generateId } from '../utils/helpers';

const DEFAULT_CURRENCY = 'RWF';

const getInitialData = (): AppData => {
  try {
    const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      return {
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
        incomes: Array.isArray(parsed.incomes) ? parsed.incomes : [],
        extraIncomes: Array.isArray(parsed.extraIncomes) ? parsed.extraIncomes : [],
        generalExpenses: Array.isArray(parsed.generalExpenses) ? parsed.generalExpenses : [],
        debts: Array.isArray(parsed.debts) ? parsed.debts : [],
        expenseCategories: Array.isArray(parsed.expenseCategories) ? parsed.expenseCategories : DEFAULT_EXPENSE_CATEGORIES,
        currency: parsed.currency || DEFAULT_CURRENCY,
      };
    }
  } catch (error) {
    console.error('Error reading from localStorage', error);
  }
  return {
    projects: [],
    expenses: [],
    incomes: [],
    extraIncomes: [],
    generalExpenses: [],
    debts: [],
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    currency: DEFAULT_CURRENCY,
  };
};

export const useAppData = () => {
  const [data, setData] = useState<AppData>(getInitialData);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [data]);

  const addProject = useCallback((project: Omit<Project, 'id'>) => {
    const newProject: Project = { ...project, id: generateId() };
    setData(prevData => ({ ...prevData, projects: [...prevData.projects, newProject] }));
    return newProject;
  }, []);

  const updateProject = useCallback((updatedProject: Project) => {
    setData(prevData => ({
      ...prevData,
      projects: prevData.projects.map(p => p.id === updatedProject.id ? updatedProject : p),
    }));
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setData(prevData => ({
      ...prevData,
      projects: prevData.projects.filter(p => p.id !== projectId),
      expenses: prevData.expenses.filter(e => e.projectId !== projectId),
      incomes: prevData.incomes.filter(i => i.projectId !== projectId),
    }));
  }, []);
  
  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expense, id: generateId() };
    setData(prevData => ({ ...prevData, expenses: [...prevData.expenses, newExpense] }));
  }, []);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    setData(prevData => ({
      ...prevData,
      expenses: prevData.expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e),
    }));
  }, []);

  const deleteExpense = useCallback((expenseId: string) => {
    setData(prevData => ({ ...prevData, expenses: prevData.expenses.filter(e => e.id !== expenseId) }));
  }, []);
  
  const addIncome = useCallback((income: Omit<Income, 'id'>) => {
    const newIncome: Income = { ...income, id: generateId() };
    setData(prevData => ({ ...prevData, incomes: [...prevData.incomes, newIncome] }));
  }, []);

  const updateIncome = useCallback((updatedIncome: Income) => {
    setData(prevData => ({
      ...prevData,
      incomes: prevData.incomes.map(i => i.id === updatedIncome.id ? updatedIncome : i),
    }));
  }, []);

  const deleteIncome = useCallback((incomeId: string) => {
      setData(prevData => ({ ...prevData, incomes: prevData.incomes.filter(i => i.id !== incomeId) }));
  }, []);

  // --- Extra Incomes ---
  const addExtraIncome = useCallback((income: Omit<ExtraIncome, 'id'>) => {
    const newIncome: ExtraIncome = { ...income, id: generateId() };
    setData(prevData => ({ ...prevData, extraIncomes: [...prevData.extraIncomes, newIncome] }));
  }, []);

  const updateExtraIncome = useCallback((updatedIncome: ExtraIncome) => {
    setData(prevData => ({
      ...prevData,
      extraIncomes: prevData.extraIncomes.map(i => i.id === updatedIncome.id ? updatedIncome : i),
    }));
  }, []);

  const deleteExtraIncome = useCallback((id: string) => {
    setData(prevData => ({ ...prevData, extraIncomes: prevData.extraIncomes.filter(i => i.id !== id) }));
  }, []);

  // --- General Expenses ---
  const addGeneralExpense = useCallback((expense: Omit<GeneralExpense, 'id'>) => {
    const newExpense: GeneralExpense = { ...expense, id: generateId() };
    setData(prevData => ({ ...prevData, generalExpenses: [...prevData.generalExpenses, newExpense] }));
  }, []);

  const updateGeneralExpense = useCallback((updatedExpense: GeneralExpense) => {
    setData(prevData => ({
      ...prevData,
      generalExpenses: prevData.generalExpenses.map(e => e.id === updatedExpense.id ? updatedExpense : e),
    }));
  }, []);

  const deleteGeneralExpense = useCallback((id: string) => {
    setData(prevData => ({ ...prevData, generalExpenses: prevData.generalExpenses.filter(e => e.id !== id) }));
  }, []);

  // --- Debts ---
  const addDebt = useCallback((debt: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...debt, id: generateId() };
    setData(prevData => ({ ...prevData, debts: [...prevData.debts, newDebt] }));
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setData(prevData => ({ ...prevData, debts: prevData.debts.filter(d => d.id !== id) }));
  }, []);

  const addDebtPayment = useCallback((debtId: string, payment: DebtPayment) => {
    setData(prevData => {
        const debts = prevData.debts.map(d => {
            if (d.id === debtId) {
                const payments = d.payments || [];
                const updatedPayments = [...payments, payment];
                const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
                const status = totalPaid >= d.amount ? 'Paid' : 'Partial';
                return { ...d, payments: updatedPayments, status };
            }
            return d;
        });
        return { ...prevData, debts };
    });
  }, []);

  const undoSettlement = useCallback((debtId: string) => {
    setData(prevData => {
        const debts = prevData.debts.map(d => {
            const payments = d.payments || [];
            if (d.id === debtId && payments.length > 0) {
                // Remove the last payment
                const updatedPayments = payments.slice(0, -1);
                const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
                // Re-evaluate status
                const status = totalPaid >= d.amount ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');
                return { ...d, payments: updatedPayments, status };
            }
            return d;
        });
        return { ...prevData, debts };
    });
  }, []);

  const addExpenseCategory = useCallback((category: string) => {
      if (category && !data.expenseCategories.includes(category)) {
          setData(prevData => ({ ...prevData, expenseCategories: [...prevData.expenseCategories, category] }));
      }
  }, [data.expenseCategories]);

  const deleteExpenseCategory = useCallback((category: string) => {
      setData(prevData => ({ ...prevData, expenseCategories: prevData.expenseCategories.filter(c => c !== category) }));
  }, []);
  
  const updateCurrency = useCallback((currency: string) => {
      setData(prevData => ({ ...prevData, currency }));
  }, []);

  const importData = useCallback((jsonData: string) => {
    try {
        const parsed = JSON.parse(jsonData);
        if (Array.isArray(parsed.projects) && Array.isArray(parsed.expenses)) {
             setData({
                 ...parsed,
                 extraIncomes: parsed.extraIncomes || []
             });
             return true;
        }
        return false;
    } catch (e) {
        console.error("Invalid JSON", e);
        return false;
    }
  }, []);

  const resetData = useCallback(() => {
    const freshData = {
        projects: [],
        expenses: [],
        incomes: [],
        extraIncomes: [],
        generalExpenses: [],
        debts: [],
        expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
        currency: DEFAULT_CURRENCY,
    };
    setData(freshData);
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(freshData));
  }, []);

  return {
    data,
    addProject,
    updateProject,
    deleteProject,
    addExpense,
    updateExpense,
    deleteExpense,
    addIncome,
    updateIncome,
    deleteIncome,
    addExtraIncome,
    updateExtraIncome,
    deleteExtraIncome,
    addGeneralExpense,
    updateGeneralExpense,
    deleteGeneralExpense,
    addDebt,
    deleteDebt,
    addDebtPayment,
    undoSettlement,
    addExpenseCategory,
    deleteExpenseCategory,
    updateCurrency,
    importData,
    resetData,
  };
};
