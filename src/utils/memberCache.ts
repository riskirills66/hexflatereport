interface Member {
  kode: string;
  nama: string;
  saldo: number;
  alamat?: string;
  aktif: boolean;
  kode_upline?: string;
  kode_level?: string;
  tgl_daftar?: string;
  tgl_aktivitas?: string;
  nama_pemilik?: string;
  markup?: number;
  verification: UserVerification[];
}

interface UserVerification {
  id: string;
  type_: string;
  status: string;
  image_url?: string;
}

interface MemberListResponse {
  success: boolean;
  message: string;
  members: Member[];
  total: number;
  limit: number;
  has_more: boolean;
  next_cursor?: string;
}

interface CacheEntry {
  data: MemberListResponse;
  timestamp: number;
  filters: {
    searchTerm: string;
    statusFilter: string;
    levelFilter: string;
    verificationFilter: string;
  };
}

const CACHE_KEY = 'memberManagementCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

function getCacheKey(filters: {
  searchTerm: string;
  statusFilter: string;
  levelFilter: string;
  verificationFilter: string;
}): string {
  return `${filters.searchTerm}_${filters.statusFilter}_${filters.levelFilter}_${filters.verificationFilter}`;
}

export function getCachedMembers(filters: {
  searchTerm: string;
  statusFilter: string;
  levelFilter: string;
  verificationFilter: string;
}): MemberListResponse | null {
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
    console.error('Error reading cache:', error);
    return null;
  }
}

export function setCachedMembers(
  filters: {
    searchTerm: string;
    statusFilter: string;
    levelFilter: string;
    verificationFilter: string;
  },
  data: MemberListResponse
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
    console.error('Error writing cache:', error);
  }
}

export function mergeMembers(
  existing: Member[],
  newMembers: Member[],
  isLoadMore: boolean
): Member[] {
  if (!isLoadMore) {
    return newMembers;
  }

  const existingMap = new Map(existing.map(m => [m.kode, m]));
  
  newMembers.forEach(member => {
    existingMap.set(member.kode, member);
  });

  return Array.from(existingMap.values());
}

export function updateCachedMembers(
  filters: {
    searchTerm: string;
    statusFilter: string;
    levelFilter: string;
    verificationFilter: string;
  },
  newMembers: Member[],
  total: number,
  hasMore: boolean,
  nextCursor?: string,
  isLoadMore: boolean = false
): void {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cache: Record<string, CacheEntry> = cached ? JSON.parse(cached) : {};
    const key = getCacheKey(filters);
    const existing = cache[key];

    if (existing) {
      const mergedMembers = mergeMembers(existing.data.members, newMembers, isLoadMore);
      cache[key] = {
        ...existing,
        data: {
          ...existing.data,
          members: mergedMembers,
          total,
          has_more: hasMore,
          next_cursor: nextCursor,
        },
        timestamp: Date.now(),
      };
    } else {
      cache[key] = {
        data: {
          success: true,
          message: '',
          members: newMembers,
          total,
          has_more: hasMore,
          next_cursor: nextCursor,
          limit: 10,
        },
        timestamp: Date.now(),
        filters,
      };
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error updating cache:', error);
  }
}

export function clearMemberCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

export function preloadMembers(
  authSeed: string,
  filters: {
    searchTerm: string;
    statusFilter: string;
    levelFilter: string;
    verificationFilter: string;
  }
): Promise<MemberListResponse | null> {
  return new Promise(async (resolve) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        resolve(null);
        return;
      }

      const { getApiUrl, X_TOKEN_VALUE } = await import('../config/api');
      const params = new URLSearchParams({
        limit: '10',
        ...(filters.searchTerm && { search: filters.searchTerm }),
        ...(filters.statusFilter !== 'all' && { status: filters.statusFilter }),
        ...(filters.levelFilter && { level: filters.levelFilter }),
        ...(filters.verificationFilter !== 'all' && { verification: filters.verificationFilter }),
      });

      const apiUrl = await getApiUrl(`/members?${params}`);
      const response = await fetch(apiUrl, {
        headers: {
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data: MemberListResponse = await response.json();

      if (data.success) {
        setCachedMembers(filters, data);
        resolve(data);
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error('Error preloading members:', error);
      resolve(null);
    }
  });
}

