interface Transaction {
  kode: string;
  tgl_entri: string;
  kode_produk: string;
  tujuan: string;
  kode_reseller: string;
  harga: number;
  status: string;
}

interface TransactionAnalytics {
  total_today: number;
  success_count: number;
  process_count: number;
  failed_count: number;
}

interface TransactionResponse {
  success: boolean;
  message?: string;
  transactions?: Transaction[];
}

interface AnalyticsResponse {
  success: boolean;
  message?: string;
  analytics?: TransactionAnalytics;
}

interface CacheEntry {
  transactions: Transaction[];
  analytics: TransactionAnalytics | null;
  timestamp: number;
}

const CACHE_KEY = 'transactionManagementCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function getCachedTransactions(): { transactions: Transaction[]; analytics: TransactionAnalytics | null } | null {
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
      transactions: entry.transactions,
      analytics: entry.analytics,
    };
  } catch (error) {
    console.error('Error reading transaction cache:', error);
    return null;
  }
}

export function setCachedTransactions(
  transactions: Transaction[],
  analytics: TransactionAnalytics | null
): void {
  try {
    const entry: CacheEntry = {
      transactions,
      analytics,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing transaction cache:', error);
  }
}

export function mergeTransactions(
  existing: Transaction[],
  newTransactions: Transaction[]
): Transaction[] {
  const existingMap = new Map(existing.map(t => [t.kode, t]));
  
  newTransactions.forEach(transaction => {
    existingMap.set(transaction.kode, transaction);
  });

  return Array.from(existingMap.values()).sort((a, b) => {
    return new Date(b.tgl_entri).getTime() - new Date(a.tgl_entri).getTime();
  });
}

export function clearTransactionCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing transaction cache:', error);
  }
}

export function preloadTransactions(authSeed: string): Promise<{ transactions: Transaction[]; analytics: TransactionAnalytics | null } | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      // Fetch both transactions and analytics in parallel
      const [transactionsResponse, analyticsResponse] = await Promise.all([
        fetch(await getApiUrl('/admin/transactions'), {
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
        fetch(await getApiUrl('/admin/transactions/analytics'), {
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

      const transactionsData: TransactionResponse = await transactionsResponse.json();
      const analyticsData: AnalyticsResponse = await analyticsResponse.json();

      if (transactionsData.success && transactionsData.transactions) {
        const analytics = analyticsData.success && analyticsData.analytics ? analyticsData.analytics : null;
        setCachedTransactions(transactionsData.transactions, analytics);
        resolve({
          transactions: transactionsData.transactions,
          analytics,
        });
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading transactions:', error);
      resolve(null);
    }
  });
}

