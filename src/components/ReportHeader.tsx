import React from 'react';
import { Box } from 'lucide-react';

export default function ReportHeader() {
  return (
    <div className="report-header mb-8 pb-10 border-b-8 border-slate-900 flex justify-between items-start">
      <div className="flex gap-6 items-start">
        <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl rotate-3 shrink-0 ring-8 ring-slate-100">
          <Box size={40} strokeWidth={2.5} />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">Ankit Enterprises</h1>
          <p className="text-xs font-black text-primary uppercase tracking-[0.3em] italic">Premier Textile & Logistics Solutions</p>
          <div className="mt-6 space-y-1">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">123, Textile Market, Ring Road, Surat - 395002 (Gujarat)</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile: +91 99887 76655 | Email: contact@ankitents.com</p>
            </div>
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-3 pt-2">
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] shadow-xl uppercase">
          Official Documents
        </div>
        <div className="px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              GSTIN: <span className="text-slate-900 text-xs tracking-normal">24ANKIT1234E1Z5</span>
           </p>
        </div>
      </div>
    </div>
  );
}
