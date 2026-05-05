import React, { useState, Dispatch, SetStateAction } from 'react';
import { Truck, CheckCircle2, Clock, MapPin, Truck as TruckIcon, FileText, Plus, X, Search, Printer } from 'lucide-react';
import { AppState, TransportLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import ReportHeader from '../components/ReportHeader';

interface TransportProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
}

export default function Transport({ state, setState }: TransportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'manifest' | 'register' | 'voucher'>('manifest');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const selectedLog = state.transportLogs.find(l => l.id === selectedLogId) || state.transportLogs[0];

  const handleAddDispatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLog: TransportLog = {
      id: Math.random().toString(36).substr(2, 9),
      invoiceNo: formData.get('invoiceNo') as string,
      lrNo: formData.get('lrNo') as string,
      transporterName: formData.get('transporterName') as string,
      vehicleNo: formData.get('vehicleNo') as string,
      status: formData.get('status') as any,
      date: new Date().toISOString(),
      freightAmount: Number(formData.get('freight')),
      baleQty: Number(formData.get('baleQty')),
      privateMark: formData.get('privateMark') as string,
      supplierName: formData.get('supplierName') as string,
      paymentNo: formData.get('paymentNo') as string,
      paymentDate: formData.get('paymentDate') as string,
      paidAmount: Number(formData.get('paidAmount')),
      receivedDate: formData.get('receivedDate') as string,
      // Voucher fields
      entryType: formData.get('entryType') as string || 'TRANSPORT SLIP ENTRY',
      billNo: formData.get('billNo') as string,
      receiveNo: formData.get('receiveNo') as string,
      biltyDate: formData.get('biltyDate') as string,
      hamaliExpense: Number(formData.get('hamaliExpense')),
      baleType: formData.get('baleType') as any,
      noOfBales: Number(formData.get('noOfBales')),
      pendingBales: Number(formData.get('pendingBales')),
      netFreight: Number(formData.get('netFreight')),
      remark: formData.get('remark') as string,
      supplierAddress: formData.get('supplierAddress') as string,
      supplierCity: formData.get('supplierCity') as string,
      supplierMobile: formData.get('supplierMobile') as string,
      supplierGstNo: formData.get('supplierGstNo') as string,
      payMode: formData.get('payMode') as string,
      freightAcDr: formData.get('freightAcDr') as string,
      cashAmount: Number(formData.get('cashAmount')),
      cgst: Number(formData.get('cgst')),
      igst: Number(formData.get('igst')),
      sgst: Number(formData.get('sgst')),
    };

    setState(prev => ({
      ...prev,
      transportLogs: [newLog, ...prev.transportLogs]
    }));
    setIsModalOpen(false);
    setSelectedLogId(newLog.id);
    setActiveTab('voucher');
  };

  const handleDeleteDispatch = (id: string) => {
    if (confirm('Delete this dispatch log?')) {
      setState(prev => ({
        ...prev,
        transportLogs: prev.transportLogs.filter(log => log.id !== id)
      }));
    }
  };

  const filteredLogs = state.transportLogs.filter(log => 
    log.lrNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.transporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Grouping logic for Register
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    const transporter = log.transporterName || 'Unknown Transporter';
    if (!acc[transporter]) acc[transporter] = [];
    acc[transporter].push(log);
    return acc;
  }, {} as Record<string, TransportLog[]>);

  // Suggestions for search
  const suggestions = Array.from(new Set([
    ...state.transportLogs.map(l => l.transporterName),
    ...state.transportLogs.map(l => l.supplierName).filter(Boolean),
    ...state.transportLogs.map(l => l.lrNo),
    ...state.transportLogs.map(l => l.invoiceNo),
    ...state.transportLogs.map(l => l.billNo).filter(Boolean),
    ...state.transportLogs.map(l => l.vehicleNo),
  ]));

  return (
    <div className="space-y-10">
      <datalist id="transport-suggestions">
        {suggestions.map((s, i) => <option key={i} value={s} />)}
      </datalist>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="p-5 bg-primary/10 text-primary rounded-[1.5rem] shadow-sm"><Truck size={32} /></div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Logistic Terminal</h3>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveTab('manifest')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all",
                  activeTab === 'manifest' ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-100"
                )}
              >
                Tracking Manifest
              </button>
              <button 
                onClick={() => setActiveTab('register')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all",
                  activeTab === 'register' ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-100"
                )}
              >
                Transport Register
              </button>
              <button 
                onClick={() => setActiveTab('voucher')}
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all",
                  activeTab === 'voucher' ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-100"
                )}
              >
                Slip Voucher
              </button>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center gap-2"
        >
          <Plus size={18} /> Initiate Dispatch
        </button>
      </div>

      <div className={cn("space-y-10", activeTab === 'register' && "no-print")}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform">
              {state.transportLogs.filter(l => l.status === 'in-transit').length}
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Active Consignment</p>
              <h4 className="text-lg font-black text-slate-800 uppercase">In Transit</h4>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform">
               {state.transportLogs.filter(l => l.status === 'delivered').length}
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Successfully Handover</p>
              <h4 className="text-lg font-black text-slate-800 uppercase">Completed</h4>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex items-center gap-6 group hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-[1.5rem] flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-transform">
               ₹{state.transportLogs.reduce((acc, l) => acc + l.freightAmount, 0).toLocaleString()}
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cumulative Cost</p>
              <h4 className="text-lg font-black text-slate-800 uppercase">Freight Budget</h4>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'manifest' ? (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
            <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-xs flex items-center gap-3">
              <TruckIcon size={20} className="text-primary" /> Tracking Manifest
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  list="transport-suggestions"
                  placeholder="Search LR, Transporter, Supplier..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-6 py-2.5 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-primary/20 transition-all w-64 shadow-sm"
                />
              </div>
              <button 
                onClick={() => {}}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Search
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consignment ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transporter & Fleet</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Doc</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Value</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Node</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredLogs.map(log => (
                   <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                     <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-800">#{log.lrNo}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{format(new Date(log.date), 'dd MMM yyyy')}</p>
                     </td>
                     <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-700">{log.transporterName}</p>
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase mt-0.5">
                          <MapPin size={10} /> {log.vehicleNo}
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                          <FileText size={14} /> {log.invoiceNo}
                        </div>
                        {log.supplierName && (
                          <p className="text-[10px] font-black text-slate-400 uppercase mt-1">From: {log.supplierName}</p>
                        )}
                     </td>
                     <td className="px-8 py-6 text-sm font-black text-slate-800">₹{log.freightAmount.toLocaleString()}</td>
                     <td className="px-8 py-6">
                        <span className={cn(
                          "flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest",
                          log.status === 'delivered' ? "text-emerald-500" : "text-blue-500"
                        )}>
                          {log.status === 'delivered' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                          {log.status}
                        </span>
                     </td>
                     <td className="px-8 py-6 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedLogId(log.id);
                            setActiveTab('voucher');
                            setTimeout(() => window.print(), 100);
                          }}
                          className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition-colors"
                          title="Print Voucher"
                        >
                           <Printer size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedLogId(log.id);
                            setActiveTab('voucher');
                          }}
                          className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 hover:bg-blue-100 transition-colors"
                          title="View Voucher"
                        >
                           <FileText size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteDispatch(log.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                           <TruckIcon size={14} />
                        </button>
                    </td>
                   </tr>
                 ))}
                 {filteredLogs.length === 0 && (
                   <tr>
                      <td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">
                        No logistics movement recorded in terminal.
                      </td>
                   </tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'register' ? (
        <div className="space-y-6">
          <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="hidden print:block mb-8">
              <ReportHeader />
            </div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">Transport Register</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Consolidated Freight & Payment Audit</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    list="transport-suggestions"
                    placeholder="Quick Filter..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-6 py-2.5 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none border border-transparent focus:border-primary/20 transition-all w-64"
                  />
                </div>
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Export PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-widest">
                    <th className="px-4 py-4 border border-slate-800 text-center">SR</th>
                    <th className="px-4 py-4 border border-slate-800">Date/Rec.Date</th>
                    <th className="px-4 py-4 border border-slate-800">Bilty No.</th>
                    <th className="px-4 py-4 border border-slate-800">Bale</th>
                    <th className="px-4 py-4 border border-slate-800">P.M.</th>
                    <th className="px-4 py-4 border border-slate-800">Supplier</th>
                    <th className="px-4 py-4 border border-slate-800 text-right">S.Freight</th>
                    <th className="px-4 py-4 border border-slate-800">PMT No.</th>
                    <th className="px-4 py-4 border border-slate-800">PMT Date</th>
                    <th className="px-4 py-4 border border-slate-800 text-right">Paid</th>
                    <th className="px-4 py-4 border border-slate-800">Open Date</th>
                    <th className="px-4 py-4 border border-slate-800 no-print">P</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedLogs).map(([transporter, logs]) => (
                    <React.Fragment key={transporter}>
                      <tr className="bg-slate-50">
                        <td colSpan={11} className="px-4 py-3 font-black uppercase tracking-widest text-[#b4914a] border border-slate-200">
                          {transporter}
                        </td>
                      </tr>
                      {logs.map((log, idx) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 border border-slate-100 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="px-4 py-3 border border-slate-100 font-black">
                            {format(new Date(log.date), 'dd/MMM/yy')}
                            {log.receivedDate && <div className="text-slate-400 italic">R: {format(new Date(log.receivedDate), 'dd/MMM/yy')}</div>}
                          </td>
                          <td className="px-4 py-3 border border-slate-100 font-black text-blue-600">{log.lrNo}</td>
                          <td className="px-4 py-3 border border-slate-100 font-black text-center">{log.baleQty || '-'}</td>
                          <td className="px-4 py-3 border border-slate-100 font-black uppercase text-slate-500">{log.privateMark || '-'}</td>
                          <td className="px-4 py-3 border border-slate-100 font-black uppercase">{log.supplierName || '-'}</td>
                          <td className="px-4 py-3 border border-slate-100 font-black text-right">{log.freightAmount.toFixed(2)}</td>
                          <td className="px-4 py-3 border border-slate-100 font-black text-center">{log.paymentNo || '-'}</td>
                          <td className="px-4 py-3 border border-slate-100 font-black">
                            {log.paymentDate ? format(new Date(log.paymentDate), 'dd/MMM/yy') : '-'}
                          </td>
                          <td className="px-4 py-3 border border-slate-100 font-black text-right">{log.paidAmount?.toFixed(2) || '0.00'}</td>
                          <td className="px-4 py-3 border border-slate-100 font-black">{log.openDate ? format(new Date(log.openDate), 'dd/MMM/yy') : '-'}</td>
                          <td className="px-4 py-3 border border-slate-100 text-center no-print">
                            <button 
                              onClick={() => {
                                setSelectedLogId(log.id);
                                setActiveTab('voucher');
                                setTimeout(() => window.print(), 100);
                              }}
                              className="text-emerald-500 hover:text-emerald-700 p-1"
                              title="Print Voucher"
                            >
                              <Printer size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/30 font-black italic">
                        <td colSpan={6} className="px-4 py-3 border border-slate-200 text-right uppercase tracking-widest text-[9px]">Sub Total:-</td>
                        <td className="px-4 py-3 border border-slate-200 text-right">{logs.reduce((sum, l) => sum + l.freightAmount, 0).toFixed(2)}</td>
                        <td colSpan={2} className="px-4 py-3 border border-slate-200"></td>
                        <td className="px-4 py-3 border border-slate-200 text-right">{logs.reduce((sum, l) => sum + (l.paidAmount || 0), 0).toFixed(2)}</td>
                        <td colSpan={2} className="px-4 py-3 border border-slate-200"></td>
                      </tr>
                    </React.Fragment>
                  ))}
                  {state.transportLogs.length > 0 && (
                     <tr className="bg-primary/5 font-black text-[11px]">
                        <td colSpan={6} className="px-4 py-6 border border-slate-200 text-right uppercase tracking-[0.2em]">Grand Total:-</td>
                        <td className="px-4 py-6 border border-slate-200 text-right">{filteredLogs.reduce((sum, l) => sum + l.freightAmount, 0).toFixed(2)}</td>
                        <td colSpan={2} className="px-4 py-6 border border-slate-200"></td>
                        <td className="px-4 py-6 border border-slate-200 text-right">{filteredLogs.reduce((sum, l) => sum + (l.paidAmount || 0), 0).toFixed(2)}</td>
                        <td colSpan={2} className="px-4 py-6 border border-slate-200"></td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100/50 p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-inner min-h-[800px]">
          <div className="max-w-6xl mx-auto space-y-6">
            {!selectedLog ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
                <FileText size={64} className="opacity-20" />
                <p className="font-black uppercase tracking-[0.2em] text-[10px]">No consignment selected for voucher view</p>
                <button 
                  onClick={() => setActiveTab('manifest')}
                  className="px-6 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                >
                  Go to Manifest
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-50 space-y-8 mb-6">
                  {/* Business Header */}
                  <ReportHeader />
                  
                  {/* Voucher Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-300 pb-6">
                  <div className="space-y-4">
                    <div className="bg-blue-900 text-white px-6 py-2 rounded-lg inline-block font-black text-sm tracking-widest uppercase shadow-lg">
                      Transport Slip Voucher
                    </div>
                    <div className="flex gap-10">
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Type</p>
                          <p className="text-sm font-black text-slate-800 uppercase">{selectedLog.entryType || 'TRANSPORT SLIP ENTRY'}</p>
                      </div>
                      <div className="space-y-1 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill No.</p>
                          <p className="text-lg font-black text-blue-600">{selectedLog.billNo || '-'}</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receive Date</p>
                          <p className="text-sm font-black text-slate-800">{selectedLog.receivedDate ? format(new Date(selectedLog.receivedDate), 'dd/MMM/yyyy') : format(new Date(selectedLog.date), 'dd/MMM/yyyy')}</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receive No.</p>
                          <p className="text-sm font-black text-slate-800 uppercase">{selectedLog.receiveNo || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <h2 className="text-3xl font-black text-blue-900 uppercase italic tracking-tighter">Transport Slip Voucher</h2>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase">DSSTSE</span>
                      <span className="text-xl font-black text-slate-800">2026</span>
                      <span className="bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded font-black text-sm">1</span>
                    </div>
                  </div>
                </div>

                {/* Voucher Body */}
                <div className="grid grid-cols-12 gap-6 items-start">
                  <div className="col-span-8 space-y-6">
                    {/* Transporter Section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                          <TruckIcon size={18} className="text-blue-600" />
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Transporter Details</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-black text-slate-800 uppercase">{selectedLog.transporterName}</h3>
                          <button 
                            onClick={() => alert('Searching for Bilty No: ' + selectedLog.lrNo)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors"
                          >
                            Search Bilty
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-50">
                          <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bilty/LR No.</p>
                              <p className="text-sm font-black text-blue-600">{selectedLog.lrNo}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bilty Date</p>
                              <p className="text-sm font-black text-slate-800">{selectedLog.biltyDate ? format(new Date(selectedLog.biltyDate), 'dd/MMM/yyyy') : '-'}</p>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Private Marka</p>
                              <p className="text-sm font-black text-slate-800 uppercase">{selectedLog.privateMark || '-'}</p>
                          </div>
                        </div>
                    </div>

                    {/* Consignment Specs */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bale Type</p>
                          <p className="text-sm font-black text-slate-800 uppercase">{selectedLog.baleType || 'LOOSE'}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No. of Bales</p>
                          <p className="text-xl font-black text-slate-800">{selectedLog.baleQty || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Bales</p>
                          <p className="text-xl font-black text-slate-800">{selectedLog.pendingBales || 0}</p>
                        </div>
                    </div>

                    {/* Supplier Section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                          <FileText size={18} className="text-green-600" />
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Supplier Information</p>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 uppercase">{selectedLog.supplierName || 'Self'}</h3>
                        <div className="grid grid-cols-2 gap-8 text-[11px]">
                          <div className="space-y-2 text-slate-600 font-bold uppercase">
                              <div className="flex justify-between"><span>Address:</span> <span className="text-slate-800">{selectedLog.supplierAddress || '-'}</span></div>
                              <div className="flex justify-between"><span>City:</span> <span className="text-slate-800">{selectedLog.supplierCity || '-'}</span></div>
                              <div className="flex justify-between"><span>GST No:</span> <span className="text-slate-800">{selectedLog.supplierGstNo || '-'}</span></div>
                          </div>
                          <div className="space-y-2 text-slate-600 font-bold uppercase">
                              <div className="flex justify-between"><span>Mobile:</span> <span className="text-slate-800">{selectedLog.supplierMobile || '-'}</span></div>
                              <div className="flex justify-between"><span>Bale Open:</span> <span className="text-slate-800">NO</span></div>
                              <div className="flex justify-between"><span>Pay Mode:</span> <span className="text-slate-800">{selectedLog.payMode || 'CASH'}</span></div>
                          </div>
                        </div>
                    </div>
                  </div>

                  {/* Accounting Side */}
                  <div className="col-span-4 space-y-6">
                    {/* Financials */}
                    <div className="bg-blue-900 p-8 rounded-[1.5rem] text-white shadow-xl space-y-6">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-60">
                          <span>GST Form</span>
                          <span>TAX 0% {'{IN-STATE}'}</span>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-white/10">
                          <div className="flex justify-between font-black">
                              <span className="text-white/60 uppercase text-[10px]">Freight</span>
                              <span className="text-xl">{selectedLog.freightAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-black">
                              <span className="text-white/60 uppercase text-[10px]">Net Freight</span>
                              <span className="text-2xl text-blue-300">{selectedLog.netFreight?.toFixed(2) || selectedLog.freightAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-6 text-[10px] uppercase font-black">
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                              <span className="block opacity-40 mb-1">CGST</span>
                              <span>{selectedLog.cgst?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                              <span className="block opacity-40 mb-1">IGST</span>
                              <span>{selectedLog.igst?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                              <span className="block opacity-40 mb-1">SGST</span>
                              <span>{selectedLog.sgst?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                    </div>

                    {/* Image Window Placeholder */}
                    <div className="bg-slate-200 aspect-square rounded-[1.5rem] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-3 group hover:bg-slate-300 transition-colors cursor-pointer">
                        <Plus size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Image Window</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={() => alert('Posting data to ledger...')}
                          className="w-full py-4 bg-white border border-slate-200 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-md transition-all"
                        >
                          Re-Post
                        </button>
                        <button onClick={() => window.print()} className="w-full py-4 bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-slate-900 transition-all">Save Voucher</button>
                    </div>
                  </div>
                </div>
              </div>

                {/* History Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest italic">Transport Slip History</h4>
                      <div className="flex gap-8 text-[10px] font-bold text-slate-400 uppercase">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Purchase Bill</span>
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Material Receipt</span>
                      </div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                            <tr className="bg-slate-100 text-slate-500 font-black uppercase">
                              <th className="px-6 py-4">Reference No.</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Supplier</th>
                              <th className="px-6 py-4">Amount</th>
                              <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-black">#385 (2025)</td>
                              <td className="px-6 py-4 font-bold text-slate-400">31/Mar/2026</td>
                              <td className="px-6 py-4 font-black uppercase">{selectedLog.supplierName || '-'}</td>
                              <td className="px-6 py-4 font-black">₹38,901.00</td>
                              <td className="px-6 py-4">
                                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full font-black uppercase text-[9px]">Processed</span>
                              </td>
                            </tr>
                        </tbody>
                      </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                   <h4 className="font-black tracking-[0.2em] uppercase text-xs">Dispatch Initiation</h4>
                   <p className="text-white/60 text-[9px] font-bold uppercase mt-1">Vehicle & LR Document Registry</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all font-bold"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddDispatch} className="p-10 space-y-8 h-[80vh] overflow-y-auto">
                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-primary/10 pb-2">Voucher Basic Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Entry Type</label>
                        <input name="entryType" list="entry-types" defaultValue="TRANSPORT SLIP ENTRY" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" />
                        <datalist id="entry-types">
                           <option value="TRANSPORT SLIP ENTRY" />
                           <option value="GOODS RECEIPT" />
                        </datalist>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bill No</label>
                        <input name="billNo" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Receive No</label>
                        <input name="receiveNo" list="receive-suggestions" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" />
                        <datalist id="receive-suggestions">
                           {Array.from(new Set(state.transportLogs.map(l => l.receiveNo).filter(Boolean))).map(s => <option key={s} value={s} />)}
                        </datalist>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Received Date</label>
                        <input name="receivedDate" type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" />
                      </div>
                    </div>
                  </div>

                  {/* Transporter Info */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-50 pb-2">Transporter & Logistics</p>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Transporter Name</label>
                      <input name="transporterName" list="transporter-list" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-bold" />
                      <datalist id="transporter-list">
                         {Array.from(new Set(state.transportLogs.map(l => l.transporterName))).map(t => <option key={t} value={t} />)}
                      </datalist>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">LR Number</label>
                        <input name="lrNo" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bilty Date</label>
                        <input name="biltyDate" type="date" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Vehicle No</label>
                        <input name="vehicleNo" list="vehicle-suggestions" required placeholder="GJ-01-XX-0000" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" />
                        <datalist id="vehicle-suggestions">
                           {Array.from(new Set(state.transportLogs.map(l => l.vehicleNo))).map(s => <option key={s} value={s} />)}
                        </datalist>
                      </div>
                    </div>
                  </div>

                  {/* Bale Specs */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] border-b border-teal-50 pb-2">Consignment Specifications</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Bale Type</label>
                        <input name="baleType" list="bale-types" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" />
                        <datalist id="bale-types">
                           <option value="LOOSE" />
                           <option value="PACKED" />
                           <option value="CARTOON" />
                        </datalist>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">No. of Bales</label>
                        <input name="baleQty" type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Pending</label>
                        <input name="pendingBales" type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Supplier Info */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-emerald-50 pb-2">Supplier Registry</p>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Supplier Name</label>
                      <input name="supplierName" list="supplier-list" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Supplier City</label>
                        <input name="supplierCity" list="city-list" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-bold text-xs uppercase" />
                        <datalist id="city-list">
                           {Array.from(new Set(state.suppliers.map(s => s.city))).map(c => <option key={c} value={c} />)}
                        </datalist>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Supplier GST</label>
                        <input name="supplierGstNo" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-black text-xs uppercase" />
                      </div>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="space-y-4 bg-slate-900 p-8 rounded-3xl text-white">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-b border-white/10 pb-2">Accounting & Tax</p>
                    <div className="grid grid-cols-2 gap-4 font-black">
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/40 uppercase tracking-widest pl-1">Freight Amount</label>
                        <input name="freight" type="number" required className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/40 uppercase tracking-widest pl-1">Hamali Expense</label>
                        <input name="hamaliExpense" type="number" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-primary/50 transition-all text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       <div className="space-y-1">
                          <label className="text-[8px] text-white/30 uppercase pl-1">CGST</label>
                          <input name="cgst" type="number" step="0.01" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none text-xs" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] text-white/30 uppercase pl-1">SGST</label>
                          <input name="sgst" type="number" step="0.01" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none text-xs" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] text-white/30 uppercase pl-1">IGST</label>
                          <input name="igst" type="number" step="0.01" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none text-xs" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] text-white/40 uppercase tracking-widest pl-1">Pay Mode</label>
                          <select name="payMode" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none font-black text-xs uppercase">
                             <option value="CASH">CASH</option>
                             <option value="CHEQUE">CHEQUE</option>
                             <option value="NEFT">NEFT</option>
                             <option value="ON-CREDIT">ON CREDIT</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] text-white/40 uppercase tracking-widest pl-1">Net Freight</label>
                          <input name="netFreight" type="number" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl outline-none text-sm text-blue-300" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Remark / Private Note</label>
                    <textarea name="remark" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-medium text-xs h-24" />
                  </div>
                </div>
                <button type="submit" className="w-full py-6 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs">Authorize & Registry Voucher</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
