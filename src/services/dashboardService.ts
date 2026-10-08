import { DashboardStats, Product, ProductCategory, PRODUCT_CATEGORIES } from '../types/database';
import { getProducts } from './productsService';
import { getSales } from './salesService';

export async function getDashboardStats(): Promise<DashboardStats> {
  const [products, sales] = await Promise.all([getProducts(), getSales()]);

  const totalProducts = products.length;
  const totalStock = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);

  // Today's Sales calculation (compare YYYY-MM-DD in local time)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((s) => s.created_at.slice(0, 10) === todayStr);
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

  // Low stock products: stock_quantity <= low_stock_threshold
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  );

  // Category breakdown for exactly the 3 categories
  const categorySummary = PRODUCT_CATEGORIES.map((category: ProductCategory) => {
    const catProducts = products.filter((p) => p.category === category);
    const catStock = catProducts.reduce((acc, p) => acc + (p.stock_quantity || 0), 0);
    return {
      category,
      productCount: catProducts.length,
      stockUnits: catStock,
    };
  });

  return {
    totalProducts,
    totalStock,
    todaySalesTotal,
    lowStockCount: lowStockProducts.length,
    categorySummary,
    lowStockProducts,
    recentSales: sales.slice(0, 5),
  };
}
