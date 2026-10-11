import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { Plus, Search, ShoppingCart, User, CreditCard, ChevronRight, Calculator, Trash2, X, Tag, Share2, Printer, CheckCircle2, Truck as TruckIcon } from 'lucide-react';
import { AppState, Product, Invoice, ProductVariant } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import ReportHeader from '../components/ReportHeader';

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
  setView: (v: any) => void;
  currentView?: string;
}

export default function Sales({ state, setState, setView, currentView }: SalesProps) {
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
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [customerFilter, setCustomerFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [selectionModal, setSelectionModal] = useState<Product | null>(null);
  const [returnModal, setReturnModal] = useState<boolean>(false);
  const [priceUpdateModal, setPriceUpdateModal] = useState<boolean>(false);
  const [editingPriceProduct, setEditingPriceProduct] = useState<Product | null>(null);

  // GST Sale Form State
  const [gstSaleForm, setGstSaleForm] = useState({
    type: 'Tax Invoice',
    status: 'FINAL',
    billNo: (state.invoices.length + 1).toString().padStart(2, '0'),
    date: format(new Date(), 'yyyy-MM-dd'),
    year: '2026',
    speaker: '',
    payMode: '(C)ash/(D)ebit R CASH',
    customerName: '',
    customerAddress: '',
    customerCity: '',
    customerGstNo: '',
    customerAadhar: '',
    customerPan: '',
    customerPinCode: '',
    customerMobile: '',
    customerState: '09-UTTAR PRADESH',
    ewayBillNo: '',
    taxMode: 'Exclusive' as 'Inclusive' | 'Exclusive',
    gstForm: 'GST SALE (IN-STATE)',
    salesMan: '',
    transport: '',
    broker: '',
    billFor: '',
    mBillNo: '',
  });

  const [saleItems, setSaleItems] = useState<any[]>([]);

  const calculateGstSaleTotals = () => {
    const totalPcs = saleItems.reduce((acc, item) => acc + (parseFloat(item.pcs) || 0), 0);
    const totalMtr = saleItems.reduce((acc, item) => acc + (parseFloat(item.mtr) || 0), 0);
    const grossValue = saleItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    const itemDisc = saleItems.reduce((acc, item) => acc + (parseFloat(item.discAmt) || 0), 0);
    
    const taxableAmt = grossValue - itemDisc;
    // Assuming 5% GST (2.5% CGST + 2.5% SGST) as in image
    const cgst = taxableAmt * 0.025;
    const sgst = taxableAmt * 0.025;
    const igst = 0;
    const totalGst = cgst + sgst + igst;
    const netAmount = taxableAmt + totalGst;
    const roundOff = Math.round(netAmount) - netAmount;

    return {
      totalPcs,
      totalMtr,
      grossValue,
      itemDisc,
      taxableAmt,
      cgst,
      sgst,
      igst,
      totalGst,
      roundOff,
      netAmount: Math.round(netAmount)
    };
  };

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
    const newItem = {
      productId: product.id,
      variantId: variant.id,
      category: product.category,
      brand: product.brand,
      productName: product.name,
      hsnCode: product.hsnCode || '-',
      pcs: '1',
      mtr: '0.00',
      rate: product.sellingPrice.toString(),
      amount: product.sellingPrice.toString(),
      discPerc: '0',
      discAmt: '0',
      uom: 'Pcs',
      netAmount: product.sellingPrice.toString()
    };
    setSaleItems([...saleItems, newItem]);
    setSelectionModal(null);
  };

  const updateSaleItem = (idx: number, updates: any) => {
    setSaleItems(prev => {
      const items = [...prev];
      const item = { ...items[idx], ...updates };
      
      const pcs = parseFloat(item.pcs) || 0;
      const mtr = parseFloat(item.mtr) || 0;
      const rate = parseFloat(item.rate) || 0;
      const discPerc = parseFloat(item.discPerc) || 0;
      
      const grossAmount = (pcs || mtr) * rate;
      const discAmt = grossAmount * (discPerc / 100);
      const amount = grossAmount - discAmt;
      
      items[idx] = {
        ...item,
        amount: amount.toFixed(2),
        discAmt: discAmt.toFixed(2),
        netAmount: amount.toFixed(2)
      };
      return items;
    });
  };

  const removeSaleItem = (idx: number) => {
    setSaleItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Autopopulate Customer Info
  useEffect(() => {
    if (selectedCustomer) {
      const customer = state.customers.find(c => c.id === selectedCustomer);
      if (customer) {
        setGstSaleForm(prev => ({
          ...prev,
          customerName: customer.name,
          customerGstNo: customer.gstin,
          customerMobile: customer.phone,
          customerCity: state.areas.find(a => a.id === customer.areaId)?.city || '',
        }));
      }
    }
  }, [selectedCustomer, state.customers, state.areas]);

  const updateCartItem = (idx: number, field: keyof CartItem, value: any) => {
    const newCart = [...cart];
    (newCart[idx] as any)[field] = value;
    setCart(newCart);
  };

  const totals = calculateGstSaleTotals();
  const totalNet = totals.netAmount;
  const totalPcs = totals.totalPcs;
  const totalMtr = totals.totalMtr;
  const totalGross = totals.grossValue;
  const totalDiscAmt = totals.itemDisc;

  const handleCreateInvoice = () => {
    if (saleItems.length === 0) {
      alert('Please add at least one item to the bill.');
      return;
    }

    const nextBillNo = (state.invoices.length + 1).toString().padStart(2, '0');
    const invoiceId = Math.random().toString(36).substr(2, 9);
    const invoiceNo = `INV-${gstSaleForm.billNo || nextBillNo}`;
    
    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNo: invoiceNo,
      date: new Date(gstSaleForm.date).toISOString(),
      customerId: selectedCustomer || 'Walk-in Customer',
      brokerId: selectedBroker,
      type: gstSaleForm.type,
      billYear: gstSaleForm.year,
      speaker: gstSaleForm.speaker,
      payMode: gstSaleForm.payMode,
      customerName: gstSaleForm.customerName,
      customerAddress: gstSaleForm.customerAddress,
      customerCity: gstSaleForm.customerCity,
      customerState: gstSaleForm.customerState,
      customerPinCode: gstSaleForm.customerPinCode,
      customerGstNo: gstSaleForm.customerGstNo,
      customerAadhar: gstSaleForm.customerAadhar,
      customerPan: gstSaleForm.customerPan,
      customerMobile: gstSaleForm.customerMobile,
      ewayBillNo: gstSaleForm.ewayBillNo,
      taxMode: gstSaleForm.taxMode,
      status: 'paid',
      statusLabel: 'Paid',
      items: saleItems.map(item => ({
        productId: item.productId,
        category: item.category,
        brand: item.brand,
        productName: item.productName,
        hsnCode: item.hsnCode,
        uom: item.uom,
        pcs: parseFloat(item.pcs) || 0,
        mtr: parseFloat(item.mtr) || 0,
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0,
        discPerc: parseFloat(item.discPerc) || 0,
        discAmt: parseFloat(item.discAmt) || 0,
        netAmount: parseFloat(item.netAmount) || 0,
        variantId: item.variantId
      })),
      totalAmount: totalNet,
      summary: {
        totalPcs: totalPcs,
        totalMtr: totalMtr,
        grossValue: totalGross,
        itemDisc: totalDiscAmt,
        brandDisc: 0,
        taxableAmt: totalNet,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalGst: 0,
        roundOff: 0,
        netAmount: totalNet
      },
      transport: gstSaleForm.transport,
      broker: gstSaleForm.broker
    };

    setState(prev => ({
      ...prev,
      invoices: [...prev.invoices, newInvoice],
      // Deduct inventory
      products: prev.products.map(p => {
        const lineItem = saleItems.filter(si => si.productId === p.id);
        if (lineItem.length > 0) {
          return {
            ...p,
            variants: p.variants.map(v => {
              const variantMatch = lineItem.find(li => li.variantId === v.id);
              if (variantMatch) {
                return { ...v, qty: v.qty - (parseFloat(variantMatch.pcs) || 0) };
              }
              return v;
            })
          };
        }
        return p;
      }),
      // Add ledger entry
      ledgerEntries: [
        ...prev.ledgerEntries,
        {
          id: `sale-${newInvoice.invoiceNo}`,
          date: newInvoice.date,
          description: `Sale to ${newInvoice.customerName} (${newInvoice.invoiceNo})`,
          amount: newInvoice.totalAmount,
          type: 'credit',
          category: 'Sales'
        }
      ]
    }));

    alert(`Invoice ${invoiceNo} Saved Successfully!\nInventory & Ledger Synchronized.`);
    setSaleItems([]);
    setGstSaleForm(prev => ({
      ...prev, 
      billNo: (state.invoices.length + 2).toString().padStart(2, '0')
    }));
    setView('sales:invoices');
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
              const returnedItem = itemsToReturn.find(item => item.variantId === v.id);
              return returnedItem ? { ...v, qty: v.qty + returnedItem.pcs } : v;
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

  const filteredInvoices = state.invoices.filter(inv => {
    const customer = state.customers.find(c => c.id === inv.customerId);
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCustomer = customerFilter === 'all' || inv.customerId === customerFilter;
    const matchesDate = (!dateFilter.start || inv.date >= dateFilter.start) && 
                      (!dateFilter.end || inv.date <= dateFilter.end);
    
    return matchesSearch && matchesCustomer && matchesDate;
  });

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentView !== 'sales:billing') return;
      
      if (e.key === 'F2') {
        e.preventDefault();
        setSaleItems([]);
        const nextNo = (state.invoices.length + 1).toString().padStart(2, '0');
        setGstSaleForm(prev => ({...prev, billNo: nextNo}));
        alert('Form reset for New Bill. Bill No: ' + nextNo);
      }
      if (e.key === 'F10') {
        e.preventDefault();
        setView('dashboard');
      }
      if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        handleCreateInvoice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, state.invoices.length]);

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice? This will reverse inventory and ledger entries.')) {
      const invToDel = state.invoices.find(v => v.id === id);
      setState(prev => {
        let nextProducts = prev.products;
        if (invToDel) {
          nextProducts = prev.products.map(p => {
            const itemMatches = invToDel.items.filter(ii => ii.productId === p.id);
            if (itemMatches.length > 0) {
              return {
                ...p,
                variants: p.variants.map(v => {
                  const match = itemMatches.find(im => im.variantId === v.id);
                  return match ? { ...v, qty: v.qty + match.pcs } : v;
                })
              };
            }
            return p;
          });
        }
        return {
          ...prev,
          invoices: prev.invoices.filter(inv => inv.id !== id),
          products: nextProducts,
          ledgerEntries: prev.ledgerEntries.filter(le => le.id !== `sale-${invToDel?.invoiceNo}`)
        };
      });
      alert('Invoice deleted and stock reversed successfully.');
    }
  };

  const handleModifyInvoice = (inv: Invoice) => {
    setGstSaleForm({
      billNo: inv.invoiceNo.split('-').pop() || '',
      date: inv.date.split('T')[0],
      customerName: inv.customerName || '',
      customerId: inv.customerId,
      customerMobile: inv.customerMobile || '',
      customerAddress: inv.customerAddress || '',
      customerCity: inv.customerCity || '',
      customerGstNo: inv.customerGstNo || '',
      customerPan: inv.customerPan || '',
      transport: inv.transport || '',
      broker: inv.broker || '',
      type: inv.type,
      status: 'active',
      year: inv.billYear || '2026-27',
      speaker: inv.speaker || 'No',
      payMode: inv.payMode || 'Credit',
      customerState: inv.customerState || '',
      customerPinCode: inv.customerPinCode || '',
      customerAadhar: inv.customerAadhar || '',
      ewayBillNo: inv.ewayBillNo || '',
      taxMode: inv.taxMode || 'GST'
    });
    setSaleItems(inv.items.map(item => ({
      ...item,
      pcs: item.pcs.toString(),
      mtr: item.mtr.toString(),
      rate: item.rate.toString(),
      amount: item.amount.toString(),
      discPerc: item.discPerc.toString(),
      discAmt: item.discAmt.toString(),
      netAmount: item.netAmount.toString()
    })));
    setSelectedCustomer(inv.customerId);
    setView('sales:billing');
  };

  const shareOnWhatsApp = (inv: Invoice) => {
    const customer = state.customers.find(c => c.id === inv.customerId);
    const phone = customer?.phone || '';
    const message = `Hello ${customer?.name || 'Customer'},\n\nYour invoice *${inv.invoiceNo}* from *Ankit Enterprises* is ready.\nTotal Amount: *₹${inv.totalAmount}*\n\nThank you for shopping with us!`;
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getSubtotal = (inv: Invoice) => {
    if (inv.summary) return inv.summary.grossValue;
    return inv.items.reduce((acc, item) => {
      const price = (item as any).price || item.rate;
      const qty = (item as any).qty || item.pcs;
      const discount = (item as any).discount || item.discPerc;
      const discounted = price * (1 - discount / 100);
      return acc + (discounted * qty);
    }, 0);
  };

  const getTax = (inv: Invoice) => {
    if (inv.summary) return inv.summary.totalGst;
    return inv.items.reduce((acc, item) => {
      const product = state.products.find(p => p.id === item.productId);
      const gst = product?.sellGst || 12;
      const price = (item as any).price || item.rate;
      const qty = (item as any).qty || item.pcs;
      const discount = (item as any).discount || item.discPerc;
      const discounted = price * (1 - discount / 100);
      return acc + (discounted * qty * (gst / 100));
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
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900 overflow-hidden">
          {/* GST SALE Header */}
          <div className="bg-sky-700 text-white px-4 py-1.5 flex items-center justify-between text-[11px] font-black uppercase tracking-widest border-b border-sky-800">
             <div className="flex items-center gap-4">
                <span className="bg-white text-sky-700 px-2 py-0.5 rounded">GST SALE</span>
                <span>{`{Bill Information}`}</span>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                   <CheckCircle2 size={12} className="text-emerald-400" />
                   <span>PRV.BILL NO - 94</span>
                </div>
                <div className="px-2 py-0.5 bg-blue-900 rounded">AMT - 4700 (CASH)</div>
             </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row min-h-0 p-1 gap-1">
             {/* Left Main Section */}
             <div className="flex-1 flex flex-col gap-1 min-h-0">
                {/* Header Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1 text-[9px] font-bold">
                   {/* Bill Details */}
                   <div className="md:col-span-3 bg-slate-100 p-2 space-y-1 rounded">
                      <div className="grid grid-cols-2 gap-1 items-center">
                         <div className="text-slate-500">TYPE</div>
                         <select 
                           className="bg-white border border-slate-300 text-[8px] font-black uppercase outline-none px-1"
                           value={gstSaleForm.type}
                           onChange={e => setGstSaleForm({...gstSaleForm, type: e.target.value})}
                         >
                            <option>Tax Invoice</option>
                            <option>Retail Invoice</option>
                            <option>Proforma</option>
                         </select>
                      </div>
                      <div className="grid grid-cols-2 gap-1 items-center">
                         <div className="text-slate-500">STATUS</div>
                         <div className="text-emerald-600 font-black">{gstSaleForm.status}</div>
                         <div className="text-slate-500">YEAR</div>
                         <div className="text-slate-900 italic">FY 2026-27</div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-1">
                         <div className="text-rose-600 font-black flex flex-col">
                            BILL NO
                            <span className="text-emerald-600 text-xs">{gstSaleForm.billNo}</span>
                         </div>
                         <div className="text-emerald-600 font-black flex flex-col">
                            DATE
                            <input 
                              type="date" 
                              className="bg-white border border-slate-300 text-[8px] font-black outline-none px-1 h-5"
                              value={gstSaleForm.date}
                              onChange={e => setGstSaleForm({...gstSaleForm, date: e.target.value})}
                            />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 items-center">
                         <div className="text-slate-500 uppercase">Speaker</div>
                         <input className="bg-white border border-slate-300 text-[8px] uppercase outline-none px-1" value={gstSaleForm.speaker} onChange={e => setGstSaleForm({...gstSaleForm, speaker: e.target.value})} placeholder="..." />
                      </div>
                      <div className="mt-1 pt-1 border-t border-slate-200">
                         <div className="text-rose-600 font-black uppercase leading-tight text-[7px] mb-1">PAY MODE</div>
                         <select 
                           className="w-full bg-white border border-slate-300 text-[8px] font-black uppercase outline-none px-1 mb-1"
                           value={gstSaleForm.payMode}
                           onChange={e => setGstSaleForm({...gstSaleForm, payMode: e.target.value})}
                         >
                            <option>(C)ash/(D)ebit R CASH</option>
                            <option>(B)ank / Online</option>
                            <option>(U)PI Payment</option>
                            <option>(H)awala / Adjustment</option>
                         </select>
                         <div className="text-blue-600 font-black text-[7px] uppercase leading-none">{format(new Date(), 'dd-MM-yyyy HH:mm')} SYSTEM_ACTIVE</div>
                      </div>
                   </div>

                   {/* Customer Details Content */}
                   <div className="md:col-span-9 bg-slate-50 p-2 rounded flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-900 font-black uppercase text-[10px]">CUSTOMER</span>
                        <div className="flex-1 relative group">
                           <input 
                             type="text"
                             className="w-full bg-white border border-slate-300 px-2 py-1 text-rose-600 font-black uppercase text-xs focus:ring-1 focus:ring-primary outline-none"
                             value={gstSaleForm.customerName}
                             onChange={(e) => setGstSaleForm({...gstSaleForm, customerName: e.target.value})}
                             placeholder="Search Customer..."
                           />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                         <div className="flex flex-col gap-0.5">
                            <span className="text-blue-600 uppercase">ADDRESS</span>
                            <input className="bg-white border border-slate-200 p-0.5 text-[8px] uppercase" value={gstSaleForm.customerAddress} onChange={e => setGstSaleForm({...gstSaleForm, customerAddress: e.target.value})} />
                         </div>
                         <div className="flex flex-col gap-0.5">
                             <span className="text-blue-600 uppercase">CITY</span>
                             <input className="bg-white border border-slate-200 p-0.5 text-[8px] uppercase" value={gstSaleForm.customerCity} onChange={e => setGstSaleForm({...gstSaleForm, customerCity: e.target.value})} />
                         </div>
                         <div className="flex flex-col gap-0.5">
                             <span className="text-blue-600 uppercase">STATE</span>
                             <span className="text-slate-900 font-black uppercase">{gstSaleForm.customerState}</span>
                         </div>
                         <div className="flex flex-col gap-0.5">
                             <span className="text-blue-600 uppercase">PIN CODE</span>
                             <input className="bg-white border border-slate-200 p-0.5 text-[8px] uppercase" value={gstSaleForm.customerPinCode} onChange={e => setGstSaleForm({...gstSaleForm, customerPinCode: e.target.value})} />
                         </div>
                         <div className="flex flex-col gap-0.5">
                             <span className="text-blue-600 uppercase">GST NO</span>
                             <input className="bg-white border border-slate-200 p-0.5 text-[8px] uppercase font-black text-rose-500" value={gstSaleForm.customerGstNo} onChange={e => setGstSaleForm({...gstSaleForm, customerGstNo: e.target.value})} />
                         </div>
                         <div className="flex flex-col gap-0.5">
                             <span className="text-blue-600 uppercase">AADHAR</span>
                             <input className="bg-white border border-slate-200 p-0.5 text-[8px] uppercase" value={gstSaleForm.customerAadhar} onChange={e => setGstSaleForm({...gstSaleForm, customerAadhar: e.target.value})} />
                         </div>
                         <div className="flex flex-col gap-0.5">
                             <span className="text-blue-600 uppercase">PAN</span>
                             <input className="bg-white border border-slate-200 p-0.5 text-[8px] uppercase" value={gstSaleForm.customerPan} onChange={e => setGstSaleForm({...gstSaleForm, customerPan: e.target.value})} />
                         </div>
                         <div className="flex flex-col gap-0.5">
                             <span className="text-blue-600 uppercase">MOBILE</span>
                             <input className="bg-white border border-slate-200 p-0.5 text-[8px] uppercase" value={gstSaleForm.customerMobile} onChange={e => setGstSaleForm({...gstSaleForm, customerMobile: e.target.value})} />
                         </div>
                      </div>
                      <div className="mt-2 text-[8px] flex items-center justify-between border-t border-slate-200 pt-1">
                         <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1"><input type="checkbox" /> CASH PARTY</label>
                            <span className="text-rose-600 font-bold uppercase">{gstSaleForm.customerName}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-blue-600 uppercase font-black">E-WAY</span>
                            <span className="text-slate-900 border border-slate-300 px-2 uppercase">SALE ON Nett Cash</span>
                            <span className="text-black bg-yellow-100 border border-slate-300 px-2 uppercase">C.MOBILE</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Items Table Section */}
                <div className="flex-1 bg-white flex flex-col min-h-0 border-y border-slate-300">
                   <table className="w-full text-center text-[9px] font-black border-collapse">
                      <thead className="sticky top-0 bg-sky-900 text-white uppercase tracking-tighter">
                         <tr className="border-b border-white/20">
                            <th className="border-r border-white/20 py-1 w-8">SR</th>
                            <th className="border-r border-white/20 py-1 text-left px-2">CATEGORY</th>
                            <th className="border-r border-white/20 py-1 text-left px-2">BRAND *</th>
                            <th className="border-r border-white/20 py-1 text-left px-2">PRODUCT *</th>
                            <th className="border-r border-white/20 py-1 w-16">HSN</th>
                            <th className="border-r border-white/20 py-1 w-12">UOM D/F</th>
                            <th className="border-r border-white/20 py-1 w-10">PCS</th>
                            <th className="border-r border-white/20 py-1 w-10">Mtr</th>
                            <th className="border-r border-white/20 py-1 w-16">Rate</th>
                            <th className="border-r border-white/20 py-1 w-20">Amount</th>
                            <th className="border-r border-white/20 py-1 w-10">D %</th>
                            <th className="py-1 w-16">DISC</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 overflow-y-auto">
                        {saleItems.map((item, idx) => (
                          <tr key={idx} className="bg-white hover:bg-slate-50 h-6 group">
                            <td 
                              className="border-r border-slate-200 bg-slate-50 cursor-pointer hover:bg-rose-500 hover:text-white transition-colors"
                              onClick={() => removeSaleItem(idx)}
                              title="Click to remove row"
                            >
                              {idx + 1}
                            </td>
                            <td className="border-r border-slate-200 text-left px-2 uppercase opacity-70">{item.category}</td>
                            <td className="border-r border-slate-200 text-left px-2 uppercase opacity-80">{item.brand}</td>
                            <td className="border-r border-slate-200 text-left px-2 uppercase text-blue-800 font-bold">{item.productName}</td>
                            <td className="border-r border-slate-200">{item.hsnCode}</td>
                            <td className="border-r border-slate-200">
                               <select 
                                 className="w-full bg-transparent outline-none appearance-none text-center"
                                 value={item.uom}
                                 onChange={e => updateSaleItem(idx, { uom: e.target.value })}
                               >
                                  <option>Pcs</option>
                                  <option>Mtr</option>
                               </select>
                            </td>
                            <td className="border-r border-slate-200 bg-blue-50/30">
                               <input 
                                 type="text"
                                 className="w-full bg-transparent text-center outline-none font-bold text-blue-900" 
                                 value={item.pcs} 
                                 onChange={e => updateSaleItem(idx, { pcs: e.target.value })}
                               />
                            </td>
                            <td className="border-r border-slate-200">
                               <input 
                                 type="text"
                                 className="w-full bg-transparent text-center outline-none" 
                                 value={item.mtr} 
                                 onChange={e => updateSaleItem(idx, { mtr: e.target.value })}
                               />
                            </td>
                            <td className="border-r border-slate-200">
                               <input 
                                 type="text"
                                 className="w-full bg-transparent text-center outline-none font-bold" 
                                 value={item.rate} 
                                 onChange={e => updateSaleItem(idx, { rate: e.target.value })}
                               />
                            </td>
                            <td className="border-r border-slate-200 bg-emerald-50 text-emerald-700 font-black">{parseFloat(item.amount).toFixed(2)}</td>
                            <td className="border-r border-slate-200">
                               <input 
                                 type="text"
                                 className="w-full bg-transparent text-center outline-none" 
                                 value={item.discPerc} 
                                 onChange={e => updateSaleItem(idx, { discPerc: e.target.value })}
                               />
                            </td>
                            <td className="text-slate-400">{parseFloat(item.discAmt).toFixed(2)}</td>
                          </tr>
                        ))}
                        {/* Interactive Row */}
                        <tr className="bg-amber-50 h-8">
                           <td className="border-r border-slate-200 text-amber-600">+</td>
                           <td colSpan={3} className="border-r border-slate-200 px-1">
                              <select 
                                className="w-full bg-transparent border-none text-[9px] font-black uppercase outline-none"
                                onChange={(e) => {
                                  const p = state.products.find(prod => prod.id === e.target.value);
                                  if (p) setSelectionModal(p);
                                }}
                                value=""
                              >
                                <option value="">SELECT PRODUCT TO ADD ARTICLE...</option>
                                {state.products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>)}
                              </select>
                           </td>
                           <td colSpan={8} className="text-slate-400 font-bold uppercase tracking-widest">Article Selection Mode Active</td>
                        </tr>
                        {/* Padding Rows */}
                        {Array.from({ length: Math.max(0, 10 - saleItems.length) }).map((_, i) => (
                           <tr key={`fill-${i}`} className="h-6 opacity-30">
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td className="border-r border-slate-200"></td>
                              <td></td>
                           </tr>
                        ))}
                      </tbody>
                   </table>
                </div>

                {/* Summary Section Footer */}
                <div className="bg-slate-100 p-2 rounded-t border-t border-slate-300">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[9px] font-black">
                      <div className="space-y-1">
                         <div className="flex justify-between border-b border-white pb-0.5">
                            <span className="text-slate-500 uppercase">PCS</span>
                            <span className="text-blue-700">{totals.totalPcs}</span>
                            <span className="text-slate-500 uppercase ml-2">VALUE</span>
                            <span className="text-rose-600">{totals.grossValue.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between border-b border-white pb-0.5">
                            <span className="text-slate-500 uppercase">MTR</span>
                            <span className="text-blue-700">0.00</span>
                            <span className="text-slate-500 uppercase ml-2">BRAND.DISC</span>
                            <span className="text-rose-600">0.00</span>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between border-b border-white pb-0.5">
                             <span className="text-slate-500 uppercase">ITEM.DISC</span>
                             <span className="text-rose-600">{totals.itemDisc.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between border-b border-white pb-0.5">
                             <span className="text-slate-500 uppercase">ITEM.ADD</span>
                             <span className="text-emerald-600">0.00</span>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between border-b border-white pb-0.5">
                             <span className="text-slate-500 uppercase">TAXABLE</span>
                             <span className="text-rose-600">{totals.taxableAmt.toFixed(2)}</span>
                             <span className="text-slate-500 uppercase ml-2">CGST</span>
                             <span className="text-blue-700">{totals.cgst.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between border-b border-white pb-0.5">
                             <span className="text-slate-500 uppercase">NET GST</span>
                             <span className="text-rose-600">{totals.totalGst.toFixed(2)}</span>
                             <span className="text-slate-500 uppercase ml-2">SGST</span>
                             <span className="text-blue-700">{totals.sgst.toFixed(2)}</span>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between border-b border-white pb-0.5">
                             <span className="text-slate-500 uppercase">IGST</span>
                             <span className="text-blue-700">0.00</span>
                         </div>
                         <div className="flex justify-between border-b border-white pb-0.5 text-blue-900 border-b-2 border-blue-900">
                             <span className="uppercase">R/OFF</span>
                             <span>{totals.roundOff.toFixed(2)}</span>
                             <span className="uppercase ml-2">BALES</span>
                             <span>0</span>
                         </div>
                      </div>
                   </div>

                   <div className="mt-2 flex flex-col md:flex-row gap-2">
                       <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-1 text-[8px] font-bold uppercase">
                          <div className="flex items-center gap-2 bg-white px-2 py-1 border border-slate-200">
                             <span className="text-blue-600">GST FORM</span>
                             <span className="text-slate-900 font-black">{gstSaleForm.gstForm}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-white px-2 py-1 border border-slate-200">
                             <span className="text-blue-600">SALES MAN</span>
                             <input className="flex-1 outline-none font-black" value={gstSaleForm.salesMan} onChange={e => setGstSaleForm({...gstSaleForm, salesMan: e.target.value})} />
                          </div>
                          <div className="flex items-center gap-2 bg-white px-2 py-1 border border-slate-200">
                             <span className="text-blue-600">TRANSPORT</span>
                             <input className="flex-1 outline-none font-black" value={gstSaleForm.transport} onChange={e => setGstSaleForm({...gstSaleForm, transport: e.target.value})} />
                          </div>
                          <div className="flex items-center gap-2 bg-white px-2 py-1 border border-slate-200">
                             <span className="text-blue-600">BROKER</span>
                             <input className="flex-1 outline-none font-black" value={gstSaleForm.broker} onChange={e => setGstSaleForm({...gstSaleForm, broker: e.target.value})} />
                          </div>
                       </div>
                       
                       {/* Final Amount Display Area */}
                       <div className="flex-1 flex gap-1 items-end">
                          <div className="flex-1 bg-slate-200 p-2 rounded flex items-center justify-between border border-slate-300">
                             <span className="text-blue-900 font-black text-xs uppercase italic">BILL AMOUNT ==&gt;</span>
                             <div className="bg-rose-900 text-white px-6 py-1 text-3xl font-black rounded shadow-inner leading-none">
                                {totals.netAmount.toFixed(0)}
                             </div>
                          </div>
                       </div>
                   </div>

                   <div className="mt-1 text-[7px] font-black text-slate-400 flex justify-between items-center bg-white px-2 py-1 rounded">
                      <div className="flex gap-4">
                         <span>Inserted By User : SA On {format(new Date(), 'dd/MMM/yyyy HH:mm:ss').toUpperCase()}</span>
                         <span className="text-emerald-600">BILL NO: {gstSaleForm.billNo}</span>
                      </div>
                      <div className="flex gap-4">
                         <span>ST.CODE: 09</span>
                         <span>Server: ANKITSERVER</span>
                         <span className="bg-blue-900 text-white px-2 rounded">{state.businessProfile.name}</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Right Sidebar Actions */}
             <div className="w-full md:w-32 flex flex-col gap-1 overflow-y-auto no-scrollbar pb-1">
                <div className="flex flex-col gap-1">
                   <button onClick={() => alert('IRN Generation Service Initializing...')} className="bg-rose-600 text-white py-2 text-[9px] font-black rounded shadow-md hover:bg-rose-700 uppercase tracking-tighter">E-Invoice</button>
                   <button onClick={() => alert('Connecting to NIC E-Way Bill Portal...')} className="bg-sky-600 text-white py-2 text-[9px] font-black rounded shadow-md hover:bg-sky-700 uppercase tracking-tighter">E-Way Bill</button>
                   <button onClick={() => alert('Opening Delivery Challan Wizard...')} className="bg-emerald-600 text-white py-2 text-[9px] font-black rounded shadow-md hover:bg-emerald-700 uppercase tracking-tighter">Fill Challan</button>
                   <button onClick={() => alert('Loading Bill-by-Bill Payment Adjustment...')} className="bg-blue-600 text-white py-2 text-[9px] font-black rounded shadow-md hover:bg-blue-700 uppercase tracking-tighter">Payment Adjust</button>
                   <button onClick={() => alert(`Loading history for ${gstSaleForm.customerName || 'walk-in'}`)} className="bg-slate-700 text-white py-2 text-[9px] font-black rounded shadow-md hover:bg-slate-800 uppercase tracking-tighter">Sale History (Party)</button>
                   <button onClick={() => alert('Voucher cloning service active.')} className="bg-rose-100 text-rose-800 py-2 text-[9px] font-black rounded border border-rose-200 mt-2 uppercase tracking-tighter">Copy Bill</button>
                </div>
                
                <div className="bg-white border border-slate-300 rounded p-1 mt-2 flex flex-col gap-1 flex-1">
                   {[
                     { label: 'New (F2)', icon: <Plus size={10} />, action: () => {
                       setSaleItems([]);
                       setGstSaleForm(prev => ({...prev, billNo: (state.invoices.length + 1).toString().padStart(2, '0')}));
                     } },
                     { label: 'Modify (F3)', icon: <Tag size={10} />, action: () => {} },
                     { label: 'Delete (F4)', icon: <Trash2 size={10} />, action: () => {} },
                     { label: 'Print (Ctrl+P)', icon: <Printer size={10} />, action: handleCreateInvoice },
                     { label: 'Save (Ctrl+S)', icon: <CheckCircle2 size={10} />, action: handleCreateInvoice },
                     { label: 'Close (F10)', icon: <X size={10} />, action: () => setView('dashboard') },
                   ].map((btn, i) => (
                      <button 
                        key={i}
                        onClick={btn.action}
                        className="flex flex-col items-center justify-center py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 group transition-all"
                      >
                         <div className="text-primary group-hover:scale-110 transition-transform">{btn.icon}</div>
                         <span className="text-[7px] font-black uppercase mt-1 px-1 text-center">{btn.label}</span>
                      </button>
                   ))}
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
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]"
                    >
                      No sales recorded for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
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
                          onClick={() => {
                            setPreviewInvoice(inv);
                            setTimeout(() => window.print(), 100);
                          }}
                          className="w-10 h-10 flex items-center justify-center text-emerald-500 hover:text-emerald-700 transition-all rounded-full hover:bg-emerald-50"
                          title="Direct Print"
                        >
                           <Printer size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setSearchTerm(inv.invoiceNo);
                            setView('transport');
                          }}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-all rounded-full hover:bg-blue-50"
                          title="Track Transport"
                        >
                           <TruckIcon size={18} />
                        </button>
                        <button 
                          onClick={() => handleModifyInvoice(inv)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-orange-500 transition-all rounded-full hover:bg-orange-50"
                          title="Modify Invoice"
                        >
                           <Tag size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenPreview(inv)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-all rounded-full hover:bg-primary/5"
                          title="Preview Bill"
                        >
                           <Calculator size={20} />
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
                          <div>
                             <p className="font-black text-slate-800 uppercase text-xs">Size {v.size} - {v.color}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available Stock: {v.qty} {v.hsnCode && `| HSN ${v.hsnCode}`}</p>
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
                            {state.businessProfile.logoUrl ? (
                               <img src={state.businessProfile.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                             ) : (
                               <div className="font-serif italic font-black text-lg leading-none">{state.businessProfile.name.split(' ')[0]} <span className="block text-[8px] tracking-widest not-italic">{state.businessProfile.name.split(' ').slice(1).join(' ')}</span></div>
                             )}
                            <div className="border border-black px-1 mt-1 font-black text-[9px] inline-block">TAX-INVOICE</div>
                         </div>

                         <div className="text-[10px] font-black text-rose-600 mb-1 flex items-center justify-center gap-4">
                            <span>|| श्री गणेशाय नमः ||</span>
                         </div>
                         <h1 className="text-4xl font-black uppercase tracking-tight mb-0">{state.businessProfile.name}</h1>
                         <p className="font-bold text-[9px]">{state.businessProfile.address}, {state.businessProfile.city} - {state.businessProfile.pincode} ({state.businessProfile.state.split('-')[1]})</p>
                         
                         <div className="grid grid-cols-3 border-y border-black mt-2 text-[8px] font-bold py-0.5">
                            <div className="text-left px-1 border-r border-black">GST NO. <span className="font-black text-[9px]">{state.businessProfile.gstin}</span></div>
                            <div className="text-center px-1 border-r border-black uppercase text-[7px] overflow-hidden whitespace-nowrap">Contact : {state.businessProfile.phone} | {state.businessProfile.email}</div>
                            <div className="text-right px-1 overflow-hidden whitespace-nowrap text-[7px]">PAN: {state.businessProfile.gstin.slice(2, 12)}</div>
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
                               <span className="font-black text-blue-800 uppercase">{previewInvoice.customerName || (state.customers.find(c => c.id === previewInvoice.customerId)?.name) || 'Walk-in Customer'}</span>
                            </div>
                            <div className="flex gap-2 items-start">
                               <span className="font-black w-20">ADDRESS :</span>
                               <span className="flex-1 uppercase">{previewInvoice.customerAddress || '-'}</span>
                            </div>
                            <div className="flex gap-2">
                               <span className="font-black w-20">CITY :</span>
                               <span className="uppercase text-blue-800 font-bold">{previewInvoice.customerCity || 'PRAYAGRAJ'}</span>
                            </div>
                            <div className="flex gap-2">
                               <span className="font-black w-20">STATE CODE :</span>
                               <span className="font-bold">09</span>
                            </div>
                         </div>
                         <div className="p-1 space-y-0.5">
                            <div className="flex gap-2">
                               <span className="font-black w-20">GSTIN NO. :</span>
                               <span className="font-black text-blue-800 uppercase">{previewInvoice.customerGstNo || '-'}</span>
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
                                  <span className="font-black">{previewInvoice.customerMobile || '-'}</span>
                               </div>
                               <div className="flex gap-2 text-right">
                                  <span className="font-black">PAN NO. :</span>
                                  <span className="font-black">{previewInvoice.customerPan || '-'}</span>
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
                                     <td className="border-r border-black py-1 px-1 text-center font-black">{item.hsnCode || p?.hsnCode || '-'}</td>
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
                               <span>{previewInvoice.summary ? previewInvoice.summary.taxableAmt.toFixed(2) : (getSubtotal(previewInvoice) - getTax(previewInvoice)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between px-2 py-1 text-slate-500">
                               <span>Total GST</span>
                               <span>{previewInvoice.summary ? previewInvoice.summary.totalGst.toFixed(2) : getTax(previewInvoice).toFixed(1)}</span>
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
                               <span>{previewInvoice.summary ? previewInvoice.summary.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : previewInvoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                               <span className="font-black text-blue-900 uppercase">{state.businessProfile.name}</span>
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
