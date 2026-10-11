import React, { useState, Dispatch, SetStateAction } from 'react';
import { Landmark, TrendingUp, TrendingDown, ArrowLeftRight, Files, Calendar, Plus, X, Search, FileText, Trash2, Filter } from 'lucide-react';
import { AppState, LedgerEntry } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface AccountingProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  setView: (v: any) => void;
}

export default function Accounting({ state, setState, setView }: AccountingProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const totalDebit = state.ledgerEntries.filter(e => e.type === 'debit').reduce((acc, e) => acc + e.amount, 0);
  const totalCredit = state.ledgerEntries.filter(e => e.type === 'credit').reduce((acc, e) => acc + e.amount, 0);
  
  // The system now adds sales and purchases to ledgerEntries automatically
  const totalIn = totalCredit;
  const balance = totalIn - totalDebit;

  const handleAddEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEntry: LedgerEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      description: formData.get('description') as string,
      amount: Number(formData.get('amount')),
      type: formData.get('type') as 'debit' | 'credit',
      category: formData.get('category') as string
    };

    setState(prev => ({
      ...prev,
      ledgerEntries: [newEntry, ...prev.ledgerEntries]
    }));
    setIsModalOpen(false);
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this manual ledger entry?')) {
      setState(prev => ({
        ...prev,
        ledgerEntries: prev.ledgerEntries.filter(e => e.id !== id)
      }));
    }
  };

  const allTransactions = state.ledgerEntries.map(entry => ({
    id: entry.id,
    date: entry.date,
    description: entry.description,
    ref: entry.category,
    amount: entry.amount,
    type: entry.type,
    category: entry.category
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = allTransactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesDate = (!dateFilter.start || t.date >= dateFilter.start) && 
                      (!dateFilter.end || t.date <= dateFilter.end);

    return matchesSearch && matchesType && matchesDate;
  });

  const suggestions = Array.from(new Set([
    ...state.ledgerEntries.map(e => e.description),
    ...state.ledgerEntries.map(e => e.category),
    ...state.customers.map(c => c.name),
    ...state.suppliers.map(s => s.name),
  ]));

  return (
    <div className="space-y-10">
      <datalist id="accounting-suggestions">
        {suggestions.map((s, i) => <option key={i} value={s} />)}
      </datalist>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-red-50 text-red-600 rounded-[1.5rem] group-hover:scale-110 transition-transform"><TrendingDown size={24} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expenses Out</p>
               <h3 className="text-2xl font-black text-slate-800">₹{totalDebit.toLocaleString()}</h3>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
             <div className="h-full bg-red-400" style={{ width: '40%' }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 group hover:shadow-xl transition-all"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] group-hover:scale-110 transition-transform"><TrendingUp size={24} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenue In</p>
               <h3 className="text-2xl font-black text-slate-800">₹{totalIn.toLocaleString()}</h3>
            </div>
          </div>
          <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-400" style={{ width: '85%' }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "p-8 rounded-[3rem] shadow-2xl border transition-all flex flex-col justify-between",
            balance >= 0 ? "bg-primary text-white border-primary/20 shadow-primary/30" : "bg-red-600 text-white border-red-500 shadow-red-500/30"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-[1.5rem] backdrop-blur-md"><Landmark size={24} /></div>
            <div>
               <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">Net Cash Flow</p>
               <h3 className="text-3xl font-black italic">₹{Math.abs(balance).toLocaleString()} {balance >= 0 ? 'CR' : 'DR'}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
             <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs flex items-center gap-3">
               <ArrowLeftRight size={20} className="text-primary" /> Financial Registry
             </h3>
             <div className="flex items-center gap-3">
                <div className="relative group">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
                   <input 
                     type="text" 
                     list="accounting-suggestions"
                     placeholder="Audit Trail Lookup..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10 pr-6 py-2.5 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border border-slate-100 focus:ring-8 focus:ring-primary/5 transition-all w-80 shadow-sm"
                   />
                </div>
                <button 
                 onClick={() => setShowFilters(!showFilters)}
                 className={cn(
                   "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2",
                   showFilters ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-100"
                 )}
                >
                   <Filter size={16} /> {showFilters ? 'Hide' : 'Filters'}
                </button>
             </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden no-print"
              >
                <div className="bg-slate-50/50 border-b border-slate-100 p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> From
                    </label>
                    <input 
                      type="date" 
                      value={dateFilter.start}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-bold outline-none focus:ring-4 focus:ring-primary/5 shadow-sm font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} /> To
                    </label>
                    <input 
                      type="date" 
                      value={dateFilter.end}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-bold outline-none focus:ring-4 focus:ring-primary/5 shadow-sm font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <ArrowLeftRight size={12} /> Type
                    </label>
                    <select 
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-bold outline-none focus:ring-4 focus:ring-primary/5 shadow-sm appearance-none"
                    >
                      <option value="all">Every Type</option>
                      <option value="debit">Out (Debit)</option>
                      <option value="credit">In (Credit)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setDateFilter({ start: '', end: '' });
                        setTypeFilter('all');
                      }}
                      className="w-full py-3 bg-white text-rose-500 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <X size={14} /> Clear Audit
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all flex items-center gap-2">
              <Files size={14} /> Reconciliation
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
            >
              <Plus size={16} /> New Entry
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronology</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Narrative / Particulars</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit (Out)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credit (In)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6 text-[10px] text-slate-400 font-black uppercase">{format(new Date(t.date), 'dd MMM yyyy')}</td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-slate-800">{t.description}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t.ref}</p>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-red-500 text-sm">
                    {t.type === 'debit' ? `₹${t.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-emerald-500 text-sm">
                    {t.type === 'credit' ? `₹${t.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                      t.category === 'Sales' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-50 text-slate-600 border-slate-100"
                    )}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDeleteEntry(t.id)}
                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                      >
                         <Trash2 size={14} />
                      </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">
                    No historical logs matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 bg-primary text-white flex items-center justify-between">
                <div>
                   <h4 className="font-black tracking-[0.2em] uppercase text-xs">Voucher Entry</h4>
                   <p className="text-white/60 text-[9px] font-bold uppercase mt-1">Manual Ledger Provisioning</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all font-bold"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddEntry} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Voucher Type</label>
                       <select 
                         name="type"
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" 
                       >
                         <option value="debit">Payment (Debit)</option>
                         <option value="credit">Receipt (Credit)</option>
                       </select>
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Amount</label>
                       <input 
                         name="amount"
                         type="number"
                         required 
                         className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-sm" 
                       />
                     </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
                    <input 
                      name="description"
                      required 
                      placeholder="e.g. Office Rent, Factory Wages..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Ledger Category</label>
                    <select 
                      name="category"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" 
                    >
                      <option>Rent</option>
                      <option>Wages</option>
                      <option>Electricity</option>
                      <option>Taxes</option>
                      <option>Other Expense</option>
                      <option>Bank Interest</option>
                      <option>Cash Receipt</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]"
                >
                  Post Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
