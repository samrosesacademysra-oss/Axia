/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LoginView } from './components/auth/LoginView';
import { Header } from './components/common/Header';
import { NavTab, Sidebar } from './components/common/Sidebar';
import { CustomerDetailModal } from './components/customers/CustomerDetailModal';
import { CustomersView } from './components/customers/CustomersView';
import { DashboardView } from './components/dashboard/DashboardView';
import { AddProductModal } from './components/inventory/AddProductModal';
import { InventoryView } from './components/inventory/InventoryView';
import { ProductDetailModal } from './components/inventory/ProductDetailModal';
import { ReceiveStockModal } from './components/inventory/ReceiveStockModal';
import { ReportsView } from './components/reports/ReportsView';
import { NewSaleModal } from './components/sales/NewSaleModal';
import { RecordPaymentModal } from './components/sales/RecordPaymentModal';
import { SaleDetailModal } from './components/sales/SaleDetailModal';
import { SalesView } from './components/sales/SalesView';
import { SettingsView } from './components/settings/SettingsView';
import { StockHistoryView } from './components/stock/StockHistoryView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Product, ProductCategory, Sale } from './types/database';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Inventory filter state passed when clicking dashboard category
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<ProductCategory | undefined>(undefined);

  // Modal states
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isReceiveStockOpen, setIsReceiveStockOpen] = useState(false);
  const [receiveStockProduct, setReceiveStockProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Details modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Additional payment modal
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white font-bold flex items-center justify-center mx-auto animate-pulse">
            AX
          </div>
          <p className="text-xs text-stone-500 font-medium">Initializing Axia System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Navigation handlers
  const handleNavigateToInventory = (cat?: ProductCategory) => {
    setInventoryCategoryFilter(cat);
    setCurrentTab('inventory');
  };

  const handleOpenReceiveStock = (prod?: Product) => {
    setReceiveStockProduct(prod || null);
    setIsReceiveStockOpen(true);
  };

  const handleOpenRecordPayment = (sale: Sale) => {
    setPaymentSale(sale);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex text-stone-900">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'inventory' && currentTab !== 'inventory') {
            setInventoryCategoryFilter(undefined);
          }
          setCurrentTab(tab);
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <Header
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenNewSale={() => setIsNewSaleOpen(true)}
          onOpenReceiveStock={() => handleOpenReceiveStock()}
          onOpenAddProduct={() => setIsAddProductOpen(true)}
          onSelectProductDetails={(p) => setSelectedProduct(p)}
        />

        {/* Tab View Container */}
        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigateToInventory={handleNavigateToInventory}
              onOpenNewSale={() => setIsNewSaleOpen(true)}
              onOpenReceiveStock={() => handleOpenReceiveStock()}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onSelectProductDetails={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              initialCategoryFilter={inventoryCategoryFilter}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
              onOpenReceiveStock={handleOpenReceiveStock}
              onSelectProductDetails={(p) => setSelectedProduct(p)}
            />
          )}

          {currentTab === 'sales' && (
            <SalesView
              onOpenNewSale={() => setIsNewSaleOpen(true)}
              onSelectSaleDetails={(id) => setSelectedSaleId(id)}
              onOpenRecordPayment={handleOpenRecordPayment}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              onSelectCustomerDetails={(id) => setSelectedCustomerId(id)}
            />
          )}

          {currentTab === 'stock-history' && <StockHistoryView />}

          {currentTab === 'reports' && <ReportsView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Modals */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
      />

      <ReceiveStockModal
        isOpen={isReceiveStockOpen}
        onClose={() => {
          setIsReceiveStockOpen(false);
          setReceiveStockProduct(null);
        }}
        defaultProduct={receiveStockProduct}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onOpenReceiveStock={(p) => handleOpenReceiveStock(p)}
      />

      <SaleDetailModal
        saleId={selectedSaleId}
        isOpen={Boolean(selectedSaleId)}
        onClose={() => setSelectedSaleId(null)}
        onOpenRecordPayment={(s) => handleOpenRecordPayment(s)}
      />

      <CustomerDetailModal
        customerId={selectedCustomerId}
        isOpen={Boolean(selectedCustomerId)}
        onClose={() => setSelectedCustomerId(null)}
        onSelectSaleDetails={(sId) => setSelectedSaleId(sId)}
      />

      <RecordPaymentModal
        sale={paymentSale}
        isOpen={Boolean(paymentSale)}
        onClose={() => setPaymentSale(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainApp />
      </DataProvider>
    </AuthProvider>
  );
}
