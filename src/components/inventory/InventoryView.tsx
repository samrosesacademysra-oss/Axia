import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  Eye,
  Filter,
  Pencil,
  Package,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { readPackDetails } from '../../lib/packDetails';
import { getProducts } from '../../services/productsService';
import { Product, ProductCategory, StockStatus } from '../../types/database';
import { StockBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

type FilterType =
  | 'All'
  | 'Personal Care'
  | 'Fragrances'
  | 'Diffusers'
  | 'In Stock'
  | 'Low Stock'
  | 'Out of Stock';

export type InventoryPriceMode = 'wholesale' | 'retail';

interface InventoryViewProps {
  initialCategoryFilter?: ProductCategory;
  priceMode: InventoryPriceMode;
  onPriceModeChange: (mode: InventoryPriceMode) => void;
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onOpenReceiveStock: (product?: Product) => void;
  onSelectProductDetails: (product: Product) => void;
}

export function InventoryView({
  initialCategoryFilter,
  priceMode,
  onPriceModeChange,
  onOpenAddProduct,
  onEditProduct,
  onOpenReceiveStock,
  onSelectProductDetails,
}: InventoryViewProps) {
  const { dataVersion } = useData();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>(initialCategoryFilter || 'All');

  React.useEffect(() => {
    if (initialCategoryFilter) {
      setFilter(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await getProducts();
        setProducts(list);
      } catch (err) {
        console.error('Failed to load inventory', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dataVersion]);

  // Compute status helper
  const getProductStockStatus = (p: Product): StockStatus => {
    if (p.stock_quantity === 0) return 'Out of Stock';
    if (p.stock_quantity <= p.low_stock_threshold) return 'Low Stock';
    return 'In Stock';
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      const q = search.trim().toLowerCase();
      if (q) {
        if (!p.name.toLowerCase().includes(q)) return false;
      }

      // Filter
      if (filter === 'All') return true;
      if (filter === 'Personal Care' || filter === 'Fragrances' || filter === 'Diffusers') {
        return p.category === filter;
      }
      if (filter === 'In Stock') return getProductStockStatus(p) === 'In Stock';
      if (filter === 'Low Stock') return getProductStockStatus(p) === 'Low Stock';
      if (filter === 'Out of Stock') return getProductStockStatus(p) === 'Out of Stock';

      return true;
    });
  }, [products, search, filter]);

  const filterTabs: FilterType[] = [
    'All',
    'Personal Care',
    'Fragrances',
    'Diffusers',
    'In Stock',
    'Low Stock',
    'Out of Stock',
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
            Inventory Management
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Manage products, check current stock levels, and receive new warehouse shipments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-stone-200 bg-white p-0.5 shadow-xs">
            {([
              ['wholesale', 'Wholesale'],
              ['retail', 'Retail shop'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => onPriceModeChange(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  priceMode === mode
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onOpenReceiveStock()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg transition-colors shadow-xs"
          >
            <TrendingUp className="w-4 h-4 text-stone-500" />
            <span>Receive Stock</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory by product name..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 shadow-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-stone-200/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400 animate-pulse">
            Loading Axia inventory records...
          </div>
        ) : filteredProducts.length === 0 ? (
          products.length === 0 ? (
            <EmptyState
              icon={<Package className="w-8 h-8 text-stone-400" />}
              title="No products yet"
              description="Your inventory is empty. Add your first product to begin tracking catalog stock."
              actionLabel="+ Add Product"
              onAction={onOpenAddProduct}
            />
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-stone-800">No matching products found</p>
              <p className="text-xs text-stone-500 mt-1">
                Try adjusting your search query or active category filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilter('All');
                }}
                className="mt-3 px-3 py-1 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors font-medium"
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
                  {priceMode === 'wholesale' ? (
                    <>
                      <th className="py-3.5 px-4 text-right">Carton price</th>
                      <th className="py-3.5 px-4 text-right">Total carton</th>
                    </>
                  ) : (
                    <>
                      <th className="py-3.5 px-4 text-right">Unit price</th>
                      <th className="py-3.5 px-4 text-right">Pieces</th>
                    </>
                  )}
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => {
                  const status = getProductStockStatus(p);
                  const pack = readPackDetails(p.description);
                  const cartonPrice = pack.cartonPrice === '' ? null : Number(pack.cartonPrice);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-stone-50/70 transition-colors group cursor-pointer"
                      onClick={() => onSelectProductDetails(p)}
                    >
                      {/* Product */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200/80 overflow-hidden flex items-center justify-center shrink-0">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-stone-900 group-hover:text-stone-950 transition-colors">
                              {p.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {priceMode === 'wholesale' ? (
                        <>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-bold text-stone-900">
                              {cartonPrice === null || Number.isNaN(cartonPrice)
                                ? '—'
                                : `GHS ${cartonPrice.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                            <span className="text-[10px] text-stone-400 block">per carton</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-bold text-stone-900">
                              {pack.cartonCount || '—'}
                            </span>
                            <span className="text-[10px] text-stone-400 block">cartons</span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-bold text-stone-900">
                              {`GHS ${p.selling_price.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                            <span className="text-[10px] text-stone-400 block">per piece</span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono font-bold text-stone-900">
                              {p.stock_quantity}
                            </span>
                            <span className="text-[10px] text-stone-400 block">pieces</span>
                          </td>
                        </>
                      )}

                      <td className="py-3 px-4">
                        <StockBadge status={status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-md transition-colors inline-flex items-center gap-1"
                            title="Edit this product"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenReceiveStock(p)}
                            className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                            title="Receive more stock for this product"
                          >
                            + Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectProductDetails(p)}
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
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
