import { useState, Dispatch, SetStateAction } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Save, 
  Printer, 
  X, 
  ArrowLeftRight, 
  Wallet, 
  Calendar,
  User,
  CreditCard,
  ChevronDown,
  Calculator,
  ShieldCheck,
  Building
} from 'lucide-react';
import { AppState, BillAdjustment, Supplier, Broker } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface BillAdjustmentProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
}

export default function BillAdjustmentModule({ state, setState }: BillAdjustmentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // Form State
  const [entryType, setEntryType] = useState('Bank Payment');
  const [entryNo, setEntryNo] = useState(String(state.billAdjustments.length + 1));
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [creditAc, setCreditAc] = useState('YES BANK, PRAYAGRAJ');
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  
  // Dynamic Items
  const [billItems, setBillItems] = useState<any[]>([
    { id: Date.now().toString(), rd: '0.00', rdQty: 0, rdAmt: 0, deduction: 0, schemePerc: 0, schemeAmt: 0, bcPerc: 0, bcAmt: 0, intPerc: 0, intAmt: 0, netAmt: 0 }
  ]);
  const [partPayments, setPartPayments] = useState<any[]>([
    { id: (Date.now() + 1).toString(), vType: 'BPMT', vNo: '', vDate: format(new Date(), 'yyyy-MM-dd'), amount: 0, chqNo: 'NEFT', remark: '' }
  ]);
  const [chequeDetail, setChequeDetail] = useState({
    amount: 0,
    bankCharges: 0,
    agentComm: 0,
    chqNo: 'NEFT',
    date: format(new Date(), 'yyyy-MM-dd'),
    remark: ''
  });

  const totalBillAmount = billItems.reduce((acc, item) => acc + (parseFloat(item.netAmt) || 0), 0);
  const totalPartAmount = partPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const balance = totalBillAmount + totalPartAmount - chequeDetail.amount;

  const updateBillItem = (id: string, field: string, value: any) => {
    setBillItems(prev => prev.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        // Simple netAmt calculation helper
        if (field !== 'netAmt') {
          // You could add logic here to auto-calculate netAmt based on other fields
          // For now, let's just make it editable or semi-auto
        }
        return newItem;
      }
      return item;
    }));
  };

  const addBillItem = () => {
    setBillItems(prev => [...prev, { id: Date.now().toString(), rd: '0.00', rdQty: 0, rdAmt: 0, deduction: 0, schemePerc: 0, schemeAmt: 0, bcPerc: 0, bcAmt: 0, intPerc: 0, intAmt: 0, netAmt: 0 }]);
  };

  const removeBillItem = (id: string) => {
    if (billItems.length > 1) {
      setBillItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updatePartPayment = (id: string, field: string, value: any) => {
    setPartPayments(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addPartPayment = () => {
    setPartPayments(prev => [...prev, { id: Date.now().toString(), vType: 'BPMT', vNo: '', vDate: format(new Date(), 'yyyy-MM-dd'), amount: 0, chqNo: 'NEFT', remark: '' }]);
  };

  const removePartPayment = (id: string) => {
    if (partPayments.length > 1) {
      setPartPayments(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSave = () => {
    if (!selectedSupplier) {
      alert('Please select a supplier first');
      return;
    }
    
    const newAdjustment: BillAdjustment = {
      id: Math.random().toString(36).substr(2, 9),
      entryNo,
      date: entryDate,
      supplierId: selectedSupplier.id,
      creditAccountId: creditAc,
      brokerId: selectedBroker?.id,
      billDetails: billItems.map(item => ({
        billId: item.id,
        rd: item.rd,
        rdQty: Number(item.rdQty),
        rdAmt: Number(item.rdAmt),
        deduction: Number(item.deduction),
        schemePerc: Number(item.schemePerc),
        schemeAmt: Number(item.schemeAmt),
        bcPerc: Number(item.bcPerc),
        bcAmt: Number(item.bcAmt),
        intPerc: Number(item.intPerc),
        intAmt: Number(item.intAmt),
        netAmt: Number(item.netAmt)
      })),
      partPayments: partPayments.map(p => ({
        vType: p.vType,
        vNo: p.vNo,
        vDate: p.vDate,
        amount: Number(p.amount),
        chqNo: p.chqNo,
        remark: p.remark
      })),
      chequeDetail: {
        ...chequeDetail,
        amount: Number(chequeDetail.amount),
        bankCharges: Number(chequeDetail.bankCharges),
        agentComm: Number(chequeDetail.agentComm)
      },
      totalBillAmount,
      totalPartAmount,
      balance
    };

    setState(prev => ({
      ...prev,
      billAdjustments: [...prev.billAdjustments, newAdjustment]
    }));
    setIsModalOpen(false);
    // Reset form
    setBillItems([{ id: Date.now().toString(), rd: '0.00', rdQty: 0, rdAmt: 0, deduction: 0, schemePerc: 0, schemeAmt: 0, bcPerc: 0, bcAmt: 0, intPerc: 0, intAmt: 0, netAmt: 0 }]);
    setPartPayments([{ id: (Date.now() + 1).toString(), vType: 'BPMT', vNo: '', vDate: format(new Date(), 'yyyy-MM-dd'), amount: 0, chqNo: 'NEFT', remark: '' }]);
    setEntryNo(String(state.billAdjustments.length + 2));
    setSelectedSupplier(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 text-primary rounded-3xl shadow-sm"><ArrowLeftRight size={32} /></div>
          <div>
            <h2 className="text-3xl font-serif font-black text-slate-900 tracking-tight">Bill Adjustment</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Supplier Ledger Synchronization Engine</p>
          </div>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20 flex items-center gap-3"
        >
          <Plus size={18} /> New Adjustment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.billAdjustments.map(adj => {
          const supplier = state.suppliers.find(s => s.id === adj.supplierId);
          return (
            <motion.div 
              layout
              key={adj.id}
              className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg">
                      {adj.entryNo}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight line-clamp-1">{adj.date}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{adj.creditAccountId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Balance</p>
                    <p className="text-xl font-black text-primary">₹{adj.balance.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Building size={16} className="text-slate-300" />
                    <span className="text-xs font-black uppercase tracking-wider">{supplier?.name || 'Unknown Vendor'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-100/50 hover:bg-slate-800 hover:text-white transition-all active:scale-95">
                    View Registry
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-primary/5 text-primary rounded-2xl text-[9px] font-black uppercase tracking-widest border border-primary/10 hover:bg-primary hover:text-white transition-all active:scale-95">
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto pt-24 pb-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#f2f2e6] w-full max-w-7xl rounded-lg shadow-2xl border-4 border-slate-700 overflow-hidden"
            >
              {/* Header Bar */}
              <div className="bg-slate-700 p-2 flex items-center justify-between text-white font-black text-[11px] uppercase tracking-widest">
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded">
                     <span className="text-blue-300">K</span> Supplier Bill To Bill Adjustment Entry
                   </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-red-500 px-2 py-1 rounded transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-4 space-y-4">
                {/* Master Info Grid */}
                <div className="grid grid-cols-12 gap-1 bg-white/50 p-2 rounded border border-slate-300">
                  <div className="col-span-12 md:col-span-4 space-y-1">
                    <div className="flex items-center">
                      <span className="w-24 text-[11px] font-black uppercase text-slate-600">Entry Type</span>
                      <select 
                        value={entryType}
                        onChange={(e) => setEntryType(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 px-2 py-1 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none h-7"
                      >
                        <option>Bank Payment</option>
                        <option>Cash Payment</option>
                        <option>Journal Entry</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-[11px] font-black uppercase text-slate-600">Entry No</span>
                      <div className="flex-1 flex gap-1">
                        <input value={entryNo} readOnly className="w-20 bg-slate-100 border border-slate-300 px-2 py-1 text-xs font-bold h-7" />
                        <input value="2026" readOnly className="w-16 bg-slate-100 border border-slate-300 px-2 py-1 text-xs font-bold h-7 text-primary" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-[11px] font-black uppercase text-slate-600">Entry Date</span>
                      <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="flex-1 bg-white border border-slate-300 px-2 py-1 text-xs font-bold h-7" />
                    </div>
                    <div className="flex items-center">
                      <span className="w-24 text-[11px] font-black uppercase text-slate-600">Credit A/c</span>
                      <input value={creditAc} onChange={(e) => setCreditAc(e.target.value)} className="flex-1 bg-white border border-slate-300 px-2 py-1 text-xs font-bold h-7 uppercase" />
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-8 flex flex-col gap-1 pl-4 border-l border-slate-200">
                    <div className="flex items-start gap-4">
                      <span className="w-32 bg-blue-900 text-white px-3 py-1 text-[11px] font-black uppercase tracking-widest text-center">Supplier Name</span>
                      <div className="flex-1">
                        <select 
                          className="w-full bg-white border border-slate-300 px-3 py-1 text-base font-black uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                          onChange={(e) => {
                            const s = state.suppliers.find(sup => sup.id === e.target.value);
                            setSelectedSupplier(s || null);
                          }}
                        >
                          <option value="">Select Supplier...</option>
                          {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        
                        <div className="grid grid-cols-2 mt-2 gap-x-8 gap-y-1">
                           <div className="flex gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase w-16">Address</span>
                             <span className="text-[10px] font-black text-blue-900 uppercase">LUDHIANA</span>
                           </div>
                           <div className="flex gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase w-16">State</span>
                             <span className="text-[10px] font-black text-blue-600 uppercase">03-PUNJAB</span>
                           </div>
                           <div className="flex gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase w-16">City</span>
                             <span className="text-[10px] font-black text-blue-900 uppercase">LUDHIANA</span>
                           </div>
                           <div className="flex gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase w-16">GST.NO</span>
                             <span className="text-[10px] font-black text-primary uppercase">{selectedSupplier?.gstin || '03ABNPJ4135F1ZZ'}</span>
                           </div>
                           <div className="flex gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase w-16">Mobile</span>
                             <span className="text-[10px] font-black text-blue-900 uppercase">{selectedSupplier?.phone || '9417267311'}</span>
                           </div>
                           <div className="flex gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase w-16">Email</span>
                             <span className="text-[10px] font-black text-blue-900 uppercase italic">info@supplier.com</span>
                           </div>
                           <div className="flex gap-2">
                             <span className="text-[10px] font-bold text-slate-400 uppercase w-16">Broker</span>
                             <select 
                               className="text-[10px] font-black text-blue-900 uppercase bg-transparent border-b border-dotted border-blue-900 outline-none"
                               onChange={(e) => {
                                 const b = state.brokers.find(br => br.id === e.target.value);
                                 setSelectedBroker(b || null);
                               }}
                             >
                                <option value="">Select Broker</option>
                                {state.brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                             </select>
                           </div>
                        </div>
                      </div>
                      <div className="w-32 flex flex-col items-end">
                        <span className="text-primary font-black text-xl leading-none">96915</span>
                        <span className="text-blue-900 font-bold text-[10px] tracking-widest uppercase">CR</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bill Detail Table Section */}
                <div className="border border-slate-300 rounded overflow-hidden">
                  <div className="bg-rose-900 text-white px-4 py-1 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-black uppercase tracking-widest">Bill Detail :--&gt;</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <input type="checkbox" id="atv" className="accent-rose-600" />
                       <label htmlFor="atv" className="text-[10px] font-bold uppercase">Calculate on ATV</label>
                    </div>
                  </div>
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">RD</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">RDQty</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">RD Amt</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">Deduction</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">Sch%</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">Scheme Amt</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">BC %</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">BC Amt</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">Days</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">Int %</th>
                          <th className="border-r border-slate-200 px-1 py-1 font-black uppercase">Int Amt</th>
                          <th className="px-2 py-1 font-black uppercase text-right">Net Amt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billItems.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="border-r border-slate-200"><input className="w-full text-center py-1 outline-none font-bold" value={item.rd} onChange={(e) => updateBillItem(item.id, 'rd', e.target.value)} /></td>
                            <td className="border-r border-slate-200"><input type="number" className="w-full text-center py-1 outline-none font-bold" value={item.rdQty} onChange={(e) => updateBillItem(item.id, 'rdQty', e.target.value)} /></td>
                            <td className="border-r border-slate-200"><input type="number" className="w-full text-center py-1 outline-none font-bold" value={item.rdAmt} onChange={(e) => updateBillItem(item.id, 'rdAmt', e.target.value)} /></td>
                            <td className="border-r border-slate-200"><input type="number" className="w-full text-center py-1 outline-none font-bold" value={item.deduction} onChange={(e) => updateBillItem(item.id, 'deduction', e.target.value)} /></td>
                            <td className="border-r border-slate-200"><input type="number" className="w-full text-center py-1 outline-none font-bold" value={item.schemePerc} onChange={(e) => updateBillItem(item.id, 'schemePerc', e.target.value)} /></td>
                            <td className="border-r border-slate-200"><input type="number" className="w-full text-center py-1 outline-none font-bold" value={item.schemeAmt} onChange={(e) => updateBillItem(item.id, 'schemeAmt', e.target.value)} /></td>
                            <td className="border-r border-slate-200"><input type="number" className="w-full text-center py-1 outline-none font-bold" value={item.bcPerc} onChange={(e) => updateBillItem(item.id, 'bcPerc', e.target.value)} /></td>
                            <td className="border-r border-slate-200"><input type="number" className="w-full text-center py-1 outline-none font-bold" value={item.bcAmt} onChange={(e) => updateBillItem(item.id, 'bcAmt', e.target.value)} /></td>
                            <td className="border-r border-slate-200"><input className="w-full text-center py-1 outline-none font-bold" value="0" readOnly /></td>
                            <td className="border-r border-slate-200"><input type="number" className="w-full text-center py-1 outline-none font-bold" value={item.intPerc} onChange={(e) => updateBillItem(item.id, 'intPerc', e.target.value)} /></td>
                            <td className="border-r border-slate-200"><input type="number" className="w-full text-center py-1 outline-none font-bold text-primary" value={item.intAmt} onChange={(e) => updateBillItem(item.id, 'intAmt', e.target.value)} /></td>
                            <td className="px-2 py-1 flex items-center gap-2">
                               <input type="number" className="flex-1 text-right outline-none font-black text-slate-800" value={item.netAmt} onChange={(e) => updateBillItem(item.id, 'netAmt', e.target.value)} />
                               <button onClick={() => removeBillItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50">
                           <td colSpan={12} className="p-1">
                              <button onClick={addBillItem} className="w-full py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-1 border border-dashed border-slate-300 rounded">
                                 <Plus size={10} /> Add Bill Line
                              </button>
                           </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Central Body Content split - Part Payment & Summary */}
                <div className="grid grid-cols-12 gap-4 items-start">
                   {/* Left side tables */}
                   <div className="col-span-12 lg:col-span-8 space-y-4">
                      {/* Part Payment Table */}
                      <div className="border border-slate-300 rounded overflow-hidden">
                        <div className="bg-[#a82516] text-white px-4 py-1 flex items-center justify-between text-[11px] font-black uppercase">
                          <span>Part Payment :------&gt;</span>
                          <span className="bg-white/10 px-2 py-0.5 rounded">Supplier | IN -None</span>
                        </div>
                        <div className="bg-white overflow-x-auto min-h-[140px]">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="bg-slate-700 text-white">
                                <th className="px-2 py-1 w-8">#</th>
                                <th className="px-2 py-1">V Type</th>
                                <th className="px-2 py-1">V No.</th>
                                <th className="px-2 py-1">V Date</th>
                                <th className="px-2 py-1 text-right">Amount</th>
                                <th className="px-2 py-1">DD/Chq No.</th>
                                <th className="px-2 py-1">Remark</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                               {partPayments.map((p, i) => (
                                 <tr key={p.id}>
                                   <td className="px-2 py-1.5 text-center font-bold text-slate-400 italic">
                                      <button onClick={() => removePartPayment(p.id)} className="hover:text-red-500 transition-colors">{i+1}</button>
                                   </td>
                                   <td className="px-2 py-1.5 font-bold">
                                      <select value={p.vType} onChange={(e) => updatePartPayment(p.id, 'vType', e.target.value)} className="bg-transparent outline-none text-blue-600">
                                         <option>BPMT</option>
                                         <option>CPMT</option>
                                         <option>JRNL</option>
                                      </select>
                                   </td>
                                   <td className="px-2 py-1.5"><input className="w-full font-bold bg-transparent outline-none" value={p.vNo} onChange={(e) => updatePartPayment(p.id, 'vNo', e.target.value)} placeholder="No." /></td>
                                   <td className="px-2 py-1.5"><input type="date" className="w-full font-black text-slate-500 bg-transparent outline-none text-[10px]" value={p.vDate} onChange={(e) => updatePartPayment(p.id, 'vDate', e.target.value)} /></td>
                                   <td className="px-2 py-1.5 text-right"><input type="number" className="w-full text-right font-black text-blue-900 tracking-tight bg-transparent outline-none" value={p.amount} onChange={(e) => updatePartPayment(p.id, 'amount', e.target.value)} /></td>
                                   <td className="px-2 py-1.5"><input className="w-full font-bold uppercase bg-transparent outline-none" value={p.chqNo} onChange={(e) => updatePartPayment(p.id, 'chqNo', e.target.value)} placeholder="Ref" /></td>
                                   <td className="px-2 py-1.5"><input className="w-full text-blue-900 font-black bg-transparent outline-none" value={p.remark} onChange={(e) => updatePartPayment(p.id, 'remark', e.target.value)} placeholder="Remark" /></td>
                                 </tr>
                               ))}
                               <tr className="bg-slate-50/50">
                                  <td colSpan={7} className="p-1">
                                     <button onClick={addPartPayment} className="w-full py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-1 border border-dashed border-slate-300 rounded">
                                        <Plus size={10} /> Add Part Payment
                                     </button>
                                  </td>
                               </tr>
                             </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Cheque Detail */}
                      <div className="border border-slate-300 rounded overflow-hidden">
                        <div className="bg-[#5c2a13] text-white px-4 py-1 text-[11px] font-black uppercase">
                          Cheque Detail :------&gt;
                        </div>
                        <div className="bg-white">
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="bg-slate-700 text-white">
                                <th className="px-2 py-1 w-8">#</th>
                                <th className="px-2 py-1 text-right">Amount</th>
                                <th className="px-2 py-1 text-right">Bank Charges</th>
                                <th className="px-2 py-1 text-right">Agent COMM.</th>
                                <th className="px-2 py-1">Chq. No.</th>
                                <th className="px-2 py-1">Date</th>
                                <th className="px-2 py-1">Remark</th>
                              </tr>
                            </thead>
                             <tbody>
                                <tr>
                                   <td className="px-2 py-3 text-center font-bold">0</td>
                                   <td className="px-2 py-3"><input type="number" value={chequeDetail.amount} onChange={(e) => setChequeDetail(prev => ({...prev, amount: Number(e.target.value)}))} className="w-full text-right outline-none font-black text-rose-600 text-lg py-1 border-2 border-slate-700 bg-[#fefbe9]" /></td>
                                   <td className="px-2 py-3"><input type="number" value={chequeDetail.bankCharges} onChange={(e) => setChequeDetail(prev => ({...prev, bankCharges: Number(e.target.value)}))} className="w-full text-right outline-none font-black text-rose-600 py-1 border-2 border-slate-700 bg-[#fefbe9]" /></td>
                                   <td className="px-2 py-3"><input type="number" value={chequeDetail.agentComm} onChange={(e) => setChequeDetail(prev => ({...prev, agentComm: Number(e.target.value)}))} className="w-full text-right outline-none font-black text-rose-600 py-1 border-2 border-slate-700 bg-[#fefbe9]" /></td>
                                   <td className="px-2 py-3"><input value={chequeDetail.chqNo} onChange={(e) => setChequeDetail(prev => ({...prev, chqNo: e.target.value}))} className="w-full outline-none font-black text-blue-900 py-1 border-2 border-slate-700 bg-[#fefbe9] uppercase h-9 px-2" /></td>
                                   <td className="px-2 py-3"><input type="date" value={chequeDetail.date} onChange={(e) => setChequeDetail(prev => ({...prev, date: e.target.value}))} className="w-full outline-none font-black text-rose-600 py-1 border-2 border-slate-700 bg-[#fefbe9] h-9 px-2" /></td>
                                   <td className="px-2 py-3"><input value={chequeDetail.remark} onChange={(e) => setChequeDetail(prev => ({...prev, remark: e.target.value}))} className="w-full outline-none font-black text-slate-800 py-1 border-2 border-slate-700 bg-[#fefbe9] h-9 px-2" /></td>
                                </tr>
                             </tbody>
                          </table>
                        </div>
                      </div>
                   </div>

                   {/* Right side Summary & Actions */}
                   <div className="col-span-12 lg:col-span-4 space-y-4">
                      {/* Logo and Tagline Area */}
                      <div className="flex justify-between items-start">
                         <div className="bg-[#fefbe9] p-4 border border-slate-300 w-full flex flex-col items-center justify-center relative min-h-[120px]">
                            <div className="bg-[#4d4d4d] text-white p-3 text-center uppercase font-black text-sm tracking-[0.2em] w-3/4">
                               BILL TO <br/> BILL <br/> ADJUSMENT
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 absolute bottom-2 right-4">Ankit ENTERPRISES [2026-2027]</span>
                         </div>
                         <div className="bg-blue-900 w-24 h-24 ml-2 flex flex-col items-center justify-center p-2 relative overflow-hidden">
                            <div className="font-serif text-white italic text-xl font-black relative z-10">Krish</div>
                            <div className="text-[10px] text-white/50 absolute top-2 right-2">15/43</div>
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                         </div>
                      </div>

                      {/* Summary Display */}
                      <div className="bg-[#fefbe9] border-2 border-slate-700 overflow-hidden">
                         <div className="bg-[#333] text-white flex justify-between px-4 py-1 text-[11px] font-black uppercase tracking-widest">
                           <span>Purchase Payment Discount</span>
                           <span>Disc = 4569</span>
                         </div>
                         <div className="p-4 space-y-4">
                            <div className="flex justify-between border-b border-slate-300 pb-2">
                               <div className="text-blue-900 text-[10px] font-black uppercase">Discount</div>
                               <div className="flex gap-4">
                                  <div className="bg-white border border-slate-300 px-4 py-0.5 text-xs font-black">0</div>
                                  <div className="text-[10px] font-bold text-slate-400">A/C</div>
                               </div>
                            </div>
                            <div className="flex justify-between">
                               <div className="text-blue-900 text-[10px] font-black uppercase italic">Final Remark</div>
                               <div className="bg-white border border-slate-300 px-4 py-0.5 text-xs font-black w-2/3"></div>
                            </div>
                            <div className="flex justify-between items-center bg-[#f7f7da] p-1 border border-[#e2e2b8]">
                               <div className="text-blue-900 text-[11px] font-black uppercase">Stop Payment</div>
                               <div className="text-primary text-xl font-black">No</div>
                            </div>

                            <div className="space-y-1">
                               <div className="flex justify-between items-end">
                                  <span className="text-slate-800 text-lg font-black uppercase italic">Bill Amount</span>
                                  <span className="text-3xl font-black text-slate-800 tracking-tight">{totalBillAmount.toFixed(2)}</span>
                               </div>
                               <div className="flex justify-between items-end">
                                  <span className="text-slate-800 text-lg font-black uppercase italic">PART Amount</span>
                                  <span className="text-3xl font-black text-slate-800 tracking-tight">{totalPartAmount.toFixed(2)}</span>
                               </div>
                               <div className="flex justify-between items-end bg-[#eee] border-t-4 border-slate-700 mt-2 p-2">
                                  <span className="text-rose-700 text-xl font-black uppercase italic">Balance</span>
                                  <span className="text-4xl font-black text-rose-700 tracking-tighter">{balance.toFixed(2)}</span>
                               </div>
                            </div>
                         </div>
                         <div className="bg-[#a82516] text-white text-center py-1 text-[10px] font-black uppercase tracking-widest">
                           Inserted By User : SA On {format(new Date(), 'dd/Apr/yyyy')}
                         </div>
                      </div>

                      {/* Action Menu (Vertical List matching Right Side) */}
                      <div className="grid grid-cols-1 gap-1">
                        {[
                          { icon: <Plus size={14}/>, label: 'New', action: () => {
                            setBillItems([{ id: Date.now().toString(), rd: '0.00', rdQty: 0, rdAmt: 0, deduction: 0, schemePerc: 0, schemeAmt: 0, bcPerc: 0, bcAmt: 0, intPerc: 0, intAmt: 0, netAmt: 0 }]);
                            setPartPayments([{ id: (Date.now() + 1).toString(), vType: 'BPMT', vNo: '', vDate: format(new Date(), 'yyyy-MM-dd'), amount: 0, chqNo: 'NEFT', remark: '' }]);
                            setSelectedSupplier(null);
                            alert('Form reset for new entry.');
                          } },
                          { icon: <Printer size={14}/>, label: 'Print', action: () => window.print() },
                          { icon: <Save size={14}/>, label: 'Save', action: handleSave },
                          { icon: <X size={14}/>, label: 'Cancel', action: () => setIsModalOpen(false) },
                          { icon: <Search size={14}/>, label: 'Browse', action: () => alert('Browsing previous entries...') },
                          { icon: <ShieldCheck size={14}/>, label: 'Modify', action: () => alert('Select an existing entry to modify.') },
                          { icon: <Trash2 size={14}/>, label: 'Delete', action: () => alert('Select an entry to delete.') },
                        ].map((btn, i) => (
                           <button 
                             key={i}
                             onClick={btn.action}
                             className="flex flex-col items-center justify-center p-2 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm group"
                           >
                              <div className="text-primary group-hover:scale-110 transition-transform">{btn.icon}</div>
                              <span className="text-[8px] font-black uppercase text-slate-400 mt-1">{btn.label}</span>
                           </button>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
