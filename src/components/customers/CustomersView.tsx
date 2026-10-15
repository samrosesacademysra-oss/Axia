import React, { useMemo, useState } from 'react';
import { Eye, Mail, MapPin, Phone, Plus, Search, User, Users } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { createCustomer, getCustomers } from '../../services/customersService';
import { Customer } from '../../types/database';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';

interface CustomersViewProps {
  onSelectCustomerDetails: (customerId: string) => void;
}

export function CustomersView({ onSelectCustomerDetails }: CustomersViewProps) {
  const { dataVersion, refreshData } = useData();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add customer modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await getCustomers();
        setCustomers(list);
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dataVersion]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone is required');
      return;
    }

    try {
      setSubmitting(true);
      await createCustomer({
        name,
        phone,
        email: email.trim() || null,
        address: address.trim() || null,
      });
      refreshData();
      setIsAddOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Manage customer profiles, purchase history, and contact details.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name or phone number..."
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:border-stone-900 shadow-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200/80 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400 animate-pulse">
            Loading customer database...
          </div>
        ) : filteredCustomers.length === 0 ? (
          customers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-stone-400" />}
              title="No customers yet"
              description="No customers have been registered yet. Add a customer profile to track customer orders and outstanding balances."
              actionLabel="+ Add Customer"
              onAction={() => setIsAddOpen(true)}
            />
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-stone-800">No matching customers found</p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-3 px-3 py-1 text-xs text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors font-medium"
              >
                Clear Search
              </button>
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-12">#</th>
                  <th className="py-3.5 px-4 sm:px-6">Customer</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredCustomers.map((c, index) => (
                  <tr
                    key={c.id}
                    className="hover:bg-stone-50/70 transition-colors group cursor-pointer"
                    onClick={() => onSelectCustomerDetails(c.id)}
                  >
                    <td className="py-3.5 px-4 font-mono text-stone-400">{index + 1}</td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-semibold text-stone-900 group-hover:underline">
                          {c.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      {c.phone}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500">
                      {c.email || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">
                      {c.address || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-stone-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onSelectCustomerDetails(c.id)}
                        className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                        title="View profile & history"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Customer"
        description="Register a new customer for Axia Distributions sales tracking."
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ama Boakye"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +233 24 555 1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              placeholder="e.g. ama@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Address / Location (optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Cantonments, Accra"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-xs"
            >
              {submitting ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
