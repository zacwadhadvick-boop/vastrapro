import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './modules/Dashboard';
import Inventory from './modules/Inventory';
import Sales from './modules/Sales';
import Accounting from './modules/Accounting';
import Transport from './modules/Transport';
import Purchase from './modules/Purchase';
import SupplierMaster from './modules/SupplierMaster';
import CustomerMaster from './modules/CustomerMaster';
import BrokerMaster from './modules/BrokerMaster';
import WarehouseMaster from './modules/WarehouseMaster';
import Reports from './modules/Reports';
import { User, AppState, View } from './types';

const INITIAL_STATE: AppState = {
  products: [
    {
      id: 'p1',
      name: 'Kanjivaram Silk Special Saree',
      category: 'Saree',
      brand: 'Heritage Weaves',
      sellGst: 12,
      sellingPrice: 4500,
      mrp: 5999,
      mrpGst: 12,
      purchasePrice: 3200,
      purchaseGst: 12,
      discountMax: 20,
      batchNo: 'B24-001',
      barcode: '8901234567890',
      variants: [
        { id: 'v1', size: 'Free Size', color: 'Royal Red', colorCode: '#C41E3A', qty: 25, warehouseId: 'w1' },
        { id: 'v2', size: 'Free Size', color: 'Temple Gold', colorCode: '#FFD700', qty: 15, warehouseId: 'w1' }
      ]
    },
    {
      id: 'p2',
      name: 'Banaras Chiffon Lehenga Set',
      category: 'Lehenga',
      brand: 'Surat Designer',
      sellGst: 12,
      sellingPrice: 8500,
      mrp: 12500,
      mrpGst: 12,
      purchasePrice: 6000,
      purchaseGst: 12,
      discountMax: 15,
      batchNo: 'L24-052',
      barcode: '8901234567891',
      variants: [
        { id: 'v3', size: 'XL', color: 'Midnight Blue', colorCode: '#191970', qty: 10, warehouseId: 'w1' },
        { id: 'v4', size: 'L', color: 'Emerald Green', colorCode: '#50C878', qty: 8, warehouseId: 'w2' }
      ]
    },
    {
      id: 'p3',
      name: 'Lucknowi Chikankari Kurta',
      category: 'Kurta',
      brand: 'Chikan Art',
      sellGst: 5,
      sellingPrice: 1250,
      mrp: 1999,
      mrpGst: 5,
      purchasePrice: 850,
      purchaseGst: 5,
      discountMax: 10,
      batchNo: 'K24-102',
      barcode: '8901234567892',
      variants: [
        { id: 'v5', size: 'M', color: 'Pastel Pink', colorCode: '#F8C8DC', qty: 40, warehouseId: 'w1' },
        { id: 'v6', size: 'XL', color: 'Sky Blue', colorCode: '#87CEEB', qty: 35, warehouseId: 'w2' }
      ]
    }
  ],
  customers: [
    { id: 'c1', name: 'Rajesh Fashion House', gstin: '24AAAAA0000A1Z5', creditLimit: 500000, areaId: 'a1', phone: '+91 98765 43210', pricingTier: 'wholesale' },
    { id: 'c2', name: 'Anita Designer Boutique', gstin: '07BBBBB1111B1Z2', creditLimit: 250000, areaId: 'a2', phone: '+91 98222 11111', pricingTier: 'retail' },
    { id: 'c3', name: 'Shree Krishna Garments', gstin: '08CCCCC2222C1Z9', creditLimit: 1000000, areaId: 'a3', phone: '+91 94140 55555', pricingTier: 'wholesale' }
  ],
  suppliers: [
    { id: 's1', name: 'Surat Textile Mills', gstin: '24MILLS8888M1Z0', phone: '+91 261 2233445', address: 'Ring Road, Surat' }
  ],
  brokers: [
    { id: 'b1', name: 'Vinod Bhai Agency', commissionRate: 2, phone: '98250 11223' },
    { id: 'b2', name: 'Sharmaji & Sons', commissionRate: 1.5, phone: '94260 44556' }
  ],
  areas: [
    { id: 'a1', state: 'Delhi', district: 'Central', city: 'Delhi', areaName: 'Chandni Chowk' },
    { id: 'a2', state: 'Gujarat', district: 'Ahmedabad', city: 'Ahmedabad', areaName: 'Manek Chowk' },
    { id: 'a3', state: 'Rajasthan', district: 'Jaipur', city: 'Jaipur', areaName: 'Johari Bazar' }
  ],
  warehouses: [
    { id: 'w1', name: 'Surat Central Godown', location: 'Salabatpura, Surat' },
    { id: 'w2', name: 'Jaipur Terminal', location: 'Sitapura Industrial Area' }
  ],
  purchaseInvoices: [
    {
      id: 'pinv1',
      billNo: 'PUR/24-25/082',
      supplierId: 's1',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      items: [
        { productId: 'p1', qty: 50, rate: 3200 }
      ],
      totalAmount: 179200,
      status: 'received'
    }
  ],
  invoices: [
    {
      id: 'inv1',
      invoiceNo: 'SAL/24-25/001',
      customerId: 'c1',
      date: new Date().toISOString(),
      items: [
        { productId: 'p1', size: 'Free Size', color: 'Royal Red', qty: 10, price: 4500, discount: 0 }
      ],
      brokerId: 'b1',
      taxRate: 12,
      totalAmount: 50400,
      status: 'paid'
    }
  ],
  ledgerEntries: [
    { id: 'acc1', date: new Date().toISOString(), description: 'Office Rent - April', amount: 15000, type: 'debit', category: 'Rent' }
  ],
  transportLogs: [
    {
      id: 'tl1',
      invoiceNo: 'SAL/24-25/001',
      lrNo: 'LR/S/8812',
      transporterName: 'Surat-Delhi Golden Transport',
      vehicleNo: 'GJ-05-AT-4456',
      status: 'in-transit',
      date: new Date().toISOString(),
      freightAmount: 2450
    },
    {
      id: 'tl2',
      invoiceNo: 'SAL/23-24/995',
      lrNo: 'LR/A/2231',
      transporterName: 'Ankit Logistics PRAYAGRAJ',
      vehicleNo: 'UP-70-EX-1122',
      status: 'delivered',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      freightAmount: 1800
    }
  ],
  adminCredentials: {
    username: 'admin',
    password: 'password123'
  }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('vastrabill_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_STATE,
          ...parsed
        };
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('vastrabill_state', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
      // Optional: Notice to user if quota exceeded
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('Critical: Local storage quota exceeded. Please clear some old invoices to continue saving.');
      }
    }
  }, [state]);

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => setUser(null);
  const [showCredModal, setShowCredModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) {
    return <LoginPage onLogin={handleLogin} expectedCredentials={state.adminCredentials} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      <Sidebar 
        activeView={view} 
        setView={(v) => {
          setView(v);
          setIsSidebarOpen(false);
        }} 
        user={user} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <TopBar view={view} isOnline={isOnline} onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 pb-24 md:pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {view === 'dashboard' && <Dashboard state={state} setView={setView} />}
              {view === 'inventory' && <Inventory state={state} setState={setState} />}
              {view.startsWith('purchase') && (
                <>
                  {view === 'purchase:suppliers' ? (
                    <SupplierMaster state={state} setState={setState} />
                  ) : (
                    <Purchase state={state} setState={setState} currentView={view} />
                  )}
                </>
              )}
              {view.startsWith('sales') && <Sales state={state} setState={setState} currentView={view} />}
              {view === 'customers' && <CustomerMaster state={state} setState={setState} />}
              {view === 'brokers' && <BrokerMaster state={state} setState={setState} />}
              {view === 'warehouse' && <WarehouseMaster state={state} setState={setState} />}
              {view === 'accounting' && <Accounting state={state} setState={setState} />}
              {view === 'transport' && <Transport state={state} setState={setState} />}
              {view === 'reports' && <Reports state={state} />}
              {view === 'settings' && (
                <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-12">
                  <div>
                    <h3 className="font-serif text-3xl font-bold text-slate-800">System Configuration</h3>
                    <p className="text-sm text-slate-400 mt-2 font-medium">Enterprise offline-first ERP mode active.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                           <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Offline Security</h4>
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase">Admin Vault</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Manage your local decryption key and administrative login credentials for offline access.</p>
                        <button 
                          onClick={() => setShowCredModal(true)}
                          className="w-full py-4 bg-white border border-slate-200 text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 transition-all shadow-sm"
                        >
                          Modify Admin Credentials
                        </button>
                     </div>

                     <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between">
                           <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Storage Engine</h4>
                           <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">Indexing active</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">System is syncing with browser local persistence. Currently utilizing {Math.round(JSON.stringify(state).length / 1024)} KB.</p>
                        <button 
                          onClick={() => {
                            if(confirm('Wipe all local data? This cannot be undone.')) {
                              localStorage.removeItem('vastrabill_state');
                              window.location.reload();
                            }
                          }}
                          className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-100"
                        >
                          Hard Reset Database
                        </button>
                     </div>
                  </div>

                  {showCredModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl space-y-8">
                          <div>
                             <h4 className="font-black text-slate-800 uppercase tracking-widest">Update Admin Core</h4>
                             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Changes apply instantly to offline login.</p>
                          </div>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            setState(prev => ({
                              ...prev,
                              adminCredentials: {
                                username: fd.get('username') as string,
                                password: fd.get('password') as string
                              }
                            }));
                            setShowCredModal(false);
                            alert('Admin credentials updated successfully.');
                          }} className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Account ID</label>
                                <input name="username" defaultValue={state.adminCredentials?.username} required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 font-bold text-sm" />
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Target Password</label>
                                <input name="password" type="password" defaultValue={state.adminCredentials?.password} required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-600/5 font-bold text-sm" />
                             </div>
                             <div className="pt-4 flex gap-3">
                                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20">Authorize Sync</button>
                                <button type="button" onClick={() => setShowCredModal(false)} className="px-6 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl text-[10px] uppercase">Cancel</button>
                             </div>
                          </form>
                       </motion.div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
