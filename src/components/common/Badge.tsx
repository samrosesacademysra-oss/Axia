import React from 'react';
import { PaymentStatus, ProductCategory, StockStatus } from '../../types/database';

export function StockBadge({ status }: { status: StockStatus }) {
  if (status === 'In Stock') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        In Stock
      </span>
    );
  }
  if (status === 'Low Stock') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
      Out of Stock
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  if (status === 'Paid') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
        Paid
      </span>
    );
  }
  if (status === 'Partially Paid') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
        Partially Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
      Unpaid
    </span>
  );
}

export function CategoryBadge({ category }: { category: ProductCategory }) {
  const styles: Record<ProductCategory, string> = {
    'Personal Care': 'bg-sky-50 text-sky-700 border-sky-200/60',
    Fragrances: 'bg-purple-50 text-purple-700 border-purple-200/60',
    Diffusers: 'bg-teal-50 text-teal-700 border-teal-200/60',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[category] || 'bg-stone-100 text-stone-700 border-stone-200'}`}
    >
      {category}
    </span>
  );
}
