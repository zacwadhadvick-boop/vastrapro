import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  History, 
  Search,
  Printer,
  ChevronRight,
  Landmark,
  Wallet,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  Phone
} from 'lucide-react';
import { AppState } from '../types';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface AccountReportsProps {
  state: AppState;
  setView: (view: any) => void;
}

const REPORT_CATEGORIES = [
  {
    title: "Financial Statements",
    icon: <PieChart size={20} />,
    color: "text-blue-600 bg-blue-50",
    reports: [
      "Balance Sheet {Retail}",
      "Profit And Loss {Retail}",
      "Trail Group {Retail}",
      "Trail Ledger {Retail}"
    ]
  },
  {
    title: "Voucher & Ledgers",
    icon: <History size={20} />,
    color: "text-purple-600 bg-purple-50",
    reports: [
      "Voucher Posting Ledger",
      "Accounts Ledger (Ctrl+L)",
      "Accounts Group Ledger",
      "Opening Balance الفرق Report"
    ]
  },
  {
    title: "Daily Statements",
    icon: <Calendar size={20} />,
    color: "text-emerald-600 bg-emerald-50",
    reports: [
      "Cash Statement {Day Wise}",
      "Bank Statement {Day Wise}",
      "Journal Statement {Day Wise}",
      "DAY ENTRY REPORT"
    ]
  },
  {
    title: "Registers & Logs",
    icon: <Layers size={20} />,
    color: "text-orange-600 bg-orange-50",
    reports: [
      "Bank Register {Detail}",
      "Multi-Voucher Receipt Register",
      "Accounts Payment Register",
      "Accounts Receipt Register"
    ]
  },
  {
    title: "Stakeholder Reports",
    icon: <Users size={20} />,
    color: "text-rose-600 bg-rose-50",
    reports: [
      "Top Down {Customer/Supplier} Report",
      "Customer {Cash Bank Register}",
      "Supplier {Cash Bank Register}",
      "Contact List (F12)"
    ]
  },
  {
    title: "Specialized Audits",
    icon: <ShieldCheck size={20} />,
    color: "text-cyan-600 bg-cyan-50",
    reports: [
      "Accounts Status Report",
      "Interest Ledger (New)",
      "Collection Boy Report",
      "Stop Voucher Register"
    ]
  }
];

