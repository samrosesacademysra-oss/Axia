export type ProductCategory = 'Personal Care' | 'Fragrances' | 'Diffusers';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Personal Care',
  'Fragrances',
  'Diffusers',
];

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid';

export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Card' | 'Other';

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Mobile Money',
  'Bank Transfer',
  'Card',
  'Other',
];

export type MovementType = 'Received' | 'Sale' | 'Adjustment';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  image_url: string | null;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  // Joined relation for display convenience
  product?: Product;
}

export interface Payment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  recorded_by: string;
  created_at: string;
}

export interface Sale {
  id: string;
  sale_number: string;
  customer_id: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: PaymentStatus;
  recorded_by: string;
  created_at: string;
  // Joined relations for display convenience
  customer?: Customer;
  items?: SaleItem[];
  payments?: Payment[];
}

export interface StockMovement {
  id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number; // Signed or positive with movement_type
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  recorded_by: string;
  created_at: string;
  // Joined relation for display convenience
  product?: Product;
}

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  todaySalesTotal: number;
  lowStockCount: number;
  categorySummary: {
    category: ProductCategory;
    productCount: number;
    stockUnits: number;
  }[];
  lowStockProducts: Product[];
  recentSales: Sale[];
}
