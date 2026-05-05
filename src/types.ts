export type View = 
  | 'dashboard' 
  | 'inventory' 
  | 'purchase' 
  | 'purchase:registry'
  | 'purchase:bill'
  | 'purchase:suppliers'
  | 'sales' 
  | 'sales:billing'
  | 'sales:invoices'
  | 'sales:return'
  | 'sales:rates'
  | 'customers' 
  | 'brokers' 
  | 'accounting' 
  | 'transport' 
  | 'warehouse' 
  | 'reports' 
  | 'settings';

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'manager' | 'accountant' | 'warehouse';
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorCode: string;
  qty: number;
  warehouseId: string;
}

export interface Product {
  id: string;
  brand: string;
  category: string;
  name: string;
  variants: ProductVariant[];
  mrp: number;
  mrpGst: number; // Percent
  purchasePrice: number;
  purchaseGst: number; // Percent
  sellingPrice: number;
  sellGst: number; // Percent
  discountMax: number; // Percent
  batchNo: string;
  barcode: string;
}

export interface Area {
  id: string;
  state: string;
  district: string;
  city: string;
  areaName: string;
}

export interface Customer {
  id: string;
  name: string;
  gstin: string;
  creditLimit: number;
  areaId: string;
  phone: string;
  pricingTier: 'retail' | 'wholesale' | 'bulk';
}

export interface Supplier {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  address?: string;
  city?: string;
}

export interface Broker {
  id: string;
  name: string;
  commissionRate: number;
  phone?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
}

export interface PurchaseInvoice {
  id: string;
  billNo: string;
  date: string;
  supplierId: string;
  items: { 
    productId: string; 
    qty: number; 
    rate: number;
    barcode?: string;
    tc?: string;
    pcs?: number;
    mtr?: number;
    category?: string;
    brand?: string;
    baleNo?: string;
  }[];
  totalAmount: number;
  status: 'pending' | 'received';
  // New fields from Purchase Bill image
  entryType?: string;
  entryNo?: string;
  billDate?: string;
  dueOn?: string;
  statusLabel?: string; // e.g. "Final"
  msmeNo?: string;
  gstForm?: string;
  partyRemark?: string;
  brokerName?: string;
  transporterName?: string;
  biltyNo?: string;
  biltyDate?: string;
  weight?: string;
  baleQty?: number;
  freightChar?: number;
  openPcs?: number;
  rdAmount?: number;
  discountAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  deduction?: number;
  addition?: number;
  ewayBillNo?: string;
  tcsPercent?: number;
  roundOff?: number;
  transportId?: string; // To link to TransportLog
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerId: string;
  brokerId?: string;
  areaId?: string;
  items: { productId: string; size: string; color: string; qty: number; price: number; discount: number }[];
  taxRate: number;
  totalAmount: number;
  status: 'pending' | 'partially_paid' | 'paid';
}

export interface LedgerEntry {
  id: string;
  date: string;
  entityId?: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  referenceId?: string;
  category?: string;
}

export interface TransportLog {
  id: string;
  invoiceNo: string;
  transporterName: string;
  vehicleNo: string;
  lrNo: string;
  freightAmount: number;
  status: 'in-transit' | 'delivered';
  date: string;
  fromCity?: string;
  // New fields from Transport Register & Slip Voucher
  baleQty?: number;
  privateMark?: string;
  supplierName?: string;
  paymentNo?: string;
  paymentDate?: string;
  paidAmount?: number;
  openDate?: string;
  receivedDate?: string;
  // Voucher specific fields
  entryType?: string;
  billNo?: string;
  receiveNo?: string;
  biltyDate?: string;
  hamaliExpense?: number;
  baleType?: 'Loose' | 'Box';
  noOfBales?: number;
  pendingBales?: number;
  netFreight?: number;
  remark?: string;
  supplierAddress?: string;
  supplierCity?: string;
  supplierMobile?: string;
  supplierGstNo?: string;
  payMode?: string;
  freightAcDr?: string;
  cashAmount?: number;
  cgst?: number;
  igst?: number;
  sgst?: number;
}

export interface AppState {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  brokers: Broker[];
  areas: Area[];
  warehouses: Warehouse[];
  purchaseInvoices: PurchaseInvoice[];
  invoices: Invoice[];
  ledgerEntries: LedgerEntry[];
  transportLogs: TransportLog[];
  adminCredentials?: {
    username: string;
    password: string;
  };
}
