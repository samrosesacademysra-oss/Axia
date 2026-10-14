import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import { Product, ProductCategory, StockMovement } from '../types/database';
import { localDb, SAMPLE_PRODUCTS } from './dbStorage';

let openingInventoryTask: Promise<void> | null = null;
let useSupabaseInventory = false;

/** Load the stock-sheet catalog once, into Supabase when that database is ready, otherwise locally. */
export function ensureOpeningInventory(): Promise<void> {
  if (!openingInventoryTask) {
    openingInventoryTask = applyOpeningInventory();
  }
  return openingInventoryTask;
}

async function applyOpeningInventory(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: existing, error } = await supabase.from('products').select('sku');
      if (error) throw error;

      const have = new Set((existing || []).map((row) => row.sku as string));
      const missing = SAMPLE_PRODUCTS.filter((product) => !have.has(product.sku));

      if (missing.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('products')
          .insert(
            missing.map((product) => ({
              sku: product.sku,
              name: product.name,
              category: product.category,
              image_url: product.image_url,
              selling_price: product.selling_price,
              cost_price: product.cost_price,
              stock_quantity: product.stock_quantity,
              low_stock_threshold: product.low_stock_threshold,
              description: product.description,
            }))
          )
          .select('id, stock_quantity');

        if (insertError) throw insertError;

        if (inserted && inserted.length > 0) {
          const { error: movementError } = await supabase.from('stock_movements').insert(
            inserted.map((row) => ({
              product_id: row.id,
              movement_type: 'Received',
              quantity: row.stock_quantity,
              previous_quantity: 0,
              new_quantity: row.stock_quantity,
              reason: 'Opening inventory from grouped summary',
              recorded_by: 'Admin',
            }))
          );
          if (movementError) {
            console.warn('Opening stock movements were not saved:', movementError);
          }
        }
      }

      useSupabaseInventory = true;
      return;
    } catch (err) {
      console.warn('Opening inventory saved locally because Supabase is not ready:', err);
    }
  }

  localDb.loadOpeningInventory();
  useSupabaseInventory = false;
}

export interface CreateProductInput {
  name: string;
  category: ProductCategory;
  image_url?: string | null;
  selling_price: number;
  cost_price: number;
  initial_stock: number;
  low_stock_threshold: number;
  description?: string | null;
  recorded_by?: string;
}

export interface UpdateProductInput {
  id: string;
  name: string;
  category: ProductCategory;
  image_url?: string | null;
  selling_price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  description?: string | null;
  recorded_by?: string;
}

export interface ReceiveStockInput {
  productId: string;
  quantity: number;
  supplier?: string;
  reference?: string;
  notes?: string;
  recorded_by?: string;
}

