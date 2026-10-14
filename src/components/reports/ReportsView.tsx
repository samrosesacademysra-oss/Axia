import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Boxes,
  CircleDollarSign,
  CreditCard,
  Package,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getProducts } from '../../services/productsService';
import { getSales } from '../../services/salesService';
import { Product, Sale } from '../../types/database';

interface BestSellerItem {
  product: Product;
  unitsSold: number;
  totalRevenue: number;
}

export function ReportsView() {
  const { dataVersion } = useData();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pList, sList] = await Promise.all([getProducts(), getSales()]);
        setProducts(pList);
        setSales(sList);
      } catch (err) {
        console.error('Failed to load reports data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dataVersion]);

  // Calculations
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  // Sales figures
  const todaySales = sales
    .filter((s) => s.created_at.slice(0, 10) === todayStr)
    .reduce((sum, s) => sum + Number(s.total_amount), 0);

  const weeklySales = sales
    .filter((s) => new Date(s.created_at) >= sevenDaysAgo)
    .reduce((sum, s) => sum + Number(s.total_amount), 0);

  const monthlySales = sales
    .filter((s) => new Date(s.created_at) >= thirtyDaysAgo)
    .reduce((sum, s) => sum + Number(s.total_amount), 0);

  // Inventory figures
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  const lowStockCount = products.filter(
    (p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold
  ).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;

  // Payments figures
  const totalPaid = sales.reduce((sum, s) => sum + Number(s.amount_paid), 0);
  const totalOutstanding = sales.reduce((sum, s) => sum + Number(s.balance), 0);
  const paidSalesCount = sales.filter((s) => s.payment_status === 'Paid').length;
  const partiallyPaidSalesCount = sales.filter(
    (s) => s.payment_status === 'Partially Paid'
  ).length;
  const unpaidSalesCount = sales.filter((s) => s.payment_status === 'Unpaid').length;

  // Best sellers computation from sale items
  const bestSellersMap = new Map<string, { unitsSold: number; totalRevenue: number }>();
  sales.forEach((s) => {
    s.items?.forEach((item) => {
      const existing = bestSellersMap.get(item.product_id) || { unitsSold: 0, totalRevenue: 0 };
      bestSellersMap.set(item.product_id, {
        unitsSold: existing.unitsSold + item.quantity,
        totalRevenue: existing.totalRevenue + item.subtotal,
      });
    });
  });

  const bestSellers: BestSellerItem[] = Array.from(bestSellersMap.entries())
    .map(([productId, metrics]) => {
      const prod = products.find((p) => p.id === productId);
      if (!prod) return null;
      return {
        product: prod,
        unitsSold: metrics.unitsSold,
        totalRevenue: metrics.totalRevenue,
      };
    })
    .filter(Boolean) as BestSellerItem[];

  bestSellers.sort((a, b) => b.unitsSold - a.unitsSold);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
          Executive Reports
        </h1>
        <p className="text-xs md:text-sm text-stone-500 mt-0.5">
          Clear financial performance metrics, warehouse inventory balance, and top-performing products.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-stone-400 animate-pulse">
          Generating reports...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Sales Performance */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-1.5">
              <CircleDollarSign className="w-4 h-4 text-stone-700" />
              1. Sales Performance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
                <span className="text-xs font-medium text-stone-500 block mb-1">
                  Today's Sales
                </span>
                <span className="text-2xl font-bold font-mono text-stone-900">
                  GHS {todaySales.toFixed(2)}
                </span>
                <span className="text-[11px] text-stone-400 block mt-1">
                  Transactions since midnight
                </span>
              </div>

              <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
                <span className="text-xs font-medium text-stone-500 block mb-1">
                  Weekly Sales (Past 7 Days)
                </span>
                <span className="text-2xl font-bold font-mono text-stone-900">
                  GHS {weeklySales.toFixed(2)}
                </span>
                <span className="text-[11px] text-stone-400 block mt-1">
                  Rolling 7-day volume
                </span>
              </div>

              <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
                <span className="text-xs font-medium text-stone-500 block mb-1">
                  Monthly Sales (Past 30 Days)
                </span>
                <span className="text-2xl font-bold font-mono text-stone-900">
                  GHS {monthlySales.toFixed(2)}
                </span>
                <span className="text-[11px] text-stone-400 block mt-1">
                  Rolling 30-day volume
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Inventory Status */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-stone-700" />
              2. Warehouse Inventory Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-stone-200 rounded-xl">
                <span className="text-[11px] font-medium text-stone-500 block mb-1">
                  Total Products
                </span>
                <span className="text-xl font-bold text-stone-900">{totalProducts}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">catalog lines</span>
              </div>

              <div className="p-4 bg-white border border-stone-200 rounded-xl">
                <span className="text-[11px] font-medium text-stone-500 block mb-1">
                  Total Units
                </span>
                <span className="text-xl font-bold text-stone-900">{totalUnits.toLocaleString()}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">units in stock</span>
              </div>

              <div className="p-4 bg-white border border-stone-200 rounded-xl">
                <span className="text-[11px] font-medium text-stone-500 block mb-1">
                  Low-Stock Products
                </span>
                <span className="text-xl font-bold text-amber-600">{lowStockCount}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">below threshold</span>
              </div>

              <div className="p-4 bg-white border border-stone-200 rounded-xl">
                <span className="text-[11px] font-medium text-stone-500 block mb-1">
                  Out-of-Stock Products
                </span>
                <span className="text-xl font-bold text-rose-600">{outOfStockCount}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">0 units available</span>
              </div>
            </div>
          </div>

          {/* Section 3: Payments & Receivables */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-stone-700" />
              3. Payments & Receivables
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="p-5 bg-white border border-emerald-200/80 rounded-xl shadow-xs">
                <span className="text-xs font-medium text-stone-500 block mb-1">
                  Total Cash Collected
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-700">
                  GHS {totalPaid.toFixed(2)}
                </span>
                <span className="text-[11px] text-stone-400 block mt-1">
                  Deposited & verified receipts
                </span>
              </div>

              <div className="p-5 bg-white border border-stone-200/80 rounded-xl shadow-xs">
                <span className="text-xs font-medium text-stone-500 block mb-1">
                  Total Outstanding Balance
                </span>
                <span className="text-2xl font-bold font-mono text-rose-600">
                  GHS {totalOutstanding.toFixed(2)}
                </span>
                <span className="text-[11px] text-stone-400 block mt-1">
                  Accounts receivable from customers
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200 text-center text-xs">
              <div>
                <span className="text-stone-500 block">Fully Paid Sales:</span>
                <span className="text-base font-bold text-emerald-700 font-mono">
                  {paidSalesCount}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Partially Paid:</span>
                <span className="text-base font-bold text-amber-700 font-mono">
                  {partiallyPaidSalesCount}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Unpaid Sales:</span>
                <span className="text-base font-bold text-rose-600 font-mono">
                  {unpaidSalesCount}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Best Sellers */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-stone-700" />
              4. Best Sellers
            </h2>

            {bestSellers.length === 0 ? (
              <div className="p-8 text-center bg-white border border-stone-200 rounded-xl text-xs text-stone-400">
                No product sales data available to rank best sellers yet.
              </div>
            ) : (
              <div className="bg-white border border-stone-200/80 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 sm:px-6">Rank</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Division</th>
                      <th className="py-3 px-4 text-right">Units Sold</th>
                      <th className="py-3 px-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {bestSellers.slice(0, 5).map((item, idx) => (
                      <tr key={item.product.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4 sm:px-6 font-mono font-bold text-stone-500">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          {item.product.name}
                        </td>
                        <td className="py-3 px-4 text-stone-600">
                          {item.product.category}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-stone-900">
                          {item.unitsSold} units
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          GHS {item.totalRevenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
