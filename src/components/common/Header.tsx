import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle,
  Database,
  Layers,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  TrendingUp,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { getProducts } from '../../services/productsService';
import { Product } from '../../types/database';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenNewSale: () => void;
  onOpenReceiveStock: () => void;
  onOpenAddProduct: () => void;
  onSelectProductDetails: (product: Product) => void;
}

export function Header({
  onOpenMobileSidebar,
  onOpenNewSale,
  onOpenReceiveStock,
  onOpenAddProduct,
  onSelectProductDetails,
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lowStockList, setLowStockList] = useState<Product[]>([]);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAlerts() {
      const all = await getProducts();
      const low = all.filter((p) => p.stock_quantity <= p.low_stock_threshold);
      setLowStockList(low);
    }
    loadAlerts();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Left: Mobile hamburger & branding on small screens */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="p-2 text-stone-500 rounded-lg md:hidden hover:bg-stone-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-white font-semibold text-sm tracking-tight shadow-xs">
            AX
          </div>
          <div>
            <span className="font-semibold text-stone-900 text-sm tracking-tight block leading-tight">
              Axia Distributions
            </span>
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">
              Internal Admin
            </span>
          </div>
        </div>

        {/* Supabase status badge */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-stone-500 bg-stone-50 px-2.5 py-1 rounded-full border border-stone-200">
          <Database className="w-3.5 h-3.5 text-stone-400" />
          <span>Backend:</span>
          {isSupabaseConfigured ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Supabase Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-stone-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Supabase Ready (Cursor)
            </span>
          )}
        </div>
      </div>

      {/* Right: Quick Actions, Notifications, Admin User */}
      <div className="flex items-center gap-2.5">
        {/* Quick action buttons */}
        <button
          type="button"
          onClick={onOpenNewSale}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Sale</span>
        </button>

        <button
          type="button"
          onClick={onOpenReceiveStock}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
        >
          <TrendingUp className="w-3.5 h-3.5 text-stone-500" />
          <span>Receive Stock</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {lowStockList.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
              <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                <div className="text-xs font-semibold text-stone-900">Notifications</div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  {lowStockList.length} Low Stock
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-stone-100">
                {lowStockList.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-stone-500">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                    All inventory levels are healthy
                  </div>
                ) : (
                  lowStockList.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        onSelectProductDetails(item);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-stone-50 transition-colors flex items-start gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-stone-900 leading-tight">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {item.stock_quantity === 0
                            ? 'Out of stock (0 remaining)'
                            : `Only ${item.stock_quantity} units remaining (Threshold: ${item.low_stock_threshold})`}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Admin user menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-medium tracking-tight">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-stone-900 leading-tight">
                {user?.name || 'Admin'}
              </div>
              <div className="text-[10px] text-stone-500 leading-tight">Administrator</div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in-50 slide-in-from-top-1">
              <div className="px-4 py-2.5 border-b border-stone-100">
                <p className="text-xs font-semibold text-stone-900">{user?.name || 'Admin'}</p>
                <p className="text-[11px] text-stone-500 truncate">{user?.email || 'admin@axiadistributions.com'}</p>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Authenticated Admin
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenAddProduct();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-stone-400" />
                  + Add Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    signOut();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
