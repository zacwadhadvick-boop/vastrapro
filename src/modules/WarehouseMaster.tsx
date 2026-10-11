import React, { useState, Dispatch, SetStateAction } from 'react';
import { Home, Plus, MapPin, Package, X, Search } from 'lucide-react';
import { AppState } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface WarehouseMasterProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  setView?: (view: any) => void;
}

export default function WarehouseMaster({ state, setState, setView }: WarehouseMasterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '' });

  const filteredWarehouses = state.warehouses.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary text-white rounded-[1.5rem] shadow-xl shadow-primary/20"><Home size={28} /></div>
          <div>
            <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest leading-none">Global Terminals</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Manage stock availability across geographic hubs</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Locate godown..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary/5 transition-all w-72 shadow-sm"
            />
          </div>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Provision Godown
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredWarehouses.length === 0 ? (
          <div className="col-span-full py-40 bg-white rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-6 opacity-30">
             <Home size={64} strokeWidth={1} />
             <p className="font-black uppercase tracking-[0.3em] text-[10px]">No infrastructure modules found</p>
          </div>
        ) : (
          filteredWarehouses.map(w => {
            const stats = getWarehouseStats(w.id);
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={w.id} 
                className="bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all"
              >
                 <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-4 mb-10">
                       <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-[1.75rem] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-slate-100/50">
                          <Home size={28} />
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{w.name}</h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            <MapPin size={12} className="text-primary/40" /> {w.location || 'Central Registry'}
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-10 mb-10">
                       <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Occupancy</p>
                          <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalItems.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-300 font-bold uppercase">Total Units</p>
                       </div>
                       <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Diverse SKU</p>
                          <p className="text-2xl font-black text-slate-800 mt-1">{stats.distinctSkus.toLocaleString()}</p>
                          <p className="text-[9px] text-slate-300 font-bold uppercase">Masters Loaded</p>
                       </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (setView) setView('inventory');
                      }}
                      className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-800 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      Audit Stock Registry <Plus size={12} className="rotate-45" />
                    </button>
                 </div>

                 <div className="absolute -top-10 -right-10 text-primary/5 group-hover:scale-110 transition-transform duration-1000">
                    <Package size={200} />
                 </div>
              </motion.div>
            );
          })
        )}
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
