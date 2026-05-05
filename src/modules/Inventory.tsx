import React, { useState, Dispatch, SetStateAction } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Package, X, Palette } from 'lucide-react';
import { AppState, Product, ProductVariant } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface InventoryProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
}

export default function Inventory({ state, setState }: InventoryProps) {
  const [activeTab, setActiveTab] = useState<'master' | 'matrix' | 'pricing' | 'warehouse'>('master');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Local state for variants during addition/editing
  const [localVariants, setLocalVariants] = useState<ProductVariant[]>([]);

  const filteredProducts = state.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm)
  );

  const suggestions = Array.from(new Set([
    ...state.products.map(p => p.name),
    ...state.products.map(p => p.brand),
    ...state.products.map(p => p.category),
    ...state.products.map(p => p.barcode).filter(Boolean),
    ...state.products.map(p => p.batchNo).filter(Boolean),
    ...state.warehouses.map(w => w.name),
    ...state.suppliers.map(s => s.name),
  ]));

  const resetModal = () => {
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setLocalVariants([]);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setLocalVariants([{
      id: Math.random().toString(36).substr(2, 9),
      size: 'M',
      color: 'Standard',
      colorCode: '#000000',
      qty: 0,
      warehouseId: state.warehouses[0]?.id || 'w1'
    }]);
    setIsAddModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setLocalVariants([...product.variants]);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
      }));
    }
  };

  const addVariantField = () => {
    setLocalVariants([
      ...localVariants,
      {
        id: Math.random().toString(36).substr(2, 9),
        size: '',
        color: '',
        colorCode: '#000000',
        qty: 0,
        warehouseId: state.warehouses[0]?.id || 'w1'
      }
    ]);
  };

  const removeVariantField = (id: string) => {
    setLocalVariants(localVariants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setLocalVariants(localVariants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      brand: formData.get('brand') as string,
      category: formData.get('category') as string,
      name: formData.get('name') as string,
      mrp: Number(formData.get('mrp')),
      mrpGst: Number(formData.get('mrpGst')),
      purchasePrice: Number(formData.get('purchasePrice')),
      purchaseGst: Number(formData.get('purchaseGst')),
      sellingPrice: Number(formData.get('sellingPrice')),
      sellGst: Number(formData.get('sellGst')),
      discountMax: Number(formData.get('discountMax')),
      batchNo: formData.get('batchNo') as string,
      barcode: formData.get('barcode') as string || (editingProduct?.barcode || Math.random().toString().slice(2, 12)),
      variants: localVariants
    };

    setState(prev => {
      const otherProducts = prev.products.filter(p => p.id !== productData.id);
      return {
        ...prev,
        products: [productData, ...otherProducts]
      };
    });
    resetModal();
  };

  const tabs = [
    { id: 'master', label: 'Artisan Hub' },
    { id: 'matrix', label: 'Stock Matrix' },
    { id: 'pricing', label: 'Fiscal Data' },
    { id: 'warehouse', label: 'Godown View' },
  ];

  const renderContent = () => {
    if (filteredProducts.length === 0) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-32 text-center"
        >
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package size={48} className="text-slate-200" />
          </div>
          <h3 className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Registry Empty</h3>
          <p className="text-slate-300 text-[10px] uppercase font-bold mt-2">No master articles found matching your query.</p>
        </motion.div>
      );
    }

    switch (activeTab) {
      case 'matrix':
        return (
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product / Article</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Variants</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Physical Stock</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(p => {
                    const totalQty = p.variants.reduce((acc, v) => acc + v.qty, 0);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-slate-800">{p.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.brand} | {p.barcode}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">{p.category}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex justify-center gap-1">
                             {p.variants.map((v, i) => (
                               <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: v.colorCode }} title={`${v.size} - ${v.color}`} />
                             ))}
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-800 text-sm font-mono">{totalQty}</td>
                        <td className="px-8 py-6">
                          {totalQty < 10 ? (
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Shortage</span>
                          ) : (
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Healthy</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">MRP (Incl.)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sourcing Rate</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sale Rate</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Margin (%)</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax (GST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredProducts.map(p => {
                    const margin = ((p.sellingPrice - p.purchasePrice) / p.purchasePrice * 100).toFixed(1);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-slate-800">{p.name}</p>
                           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{p.barcode}</p>
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-500 text-sm">₹{p.mrp}</td>
                        <td className="px-8 py-6 text-right font-black text-slate-800 text-sm">₹{p.purchasePrice}</td>
                        <td className="px-8 py-6 text-right font-black text-primary text-sm">₹{p.sellingPrice}</td>
                        <td className="px-8 py-6 text-right">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100">{margin}%</span>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In: {p.purchaseGst}% | Out: {p.sellGst}%</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'warehouse':
        const stockByWarehouse = state.warehouses.map(w => ({
          ...w,
          items: state.products.flatMap(p => 
            p.variants
              .filter(v => v.warehouseId === w.id)
              .map(v => ({ ...v, productName: p.name, barcode: p.barcode }))
          )
        }));

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stockByWarehouse.map(w => (
              <div key={w.id} className="bg-white rounded-[3rem] shadow-sm border border-slate-50 overflow-hidden flex flex-col h-fit">
                <div className="p-8 bg-slate-50 flex items-center justify-between">
                   <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-widest">{w.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{w.location}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-2xl font-black text-slate-800 tabular-nums">{w.items.reduce((acc, i) => acc + i.qty, 0)}</p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Units Ready</p>
                   </div>
                </div>
                <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                   {w.items.map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-50 rounded-2xl">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full border border-slate-100" style={{ backgroundColor: item.colorCode }} />
                           <div>
                              <p className="text-[10px] font-black text-slate-800 uppercase">{item.productName}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{item.size} | {item.color}</p>
                           </div>
                        </div>
                        <p className="font-black text-slate-800 text-sm">{item.qty}</p>
                     </div>
                   ))}
                   {w.items.length === 0 && <p className="py-10 text-center text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Godown currently vacant</p>}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProducts.map((product, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={product.id}
                className="bg-white border border-slate-100 rounded-[3rem] p-8 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden active:scale-[0.99]"
              >
                {/* Performance Indicators */}
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-[1.75rem] flex items-center justify-center font-black text-3xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner group-hover:shadow-primary/30 group-hover:-translate-y-1">
                    {product.name[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className={cn(
                       "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border",
                       product.variants.reduce((acc, v) => acc + v.qty, 0) < 10 ? "bg-red-50 text-red-500 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                     )}>
                       In Stock: {product.variants.reduce((acc, v) => acc + v.qty, 0)}
                     </span>
                     <p className="text-[10px] text-slate-300 font-bold font-mono tracking-tighter">REF: {product.barcode}</p>
                  </div>
                </div>

                {/* Identity */}
                <div className="space-y-1 mb-8">
                  <div className="flex items-center gap-2">
                     <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">{product.category}</p>
                     <div className="w-1 h-1 bg-slate-200 rounded-full" />
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.brand}</p>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-primary transition-colors">{product.name}</h4>
                </div>

                {/* Financials */}
                <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 mb-8 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Selling Rate</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{product.sellingPrice}<span className="text-[10px] text-slate-300 ml-1">+{product.sellGst}% GST</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Valuation</p>
                    <p className="text-xs font-black text-slate-500">₹{product.purchasePrice}</p>
                  </div>
                </div>

                {/* Variants Preview */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.variants.slice(0, 4).map((v, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.colorCode }} />
                       <span className="text-[8px] font-black uppercase text-slate-500">{v.size}</span>
                    </div>
                  ))}
                  {product.variants.length > 4 && (
                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                      <span className="text-[8px] font-black text-slate-400">+{product.variants.length - 4} MORE</span>
                    </div>
                  )}
                </div>

                {/* Global Actions */}
                <div className="flex items-center p-1 bg-slate-50 rounded-2xl border border-slate-100">
                   <button 
                     onClick={() => handleEdit(product)}
                     className="flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-colors bg-white rounded-xl shadow-sm border border-slate-100 group/btn"
                   >
                     <Edit size={14} className="group-hover/btn:scale-110 transition-transform" /> Edit Master
                   </button>
                   <button 
                     onClick={() => handleDelete(product.id)}
                     className="w-14 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors"
                   >
                      <Trash2 size={16} />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <datalist id="inventory-suggestions">
        {suggestions.map((s, i) => <option key={i} value={s} />)}
      </datalist>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 md:px-6 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap rounded-[1rem] transition-all",
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-slate-400 hover:text-primary hover:bg-primary/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative group flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                list="inventory-suggestions"
                placeholder="Search..." 
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest focus:ring-[8px] focus:ring-primary/5 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-3 px-6 py-3.5 bg-primary text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} /> Create Master
          </button>
        </div>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden my-8"
            >
              <div className="p-8 bg-primary text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-[0.2em]">{editingProduct ? 'Edit Product File' : 'New Master Entry'}</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase mt-1">Garment Inventory & GST Configuration</p>
                </div>
                <button 
                  onClick={resetModal} 
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSaveProduct} className="p-6 md:p-10 space-y-6 md:space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</label>
                    <input name="name" defaultValue={editingProduct?.name} required className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Name</label>
                    <input name="brand" defaultValue={editingProduct?.brand} required className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                    <select name="category" defaultValue={editingProduct?.category} className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold appearance-none">
                      <option>Saree</option>
                      <option>Lehenga</option>
                      <option>Suit</option>
                      <option>Kurta</option>
                      <option>Gown</option>
                      <option>Western</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">MRP</label>
                    <input name="mrp" type="number" defaultValue={editingProduct?.mrp} required className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">MRP GST (%)</label>
                    <input name="mrpGst" type="number" defaultValue={editingProduct?.mrpGst || 12} className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Sell Price</label>
                    <input name="sellingPrice" type="number" defaultValue={editingProduct?.sellingPrice} required className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-primary/5 border border-primary/20 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold text-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Sell GST (%)</label>
                    <input name="sellGst" type="number" defaultValue={editingProduct?.sellGst || 12} className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Price</label>
                    <input name="purchasePrice" type="number" defaultValue={editingProduct?.purchasePrice} required className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold" />
                  </div>
                   <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase GST (%)</label>
                    <input name="purchaseGst" type="number" defaultValue={editingProduct?.purchaseGst || 12} className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Max Discount (%)</label>
                    <input name="discountMax" type="number" defaultValue={editingProduct?.discountMax || 10} className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch/Barcode</label>
                    <input name="barcode" defaultValue={editingProduct?.barcode} className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] outline-none focus:ring-4 focus:ring-primary/10 font-bold font-mono" placeholder="Auto-generated" />
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black uppercase text-slate-800 tracking-widest">Variant Registry (Size/Color Matrix)</h4>
                    <button 
                      type="button" 
                      onClick={addVariantField}
                      className="flex items-center gap-2 text-[10px] font-black text-primary uppercase bg-primary/5 px-4 py-2 rounded-xl hover:bg-primary/10 transition-all"
                    >
                      <Plus size={14} /> Add Variant
                    </button>
                  </div>

                  <div className="space-y-4">
                    {localVariants.map((v) => (
                      <div key={v.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-5 bg-white border border-slate-200 rounded-3xl items-end relative group">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Size</label>
                          <input 
                            placeholder="M, XL, 32..." 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-bold"
                            value={v.size}
                            onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Color Name</label>
                          <input 
                            placeholder="Royal Blue" 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary font-bold"
                            value={v.color}
                            onChange={(e) => updateVariant(v.id, 'color', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">HEX Code</label>
                          <div className="flex items-center gap-2">
                             <input 
                               type="color" 
                               className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer"
                               value={v.colorCode}
                               onChange={(e) => updateVariant(v.id, 'colorCode', e.target.value)}
                             />
                             <input 
                               placeholder="#000000" 
                               className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] outline-none font-mono font-bold"
                               value={v.colorCode}
                               onChange={(e) => updateVariant(v.id, 'colorCode', e.target.value)}
                             />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
                          <input 
                            type="number" 
                            className="w-full px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs outline-none font-bold text-emerald-700"
                            value={v.qty}
                            onChange={(e) => updateVariant(v.id, 'qty', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1 col-span-1 md:col-span-1">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Warehouse</label>
                           <select 
                             className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] outline-none font-bold"
                             value={v.warehouseId}
                             onChange={(e) => updateVariant(v.id, 'warehouseId', e.target.value)}
                           >
                             {state.warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                           </select>
                        </div>
                        <div className="flex justify-end">
                           <button 
                             type="button" 
                             onClick={() => removeVariantField(v.id)}
                             disabled={localVariants.length === 1}
                             className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    type="button" 
                    onClick={resetModal} 
                    className="flex-1 py-4 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {editingProduct ? 'Update Product File' : 'Initialize Product Master'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
