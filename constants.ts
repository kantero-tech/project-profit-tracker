
import { ProjectStatus } from './types';

export const APP_NAME = 'Project Profit Tracker';
export const CURRENCY_CODE = 'RWF';
export const LOCAL_STORAGE_KEY = 'projectProfitTrackerData';

export const DEFAULT_EXPENSE_CATEGORIES: string[] = ['Materials', 'Transport', 'Labor', 'Equipment', 'Subcontractor'];

export const BUSINESS_FIXED_CATEGORIES: string[] = ['Rent', 'Electricity', 'Internet', 'Salaries', 'Tools Maintenance', 'Taxes', 'Marketing'];
export const OTHER_BUSINESS_CATEGORIES: string[] = ['Travel', 'Meals', 'Supplies', 'Software', 'Insurance', 'Legal', 'Miscellaneous'];
export const PERSONAL_CATEGORIES: string[] = ['Home Rent', 'Food', 'Utilities', 'School Fees', 'Transport', 'Entertainment', 'Healthcare'];

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  ProjectStatus.Ongoing,
  ProjectStatus.Completed,
  ProjectStatus.Cancelled,
];
