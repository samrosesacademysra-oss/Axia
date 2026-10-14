import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Calendar,
  Clock,
  History,
  Package,
  Pencil,
  Plus,
  Tag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { readPackDetails } from '../../lib/packDetails';
import { getStockMovements } from '../../services/stockMovementsService';
import { Product, StockMovement, StockStatus } from '../../types/database';
import { CategoryBadge, StockBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenReceiveStock: (product: Product) => void;
  onEditProduct: (product: Product) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onOpenReceiveStock,
  onEditProduct,
}: ProductDetailModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      setLoadingMovements(true);
      getStockMovements({ productId: product.id })
        .then((data) => setMovements(data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingMovements(false));
    }
  }, [product, isOpen]);

  if (!product) return null;

  const pack = readPackDetails(product.description);
  const cartonPrice = pack.cartonPrice === '' ? null : Number(pack.cartonPrice);

  const stockStatus: StockStatus =
    product.stock_quantity === 0
      ? 'Out of Stock'
      : product.stock_quantity <= product.low_stock_threshold
      ? 'Low Stock'
      : 'In Stock';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Specification & Stock"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200/80">
          <div className="w-20 h-20 rounded-xl bg-white border border-stone-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-8 h-8 text-stone-400" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CategoryBadge category={product.category} />
              <StockBadge status={stockStatus} />
            </div>
            <h2 className="text-base font-bold text-stone-900 leading-tight">
              {product.name}
            </h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              {product.description || 'No detailed description provided for this product.'}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
          <button
            type="button"
            onClick={() => onEditProduct(product)}
            className="px-3.5 py-2 text-xs font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenReceiveStock(product);
            }}
            className="sm:self-center px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Receive Stock
          </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white border border-stone-200 rounded-lg">
            <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-0.5">
              Carton price
            </span>
            <span className="text-xl font-bold font-mono text-stone-900">
              {cartonPrice === null || Number.isNaN(cartonPrice)
                ? '—'
                : `GHS ${cartonPrice.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span className="text-[10px] text-stone-500 block">per carton</span>
          </div>

          <div className="p-3 bg-white border border-stone-200 rounded-lg">
            <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-0.5">
              Total carton
            </span>
            <span className="text-xl font-bold font-mono text-stone-900">
              {pack.cartonCount || '—'}
            </span>
            <span className="text-[10px] text-stone-500 block">cartons on hand</span>
          </div>

          <div className="p-3 bg-white border border-stone-200 rounded-lg">
            <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-0.5">
              Total pieces
            </span>
            <span className="text-xl font-bold font-mono text-stone-900">
              {product.stock_quantity}
            </span>
            <span className="text-[10px] text-stone-500 block">
              GHS {product.selling_price.toFixed(2)} per piece
            </span>
          </div>

          <div className="p-3 bg-white border border-stone-200 rounded-lg">
            <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-0.5">
              Low Stock Level
            </span>
            <span className="text-xl font-bold font-mono text-stone-900">
              {product.low_stock_threshold}
            </span>
            <span className="text-[10px] text-stone-500 block">alert threshold</span>
          </div>
        </div>

        {/* Metadata info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-200/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>Date Added: {new Date(product.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>Last Updated: {new Date(product.updated_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Recent Inventory Activity */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-stone-500" />
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Stock Movement History
            </h4>
          </div>

          {loadingMovements ? (
            <div className="py-6 text-center text-xs text-stone-400 animate-pulse">
              Loading inventory movement logs...
            </div>
          ) : movements.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-lg">
              No stock movements recorded yet for this product.
            </div>
          ) : (
            <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100 max-h-56 overflow-y-auto">
              {movements.map((m) => (
                <div key={m.id} className="p-3 text-xs flex items-center justify-between hover:bg-stone-50/70">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-md ${
                        m.movement_type === 'Received'
                          ? 'bg-emerald-50 text-emerald-700'
                          : m.movement_type === 'Sale'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {m.movement_type === 'Received' ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-stone-900">{m.movement_type}</span>
                      <p className="text-[11px] text-stone-500 mt-0.5">{m.reason}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-stone-900">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {m.previous_quantity} → {m.new_quantity} • by {m.recorded_by}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
