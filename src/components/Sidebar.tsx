import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Landmark, 
  Truck, 
  Settings, 
  LogOut, 
  ChartBar, 
  Users, 
  UserCircle, 
  Home, 
  FileBarChart,
  X
} from 'lucide-react';
import { View, User } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeView, setView, user, onLogout, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory (Stock)', icon: Package },
    { 
      id: 'purchase', 
      label: 'Purchase (Bulk)', 
      icon: ShoppingCart,
      subItems: [
        { id: 'purchase:registry', label: 'Inward Registry' },
        { id: 'purchase:bill', label: 'Purchase Bill' },
        { id: 'purchase:suppliers', label: 'Supplier Registry' }
      ]
    },
    { 
      id: 'sales', 
      label: 'Sales operations', 
      icon: ChartBar,
      subItems: [
        { id: 'sales:billing', label: 'Sales Billing' },
        { id: 'sales:invoices', label: 'Billing History' },
        { id: 'sales:return', label: 'Sales Return' },
        { id: 'sales:rates', label: 'Rate List' }
      ]
    },
    { id: 'customers', label: 'Customers & Area', icon: Users },
    { id: 'brokers', label: 'Brokers/Agents', icon: UserCircle },
    { id: 'warehouse', label: 'Warehouse Mgt', icon: Home },
    { id: 'accounting', label: 'Accounting', icon: Landmark },
    { id: 'transport', label: 'Transport Log', icon: Truck },
    { id: 'reports', label: 'ERP Reports', icon: FileBarChart },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-0 shrink-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-primary/30">
              <span className="font-black italic text-2xl">V</span>
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-900 tracking-tighter leading-none">Vastra<span className="text-primary italic">Bill</span></h1>
              <p className="text-[10px] text-slate-300 uppercase tracking-[0.25em] font-black mt-1">Enterprise ERP</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-red-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-8">
          <nav className="px-4 space-y-1.5">
            {menuItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => setView(item.id as View)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all font-black text-[11px] uppercase tracking-[0.1em] group",
                    activeView.startsWith(item.id) 
                      ? "bg-primary text-white shadow-xl shadow-primary/20" 
                      : "text-slate-400 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <item.icon size={20} className={cn("transition-transform group-hover:scale-110", activeView.startsWith(item.id) ? "text-white" : "text-slate-300 group-hover:text-primary")} />
                  {item.label}
                </button>
                
                {item.subItems && activeView.startsWith(item.id) && (
                  <div className="mt-2 ml-7 border-l-2 border-slate-50 pl-6 space-y-1 pb-4">
                    {item.subItems.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setView(sub.id as View)}
                        className={cn(
                          "w-full text-left py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-colors",
                          activeView === sub.id ? "text-primary" : "text-slate-400 hover:text-primary"
                        )}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="p-8 border-t border-slate-50 space-y-6 bg-slate-50/50">
          <div className="flex items-center gap-4 px-2">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
              <span className="text-sm font-black text-primary uppercase">{user.username[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 truncate uppercase tracking-widest">{user.username}</p>
              <p className="text-[9px] text-emerald-500 uppercase font-black tracking-widest mt-0.5">{user.role}</p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all font-black text-[11px] uppercase tracking-widest shadow-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
