
import React, { useState, useRef } from 'react';
import { TrashIcon } from './Icons';
import { AppData } from '../types';

interface SettingsProps {
    expenseCategories: string[];
    currency: string;
    addExpenseCategory: (category: string) => void;
    deleteExpenseCategory: (category: string) => void;
    updateCurrency: (currency: string) => void;
    importData: (json: string) => boolean;
    resetData: () => void;
    fullData: AppData; // Need full data for export
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'RWF', 'KES', 'NGN', 'ZAR', 'INR', 'CAD', 'AUD', 'JPY'];

const Settings: React.FC<SettingsProps> = ({ 
    expenseCategories, 
    currency, 
    addExpenseCategory, 
    deleteExpenseCategory, 
    updateCurrency,
    importData,
    resetData,
    fullData 
}) => {
    const [newCategory, setNewCategory] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if(newCategory.trim()){
            addExpenseCategory(newCategory.trim());
            setNewCategory('');
        }
    };

    const handleResetData = () => {
        setConfirmAction({
            message: 'Are you absolutely sure? This will delete all your projects, expenses, and incomes permanently. This action cannot be undone.',
            onConfirm: () => {
                resetData();
                setConfirmAction(null);
            }
        });
    };
    
    const handleExportData = () => {
        const dataStr = JSON.stringify(fullData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `project_profit_tracker_backup_${new Date().toISOString().slice(0,10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (importData(content)) {
                setConfirmAction({ message: 'Data restored successfully!', onConfirm: () => setConfirmAction(null) });
            } else {
                setConfirmAction({ message: 'Failed to import data. The file format seems incorrect.', onConfirm: () => setConfirmAction(null) });
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };

    return (
        <div className="p-4 space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* App Preferences */}
                 <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Preferences</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Currency</label>
                            <select 
                                value={currency} 
                                onChange={(e) => updateCurrency(e.target.value)}
                                className="w-full bg-slate-700 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Expense Categories</h2>
                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {expenseCategories.map(cat => (
                            <div key={cat} className="flex justify-between items-center bg-slate-900/50 p-2 px-3 rounded-lg border border-slate-700/50">
                                <span className="text-slate-200">{cat}</span>
                                <button type="button" onClick={() => deleteExpenseCategory(cat)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                                    <TrashIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleAddCategory} className="flex gap-2">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New category..."
                            className="flex-grow bg-slate-700 text-white p-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <button type="submit" className="bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition">
                            Add
                        </button>
                    </form>
                </div>
            </div>
            
            {/* Data Management */}
            <div className="bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">Data Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={handleExportData} className="flex flex-col items-start p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition border border-slate-600/50">
                        <h3 className="font-semibold text-teal-400 mb-1">Backup Data (Export JSON)</h3>
                        <p className="text-sm text-slate-400 text-left">Download a complete copy of your projects and transactions to your device.</p>
                    </button>
                    
                    <button onClick={handleImportClick} className="flex flex-col items-start p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition border border-slate-600/50">
                         <h3 className="font-semibold text-blue-400 mb-1">Restore Data (Import JSON)</h3>
                         <p className="text-sm text-slate-400 text-left">Restore your data from a previously saved backup file.</p>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
                <p className="text-red-200/60 mb-4 text-sm">This action is irreversible and will permanently delete all your data locally.</p>
                <button onClick={handleResetData} className="w-full sm:w-auto bg-red-500/10 text-red-500 border border-red-500/50 font-bold py-2 px-6 rounded-lg hover:bg-red-500 hover:text-white transition">
                    Clear All Data
                </button>
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

export default Settings;
