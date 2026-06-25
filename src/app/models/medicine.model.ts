export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  manufacturer: string;
  batchNo: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  hsn: string;
  gst: number;
}

export interface BillItem {
  medicine: Medicine;
  quantity: number;
  discount: number;
  total: number;
}

export interface Bill {
  id: string;
  billNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  doctorName: string;
  items: BillItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  paymentMode: 'cash' | 'card' | 'upi';
  status: 'paid' | 'pending' | 'cancelled';
}

export interface StockAlert {
  medicine: Medicine;
  type: 'low_stock' | 'expiring_soon' | 'expired';
}

export interface DashboardStats {
  todaySales: number;
  todayBills: number;
  lowStockCount: number;
  expiringCount: number;
  monthSales: number;
  totalMedicines: number;
}
