interface Hadiah {
  id: number;
  nama: string;
  poin: number;
  kategori: string;
  deskripsi: string;
  image_url: string;
  status: string;
}

interface HadiahMetadata {
  total_hadiah: number;
  kategori_tersedia: string[];
  poin_minimum: number;
  poin_maksimum: number;
  tanggal_update: string;
  versi: string;
}

interface HadiahConfig {
  hadiah: Hadiah[];
  metadata: HadiahMetadata;
}

interface CacheEntry {
  config: HadiahConfig;
  timestamp: number;
}

const CACHE_KEY = 'hadiahManagementCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function getCachedHadiahConfig(): HadiahConfig | null {
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
    console.error('Error reading hadiah cache:', error);
    return null;
  }
}

export function setCachedHadiahConfig(config: HadiahConfig): void {
  try {
    const entry: CacheEntry = {
      config,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing hadiah cache:', error);
  }
}

export function clearHadiahCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing hadiah cache:', error);
  }
}

export function mergeHadiahConfig(
  existing: HadiahConfig | null,
  newConfig: HadiahConfig
): HadiahConfig {
  if (!existing) {
    return newConfig;
  }

  // Create a map of existing hadiah by id for efficient lookup
  const existingMap = new Map(existing.hadiah.map(h => [h.id, h]));
  
  // Merge hadiah: update existing, add new ones
  newConfig.hadiah.forEach(hadiah => {
    existingMap.set(hadiah.id, hadiah);
  });

  return {
    hadiah: Array.from(existingMap.values()),
    metadata: newConfig.metadata, // Always use latest metadata
  };
}

export function preloadHadiahConfig(authSeed: string): Promise<HadiahConfig | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const apiUrl = await getApiUrl('/admin/hadiah-config');
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
        setCachedHadiahConfig(data.config);
        resolve(data.config);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading hadiah config:', error);
      resolve(null);
    }
  });
}

