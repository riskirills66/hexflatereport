interface DailyTransactionData {
  date: string;
  total_transactions: number;
  success_count: number;
  failed_count: number;
}

interface TransactionTrends {
  total_7_days: number;
  success_rate: number;
  failure_rate: number;
  avg_daily_transactions: number;
  daily_data: DailyTransactionData[];
}

interface ProductData {
  kode_produk: string;
  nama_produk: string;
  total_transactions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
}

interface ProductCategoryData {
  category: string;
  total_transactions: number;
  percentage: number;
}

interface ProductTrends {
  total_products: number;
  top_products: ProductData[];
  product_categories: ProductCategoryData[];
}

interface TrendsResponse {
  success: boolean;
  message?: string;
  analytics?: TransactionTrends;
}

interface ProductTrendsResponse {
  success: boolean;
  message?: string;
  analytics?: ProductTrends;
}

interface CacheEntry {
  trendsData: TransactionTrends | null;
  productTrendsData: ProductTrends | null;
  timestamp: number;
}

const CACHE_KEY = 'analyticsDashboardCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function getCachedAnalytics(): { trendsData: TransactionTrends | null; productTrendsData: ProductTrends | null } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return {
      trendsData: entry.trendsData,
      productTrendsData: entry.productTrendsData,
    };
  } catch (error) {
    console.error('Error reading analytics cache:', error);
    return null;
  }
}

export function setCachedAnalytics(
  trendsData: TransactionTrends | null,
  productTrendsData: ProductTrends | null
): void {
  try {
    const entry: CacheEntry = {
      trendsData,
      productTrendsData,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing analytics cache:', error);
  }
}

export function mergeTrendsData(
  existing: TransactionTrends | null,
  newData: TransactionTrends
): TransactionTrends {
  if (!existing) return newData;
  
  // Merge daily data, keeping the most recent
  const existingMap = new Map(existing.daily_data.map(d => [d.date, d]));
  newData.daily_data.forEach(d => {
    existingMap.set(d.date, d);
  });
  
  return {
    ...newData,
    daily_data: Array.from(existingMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  };
}

export function mergeProductTrendsData(
  existing: ProductTrends | null,
  newData: ProductTrends
): ProductTrends {
  if (!existing) return newData;
  
  // Merge products, keeping the one with more recent data
  const existingMap = new Map(existing.top_products.map(p => [p.kode_produk, p]));
  newData.top_products.forEach(p => {
    const existing = existingMap.get(p.kode_produk);
    if (!existing || p.total_transactions > existing.total_transactions) {
      existingMap.set(p.kode_produk, p);
    }
  });
  
  return {
    ...newData,
    top_products: Array.from(existingMap.values()).sort((a, b) => 
      b.total_transactions - a.total_transactions
    ),
  };
}

export function clearAnalyticsCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing analytics cache:', error);
  }
}

export function preloadAnalytics(authSeed: string): Promise<{ trendsData: TransactionTrends | null; productTrendsData: ProductTrends | null } | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      // Fetch both analytics in parallel
      const [trendsResponse, productTrendsResponse] = await Promise.all([
        fetch(await getApiUrl('/admin/transactions/trends'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Token': X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
          }),
        }),
        fetch(await getApiUrl('/admin/transactions/product-trends'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Token': X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
          }),
        }),
      ]);

      const trendsData: TrendsResponse = await trendsResponse.json();
      const productTrendsData: ProductTrendsResponse = await productTrendsResponse.json();

      const trends = trendsData.success && trendsData.analytics ? trendsData.analytics : null;
      let productTrends = null;
      
      if (productTrendsData.success && productTrendsData.analytics) {
        // Validate and transform product data
        productTrends = {
          ...productTrendsData.analytics,
          top_products: productTrendsData.analytics.top_products.map((product: any) => ({
            ...product,
            total_transactions: Number(product.total_transactions) || 0,
            success_count: Number(product.success_count) || 0,
            failed_count: Number(product.failed_count) || 0,
            success_rate: Number(product.success_rate) || 0,
          })),
        };
      }

      if (trends || productTrends) {
        setCachedAnalytics(trends, productTrends);
        resolve({
          trendsData: trends,
          productTrendsData: productTrends,
        });
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading analytics:', error);
      resolve(null);
    }
  });
}

