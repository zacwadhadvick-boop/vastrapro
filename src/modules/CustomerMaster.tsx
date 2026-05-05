import React, { useState, Dispatch, SetStateAction } from 'react';
import { Users, Plus, MapPin, Search, X, Globe, Phone, CreditCard, ShieldCheck } from 'lucide-react';
import { AppState, Customer, Area } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface CustomerMasterProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
}

export default function CustomerMaster({ state, setState }: CustomerMasterProps) {
  const [isAreaModal, setIsAreaModal] = useState(false);
  const [isCustomerModal, setIsCustomerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = state.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const suggestions = Array.from(new Set([
    ...state.customers.map(c => c.name),
    ...state.customers.map(c => c.phone),
    ...state.customers.map(c => c.gstin).filter(Boolean),
    ...state.areas.map(a => a.areaName),
    ...state.areas.map(a => a.city),
  ]));

  return (
    <div className="space-y-12 pb-20">
      <datalist id="customer-suggestions">
        {suggestions.map((s, i) => <option key={i} value={s} />)}
      </datalist>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Customer List */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4 px-2">
            <div className="flex items-center gap-4">
               <div className="p-4 bg-primary/10 text-primary rounded-[1.5rem]"><Users size={24} /></div>
               <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-lg">Customer Portfolio</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Commercial Accounts & Credit Ledger</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="relative">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                 <input 
                   type="text" 
                   list="customer-suggestions"
                   placeholder="Lookup client..." 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 pr-6 py-2.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary/5 transition-all w-64 shadow-sm"
                 />
               </div>
               <button 
                  onClick={() => setIsCustomerModal(true)}
                  className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
               >
                 <Plus size={16} /> Register Client
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-2 py-32 bg-white rounded-[3.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-4">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Users size={40} /></div>
                 <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">No active profiles matching query</p>
              </div>
            ) : (
              filteredCustomers.map(c => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={c.id} 
                  className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-50 hover:shadow-2xl hover:border-primary/20 transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-[1.5rem] flex items-center justify-center font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-slate-100/50">
                         {c.name[0].toUpperCase()}
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 text-lg tracking-tight truncate max-w-[150px]">{c.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-0.5 rounded-lg font-black uppercase tracking-tighter mt-1 inline-block">Tax ID: {c.gstin}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Available Credit</p>
                       <p className="text-xl font-black text-emerald-500">₹{c.creditLimit.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center gap-4 border-t border-slate-50 pt-6">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Phone size={14} className="text-primary/40" />
                        <span className="text-[10px] font-bold">{c.phone || '+91 00000 00000'}</span>
                     </div>
                     <div className="w-px h-3 bg-slate-100" />
                     <div className="flex items-center gap-2 text-slate-400">
                        <Globe size={14} className="text-primary/40" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">{state.areas.find(a => a.id === c.areaId)?.areaName || 'No Area'}</span>
                     </div>
                  </div>
                  
                  <div className="absolute -bottom-4 -right-4 text-emerald-500/5 group-hover:scale-110 transition-transform duration-700">
                     <ShieldCheck size={120} />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Area List */}
        <div className="xl:col-span-4 flex flex-col gap-6">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="p-3.5 bg-accent/10 text-accent rounded-2xl"><MapPin size={20} /></div>
                 <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Zone Master</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Sales Jurisdiction</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsAreaModal(true)}
                className="w-10 h-10 bg-white border border-slate-100 text-accent rounded-full hover:bg-accent hover:text-white transition-all shadow-sm flex items-center justify-center font-bold"
              >
                <Plus size={20} />
              </button>
           </div>

           <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-50 p-10 flex-1">
             <div className="space-y-4">
               {state.areas.length === 0 ? (
                 <div className="py-20 text-center text-slate-300">
                    <MapPin size={48} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Jurisdictions Configured</p>
                 </div>
               ) : (
                 state.areas.map(a => (
                   <div key={a.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:border-accent/30 transition-all flex items-center justify-between group">
                      <div>
                        <p className="text-[9px] text-accent uppercase font-black tracking-[0.2em] mb-1">{a.city}</p>
                        <h5 className="font-black text-slate-800 text-sm">{a.areaName}</h5>
                      </div>
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[10px] font-black text-slate-300 group-hover:text-accent transition-colors border border-slate-100">
                         {state.customers.filter(c => c.areaId === a.id).length}
                      </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isAreaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white p-12 rounded-[3.5rem] w-full max-w-md shadow-2xl overflow-hidden"
             >
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h4 className="font-black text-xl text-slate-800 uppercase tracking-tight">Add Territory</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Configure Jurisdiction Mapping</p>
                  </div>
                  <button onClick={() => setIsAreaModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:text-red-500 transition-colors"><X size={20} /></button>
               </div>
               
               <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  setState(prev => ({
                    ...prev,
                    areas: [...prev.areas, { 
                      id: Math.random().toString(36).substr(2, 9), 
                      state: 'Gujarat', 
                      district: '', 
                      city: formData.get('city') as string, 
                      areaName: formData.get('areaName') as string 
                    }]
                  }));
                  setIsAreaModal(false);
               }} className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">City / District</label>
                    <input name="city" required placeholder="e.g. Ahmedabad" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-accent/5 font-bold" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Area / Ward Name</label>
                    <input name="areaName" required placeholder="e.g. Manek Chowk" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-accent/5 font-bold" />
                 </div>
                 <button type="submit" className="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] mt-4">Save Jurisdiction</button>
               </form>
             </motion.div>
          </div>
        )}

        {isCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="bg-white p-12 rounded-[3.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
             >
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h4 className="font-black text-xl text-slate-800 uppercase tracking-tight">Active Client Registry</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">New Customer Master Entry</p>
                  </div>
                  <button onClick={() => setIsCustomerModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:text-red-500 transition-colors"><X size={20} /></button>
               </div>
               
               <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  setState(prev => ({
                    ...prev,
                    customers: [...prev.customers, { 
                      id: Math.random().toString(36).substr(2, 9), 
                      name: formData.get('name') as string, 
                      gstin: formData.get('gstin') as string, 
                      creditLimit: Number(formData.get('limit')), 
                      areaId: formData.get('areaId') as string, 
                      phone: formData.get('phone') as string, 
                      pricingTier: 'retail' 
                    }]
                  }));
                  setIsCustomerModal(false);
               }} className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Company / Individual Name</label>
                    <input name="name" required placeholder="Full Trade Name" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">GSTIN Number</label>
                       <input name="gstin" required placeholder="24XXXXX" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 font-black text-xs uppercase" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Credit Ceiling</label>
                       <input name="limit" type="number" defaultValue={50000} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 font-black text-sm" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Primary Phone</label>
                       <input name="phone" required placeholder="+91 ..." className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 font-bold text-sm" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Jurisdiction</label>
                       <select name="areaId" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 font-black text-xs uppercase appearance-none">
                          {state.areas.map(a => <option key={a.id} value={a.id}>{a.areaName}, {a.city}</option>)}
                       </select>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px] mt-4 flex items-center justify-center gap-2">
                    <ShieldCheck size={16} /> Finalize Registration
                 </button>
               </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