export default function AccountReports({ state, setView }: AccountReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'viewer'>('list');
  const [activeLedger, setActiveLedger] = useState<string | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const filteredCategories = REPORT_CATEGORIES.map(cat => ({
    ...cat,
    reports: cat.reports.filter(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(cat => cat.reports.length > 0);

  if (viewMode === 'viewer' && activeLedger) {
    const ledgerData = state.ledgerEntries.filter(e => 
      e.description.toLowerCase().includes(activeLedger.toLowerCase()) || 
      activeLedger === "Accounts Ledger (Ctrl+L)" ||
      activeLedger === "DAY ENTRY REPORT"
    );

    return (
      <div className="space-y-8 pb-20">
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setViewMode('list');
                  setActiveLedger(null);
                }}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
              >
                <ChevronRight size={20} className="rotate-180" />
              </button>
              <div>
                <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">{activeLedger}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Viewing report for FY 2026-27</p>
              </div>
           </div>
           <div className="flex gap-4 no-print">
              <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                 <Printer size={16} /> Print Report
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-all shadow-xl shadow-slate-800/20"
              >
                 <History size={16} /> Back to List
              </button>
           </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
           <div className="bg-slate-900 px-8 py-4 flex justify-between items-center">
              <div className="flex items-center gap-6">
                 <div className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none">
                    <p>Period Range</p>
                    <p className="text-white mt-1">01-Apr-2026 To 31-Mar-2027</p>
                 </div>
                 <div className="h-6 w-px bg-white/10" />
                 <div className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none">
                    <p>Account Holder</p>
                    <p className="text-white mt-1">All Consolidated Ledgers</p>
                 </div>
              </div>
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-emerald-400 font-mono text-xs">
                BALANCE: ₹{ledgerData.reduce((acc, e) => acc + (e.type === 'credit' ? e.amount : -e.amount), 0).toLocaleString()}
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Particulars / Description</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher Type</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Debit</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ledgerData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                          <History size={48} className="mx-auto text-slate-200" />
                          <p className="text-sm text-slate-400 font-medium">No ledger entries found for this report criteria. Try checking transaction logs or daily entries.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    ledgerData.map((entry, i) => (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(entry.date).toLocaleDateString()}</td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-bold text-slate-800">{entry.description}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{entry.category}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-tight leading-none">Journal</span>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-rose-600 text-sm">
                          {entry.type === 'debit' ? `₹${entry.amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-emerald-600 text-sm">
                          {entry.type === 'credit' ? `₹${entry.amount.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-900 text-white border-t border-white/10 font-mono">
                   <tr>
                      <td colSpan={3} className="px-8 py-6 text-sm uppercase font-black">Consolidated Total</td>
                      <td className="px-8 py-6 text-right text-rose-400">₹{ledgerData.filter(e => e.type === 'debit').reduce((acc, e) => acc + e.amount, 0).toLocaleString()}</td>
                      <td className="px-8 py-6 text-right text-emerald-400">₹{ledgerData.filter(e => e.type === 'credit').reduce((acc, e) => acc + e.amount, 0).toLocaleString()}</td>
                   </tr>
                </tfoot>
              </table>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
           <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="text-blue-500" size={20} />
                 <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Auditors Checklist</h4>
              </div>
              <ul className="space-y-2">
                 {['Verify opening balance synergy', 'Match voucher series continuity', 'Check for unadjusted debit notes'].map(item => (
                   <li key={item} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                      <div className="w-1 h-1 bg-blue-300 rounded-full" /> {item}
                   </li>
                 ))}
              </ul>
           </div>
           <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] flex items-center justify-between">
              <div>
                 <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Export to GST Portal</h4>
                 <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tight">Generate secure JSON bundle for filing.</p>
              </div>
              <button className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all">
                <ArrowUpRight size={20} />
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary text-white rounded-[1.5rem] shadow-xl shadow-primary/20">
            <BookOpen size={28} />
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest leading-none">A/C Reports & Books</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Official auditing & ledger consolidation module</p>
          </div>
        </div>

        <div className="relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search report..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary/5 transition-all w-80 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCategories.map((cat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={cat.title}
            className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-slate-50 flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", cat.color)}>
                {cat.icon}
              </div>
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">{cat.title}</h4>
            </div>
            
            <div className="flex-1 p-4 space-y-2">
              {cat.reports.map(report => (
                <button
                  key={report}
                  onClick={() => {
                    setSelectedReport(report);
                    // For specific reports, we allow drill-down
                    if (report.includes('Ledger') || report.includes('Statement') || report === "DAY ENTRY REPORT" || report.includes('Register')) {
                      setActiveLedger(report);
                      setViewMode('viewer');
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group text-left"
                >
                  <span className="text-xs font-bold text-slate-600 group-hover:text-primary transition-colors uppercase tracking-tight">{report}</span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Report Modal / Preview Simulation */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
           <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden"
           >
              <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white/10 rounded-2xl"><FileText size={24} /></div>
                   <div>
                     <h3 className="font-black text-lg uppercase tracking-widest leading-none">{selectedReport}</h3>
                     <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1.5">Draft Generation Mode</p>
                   </div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-12 text-center space-y-8">
                 <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
                    <Printer size={48} strokeWidth={1} />
                 </div>
                 <div className="max-w-md mx-auto space-y-4">
                    <h4 className="font-black text-xl text-slate-800 uppercase tracking-tight">Generate Audit Snapshot</h4>
                    <p className="text-sm text-slate-500 font-medium">Ready to compile financial data for the selected ledger. This will produce a consolidated PDF/Excel document for review.</p>
                 </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4">
                    <button 
                      onClick={() => {
                        if (selectedReport && (selectedReport.includes('Ledger') || selectedReport === "DAY ENTRY REPORT")) {
                          setActiveLedger(selectedReport);
                          setViewMode('viewer');
                          setSelectedReport(null);
                        } else {
                          alert(`Consolidating data for ${selectedReport}... Finalizing Audit Snapshot PDF.`);
                        }
                      }}
                      className="w-full md:w-auto px-12 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       <ArrowUpRight size={16} /> {selectedReport?.includes('Ledger') ? 'View Ledger' : 'Generate Now'}
                    </button>
                    <button 
                      onClick={() => alert(`Exporting ${selectedReport} to CSV format...`)}
                      className="w-full md:w-auto px-12 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-800 hover:text-white transition-all"
                    >
                       Download CSV
                    </button>
                  </div>
              </div>

              <div className="bg-slate-50 p-6 flex items-center justify-center gap-8 border-t border-slate-100">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <ShieldCheck size={14} className="text-emerald-500" /> Tamper Proof
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <History size={14} className="text-blue-500" /> Historical Logs
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
}

function X({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
