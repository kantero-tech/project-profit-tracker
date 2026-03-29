import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AppData } from '../types';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiAssistantProps {
    data: AppData;
    onClose: () => void;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ data, onClose }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);

    const handleAskAi = async () => {
        if (!aiPrompt.trim()) return;
        setLoadingAi(true);
        setAiResponse('');
        
        try {
            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
            
            const context = JSON.stringify({
                projects: data.projects.map(p => ({
                    name: p.name,
                    client: p.clientInfo,
                    status: p.status,
                    value: p.totalValue,
                    notes: p.notes
                })),
                project_expenses: data.expenses.map(e => ({ cat: e.category, amt: e.amount, desc: e.description, date: e.date, projectId: e.projectId })),
                incomes: data.incomes.map(i => ({ amt: i.amount, note: i.note, date: i.date, projectId: i.projectId })),
                general_expenses: data.generalExpenses.map(e => ({ type: e.type, cat: e.category, name: e.name, amt: e.amount, date: e.date })),
                extra_incomes: data.extraIncomes.map(i => ({ source: i.source, amt: i.amount, note: i.note, date: i.date })),
                debts: data.debts.map(d => ({ person: d.personName, amt: d.amount, type: d.type, status: d.status, notes: d.notes }))
            });

            const result = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `
                        You are a highly intelligent financial analyst AI for a business owner.
                        You have access to the user's entire financial and project data.
                        Context Data: ${context}
                        
                        User Question: "${aiPrompt}"
                        
                        Instructions:
                        1. If asked about employees/labor (e.g., "how much was paid to muvunyi"), analyze both project expenses (category 'Labor' or descriptions containing names) and general expenses (names/categories containing the person's name). Sum up the amounts.
                        2. If asked about clients (e.g., "which client gave the most jobs"), count the number of projects per client, and calculate the total revenue per client. Identify the top ones.
                        3. If asked about the "kind of jobs" done the most, analyze the project names and notes to categorize the types of work and count them.
                        4. Be professional, concise, and directly answer the user's question using the provided data.
                        5. Format currency appropriately.
                        6. Format your response using Markdown. Use tables for lists of data, bold text for emphasis, and bullet points where appropriate. Make it look highly professional.
                    `
            });
            
            setAiResponse(result.text || "No response generated.");
        } catch (error) {
            console.error("AI Error:", error);
            setAiResponse("Sorry, I couldn't generate an answer. Please check your API key.");
        } finally {
            setLoadingAi(false);
        }
    };

    return (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-[200] flex flex-col p-6">
            <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto w-full">
                <div className="flex items-center space-x-2 text-indigo-400">
                    <Sparkles className="h-5 w-5" />
                    <h2 className="text-lg font-black uppercase tracking-tight text-white">AI Financial Analyst</h2>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-900 rounded-full text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4 max-w-4xl mx-auto w-full">
                {aiResponse ? (
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-a:text-indigo-400 prose-headings:text-white prose-strong:text-white prose-td:border-slate-700 prose-th:border-slate-700 prose-table:border-slate-700 prose-tr:border-slate-800">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {aiResponse}
                            </ReactMarkdown>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 opacity-50">
                        <Sparkles className="h-12 w-12 mx-auto mb-4 text-indigo-500/50" />
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ask me anything about your business</p>
                        <div className="space-y-2 mt-4 flex flex-col items-center">
                            <button onClick={() => setAiPrompt("How much money was paid to Muvunyi as my employee?")} className="text-[10px] text-slate-400 bg-slate-900/50 hover:bg-slate-800 py-2 px-4 rounded-lg inline-block transition-colors text-left w-full max-w-md">"How much money was paid to Muvunyi as my employee?"</button>
                            <button onClick={() => setAiPrompt("Which client gave the most jobs?")} className="text-[10px] text-slate-400 bg-slate-900/50 hover:bg-slate-800 py-2 px-4 rounded-lg inline-block transition-colors text-left w-full max-w-md">"Which client gave the most jobs?"</button>
                            <button onClick={() => setAiPrompt("Which kind of jobs did I do the most?")} className="text-[10px] text-slate-400 bg-slate-900/50 hover:bg-slate-800 py-2 px-4 rounded-lg inline-block transition-colors text-left w-full max-w-md">"Which kind of jobs did I do the most?"</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative max-w-4xl mx-auto w-full">
                <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full bg-slate-900 border border-slate-800 text-white p-4 pr-12 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors text-sm font-medium placeholder:text-slate-600 shadow-xl"
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                />
                <button 
                    onClick={handleAskAi}
                    disabled={loadingAi || !aiPrompt.trim()}
                    className="absolute right-2 top-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
            </div>
        </div>
    );
};
