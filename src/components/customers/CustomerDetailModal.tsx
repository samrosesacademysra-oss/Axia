import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Receipt,
  User,
} from 'lucide-react';
import { CustomerProfile, getCustomerProfile } from '../../services/customersService';
import { PaymentBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface CustomerDetailModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSaleDetails?: (saleId: string) => void;
}

export function CustomerDetailModal({
  customerId,
  isOpen,
  onClose,
  onSelectSaleDetails,
}: CustomerDetailModalProps) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerId && isOpen) {
      setLoading(true);
      getCustomerProfile(customerId)
        .then((data) => setProfile(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [customerId, isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={profile ? profile.name : 'Customer Profile'}
      description="Customer transaction summary, payment history, and contact details."
      maxWidth="2xl"
    >
      {loading || !profile ? (
        <div className="py-12 text-center text-xs text-stone-400 animate-pulse">
          Loading customer records...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <Phone className="w-3.5 h-3.5 text-stone-400" />
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-700">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              <span>{profile.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-700 sm:col-span-2">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{profile.address || 'No physical address provided'}</span>
            </div>
          </div>

          {/* Section 17 Metrics: Total purchases, Number of sales, Total amount paid, Outstanding balance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white border border-stone-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                Total Purchases
              </span>
              <span className="text-lg font-bold font-mono text-stone-900">
                GHS {profile.totalPurchases.toFixed(2)}
              </span>
            </div>

            <div className="p-3 bg-white border border-stone-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                Sales Count
              </span>
              <span className="text-lg font-bold font-mono text-stone-900">
                {profile.salesCount}
              </span>
              <span className="text-[10px] text-stone-500 block">transactions</span>
            </div>

            <div className="p-3 bg-white border border-stone-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                Total Paid
              </span>
              <span className="text-lg font-bold font-mono text-emerald-700">
                GHS {profile.totalPaid.toFixed(2)}
              </span>
            </div>

            <div className="p-3 bg-white border border-stone-200 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">
                Balance Owed
              </span>
              <span
                className={`text-lg font-bold font-mono ${
                  profile.outstandingBalance > 0 ? 'text-rose-600' : 'text-stone-900'
                }`}
              >
                GHS {profile.outstandingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Purchase History */}
          <div>
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-stone-500" />
              Customer Purchase History ({profile.salesHistory.length})
            </h4>

            {profile.salesHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-lg">
                No purchases recorded for this customer yet.
              </div>
            ) : (
              <div className="border border-stone-200 rounded-lg divide-y divide-stone-100 overflow-hidden text-xs max-h-56 overflow-y-auto">
                {profile.salesHistory.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectSaleDetails && onSelectSaleDetails(s.id)}
                    className="p-3 flex items-center justify-between hover:bg-stone-50 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">
                          {s.sale_number}
                        </span>
                        <PaymentBadge status={s.payment_status} />
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(s.created_at).toLocaleDateString()} • Items: {s.items?.length || 0}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-stone-900">
                        GHS {s.total_amount.toFixed(2)}
                      </div>
                      {s.balance > 0 && (
                        <div className="text-[10px] text-rose-600 font-mono">
                          Bal: GHS {s.balance.toFixed(2)}
                        </div>
                      )}
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
