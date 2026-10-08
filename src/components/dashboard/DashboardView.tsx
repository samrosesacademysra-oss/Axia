import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDollarSign,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getDashboardStats } from '../../services/dashboardService';
import { localDb } from '../../services/dbStorage';
import { DashboardStats, Product, ProductCategory } from '../../types/database';
import { EmptyState } from '../common/EmptyState';

interface DashboardViewProps {
  onNavigateToInventory: (categoryFilter?: ProductCategory) => void;
  onOpenNewSale: () => void;
  onOpenReceiveStock: () => void;
  onOpenAddProduct: () => void;
  onSelectProductDetails: (product: Product) => void;
}

export function DashboardView({
  onNavigateToInventory,
  onOpenNewSale,
  onOpenReceiveStock,
  onOpenAddProduct,
  onSelectProductDetails,
}: DashboardViewProps) {
  const { dataVersion, refreshData } = useData();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const res = await getDashboardStats();
        setStats(res);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [dataVersion]);

  const handleSeedDemo = () => {
    localDb.seedSampleData();
    refreshData();
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-stone-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const hasNoData = !stats || stats.totalProducts === 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Overview of current stock, today's sales, and category inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewSale}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Sale</span>
          </button>
          <button
            type="button"
            onClick={onOpenReceiveStock}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors shadow-xs"
          >
            <TrendingUp className="w-4 h-4 text-stone-500" />
            <span>Receive Stock</span>
          </button>
        </div>
      </div>

      {hasNoData ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-stone-400" />}
          title="No products yet"
          description="Your Axia Distributions inventory is currently empty. Add your first product or load the starter catalog to begin tracking stock and sales."
          actionLabel="+ Add Product"
          onAction={onOpenAddProduct}
          secondaryActionLabel="Load Starter Catalog"
          onSecondaryAction={handleSeedDemo}
        />
      ) : (
        <>
          {/* Section 4: Four main summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Products */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Products</span>
                <div className="p-2 bg-stone-50 text-stone-700 rounded-lg">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-900 tracking-tight">
                {stats.totalProducts}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Active catalog items
              </div>
            </div>

            {/* Total Stock */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Stock</span>
                <div className="p-2 bg-stone-50 text-stone-700 rounded-lg">
                  <Boxes className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-900 tracking-tight">
                {stats.totalStock.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Units available in warehouse
              </div>
            </div>

            {/* Today's Sales */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Today's Sales</span>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <CircleDollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-stone-900 tracking-tight">
                GHS {stats.todaySalesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                Transactions processed today
              </div>
            </div>

            {/* Low Stock */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-stone-500 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Low Stock</span>
                <div className={`p-2 rounded-lg ${stats.lowStockCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-stone-50 text-stone-500'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-stone-900'}`}>
                  {stats.lowStockCount}
                </span>
                <span className="text-xs text-stone-500">items</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                {stats.lowStockCount > 0 ? 'Requires stock replenishment' : 'All items sufficiently stocked'}
              </div>
            </div>
          </div>

          {/* Section 4: Three Categories Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
                  Product Categories
                </h2>
                <p className="text-xs text-stone-500">
                  Axia Distributions operates exclusively across these 3 categories. Click any category to filter inventory.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.categorySummary.map((cat) => {
                const colors = {
                  'Personal Care': {
                    border: 'hover:border-sky-300',
                    badge: 'bg-sky-50 text-sky-700 border-sky-200',
                    indicator: 'bg-sky-500',
                  },
                  Fragrances: {
                    border: 'hover:border-purple-300',
                    badge: 'bg-purple-50 text-purple-700 border-purple-200',
                    indicator: 'bg-purple-500',
                  },
                  Diffusers: {
                    border: 'hover:border-teal-300',
                    badge: 'bg-teal-50 text-teal-700 border-teal-200',
                    indicator: 'bg-teal-500',
                  },
                }[cat.category];

                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => onNavigateToInventory(cat.category)}
                    className={`group text-left p-5 bg-white border border-stone-200/80 rounded-xl transition-all hover:shadow-sm ${colors.border}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold border ${colors.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.indicator}`}></span>
                        {cat.category}
                      </span>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-stone-100">
                      <div>
                        <div className="text-[11px] text-stone-500">Products</div>
                        <div className="text-lg font-bold text-stone-900">
                          {cat.productCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-stone-500">Available Units</div>
                        <div className="text-lg font-bold text-stone-900">
                          {cat.stockUnits}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 19: Low Stock Alerts & Recent Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-700 rounded-md">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">Low Stock Alerts</h3>
                    <p className="text-[11px] text-stone-500">Items at or below replenishment threshold</p>
                  </div>
                </div>
                {stats.lowStockProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={onOpenReceiveStock}
                    className="text-xs font-medium text-stone-900 hover:underline"
                  >
                    + Receive Stock
                  </button>
                )}
              </div>

              {stats.lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  <span className="block text-emerald-600 font-medium mb-1">✓ No low-stock products</span>
                  All catalog inventory is currently above minimum safety thresholds.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {stats.lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="py-3 flex items-center justify-between hover:bg-stone-50/70 px-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => onSelectProductDetails(p)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-stone-900 leading-tight">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {p.category} • SKU: {p.sku}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-block text-xs font-bold ${p.stock_quantity === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                          {p.stock_quantity === 0 ? '0 remaining' : `${p.stock_quantity} remaining`}
                        </span>
                        <p className="text-[10px] text-stone-400">
                          Threshold: {p.low_stock_threshold}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sales Activity */}
            <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-stone-100 text-stone-700 rounded-md">
                    <CircleDollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-stone-900">Recent Sales</h3>
                    <p className="text-[11px] text-stone-500">Latest completed customer transactions</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenNewSale}
                  className="text-xs font-medium text-stone-900 hover:underline"
                >
                  + New Sale
                </button>
              </div>

              {stats.recentSales.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  <span className="block text-stone-600 font-medium mb-1">No sales recorded</span>
                  Record sales to see real-time transaction updates here.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {stats.recentSales.map((sale) => (
                    <div key={sale.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-stone-900">
                            {sale.sale_number}
                          </span>
                          <span className="text-xs text-stone-700 font-medium">
                            {sale.customer?.name || 'Customer'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400">
                          {new Date(sale.created_at).toLocaleDateString()} • Recorded by {sale.recorded_by}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-stone-900">
                          GHS {sale.total_amount.toFixed(2)}
                        </span>
                        <div className="mt-0.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                              sale.payment_status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : sale.payment_status === 'Partially Paid'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {sale.payment_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
