type AppRules = Record<string, any>;
type InfoConfig = Record<string, any>;
type TiketRegexConfig = Record<string, any>;
type CheckProductsConfig = Record<string, string[]>;
type CektagihanConfig = Record<string, string>;
type ReceiptConfig = {
  name: string;
  product_prefixes: string[];
  regex: string;
  highlight_key: string;
  dash: boolean;
  receipt_title: string;
  info_text: string;
};
type ReceiptMapsConfig = {
  configs: ReceiptConfig[];
};
type TopicCard = {
  icon: string;
  title: string;
  desc: string;
  url?: string;
  route?: string;
  routeArgs?: {
    url: string;
  };
};
type BantuanConfig = {
  mainCard: string;
  mainCardContent: string;
  topicTitle: string;
  topicCards: TopicCard[];
};
type CombotrxConfig = Record<string, any>;

interface SystemSettingsCache {
  appRules: AppRules | null;
  infoConfig: InfoConfig | null;
  tiketRegexConfig: TiketRegexConfig | null;
  checkProductsConfig: CheckProductsConfig | null;
  combotrxConfig: CombotrxConfig | null;
  cektagihanConfig: CektagihanConfig | null;
  receiptMapsConfig: ReceiptMapsConfig | null;
  bantuanConfig: BantuanConfig | null;
  timestamp: number;
}

const CACHE_KEY = 'systemSettingsCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function getCachedSystemSettings(): SystemSettingsCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: SystemSettingsCache = JSON.parse(cached);
    const now = Date.now();
    
    if (now - cache.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cache;
  } catch (error) {
    console.error('Error reading system settings cache:', error);
    return null;
  }
}

export function setCachedSystemSettings(cache: Partial<SystemSettingsCache>): void {
  try {
    const existing = getCachedSystemSettings();
    const newCache: SystemSettingsCache = {
      appRules: cache.appRules !== undefined ? cache.appRules : (existing?.appRules || null),
      infoConfig: cache.infoConfig !== undefined ? cache.infoConfig : (existing?.infoConfig || null),
      tiketRegexConfig: cache.tiketRegexConfig !== undefined ? cache.tiketRegexConfig : (existing?.tiketRegexConfig || null),
      checkProductsConfig: cache.checkProductsConfig !== undefined ? cache.checkProductsConfig : (existing?.checkProductsConfig || null),
      combotrxConfig: cache.combotrxConfig !== undefined ? cache.combotrxConfig : (existing?.combotrxConfig || null),
      cektagihanConfig: cache.cektagihanConfig !== undefined ? cache.cektagihanConfig : (existing?.cektagihanConfig || null),
      receiptMapsConfig: cache.receiptMapsConfig !== undefined ? cache.receiptMapsConfig : (existing?.receiptMapsConfig || null),
      bantuanConfig: cache.bantuanConfig !== undefined ? cache.bantuanConfig : (existing?.bantuanConfig || null),
      timestamp: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
  } catch (error) {
    console.error('Error writing system settings cache:', error);
  }
}

export function clearSystemSettingsCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing system settings cache:', error);
  }
}

export function preloadSystemSettings(authSeed: string): Promise<SystemSettingsCache | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const endpoints = [
        { key: 'appRules', url: '/admin/app-rules' },
        { key: 'infoConfig', url: '/admin/info-config' },
        { key: 'tiketRegexConfig', url: '/admin/tiket-regex' },
        { key: 'checkProductsConfig', url: '/admin/check-products' },
        { key: 'combotrxConfig', url: '/admin/combotrx-config' },
        { key: 'cektagihanConfig', url: '/admin/cektagihan-config' },
        { key: 'receiptMapsConfig', url: '/admin/receipt-maps-config' },
        { key: 'bantuanConfig', url: '/admin/bantuan-config' },
      ];

      const results = await Promise.allSettled(
        endpoints.map(async ({ key, url }) => {
          try {
            const apiUrl = await getApiUrl(url);
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Token': X_TOKEN_VALUE,
                'Session-Key': sessionKey,
                'Auth-Seed': authSeed,
              },
              body: JSON.stringify({}),
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                const configKey = key === 'appRules' ? 'rules' : 'config';
                return { key, value: data[configKey] };
              }
            }
            return { key, value: null };
          } catch (error) {
            console.error(`Error preloading ${key}:`, error);
            return { key, value: null };
          }
        })
      );

      const cacheData: Partial<SystemSettingsCache> = {
        timestamp: Date.now(),
      };

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { key, value } = result.value;
          (cacheData as any)[key] = value;
        }
      });

      setCachedSystemSettings(cacheData);
      resolve(cacheData as SystemSettingsCache);
    } catch (error) {
      console.error('Error preloading system settings:', error);
      resolve(null);
    }
  });
}

