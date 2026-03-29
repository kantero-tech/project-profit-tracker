
export enum ProjectStatus {
  Ongoing = 'Ongoing',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface Expense {
  id: string;
  projectId: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface Income {
  id: string;
  projectId: string;
  amount: number;
  date: string;
  note: string;
}

export interface Project {
  id: string;
  name: string;
  clientInfo: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  totalValue: number;
  notes: string;
}

export type ExpenseType = 'Business Fixed' | 'Other Business' | 'Personal';

export interface GeneralExpense {
  id: string;
  type: ExpenseType;
  category: string;
  name: string;
  amount: number;
  date: string;
  isRecurring: boolean; // Acts as a flag for quick-add templates
  status?: 'Paid' | 'Pending';
}

export type DebtType = 'I Owe' | 'Owes Me';
export type DebtStatus = 'Unpaid' | 'Partial' | 'Paid';

export interface DebtPayment {
  amount: number;
  date: string;
  note?: string;
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  type: DebtType;
  dueDate: string;
  startDate: string;
  status: DebtStatus;
  notes: string;
  payments: DebtPayment[];
  isRecurring?: boolean;
  projectId?: string; // Optional link to a project
}

export interface ExtraIncome {
  id: string;
  source: string;
  amount: number;
  date: string;
  note: string;
}

export interface AppData {
  projects: Project[];
  expenses: Expense[];
  incomes: Income[];
  extraIncomes: ExtraIncome[];
  generalExpenses: GeneralExpense[];
  debts: Debt[];
  expenseCategories: string[];
  currency: string;
}
