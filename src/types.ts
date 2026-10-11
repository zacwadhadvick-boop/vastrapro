export interface BusinessProfile {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

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
  | 'adjustment'
  | 'taxation'
  | 'accountReports'
  | 'purchaseReports'
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
  hsnCode: string;
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
  hsnCode?: string;
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
  balance?: number;
}

export interface Broker {
  id: string;
  name: string;
  commissionRate: number;
  phone?: string;
  address?: string;
  bankAccountNo?: string;
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
    hsnCode?: string;
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
  // New fields from image
  type?: string; // e.g. "Tax Invoice"
  statusLabel?: string; // e.g. "FINAL"
  billYear?: string;
  billNoSuffix?: string;
  speaker?: string;
  payMode?: string;
  customerName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPinCode?: string;
  customerGstNo?: string;
  customerAadhar?: string;
  customerPan?: string;
  customerMobile?: string;
  ewayBillNo?: string;
  taxMode?: 'Inclusive' | 'Exclusive';
  items: { 
    productId: string; 
    category?: string;
    brand?: string;
    productName?: string;
    hsnCode?: string;
    uom?: string;
    pcs: number; 
    mtr: number;
    rate: number; 
    amount: number;
    discPerc: number;
    discAmt: number;
    netAmount: number;
    variantId?: string;
  }[];
  summary: {
    totalPcs: number;
    totalMtr: number;
    grossValue: number;
    itemDisc: number;
    brandDisc: number;
    taxableAmt: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    roundOff: number;
    netAmount: number;
  };
  status: 'pending' | 'partially_paid' | 'paid';
  gstForm?: string;
  salesMan?: string;
  transport?: string;
  broker?: string;
  billFor?: string;
  mBillNo?: string;
  entryDate?: string;
  insertedBy?: string;
  totalAmount: number;
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

export interface BillAdjustment {
  id: string;
  entryNo: string;
  date: string;
  supplierId: string;
  creditAccountId: string;
  brokerId?: string;
  billDetails: {
    billId: string;
    rd: string;
    rdQty: number;
    rdAmt: number;
    deduction: number;
    schemePerc: number;
    schemeAmt: number;
    bcPerc: number;
    bcAmt: number;
    intPerc: number;
    intAmt: number;
    netAmt: number;
  }[];
  partPayments: {
    vType: string;
    vNo: string;
    vDate: string;
    amount: number;
    chqNo: string;
    remark: string;
  }[];
  chequeDetail: {
    amount: number;
    bankCharges: number;
    agentComm: number;
    chqNo: string;
    date: string;
    remark: string;
  };
  totalBillAmount: number;
  totalPartAmount: number;
  balance: number;
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
  billAdjustments: BillAdjustment[];
  businessProfile: BusinessProfile;
  adminCredentials?: {
    username: string;
    password: string;
  };
}