export async function getProducts(options?: {
  category?: ProductCategory;
  search?: string;
}): Promise<Product[]> {
  await ensureOpeningInventory();

  if (useSupabaseInventory && isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.search) {
        query = query.ilike('name', `%${options.search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data as Product[]) || [];
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local DB:', err);
    }
  }

  let products = localDb.getProducts();
  if (options?.category) {
    products = products.filter((p) => p.category === options.category);
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(q));
  }
  return products;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Product;
    } catch (err) {
      console.warn('Supabase getProductById failed, using local DB:', err);
    }
  }

  const products = localDb.getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`;

  const newProduct: Product = {
    id,
    sku: `AX-${id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
    name: input.name.trim(),
    category: input.category,
    image_url: input.image_url || null,
    selling_price: Number(input.selling_price),
    cost_price: Number(input.cost_price || 0),
    stock_quantity: Math.max(0, Number(input.initial_stock || 0)),
    low_stock_threshold: Math.max(0, Number(input.low_stock_threshold || 5)),
    description: input.description?.trim() || null,
    created_at: now,
    updated_at: now,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          sku: newProduct.sku,
          name: newProduct.name,
          category: newProduct.category,
          image_url: newProduct.image_url,
          selling_price: newProduct.selling_price,
          cost_price: newProduct.cost_price,
          stock_quantity: newProduct.stock_quantity,
          low_stock_threshold: newProduct.low_stock_threshold,
          description: newProduct.description,
        })
        .select()
        .single();

      if (error) throw error;

      // Also record initial stock movement if initial_stock > 0
      if (newProduct.stock_quantity > 0) {
        await supabase.from('stock_movements').insert({
          product_id: data.id,
          movement_type: 'Received',
          quantity: newProduct.stock_quantity,
          previous_quantity: 0,
          new_quantity: newProduct.stock_quantity,
          reason: 'Initial product stock intake',
          recorded_by: input.recorded_by || 'Admin',
        });
      }

      return data as Product;
    } catch (err) {
      console.warn('Supabase insert failed, saving to local DB:', err);
    }
  }

  // Local fallback
  localDb.saveProduct(newProduct);
  if (newProduct.stock_quantity > 0) {
    const movement: StockMovement = {
      id: crypto.randomUUID ? crypto.randomUUID() : `sm-${Date.now()}`,
      product_id: newProduct.id,
      movement_type: 'Received',
      quantity: newProduct.stock_quantity,
      previous_quantity: 0,
      new_quantity: newProduct.stock_quantity,
      reason: 'Initial product stock intake',
      recorded_by: input.recorded_by || 'Admin',
      created_at: now,
    };
    localDb.saveStockMovement(movement);
  }

  return newProduct;
}

export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  const existing = await getProductById(input.id);
  if (!existing) {
    throw new Error('Product not found');
  }

  const now = new Date().toISOString();
  const nextStock = Math.max(0, Number(input.stock_quantity || 0));
  const recordedBy = input.recorded_by || 'Admin';
  const updated: Product = {
    ...existing,
    name: input.name.trim(),
    category: input.category,
    image_url: input.image_url || null,
    selling_price: Number(input.selling_price),
    cost_price: Number(input.cost_price || 0),
    stock_quantity: nextStock,
    low_stock_threshold: Math.max(0, Number(input.low_stock_threshold || 0)),
    description: input.description?.trim() || null,
    updated_at: now,
  };
  const stockDelta = nextStock - existing.stock_quantity;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          name: updated.name,
          category: updated.category,
          image_url: updated.image_url,
          selling_price: updated.selling_price,
          cost_price: updated.cost_price,
          stock_quantity: updated.stock_quantity,
          low_stock_threshold: updated.low_stock_threshold,
          description: updated.description,
          updated_at: now,
        })
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;

      if (stockDelta !== 0) {
        await supabase.from('stock_movements').insert({
          product_id: input.id,
          movement_type: 'Adjustment',
          quantity: stockDelta,
          previous_quantity: existing.stock_quantity,
          new_quantity: nextStock,
          reason: 'Inventory quantity edited',
          recorded_by: recordedBy,
        });
      }

      return data as Product;
    } catch (err) {
      console.warn('Supabase update failed, saving to local DB:', err);
    }
  }

  localDb.saveProduct(updated);
  if (stockDelta !== 0) {
    localDb.saveStockMovement({
      id: crypto.randomUUID ? crypto.randomUUID() : `sm-${Date.now()}`,
      product_id: updated.id,
      movement_type: 'Adjustment',
      quantity: stockDelta,
      previous_quantity: existing.stock_quantity,
      new_quantity: nextStock,
      reason: 'Inventory quantity edited',
      recorded_by: recordedBy,
      created_at: now,
    });
  }

  return updated;
}

export async function receiveStock(input: ReceiveStockInput): Promise<Product> {
  const product = await getProductById(input.productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const quantityToAdd = Number(input.quantity);
  if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
    throw new Error('Quantity must be greater than zero');
  }

  const previousQuantity = product.stock_quantity;
  const newQuantity = previousQuantity + quantityToAdd;
  const now = new Date().toISOString();
  const recordedBy = input.recorded_by || 'Admin';

  const reasonParts = ['Stock received'];
  if (input.supplier) reasonParts.push(`from ${input.supplier}`);
  if (input.reference) reasonParts.push(`(Ref: ${input.reference})`);
  if (input.notes) reasonParts.push(`- ${input.notes}`);
  const reasonText = reasonParts.join(' ');

  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Update product stock
      const { data, error: updateError } = await supabase
        .from('products')
        .update({
          stock_quantity: newQuantity,
          updated_at: now,
        })
        .eq('id', product.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // 2. Record movement
      await supabase.from('stock_movements').insert({
        product_id: product.id,
        movement_type: 'Received',
        quantity: quantityToAdd,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        reason: reasonText,
        recorded_by: recordedBy,
      });

      return data as Product;
    } catch (err) {
      console.warn('Supabase receiveStock failed, using local DB:', err);
    }
  }

  // Local fallback
  localDb.updateProductStock(product.id, newQuantity);
  const movement: StockMovement = {
    id: crypto.randomUUID ? crypto.randomUUID() : `sm-${Date.now()}`,
    product_id: product.id,
    movement_type: 'Received',
    quantity: quantityToAdd,
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    reason: reasonText,
    recorded_by: recordedBy,
    created_at: now,
  };
  localDb.saveStockMovement(movement);

  return {
    ...product,
    stock_quantity: newQuantity,
    updated_at: now,
  };
}
