import React, { useMemo, useState } from 'react';
import {
  Boxes,
  Calendar,
  Filter,
  History,
  Package,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getStockMovements } from '../../services/stockMovementsService';
import { MovementType, StockMovement } from '../../types/database';
import { EmptyState } from '../common/EmptyState';

export function StockHistoryView() {
  const { dataVersion } = useData();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | MovementType>('All');

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await getStockMovements();
        setMovements(list);
      } catch (err) {
        console.error('Failed to load stock movements', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dataVersion]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesProduct = m.product?.name.toLowerCase().includes(q);
        const matchesSku = m.product?.sku.toLowerCase().includes(q);
        const matchesReason = m.reason.toLowerCase().includes(q);
        if (!matchesProduct && !matchesSku && !matchesReason) return false;
      }
      if (typeFilter !== 'All' && m.movement_type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [movements, search, typeFilter]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
          Stock Movement History
        </h1>
        <p className="text-xs md:text-sm text-stone-500 mt-0.5">
          Complete audit trail of all warehouse inventory additions, sales deductions, and adjustments.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or movement reason..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['All', 'Received', 'Sale', 'Adjustment'] as const).map((type) => {
            const isActive = typeFilter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {type === 'All' ? 'All Movements' : type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400 animate-pulse">
            Loading stock movement audit logs...
          </div>
        ) : filteredMovements.length === 0 ? (
          movements.length === 0 ? (
            <EmptyState
              icon={<History className="w-8 h-8 text-stone-400" />}
              title="No stock history records"
              description="Stock adjustments, receipts, and sales deductions will automatically log here."
            />
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-stone-800">No matching movement records</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('All');
                }}
                className="mt-3 px-3 py-1 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg font-medium"
              >
                Reset Filters
              </button>
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Product</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4 text-center">Quantity Delta</th>
                  <th className="py-3.5 px-4 text-center">Stock Transition</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4 text-right">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMovements.map((m) => {
                  const isReceived = m.movement_type === 'Received';
                  const isSale = m.movement_type === 'Sale';

                  return (
                    <tr key={m.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Product */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-stone-900">
                          {m.product?.name || 'Deleted Product'}
                        </div>
                        <div className="text-[11px] font-mono text-stone-400">
                          {m.product?.sku} • {m.product?.category}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            isReceived
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isSale
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isReceived ? (
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                          )}
                          {m.movement_type === 'Received'
                            ? 'Stock Received'
                            : m.movement_type === 'Sale'
                            ? 'Sale'
                            : 'Adjustment'}
                        </span>
                      </td>

                      {/* Quantity Delta */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold text-sm ${
                            m.quantity > 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </span>
                      </td>

                      {/* Stock Transition: 20 -> 70 */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-stone-500">{m.previous_quantity}</span>
                        <span className="text-stone-400 mx-1.5">→</span>
                        <span className="font-bold text-stone-900">{m.new_quantity}</span>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-4 text-stone-700 max-w-xs">
                        {m.reason}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        •{' '}
                        {new Date(m.created_at).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 text-right font-medium text-stone-700">
                        {m.recorded_by}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
