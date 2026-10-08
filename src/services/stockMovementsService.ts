import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import { MovementType, StockMovement } from '../types/database';
import { localDb } from './dbStorage';
import { getProducts } from './productsService';

export async function getStockMovements(options?: {
  productId?: string;
  movementType?: MovementType;
  search?: string;
}): Promise<StockMovement[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('stock_movements')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false });

      if (options?.productId) {
        query = query.eq('product_id', options.productId);
      }
      if (options?.movementType) {
        query = query.eq('movement_type', options.movementType);
      }

      const { data, error } = await query;
      if (!error && data) {
        let result = data as StockMovement[];
        if (options?.search) {
          const q = options.search.toLowerCase();
          result = result.filter(
            (m) =>
              m.product?.name.toLowerCase().includes(q) ||
              m.product?.sku.toLowerCase().includes(q) ||
              m.reason.toLowerCase().includes(q)
          );
        }
        return result;
      }
    } catch (err) {
      console.warn('Supabase getStockMovements failed, falling back to local DB:', err);
    }
  }

  const raw = localDb.getStockMovements(options?.productId);
  const products = await getProducts();

  let hydrated: StockMovement[] = raw.map((m) => ({
    ...m,
    product: products.find((p) => p.id === m.product_id),
  }));

  if (options?.movementType) {
    hydrated = hydrated.filter((m) => m.movement_type === options.movementType);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    hydrated = hydrated.filter(
      (m) =>
        m.product?.name.toLowerCase().includes(q) ||
        m.product?.sku.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q)
    );
  }

  hydrated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return hydrated;
}
