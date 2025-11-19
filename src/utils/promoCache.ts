interface PromoItem {
  code: string;
  value: PromoValue;
}

type PromoValue = 
  | { type: 'price_cut'; amount: number }
  | { type: 'new_product'; isNew: boolean };

interface PromoMetadata {
  total_promos: number;
  price_cut_promos: number;
  new_product_promos: number;
  tanggal_update: string;
  versi: string;
}

interface PromoConfig {
  promos: PromoItem[];
  metadata: PromoMetadata;
}

interface CacheEntry {
  config: PromoConfig;
  timestamp: number;
}

const CACHE_KEY = 'promoManagementCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function getCachedPromoConfig(): PromoConfig | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry.config;
  } catch (error) {
    console.error('Error reading promo cache:', error);
    return null;
  }
}

export function setCachedPromoConfig(config: PromoConfig): void {
  try {
    const entry: CacheEntry = {
      config,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing promo cache:', error);
  }
}

export function clearPromoCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing promo cache:', error);
  }
}

export function mergePromoConfig(
  existing: PromoConfig | null,
  newConfig: PromoConfig
): PromoConfig {
  if (!existing) {
    return newConfig;
  }

  // Create a map of existing promos by code for efficient lookup
  const existingMap = new Map(existing.promos.map(p => [p.code, p]));
  
  // Merge promos: update existing, add new ones
  newConfig.promos.forEach(promo => {
    existingMap.set(promo.code, promo);
  });

  return {
    promos: Array.from(existingMap.values()),
    metadata: newConfig.metadata, // Always use latest metadata
  };
}

export function preloadPromoConfig(authSeed: string): Promise<PromoConfig | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const apiUrl = await getApiUrl('/admin/promo-config');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
        }),
      });

      const data = await response.json();

      if (data.success && data.config) {
        // Convert backend format to frontend format
        const convertedConfig = convertBackendToFrontend(data.config);
        setCachedPromoConfig(convertedConfig);
        resolve(convertedConfig);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading promo config:', error);
      resolve(null);
    }
  });
}

function convertBackendToFrontend(backendConfig: any): PromoConfig {
  const convertedPromos = backendConfig.promos.map((promo: any) => {
    let value: PromoValue;
    if (promo.value.PriceCut !== undefined) {
      value = { type: 'price_cut', amount: promo.value.PriceCut };
    } else if (promo.value.NewProduct !== undefined) {
      value = { type: 'new_product', isNew: promo.value.NewProduct };
    } else {
      // Fallback
      value = { type: 'price_cut', amount: 100 };
    }
    
    return {
      code: promo.code,
      value
    };
  });

  return {
    promos: convertedPromos,
    metadata: backendConfig.metadata
  };
}

