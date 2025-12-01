

import type { LucideIcon } from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export type SuggestOptimalPriceState = {
  suggestedPrice?: number;
  reasoning?: string;
  error?: string;
};

export interface Item {
  id?: string;
  name: string;
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Active";
  price: number; // Final Sales Price
  quantity: number; // Stock Qty
  category: string;
  brand?: string;
  sku?: string; // Item Code
  description?: string;
  image?: string;
  hsn: string;
  unit: string;
  minQuantity: number;
  purchasePrice: number;
  tax: string;
  expiryDate?: string;
  warehouse?: string; // Warehouse ID
}

export interface Category {
    id?: string;
    name: string;
    description: string;
}

export interface Brand {
    id?: string;
    name: string;
    description: string;
}

export interface Customer {
    id?: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    notes?: string;
    openingBalance?: number;
    currentBalance: number;
    initialPayment?: number;
    balanceDate?: string;
    balanceNotes?: string;
    registered: string;
}

export interface Sale {
    id?: string;
    orderId: string;
    customer: string;
    customerId?: string;
    date: string;
    status: "Fulfilled" | "Pending" | "Cancelled" | "Return";
    total: number;
    otherCharges: number;
    discount: number;
    items: { name: string; quantity: number; price: number; itemId: string; }[];
    payments?: {
        type: string;
        amount: number;
        note?: string;
        date: any; // Can be Timestamp or string
    }[];
    createdBy: string;
    taxAmount?: number;
}

export interface PurchaseItem {
  id: string;
  dbItemId?: string;
  manualName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
    id?: string;
    purchaseId: string;
    date: string;
    supplier: string;
    supplierId?: string;
    totalAmount: number;
    orderStatus: 'Received' | 'Pending' | 'Cancelled';
    paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
    createdBy: string;
    paidAmount: number;
    dueAmount: number;
    items: PurchaseItem[];
    taxAmount?: number;
    shippingCost?: number;
    notes?: string;
    paymentTerms?: string;
}

export interface Supplier {
    id?: string;
    supplierId: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    createdDate?: string;
    contactPerson?: string;
    notes?: string;
    initialBalance?: number;
    balanceDate?: string;
    balanceExplanation?: string;
}

export interface Expense {
    id?: string;
    date: string;
    category: string;
    referenceNo: string;
    amount: number;
    notes?: string;
    createdBy: string;
}

export interface ExpenseCategory {
    id?: string;
    name: string;
    description?: string;
}

export interface InvoiceSettings {
    printerType: string;
    invoiceTheme: string;
    paperSize: string;
    fontFamily: string;
    fontSize: string;
    themeColor: string;
    showCompanyInfo: boolean;
    showCompanyLogo: boolean;
    companyFontSize: string;
    showGstin: boolean;
    showShippingAddress: boolean;
    showNote: boolean;
    showTerms: boolean;
    showPaidBalance: boolean;
    showBalance: boolean;
    itemLabel: string;
    qtyLabel: string;
    rateLabel: string;
    discountLabel: string;
    taxLabel: string;
    amountLabel: string;
    headerFontSize: string;
    dataFontSize: string;
    showDescription: boolean;
    showDiscount: boolean;
    showFreeItem: boolean;
    showUnit: boolean;
    showTax: boolean;
    showBatch: boolean;
}

export interface ReportSettings {
    headerText: string;
    footerText: string;
    showWatermark: boolean;
    showCompanyName: boolean;
    showCompanyAddress: boolean;
    reportTitle: string;
}


export interface CompanyInfo {
    id?: string;
    name: string;
    version: string;
    mobile?: string;
    email?: string;
    phone?: string;
    gstNumber?: string;
    vatNumber?: string;
    panNumber?: string;
    website?: string;
    showSignature?: boolean;
    signature?: string;
    upiId?: string;
    upiCode?: string;
    bankDetails?: string;
    country?: string;
    state?: string;
    city?: string;
    postcode?: string;
    address?: string;
    logo?: string;
    currency?: string; // Currency ID
    currencySymbol?: string;
    defaultTaxRate?: number;
    invoiceSettings?: InvoiceSettings;
    reportSettings?: ReportSettings;
    footer?: string;
}

export interface Country {
    id?: string;
    name: string;
    status: 'Active' | 'Inactive';
}

export interface State {
    id?: string;
    name: string;
    countryId: string;
}

export interface Currency {
    id?: string;
    name: string;
    code: string;
    symbol: string;
}

export interface Payment {
    id?: string;
    date: string;
    paymentId: string;
    invoiceId: string;
    customerId: string;
    customerName: string;
    paymentMethod: string;
    amount: number;
    notes?: string;
}

export interface SupplierPayment {
    id?: string;
    date: string;
    paymentId: string;
    purchaseId: string;
    supplierId: string;
    supplierName: string;
    paymentMethod: string;
    amount: number;
    notes?: string;
}

export interface Warehouse {
    id?: string;
    name: string;
    address?: string;
    status: 'Active' | 'Inactive';
}

export interface StockTransfer {
    id?: string;
    date: string;
    fromWarehouseId: string;
    fromWarehouseName: string;
    toWarehouseId: string;
    toWarehouseName: string;
    items: {
        itemId: string;
        itemName: string;
        quantity: number;
    }[];
    notes?: string;
    status: 'Completed' | 'Pending';
}
