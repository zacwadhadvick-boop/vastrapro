import React, { useState, Dispatch, SetStateAction } from 'react';
import { UserCircle, Plus, Wallet, X } from 'lucide-react';
import { AppState } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface BrokerMasterProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
}

export default function BrokerMaster({ state, setState }: BrokerMasterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBroker, setNewBroker] = useState({ name: '', commissionRate: 2 });

  const handleAddBroker = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBroker.name) {
      setState(prev => ({
        ...prev,
        brokers: [...prev.brokers, { 
          id: `brk-${Date.now()}`, 
          name: newBroker.name, 
          commissionRate: newBroker.commissionRate 
        }]
      }));
      setIsModalOpen(false);
      setNewBroker({ name: '', commissionRate: 2 });
    }
  };

  const getBrokerCommission = (brokerId: string) => {
    return state.invoices
      .filter(inv => inv.brokerId === brokerId)
      .reduce((acc, inv) => {
        const broker = state.brokers.find(b => b.id === brokerId);
        return acc + (inv.totalAmount * ((broker?.commissionRate || 0) / 100));
      }, 0);
  };

  const filteredBrokers = state.brokers.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary text-white rounded-[1.5rem] shadow-xl shadow-primary/20"><UserCircle size={28} /></div>
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-lg">Agent Terminal</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Brokerage Network & Commission Tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
              <Plus className="rotate-45" size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search brokers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-primary/5 transition-all w-64 shadow-sm"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add Broker
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredBrokers.length === 0 ? (
          <div className="col-span-full py-32 bg-white rounded-[3.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-4 opacity-30">
             <UserCircle size={64} strokeWidth={1} />
             <p className="font-black uppercase tracking-[0.3em] text-[10px]">No broker channels defined</p>
          </div>
        ) : (
          filteredBrokers.map(b => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={b.id} 
              className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50 flex flex-col justify-between hover:shadow-2xl hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-[1.75rem] flex items-center justify-center font-black text-2xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-slate-100/50">
                    {b.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg tracking-tight truncate max-w-[150px]">{b.name}</h4>
                    <span className="text-[9px] bg-primary/5 text-primary px-3 py-1 rounded-lg font-black uppercase tracking-widest mt-2 inline-block">Commission: {b.commissionRate}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Active Leads</p>
                  <p className="text-xl font-black text-slate-800">{state.invoices.filter(i => i.brokerId === b.id).length}</p>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Total Payout</p>
                  <p className="text-2xl font-black text-emerald-600 tracking-tighter">₹{getBrokerCommission(b.id).toLocaleString()}</p>
                </div>
                <button className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300 hover:text-primary transition-colors border border-slate-100 shadow-sm">
                  <Wallet size={16} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20">
            <div className="p-6 bg-primary text-white flex items-center justify-between">
              <h4 className="font-black tracking-widest uppercase text-xs">New Broker Registration</h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddBroker} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Broker Name</label>
                  <input 
                    required 
                    placeholder="Enter full name"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-700" 
                    value={newBroker.name}
                    onChange={(e) => setNewBroker({...newBroker, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Commission Rate (%)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-slate-700" 
                    value={newBroker.commissionRate}
                    onChange={(e) => setNewBroker({...newBroker, commissionRate: Number(e.target.value)})}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-5 bg-primary text-white font-black rounded-[1.5rem] shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all tracking-widest uppercase text-xs"
              >
                SAVE BROKER MASTER
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
