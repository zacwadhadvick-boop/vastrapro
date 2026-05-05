import { Search, Bell, HelpCircle, User, Menu } from 'lucide-react';
import { View } from '../types';

interface TopBarProps {
  view: View;
  isOnline: boolean;
  onMenuClick: () => void;
}

export default function TopBar({ view, isOnline, onMenuClick }: TopBarProps) {
  const titles: Record<string, string> = {
    dashboard: 'Executive Dashboard',
    inventory: 'Inventory Master',
    sales: 'Sales Operations',
    accounting: 'Financial Controller',
    transport: 'Logistics Terminal',
    purchase: 'Procurement Journal',
    customers: 'Client Relations',
    brokers: 'Agency Master',
    warehouse: 'Logistics Nodes',
    reports: 'Intelligence Reports',
    settings: 'Core Configuration',
  };

  return (
    <header className="h-28 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-primary transition-all active:scale-95"
        >
          <Menu size={24} />
        </button>
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight leading-none truncate max-w-[200px] md:max-w-none">{titles[view] || view}</h2>
          <div className="flex items-center gap-3">
             <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'} animate-pulse shadow-lg`} />
             <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
               System Terminal / <span className="text-primary hidden sm:inline">{view}</span> / {isOnline ? <span className="text-emerald-500">Online</span> : <span className="text-red-500">Offline</span>}
             </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="relative hidden xl:block">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Global Search Integrity..." 
            className="pl-12 pr-6 py-3.5 bg-slate-50 border border-slate-100 rounded-[1.25rem] text-xs font-black outline-none focus:ring-8 focus:ring-primary/5 w-80 transition-all uppercase tracking-widest"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-primary transition-all rounded-2xl hover:bg-primary/5 group border border-transparent hover:border-primary/10">
            <Bell size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          <button className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-primary transition-all rounded-2xl hover:bg-primary/5 group border border-transparent hover:border-primary/10">
            <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
          </button>
          
          <div className="h-10 w-px bg-slate-100 mx-2" />
          
          <div className="flex items-center gap-3 pl-2">
             <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
                <User size={20} />
             </div>
             <div className="hidden lg:block">
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Administrator</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase">System Root</p>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
}
