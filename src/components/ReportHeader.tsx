import React from 'react';
import { Box } from 'lucide-react';

export default function ReportHeader() {
  return (
    <div className="report-header mb-8 pb-6 border-b-4 border-slate-900 flex justify-between items-end">
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl rotate-3">
          <Box size={32} strokeWidth={2.5} />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">Ankit Enterprises</h1>
          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Premier Textile & Logistics Solutions</p>
          <div className="mt-4 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-600 uppercase">123, Textile Market, Ring Road, Surat - 395002 (Gujarat)</p>
            <p className="text-[10px] font-bold text-slate-600 uppercase">Mobile: +91 99887 76655 | Email: contact@ankitents.com</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="inline-block bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-xs tracking-widest mb-2 shadow-lg">
          OFFICIAL BUSINESS REPORT
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GSTIN: <span className="text-slate-900">24ANKIT1234E1Z5</span></p>
      </div>
    </div>
  );
}
