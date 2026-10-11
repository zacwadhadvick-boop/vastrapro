import React, { useState } from 'react';
import { 
  FileSearch, 
  ClipboardList, 
  History, 
  BarChart2, 
  Download, 
  Eye, 
  Search, 
  X, 
  ShoppingBag,
  CreditCard,
  UserCircle,
  Clock,
  Calculator,
  Truck,
  ArrowUpRight,
  TrendingDown,
  Printer
} from 'lucide-react';
import { AppState, View } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface PurchaseReportsProps {
  state: AppState;
  setView?: (view: View) => void;
}

const PURCHASE_REPORT_LIST = [
  { 
    id: 'p_reg', 
    name: 'Purchase Register', 
    category: 'Analysis',
    desc: 'Detailed chronological registry of all purchase invoices.',
    icon: <ClipboardList size={24} />
  },
  { 
    id: 'p_sum', 
    name: 'Purchase Summary', 
    category: 'Summary',
    desc: 'Period-wise summary of purchases with tax breakdown.',
    icon: <BarChart2 size={24} />
  },
  { 
    id: 'p_reg_stk', 
    name: 'Purchase Register {Stock}', 
    category: 'Inventory',
    desc: 'Item-wise purchase details including batch and quantity.',
    icon: <ShoppingBag size={24} />
  },
  { 
    id: 'p_sum_stk', 
    name: 'Purchase Summary {Stock}', 
    category: 'Inventory',
    desc: 'Consolidated stock purchase summary by category.',
    icon: <History size={24} />
  },
  { 
    id: 'paid_unpaid', 
    name: 'PAID/UNPAID BILLS REPORT', 
    category: 'Outstanding',
    desc: 'Monitor settlement status of all supplier bills.',
    icon: <CreditCard size={24} />
  },
  { 
    id: 'pay_reg', 
    name: 'Payment Register', 
    category: 'Treasury',
    desc: 'Registry of all outgoing payments to suppliers.',
    icon: <TrendingDown size={24} />
  },
  { 
    id: 'adj_rep', 
    name: 'Supplier Bill To Bill Payment Adjusment Report', 
    category: 'Treasury',
    desc: 'Audit trail for multi-bill settlement adjustments.',
    icon: <History size={24} />
  },
  { 
    id: 'settle_ledg', 
    name: 'Supplier Settlement Ledger', 
    category: 'Supplier Control',
    desc: 'Detailed ledger of settlements and pending balances.',
    icon: <UserCircle size={24} />
  },
  { 
    id: 'due_rep', 
    name: 'Supplier Due Report', 
    category: 'Outstanding',
    desc: 'Age-wise analysis of pending supplier payments.',
    icon: <Clock size={24} />
  },
  { 
    id: 'broker_rep', 
    name: 'Broker Wise Brokerage Report {Supplier}', 
    category: 'Supplier Control',
    desc: 'Commisson tracking analysis for purchase brokers.',
    icon: <Users size={24} />
  },
  { 
    id: 'int_calc', 
    name: 'Supplier Bill Interest Calculator', 
    category: 'Finance',
    desc: 'Automated overdue interest calculation on delayed bills.',
    icon: <Calculator size={24} />
  },
  { 
    id: 'settle_fifo', 
    name: 'Supplier Settlement Ledger {FIFO}', 
    category: 'Inventory',
    desc: 'First-in-first-out settlement ledger analysis.',
    icon: <History size={24} />
  },
  { 
    id: 'ageing', 
    name: 'Supplier Ageing Report', 
    category: 'Outstanding',
    desc: 'Advanced ageing buckets for payables management.',
    icon: <Clock size={24} />
  },
  { 
    id: 'mat_reg', 
    name: 'Material Receipt Register', 
    category: 'Inventory',
    desc: 'Log of GRNs and material arrivals from suppliers.',
    icon: <Truck size={24} />
  },
];

