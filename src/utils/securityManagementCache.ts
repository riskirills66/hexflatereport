interface SecurityConfig {
  server_config: {};
  database_config: {
    connectionstring: string;
  };
  cors_config?: {
    allowed_origins: string[];
    allowed_methods: string[];
    allowed_headers: string[];
    allow_credentials: boolean;
  };
  balance_transfer?: {
    add_format: string;
    trans_format: string;
  };
  combotrx?: {
    outbox_like_pattern: string;
    sdh_pernah_filter: string;
  };
  trx?: {
    pesan_format_no_val: string;
    pesan_format_with_val_nonzero: string;
    pesan_format_with_val_zero: string;
    combo_code_format: string;
  };
  commission_exchange?: {
    tukar_format: string;
  };
  client_config?: {
    blocked_referrals: string[];
  };
  history?: {
    minimum_harga_to_display_in_history: number;
  };
  poin?: {
    exchange_rate: number;
    minimum_exchange?: number;
  };
  outbox_patterns?: {
    static_patterns: {
      transaksi_sukses: {
        title: string;
        pattern: string;
      };
      transaksi_proses: {
        title: string;
        pattern: string;
      };
      transaksi_gagal: {
        title: string;
        pattern: string;
      };
    };
    dynamic_patterns: {
      [key: string]: {
        title: string;
        pattern: string;
      };
    };
  };
}

type AppRules = Record<string, any>;

interface CutoffConfig {
  cutoff_start: string;
  cutoff_end: string;
}

interface SecurityManagementCache {
  config: SecurityConfig | null;
  appRules: AppRules | null;
  dynamicRules: AppRules | null;
  cutoffConfig: CutoffConfig | null;
  demoNumber: string | null;
  timestamp: number;
}

const CACHE_KEY = 'securityManagementCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function getCachedSecurityManagement(): SecurityManagementCache | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: SecurityManagementCache = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry;
  } catch (error) {
    console.error('Error reading security management cache:', error);
    return null;
  }
}

export function setCachedSecurityManagement(cache: Partial<SecurityManagementCache>): void {
  try {
    const existing = getCachedSecurityManagement();
    const entry: SecurityManagementCache = {
      config: cache.config !== undefined ? cache.config : (existing?.config ?? null),
      appRules: cache.appRules !== undefined ? cache.appRules : (existing?.appRules ?? null),
      dynamicRules: cache.dynamicRules !== undefined ? cache.dynamicRules : (existing?.dynamicRules ?? null),
      cutoffConfig: cache.cutoffConfig !== undefined ? cache.cutoffConfig : (existing?.cutoffConfig ?? null),
      demoNumber: cache.demoNumber !== undefined ? cache.demoNumber : (existing?.demoNumber ?? null),
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing security management cache:', error);
  }
}

export function clearSecurityManagementCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing security management cache:', error);
  }
}

export function preloadSecurityManagement(authSeed: string): Promise<SecurityManagementCache | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      // Fetch all data in parallel
      const [configRes, appRulesRes, cutoffRes, demoRes] = await Promise.all([
        fetch(await getApiUrl('/admin/security-config'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Token': X_TOKEN_VALUE,
            'Session-Key': sessionKey,
            'Auth-Seed': authSeed,
          },
        }),
        fetch(await getApiUrl('/admin/app-rules'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Token': X_TOKEN_VALUE,
            'Session-Key': sessionKey,
            'Auth-Seed': authSeed,
          },
          body: JSON.stringify({}),
        }),
        fetch(await getApiUrl('/admin/cutoff-config'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Token': X_TOKEN_VALUE,
            'Session-Key': sessionKey,
            'Auth-Seed': authSeed,
          },
        }),
        fetch(await getApiUrl('/admin/demo-config'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Token': X_TOKEN_VALUE,
            'Session-Key': sessionKey,
            'Auth-Seed': authSeed,
          },
          body: JSON.stringify({}),
        }),
      ]);

      const [configData, appRulesData, cutoffData, demoData] = await Promise.all([
        configRes.json(),
        appRulesRes.json(),
        cutoffRes.json(),
        demoRes.json(),
      ]);

      const cache: SecurityManagementCache = {
        config: configData.success && configData.config ? configData.config : null,
        appRules: appRulesData.success && appRulesData.rules ? appRulesData.rules : null,
        dynamicRules: (() => {
          if (appRulesData.success && appRulesData.rules) {
            const dynamicRulesFiltered: AppRules = {};
            const prefixes = ['newUserUpline', 'newUserGroup', 'newUserMarkup'];
            Object.entries(appRulesData.rules).forEach(([key, value]) => {
              if (prefixes.some(prefix => key.startsWith(prefix))) {
                dynamicRulesFiltered[key] = value;
              }
            });
            return dynamicRulesFiltered;
          }
          return null;
        })(),
        cutoffConfig: cutoffData.success && cutoffData.config ? cutoffData.config : null,
        demoNumber: demoData.success ? (demoData.demo_number || null) : null,
        timestamp: Date.now(),
      };

      setCachedSecurityManagement(cache);
      resolve(cache);
    } catch (error) {
      console.error('Error preloading security management:', error);
      resolve(null);
    }
  });
}

