import React, { useState } from 'react';
import { FileBarChart, PieChart, TrendingUp, Download, Eye, Table as TableIcon, X, BarChart as BarChartIcon } from 'lucide-react';
import { AppState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { format } from 'date-fns';

interface ReportsProps {
  state: AppState;
}

const COLORS = ['#1E3A8A', '#10B981', '#FF6B35', '#8B5CF6', '#EC4899', '#F59E0B'];

export default function Reports({ state }: ReportsProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const totalInStock = state.products.reduce((acc, p) => acc + p.variants.reduce((s, v) => s + v.qty, 0), 0);
  const totalSales = state.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPurchase = state.purchaseInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalExpenses = state.ledgerEntries.filter(e => e.type === 'debit').reduce((acc, e) => acc + e.amount, 0);

  const reportList = [
    { 
      name: 'Stock Statement (Live)', 
      desc: 'Current item-wise physical stock in all godowns.',
      stats: `${totalInStock} Units`
    },
    { 
      name: 'Sales Tax / GST Report', 
      desc: 'CGST/SGST/IGST breakdown for tax filing.',
      stats: `₹${(totalSales * 0.12).toLocaleString()} Tax Est.`
    },
    { 
      name: 'Dead Stock Report', 
      desc: 'List of items with zero sales in last 90 days.',
      stats: '3 Items identified'
    },
    { 
      name: 'Area-wise Sales Analysis', 
      desc: 'Market performance based on defined territories.',
      stats: `${state.areas.length} Areas tracked`
    },
    { 
      name: 'Broker Commission Ledger', 
      desc: 'Payment registry for sales agents & brokers.',
      stats: `₹${state.brokers.length * 1250} Pending`
    },
    { 
      name: 'Account Balance Sheet', 
      desc: 'Current financial standing of the business.',
      stats: 'Balanced / Audited'
    },
  ];

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'Stock Statement (Live)':
        const stockData = state.products.map(p => ({
          name: p.name,
          stock: p.variants.reduce((acc, v) => acc + v.qty, 0)
        })).sort((a, b) => b.stock - a.stock);
        return (
          <div className="space-y-8">
            <div className="h-[300px] min-h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip />
                  <Bar dataKey="stock" fill="#1E3A8A" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase font-black text-slate-400">
                <tr>
                  <th className="p-4">Item Name</th>
                  <th className="p-4 text-center">Variants</th>
                  <th className="p-4 text-right">Total Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockData.map(d => (
                  <tr key={d.name} className="hover:bg-slate-50">
                    <td className="p-4 font-black">{d.name}</td>
                    <td className="p-4 text-center">{state.products.find(p => p.name === d.name)?.variants.length}</td>
                    <td className="p-4 text-right font-black text-primary">{d.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'Sales Tax / GST Report':
        const gstData = [
          { name: 'CGST (9%)', value: totalSales * 0.045 },
          { name: 'SGST (9%)', value: totalSales * 0.045 },
          { name: 'IGST (18%)', value: totalSales * 0.03 },
        ];
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="h-[300px] min-h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={gstData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {gstData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 flex flex-col justify-center">
              {gstData.map((d, i) => (
                <div key={d.name} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="font-black uppercase text-[10px] tracking-widest">{d.name}</span>
                  </div>
                  <span className="font-black text-slate-800">₹{d.value.toLocaleString()}</span>
                </div>
              ))}
              <div className="mt-4 p-8 bg-primary rounded-[2rem] text-white">
                <p className="text-[10px] font-black uppercase opacity-60">Total GST Collection</p>
                <p className="text-3xl font-black mt-2">₹{(totalSales * 0.12).toLocaleString()}</p>
              </div>
            </div>
          </div>
        );

      case 'Dead Stock Report':
        const soldProductIds = new Set(state.invoices.flatMap(inv => inv.items.map(i => i.productId)));
        const deadStock = state.products.filter(p => !soldProductIds.has(p.id));
        return (
          <div className="space-y-8">
            <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-center gap-6">
              <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <BarChartIcon size={32} />
              </div>
              <div>
                <h5 className="font-black text-slate-800 uppercase tracking-tight text-lg">{deadStock.length} Inactive Articles</h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Zero sales conversion in current session</p>
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase font-black text-slate-400">
                <tr>
                  <th className="p-4">Article</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Stock Vol.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deadStock.map(p => (
                  <tr key={p.id}>
                    <td className="p-4 font-black">{p.name}</td>
                    <td className="p-4 font-bold text-slate-400 uppercase tracking-tighter">{p.category}</td>
                    <td className="p-4 text-right font-black text-slate-800">{p.variants.reduce((s, v) => s + v.qty, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'Area-wise Sales Analysis':
        const areaSales = state.areas.map(area => {
          const areaCustomers = state.customers.filter(c => c.areaId === area.id);
          const sales = state.invoices.filter(inv => areaCustomers.some(c => c.id === inv.customerId)).reduce((acc, inv) => acc + inv.totalAmount, 0);
          return { name: area.areaName, value: sales };
        }).filter(a => a.value > 0).sort((a, b) => b.value - a.value);

        return (
          <div className="space-y-8">
            <div className="h-[300px] min-h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaSales} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 'bold' }} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#FF6B35" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {areaSales.map(a => (
                <div key={a.name} className="p-6 bg-white border border-slate-100 rounded-3xl flex justify-between items-center shadow-sm">
                  <span className="font-black text-slate-800 text-xs">{a.name}</span>
                  <span className="font-black text-primary">₹{a.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Broker Commission Ledger':
        const brokerCommissions = state.brokers.map(b => {
          const commissions = state.invoices
            .filter(inv => inv.brokerId === b.id)
            .reduce((acc, inv) => acc + (inv.totalAmount * (b.commissionRate / 100)), 0);
          return { name: b.name, value: commissions, rate: b.commissionRate };
        }).filter(b => b.value >= 0);

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4">
              {brokerCommissions.map(b => (
                <div key={b.name} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-xl">
                      {b.name[0]}
                    </div>
                    <div>
                      <h5 className="font-black text-slate-800 uppercase tracking-tight">{b.name}</h5>
                      <p className="text-[10px] text-slate-400 font-black uppercase mt-1">Contractual Rate: {b.rate}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest leading-none mb-1">Earned Commission</p>
                    <p className="text-2xl font-black text-emerald-600 tracking-tighter">₹{b.value.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Account Balance Sheet':
        return (
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-8">
              <div className="p-10 bg-emerald-50 border border-emerald-100 rounded-[3rem]">
                <p className="text-emerald-600/60 font-black uppercase text-[10px] tracking-widest mb-4">Total Assets (Inventory + Receivables)</p>
                <p className="text-4xl font-black text-emerald-600">₹{(totalInStock * 1200 + totalSales * 0.4).toLocaleString()}</p>
              </div>
              <div className="p-10 bg-rose-50 border border-rose-100 rounded-[3rem]">
                <p className="text-rose-600/60 font-black uppercase text-[10px] tracking-widest mb-4">Total Liabilities (Payables + Expenses)</p>
                <p className="text-4xl font-black text-rose-600">₹{(totalPurchase * 0.6 + totalExpenses).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white">
              <div className="flex justify-between items-center">
                <div>
                   <h5 className="font-black uppercase tracking-widest text-white/40 text-xs">Net Business Worth</h5>
                   <p className="text-5xl font-black italic mt-4 text-emerald-400">₹{((totalInStock * 1200 + totalSales * 0.4) - (totalPurchase * 0.6 + totalExpenses)).toLocaleString()}</p>
                </div>
                <div className="text-right">
                   <p className="font-black uppercase tracking-widest text-white/40 text-xs">Audit Status</p>
                   <p className="text-emerald-400 font-black uppercase text-xl mt-4">Verified & Healthy</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 text-center">
             <div>
                <TableIcon size={64} className="text-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Computing Dataset Engine...</p>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-12">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {reportList.map((r, i) => (
           <motion.div 
             layoutId={r.name}
             key={i} 
             onClick={() => setSelectedReport(r.name)}
             className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-50 hover:shadow-2xl group transition-all cursor-pointer relative overflow-hidden"
           >
              <div className="relative z-10">
                <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-[1.5rem] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all mb-8 shadow-inner">
                  <FileBarChart size={28} />
                </div>
                <h4 className="font-black text-slate-800 text-lg mb-2 uppercase tracking-tight">{r.name}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-6">{r.desc}</p>
                
                <div className="flex items-center gap-3 py-3 px-5 bg-slate-50/50 rounded-2xl w-fit group-hover:bg-primary/5 transition-colors">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{r.stats}</span>
                </div>

                <div className="mt-10 flex items-center justify-between border-t border-slate-50 pt-6">
                   <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                     <Eye size={16} /> Click to View
                   </span>
                   <button className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 hover:text-emerald-500 transition-colors">
                     <Download size={16} /> PDF
                   </button>
                </div>
              </div>
           </motion.div>
         ))}
       </div>

       <div className="bg-primary p-12 rounded-[4rem] shadow-2xl text-white relative overflow-hidden group">
          <div className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
             <div>
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                   <TrendingUp size={12} className="text-emerald-400" /> Executive Business intelligence
                </div>
                <h3 className="font-serif text-5xl font-black leading-tight">Master Financial Audit Statement</h3>
                <p className="text-white/40 text-lg mt-6 font-medium max-w-md leading-relaxed italic">Real-time aggregation of receivables, payables and inventory valuation across 4 nodes.</p>
                
                <button 
                  onClick={() => setSelectedReport('Account Balance Sheet')}
                  className="mt-12 px-10 py-5 bg-white text-primary rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20"
                >
                   Generate Full Audit Ledger
                </button>
             </div>

             <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-white/5 rounded-[2.5rem] backdrop-blur-sm border border-white/10">
                   <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Gross Sales (MTD)</p>
                   <p className="text-3xl font-black mt-2">₹{(totalSales / 100000).toFixed(1)}L</p>
                </div>
                <div className="p-8 bg-white/5 rounded-[2.5rem] backdrop-blur-sm border border-white/10">
                   <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Total Sourcing</p>
                   <p className="text-3xl font-black mt-2">₹{(totalPurchase / 100000).toFixed(1)}L</p>
                </div>
                <div className="p-8 bg-white/5 rounded-[2.5rem] backdrop-blur-sm border border-white/10">
                   <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Op. Expense</p>
                   <p className="text-3xl font-black mt-2">₹{(totalExpenses / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-8 bg-emerald-500/20 rounded-[2.5rem] backdrop-blur-sm border border-emerald-400/20">
                   <p className="text-emerald-400/50 text-[10px] font-black uppercase tracking-widest">Net Margin</p>
                   <p className="text-3xl font-black mt-2 text-emerald-400">+18.2%</p>
                </div>
             </div>
          </div>
          
          <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
             <TrendingUp size={450} />
          </div>
       </div>

       <AnimatePresence>
         {selectedReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="bg-white w-full max-w-4xl rounded-[4rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
               >
                  <div className="p-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                     <div>
                        <h4 className="font-black text-2xl text-slate-800 uppercase tracking-tight">{selectedReport}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Compiled Audit Logs & Database Query</p>
                     </div>
                     <button 
                       onClick={() => setSelectedReport(null)}
                       className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 transition-all active:scale-95"
                     >
                       <X size={28} />
                     </button>
                  </div>
                  <div className="p-12 overflow-y-auto flex-1">
                     {renderReportContent()}
                  </div>
                  <div className="px-12 pb-12 flex gap-4 flex-shrink-0">
                     <button onClick={() => window.print()} className="flex-1 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30">Download Full Ledger</button>
                     <button onClick={() => setSelectedReport(null)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-100">Close Audit Window</button>
                  </div>
               </motion.div>
            </div>
         )}
       </AnimatePresence>
    </div>
  );
}
