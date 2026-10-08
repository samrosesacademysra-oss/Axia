import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createProduct } from '../../services/productsService';
import { PRODUCT_CATEGORIES, ProductCategory } from '../../types/database';
import { Modal } from '../common/Modal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const { user } = useAuth();
  const { refreshData } = useData();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Personal Care');
  const [imageUrl, setImageUrl] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!sku.trim()) {
      setError('SKU is required.');
      return;
    }
    const sell = parseFloat(sellingPrice);
    if (isNaN(sell) || sell < 0) {
      setError('Please provide a valid selling price.');
      return;
    }

    try {
      setSubmitting(true);
      await createProduct({
        name,
        sku,
        category,
        image_url: imageUrl.trim() || null,
        selling_price: sell,
        cost_price: parseFloat(costPrice) || 0,
        initial_stock: parseInt(initialStock, 10) || 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        description,
        recorded_by: user?.name || 'Admin',
      });

      refreshData();
      onClose();
      // Reset form
      setName('');
      setSku('');
      setSellingPrice('');
      setCostPrice('');
      setInitialStock('0');
      setLowStockThreshold('5');
      setDescription('');
      setImageUrl('');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Product"
      description="Add a new catalog product to Axia Distributions inventory."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ocean Mist Eau de Parfum"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              SKU (Stock Keeping Unit) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AX-FR-004"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>

          {/* Category - strictly 3 categories */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            >
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Selling Price (GHS) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">
                GHS
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="120.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full pl-11 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
              />
            </div>
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Cost Price (GHS)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">
                GHS
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="75.00"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full pl-11 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
              />
            </div>
          </div>

          {/* Initial Stock */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Initial Stock Units
            </label>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>

          {/* Low Stock Threshold */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              min="1"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
            <span className="text-[10px] text-stone-400 mt-0.5 block">
              Triggers alert when stock is at or below this value.
            </span>
          </div>

          {/* Image URL */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Image URL (optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/product-image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Description (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Fragrance notes, ingredients, or diffuser bottle specifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            {submitting ? 'Creating...' : '+ Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
