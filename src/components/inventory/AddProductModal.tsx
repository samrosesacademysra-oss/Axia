import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createProduct, updateProduct } from '../../services/productsService';
import { readPackDetails, stripPackDetails, writePackDetails } from '../../lib/packDetails';
import { PRODUCT_CATEGORIES, Product, ProductCategory } from '../../types/database';
import { Modal } from '../common/Modal';
import type { InventoryPriceMode } from './InventoryView';

function readProductPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose a picture file.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that picture.'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxSide = 800;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not prepare that picture.'));
          return;
        }
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => reject(new Error('Could not open that picture.'));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  priceMode?: InventoryPriceMode;
}

export function AddProductModal({ isOpen, onClose, product, priceMode = 'wholesale' }: AddProductModalProps) {
  const { user } = useAuth();
  const { refreshData } = useData();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Personal Care');
  const [imageUrl, setImageUrl] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
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
  const isWholesaleEdit = isEditing && priceMode === 'wholesale';
  const unitPriceValue = Number(sellingPrice);
  const totalPiecesValue = Number(initialStock);
  const cartonPriceValue = Number(cartonPrice);
  const cartonCountValue = Number(cartonCount);
  const wholesaleAmount =
    cartonPrice !== '' &&
    cartonCount !== '' &&
    !Number.isNaN(cartonPriceValue) &&
    !Number.isNaN(cartonCountValue)
      ? cartonPriceValue * cartonCountValue
      : null;
  const retailAmount =
    sellingPrice !== '' &&
    initialStock !== '' &&
    !Number.isNaN(unitPriceValue) &&
    !Number.isNaN(totalPiecesValue)
      ? unitPriceValue * totalPiecesValue
      : null;
  const totalAmount = isWholesaleEdit ? wholesaleAmount : retailAmount;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setImageUrl(product.image_url || '');
      const pack = readPackDetails(product.description);
      setSellingPrice(String(product.selling_price));
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
    setInitialStock('');
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
    const sell = isWholesaleEdit && product ? product.selling_price : parseFloat(sellingPrice);
    if (!isWholesaleEdit && (Number.isNaN(sell) || sell < 0)) {
      setError('Please provide a valid unit price.');
      return;
    }
    if (!isEditing && (initialStock === '' || Number.isNaN(Number(initialStock)) || Number(initialStock) < 0)) {
      setError('Total pieces cannot be negative.');
      return;
    }
    if ((!isEditing || isWholesaleEdit) && cartonUnit && (Number.isNaN(Number(cartonUnit)) || Number(cartonUnit) <= 0)) {
      setError('Pieces per carton must be greater than zero.');
      return;
    }
    if ((!isEditing || isWholesaleEdit) && (cartonPrice === '' || Number.isNaN(Number(cartonPrice)) || Number(cartonPrice) < 0)) {
      setError('Please provide a valid carton price.');
      return;
    }
    if ((!isEditing || isWholesaleEdit) && (cartonCount === '' || Number.isNaN(Number(cartonCount)) || Number(cartonCount) < 0)) {
      setError('Total cartons cannot be negative.');
      return;
    }

    try {
      setSubmitting(true);
      const savedDescription = writePackDetails(description, {
        cartonCount,
        unitsPerCarton: cartonUnit,
        loosePieces,
        cartonPrice,
      });
      const shared = {
        name,
        category,
        image_url: imageUrl.trim() || null,
        selling_price: sell,
        cost_price: isEditing && product ? product.cost_price : 0,
        low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
        description: savedDescription,
        recorded_by: user?.name || 'Admin',
      };
      if (product) {
        const piecesPerCarton = Number(cartonUnit);
        const cartons = Number(cartonCount);
        const loose = Number(loosePieces) || 0;
        const wholesaleStock =
          piecesPerCarton > 0 && cartonCount !== '' && !Number.isNaN(cartons)
            ? Math.max(0, Math.round(cartons * piecesPerCarton + loose))
            : product.stock_quantity;
        await updateProduct({
          ...shared,
          id: product.id,
          stock_quantity: isWholesaleEdit ? wholesaleStock : parseInt(initialStock, 10) || 0,
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
          ? isWholesaleEdit
            ? 'Update the carton price, pieces per carton, and total cartons.'
            : 'Update the unit price and total pieces.'
          : 'Enter the wholesale carton details and the retail piece details.'
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

          {isEditing && !isWholesaleEdit && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Unit Price (GHS) *
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
          )}

          {!isEditing && (
            <>
              <div className="sm:col-span-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Wholesale</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Carton price (GHS) *
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
                    placeholder="540.00"
                    value={cartonPrice}
                    onChange={(e) => setCartonPrice(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Pieces per carton
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="36"
                  value={cartonUnit}
                  onChange={(e) => setCartonUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Total carton *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="6"
                  value={cartonCount}
                  onChange={(e) => setCartonCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                />
              </div>
              <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-xs font-semibold text-stone-700">Wholesale total</span>
                <span className="mt-1 block font-mono text-lg font-bold text-stone-900">
                  {wholesaleAmount === null ? '—' : `GHS ${wholesaleAmount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <span className="mt-0.5 block text-[10px] text-stone-400">Carton price × Total carton</span>
              </div>
              <div className="sm:col-span-2 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Retail shop</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Unit price (GHS) *
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
                    placeholder="15.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Total pieces *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="216"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                />
              </div>
              <div className="sm:col-span-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                <span className="block text-xs font-semibold text-stone-700">Retail total</span>
                <span className="mt-1 block font-mono text-lg font-bold text-stone-900">
                  {retailAmount === null ? '—' : `GHS ${retailAmount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <span className="mt-0.5 block text-[10px] text-stone-400">Unit price × Total pieces</span>
              </div>
            </>
          )}

          {isWholesaleEdit && (
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
                    required
                    placeholder="540.00"
                    value={cartonPrice}
                    onChange={(e) => setCartonPrice(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Pieces per carton
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="36"
                  value={cartonUnit}
                  onChange={(e) => setCartonUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Total carton
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="6"
                  value={cartonCount}
                  onChange={(e) => setCartonCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                />
              </div>
            </>
          )}

          {isEditing && !isWholesaleEdit && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Total Pieces
              </label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
              />
            </div>
          )}

          {isEditing && (
            <div className="sm:col-span-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
              <span className="block text-xs font-semibold text-stone-700">Total amount</span>
              <span className="mt-1 block font-mono text-lg font-bold text-stone-900">
                {totalAmount === null ? '—' : `GHS ${totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <span className="mt-0.5 block text-[10px] text-stone-400">
                {isWholesaleEdit ? 'Carton price × Total carton' : 'Unit price × Total pieces'}
              </span>
            </div>
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

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Product photo (optional)
            </label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400">
                    No photo
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    try {
                      setImageUrl(await readProductPhoto(file));
                      setError(null);
                    } catch (err: unknown) {
                      setError((err as Error).message || 'Could not use that picture.');
                    }
                  }}
                  className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="mt-2 text-xs font-medium text-stone-500 hover:text-stone-900"
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
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
