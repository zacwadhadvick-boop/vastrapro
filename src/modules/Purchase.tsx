import React, { useState, Dispatch, SetStateAction } from 'react';
import { ShoppingCart, Plus, Calendar, Filter, FileText, Search, X, PackageCheck, TrendingDown, Trash2, Truck as TruckIcon, Printer } from 'lucide-react';
import { AppState, PurchaseInvoice, Supplier } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ReportHeader from '../components/ReportHeader';

interface PurchaseProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  currentView?: string;
}

export default function Purchase({ state, setState, currentView }: PurchaseProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickSupplierModal, setIsQuickSupplierModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'registry' | 'bill'>('registry');

  // Sync tab with external view changes
  React.useEffect(() => {
    if (currentView?.startsWith('purchase:')) {
      const tab = currentView.split(':')[1] as any;
      if (['registry', 'bill'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [currentView]);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [showTransportSlip, setShowTransportSlip] = useState(false);

  const selectedBill = state.purchaseInvoices.find(p => p.id === selectedBillId) || state.purchaseInvoices[0];
  const selectedSupplier = state.suppliers.find(s => s.id === selectedBill?.supplierId);

  const handleAddPurchase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const billNo = formData.get('billNo') as string;
    const supplierId = formData.get('supplierId') as string;
    const productId = formData.get('productId') as string;
    const qty = Number(formData.get('qty'));
    const rate = Number(formData.get('rate')) || (amount / qty);

    const newPurchase: PurchaseInvoice = {
      id: Math.random().toString(36).substr(2, 9),
      billNo: billNo,
      date: new Date().toISOString(),
      supplierId: supplierId,
      items: productId ? [{
        productId,
        qty,
        rate,
        pcs: Number(formData.get('pcs')),
        category: formData.get('category') as string,
        brand: formData.get('brand') as string,
        barcode: formData.get('barcode') as string,
        tc: formData.get('tc') as string,
        mtr: Number(formData.get('mtr')),
        baleNo: formData.get('baleNo') as string,
      }] : [],
      totalAmount: amount,
      status: 'received',
      entryType: formData.get('entryType') as string || 'Purchase Bill',
      entryNo: formData.get('entryNo') as string,
      billDate: formData.get('billDate') as string,
      dueOn: formData.get('dueOn') as string,
      statusLabel: 'Final',
      msmeNo: formData.get('msmeNo') as string,
      gstForm: formData.get('gstForm') as string,
      partyRemark: formData.get('partyRemark') as string,
      brokerName: formData.get('brokerName') as string,
      transporterName: formData.get('transporterName') as string,
      biltyNo: formData.get('biltyNo') as string,
      biltyDate: formData.get('biltyDate') as string,
      weight: formData.get('weight') as string,
      baleQty: Number(formData.get('baleQty')),
      freightChar: Number(formData.get('freightChar')),
      rdAmount: Number(formData.get('rdAmount')),
      discountAmount: Number(formData.get('discountAmount')),
      cgst: Number(formData.get('cgst')),
      sgst: Number(formData.get('sgst')),
      igst: Number(formData.get('igst')),
      roundOff: Number(formData.get('roundOff')),
    };

    const newLedgerEntry = {
      id: `acc-pur-${Date.now()}`,
      date: new Date().toISOString(),
      description: `Purchase Bill ${billNo}`,
      amount: amount,
      type: 'debit' as const,
      entityId: supplierId,
      category: 'Purchase'
    };

    setState(prev => {
      // Sync with Inventory
      const newProducts = prev.products.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            variants: p.variants.map((v, idx) => 
               idx === 0 ? { ...v, qty: v.qty + qty } : v
            )
          };
        }
        return p;
      });

      return {
        ...prev,
        purchaseInvoices: [newPurchase, ...prev.purchaseInvoices],
        ledgerEntries: [newLedgerEntry, ...prev.ledgerEntries],
        products: newProducts
      };
    });
    setIsModalOpen(false);
  };

  const handleDeletePurchase = (id: string) => {
    if (confirm('Delete this purchase bill?')) {
      setState(prev => ({
        ...prev,
        purchaseInvoices: prev.purchaseInvoices.filter(p => p.id !== id)
      }));
    }
  };

  const filteredPurchases = state.purchaseInvoices.filter(p => 
    p.billNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.supplierId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const suggestions = Array.from(new Set([
    ...state.purchaseInvoices.map(p => p.billNo),
    ...state.purchaseInvoices.map(p => state.suppliers.find(s => s.id === p.supplierId)?.name || p.supplierId),
    ...state.suppliers.map(s => s.name),
    ...state.suppliers.map(s => s.city),
    ...state.products.map(p => p.name),
  ]));

  return (
    <div className="space-y-12 pb-20">
      <datalist id="purchase-suggestions">
        {suggestions.map((s, i) => <option key={i} value={s} />)}
      </datalist>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
         <div className="flex items-center gap-4">
            <div className="p-4 bg-primary text-white rounded-[1.5rem] shadow-xl shadow-primary/20"><ShoppingCart size={24} /></div>
            <div>
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-lg">Inventory Inward</h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Supply Chain & Purchase Ledger</p>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setActiveTab('registry')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'registry' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Inward Registry
              </button>
              <button 
                onClick={() => setActiveTab('bill')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === 'bill' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Purchase Bill
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    list="purchase-suggestions"
                    placeholder="Find bill..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-6 py-2.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary/5 transition-all w-64 shadow-sm"
                  />
                </div>
                <button 
                  onClick={() => {}}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Search
                </button>
              </div>
              <button 
                 onClick={() => setIsModalOpen(true)}
                 className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <Plus size={16} /> New Inward GRN
              </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {activeTab === 'registry' ? (
           <div className="xl:col-span-3">
             <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-50 overflow-hidden p-8 md:p-12">
               <div className="hidden print:block mb-8">
                 <ReportHeader />
                 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest text-center my-6">Inward Purchase Registry</h2>
               </div>
               <div className="flex items-center justify-between mb-8 no-print">
                 <div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Material Logs</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Audit trail of all incoming goods</p>
                 </div>
                 <button 
                   onClick={() => window.print()}
                   className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2"
                 >
                   <Printer size={14} /> Print Registry
                 </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-slate-50/50">
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inward Document</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Entity</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valuation</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {filteredPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-8 py-32 text-center">
                             <div className="flex flex-col items-center gap-4 opacity-20">
                                <PackageCheck size={64} />
                                <p className="font-black uppercase tracking-[0.3em] text-[10px]">No supply logs found</p>
                             </div>
                          </td>
                        </tr>
                     ) : (
                       filteredPurchases.map(p => (
                         <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                    <FileText size={18} />
                                 </div>
                                 <span className="font-black text-slate-800 text-sm tracking-tight">{p.billNo || 'N/A'}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-slate-500 font-black text-[11px] uppercase tracking-tighter">
                             {state.suppliers.find(s => s.id === p.supplierId)?.name || p.supplierId}
                           </td>
                           <td className="px-8 py-6 text-slate-300 text-[10px] font-black uppercase">{format(new Date(p.date), 'dd MMM yyyy')}</td>
                           <td className="px-8 py-6 font-black text-primary text-base">₹{p.totalAmount.toLocaleString()}</td>
                           <td className="px-8 py-6">
                             <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2 w-fit">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Received
                             </span>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                    onClick={() => {
                                       setSelectedBillId(p.id);
                                       setActiveTab('bill');
                                       setTimeout(() => window.print(), 100);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition-colors"
                                    title="Quick Print"
                                 >
                                    <Printer size={14} />
                                 </button>
                                 <button 
                                    onClick={() => {
                                       setSelectedBillId(p.id);
                                       setActiveTab('bill');
                                    }}
                                    className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 hover:bg-blue-100 transition-colors"
                                    title="View Purchase Bill"
                                 >
                                    <FileText size={14} />
                                 </button>
                                 <button 
                                    onClick={() => handleDeletePurchase(p.id)}
                                    className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-100 transition-colors"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
           </div>
         ) : (
           <div className="xl:col-span-3 bg-slate-100/50 p-10 rounded-[3rem] border border-slate-200 shadow-inner min-h-[900px]">
          <div className="max-w-7xl mx-auto space-y-6">
            {!selectedBill ? (
              <div className="flex flex-col items-center justify-center py-40 text-slate-400 space-y-6">
                 <ShoppingCart size={80} className="opacity-10" />
                 <p className="font-black uppercase tracking-[0.3em] text-[10px]">Select a bill from registry to view details</p>
                 <button onClick={() => setActiveTab('registry')} className="px-8 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">Go to Registry</button>
              </div>
            ) : (
              <div className="space-y-6 print:p-0">
                {/* Print Only Header */}
                <div className="hidden print:block mb-8">
                   <ReportHeader />
                </div>

                {/* Bill Header Section */}
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-3 space-y-4">
                    <div className="bg-blue-900 text-white p-6 rounded-3xl shadow-xl space-y-2">
                      <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Entry Type</p>
                      <h4 className="text-xl font-black italic tracking-tighter uppercase">{selectedBill.entryType || 'Purchase Bill'}</h4>
                      <div className="pt-4 flex justify-between items-center border-t border-white/10">
                        <span className="text-[10px] font-black opacity-50 uppercase">Status</span>
                        <span className="bg-green-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{selectedBill.statusLabel || 'Final'}</span>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry No</p>
                      <p className="text-4xl font-black text-blue-900">{selectedBill.entryNo || '13'}</p>
                    </div>
                  </div>

                  <div className="col-span-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-start justify-between border-b border-slate-50 pb-6">
                       <div className="space-y-4">
                          <h2 className="text-2xl font-black text-slate-800 uppercase flex items-center gap-3">
                             {selectedSupplier?.name || 'Unknown Supplier'}
                             <button className="p-1 hover:text-primary transition-colors"><Plus size={16} className="text-slate-200" /></button>
                          </h2>
                          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[11px] font-bold uppercase text-slate-500">
                             <div className="flex justify-between"><span>Address:</span> <span className="text-slate-800">{selectedSupplier?.address || '-'}</span></div>
                             <div className="flex justify-between"><span>City:</span> <span className="text-slate-800 text-blue-600">SURAT</span></div>
                             <div className="flex justify-between"><span>Mobile:</span> <span className="text-slate-800 underline">8469000011</span></div>
                             <div className="flex justify-between"><span>GST No.</span> <span className="text-slate-800">{selectedSupplier?.gstin || '-'}</span></div>
                             <div className="flex justify-between"><span>GST Form</span> <span className="text-blue-500">GST PURCHASE {'{OUT-STATE}'}</span></div>
                             <div className="flex justify-between"><span>MSME No.</span> <span className="text-slate-800">-</span></div>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Party Remark:</span>
                       <span className="text-[11px] font-bold text-slate-600 uppercase">Regular Client</span>
                    </div>
                  </div>

                  <div className="col-span-3 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl space-y-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">Billing Date</p>
                       <p className="text-2xl font-black italic tracking-tighter">{format(new Date(selectedBill.date), 'dd/MMM/yyyy')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 font-black uppercase text-[9px] tracking-widest opacity-40">
                       <div className="space-y-1">
                          <span>Bill No</span>
                          <span className="block text-white text-lg opacity-100">{selectedBill.billNo}</span>
                       </div>
                       <div className="space-y-1">
                          <span>Bill Date</span>
                          <span className="block text-white text-lg opacity-100">{selectedBill.billDate || format(new Date(selectedBill.date), 'dd/MM/yyyy')}</span>
                       </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="opacity-30">Due On</span>
                          <span className="text-red-400">{selectedBill.dueOn || '09/Jun/2026'}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Info (Logistics) */}
                <div className="grid grid-cols-12 gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-full bg-blue-50/30 -skew-x-12 translate-x-32" />
                   <div className="col-span-12 relative z-10 grid grid-cols-5 gap-8">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Broker</p>
                         <p className="text-xs font-black text-slate-800 uppercase">{selectedBill.brokerName || 'PRAGYA TEXTILE AGENCIES'}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transporter</p>
                         <p className="text-xs font-black text-slate-800 uppercase">{selectedBill.transporterName || 'MEHTA INTERSTATE TRANSPORT CORP'}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bilty No</p>
                         <p className="text-xs font-black text-blue-600">{selectedBill.biltyNo || '06457522'}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bilty Date</p>
                         <p className="text-xs font-black text-slate-800">{selectedBill.biltyDate || '15/Apr/2026'}</p>
                      </div>
                      <div className="space-y-1 text-right no-print">
                         <div className="flex gap-2 justify-end">
                            <button 
                               onClick={() => window.print()}
                               className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2"
                            >
                               <Printer size={14} /> Print Bill
                            </button>
                            <button 
                               onClick={() => setShowTransportSlip(selectedBill.biltyNo)}
                               className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary transition-all hover:text-white"
                            >
                               Check Transport Slip
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                          <th className="px-10 py-6 w-16">#</th>
                          <th className="px-10 py-6">Category</th>
                          <th className="px-10 py-6">Brand</th>
                          <th className="px-10 py-6">Articles</th>
                          <th className="px-10 py-6 text-right">Rate</th>
                          <th className="px-10 py-6 text-right">Amount</th>
                          <th className="px-10 py-6 text-right">Bale No.</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-black text-xs uppercase text-slate-800 italic tracking-tighter">
                       {selectedBill.items.map((item, idx) => {
                          const product = state.products.find(p => p.id === item.productId);
                          return (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                               <td className="px-10 py-5 text-slate-300 font-bold">{idx + 1}</td>
                               <td className="px-10 py-5">{product?.category || 'CATLOG'}</td>
                               <td className="px-10 py-5">{product?.brand || 'VARSHNEY ALOK'}</td>
                               <td className="px-10 py-5 text-blue-600">{product?.name || 'SUIT SET - 001'}</td>
                               <td className="px-10 py-5 text-right">{item.rate.toFixed(2)}</td>
                               <td className="px-10 py-5 text-right">{(item.rate * item.qty).toFixed(2)}</td>
                               <td className="px-10 py-5 text-right">{item.baleNo || '10672'}</td>
                            </tr>
                          );
                       })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Section (Calculations) */}
                <div className="grid grid-cols-12 gap-6 bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 -skew-x-12 translate-x-20" />
                   
                   <div className="col-span-8 grid grid-cols-4 gap-6 relative z-10">
                      <div className="space-y-4">
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Barcode</p>
                            <p className="text-xs font-black text-white italic">{selectedBill.items[0]?.barcode || 'DSST-13000'}</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">TC</p>
                            <p className="text-xs font-black text-white italic">{selectedBill.items[0]?.tc || '0'}</p>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Total Pcs</p>
                            <p className="text-xl font-black text-white italic">{selectedBill.items.reduce((a, b) => a + (b.pcs || 0), 0) || '64'}</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Total Mtr</p>
                            <p className="text-xl font-black text-white italic">{(selectedBill.items.reduce((a, b) => a + (b.mtr || 0), 0)).toFixed(2)}</p>
                         </div>
                      </div>
                      <div className="col-span-2 space-y-4">
                         <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex justify-between items-center">
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Base Amount</span>
                            <span className="text-2xl font-black text-white italic italic">₹{selectedBill.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                               <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">RD Amount</p>
                               <p className="text-sm font-black text-yellow-400 italic">{(selectedBill.rdAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                               <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Total Disc.</p>
                               <p className="text-sm font-black text-red-400 italic">{(selectedBill.discountAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="col-span-4 space-y-6 relative z-10 border-l border-white/10 pl-10">
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                            <span>IGST ({selectedBill.igst ? '5' : '0'}%)</span>
                            <span className="text-white">{(selectedBill.igst || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                            <span>Round Off</span>
                            <span className="text-white">{(selectedBill.roundOff || 0).toFixed(2)}</span>
                         </div>
                      </div>
                      
                      <div className="bg-primary/20 p-8 rounded-[2.5rem] border border-primary/30 space-y-2">
                         <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Payable Bill Amount</p>
                         <h3 className="text-4xl font-black text-white italic tracking-tighter">₹{selectedBill.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                      </div>
                   </div>
                </div>
              </div>
            )}
           </div>
          </div>
        )}

      <AnimatePresence>
        {showTransportSlip && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="bg-[#faf7f2] w-full max-w-lg rounded-3xl shadow-2xl border-4 border-white overflow-hidden relative"
             >
                <div className="bg-red-500 text-white px-6 py-2 flex items-center justify-between font-black text-[10px] uppercase tracking-widest">
                   <span>Transport Slip ==&gt;</span>
                   <button onClick={() => setShowTransportSlip(false)} className="hover:scale-110 transition-transform flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded">CLOSE</button>
                </div>
                <div className="p-10 text-center space-y-6 text-[#2d2d2d] font-serif">
                   <div className="space-y-1">
                      <p className="text-sm italic font-bold">{"{Transport Slip Exists}"}</p>
                      <div className="w-full border-t border-[#2d2d2d]/10 my-2" />
                   </div>
                   
                   <div className="space-y-4">
                      <div className="space-y-1">
                         <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Supplier</p>
                         <p className="text-lg font-black uppercase text-blue-900">{selectedSupplier?.name || 'VARSHNEY ALOK SUIT PVT. LTD.'}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-xs font-bold font-sans uppercase">
                         <div className="flex justify-between items-center italic"><span>TS Entry No:</span> <span className="text-blue-600">13</span></div>
                         <div className="flex justify-between items-center italic"><span>TS Entry Date:</span> <span>15/Apr/2026</span></div>
                         <div className="flex justify-between items-center"><span>BILTY NO:</span> <span className="font-black">06457522</span></div>
                         <div className="flex justify-between items-center"><span>BILTY DATE:</span> <span>11/Apr/2026</span></div>
                         <div className="flex justify-between items-center"><span>FREIGHT:</span> <span className="text-green-600">500</span></div>
                         <div className="flex justify-between items-center"><span>BALES:</span> <span>1</span></div>
                         <div className="flex justify-between items-center italic"><span>Private Marka:</span> <span>521</span></div>
                      </div>
                      
                      <div className="pt-4 space-y-1">
                         <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Transporter</p>
                         <p className="text-xs font-black uppercase">{selectedBill?.transporterName || 'MEHTA INTERSTATE TRANSPORT CORP.'}</p>
                      </div>
                   </div>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5 -z-10 text-900 pointer-events-none">
                   <TruckIcon size={200} />
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

         <div className="space-y-6">
            <div className="p-8 bg-white border border-slate-50 rounded-[3rem] shadow-sm relative overflow-hidden group">
               <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Purchase (MTD)</p>
                  <h4 className="text-4xl font-black text-slate-800 mt-2">₹{(state.purchaseInvoices.reduce((a, b) => a + b.totalAmount, 0) / 100000).toFixed(1)}L</h4>
                  <div className="mt-4 flex items-center gap-2 text-red-500 uppercase font-black text-[9px] tracking-widest">
                     <TrendingDown size={14} /> +12.4% vs Prev Month
                  </div>
               </div>
               <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 text-slate-50 group-hover:scale-110 transition-transform duration-700">
                  <TrendingDown size={180} />
               </div>
            </div>

            <div className="bg-primary p-10 rounded-[3rem] text-white shadow-2xl shadow-primary/20">
               <h4 className="font-serif text-2xl font-bold italic">Procurement Insight</h4>
               <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-6">Active Suppliers</p>
               <p className="text-3xl font-black">{state.suppliers.length}</p>
               
               <div className="w-full h-px bg-white/10 my-8" />
               
               <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Pending Orders</p>
               <p className="text-3xl font-black">0</p>
            </div>
         </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-4xl rounded-[3.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div>
                   <h4 className="font-black text-slate-800 uppercase tracking-tight text-xl">Material Inward Log</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Goods Receipt Note Creation</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 transition-all"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleAddPurchase} className="p-8 space-y-8 h-[75vh] overflow-y-auto">
                {/* Section: Header Info */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Entry Type</label>
                    <input name="entryType" defaultValue="Purchase Bill" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-black text-xs uppercase" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Entry No</label>
                    <input name="entryNo" placeholder="13" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-black text-xs uppercase" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bill No</label>
                    <input name="billNo" required placeholder="521" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-black text-xs uppercase" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bill Date</label>
                    <input name="billDate" type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-black text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Due On</label>
                    <input name="dueOn" type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-black text-xs" />
                  </div>
                </div>

                {/* Section: Supplier Details */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">Supplier Registry</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between pl-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sourcing Account</label>
                        <button 
                          type="button"
                          onClick={() => setIsQuickSupplierModal(true)}
                          className="text-[8px] font-black text-primary uppercase hover:underline"
                        >
                          + New Vendor
                        </button>
                      </div>
                      <select name="supplierId" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs appearance-none">
                         {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">GST Form</label>
                      <input name="gstForm" defaultValue="GST PURCHASE {OUT-STATE}" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs uppercase" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">MSME No</label>
                      <input name="msmeNo" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Party Remark</label>
                      <input name="partyRemark" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs uppercase" />
                    </div>
                  </div>
                </div>

                {/* Section: Logistics */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-100 pb-2">Logistics & Handling</p>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Broker Name</label>
                         <input name="brokerName" list="broker-list" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs uppercase" />
                         <datalist id="broker-list">
                            {state.brokers.map(b => <option key={b.id} value={b.name} />)}
                         </datalist>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Transporter Name</label>
                         <input name="transporterName" list="transporter-list" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs uppercase" />
                         <datalist id="transporter-list">
                            {Array.from(new Set(state.transportLogs.map(l => l.transporterName))).map(t => <option key={t} value={t} />)}
                         </datalist>
                      </div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bilty/LR No</label>
                         <div className="flex gap-2">
                           <input 
                             name="biltyNo" 
                             id="biltyNoInput"
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs" 
                           />
                           <button 
                             type="button"
                             onClick={() => {
                               const val = (document.getElementById('biltyNoInput') as HTMLInputElement).value;
                               if(val) setShowTransportSlip(val);
                             }}
                             className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                             title="View Transport Slip"
                           >
                             <TruckIcon size={16} />
                           </button>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bilty Date</label>
                         <input name="biltyDate" type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Weight</label>
                         <input name="weight" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs" />
                      </div>
                   </div>
                </div>

                {/* Section: Product Items */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2">Item Specifications</p>
                   <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Article Selection</label>
                         <select name="productId" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-bold text-xs appearance-none cursor-pointer">
                            <option value="">Select Article...</option>
                            {state.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
                         </select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Qty (Pcs/Mtr)</label>
                          <input name="qty" type="number" required placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-black text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Rate</label>
                          <input name="rate" type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-black text-xs" />
                        </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bale Qty</label>
                      <input name="baleQty" type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/5 font-black text-xs" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase pl-1">Brand</label>
                        <input name="brand" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs uppercase" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase pl-1">Category</label>
                        <input name="category" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs uppercase" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase pl-1">Bale No.</label>
                        <input name="baleNo" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs uppercase" />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase pl-1">Barcode</label>
                        <input name="barcode" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase pl-1">TC</label>
                        <input name="tc" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase pl-1">Pcs</label>
                        <input name="pcs" type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase pl-1">Mtr</label>
                        <input name="mtr" type="number" step="0.01" className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Financials */}
                <div className="space-y-4 bg-slate-900 p-8 rounded-3xl text-white">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-white/10 pb-2">Financial Accounting</p>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Total Valuation</label>
                         <input name="amount" type="number" required placeholder="0.00" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-primary/50 font-black text-sm text-blue-300" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/30 uppercase pl-1">CGST</label>
                            <input name="cgst" type="number" step="0.01" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/30 uppercase pl-1">IGST</label>
                            <input name="igst" type="number" step="0.01" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs" />
                         </div>
                      </div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">RD Amount</label>
                         <input name="rdAmount" type="number" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-xs" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Discount</label>
                         <input name="discountAmount" type="number" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-xs" />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Freight</label>
                         <input name="freightChar" type="number" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-xs" />
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="submit" className="flex-1 py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]">Generate Purchase Bill</button>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showTransportSlip && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
                <div>
                  <h4 className="font-black uppercase tracking-widest text-[10px]">Logistics Verification</h4>
                  <p className="text-white/60 text-[8px] font-bold uppercase mt-0.5">LR #{showTransportSlip}</p>
                </div>
                <button 
                  onClick={() => setShowTransportSlip(null)} 
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all font-bold"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-8">
                {state.transportLogs.find(l => l.lrNo === showTransportSlip) ? (
                  <div className="space-y-6">
                    {(() => {
                      const log = state.transportLogs.find(l => l.lrNo === showTransportSlip)!;
                      return (
                        <>
                          <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-50 text-[10px]">
                            <div>
                               <p className="text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Transporter</p>
                               <p className="font-black text-slate-800">{log.transporterName}</p>
                            </div>
                            <div>
                               <p className="text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Vehicle No</p>
                               <p className="font-black text-slate-800 uppercase tabular-nums">{log.vehicleNo || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6 text-[10px]">
                            <div>
                               <p className="text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Freight (Paid)</p>
                               <p className="font-black text-emerald-600 text-lg tabular-nums">₹{log.freightAmount.toLocaleString()}</p>
                            </div>
                            <div>
                               <p className="text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Dispatch Hub</p>
                               <p className="font-black text-slate-800">{log.fromCity || 'Central'}</p>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                             <span className="text-[9px] font-black uppercase text-slate-400">Current Status</span>
                             <span className={cn(
                               "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                               log.status === 'delivered' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                             )}>{log.status}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <TruckIcon size={32} className="text-slate-200" />
                     </div>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">System cannot locate LR Record #{showTransportSlip} in active logistics database.</p>
                  </div>
                )}
              </div>
              <div className="px-8 pb-8">
                 <button 
                   onClick={() => setShowTransportSlip(null)}
                   className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                 >
                    Close Information Window
                 </button>
              </div>
            </motion.div>
          </div>
        )}

        {isQuickSupplierModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-black text-slate-800 uppercase tracking-tight">Quick Add Supplier</h4>
                <button onClick={() => setIsQuickSupplierModal(false)} className="text-slate-300 hover:text-red-500"><X size={20} /></button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const sId = `s-${Math.random().toString(36).substr(2, 5)}`;
                setState(prev => ({
                  ...prev,
                  suppliers: [...prev.suppliers, {
                    id: sId,
                    name: formData.get('name') as string,
                    gstin: formData.get('gstin') as string,
                    phone: formData.get('phone') as string
                  }]
                }));
                setIsQuickSupplierModal(false);
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Supplier Name</label>
                  <input name="name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GSTIN</label>
                  <input name="gstin" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</label>
                  <input name="phone" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none text-sm font-bold" />
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white font-black rounded-xl uppercase tracking-widest text-[10px] mt-2">Add to Registry</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
