interface PrivacyPolicyCacheEntry {
  content: string;
  timestamp: number;
}

const CACHE_KEY = 'privacyPolicyCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function getCachedPrivacyPolicy(): string | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const entry: PrivacyPolicyCacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return entry.content || null;
  } catch (error) {
    console.error('Error reading privacy policy cache:', error);
    return null;
  }
}

export function setCachedPrivacyPolicy(content: string): void {
  try {
    const entry: PrivacyPolicyCacheEntry = {
      content,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing privacy policy cache:', error);
  }
}

export function clearPrivacyPolicyCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing privacy policy cache:', error);
  }
}

export function preloadPrivacyPolicy(authSeed: string): Promise<string | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const apiUrl = await getApiUrl('/admin/privacy-policy');
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

      const data = await response.json();

      if (data.success && data.content) {
        setCachedPrivacyPolicy(data.content);
        resolve(data.content);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading privacy policy:', error);
      resolve(null);
    }
  });
}

