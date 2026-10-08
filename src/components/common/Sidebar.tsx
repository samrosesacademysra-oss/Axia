import React from 'react';
import {
  BarChart3,
  History,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings,
  Users,
  X,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'inventory'
  | 'sales'
  | 'customers'
  | 'stock-history'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'sales', label: 'Sales', icon: ReceiptText },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'stock-history', label: 'Stock History', icon: History },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const content = (
    <div className="flex flex-col h-full bg-stone-900 text-stone-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white text-stone-900 font-bold flex items-center justify-center text-sm tracking-tight shadow-xs">
            AX
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight leading-tight">
              Axia Distributions
            </h1>
            <p className="text-[11px] text-stone-400 font-normal leading-tight">
              Inventory & Sales System
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Categories Badge Overview */}
      <div className="px-5 py-3.5 border-b border-stone-800/80 bg-stone-950/40">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
          Product Divisions
        </p>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-stone-800/80 text-stone-300 border border-stone-700/60 font-medium">
            Personal Care
          </span>
          <span className="px-2 py-0.5 rounded bg-stone-800/80 text-stone-300 border border-stone-700/60 font-medium">
            Fragrances
          </span>
          <span className="px-2 py-0.5 rounded bg-stone-800/80 text-stone-300 border border-stone-700/60 font-medium">
            Diffusers
          </span>
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-stone-950 font-semibold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-stone-950' : 'text-stone-400 group-hover:text-stone-200'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-stone-800 text-[11px] text-stone-400">
        <div className="flex items-center justify-between mb-1">
          <span className="text-stone-400 font-medium">System Status</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Operational
          </span>
        </div>
        <div className="text-[10px] text-stone-500">
          Supabase Architecture v1.0
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex flex-col w-72 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
