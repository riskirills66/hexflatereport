interface ClassesResponse {
  success: boolean;
  message?: string;
  classes?: string[];
}

interface CacheEntry {
  classes: string[];
  timestamp: number;
}

const CACHE_KEY = 'broadcastCenterCache';
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes (classes don't change often)

export function getCachedClasses(): string[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry.classes;
  } catch (error) {
    console.error('Error reading broadcast cache:', error);
    return null;
  }
}

export function setCachedClasses(classes: string[]): void {
  try {
    const entry: CacheEntry = {
      classes,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing broadcast cache:', error);
  }
}

export function mergeClasses(
  existing: string[],
  newClasses: string[]
): string[] {
  const existingSet = new Set(existing);
  
  newClasses.forEach(className => {
    existingSet.add(className);
  });

  return Array.from(existingSet).sort();
}

export function clearBroadcastCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing broadcast cache:', error);
  }
}

export function preloadBroadcastClasses(authSeed: string): Promise<string[] | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const apiUrl = await getApiUrl('/admin/reseller-classes');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: ClassesResponse = await response.json();

      if (data.success && data.classes) {
        setCachedClasses(data.classes);
        resolve(data.classes);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading broadcast classes:', error);
      resolve(null);
    }
  });
}

