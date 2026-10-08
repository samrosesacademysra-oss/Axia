import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import { Customer, Sale } from '../types/database';
import { localDb } from './dbStorage';

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
}

export interface CustomerProfile extends Customer {
  totalPurchases: number;
  salesCount: number;
  totalPaid: number;
  outstandingBalance: number;
  salesHistory: Sale[];
}

export async function getCustomers(search?: string): Promise<Customer[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('customers').select('*').order('name', { ascending: true });
      if (search) {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as Customer[]) || [];
    } catch (err) {
      console.warn('Supabase getCustomers failed, falling back to local DB:', err);
    }
  }

  let customers = localDb.getCustomers();
  if (search) {
    const q = search.toLowerCase();
    customers = customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }
  return customers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID ? crypto.randomUUID() : `cust-${Date.now()}`;

  const customer: Customer = {
    id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    created_at: now,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Customer;
    } catch (err) {
      console.warn('Supabase createCustomer failed, saving to local DB:', err);
    }
  }

  localDb.saveCustomer(customer);
  return customer;
}

export async function getCustomerProfile(id: string): Promise<CustomerProfile | null> {
  const customers = await getCustomers();
  const customer = customers.find((c) => c.id === id);
  if (!customer) return null;

  // Fetch sales for this customer
  let sales: Sale[] = [];
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, items:sale_items(*, product:products(*)), payments(*)')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        sales = data as Sale[];
      }
    } catch (err) {
      console.warn('Supabase getCustomerProfile sales error:', err);
    }
  }

  if (sales.length === 0) {
    const allSales = localDb.getSales().filter((s) => s.customer_id === id);
    const allItems = localDb.getSaleItems();
    const allPayments = localDb.getPayments();
    const allProducts = localDb.getProducts();

    sales = allSales.map((s) => ({
      ...s,
      customer,
      items: allItems
        .filter((item) => item.sale_id === s.id)
        .map((item) => ({
          ...item,
          product: allProducts.find((p) => p.id === item.product_id),
        })),
      payments: allPayments.filter((p) => p.sale_id === s.id),
    }));
  }

  const totalPurchases = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalPaid = sales.reduce((sum, s) => sum + Number(s.amount_paid), 0);
  const outstandingBalance = sales.reduce((sum, s) => sum + Number(s.balance), 0);

  return {
    ...customer,
    totalPurchases,
    salesCount: sales.length,
    totalPaid,
    outstandingBalance,
    salesHistory: sales,
  };
}
