import { Customer, Payment, Product, Sale, SaleItem, StockMovement } from '../types/database';

const STORAGE_KEYS = {
  PRODUCTS: 'axia_products',
  CUSTOMERS: 'axia_customers',
  SALES: 'axia_sales',
  SALE_ITEMS: 'axia_sale_items',
  PAYMENTS: 'axia_payments',
  STOCK_MOVEMENTS: 'axia_stock_movements',
};

// Opening inventory from the grouped stock sheet.
// selling_price is the price per piece. stock_quantity is total pieces.
// The sheet did not include cost prices.
export const SAMPLE_PRODUCTS: Omit<Product, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    sku: 'AX-MP-001',
    name: 'Prince',
    category: 'Fragrances',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 216,
    low_stock_threshold: 10,
    description: 'Mini perfume. 6 cartons × 36 pieces. Carton price GH₵540.',
  },
  {
    sku: 'AX-MP-002',
    name: 'Sugar',
    category: 'Fragrances',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 288,
    low_stock_threshold: 10,
    description: 'Mini perfume. 2 cartons × 144 pieces. Carton price GH₵2,160.',
  },
  {
    sku: 'AX-MP-003',
    name: 'Coffee Blend',
    category: 'Fragrances',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 36,
    low_stock_threshold: 10,
    description: 'Mini perfume. 1 carton × 36 pieces. Carton price GH₵540.',
  },
  {
    sku: 'AX-MP-004',
    name: 'Milky Way',
    category: 'Fragrances',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 36,
    low_stock_threshold: 10,
    description: 'Mini perfume. 1 carton × 36 pieces. Carton price GH₵540.',
  },
  {
    sku: 'AX-MP-005',
    name: 'Mint Dust',
    category: 'Fragrances',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 36,
    low_stock_threshold: 10,
    description: 'Mini perfume. 1 carton × 36 pieces. Carton price GH₵540.',
  },
  {
    sku: 'AX-MP-006',
    name: 'Etern',
    category: 'Fragrances',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 288,
    low_stock_threshold: 10,
    description: 'Mini perfume. 2 cartons × 144 pieces. Carton price GH₵2,160.',
  },
  {
    sku: 'AX-MP-007',
    name: 'Blooming Marvellous',
    category: 'Fragrances',
    image_url: null,
    selling_price: 7,
    cost_price: 0,
    stock_quantity: 720,
    low_stock_threshold: 10,
    description: 'Mini perfume. 5 cartons × 144 pieces. Carton price GH₵1,008.',
  },
  {
    sku: 'AX-MP-008',
    name: 'Seasons',
    category: 'Fragrances',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 432,
    low_stock_threshold: 10,
    description: 'Mini perfume. 12 cartons × 36 pieces. Carton price GH₵540.',
  },
  {
    sku: 'AX-MP-009',
    name: 'Club de Nuit',
    category: 'Fragrances',
    image_url: null,
    selling_price: 5,
    cost_price: 0,
    stock_quantity: 216,
    low_stock_threshold: 10,
    description: 'Mini perfume. 6 cartons × 36 pieces. Carton price GH₵180.',
  },
  {
    sku: 'AX-MP-010',
    name: 'Choco Divine',
    category: 'Fragrances',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 72,
    low_stock_threshold: 10,
    description: 'Mini perfume. 2 cartons × 36 pieces. Carton price GH₵540.',
  },
  {
    sku: 'AX-DF-001',
    name: 'Vogue White',
    category: 'Diffusers',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 960,
    low_stock_threshold: 10,
    description: 'Diffuser. 20 cartons × 48 pieces. Carton price GH₵720.',
  },
  {
    sku: 'AX-DF-002',
    name: 'Vogue Black',
    category: 'Diffusers',
    image_url: null,
    selling_price: 15,
    cost_price: 0,
    stock_quantity: 180,
    low_stock_threshold: 10,
    description: 'Diffuser. 5 cartons × 36 pieces. Carton price GH₵540.',
  },
  {
    sku: 'AX-PC-001',
    name: 'Dove Deodorant 250ml',
    category: 'Personal Care',
    image_url: null,
    selling_price: 7,
    cost_price: 0,
    stock_quantity: 5680,
    low_stock_threshold: 10,
    description: 'Personal care. 59 cartons × 96 pieces, plus 16 loose pieces. Carton price GH₵672.',
  },
];

const LEGACY_DEMO_NAMES = [
  'Shea Butter Nourishing Body Lotion',
  'Clarifying Botanical Face Cleanser',
  'Ocean Mist Eau de Parfum',
  'Velvet Oud Royale Extrait',
  'Serene Lavender Reed Diffuser',
  'Amber Sandalwood Ultrasonic Diffuser Oil',
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

  // OPENING INVENTORY
  loadOpeningInventory(options?: { replace?: boolean }): void {
    const existing = this.getProducts();
    const legacyDemo = existing.some((p) => LEGACY_DEMO_NAMES.includes(p.name));
    if (existing.length > 0 && !legacyDemo && !options?.replace) return;

    const now = new Date().toISOString();
    const products: Product[] = SAMPLE_PRODUCTS.map((p, idx) => ({
      ...p,
      id: `prod-opening-${idx + 1}`,
      created_at: now,
      updated_at: now,
    }));

    this.set(STORAGE_KEYS.PRODUCTS, products);

    const movements: StockMovement[] = products.map((p) => ({
      id: `sm-opening-${p.id}`,
      product_id: p.id,
      movement_type: 'Received',
      quantity: p.stock_quantity,
      previous_quantity: 0,
      new_quantity: p.stock_quantity,
      reason: 'Opening inventory from grouped summary',
      recorded_by: 'Admin',
      created_at: now,
    }));
    this.set(STORAGE_KEYS.STOCK_MOVEMENTS, movements);

    if (legacyDemo || options?.replace) {
      const sales = this.get<Sale>(STORAGE_KEYS.SALES);
      const demoOnly = sales.every((sale) => sale.id.startsWith('sale-seed'));
      if (legacyDemo || demoOnly) {
        this.set(STORAGE_KEYS.SALES, []);
        this.set(STORAGE_KEYS.SALE_ITEMS, []);
        this.set(STORAGE_KEYS.PAYMENTS, []);
      }
    }
  }

  seedSampleData(): void {
    this.loadOpeningInventory({ replace: true });
  }

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

export const localDb = new LocalDb();
