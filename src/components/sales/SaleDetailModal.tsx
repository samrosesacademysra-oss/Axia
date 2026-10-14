import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle,
  CreditCard,
  Package,
  Receipt,
  User,
} from 'lucide-react';
import { getSaleById } from '../../services/salesService';
import { Sale } from '../../types/database';
import { PaymentBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface SaleDetailModalProps {
  saleId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (sale: Sale) => void;
}

export function SaleDetailModal({
  saleId,
  isOpen,
  onClose,
  onOpenRecordPayment,
}: SaleDetailModalProps) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (saleId && isOpen) {
      setLoading(true);
      getSaleById(saleId)
        .then((data) => setSale(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [saleId, isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sale ? `Sale Receipt ${sale.sale_number}` : 'Sale Details'}
      description="Detailed breakdown of items, pricing, balances, and payment records."
      maxWidth="xl"
    >
      {loading || !sale ? (
        <div className="py-12 text-center text-xs text-stone-400 animate-pulse">
          Loading sale transaction records...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Status Bar */}
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                Transaction Status
              </span>
              <div className="mt-1">
                <PaymentBadge status={sale.payment_status} />
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                Total Transaction
              </span>
              <span className="text-xl font-bold font-mono text-stone-900">
                GHS {sale.total_amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Customer & Timestamp Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-lg border border-stone-200">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Customer Information
              </span>
              <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-stone-400" />
                {sale.customer?.name || 'Walk-in Customer'}
              </div>
              <div className="text-stone-500">{sale.customer?.phone || 'No phone'}</div>
              {sale.customer?.address && (
                <div className="text-stone-400 text-[11px]">{sale.customer.address}</div>
              )}
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Audit Trail
              </span>
              <div className="text-stone-700 flex items-center gap-1.5 sm:justify-end">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {new Date(sale.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="text-stone-500 text-[11px]">
                Recorded By: <span className="font-medium text-stone-800">{sale.recorded_by}</span>
              </div>
            </div>
          </div>

          {/* Products Purchased */}
          <div>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-stone-500" />
              Line Items ({sale.items?.length || 0})
            </h4>

            <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100 text-xs">
              <div className="bg-stone-50 py-2 px-3 text-[11px] font-semibold text-stone-500 grid grid-cols-12">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-right">Subtotal</span>
              </div>

              {sale.items?.map((item) => (
                <div key={item.id} className="py-2.5 px-3 grid grid-cols-12 items-center hover:bg-stone-50/50">
                  <div className="col-span-6">
                    <span className="font-semibold text-stone-900 block leading-tight">
                      {item.product?.name || 'Product'}
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-mono font-medium text-stone-700">
                    {item.quantity}
                  </div>
                  <div className="col-span-2 text-right font-mono text-stone-600">
                    GHS {item.unit_price.toFixed(2)}
                  </div>
                  <div className="col-span-2 text-right font-mono font-bold text-stone-900">
                    GHS {item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="mt-3 bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono">GHS {sale.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Total Amount Paid:</span>
                <span className="font-mono">GHS {sale.amount_paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-stone-200/80 font-bold">
                <span className="text-stone-900">Remaining Balance:</span>
                <span className={`font-mono ${sale.balance > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
                  GHS {sale.balance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                Payment History
              </h4>

              {sale.balance > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRecordPayment(sale);
                  }}
                  className="text-xs font-semibold text-stone-900 hover:underline"
                >
                  + Record Payment
                </button>
              )}
            </div>

            {(!sale.payments || sale.payments.length === 0) ? (
              <div className="py-4 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-lg">
                No payments have been logged for this sale.
              </div>
            ) : (
              <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden text-xs">
                {sale.payments.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between hover:bg-stone-50/50">
                    <div>
                      <div className="font-semibold text-stone-900 flex items-center gap-2">
                        <span>{p.payment_method}</span>
                        {p.payment_reference && (
                          <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            {p.payment_reference}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(p.created_at).toLocaleString()} • Logged by {p.recorded_by}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-emerald-700">
                      GHS {p.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
