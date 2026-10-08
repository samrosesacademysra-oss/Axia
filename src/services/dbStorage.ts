import { Customer, Payment, Product, Sale, SaleItem, StockMovement } from '../types/database';

const STORAGE_KEYS = {
  PRODUCTS: 'axia_products',
  CUSTOMERS: 'axia_customers',
  SALES: 'axia_sales',
  SALE_ITEMS: 'axia_sale_items',
  PAYMENTS: 'axia_payments',
  STOCK_MOVEMENTS: 'axia_stock_movements',
};

// Seed sample data for Axia Distributions if user chooses to load starter inventory
export const SAMPLE_PRODUCTS: Omit<Product, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    sku: 'AX-PC-001',
    name: 'Shea Butter Nourishing Body Lotion',
    category: 'Personal Care',
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80',
    selling_price: 140,
    cost_price: 85,
    stock_quantity: 42,
    low_stock_threshold: 10,
    description: 'Enriched with raw Ghanaian shea butter and vitamin E for deep hydration.',
  },
  {
    sku: 'AX-PC-002',
    name: 'Clarifying Botanical Face Cleanser',
    category: 'Personal Care',
    image_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
    selling_price: 95,
    cost_price: 55,
    stock_quantity: 4, // Low stock on purpose for testing
    low_stock_threshold: 8,
    description: 'Gentle foaming cleanser with tea tree and aloe vera.',
  },
  {
    sku: 'AX-FR-001',
    name: 'Ocean Mist Eau de Parfum',
    category: 'Fragrances',
    image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=400&q=80',
    selling_price: 220,
    cost_price: 130,
    stock_quantity: 18,
    low_stock_threshold: 5,
    description: 'Crisp aquatic notes blended with bergamot, cedarwood, and amber.',
  },
  {
    sku: 'AX-FR-002',
    name: 'Velvet Oud Royale Extrait',
    category: 'Fragrances',
    image_url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=400&q=80',
    selling_price: 350,
    cost_price: 210,
    stock_quantity: 3, // Low stock on purpose
    low_stock_threshold: 6,
    description: 'Rich oriental blend of Cambodian oud, Damascus rose, and warm vanilla.',
  },
  {
    sku: 'AX-DF-001',
    name: 'Serene Lavender Reed Diffuser',
    category: 'Diffusers',
    image_url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=400&q=80',
    selling_price: 165,
    cost_price: 95,
    stock_quantity: 25,
    low_stock_threshold: 5,
    description: 'Calming French lavender essential oils with natural rattan reeds.',
  },
  {
    sku: 'AX-DF-002',
    name: 'Amber Sandalwood Ultrasonic Diffuser Oil',
    category: 'Diffusers',
    image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=400&q=80',
    selling_price: 120,
    cost_price: 70,
    stock_quantity: 2, // Low stock on purpose
    low_stock_threshold: 5,
    description: 'Concentrated diffuser oil with soothing woody base notes.',
  },
];

export const SAMPLE_CUSTOMERS: Omit<Customer, 'id' | 'created_at'>[] = [
  {
    name: 'John Mensah',
    phone: '+233 24 412 8900',
    email: 'j.mensah@example.com',
    address: 'East Legon, Accra',
  },
  {
    name: 'Akua Darko',
    phone: '+233 20 873 4512',
    email: 'akua.darko@example.com',
    address: 'Airport Hills, Accra',
  },
  {
    name: 'Kofi Boateng',
    phone: '+233 55 901 2341',
    email: 'k.boateng@example.com',
    address: 'Adum, Kumasi',
  },
];

class LocalDb {
  private get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private set<T>(key: string, items: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (err) {
      console.error('Storage write error', err);
    }
  }

  // PRODUCTS
  getProducts(): Product[] {
    return this.get<Product>(STORAGE_KEYS.PRODUCTS);
  }

