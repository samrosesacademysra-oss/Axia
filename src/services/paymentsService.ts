import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import { Payment } from '../types/database';
import { localDb } from './dbStorage';

export async function getPayments(saleId?: string): Promise<Payment[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('payments').select('*').order('created_at', { ascending: false });
      if (saleId) {
        query = query.eq('sale_id', saleId);
      }
      const { data, error } = await query;
      if (!error && data) return data as Payment[];
    } catch (err) {
      console.warn('Supabase getPayments failed, using local DB:', err);
    }
  }

  return localDb.getPayments(saleId);
}
