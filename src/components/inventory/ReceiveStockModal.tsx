import React, { useEffect, useState } from 'react';
import { ArrowRight, Boxes, Package, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { getProducts, receiveStock } from '../../services/productsService';
import { Product } from '../../types/database';
import { Modal } from '../common/Modal';

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProduct?: Product | null;
}

export function ReceiveStockModal({
  isOpen,
  onClose,
  defaultProduct,
}: ReceiveStockModalProps) {
  const { user } = useAuth();
  const { refreshData } = useData();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getProducts().then((data) => {
        setProducts(data);
        if (defaultProduct) {
          setSelectedProductId(defaultProduct.id);
        } else if (data.length > 0 && !selectedProductId) {
          setSelectedProductId(data[0].id);
        }
      });
    }
  }, [isOpen, defaultProduct]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const qtyNumber = parseInt(quantity, 10) || 0;
  const currentStock = selectedProduct ? selectedProduct.stock_quantity : 0;
  const newStock = currentStock + (qtyNumber > 0 ? qtyNumber : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProductId) {
      setError('Please select a product.');
      return;
    }
    if (qtyNumber <= 0) {
      setError('Received quantity must be at least 1.');
      return;
    }

    try {
      setSubmitting(true);
      await receiveStock({
        productId: selectedProductId,
        quantity: qtyNumber,
        supplier: supplier.trim() || undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        recorded_by: user?.name || 'Admin',
      });

      refreshData();
      onClose();
      setQuantity('');
      setSupplier('');
      setReference('');
      setNotes('');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update stock.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Stock"
      description="Record incoming shipment intake and automatically update warehouse stock."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Product selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Product *
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
          >
            <option value="" disabled>
              Select a product
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category}) — Current Stock: {p.stock_quantity}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Math Preview Box */}
        {selectedProduct && (
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                Current Stock
              </span>
              <span className="text-lg font-mono font-bold text-stone-700">
                {currentStock}
              </span>
            </div>

            <div className="flex items-center gap-2 text-stone-400">
              <span className="text-xs font-bold text-emerald-600">
                +{qtyNumber > 0 ? qtyNumber : 0}
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="text-right">
              <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">
                New Stock
              </span>
              <span className="text-xl font-mono font-bold text-stone-900">
                {newStock}
              </span>
            </div>
          </div>
        )}

        {/* Quantity Received */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Quantity Received *
          </label>
          <input
            type="number"
            min="1"
            required
            placeholder="e.g. 50"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
          />
        </div>

        {/* Supplier & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Supplier (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Accra Fragrance Importers"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Reference / Invoice # (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. INV-8849"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Notes / Batch details (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Batch #401 arrived in good condition."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
          />
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
            disabled={submitting || qtyNumber <= 0}
            className="px-4 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            {submitting ? 'Updating...' : 'Confirm Stock Intake'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
