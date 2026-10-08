import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import { PaymentMethod, PaymentStatus, Sale, SaleItem, StockMovement } from '../types/database';
import { localDb } from './dbStorage';
import { getProductById } from './productsService';

export interface NewSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleInput {
  customerId: string;
  items: NewSaleItemInput[];
  paymentStatus: PaymentStatus;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  recordedBy: string;
}

export interface RecordAdditionalPaymentInput {
  saleId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  recordedBy: string;
}

// Generate human-friendly sale number (e.g. AX-00104)
function generateSaleNumber(): string {
  const existingSales = localDb.getSales();
  const nextNum = existingSales.length + 101;
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  return `AX-${String(nextNum).padStart(5, '0')}`;
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  if (!input.customerId) {
    throw new Error('Customer is required.');
  }

  if (!input.items || input.items.length === 0) {
    throw new Error('Sale must contain at least one product.');
  }

  // 1. Verify all stock availability before making any changes
  for (const item of input.items) {
    if (item.quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }
    const product = await getProductById(item.productId);
    if (!product) {
      throw new Error(`Product not found.`);
    }
    if (product.stock_quantity < item.quantity) {
      throw new Error(
        `Insufficient stock available for ${product.name}. Available: ${product.stock_quantity}, requested: ${item.quantity}.`
      );
    }
  }

  // Calculate totals
  const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const amountPaid = Math.min(totalAmount, Math.max(0, Number(input.amountPaid || 0)));
  const balance = Math.max(0, totalAmount - amountPaid);

  let determinedStatus: PaymentStatus = 'Unpaid';
  if (amountPaid >= totalAmount) {
    determinedStatus = 'Paid';
  } else if (amountPaid > 0) {
    determinedStatus = 'Partially Paid';
  }

  const now = new Date().toISOString();
  const saleId = crypto.randomUUID ? crypto.randomUUID() : `sale-${Date.now()}`;
  const saleNumber = generateSaleNumber();

  const sale: Sale = {
    id: saleId,
    sale_number: saleNumber,
    customer_id: input.customerId,
    total_amount: totalAmount,
    amount_paid: amountPaid,
    balance: balance,
    payment_status: determinedStatus,
    recorded_by: input.recordedBy || 'Admin',
    created_at: now,
  };

  const saleItems: SaleItem[] = input.items.map((item, idx) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `si-${Date.now()}-${idx}`,
    sale_id: saleId,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.quantity * item.unitPrice,
  }));

  // If Supabase is configured
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Insert sale
      const { data: insertedSale, error: saleError } = await supabase
        .from('sales')
        .insert({
          sale_number: sale.sale_number,
          customer_id: sale.customer_id,
          total_amount: sale.total_amount,
          amount_paid: sale.amount_paid,
          balance: sale.balance,
          payment_status: sale.payment_status,
          recorded_by: sale.recorded_by,
        })
        .select()
        .single();

      if (saleError) throw saleError;
      const finalSaleId = insertedSale.id;

      // 2. Insert items
      const itemsToInsert = input.items.map((it) => ({
        sale_id: finalSaleId,
        product_id: it.productId,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        subtotal: it.quantity * it.unitPrice,
      }));
      await supabase.from('sale_items').insert(itemsToInsert);

      // 3. Insert initial payment if amountPaid > 0
      if (amountPaid > 0) {
        await supabase.from('payments').insert({
          sale_id: finalSaleId,
          amount: amountPaid,
          payment_method: input.paymentMethod,
          payment_reference: input.paymentReference || null,
          recorded_by: input.recordedBy || 'Admin',
        });
      }

      // 4. Reduce stock & record stock movements
      for (const item of input.items) {
        const prod = await getProductById(item.productId);
        if (prod) {
          const newQty = prod.stock_quantity - item.quantity;
          await supabase
            .from('products')
            .update({ stock_quantity: newQty, updated_at: now })
            .eq('id', prod.id);

          await supabase.from('stock_movements').insert({
            product_id: prod.id,
            movement_type: 'Sale',
            quantity: -item.quantity,
            previous_quantity: prod.stock_quantity,
            new_quantity: newQty,
            reason: `Sold in ${sale.sale_number}`,
            recorded_by: input.recordedBy || 'Admin',
          });
        }
      }

      return insertedSale as Sale;
    } catch (err) {
      console.warn('Supabase createSale failed, executing via local DB:', err);
    }
  }

  // Local ACID-like transaction execution
  // 1. Save Sale
  localDb.saveSale(sale);
  // 2. Save Items
  localDb.saveSaleItems(saleItems);

  // 3. Save initial payment if paid
  if (amountPaid > 0) {
    localDb.savePayment({
      id: crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
      sale_id: saleId,
      amount: amountPaid,
      payment_method: input.paymentMethod,
      payment_reference: input.paymentReference || null,
      recorded_by: input.recordedBy || 'Admin',
      created_at: now,
    });
  }

  // 4. Reduce stock & record movements
  for (const item of input.items) {
    const prod = localDb.getProducts().find((p) => p.id === item.productId);
    if (prod) {
      const prevQty = prod.stock_quantity;
      const newQty = prevQty - item.quantity;
      localDb.updateProductStock(prod.id, newQty);

      const movement: StockMovement = {
        id: crypto.randomUUID ? crypto.randomUUID() : `sm-${Date.now()}-${item.productId}`,
        product_id: prod.id,
        movement_type: 'Sale',
        quantity: -item.quantity,
        previous_quantity: prevQty,
        new_quantity: newQty,
        reason: `Sold in ${saleNumber}`,
        recorded_by: input.recordedBy || 'Admin',
        created_at: now,
      };
      localDb.saveStockMovement(movement);
    }
  }

  return sale;
}

