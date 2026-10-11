import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  X, 
  FileSpreadsheet,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { AppState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface TaxationProps {
  state: AppState;
  setView: (view: any) => void;
}

const MONTHS = [
  'April-2026', 'May-2026', 'June-2026', 
  'July-2026', 'August-2026', 'September-2026', 
  'October-2026', 'November-2026', 'December-2026', 
  'January-2027', 'February-2027', 'Mar-2027'
];

export default function Taxation({ state, setView }: TaxationProps) {
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [reportType, setReportType] = useState('GSTR 1');
  const [version, setVersion] = useState('VERSION 2');
  const [portalSync, setPortalSync] = useState(true);
  const [registerType, setRegisterType] = useState<string | null>(null);
  const [hsnSummary, setHsnSummary] = useState('SINGLE'); 

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Period Filtering Logic
  const getPeriodData = () => {
    let invoices = state.invoices;
    let purchases = state.purchaseInvoices;

    if (selectedMonth !== 'ALL') {
      const [monthName, year] = selectedMonth.split('-');
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
      const yearNum = parseInt(year);

      invoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === monthIndex && d.getFullYear() === yearNum;
      });

      purchases = purchases.filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === monthIndex && d.getFullYear() === yearNum;
      });
    }

    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      invoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d >= from && d <= to;
      });
      purchases = purchases.filter(p => {
        const d = new Date(p.date);
        return d >= from && d <= to;
      });
    }

    return { invoices, purchases };
  };

  const { invoices: filteredInvoices, purchases: filteredPurchases } = getPeriodData();

  // Calculation Logic
  const calculateTaxMetrics = () => {
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const data = reportType.includes('GSTR 2') ? filteredPurchases : filteredInvoices;

    data.forEach((inv: any) => {
      // For invoices, we calculate from items
      const invTaxable = inv.items.reduce((acc: number, item: any) => {
        const taxable = (item.qty * item.price) - (item.discount || 0);
        return acc + taxable;
      }, 0);

      taxableTotal += invTaxable;
      
      // If the invoice has explicit tax fields (like PurchaseInvoice often does)
      if (inv.cgst) cgstTotal += inv.cgst;
      if (inv.sgst) sgstTotal += inv.sgst;
      if (inv.igst) igstTotal += inv.igst;
      
      // If IGST is missing but it's an inter-state transaction (simplified)
      // Normally we'd check customer state vs company state
      if (!inv.cgst && !inv.igst && inv.taxRate) {
        cgstTotal += (invTaxable * (inv.taxRate / 2)) / 100;
        sgstTotal += (invTaxable * (inv.taxRate / 2)) / 100;
      }
    });

    return { taxableTotal, cgstTotal, sgstTotal, igstTotal };
  };

  const metrics = calculateTaxMetrics();

  // HSN Aggregation
  const getHsnSummaryData = () => {
    const summary: Record<string, { taxable: number, tax: number, qty: number }> = {};
    const data = reportType.includes('GSTR 2') ? filteredPurchases : filteredInvoices;

    data.forEach((inv: any) => {
      inv.items.forEach((item: any) => {
        const hsn = item.hsnCode || 'N/A';
        const taxable = (item.qty * (item.price || item.rate)) - (item.discount || 0);
        const product = state.products.find(p => p.id === item.productId);
        const gstRate = product ? (reportType.includes('GSTR 2') ? product.purchaseGst : product.sellGst) : 0;
        const tax = (taxable * gstRate) / 100;

        if (!summary[hsn]) summary[hsn] = { taxable: 0, tax: 0, qty: 0 };
        summary[hsn].taxable += taxable;
        summary[hsn].tax += tax;
        summary[hsn].qty += item.qty;
      });
    });

    return Object.entries(summary).map(([hsn, vals]) => ({ hsn, ...vals }));
  };

  const hsnData = getHsnSummaryData();

  const handleGenerate = () => {
    if (filteredInvoices.length === 0 && filteredPurchases.length === 0) {
      alert('No records found for the selected period.');
      return;
    }
    setIsGenerating(true);
    // Simulate multi-step generation
    setTimeout(() => {
      setIsGenerating(false);
      alert(`SUCCESS: ${reportType} Excel generated for ${selectedMonth} period. File saved to configuration path: D:\\KrishnaGST\\AnkitEnterprises\\GST_Excel\\${reportType.replace(' ', '_')}_${selectedMonth}.xls`);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-4 bg-emerald-500 text-white rounded-[1.5rem] shadow-xl shadow-emerald-500/20">
          <FileSpreadsheet size={28} />
        </div>
        <div>
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-lg leading-none">GST Command Center</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Compliance, Returns & HSN Filing Engine</p>
        </div>
      </div>

      <div className="bg-slate-500/10 border-4 border-slate-400 rounded-lg overflow-hidden shadow-2xl relative">
        {/* Title Bar like Window */}
        <div className="bg-slate-700 p-2 flex items-center justify-between text-white font-black text-[10px] uppercase tracking-widest">
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-red-400 rounded-full" />
             <div className="w-3 h-3 bg-yellow-400 rounded-full" />
             <div className="w-3 h-3 bg-green-400 rounded-full" />
             <span className="ml-2">GST Excel Generation [{state.businessProfile.name} {new Date().getFullYear()}-{new Date().getFullYear() + 1}]</span>
           </div>
           <X size={14} className="opacity-50" />
        </div>

        <div className="p-6 bg-[#afafaf] grid grid-cols-12 gap-6 min-h-[600px]">
          {/* Left Column: Month Selector */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
             <div className="space-y-2">
                <div className="bg-slate-800 text-white px-4 py-1 text-[11px] font-black uppercase inline-block">FOR MONTH NAME</div>
                <div className="bg-[#fefbe9] border-2 border-slate-400 h-[480px] overflow-y-auto">
                   <div 
                    className={cn(
                      "px-4 py-2 cursor-pointer font-black text-sm uppercase tracking-widest transition-colors",
                      selectedMonth === 'ALL' ? "bg-blue-900 text-white" : "hover:bg-blue-100/50"
                    )}
                    onClick={() => setSelectedMonth('ALL')}
                   >
                     ALL
                   </div>
                   {MONTHS.map(m => (
                     <div 
                      key={m}
                      className={cn(
                        "px-4 py-2 cursor-pointer font-bold text-sm uppercase transition-colors",
                        selectedMonth === m ? "bg-blue-900 text-white" : "hover:bg-blue-100/50"
                      )}
                      onClick={() => setSelectedMonth(m)}
                     >
                       {m}
                     </div>
                   ))}
                </div>
             </div>

             <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                  <span className="bg-slate-800 px-2 py-0.5">DATE FROM</span>
                  <input type="date" className="bg-[#fefbe9] border border-slate-400 text-xs font-bold px-2 py-0.5 outline-none" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                  <span className="bg-slate-800 px-2 py-0.5">DATE TO</span>
                  <input type="date" className="bg-[#fefbe9] border border-slate-400 text-xs font-bold px-2 py-0.5 outline-none" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
             </div>
          </div>

          {/* Right Column: Report Config */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
             {/* Main Report Selection */}
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 bg-white/40 p-6 border-2 border-slate-400 rounded-sm">
                   <div className="bg-slate-800 text-white px-4 py-1 text-[11px] font-black uppercase inline-block mb-2">Excel For</div>
                   <div className="space-y-2">
                      {[
                        { id: 'GSTR 1', label: 'GSTR 1' },
                        { id: 'GSTR 2A', label: 'GSTR 2A' },
                      ].map(type => (
                        <div key={type.id} className="flex items-center gap-3">
                           <input 
                            type="radio" 
                            name="reportType" 
                            id={type.id} 
                            checked={reportType === type.id}
                            onChange={() => setReportType(type.id)}
                            className="w-4 h-4 accent-blue-900"
                           />
                           <label htmlFor={type.id} className="bg-[#fefbe9] flex-1 px-4 py-1 text-blue-900 font-black text-lg uppercase tracking-widest border border-slate-300 cursor-pointer">{type.label}</label>
                        </div>
                      ))}
                      <div className="flex items-center gap-3">
                         <input 
                          type="radio" 
                          name="reportType" 
                          id="GSTR 3B" 
                          checked={reportType === 'GSTR 3B'}
                          onChange={() => setReportType('GSTR 3B')}
                          className="w-4 h-4 accent-blue-900"
                         />
                         <label htmlFor="GSTR 3B" className="bg-[#008080] text-white flex-1 px-4 py-2 text-sm font-black uppercase tracking-tight border border-slate-300 cursor-pointer">GSTR 3B + GSTR 9 (Detail)</label>
                      </div>
                      <div className="flex items-center gap-3">
                         <input 
                          type="radio" 
                          name="reportType" 
                          id="REPORT" 
                          checked={reportType === 'REPORT'}
                          onChange={() => setReportType('REPORT')}
                          className="w-4 h-4 accent-blue-900"
                         />
                         <label htmlFor="REPORT" className="bg-[#e0ffff] text-red-600 flex-1 px-4 py-2 text-xs font-black uppercase tracking-tight border border-slate-300 cursor-pointer">GST Sale/Purchase Tax Summary (Report)</label>
                      </div>
                   </div>
                </div>

                <div className="space-y-3 p-6 flex flex-col justify-center">
                   <div className="bg-[#d3d3d3] border-2 border-slate-400 p-4 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-2">
                            <input type="checkbox" id="v1" checked={version === 'VERSION 1'} onChange={() => setVersion('VERSION 1')} className="accent-slate-800" />
                            <label htmlFor="v1" className="text-[10px] font-black uppercase">VERSION 1</label>
                         </div>
                         <div className="flex items-center gap-2">
                            <input type="checkbox" id="v2" checked={version === 'VERSION 2'} onChange={() => setVersion('VERSION 2')} className="accent-slate-800" />
                            <label htmlFor="v2" className="text-[10px] font-black uppercase">VERSION 2</label>
                         </div>
                      </div>
                      <div className="bg-white border border-slate-300 p-2 flex items-center gap-2">
                         <input type="checkbox" id="portal" checked={portalSync} onChange={() => setPortalSync(!portalSync)} className="accent-blue-900" />
                         <label htmlFor="portal" className="text-[9px] font-black uppercase tracking-tighter">AS PER GST PORTAL (gst.gov.in)</label>
                      </div>
                   </div>
                </div>
             </div>

             {/* Registry Selection */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#787878] p-4 space-y-2">
                   {[
                    { id: 'sale', label: 'SALE REGISTER (Excel)' },
                    { id: 'purchase', label: 'PURCHASE REGISTER (Excel)' },
                    { id: 'stock', label: 'STOCK REGISTER (Excel)' }
                   ].map(reg => (
                    <div key={reg.id} className="flex items-center gap-3">
                       <input 
                        type="radio" 
                        name="registerType" 
                        checked={registerType === reg.id}
                        onChange={() => setRegisterType(reg.id)}
                        className="w-4 h-4 accent-white" 
                       />
                       <label className="text-[10px] font-bold text-white uppercase flex-1">{reg.label}</label>
                    </div>
                   ))}
                </div>
                <div className="bg-[#787878] p-4 flex items-center gap-2">
                   <input type="checkbox" id="dateWise" className="accent-white" />
                   <label htmlFor="dateWise" className="text-[10px] font-bold text-white uppercase">Bill Date Wise</label>
                </div>
             </div>

             {/* Configuration Detail */}
             <div className="space-y-1">
                <div className="flex items-center gap-3 bg-[#fefbe9] p-1 px-4 border border-slate-300">
                  <input type="checkbox" id="prefix" className="accent-blue-900" />
                  <label htmlFor="prefix" className="text-[10px] font-black uppercase italic">BILL NO WITH PREFIX (GTI-2022-501)</label>
                </div>
                <div className="grid grid-cols-4 gap-1">
                   <div className="bg-[#fefbe9] border border-slate-300 p-2 flex flex-col items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Taxable Total</span>
                      <span className="text-sm font-black text-blue-900 leading-none">₹{metrics.taxableTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                   </div>
                   <div className="bg-[#fefbe9] border border-slate-300 p-2 flex flex-col items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">CGST / SGST</span>
                      <span className="text-sm font-black text-rose-600 leading-none">₹{(metrics.cgstTotal + metrics.sgstTotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                   </div>
                   <div className="bg-[#fefbe9] border border-slate-300 p-2 flex flex-col items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">IGST Total</span>
                      <span className="text-sm font-black text-rose-600 leading-none">₹{metrics.igstTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                   </div>
                   <div className="bg-[#fefbe9] border border-slate-300 p-2 flex flex-col items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Records Found</span>
                      <span className="text-sm font-black text-slate-800 leading-none">{reportType.includes('GSTR 2') ? filteredPurchases.length : filteredInvoices.length} Entries</span>
                   </div>
                </div>
             </div>

             {/* HSN Summary Table Preview */}
             <div className="bg-white/50 border border-slate-300 rounded overflow-hidden">
                <div className="bg-slate-700 text-white px-3 py-1 text-[9px] font-black uppercase flex justify-between">
                   <span>HSN Summary Preview</span>
                   <span>{hsnData.length} HSN Codes</span>
                </div>
                <div className="max-h-[140px] overflow-y-auto">
                   <table className="w-full text-[9px]">
                      <thead className="bg-slate-100 text-slate-500 sticky top-0">
                         <tr>
                            <th className="px-2 py-1 text-left">HSN CODE</th>
                            <th className="px-2 py-1 text-right">QUANTITY</th>
                            <th className="px-2 py-1 text-right">TAXABLE AMT</th>
                            <th className="px-2 py-1 text-right">TAX AMT</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                         {hsnData.length === 0 ? (
                           <tr><td colSpan={4} className="py-4 text-center text-slate-400 italic">No HSN data found for period</td></tr>
                         ) : (
                           hsnData.map(row => (
                             <tr key={row.hsn} className="hover:bg-blue-50">
                                <td className="px-2 py-1.5 font-black text-blue-900">{row.hsn}</td>
                                <td className="px-2 py-1.5 text-right font-bold">{row.qty.toLocaleString()}</td>
                                <td className="px-2 py-1.5 text-right font-bold text-slate-700">₹{row.taxable.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                <td className="px-2 py-1.5 text-right font-black text-rose-600">₹{row.tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                             </tr>
                           ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* Footer Info & Actions */}
             <div className="space-y-4 pt-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-1">
                   <span className="text-[11px] font-black text-white uppercase italic">FROM LOCATION (EXCEL)</span>
                   <div className="bg-white border border-slate-400 px-3 py-1 font-mono text-[9px] text-slate-800 truncate">D:\KrishnaGST\AnkitEnterprises\AnkitEnterprises\GST_Excel\KrishnaGSTR1.xls</div>
                   <span className="text-[11px] font-black text-white uppercase italic">SAVE LOCATION (EXCEL)</span>
                   <div className="bg-white border border-slate-400 px-3 py-1 font-mono text-[9px] text-slate-800 truncate">D:\KrishnaGST\AnkitEnterprises\AnkitEnterprises\GST_Excel</div>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                   <div className="col-span-12 md:col-span-6 flex gap-2">
                      <button 
                        onClick={() => alert('Searching local file system for KrishnaGSTR1.xls...')}
                        className="bg-white px-4 py-2 border-2 border-slate-400 text-xs font-black uppercase tracking-tighter"
                      >
                        Search Excel File
                      </button>
                      <div className="bg-white border-2 border-slate-400 flex items-center px-4 gap-2">
                         <input type="checkbox" id="search-gstr1" />
                         <label htmlFor="search-gstr1" className="text-[10px] font-black uppercase">Search GSTR1</label>
                      </div>
                      <div className="bg-white border-2 border-slate-400 flex items-center px-4 gap-2">
                         <input type="checkbox" id="direct-save" />
                         <label htmlFor="direct-save" className="text-[10px] font-black uppercase">Direct SAVE</label>
                      </div>
                   </div>

                   <div className="col-span-12 md:col-span-6 flex gap-4">
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={cn(
                          "flex-1 transition-all text-white py-4 text-xl font-black uppercase tracking-widest border-2 border-slate-600 shadow-xl flex items-center justify-center gap-2",
                          isGenerating ? "bg-slate-400 cursor-wait" : "bg-rose-500 hover:bg-rose-600 active:scale-95"
                        )}
                      >
                        {isGenerating ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"/> Generating...</> : 'Generate'}
                      </button>
                      <button 
                        onClick={() => setView('dashboard')}
                        className="flex-1 bg-slate-300 hover:bg-slate-400 transition-all text-black py-4 text-xl font-black uppercase tracking-widest border-2 border-slate-600 shadow-xl active:scale-95"
                      >
                        Exit
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
        
        {/* Bottom Status Bar */}
        <div className="bg-[#e4e4bd] p-2 border-t-2 border-slate-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
          { label: 'GSTIN Validation', value: 'Active', icon: <CheckCircle2 size={16} /> },
          { label: 'Portal Connectivity', value: 'Locked', icon: <AlertCircle size={16} /> },
          { label: 'HSN Mappings', value: '100% Sync', icon: <CheckCircle2 size={16} /> },
          { label: 'Tax Audits', value: 'Clean', icon: <CheckCircle2 size={16} /> }
         ].map(stat => (
           <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-xl font-black text-slate-800">{stat.value}</p>
              </div>
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">{stat.icon}</div>
           </div>
         ))}
      </div>
    </div>
  );
}
