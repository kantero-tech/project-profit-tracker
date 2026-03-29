import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  AppData,
  Project,
  Expense,
  Income,
  ExtraIncome,
  GeneralExpense,
  Debt,
  DebtPayment,
} from '../types';
import { DEFAULT_EXPENSE_CATEGORIES } from '../constants';
import { generateId } from '../utils/helpers';
import { db } from '../firebase';

const DEFAULT_CURRENCY = 'RWF';

const EMPTY_DATA: AppData = {
  projects: [],
  expenses: [],
  incomes: [],
  extraIncomes: [],
  generalExpenses: [],
  debts: [],
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  currency: DEFAULT_CURRENCY,
};

const normalizeData = (raw: any): AppData => {
  if (!raw || typeof raw !== 'object') return EMPTY_DATA;

  return {
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    expenses: Array.isArray(raw.expenses) ? raw.expenses : [],
    incomes: Array.isArray(raw.incomes) ? raw.incomes : [],
    extraIncomes: Array.isArray(raw.extraIncomes) ? raw.extraIncomes : [],
    generalExpenses: Array.isArray(raw.generalExpenses) ? raw.generalExpenses : [],
    debts: Array.isArray(raw.debts) ? raw.debts : [],
    expenseCategories: Array.isArray(raw.expenseCategories)
      ? raw.expenseCategories
      : DEFAULT_EXPENSE_CATEGORIES,
    currency: raw.currency || DEFAULT_CURRENCY,
  };
};

