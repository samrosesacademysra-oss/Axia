import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Minus,
  Package,
  Plus,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createCustomer, getCustomers } from '../../services/customersService';
import { getProducts } from '../../services/productsService';
import { createSale } from '../../services/salesService';
import {
  Customer,
  PAYMENT_METHODS,
  PaymentMethod,
  PaymentStatus,
  Product,
} from '../../types/database';
import { Modal } from '../common/Modal';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SaleCartItem {
  product: Product;
  quantity: number;
}

export function NewSaleModal({ isOpen, onClose }: NewSaleModalProps) {
  const { user } = useAuth();
  const { refreshData } = useData();

  const [step, setStep] = useState<1 | 2>(1); // 1: Customer & Products, 2: Payment & Review
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Selected customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Cart items
  const [cartItems, setCartItems] = useState<SaleCartItem[]>([]);

  // Payment fields
  const [paymentType, setPaymentType] = useState<PaymentStatus>('Paid');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Mobile Money');
  const [paymentReference, setPaymentReference] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([getCustomers(), getProducts()]).then(([cList, pList]) => {
        setCustomers(cList);
        setProducts(pList);
        if (cList.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(cList[0].id);
        }
      });
      setStep(1);
      setError(null);
    }
  }, [isOpen]);

  // Subtotal and Total calculations
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.selling_price,
    0
  );

  useEffect(() => {
    if (paymentType === 'Paid') {
      setAmountPaidInput(totalAmount.toString());
    } else if (paymentType === 'Unpaid') {
      setAmountPaidInput('0');
    }
  }, [paymentType, totalAmount]);

  const numAmountPaid = parseFloat(amountPaidInput) || 0;
  const balance = Math.max(0, totalAmount - numAmountPaid);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      setError(`Cannot add ${product.name}: Out of stock.`);
      return;
    }
    setError(null);
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) {
          setError(`Insufficient stock available for ${product.name}. Max available is ${product.stock_quantity}.`);
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    setError(null);
    const item = cartItems.find((i) => i.product.id === productId);
    if (!item) return;

    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (newQty > item.product.stock_quantity) {
      setError(
        `Insufficient stock available for ${item.product.name}. Max available is ${item.product.stock_quantity}.`
      );
      return;
    }

    setCartItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: newQty } : i))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setError('Customer name and phone are required.');
      return;
    }
    try {
      const created = await createCustomer({
        name: newCustName,
        phone: newCustPhone,
        email: newCustEmail,
        address: newCustAddress,
      });
      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomerId(created.id);
      setShowNewCustomerForm(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
      setNewCustAddress('');
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to save customer.');
    }
  };

  const handleCompleteSale = async () => {
    setError(null);
    if (!selectedCustomerId) {
      setError('Please select or create a customer.');
      return;
    }
    if (cartItems.length === 0) {
      setError('Please add at least one product to the sale.');
      return;
    }

    // Verify stocks
    for (const item of cartItems) {
      if (item.quantity > item.product.stock_quantity) {
        setError(`Insufficient stock available for ${item.product.name}. Available: ${item.product.stock_quantity}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      await createSale({
        customerId: selectedCustomerId,
        items: cartItems.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.product.selling_price,
        })),
        paymentStatus: paymentType,
        amountPaid: numAmountPaid,
        paymentMethod: paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        recordedBy: user?.name || 'Admin',
      });

      refreshData();
      onClose();
      // Reset
      setCartItems([]);
      setAmountPaidInput('');
      setPaymentReference('');
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to complete sale transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record New Sale"
      description="Create a customer transaction, calculate totals, record payment, and auto-reduce stock."
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 1 ? 'bg-stone-900 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              1
            </span>
            <span className={step === 1 ? 'font-bold text-stone-900' : 'text-stone-500'}>
              Customer & Products
            </span>
          </div>

          <div className="h-px w-12 bg-stone-200"></div>

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 2 ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
              }`}
            >
              2
            </span>
            <span className={step === 2 ? 'font-bold text-stone-900' : 'text-stone-500'}>
              Payment & Finalize
            </span>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            {/* Step 1: Customer Selection */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-stone-500" />
                  Step 1 — Customer
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                  className="text-xs font-medium text-stone-700 hover:text-stone-950 flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {showNewCustomerForm ? 'Select Existing' : '+ New Customer'}
                </button>
              </div>

              {showNewCustomerForm ? (
                <div className="pt-2 border-t border-stone-200/60 mt-2 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Customer Name *"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number (e.g. +233 24 123 4567) *"
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newCustEmail}
                      onChange={(e) => setNewCustEmail(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                    <input
                      type="text"
                      placeholder="Delivery / Street Address (optional)"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNewCustomer}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800"
                  >
                    Save & Select Customer
                  </button>
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
                >
                  <option value="" disabled>
                    -- Select a Customer --
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) {c.address ? `• ${c.address}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 2 & 3: Select Products and Quantities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Catalog Picker */}
              <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 flex flex-col h-80">
                <span className="text-xs font-semibold text-stone-900 mb-2 block">
                  Select Products from Inventory
                </span>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {products.length === 0 ? (
                    <p className="text-xs text-stone-400 text-center py-10">
                      No products found. Please add products first.
                    </p>
                  ) : (
                    products.map((p) => {
                      const isOutOfStock = p.stock_quantity <= 0;
                      return (
                        <div
                          key={p.id}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                            isOutOfStock
                              ? 'bg-stone-100/60 border-stone-200 opacity-60'
                              : 'bg-white border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-stone-100 overflow-hidden flex items-center justify-center shrink-0">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-3.5 h-3.5 text-stone-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-stone-900 line-clamp-1">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-stone-500">
                                GHS {p.selling_price.toFixed(2)} • Avail: {p.stock_quantity}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleAddToCart(p)}
                            className="px-2 py-1 text-[11px] font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-300 rounded transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Selected Sale Items (Cart) */}
              <div className="border border-stone-200 rounded-xl p-3 bg-white flex flex-col h-80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-stone-900">
                    Selected Items ({cartItems.length})
                  </span>
                  <span className="text-xs font-mono font-bold text-stone-900">
                    Subtotal: GHS {totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-400">
                      <Package className="w-6 h-6 mb-1 text-stone-300" />
                      <p className="text-xs">No items added to this sale yet.</p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Select items from the list on the left.
                      </p>
                    </div>
                  ) : (
                    cartItems.map((item) => {
                      const itemSubtotal = item.quantity * item.product.selling_price;
                      return (
                        <div
                          key={item.product.id}
                          className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-xs flex items-center justify-between"
                        >
                          <div className="flex-1 pr-2">
                            <p className="font-semibold text-stone-900 line-clamp-1">
                              {item.product.name}
                            </p>
                            <p className="text-[11px] text-stone-500 font-mono">
                              GHS {item.product.selling_price.toFixed(2)} × {item.quantity} ={' '}
                              <span className="font-semibold text-stone-900">
                                GHS {itemSubtotal.toFixed(2)}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(item.product.id, item.quantity - 1)
                              }
                              className="p-1 text-stone-600 hover:bg-stone-200 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-bold px-1.5 text-xs text-stone-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateQuantity(item.product.id, item.quantity + 1)
                              }
                              className="p-1 text-stone-600 hover:bg-stone-200 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Actions for Step 1 */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={cartItems.length === 0 || !selectedCustomerId}
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg shadow-xs"
              >
                Proceed to Payment (Total: GHS {totalAmount.toFixed(2)}) →
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Payment & Finalize */
          <div className="space-y-5">
            {/* Summary card */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold text-stone-900">
                  {customers.find((c) => c.id === selectedCustomerId)?.name}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Items:</span>
                <span className="text-stone-700">
                  {cartItems.map((i) => `${i.product.name} × ${i.quantity}`).join(', ')}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Total Sale Amount:
                </span>
                <span className="text-xl font-bold font-mono text-stone-950">
                  GHS {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-4">
              {/* Payment Status Option */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Payment Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Paid', 'Partially Paid', 'Unpaid'] as PaymentStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setPaymentType(status)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        paymentType === status
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Paid Input & Balance calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Amount Paid (GHS) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium">
                      GHS
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={totalAmount}
                      value={amountPaidInput}
                      onChange={(e) => {
                        setAmountPaidInput(e.target.value);
                        const val = parseFloat(e.target.value) || 0;
                        if (val >= totalAmount) {
                          setPaymentType('Paid');
                        } else if (val > 0) {
                          setPaymentType('Partially Paid');
                        } else {
                          setPaymentType('Unpaid');
                        }
                      }}
                      className="w-full pl-11 pr-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                    />
                  </div>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex flex-col justify-center">
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider block">
                    Outstanding Balance
                  </span>
                  <span
                    className={`text-lg font-mono font-bold ${
                      balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    GHS {balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Method & Reference (only if amount paid > 0) */}
              {numAmountPaid > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Payment Reference (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MOMO-9821 / Cash Ref"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:bg-white focus:border-stone-900"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions for Step 2 */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
              >
                ← Back to Items
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleCompleteSale}
                className="px-5 py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              >
                {submitting ? 'Recording Sale...' : 'Complete Sale & Update Stock'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
