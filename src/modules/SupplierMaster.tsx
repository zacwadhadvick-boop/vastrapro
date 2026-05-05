import React, { useState, Dispatch, SetStateAction } from 'react';
import { ShoppingCart, Plus, MapPin, Search, X, Phone, ShieldCheck, Mail, Building2 } from 'lucide-react';
import { AppState, Supplier } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface SupplierMasterProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
}

export default function SupplierMaster({ state, setState }: SupplierMasterProps) {
  const [isSupplierModal, setIsSupplierModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = state.suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm) ||
    (s.city && s.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSupplier: Supplier = {
      id: `s-${Math.random().toString(36).substr(2, 5)}`,
      name: formData.get('name') as string,
      gstin: formData.get('gstin') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
    };

    setState(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSupplier]
    }));
    setIsSupplierModal(false);
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
         <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-600 text-white rounded-[1.5rem] shadow-xl shadow-blue-600/20"><Building2 size={24} /></div>
            <div>
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-lg">Supplier Directory</h3>
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Manage Sourcing Accounts & Procurement Vendors</p>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search suppliers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-6 py-2.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-blue-600/5 transition-all w-64 shadow-sm"
              />
            </div>
            <button 
               onClick={() => setIsSupplierModal(true)}
               className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Register Supplier
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSuppliers.length === 0 ? (
          <div className="col-span-full py-40 bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-6">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <Building2 size={48} />
             </div>
             <div className="text-center">
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[11px]">No supplier accounts found</p>
                <p className="text-slate-300 text-[10px] font-bold uppercase mt-2 italic">Search matched 0 entities in sourcing registry</p>
             </div>
          </div>
        ) : (
          filteredSuppliers.map(s => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={s.id}
              className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-50 hover:shadow-2xl hover:border-blue-600/20 transition-all group relative overflow-hidden"
            >
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                   <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      {s.name[0]}
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">State</p>
                      <p className="text-xs font-black text-slate-800 uppercase tabular-nums">Gujarat</p>
                   </div>
                </div>

                <div>
                   <h4 className="font-black text-slate-800 text-xl tracking-tighter leading-tight group-hover:text-blue-600 transition-colors uppercase">{s.name}</h4>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">GSTIN: <span className="text-slate-900">{s.gstin}</span></p>
                </div>

                <div className="pt-6 border-t border-slate-50 space-y-3">
                   <div className="flex items-center gap-3 text-slate-400">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <Phone size={14} className="text-blue-600/40" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">{s.phone}</span>
                   </div>
                   <div className="flex items-center gap-3 text-slate-400">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <MapPin size={14} className="text-blue-600/40" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 truncate">{s.city ? `${s.city}, ` : ''}{s.address || 'Address Not Provided'}</span>
                   </div>
                </div>
              </div>

              <div className="absolute -top-6 -right-6 text-blue-600/5 group-hover:scale-110 transition-transform duration-700">
                 <ShieldCheck size={160} />
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isSupplierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-xl rounded-[4rem] overflow-hidden shadow-2xl relative border-4 border-white"
            >
               <div className="p-10 bg-blue-600 text-white flex justify-between items-center">
                  <div>
                     <h4 className="font-black text-2xl uppercase tracking-tighter italic">Register Sourcing Partner</h4>
                     <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Vendor Master Synchronization</p>
                  </div>
                  <button onClick={() => setIsSupplierModal(false)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                     <X size={24} />
                  </button>
               </div>

               <form onSubmit={handleAddSupplier} className="p-12 space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Supplier Trade Name</label>
                       <input name="name" required placeholder="e.g. Surat Silk Mills" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-blue-600/5 font-black text-sm uppercase" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">GSTIN Number</label>
                          <input name="gstin" required placeholder="24AAAAA0000A1Z5" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-blue-600/5 font-black text-sm uppercase" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Contact Phone</label>
                          <input name="phone" required placeholder="+91 ..." className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-blue-600/5 font-black text-sm" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">City</label>
                          <input name="city" required placeholder="Surat" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-blue-600/5 font-black text-sm uppercase" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Email (Optional)</label>
                          <input name="email" placeholder="contact@mill.com" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-blue-600/5 font-black text-sm" />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Office Address</label>
                       <textarea name="address" rows={2} className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-blue-600/5 font-bold text-sm" placeholder="Street, Area, Building..." />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
                     <ShieldCheck size={20} /> Authorize Supplier Account
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
