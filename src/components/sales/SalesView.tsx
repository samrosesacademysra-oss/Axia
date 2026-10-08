import React, { useMemo, useState } from 'react';
import {
  CreditCard,
  Eye,
  Filter,
  Plus,
  ReceiptText,
  Search,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getSales } from '../../services/salesService';
import {
  PAYMENT_METHODS,
  PaymentMethod,
  PaymentStatus,
  Sale,
} from '../../types/database';
import { PaymentBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

interface SalesViewProps {
  onOpenNewSale: () => void;
  onSelectSaleDetails: (saleId: string) => void;
  onOpenRecordPayment: (sale: Sale) => void;
}

export function SalesView({
  onOpenNewSale,
  onSelectSaleDetails,
  onOpenRecordPayment,
}: SalesViewProps) {
  const { dataVersion } = useData();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMethod>('All');

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await getSales();
        setSales(list);
      } catch (err) {
        console.error('Failed to load sales list', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dataVersion]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Search
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesNumber = sale.sale_number.toLowerCase().includes(q);
        const matchesCustomer = sale.customer?.name.toLowerCase().includes(q);
        const matchesPhone = sale.customer?.phone.includes(q);
        const matchesItems = sale.items?.some((i) =>
          i.product?.name.toLowerCase().includes(q)
        );
        if (!matchesNumber && !matchesCustomer && !matchesPhone && !matchesItems) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'All' && sale.payment_status !== statusFilter) {
        return false;
      }

      // Method
      if (
        methodFilter !== 'All' &&
        !sale.payments?.some((p) => p.payment_method === methodFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [sales, search, statusFilter, methodFilter]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
            Sales & Transactions
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Audit sales, track customer payments, and monitor remaining balances.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewSale}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Sale</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sale #, customer, phone, product..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 shadow-xs"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | PaymentStatus)}
            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 shadow-xs text-stone-700"
          >
            <option value="All">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>

        {/* Method Filter */}
        <div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as 'All' | PaymentMethod)}
            className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900 shadow-xs text-stone-700"
          >
            <option value="All">All Payment Methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400 animate-pulse">
            Loading sales history...
          </div>
        ) : filteredSales.length === 0 ? (
          sales.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="w-8 h-8 text-stone-400" />}
              title="No sales recorded"
              description="No sales transactions have been logged in the system yet. Click '+ New Sale' to record the first customer purchase."
              actionLabel="+ New Sale"
              onAction={onOpenNewSale}
            />
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-stone-800">No matching sales found</p>
              <p className="text-xs text-stone-500 mt-1">
                Try clearing your search query or payment filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                  setMethodFilter('All');
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
                  <th className="py-3.5 px-4 sm:px-6">Sale</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-stone-50/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectSaleDetails(sale.id)}
                  >
                    {/* Sale number */}
                    <td className="py-3 px-4 sm:px-6">
                      <span className="font-mono font-bold text-stone-900 group-hover:underline">
                        {sale.sale_number}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-stone-900">
                        {sale.customer?.name || 'Walk-in'}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {sale.customer?.phone}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right font-mono font-medium text-stone-900">
                      GHS {sale.total_amount.toFixed(2)}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                      GHS {sale.amount_paid.toFixed(2)}
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={sale.balance > 0 ? 'text-rose-600' : 'text-stone-400'}>
                        GHS {sale.balance.toFixed(2)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <PaymentBadge status={sale.payment_status} />
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-stone-600">
                      {new Date(sale.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Recorded By */}
                    <td className="py-3 px-4 text-stone-600 font-medium">
                      {sale.recorded_by}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {sale.balance > 0 && (
                          <button
                            type="button"
                            onClick={() => onOpenRecordPayment(sale)}
                            className="px-2 py-1 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded transition-colors"
                            title="Collect remaining balance"
                          >
                            + Pay
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectSaleDetails(sale.id)}
                          className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                          title="View receipt details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