export async function getSales(options?: {
  search?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  limit?: number;
}): Promise<Sale[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('sales')
        .select('*, customer:customers(*), items:sale_items(*, product:products(*)), payments(*)')
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('payment_status', options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (!error && data) {
        let result = data as Sale[];
        if (options?.search) {
          const q = options.search.toLowerCase();
          result = result.filter(
            (s) =>
              s.sale_number.toLowerCase().includes(q) ||
              s.customer?.name.toLowerCase().includes(q) ||
              s.customer?.phone.includes(q)
          );
        }
        return result;
      }
    } catch (err) {
      console.warn('Supabase getSales failed, falling back to local DB:', err);
    }
  }

  const rawSales = localDb.getSales();
  const customers = localDb.getCustomers();
  const allItems = localDb.getSaleItems();
  const products = localDb.getProducts();
  const allPayments = localDb.getPayments();

  let hydrated: Sale[] = rawSales.map((s) => {
    const customer = customers.find((c) => c.id === s.customer_id);
    const items = allItems
      .filter((i) => i.sale_id === s.id)
      .map((i) => ({
        ...i,
        product: products.find((p) => p.id === i.product_id),
      }));
    const payments = allPayments.filter((p) => p.sale_id === s.id);

    return {
      ...s,
      customer,
      items,
      payments,
    };
  });

  if (options?.status) {
    hydrated = hydrated.filter((s) => s.payment_status === options.status);
  }

  if (options?.paymentMethod) {
    hydrated = hydrated.filter((s) =>
      s.payments?.some((p) => p.payment_method === options.paymentMethod)
    );
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    hydrated = hydrated.filter(
      (s) =>
        s.sale_number.toLowerCase().includes(q) ||
        s.customer?.name.toLowerCase().includes(q) ||
        s.customer?.phone.includes(q) ||
        s.items?.some((i) => i.product?.name.toLowerCase().includes(q))
    );
  }

  hydrated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (options?.limit) {
    return hydrated.slice(0, options.limit);
  }

  return hydrated;
}

export async function getSaleById(id: string): Promise<Sale | null> {
  const sales = await getSales();
  return sales.find((s) => s.id === id) || null;
}

export async function recordAdditionalPayment(input: RecordAdditionalPaymentInput): Promise<Sale> {
  const sale = await getSaleById(input.saleId);
  if (!sale) {
    throw new Error('Sale not found.');
  }

  const payAmount = Number(input.amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  if (payAmount > sale.balance) {
    throw new Error(`Amount exceeds remaining balance of GHS ${sale.balance.toFixed(2)}.`);
  }

  const newAmountPaid = sale.amount_paid + payAmount;
  const newBalance = Math.max(0, sale.total_amount - newAmountPaid);
  const newStatus: PaymentStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Insert payment
      await supabase.from('payments').insert({
        sale_id: sale.id,
        amount: payAmount,
        payment_method: input.paymentMethod,
        payment_reference: input.paymentReference || null,
        recorded_by: input.recordedBy || 'Admin',
      });

      // 2. Update sale balance & status
      const { data, error } = await supabase
        .from('sales')
        .update({
          amount_paid: newAmountPaid,
          balance: newBalance,
          payment_status: newStatus,
        })
        .eq('id', sale.id)
        .select()
        .single();

      if (error) throw error;
      return data as Sale;
    } catch (err) {
      console.warn('Supabase recordPayment failed, updating local DB:', err);
    }
  }

  // Local fallback
  localDb.savePayment({
    id: crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
    sale_id: sale.id,
    amount: payAmount,
    payment_method: input.paymentMethod,
    payment_reference: input.paymentReference || null,
    recorded_by: input.recordedBy || 'Admin',
    created_at: now,
  });

  const updatedSale: Sale = {
    ...sale,
    amount_paid: newAmountPaid,
    balance: newBalance,
    payment_status: newStatus,
  };
  localDb.saveSale(updatedSale);

  return updatedSale;
}
