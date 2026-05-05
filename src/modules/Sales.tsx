import { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { Plus, Search, ShoppingCart, User, CreditCard, ChevronRight, Calculator, Trash2, X, Tag, Share2, Printer, CheckCircle2 } from 'lucide-react';
import { AppState, Product, Invoice, ProductVariant } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface CartItem {
  product: Product;
  variant: ProductVariant;
  qty: number;
  price: number; // Unit Price
  discountPercent: number;
}

interface SalesProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  currentView?: string;
}

export default function Sales({ state, setState, currentView }: SalesProps) {
  const [activeTab, setActiveTab] = useState<'billing' | 'invoices' | 'return' | 'rates'>('billing');
  
  // Sync tab with external view changes
  useEffect(() => {
    if (currentView?.startsWith('sales:')) {
      const tab = currentView.split(':')[1] as any;
      if (['billing', 'invoices', 'return', 'rates'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [currentView]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedBroker, setSelectedBroker] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectionModal, setSelectionModal] = useState<Product | null>(null);
  const [returnModal, setReturnModal] = useState<boolean>(false);
  const [priceUpdateModal, setPriceUpdateModal] = useState<boolean>(false);
  const [editingPriceProduct, setEditingPriceProduct] = useState<Product | null>(null);

  const calculateItemTotal = (item: CartItem) => {
    const discountedPrice = item.price * (1 - item.discountPercent / 100);
    const itemSubtotal = discountedPrice * item.qty;
    const gstAmount = itemSubtotal * (item.product.sellGst / 100);
    return itemSubtotal + gstAmount;
  };

  const totalBeforeTaxAndDiscount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalDiscount = cart.reduce((acc, item) => acc + (item.price * item.qty * (item.discountPercent / 100)), 0);
  const totalGst = cart.reduce((acc, item) => {
    const base = (item.price * (1 - item.discountPercent / 100)) * item.qty;
    return acc + (base * (item.product.sellGst / 100));
  }, 0);
  
  const grandTotal = totalBeforeTaxAndDiscount - totalDiscount + totalGst;

  const handleOpenSelection = (product: Product) => {
    if (product.variants.length === 1) {
      addToCart(product, product.variants[0]);
    } else {
      setSelectionModal(product);
    }
  };

  const addToCart = (product: Product, variant: ProductVariant) => {
    const existingIndex = cart.findIndex(i => i.product.id === product.id && i.variant.id === variant.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].qty += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { 
        product, 
        variant, 
        qty: 1, 
        price: product.sellingPrice,
        discountPercent: 0
      }]);
    }
    setSelectionModal(null);
  };

  const updateCartItem = (idx: number, field: keyof CartItem, value: any) => {
    const newCart = [...cart];
    (newCart[idx] as any)[field] = value;
    setCart(newCart);
  };

  const handleCreateInvoice = () => {
    if (cart.length === 0) return;

    // Validate Stock
    for (const item of cart) {
      if (item.qty > item.variant.qty) {
        alert(`Insufficient stock for ${item.product.name} (Size ${item.variant.size}). Available: ${item.variant.qty}`);
        return;
      }
    }
    
    const invoiceId = Math.random().toString(36).substr(2, 9);
    const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
    
    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNo: invoiceNo,
      date: new Date().toISOString(),
      customerId: selectedCustomer || 'Walk-in Customer',
      brokerId: selectedBroker,
      items: cart.map(item => ({
        productId: item.product.id,
        size: item.variant.size,
        color: item.variant.color,
        qty: item.qty,
        price: item.price,
        discount: item.discountPercent
      })),
      taxRate: 12,
      totalAmount: grandTotal,
      status: 'paid'
    };

    // Create Ledger Entry
    const newLedgerEntry = {
      id: `acc-${Date.now()}`,
      date: new Date().toISOString(),
      description: `Sales Invoice ${invoiceNo}`,
      amount: grandTotal,
      type: 'credit' as const,
      entityId: selectedCustomer || undefined,
      category: 'Sales'
    };

    // Update Inventory, Invoices, and Ledger
    setState(prev => {
      const newProducts = prev.products.map(p => {
        const cartItemsForThisProduct = cart.filter(ci => ci.product.id === p.id);
        if (cartItemsForThisProduct.length > 0) {
          return {
            ...p,
            variants: p.variants.map(v => {
              const cartItem = cartItemsForThisProduct.find(ci => ci.variant.id === v.id);
              return cartItem ? { ...v, qty: v.qty - cartItem.qty } : v;
            })
          };
        }
        return p;
      });

      return {
        ...prev,
        invoices: [newInvoice, ...prev.invoices],
        products: newProducts,
        ledgerEntries: [newLedgerEntry, ...prev.ledgerEntries]
      };
    });

    setCart([]);
    setSelectedCustomer('');
    setSelectedBroker('');
    setActiveTab('invoices');
  };

  const handleProcessReturn = (invoice: Invoice) => {
    // Return items to inventory and mark invoice as returned
    const returnInvoiceNo = `RET-${invoice.invoiceNo}`;
    
    // Create Reversal Ledger Entry
    const reversalLedgerEntry = {
      id: `acc-ret-${Date.now()}`,
      date: new Date().toISOString(),
      description: `Sales Return ${invoice.invoiceNo}`,
      amount: invoice.totalAmount,
      type: 'debit' as const, // Reversal is a debit
      entityId: (invoice.customerId !== 'Walk-in Customer') ? invoice.customerId : undefined,
      category: 'Returns'
    };

    setState(prev => {
      const newProducts = prev.products.map(p => {
        const itemsToReturn = invoice.items.filter(item => item.productId === p.id);
        if (itemsToReturn.length > 0) {
          return {
            ...p,
            variants: p.variants.map(v => {
              const returnedItem = itemsToReturn.find(item => item.size === v.size && item.color === v.color);
              return returnedItem ? { ...v, qty: v.qty + returnedItem.qty } : v;
            })
          };
        }
        return p;
      });

      return {
        ...prev,
        products: newProducts,
        invoices: prev.invoices.map(inv => 
          inv.id === invoice.id ? { ...inv, status: 'returned' as any } : inv
        ),
        ledgerEntries: [reversalLedgerEntry, ...prev.ledgerEntries]
      };
    });
    setReturnModal(false);
  };

  const handleUpdatePrice = (productId: string, newPrice: number, newGst: number) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === productId ? { ...p, sellingPrice: newPrice, sellGst: newGst } : p
      )
    }));
    setEditingPriceProduct(null);
  };

  const filteredProducts = state.products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const suggestions = Array.from(new Set([
    ...state.products.map(p => p.name),
    ...state.products.map(p => p.brand),
    ...state.products.map(p => p.category),
    ...state.products.map(p => p.barcode).filter(Boolean),
    ...state.customers.map(c => c.name),
    ...state.customers.map(c => c.phone),
    ...state.invoices.map(i => i.invoiceNo),
    ...state.brokers.map(b => b.name),
  ]));

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const handleOpenPreview = (inv: Invoice) => {
    setPreviewInvoice(inv);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice? This will NOT automatically reverse inventory.')) {
      setState(prev => ({
        ...prev,
        invoices: prev.invoices.filter(inv => inv.id !== id)
      }));
    }
  };

  const shareOnWhatsApp = (inv: Invoice) => {
    const customer = state.customers.find(c => c.id === inv.customerId);
    const phone = customer?.phone || '';
    const message = `Hello ${customer?.name || 'Customer'},\n\nYour invoice *${inv.invoiceNo}* from *Ankita Traders* is ready.\nTotal Amount: *₹${inv.totalAmount}*\n\nThank you for shopping with us!`;
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getSubtotal = (inv: Invoice) => {
    return inv.items.reduce((acc, item) => {
      const discounted = item.price * (1 - item.discount / 100);
      return acc + (discounted * item.qty);
    }, 0);
  };

  const getTax = (inv: Invoice) => {
    return inv.items.reduce((acc, item) => {
      const product = state.products.find(p => p.id === item.productId);
      const gst = product?.sellGst || 12;
      const discounted = item.price * (1 - item.discount / 100);
      return acc + (discounted * item.qty * (gst / 100));
    }, 0);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <datalist id="sales-suggestions">
        {suggestions.map((s, i) => <option key={i} value={s} />)}
      </datalist>
      <div className="flex border-b border-slate-100 px-2 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('billing')}
          className={cn(
            "px-4 md:px-10 py-3 md:py-5 text-[9px] md:text-[10px] font-black tracking-widest md:tracking-[0.2em] uppercase border-b-4 transition-all whitespace-nowrap",
            activeTab === 'billing' ? "border-primary text-primary" : "border-transparent text-slate-400"
          )}
        >
          Billing
        </button>
        <button 
          onClick={() => setActiveTab('invoices')}
          className={cn(
            "px-4 md:px-10 py-3 md:py-5 text-[9px] md:text-[10px] font-black tracking-widest md:tracking-[0.2em] uppercase border-b-4 transition-all whitespace-nowrap",
            activeTab === 'invoices' ? "border-primary text-primary" : "border-transparent text-slate-400"
          )}
        >
          History
        </button>
        <button 
          onClick={() => setActiveTab('return')}
          className={cn(
            "px-4 md:px-10 py-3 md:py-5 text-[9px] md:text-[10px] font-black tracking-widest md:tracking-[0.2em] uppercase border-b-4 transition-all whitespace-nowrap",
            activeTab === 'return' ? "border-primary text-primary" : "border-transparent text-slate-400"
          )}
        >
          Return
        </button>
        <button 
          onClick={() => setActiveTab('rates')}
          className={cn(
            "px-4 md:px-10 py-3 md:py-5 text-[9px] md:text-[10px] font-black tracking-widest md:tracking-[0.2em] uppercase border-b-4 transition-all whitespace-nowrap",
            activeTab === 'rates' ? "border-primary text-primary" : "border-transparent text-slate-400"
          )}
        >
          Rates
        </button>
      </div>

      {activeTab === 'billing' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
          {/* Product selection */}
          <div className="lg:col-span-12 xl:col-span-12 flex flex-col space-y-6">
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="relative group flex-1">
                  <div className="absolute inset-y-0 left-0 pl-5 md:pl-7 flex items-center pointer-events-none text-slate-300 group-focus-within:text-primary transition-colors">
                    <Search size={20} className="md:w-6 md:h-6" strokeWidth={2.5} />
                  </div>
                  <input 
                    type="text" 
                    list="sales-suggestions"
                    placeholder="Search articles..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 md:pl-16 pr-8 py-4 md:py-6 bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2.5rem] outline-none focus:ring-[8px] md:focus:ring-[12px] focus:ring-primary/5 transition-all font-black text-lg md:text-xl shadow-xl shadow-slate-200/20 placeholder:text-slate-200"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block px-4 py-2 bg-slate-50 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 shadow-sm">
                    {filteredProducts.length} ARTICLES
                  </div>
                </div>
                <button className="px-8 py-4 md:px-10 md:py-6 bg-primary text-white rounded-[1.5rem] md:rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                  Search
                </button>
             </div>

             <div className="flex-1 overflow-y-auto pr-4 -mr-4 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
               <AnimatePresence>
                 {filteredProducts.map(p => (
                   <motion.button 
                     layout
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     key={p.id}
                     onClick={() => handleOpenSelection(p)}
                     className="p-7 bg-white border border-slate-100 rounded-[3rem] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-all text-left flex flex-col gap-6 group relative overflow-hidden active:scale-[0.98]"
                   >
                     {/* Card Header */}
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-[1.75rem] flex items-center justify-center font-black text-3xl group-hover:bg-primary group-hover:text-white transition-all shadow-inner group-hover:shadow-primary/30 group-hover:-translate-y-1">
                          {p.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                           <h4 className="font-black text-slate-900 truncate text-base leading-tight">{p.name}</h4>
                           <div className="flex items-center gap-2 mt-1">
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">{p.brand}</p>
                             <div className="w-1 h-1 bg-slate-200 rounded-full" />
                             <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">{p.category || 'Apparel'}</p>
                           </div>
                        </div>
                     </div>

                     {/* Price Tag */}
                     <div className="mt-2 flex items-end justify-between">
                        <div className="space-y-1">
                           <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest pl-1">Selling Rate</p>
                           <p className="text-2xl font-black text-slate-900 tracking-tighter">₹{p.sellingPrice}<span className="text-[10px] text-slate-300 ml-1">GST Incl.</span></p>
                        </div>
                        <div className="text-right">
                           <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100/50 flex flex-col items-center group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all">
                              <span className="text-[8px] text-emerald-600/50 font-black uppercase group-hover:text-white/50">STOCK</span>
                              <span className="text-sm font-black text-emerald-600 group-hover:text-white leading-none mt-1">
                                {p.variants.reduce((acc, v) => acc + v.qty, 0)}
                              </span>
                           </div>
                        </div>
                     </div>
                   </motion.button>
                 ))}
               </AnimatePresence>
             </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-12 xl:col-span-12 flex flex-col bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden xl:sticky xl:top-6 h-auto xl:h-[calc(100vh-140px)] min-h-[400px] xl:min-h-[650px]">
             <div className="p-8 bg-slate-50 flex items-center justify-between border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                      <ShoppingCart size={20} />
                   </div>
                   <div>
                      <h3 className="font-black text-slate-900 uppercase tracking-[0.1em] text-sm">Counter Billing</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1.5">
                        <CheckCircle2 size={10} className="text-emerald-500" />
                        {cart.length} Articles Selected
                      </p>
                   </div>
                </div>
                <button onClick={() => setCart([])} className="px-4 py-2 text-[9px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-all uppercase tracking-widest border border-red-100">Clear</button>
             </div>

             <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 bg-slate-50/30">
                <AnimatePresence initial={false}>
                   {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32">
                         <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <Calculator size={40} strokeWidth={1.5} className="opacity-30" />
                         </div>
                         <p className="font-black uppercase tracking-[0.25em] text-[9px] text-center max-w-[200px] leading-relaxed">Article Basket is empty. Search products to begin billing.</p>
                      </div>
                   ) : (
                      cart.map((item, idx) => (
                         <motion.div 
                           key={`${item.product.id}-${item.variant.id}-${idx}`}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.95 }}
                           className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-md transition-all border-l-4 border-l-slate-200 hover:border-l-primary"
                         >
                            <div className="flex items-start justify-between">
                               <div className="flex-1 min-w-0 pr-4">
                                  <h5 className="font-black text-slate-900 text-sm truncate">{item.product.name}</h5>
                                  <div className="flex items-center gap-3 mt-1.5">
                                     <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-lg">
                                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: item.variant.colorCode }} />
                                        <span className="text-[8px] font-black uppercase text-slate-500">{item.variant.color}</span>
                                     </div>
                                     <span className="text-[8px] font-black px-2 py-0.5 bg-slate-100 rounded-lg text-slate-500">SIZE: {item.variant.size}</span>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => setCart(cart.filter((_, i) => i !== idx))}
                                 className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                               >
                                  <X size={14} />
                               </button>
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-50 pt-5">
                               <div className="space-y-1.5">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Qty</label>
                                  <div className="relative">
                                    <input 
                                      type="number" 
                                      min="1"
                                      max={item.variant.qty}
                                      value={item.qty}
                                      onChange={(e) => updateCartItem(idx, 'qty', parseInt(e.target.value) || 1)}
                                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-black outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                               </div>
                               <div className="space-y-1.5">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Rate</label>
                                  <div className="relative">
                                    <input 
                                      type="number" 
                                      value={item.price}
                                      onChange={(e) => updateCartItem(idx, 'price', parseInt(e.target.value) || 0)}
                                      className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-black outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    />
                                  </div>
                               </div>
                               <div className="space-y-1.5">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 text-right block pr-1">Total</label>
                                  <div className="w-full h-[34px] flex items-center justify-end font-black text-slate-900 text-sm tracking-tight pr-1">
                                     ₹{calculateItemTotal(item).toFixed(0)}
                                  </div>
                               </div>
                            </div>
                         </motion.div>
                      ))
                   )}
                </AnimatePresence>
             </div>

             <div className="p-8 bg-white border-t border-slate-100 space-y-6 flex-shrink-0 shadow-[0_-25px_50px_rgba(0,0,0,0.05)] z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Client Selection</label>
                    <div className="relative group">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors">
                          <User size={14} />
                       </div>
                       <select 
                         value={selectedCustomer}
                         onChange={(e) => setSelectedCustomer(e.target.value)}
                         className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-[1.25rem] text-[10px] font-black outline-none appearance-none cursor-pointer hover:bg-slate-100 focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                       >
                         <option value="">Walk-in Customer</option>
                         {state.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2">Broker Mapping</label>
                    <div className="relative group">
                       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-primary transition-colors">
                          <Tag size={14} />
                       </div>
                       <select 
                         value={selectedBroker}
                         onChange={(e) => setSelectedBroker(e.target.value)}
                         className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-[1.25rem] text-[10px] font-black outline-none appearance-none cursor-pointer hover:bg-slate-100 focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                       >
                         <option value="">No Direct Broker</option>
                         {state.brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                       </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-950 p-7 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                   {/* Background Glow */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/30 transition-all" />
                   
                   <div className="space-y-2.5 relative z-10">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                         <span>Cart Valuation</span>
                         <span className="text-slate-300">₹{totalBeforeTaxAndDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-rose-500">
                         <span>Global Rebate (-)</span>
                         <span className="text-rose-400">₹{totalDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-sky-500">
                         <span>Consolidated GST (+)</span>
                         <span className="text-sky-400">₹{totalGst.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-px bg-white/5 my-2" />
                      <div className="flex justify-between items-end pt-1">
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1.5">Net Payable Amount</p>
                            <h3 className="text-4xl font-black text-white tracking-tighter">₹{grandTotal.toFixed(0)}<span className="text-xs text-white/30 ml-1">.00</span></h3>
                         </div>
                         <button 
                           onClick={handleCreateInvoice}
                           disabled={cart.length === 0}
                           className={cn(
                             "px-8 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-2xl transition-all flex items-center gap-3",
                             cart.length > 0 
                               ? "bg-primary text-white shadow-primary/40 hover:scale-[1.03] active:scale-95 group-hover:px-10" 
                               : "bg-white/5 text-white/10 cursor-not-allowed border border-white/5"
                           )}
                         >
                           <CreditCard size={14} className="group-hover:rotate-12 transition-transform" />
                           Finalise & Sync
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : activeTab === 'return' ? (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
                     <Trash2 size={24} />
                  </div>
                  <div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Sales Return Registry</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Returns Processed: {state.invoices.filter(i => i.status === 'returned' as any).length}</p>
                  </div>
               </div>
               <button 
                  onClick={() => setReturnModal(true)}
                  className="px-8 py-3 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 transition-all"
               >
                  Initiate New Return
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/30 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <th className="px-8 py-5">Return Date</th>
                        <th className="px-8 py-5">Original Inv #</th>
                        <th className="px-8 py-5">Client</th>
                        <th className="px-8 py-5">Credit Value</th>
                        <th className="px-8 py-5 text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {state.invoices.filter(i => i.status === 'returned' as any).map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-8 py-6 font-black text-xs text-slate-800">{format(new Date(inv.date), 'dd MMM yyyy')}</td>
                           <td className="px-8 py-6 font-black text-rose-600 text-xs">{inv.invoiceNo}</td>
                           <td className="px-8 py-6 font-bold text-slate-600 text-sm whitespace-nowrap">
                              {state.customers.find(c => c.id === inv.customerId)?.name || 'Counter Client'}
                           </td>
                           <td className="px-8 py-6 font-black text-slate-800">₹{inv.totalAmount}</td>
                           <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => setPreviewInvoice(inv)} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-primary shadow-sm hover:border-primary/20 transition-all">
                                   <Calculator size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                  className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm hover:border-red-100 transition-all"
                                >
                                   <Trash2 size={16} />
                                </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                     {state.invoices.filter(i => i.status === 'returned' as any).length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center gap-4 opacity-20">
                                 <Trash2 size={48} />
                                 <p className="text-[10px] font-black uppercase tracking-widest">No returns in records</p>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
        </div>
      ) : activeTab === 'rates' ? (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
           <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Tag size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Standard Rate Matrix</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Live Selling Prices & GST Buckets</p>
                 </div>
              </div>
              <button 
                 onClick={() => setPriceUpdateModal(true)}
                 className="px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              >
                 Enable Bulk Pricing Update
              </button>
           </div>
           <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                 <thead className="sticky top-0 z-10 bg-white shadow-sm shadow-slate-100">
                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <th className="px-8 py-5">Article Identity</th>
                       <th className="px-8 py-5">Brand</th>
                       <th className="px-8 py-5">Basic Selling</th>
                       <th className="px-8 py-5">GST %</th>
                       <th className="px-8 py-5">Final Price</th>
                       <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {state.products.map(p => (
                       <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-6 font-black text-slate-800 text-sm">{p.name}</td>
                          <td className="px-8 py-6 text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">{p.brand}</td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                                <span className="font-black text-slate-800">₹{p.sellingPrice}</span>
                                <span className="text-[10px] text-slate-300 line-through">MRP: {p.mrp}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100">{p.sellGst}%</span>
                          </td>
                          <td className="px-8 py-6 font-black text-primary">₹{(p.sellingPrice * (1 + p.sellGst/100)).toFixed(2)}</td>
                          <td className="px-8 py-6 text-right">
                             <button 
                                onClick={() => setEditingPriceProduct(p)}
                                className="px-4 py-1.5 bg-slate-50 hover:bg-primary hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-slate-100 hover:border-primary/20"
                             >
                                Adjust
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice value</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {state.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">No sales recorded in the system.</td>
                  </tr>
                ) : (
                  state.invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6 text-sm font-black text-slate-800">{inv.invoiceNo}</td>
                      <td className="px-8 py-6 text-xs text-slate-500 font-black uppercase">{format(new Date(inv.date), 'dd MMM yyyy, HH:mm')}</td>
                      <td className="px-8 py-6 text-sm text-slate-600 font-black">{
                        state.customers.find(c => c.id === inv.customerId)?.name || inv.customerId
                      }</td>
                      <td className="px-8 py-6 text-sm font-black text-primary">₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">{inv.status}</span>
                      </td>
                      <td className="px-8 py-6 flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenPreview(inv)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-all rounded-full hover:bg-primary/5"
                          title="Preview Bill"
                        >
                           <Calculator size={20} />
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-all rounded-full hover:bg-primary/5">
                           <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selection Modal for Products with Multiple Variants */}
      {selectionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
           >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Select Article Variant</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{selectionModal.name} - {selectionModal.brand}</p>
                 </div>
                 <button onClick={() => setSelectionModal(null)}><X size={24} className="text-slate-300 hover:text-red-500" /></button>
              </div>
              
              <div className="p-10 space-y-4 max-h-[60vh] overflow-y-auto">
                 {selectionModal.variants.map((v) => (
                    <button 
                      key={v.id}
                      disabled={v.qty <= 0}
                      onClick={() => addToCart(selectionModal, v)}
                      className={cn(
                        "w-full flex items-center justify-between p-5 rounded-[2rem] border transition-all text-left",
                        v.qty <= 0 ? "opacity-40 grayscale pointer-events-none" : "hover:border-primary hover:bg-primary/5 border-slate-100"
                      )}
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-4 h-4 rounded-full border border-white shadow-xl" style={{ backgroundColor: v.colorCode }} />
                          <div>
                             <p className="font-black text-slate-800 uppercase text-xs">Size {v.size} - {v.color}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available Stock: {v.qty}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-primary">₹{selectionModal.sellingPrice}</p>
                       </div>
                    </button>
                 ))}
              </div>
           </motion.div>
        </div>
      )}
      {/* Return Selection Modal */}
      {returnModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]"
           >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Select Invoice for Return</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Browse paid invoices to initiate credit reversal</p>
                 </div>
                 <button onClick={() => setReturnModal(false)}><X size={24} className="text-slate-300 hover:text-red-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/30">
                 {state.invoices.filter(i => i.status !== 'returned' as any).map(inv => (
                    <button 
                       key={inv.id}
                       onClick={() => handleProcessReturn(inv)}
                       className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-rose-500/30 hover:bg-rose-50/10 transition-all text-left flex justify-between items-center group"
                    >
                       <div>
                          <div className="flex items-center gap-3">
                             <span className="font-black text-slate-800 text-sm">{inv.invoiceNo}</span>
                             <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase">PAID</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                             {state.customers.find(c => c.id === inv.customerId)?.name || 'Counter Client'} • {format(new Date(inv.date), 'dd MMM')}
                          </p>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-slate-800 text-sm">₹{inv.totalAmount}</p>
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest group-hover:underline">Reverse Entry →</span>
                       </div>
                    </button>
                 ))}
              </div>
           </motion.div>
        </div>
      )}

      {/* Single Price Adjustment Modal */}
      {editingPriceProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10"
           >
              <div className="flex justify-between items-start mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black">
                       {editingPriceProduct.name[0]}
                    </div>
                    <div>
                       <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Rate Adjustment</h4>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{editingPriceProduct.name}</p>
                    </div>
                 </div>
                 <button onClick={() => setEditingPriceProduct(null)}><X size={24} className="text-slate-300" /></button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">New Selling Price (Basic)</label>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">₹</span>
                       <input 
                          type="number"
                          defaultValue={editingPriceProduct.sellingPrice}
                          id="new-price-input"
                          className="w-full pl-10 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-lg outline-none focus:ring-4 focus:ring-primary/5"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">GST Percentage</label>
                    <select 
                       id="new-gst-input"
                       defaultValue={editingPriceProduct.sellGst}
                       className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black outline-none appearance-none"
                    >
                       <option value="0">0% (Nil)</option>
                       <option value="5">5% (Footwear/Basic)</option>
                       <option value="12">12% (Apparel/Premium)</option>
                       <option value="18">18% (Luxury)</option>
                       <option value="28">28% (Special)</option>
                    </select>
                 </div>

                 <div className="pt-4">
                    <button 
                       onClick={() => {
                          const price = parseFloat((document.getElementById('new-price-input') as HTMLInputElement).value);
                          const gst = parseFloat((document.getElementById('new-gst-input') as HTMLSelectElement).value);
                          handleUpdatePrice(editingPriceProduct.id, price, gst);
                       }}
                       className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                       Confirm Price Update
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* Bulk Price Update Modal */}
      {priceUpdateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[80vh]"
           >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                 <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Bulk Rate Management</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Update selling prices across all master articles</p>
                 </div>
                 <button onClick={() => setPriceUpdateModal(false)}><X size={24} className="text-slate-300 hover:text-red-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                          <th className="pb-4">Article</th>
                          <th className="pb-4">Current Rate</th>
                          <th className="pb-4">New Rate</th>
                          <th className="pb-4">GST %</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {state.products.map(p => (
                          <tr key={p.id}>
                             <td className="py-4 font-black text-slate-800 text-xs">{p.name}</td>
                             <td className="py-4 text-xs font-bold text-slate-400">₹{p.sellingPrice}</td>
                             <td className="py-4">
                                <input 
                                   type="number" 
                                   defaultValue={p.sellingPrice}
                                   className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black"
                                   id={`bulk-price-${p.id}`}
                                />
                             </td>
                             <td className="py-4">
                                <select 
                                   defaultValue={p.sellGst}
                                   className="px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black"
                                   id={`bulk-gst-${p.id}`}
                                >
                                   <option value="5">5%</option>
                                   <option value="12">12%</option>
                                   <option value="18">18%</option>
                                </select>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-8 border-t border-slate-100">
                 <button 
                    onClick={() => {
                       state.products.forEach(p => {
                          const priceVal = (document.getElementById(`bulk-price-${p.id}`) as HTMLInputElement).value;
                          const gstVal = (document.getElementById(`bulk-gst-${p.id}`) as HTMLSelectElement).value;
                          handleUpdatePrice(p.id, parseFloat(priceVal), parseFloat(gstVal));
                       });
                       setPriceUpdateModal(false);
                    }}
                    className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px]"
                 >
                    Apply All Changes
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* Bill Preview Modal */}
      <AnimatePresence>
        {previewInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl">
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
             >
                <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                   <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Tax Invoice Preview</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ref: {previewInvoice.invoiceNo}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => shareOnWhatsApp(previewInvoice!)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all hover:scale-105"
                      >
                        <Share2 size={14} /> WhatsApp
                      </button>
                      <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                      >
                        <Printer size={14} /> Print PDF
                      </button>
                      <button onClick={() => setPreviewInvoice(null)} className="w-12 h-12 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 transition-colors">
                        <X size={24} />
                      </button>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-12 bg-slate-200/50">
                   <div className="bg-white border-[1px] border-black p-4 font-serif text-[10px] leading-tight relative max-w-[800px] mx-auto shadow-xl">
                      {/* Indian Style Invoice Header */}
                    <div className="text-center mb-0 relative pb-2">
                         <div className="absolute left-0 top-0 text-left">
                            <div className="font-serif italic font-black text-lg leading-none">Ankita <span className="block text-[8px] tracking-widest not-italic">Traders</span></div>
                            <div className="border border-black px-1 mt-1 font-black text-[9px] inline-block">TAX-INVOICE</div>
                         </div>

                         <div className="text-[10px] font-black text-rose-600 mb-1">|| श्री गणेशाय नमः ||</div>
                         <h1 className="text-4xl font-black uppercase tracking-tight mb-0">ANKITA TRADERS</h1>
                         <p className="font-bold text-[9px]">145, Gauri Market, Dupatta Gali, Roshan Bagh, PRAYAGRAJ-211003</p>
                         
                         <div className="grid grid-cols-3 border-y border-black mt-2 text-[8px] font-bold py-0.5">
                            <div className="text-left px-1 border-r border-black">GST NO. <span className="font-black text-[9px]">09CQFPR3593C1ZK</span></div>
                            <div className="text-center px-1 border-r border-black uppercase">Contact No : 7007062794, 7007508004</div>
                            <div className="text-right px-1">PAN NO. <span className="font-black">CQFPR3593C</span></div>
                         </div>
                         <div className="grid grid-cols-4 border-b border-black text-[8px] font-bold py-0.5">
                            <div className="text-left px-1 border-r border-black">BILL NO : <span className="text-[9px] font-black">{previewInvoice.invoiceNo.split('/').pop()}</span></div>
                            <div className="text-center px-1 border-r border-black uppercase text-[7px]">Udyam-UP-03-0063208 [Micro]</div>
                            <div className="text-center px-1 border-r border-black">BILL DATE : {format(new Date(previewInvoice.date), 'dd/MMM/yyyy').toUpperCase()}</div>
                            <div className="text-right px-1 font-black text-blue-800">CREDIT MEMO</div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 border-b border-black">
                         <div className="border-r border-black p-1 space-y-0.5">
                            <div className="flex gap-2">
                               <span className="font-black w-20">PARTY NAME :</span>
                               <span className="font-black text-blue-800 uppercase">{state.customers.find(c => c.id === previewInvoice.customerId)?.name || 'AMAN COLLECTION'}</span>
                            </div>
                            <div className="flex gap-2 items-start">
                               <span className="font-black w-20">ADDRESS :</span>
                               <span className="flex-1 uppercase">152/122A, BHUSOLI TOLA KHUSHROBAGH, KHULDABAD, PRAYAGRAJ</span>
                            </div>
                            <div className="flex gap-2">
                               <span className="font-black w-20">CITY :</span>
                               <span className="uppercase text-blue-800 font-bold">PRAYAGRAJ</span>
                            </div>
                            <div className="flex gap-2">
                               <span className="font-black w-20">STATE CODE :</span>
                               <span className="font-bold">09</span>
                            </div>
                         </div>
                         <div className="p-1 space-y-0.5">
                            <div className="flex gap-2">
                               <span className="font-black w-20">GSTIN NO. :</span>
                               <span className="font-black text-blue-800 uppercase">09AVOPR1645M1ZT</span>
                            </div>
                            <div className="flex gap-2">
                               <span className="font-black w-20">AADHAR NO. :</span>
                               <span></span>
                            </div>
                            <div className="flex justify-between">
                               <div className="flex gap-2">
                                  <span className="font-black w-20">STATE NAME :</span>
                                  <span className="uppercase font-bold">UTTAR PRADESH</span>
                               </div>
                            </div>
                            <div className="flex justify-between">
                               <div className="flex gap-2">
                                  <span className="font-black w-20">MOBILE NO. :</span>
                                  <span className="font-black">8009148468</span>
                               </div>
                               <div className="flex gap-2 text-right">
                                  <span className="font-black">PAN NO. :</span>
                                  <span className="font-black">AVOPR1645M</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <table className="w-full border-collapse">
                         <thead>
                            <tr className="border-b border-black text-[7px] font-black bg-blue-900 text-white">
                               <th className="border-r border-black py-1 px-0.5 w-6">SR.</th>
                               <th className="border-r border-black py-1 px-1 text-left">ITEM NAME</th>
                               <th className="border-r border-black py-1 px-1">BRAND NAME</th>
                               <th className="border-r border-black py-1 px-1">CATEGORY</th>
                               <th className="border-r border-black py-1 px-1">HSN CODE</th>
                               <th className="border-r border-black py-1 px-1">UNIT</th>
                               <th className="border-r border-black py-1 px-1">PCS.</th>
                               <th className="border-r border-black py-1 px-1">MTR.</th>
                               <th className="border-r border-black py-1 px-1">NET RATE</th>
                               <th className="border-r border-black py-1 px-1">NET AMT.</th>
                               <th className="border-r border-black py-1 px-1">TAX %</th>
                               <th className="border-r border-black py-1 px-1">TAXABLE VAL.</th>
                               <th className="py-1 px-1">TAXABLE AMT.</th>
                            </tr>
                         </thead>
                         <tbody className="min-h-[200px]">
                            {previewInvoice.items.map((item, i) => {
                               const p = state.products.find(prod => prod.id === item.productId);
                               const netAmt = item.price * item.qty;
                               const gstRate = p?.sellGst || 5;
                               const taxableVal = netAmt / (1 + gstRate / 100);
                               const taxAmt = netAmt - taxableVal;
                               return (
                                  <tr key={i} className="text-[8px] font-bold border-b border-black/10">
                                     <td className="border-r border-black py-1 text-center">{i + 1}</td>
                                     <td className="border-r border-black py-1 px-1 uppercase">{p?.name || 'COTTON PRINT'}</td>
                                     <td className="border-r border-black py-1 px-1 text-center uppercase tracking-tighter">{p?.brand || 'NIHARIKA'}</td>
                                     <td className="border-r border-black py-1 px-1 text-center uppercase tracking-tighter">{p?.category || 'COTTON SUIT'}</td>
                                     <td className="border-r border-black py-1 px-1 text-center font-black">610419</td>
                                     <td className="border-r border-black py-1 px-1 text-center">Pcs</td>
                                     <td className="border-r border-black py-1 px-1 text-center font-black">{item.qty}</td>
                                     <td className="border-r border-black py-1 px-1 text-center">-</td>
                                     <td className="border-r border-black py-1 px-1 text-right">{item.price.toFixed(2)}</td>
                                     <td className="border-r border-black py-1 px-1 text-right font-black">{netAmt.toFixed(2)}</td>
                                     <td className="border-r border-black py-1 px-1 text-center">{gstRate}</td>
                                     <td className="border-r border-black py-1 px-1 text-right">{taxableVal.toFixed(2)}</td>
                                     <td className="py-1 px-1 text-right font-black">{netAmt.toFixed(2)}</td>
                                  </tr>
                               );
                            })}
                            {/* Empty rows to maintain height */}
                            {Array.from({ length: 6 - previewInvoice.items.length }).map((_, i) => (
                               <tr key={i} className="h-6">
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td className="border-r border-black"></td>
                                  <td></td>
                               </tr>
                            ))}
                         </tbody>
                         <tfoot className="border-t border-black">
                            <tr className="font-black text-[9px] border-b border-black">
                               <td colSpan={6} className="border-r border-black px-2 py-1 italic">Total :-</td>
                               <td className="border-r border-black text-center">{previewInvoice.items.reduce((a, b) => a + b.qty, 0)}</td>
                               <td className="border-r border-black text-center">-</td>
                               <td className="border-r border-black"></td>
                               <td className="border-r border-black text-right">{getSubtotal(previewInvoice).toFixed(2)}</td>
                               <td className="border-r border-black"></td>
                               <td className="border-r border-black"></td>
                               <td className="text-right">{getSubtotal(previewInvoice).toFixed(2)}</td>
                            </tr>
                         </tfoot>
                      </table>

                      <div className="grid grid-cols-6 border-b border-black text-[7px] font-black">
                         <div className="col-span-4 border-r border-black divide-y divide-black">
                            <div className="grid grid-cols-4 divide-x divide-black">
                               <div className="px-1 py-0.5">CGST</div>
                               <div className="px-1 py-0.5 text-blue-800">{(getTax(previewInvoice)/2).toFixed(2)}</div>
                               <div className="px-1 py-0.5">SGST</div>
                               <div className="px-1 py-0.5 text-blue-800">{(getTax(previewInvoice)/2).toFixed(2)}</div>
                            </div>
                            <div className="grid grid-cols-4 divide-x divide-black">
                               <div className="px-1 py-0.5">IGST</div>
                               <div className="px-1 py-0.5 text-blue-800">-</div>
                               <div className="px-1 py-0.5">Discount</div>
                               <div className="px-1 py-0.5 text-blue-800">0.00</div>
                            </div>
                            <div className="p-1 min-h-[40px]">
                               <p className="underline mb-1">Terms & Conditions :-</p>
                               <ol className="list-decimal pl-3 space-y-0 text-[6px]">
                                  <li>All Subject To PRAYAGRAJ Jurisdiction Only.</li>
                                  <li>If The Bill Is Not Paid Within 90 Days Interest @24% Will Be Charged From The Date Of Bill.</li>
                                  <li>Any Complaint For The Goods Should Be Made Within 2 Days.</li>
                                  <li>We Are Not Responsible For Any Loss Or Damage During Transit.</li>
                                  <li>Personally Selected Goods Will Not Be Taken Back Or Exchanged.</li>
                               </ol>
                            </div>
                         </div>
                         <div className="col-span-2 divide-y divide-black font-black">
                            <div className="flex justify-between px-2 py-1 text-slate-500">
                               <span>Taxable Value</span>
                               <span>{(getSubtotal(previewInvoice) - getTax(previewInvoice)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between px-2 py-1 text-slate-500">
                               <span>Total GST</span>
                               <span>{getTax(previewInvoice).toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between px-2 py-1 text-slate-500">
                               <span>Addition AMT.</span>
                               <span></span>
                            </div>
                            <div className="flex justify-between px-2 py-1 text-slate-500">
                               <span>Round Off</span>
                               <span>-0.00</span>
                            </div>
                            <div className="bg-blue-900 text-white flex justify-between px-2 py-2 text-[11px]">
                               <span>BILL AMOUNT</span>
                               <span>{previewInvoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                         </div>
                      </div>

                      <div className="border-b border-black p-1 text-[8px]">
                         <span className="font-black uppercase tracking-tight">Rs. In Words : </span>
                         <span className="font-bold text-blue-800 uppercase tracking-tighter">RUPEES SIX THOUSAND ONE HUNDRED SIXTY RUPEES ONLY</span>
                      </div>

                      <div className="grid grid-cols-2 border-b border-black">
                         <div className="p-1 space-y-1">
                            <div className="flex flex-wrap gap-x-4 border border-black px-2 py-0.5 w-fit rounded text-blue-800 font-bold">
                               <div className="flex gap-2">
                                  <span>Bank A/C :-</span>
                                  <span className="font-black">YES BANK A/C NO = 011663400000759</span>
                               </div>
                               <div className="flex gap-2">
                                  <span className="font-black">IFSC CODE = YESB0001119</span>
                               </div>
                            </div>
                            <div>
                               <span className="font-black">Remark:-</span>
                            </div>
                         </div>
                         <div className="p-1 text-right flex flex-col justify-between">
                            <div className="flex justify-between">
                               <span className="font-black text-rose-600">FOR</span>
                               <span className="font-black text-blue-900">ANKITA TRADERS</span>
                            </div>
                            <div className="text-blue-800 italic font-bold">Nityanand Kumar Rai</div>
                            <div className="font-black text-[7px] uppercase">Authorised Signatory</div>
                         </div>
                      </div>

                      <div className="grid grid-cols-3 text-[7px] p-1 font-bold">
                         <div>Prepared By SA</div>
                         <div className="text-center">@AC2 (String)</div>
                         <div className="text-right">Page 1 of 1</div>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                         <div className="text-[120px] font-black -rotate-45">ORIGINAL</div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