export const useAppData = (userId?: string | null) => {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const docRef = userId ? doc(db, 'users', userId, 'appData', 'main') : null;

  const loadData = useCallback(async () => {
    if (!docRef) {
      setLoading(false);
      setError('No signed-in user found.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const raw = snap.data();
        setData(normalizeData(raw));
      } else {
        await setDoc(docRef, {
          ...EMPTY_DATA,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setData(EMPTY_DATA);
      }
    } catch (err) {
      console.error('Error loading Firestore data:', err);
      setError('Failed to load data from Firebase.');
    } finally {
      setLoading(false);
    }
  }, [docRef]);

  const saveData = useCallback(
    async (nextData: AppData) => {
      if (!docRef) {
        setError('No signed-in user found.');
        return;
      }

      try {
        setSaving(true);
        setError(null);

        await setDoc(
          docRef,
          {
            ...nextData,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Error saving Firestore data:', err);
        setError('Failed to save data to Firebase.');
      } finally {
        setSaving(false);
      }
    },
    [docRef]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateData = useCallback(
    (updater: (prev: AppData) => AppData) => {
      setData(prev => {
        const next = updater(prev);
        void saveData(next);
        return next;
      });
    },
    [saveData]
  );

  const addProject = useCallback((project: Omit<Project, 'id'>) => {
    const newProject: Project = { ...project, id: generateId() };
    updateData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
    }));
    return newProject;
  }, [updateData]);

  const updateProject = useCallback((updatedProject: Project) => {
    updateData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === updatedProject.id ? updatedProject : p),
    }));
  }, [updateData]);

  const deleteProject = useCallback((projectId: string) => {
    updateData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId),
      expenses: prev.expenses.filter(e => e.projectId !== projectId),
      incomes: prev.incomes.filter(i => i.projectId !== projectId),
    }));
  }, [updateData]);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expense, id: generateId() };
    updateData(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExpense],
    }));
  }, [updateData]);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    updateData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e),
    }));
  }, [updateData]);

  const deleteExpense = useCallback((expenseId: string) => {
    updateData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== expenseId),
    }));
  }, [updateData]);

  const addIncome = useCallback((income: Omit<Income, 'id'>) => {
    const newIncome: Income = { ...income, id: generateId() };
    updateData(prev => ({
      ...prev,
      incomes: [...prev.incomes, newIncome],
    }));
  }, [updateData]);

  const updateIncome = useCallback((updatedIncome: Income) => {
    updateData(prev => ({
      ...prev,
      incomes: prev.incomes.map(i => i.id === updatedIncome.id ? updatedIncome : i),
    }));
  }, [updateData]);

  const deleteIncome = useCallback((incomeId: string) => {
    updateData(prev => ({
      ...prev,
      incomes: prev.incomes.filter(i => i.id !== incomeId),
    }));
  }, [updateData]);

  const addExtraIncome = useCallback((income: Omit<ExtraIncome, 'id'>) => {
    const newIncome: ExtraIncome = { ...income, id: generateId() };
    updateData(prev => ({
      ...prev,
      extraIncomes: [...prev.extraIncomes, newIncome],
    }));
  }, [updateData]);

  const updateExtraIncome = useCallback((updatedIncome: ExtraIncome) => {
    updateData(prev => ({
      ...prev,
      extraIncomes: prev.extraIncomes.map(i => i.id === updatedIncome.id ? updatedIncome : i),
    }));
  }, [updateData]);

  const deleteExtraIncome = useCallback((id: string) => {
    updateData(prev => ({
      ...prev,
      extraIncomes: prev.extraIncomes.filter(i => i.id !== id),
    }));
  }, [updateData]);

  const addGeneralExpense = useCallback((expense: Omit<GeneralExpense, 'id'>) => {
    const newExpense: GeneralExpense = { ...expense, id: generateId() };
    updateData(prev => ({
      ...prev,
      generalExpenses: [...prev.generalExpenses, newExpense],
    }));
  }, [updateData]);

  const updateGeneralExpense = useCallback((updatedExpense: GeneralExpense) => {
    updateData(prev => ({
      ...prev,
      generalExpenses: prev.generalExpenses.map(e => e.id === updatedExpense.id ? updatedExpense : e),
    }));
  }, [updateData]);

  const deleteGeneralExpense = useCallback((id: string) => {
    updateData(prev => ({
      ...prev,
      generalExpenses: prev.generalExpenses.filter(e => e.id !== id),
    }));
  }, [updateData]);

  const addDebt = useCallback((debt: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...debt, id: generateId() };
    updateData(prev => ({
      ...prev,
      debts: [...prev.debts, newDebt],
    }));
  }, [updateData]);

  const deleteDebt = useCallback((id: string) => {
    updateData(prev => ({
      ...prev,
      debts: prev.debts.filter(d => d.id !== id),
    }));
  }, [updateData]);

  const addDebtPayment = useCallback((debtId: string, payment: DebtPayment) => {
    updateData(prev => {
      const debts = prev.debts.map(d => {
        if (d.id === debtId) {
          const payments = d.payments || [];
          const updatedPayments = [...payments, payment];
          const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
          const status = totalPaid >= d.amount ? 'Paid' : 'Partial';
          return { ...d, payments: updatedPayments, status };
        }
        return d;
      });

      return { ...prev, debts };
    });
  }, [updateData]);

  const undoSettlement = useCallback((debtId: string) => {
    updateData(prev => {
      const debts = prev.debts.map(d => {
        const payments = d.payments || [];
        if (d.id === debtId && payments.length > 0) {
          const updatedPayments = payments.slice(0, -1);
          const totalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
          const status = totalPaid >= d.amount ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid');
          return { ...d, payments: updatedPayments, status };
        }
        return d;
      });

      return { ...prev, debts };
    });
  }, [updateData]);

  const addExpenseCategory = useCallback((category: string) => {
    updateData(prev => {
      if (!category || prev.expenseCategories.includes(category)) return prev;
      return {
        ...prev,
        expenseCategories: [...prev.expenseCategories, category],
      };
    });
  }, [updateData]);

  const deleteExpenseCategory = useCallback((category: string) => {
    updateData(prev => ({
      ...prev,
      expenseCategories: prev.expenseCategories.filter(c => c !== category),
    }));
  }, [updateData]);

  const updateCurrency = useCallback((currency: string) => {
    updateData(prev => ({
      ...prev,
      currency,
    }));
  }, [updateData]);

  const importData = useCallback(async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const normalized = normalizeData(parsed);
      setData(normalized);
      await saveData(normalized);
      return true;
    } catch (e) {
      console.error('Invalid JSON', e);
      return false;
    }
  }, [saveData]);

  const resetData = useCallback(async () => {
    setData(EMPTY_DATA);
    await saveData(EMPTY_DATA);
  }, [saveData]);

  return {
    data,
    loading,
    saving,
    error,
    reload: loadData,
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