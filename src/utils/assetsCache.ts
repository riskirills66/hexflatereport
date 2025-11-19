interface AssetInfo {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  uploader_id: string;
  uploader_name: string;
  public_url: string;
}

interface AssetsListResponse {
  success: boolean;
  assets: AssetInfo[];
  total_count: number;
  page: number;
  limit: number;
}

interface CacheEntry {
  data: AssetsListResponse;
  timestamp: number;
  filters: {
    page: number;
    searchTerm: string;
  };
}

const CACHE_KEY = 'assetsManagementCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters: {
  page: number;
  searchTerm: string;
}): string {
  return `${filters.page}_${filters.searchTerm || ''}`;
}

export function getCachedAssets(filters: {
  page: number;
  searchTerm: string;
}): AssetsListResponse | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: Record<string, CacheEntry> = JSON.parse(cached);
    const key = getCacheKey(filters);
    const entry = cache[key];

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_EXPIRY) {
      delete cache[key];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading assets cache:', error);
    return null;
  }
}

export function setCachedAssets(
  filters: {
    page: number;
    searchTerm: string;
  },
  data: AssetsListResponse
): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cache: Record<string, CacheEntry> = cached ? JSON.parse(cached) : {};

    const key = getCacheKey(filters);
    cache[key] = {
      data,
      timestamp: Date.now(),
      filters,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error writing assets cache:', error);
  }
}

export function mergeAssets(
  existing: AssetInfo[],
  newAssets: AssetInfo[],
  isLoadMore: boolean
): AssetInfo[] {
  if (!isLoadMore) {
    return newAssets;
  }

  const existingMap = new Map(existing.map(a => [a.id, a]));
  
  newAssets.forEach(asset => {
    existingMap.set(asset.id, asset);
  });

  return Array.from(existingMap.values());
}

export function updateCachedAssets(
  filters: {
    page: number;
    searchTerm: string;
  },
  newAssets: AssetInfo[],
  totalCount: number,
  isLoadMore: boolean = false
): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cache: Record<string, CacheEntry> = cached ? JSON.parse(cached) : {};
    const key = getCacheKey(filters);
    const existing = cache[key];

    if (existing) {
      const mergedAssets = mergeAssets(existing.data.assets, newAssets, isLoadMore);
      cache[key] = {
        ...existing,
        data: {
          ...existing.data,
          assets: mergedAssets,
          total_count: totalCount,
        },
        timestamp: Date.now(),
      };
    } else {
      cache[key] = {
        data: {
          success: true,
          assets: newAssets,
          total_count: totalCount,
          page: filters.page,
          limit: 20,
        },
        timestamp: Date.now(),
        filters,
      };
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error updating assets cache:', error);
  }
}

export function clearAssetsCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing assets cache:', error);
  }
}

export function preloadAssets(
  authSeed: string,
  filters: {
    page: number;
    searchTerm: string;
  } = {
    page: 1,
    searchTerm: '',
  }
): Promise<AssetsListResponse | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const apiUrl = await getApiUrl('/admin/assets/list');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
          page: filters.page,
          limit: 20,
          search: filters.searchTerm || undefined,
        }),
      });

      const data: AssetsListResponse = await response.json();

      if (data.success) {
        setCachedAssets(filters, data);
        resolve(data);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading assets:', error);
      resolve(null);
    }
  });
}

