import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, ShoppingBag, Users, Wallet, ArrowUpRight, ArrowDownRight, Package as PackageIcon, Truck } from 'lucide-react';
import { AppState } from '../types';
import { motion } from 'motion/react';

interface DashboardProps {
  state: AppState;
  setView: (view: string) => void;
}

const COLORS = ['#1E3A8A', '#10B981', '#FF6B35', '#8B5CF6'];

export default function Dashboard({ state, setView }: DashboardProps) {
  // Aggregate real data
  const totalSalesValue = state.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPurchaseValue = state.purchaseInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalCustomers = state.customers.length;
  const lowStockThreshold = 10;
  const lowStockItems = state.products.filter(p => p.variants.some(v => v.qty < lowStockThreshold)).slice(0, 5);
  const recentInvoices = [...state.invoices].reverse().slice(0, 5);

  const salesByDay = state.invoices.reduce((acc: any, inv) => {
    const day = new Date(inv.date).toLocaleDateString('en-US', { weekday: 'short' });
    acc[day] = (acc[day] || 0) + inv.totalAmount;
    return acc;
  }, {});

  const salesData = [
    { name: 'Mon', value: salesByDay['Mon'] || 0 },
    { name: 'Tue', value: salesByDay['Tue'] || 0 },
    { name: 'Wed', value: salesByDay['Wed'] || 0 },
    { name: 'Thu', value: salesByDay['Thu'] || 0 },
    { name: 'Fri', value: salesByDay['Fri'] || 0 },
    { name: 'Sat', value: salesByDay['Sat'] || 0 },
    { name: 'Sun', value: salesByDay['Sun'] || 0 },
  ];

  const stockByCategoryRaw = state.products.reduce((acc: any, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.variants.reduce((sum, v) => sum + v.qty, 0);
    return acc;
  }, {});

  const stockByCategory = Object.entries(stockByCategoryRaw).map(([name, value]) => ({ 
    name, 
    value: value as number 
  })).slice(0, 5);

  const stats = [
    { label: 'Total Sales', value: `₹${totalSalesValue.toLocaleString()}`, trend: '+12.5%', isUp: true, icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
    { label: 'Invoices Issued', value: state.invoices.length.toString(), trend: '+4.3%', isUp: true, icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Registered Clients', value: totalCustomers.toString(), trend: '+2', isUp: true, icon: Users, color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Inventory', value: state.products.reduce((acc, p) => acc + p.variants.reduce((s, v) => s + v.qty, 0), 0).toString(), trend: '-5%', isUp: false, icon: Wallet, color: 'bg-purple-50 text-purple-600' },
  ];

  const quickActions = [
    { label: 'Create Sale', icon: ShoppingBag, view: 'sales', color: 'bg-emerald-500' },
    { label: 'Add Purchase', icon: TrendingUp, view: 'purchase', color: 'bg-blue-500' },
    { label: 'New Product', icon: PackageIcon, view: 'inventory', color: 'bg-orange-500' },
    { label: 'Transport Slip', icon: Truck, view: 'transport', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-10">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {quickActions.map((action, i) => (
          <motion.button
            key={i}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView(action.view)}
            className="flex flex-col items-center justify-center p-4 sm:p-8 bg-white rounded-[2rem] md:rounded-[3.5rem] shadow-sm border border-slate-50 group hover:shadow-xl transition-all"
          >
            <div className={`p-4 sm:p-5 ${action.color} text-white rounded-[1.2rem] md:rounded-[1.5rem] mb-3 md:mb-4 shadow-lg group-hover:rotate-12 transition-transform`}>
              <action.icon size={22} className="md:w-[26px] md:h-[26px]" />
            </div>
            <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest md:tracking-[0.2em] text-slate-800 text-center leading-tight">{action.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 hover:shadow-xl hover:border-primary/10 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className={stat.color + " p-4 rounded-3xl transition-all group-hover:scale-110"}>
                <stat.icon size={26} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${stat.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-4 md:mt-6">
              <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-tight">{stat.label}</p>
              <h3 className="text-xl md:text-3xl font-black text-slate-800 mt-1 truncate">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest">Revenue Analytics</h3>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mt-1">Live Sales Projection</p>
            </div>
          </div>
          <div className="h-[350px] min-h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                  itemStyle={{ color: '#1E3A8A', fontWeight: '900', fontSize: '14px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#1E3A8A" strokeWidth={5} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-50">
          <h3 className="font-black text-xl text-slate-800 uppercase tracking-widest mb-2">Category Spread</h3>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mb-10">Stock Distribution</p>
          <div className="h-[350px] min-h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b', textTransform: 'uppercase' }} width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                <Bar dataKey="value" radius={[0, 20, 20, 0]} barSize={25}>
                  {stockByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity / Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest">Recent Sales</h3>
            <button className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline">View Journal</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Inv No.</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6 text-sm font-black text-slate-800">{inv.invoiceNo}</td>
                    <td className="px-8 py-6 text-sm text-slate-400 font-bold">{
                      state.customers.find(c => c.id === inv.customerId)?.name || inv.customerId
                    }</td>
                    <td className="px-8 py-6 text-sm font-black text-primary">₹{inv.totalAmount.toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest font-serif">Shortage Alert</h3>
            <button className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline">Restock Master</button>
          </div>
          <div className="p-8 space-y-4">
            {lowStockItems.length === 0 ? (
               <div className="py-10 text-center text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
                 Inventory is healthy.
               </div>
            ) : (
              lowStockItems.map(p => {
                const lowVariant = p.variants.find(v => v.qty < lowStockThreshold);
                return (
                  <div key={p.id} className="flex items-center justify-between p-5 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:bg-slate-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
                        <PackageIcon size={22} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.brand} ({lowVariant?.size}/{lowVariant?.color})</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-red-500">{lowVariant?.qty} Left</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Critical Limit</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
