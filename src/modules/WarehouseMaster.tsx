import React, { useState, Dispatch, SetStateAction } from 'react';
import { Home, Plus, MapPin, Package, X } from 'lucide-react';
import { AppState } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface WarehouseMasterProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
}

export default function WarehouseMaster({ state, setState }: WarehouseMasterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '' });

  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWarehouse.name) {
      setState(prev => ({
        ...prev,
        warehouses: [...prev.warehouses, { 
          id: Date.now().toString(), 
          name: newWarehouse.name, 
          location: newWarehouse.location 
        }]
      }));
      setIsModalOpen(false);
      setNewWarehouse({ name: '', location: '' });
    }
  };

  const getWarehouseStats = (warehouseId: string) => {
    let totalItems = 0;
    let distinctSkus = 0;
    
    state.products.forEach(p => {
      const warehouseVariants = p.variants.filter(v => v.warehouseId === warehouseId);
      if (warehouseVariants.length > 0) {
        distinctSkus++;
        totalItems += warehouseVariants.reduce((s, v) => s + v.qty, 0);
      }
    });

    return { totalItems, distinctSkus };
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest">Warehouse & Terminal Mgt</h3>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-[1.5rem] font-bold text-sm tracking-widest uppercase shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} /> Provision Godown
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {state.warehouses.map(w => {
          const stats = getWarehouseStats(w.id);
          return (
            <motion.div 
              layout
              key={w.id} 
              className="bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all"
            >
               <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-[1.5rem] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                        <Home size={28} />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{w.name}</h4>
                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                          <MapPin size={12} className="text-primary/40" /> {w.location || 'Central Registry'}
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
                     <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Occupancy</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalItems}</p>
                        <p className="text-[9px] text-slate-300 font-bold uppercase">Total Units</p>
                     </div>
                     <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Diverse SKU</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{stats.distinctSkus}</p>
                        <p className="text-[9px] text-slate-300 font-bold uppercase">Masters Loaded</p>
                     </div>
                  </div>
               </div>

               <div className="absolute top-0 right-0 p-4">
                  <button className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <X size={20} />
                  </button>
               </div>
            </motion.div>
          );
        })}
      </div>

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
                <h4 className="font-black tracking-[0.2em] uppercase text-xs">Warehouse Provisioning</h4>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all font-bold"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddWarehouse} className="p-12 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Godown Title</label>
                    <input 
                      required 
                      placeholder="e.g. Surat Main Branch"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-bold" 
                      value={newWarehouse.name}
                      onChange={(e) => setNewWarehouse({...newWarehouse, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Geographic Location</label>
                    <input 
                      placeholder="Full Address"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary/5 transition-all font-bold" 
                      value={newWarehouse.location}
                      onChange={(e) => setNewWarehouse({...newWarehouse, location: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[10px]"
                >
                  Initialize Storage Node
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
