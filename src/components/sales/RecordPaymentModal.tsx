import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { recordAdditionalPayment } from '../../services/salesService';
import { PAYMENT_METHODS, PaymentMethod, Sale } from '../../types/database';
import { Modal } from '../common/Modal';

interface RecordPaymentModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export function RecordPaymentModal({
  sale,
  isOpen,
  onClose,
  onPaymentSuccess,
}: RecordPaymentModalProps) {
  const { user } = useAuth();
  const { refreshData } = useData();

  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('Mobile Money');
  const [reference, setReference] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!sale) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payVal = parseFloat(amount);
    if (isNaN(payVal) || payVal <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }
    if (payVal > sale.balance) {
      setError(`Payment cannot exceed outstanding balance of GHS ${sale.balance.toFixed(2)}.`);
      return;
    }

    try {
      setSubmitting(true);
      await recordAdditionalPayment({
        saleId: sale.id,
        amount: payVal,
        paymentMethod: method,
        paymentReference: reference.trim() || undefined,
        recordedBy: user?.name || 'Admin',
      });

      refreshData();
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
      setAmount('');
      setReference('');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Additional Payment"
      description={`Sale: ${sale.sale_number} • Customer: ${sale.customer?.name || 'Customer'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-stone-500 block">Total Sale Amount:</span>
            <span className="font-mono font-bold text-stone-900">
              GHS {sale.total_amount.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Remaining Balance:</span>
            <span className="font-mono font-bold text-rose-600">
              GHS {sale.balance.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Payment Amount (GHS) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">
              GHS
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={sale.balance}
              required
              placeholder={sale.balance.toFixed(2)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-11 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>
          <button
            type="button"
            onClick={() => setAmount(sale.balance.toString())}
            className="text-[11px] text-stone-600 hover:text-stone-900 underline mt-1"
          >
            Pay full balance (GHS {sale.balance.toFixed(2)})
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Payment Method *
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            Reference / Transaction ID (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. MOMO-772183"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-xs"
          >
            {submitting ? 'Recording...' : 'Submit Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
