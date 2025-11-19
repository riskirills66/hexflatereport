interface FeedbackItem {
  id: number;
  user_id: string;
  name: string;
  feedback: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface FeedbackCacheEntry {
  feedback: FeedbackItem[];
  total: number;
  timestamp: number;
}

interface FeedbackFilters {
  page: number;
  searchTerm: string;
}

const CACHE_KEY_PREFIX = 'feedbackCache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters: FeedbackFilters): string {
  return `${CACHE_KEY_PREFIX}${filters.page}_${filters.searchTerm || ''}`;
}

export function getCachedFeedback(filters: FeedbackFilters): { feedback: FeedbackItem[]; total: number } | null {
  try {
    const cacheKey = getCacheKey(filters);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const entry: FeedbackCacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return {
      feedback: entry.feedback || [],
      total: entry.total || 0,
    };
  } catch (error) {
    console.error('Error reading feedback cache:', error);
    return null;
  }
}

export function setCachedFeedback(filters: FeedbackFilters, feedback: FeedbackItem[], total: number): void {
  try {
    const cacheKey = getCacheKey(filters);
    const entry: FeedbackCacheEntry = {
      feedback,
      total,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing feedback cache:', error);
  }
}

export function mergeFeedback(
  existing: FeedbackItem[],
  newFeedback: FeedbackItem[]
): FeedbackItem[] {
  const existingMap = new Map(existing.map(f => [f.id, f]));
  
  newFeedback.forEach(item => {
    existingMap.set(item.id, item);
  });

  return Array.from(existingMap.values()).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Most recent first
  });
}

export function removeCachedFeedbackItem(feedbackId: number, filters: FeedbackFilters): void {
  try {
    const cached = getCachedFeedback(filters);
    if (cached) {
      const updatedFeedback = cached.feedback.filter(f => f.id !== feedbackId);
      setCachedFeedback(filters, updatedFeedback, cached.total - 1);
    }
  } catch (error) {
    console.error('Error removing feedback item from cache:', error);
  }
}

export function clearFeedbackCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing feedback cache:', error);
  }
}

export function preloadFeedback(authSeed: string, filters: FeedbackFilters = { page: 1, searchTerm: '' }): Promise<{ feedback: FeedbackItem[]; total: number } | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: '10',
        ...(filters.searchTerm && { search: filters.searchTerm })
      });

      const apiUrl = await getApiUrl(`/admin/feedback?${params}`);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data = await response.json();

      if (data.success && data.feedback) {
        setCachedFeedback(filters, data.feedback, data.total || 0);
        resolve({
          feedback: data.feedback,
          total: data.total || 0,
        });
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading feedback:', error);
      resolve(null);
    }
  });
}