export default function PurchaseReports({ state, setView }: PurchaseReportsProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = PURCHASE_REPORT_LIST.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalPayable: state.suppliers.reduce((acc, s) => acc + (s.balance || 0), 0),
    billsPending: state.purchaseInvoices.length,
    activeSuppliers: state.suppliers.length,
    avgAgeingDays: 45
  };

  const renderReportPreview = (reportName: string) => {
     return (
        <div className="space-y-6">
           <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                 <Printer size={32} />
              </div>
              <div>
                 <h4 className="font-black text-slate-800 uppercase tracking-tight text-xl">Ready to Generate</h4>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Analytical Engine Standby</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-6">
                 <button 
                  onClick={() => alert(`Opening ${selectedReport} preview in analytic view...`)}
                  className="py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                 >
                    View on Screen
                 </button>
                 <button 
                  onClick={() => alert(`Compiling ${selectedReport} data... Exporting to Excel file.`)}
                  className="py-4 bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                 >
                    Export Excel
                 </button>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Records</span>
                 <p className="text-2xl font-black text-slate-800 mt-2">{state.purchaseInvoices.length} entries</p>
              </div>
              <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Calculated Balance</span>
                 <p className="text-2xl font-black text-rose-600 mt-2">₹{stats.totalPayable.toLocaleString()}</p>
              </div>
           </div>
        </div>
     );
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl">
            <FileSearch size={28} />
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest leading-none">Purchase Intelligence</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Supplier Audit & Procurement Registers</p>
          </div>
        </div>

        <div className="relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search purchase registers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary/5 transition-all w-80 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredReports.map((report, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            key={report.id}
            onClick={() => setSelectedReport(report.name)}
            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 cursor-pointer group transition-all"
          >
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
               {report.icon}
            </div>
            <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs mb-2 group-hover:text-primary transition-colors">{report.name}</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed line-clamp-2">{report.desc}</p>
            
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[8px] bg-slate-50 text-slate-400 px-2 py-1 rounded-lg font-black uppercase tracking-widest">{report.category}</span>
               <ArrowUpRight size={14} className="text-slate-300 group-hover:text-primary transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#f2f2e6] border-4 border-slate-700 p-8 rounded-lg relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
               <h3 className="font-black text-3xl text-slate-800 uppercase tracking-tighter italic">Consolidated Procurement View</h3>
               <p className="text-slate-500 font-medium max-w-lg">Advanced aggregation of all supplier ledgers, FIFO settlements, and overdue interest calculators. Verified as of {format(new Date(), 'dd MMM yyyy')}.</p>
               
               <div className="flex flex-wrap gap-6 pt-4">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Supplier Dues</p>
                    <p className="text-xl font-black text-rose-600">₹{stats.totalPayable.toLocaleString()}</p>
                  </div>
                  <div className="text-center border-l border-slate-300 pl-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Avg Ageing</p>
                    <p className="text-xl font-black text-slate-800">{stats.avgAgeingDays} Days</p>
                  </div>
                  <div className="text-center border-l border-slate-300 pl-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Settlement Ratio</p>
                    <p className="text-xl font-black text-emerald-600">92.4%</p>
                  </div>
               </div>
            </div>
            
            <button 
               onClick={() => setSelectedReport('Purchase Register')}
               className="bg-slate-900 text-white px-10 py-6 rounded-lg font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-primary transition-all flex items-center gap-3"
            >
               <FileSearch size={20} /> View All Bills
            </button>
         </div>
         <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <ShoppingBag size={200} />
         </div>
      </div>

      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100"
            >
               <div className="p-8 bg-slate-900 flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-white/10 rounded-2xl"><Eye size={24} /></div>
                     <div>
                        <h4 className="font-black text-lg uppercase tracking-widest leading-none">{selectedReport}</h4>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1.5">Executive Summary Mode</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-10">
                  {renderReportPreview(selectedReport)}
               </div>
               <div className="bg-slate-50 p-6 flex justify-center gap-4">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                     <Calculator size={14} className="text-blue-500" /> Auto-Balanced
                  </span>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                     <Clock size={14} className="text-emerald-500" /> Real-time Sync
                  </span>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Users({ size, className }: { size: number, className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
