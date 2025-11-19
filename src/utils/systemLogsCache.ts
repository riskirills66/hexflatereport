interface AdminActivityLog {
  id: number;
  admin_id: string;
  admin_username: string;
  action_type: string;
  action_description: string;
  target_type?: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

interface SystemLogsFilters {
  searchTerm: string;
  actionType: string;
  adminUser: string;
  dateFrom: string;
  dateTo: string;
}

interface SystemLogsCacheEntry {
  activities: AdminActivityLog[];
  uniqueActionTypes: string[];
  uniqueAdminUsers: string[];
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'systemLogsCache_';
const UNIQUE_VALUES_CACHE_KEY = 'systemLogsUniqueValuesCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters: SystemLogsFilters): string {
  const filterString = JSON.stringify({
    searchTerm: filters.searchTerm || '',
    actionType: filters.actionType || '',
    adminUser: filters.adminUser || '',
    dateFrom: filters.dateFrom || '',
    dateTo: filters.dateTo || '',
  });
  return `${CACHE_KEY_PREFIX}${btoa(filterString)}`;
}

export function getCachedSystemLogs(filters: SystemLogsFilters): AdminActivityLog[] | null {
  try {
    const cacheKey = getCacheKey(filters);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const entry: SystemLogsCacheEntry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return entry.activities || null;
  } catch (error) {
    console.error('Error reading system logs cache:', error);
    return null;
  }
}

export function setCachedSystemLogs(filters: SystemLogsFilters, activities: AdminActivityLog[], uniqueActionTypes: string[], uniqueAdminUsers: string[]): void {
  try {
    const cacheKey = getCacheKey(filters);
    const entry: SystemLogsCacheEntry = {
      activities,
      uniqueActionTypes,
      uniqueAdminUsers,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
    
    // Also cache unique values separately for quick access
    localStorage.setItem(UNIQUE_VALUES_CACHE_KEY, JSON.stringify({
      uniqueActionTypes,
      uniqueAdminUsers,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Error writing system logs cache:', error);
  }
}

export function getCachedUniqueValues(): { uniqueActionTypes: string[]; uniqueAdminUsers: string[] } | null {
  try {
    const cached = localStorage.getItem(UNIQUE_VALUES_CACHE_KEY);
    if (!cached) return null;

    const entry = JSON.parse(cached);
    const now = Date.now();
    
    if (now - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(UNIQUE_VALUES_CACHE_KEY);
      return null;
    }

    return {
      uniqueActionTypes: entry.uniqueActionTypes || [],
      uniqueAdminUsers: entry.uniqueAdminUsers || [],
    };
  } catch (error) {
    console.error('Error reading unique values cache:', error);
    return null;
  }
}

export function mergeSystemLogs(
  existing: AdminActivityLog[],
  newLogs: AdminActivityLog[]
): AdminActivityLog[] {
  const existingMap = new Map(existing.map(log => [log.id, log]));
  
  newLogs.forEach(log => {
    existingMap.set(log.id, log);
  });

  return Array.from(existingMap.values()).sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA; // Most recent first
  });
}

export function clearSystemLogsCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX) || key === UNIQUE_VALUES_CACHE_KEY) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing system logs cache:', error);
  }
}

export function preloadSystemLogs(authSeed: string, filters: SystemLogsFilters = {
  searchTerm: '',
  actionType: '',
  adminUser: '',
  dateFrom: '',
  dateTo: '',
}): Promise<{ activities: AdminActivityLog[]; uniqueActionTypes: string[]; uniqueAdminUsers: string[] } | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');

      // Fetch filtered activities
      const apiUrl = await getApiUrl('/admin/activities/filtered');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
          search_term: filters.searchTerm || null,
          action_type: filters.actionType || null,
          admin_user: filters.adminUser || null,
          date_from: filters.dateFrom || null,
          date_to: filters.dateTo || null,
          limit: 100,
          offset: 0,
        }),
      });

      const data = await response.json();

      if (data.success && data.activities) {
        const limitedActivities = data.activities.slice(0, 100);
        
        // Fetch unique values
        const uniqueUrl = await getApiUrl('/admin/activities');
        const uniqueResponse = await fetch(uniqueUrl, {
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

        const uniqueData = await uniqueResponse.json();
        let uniqueActionTypes: string[] = [];
        let uniqueAdminUsers: string[] = [];

        if (uniqueData.success && uniqueData.activities) {
          uniqueActionTypes = [...new Set(uniqueData.activities.map((a: AdminActivityLog) => a.action_type))].sort();
          uniqueAdminUsers = [...new Set(uniqueData.activities.map((a: AdminActivityLog) => a.admin_username))].sort();
        }

        setCachedSystemLogs(filters, limitedActivities, uniqueActionTypes, uniqueAdminUsers);
        resolve({
          activities: limitedActivities,
          uniqueActionTypes,
          uniqueAdminUsers,
        });
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading system logs:', error);
      resolve(null);
    }
  });
}

