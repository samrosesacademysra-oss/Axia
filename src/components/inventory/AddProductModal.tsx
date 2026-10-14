import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createProduct, updateProduct } from '../../services/productsService';
import { readPackDetails, stripPackDetails, writePackDetails } from '../../lib/packDetails';
import { PRODUCT_CATEGORIES, Product, ProductCategory } from '../../types/database';
import { Modal } from '../common/Modal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function AddProductModal({ isOpen, onClose, product }: AddProductModalProps) {
  const { user } = useAuth();
  const { refreshData } = useData();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Personal Care');
  const [imageUrl, setImageUrl] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [initialStock, setInitialStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [description, setDescription] = useState('');
  const [cartonUnit, setCartonUnit] = useState('');
  const [cartonPrice, setCartonPrice] = useState('');
  const [cartonCount, setCartonCount] = useState('');
  const [loosePieces, setLoosePieces] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(product);
  const unitPriceValue = Number(sellingPrice);
  const totalPiecesValue = Number(initialStock);
  const totalAmount =
    sellingPrice !== '' &&
    initialStock !== '' &&
    !Number.isNaN(unitPriceValue) &&
    !Number.isNaN(totalPiecesValue)
      ? unitPriceValue * totalPiecesValue
      : null;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setImageUrl(product.image_url || '');
      const pack = readPackDetails(product.description);
      setSellingPrice(String(product.selling_price));
      setCostPrice(String(product.cost_price));
      setInitialStock(String(product.stock_quantity));
      setLowStockThreshold(String(product.low_stock_threshold));
      setCartonUnit(pack.unitsPerCarton);
      setCartonPrice(pack.cartonPrice);
      setCartonCount(pack.cartonCount);
      setLoosePieces(pack.loosePieces);
      setDescription(stripPackDetails(product.description || ''));
      return;
    }
    setName('');
    setCategory('Personal Care');
    setImageUrl('');
    setSellingPrice('');
    setCostPrice('');
    setInitialStock('0');
    setLowStockThreshold('5');
    setDescription('');
    setCartonUnit('');
    setCartonPrice('');
    setCartonCount('');
    setLoosePieces('');
  }, [isOpen, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    const sell = parseFloat(sellingPrice);
    if (isNaN(sell) || sell < 0) {
      setError('Please provide a valid unit price.');
      return;
    }
    if (isEditing && cartonUnit && (Number.isNaN(Number(cartonUnit)) || Number(cartonUnit) <= 0)) {
      setError('Carton unit must be greater than zero.');
      return;
    }
    if (isEditing && cartonPrice && (Number.isNaN(Number(cartonPrice)) || Number(cartonPrice) < 0)) {
      setError('Please provide a valid carton price.');
      return;
    }
    if (isEditing && cartonCount && (Number.isNaN(Number(cartonCount)) || Number(cartonCount) < 0)) {
      setError('Total cartons cannot be negative.');
      return;
    }

    try {
      setSubmitting(true);
      const savedDescription = isEditing
        ? writePackDetails(description, { cartonCount, unitsPerCarton: cartonUnit, loosePieces, cartonPrice })
        : description;
      const shared = {
        name,
        category,
        image_url: imageUrl.trim() || null,
        selling_price: sell,
        cost_price: isEditing && product ? product.cost_price : parseFloat(costPrice) || 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        description: savedDescription,
        recorded_by: user?.name || 'Admin',
      };
      if (product) {
        await updateProduct({
          ...shared,
          id: product.id,
          stock_quantity: parseInt(initialStock, 10) || 0,
        });
      } else {
        await createProduct({
          ...shared,
          initial_stock: parseInt(initialStock, 10) || 0,
        });
      }

      refreshData();
      onClose();
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
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      description={
        isEditing
          ? 'Update the unit price, total pieces, carton price, and total cartons.'
          : 'Add a new catalog product to Axia Distributions inventory.'
      }
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
              {isEditing ? 'Unit Price (GHS) *' : 'Selling Price (GHS) *'}
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

          {!isEditing && (
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
          )}

          {/* Initial Stock */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {isEditing ? 'Total Pieces' : 'Initial Stock Units'}
            </label>
            <input
              type="number"
              min="0"
              value={initialStock}
              onChange={(e) => setInitialStock(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>

          {isEditing && (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Carton price (GHS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">
                    GHS
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="540.00"
                    value={cartonPrice}
                    onChange={(e) => setCartonPrice(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Total carton
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="6"
                  value={cartonCount}
                  onChange={(e) => setCartonCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                />
              </div>
              <div className="sm:col-span-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-xs font-semibold text-stone-700">Total amount</span>
                <span className="mt-1 block font-mono text-lg font-bold text-stone-900">
                  {totalAmount === null ? '—' : `GHS ${totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <span className="mt-0.5 block text-[10px] text-stone-400">
                  Unit Price × Total Pieces
                </span>
                <span className="mt-2 block text-xs font-semibold text-stone-700">
                  Total carton: <span className="font-mono">{cartonCount || '—'}</span>
                </span>
              </div>
            </>
          )}

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
            {submitting ? 'Saving...' : isEditing ? 'Save changes' : '+ Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