  saveProduct(product: Product): void {
    const list = this.getProducts();
    const index = list.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      list[index] = product;
    } else {
      list.unshift(product);
    }
    this.set(STORAGE_KEYS.PRODUCTS, list);
  }

  updateProductStock(productId: string, newStock: number): void {
    const list = this.getProducts();
    const index = list.findIndex((p) => p.id === productId);
    if (index >= 0) {
      list[index] = {
        ...list[index],
        stock_quantity: Math.max(0, newStock),
        updated_at: new Date().toISOString(),
      };
      this.set(STORAGE_KEYS.PRODUCTS, list);
    }
  }

  // CUSTOMERS
  getCustomers(): Customer[] {
    return this.get<Customer>(STORAGE_KEYS.CUSTOMERS);
  }

  saveCustomer(customer: Customer): void {
    const list = this.getCustomers();
    const index = list.findIndex((c) => c.id === customer.id);
    if (index >= 0) {
      list[index] = customer;
    } else {
      list.unshift(customer);
    }
    this.set(STORAGE_KEYS.CUSTOMERS, list);
  }

  // SALES
  getSales(): Sale[] {
    return this.get<Sale>(STORAGE_KEYS.SALES);
  }

  saveSale(sale: Sale): void {
    const list = this.getSales();
    const index = list.findIndex((s) => s.id === sale.id);
    if (index >= 0) {
      list[index] = sale;
    } else {
      list.unshift(sale);
    }
    this.set(STORAGE_KEYS.SALES, list);
  }

  // SALE ITEMS
  getSaleItems(saleId?: string): SaleItem[] {
    const list = this.get<SaleItem>(STORAGE_KEYS.SALE_ITEMS);
    if (saleId) {
      return list.filter((i) => i.sale_id === saleId);
    }
    return list;
  }

  saveSaleItems(items: SaleItem[]): void {
    const existing = this.getSaleItems();
    this.set(STORAGE_KEYS.SALE_ITEMS, [...items, ...existing]);
  }

  // PAYMENTS
  getPayments(saleId?: string): Payment[] {
    const list = this.get<Payment>(STORAGE_KEYS.PAYMENTS);
    if (saleId) {
      return list.filter((p) => p.sale_id === saleId);
    }
    return list;
  }

  savePayment(payment: Payment): void {
    const list = this.getPayments();
    list.unshift(payment);
    this.set(STORAGE_KEYS.PAYMENTS, list);
  }

  // STOCK MOVEMENTS
  getStockMovements(productId?: string): StockMovement[] {
    const list = this.get<StockMovement>(STORAGE_KEYS.STOCK_MOVEMENTS);
    if (productId) {
      return list.filter((m) => m.product_id === productId);
    }
    return list;
  }

  saveStockMovement(movement: StockMovement): void {
    const list = this.getStockMovements();
    list.unshift(movement);
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, list);
  }

  // STARTER SEED
  seedSampleData(): void {
    const now = new Date();
    const products: Product[] = SAMPLE_PRODUCTS.map((p, idx) => ({
      ...p,
      id: `prod-seed-${idx + 1}`,
      created_at: new Date(now.getTime() - (idx + 2) * 86400000).toISOString(),
      updated_at: now.toISOString(),
    }));

    const customers: Customer[] = SAMPLE_CUSTOMERS.map((c, idx) => ({
      ...c,
      id: `cust-seed-${idx + 1}`,
      created_at: new Date(now.getTime() - (idx + 4) * 86400000).toISOString(),
    }));

    this.set(STORAGE_KEYS.PRODUCTS, products);
    this.set(STORAGE_KEYS.CUSTOMERS, customers);

    // Initial stock movements for received initial stock
    const movements: StockMovement[] = products.map((p) => ({
      id: `sm-seed-${p.id}`,
      product_id: p.id,
      movement_type: 'Received',
      quantity: p.stock_quantity,
      previous_quantity: 0,
      new_quantity: p.stock_quantity,
      reason: 'Initial warehouse inventory intake',
      recorded_by: 'Admin',
      created_at: p.created_at,
    }));
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    // Initial sale example
    const saleId = 'sale-seed-1';
    const saleDate = new Date(now.getTime() - 2 * 3600000).toISOString();
    const demoItems: SaleItem[] = [
      {
        id: 'si-1',
        sale_id: saleId,
        product_id: products[2].id, // Ocean Mist
        quantity: 2,
        unit_price: 220,
        subtotal: 440,
      },
    ];
    const demoSale: Sale = {
      id: saleId,
      sale_number: 'AX-00021',
      customer_id: customers[0].id,
      total_amount: 440,
      amount_paid: 440,
      balance: 0,
      payment_status: 'Paid',
      recorded_by: 'Admin',
      created_at: saleDate,
    };
    const demoPayment: Payment = {
      id: 'pay-seed-1',
      sale_id: saleId,
      amount: 440,
      payment_method: 'Mobile Money',
      payment_reference: 'MOMO-984210',
      recorded_by: 'Admin',
      created_at: saleDate,
    };

    this.set(STORAGE_KEYS.SALES, [demoSale]);
    this.set(STORAGE_KEYS.SALE_ITEMS, demoItems);
    this.set(STORAGE_KEYS.PAYMENTS, [demoPayment]);
  }

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

export const localDb = new LocalDb();
