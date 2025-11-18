interface AdminSessionItem {
  session_key: string;
  id?: string;
  number: string;
  device_model?: string;
  imei?: string;
  safetycheck: number;
  created_at: string;
}

interface SessionListResponse {
  success: boolean;
  message: string;
  total: number;
  sessions: AdminSessionItem[];
  has_more: boolean;
  next_cursor?: string;
}

interface SessionFilters {
  searchTerm: string;
  safetyFilter: 'all' | 'safe' | 'unsafe';
  fromDate: string;
  toDate: string;
  limit: number;
}

interface CacheEntry {
  sessions: AdminSessionItem[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'sessionManagerCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters: SessionFilters): string {
  const key = `${CACHE_KEY_PREFIX}_${filters.searchTerm}_${filters.safetyFilter}_${filters.fromDate}_${filters.toDate}_${filters.limit}`;
  return key;
}

export function getCachedSessions(filters: SessionFilters): CacheEntry | null {
  try {
    const key = getCacheKey(filters);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }

    return entry;
  } catch (error) {
    console.error('Error reading session cache:', error);
    return null;
  }
}

export function setCachedSessions(filters: SessionFilters, data: Omit<CacheEntry, 'timestamp'>): void {
  try {
    const key = getCacheKey(filters);
    const entry: CacheEntry = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing session cache:', error);
  }
}

export function mergeSessions(
  existing: AdminSessionItem[],
  newSessions: AdminSessionItem[]
): AdminSessionItem[] {
  const existingMap = new Map(existing.map(s => [s.session_key, s]));
  
  newSessions.forEach(session => {
    const existing = existingMap.get(session.session_key);
    if (existing) {
      // Update existing session with new data
      existingMap.set(session.session_key, { ...existing, ...session });
    } else {
      // Add new session
      existingMap.set(session.session_key, session);
    }
  });
  
  return Array.from(existingMap.values());
}

export function appendSessions(
  existing: AdminSessionItem[],
  newSessions: AdminSessionItem[]
): AdminSessionItem[] {
  // For pagination, append new sessions
  const existingKeys = new Set(existing.map(s => s.session_key));
  const uniqueNewSessions = newSessions.filter(s => !existingKeys.has(s.session_key));
  return [...existing, ...uniqueNewSessions];
}

export function clearSessionCache(): void {
  try {
    // Clear all session cache entries
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing session cache:', error);
  }
}

export function preloadSessions(
  authSeed: string,
  filters: SessionFilters = {
    searchTerm: '',
    safetyFilter: 'all',
    fromDate: '',
    toDate: '',
    limit: 25,
  }
): Promise<CacheEntry | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      const params = new URLSearchParams({
        limit: String(filters.limit),
      });
      if (filters.searchTerm.trim() !== '') params.set('search', filters.searchTerm);
      if (filters.safetyFilter !== 'all') params.set('safety', filters.safetyFilter === 'safe' ? '1' : '0');
      if (filters.fromDate) params.set('from', `${filters.fromDate} 00:00:00`);
      if (filters.toDate) params.set('to', `${filters.toDate} 23:59:59`);

      const apiUrl = await getApiUrl(`/admin/sessions?${params.toString()}`);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: SessionListResponse = await response.json();
      if (data.success) {
        // Frontend safety: hide incomplete rows if backend config changes
        const sanitized = (data.sessions || []).filter(s => s.id && s.device_model && s.imei);
        
        const cacheEntry: CacheEntry = {
          sessions: sanitized,
          total: data.total || 0,
          hasMore: data.has_more || false,
          nextCursor: data.next_cursor,
        };
        
        setCachedSessions(filters, cacheEntry);
        resolve(cacheEntry);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading sessions:', error);
      resolve(null);
    }
  });
}

