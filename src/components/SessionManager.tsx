import { useEffect, useState, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { Spinner } from '../styles';
import { Search, Shield, XCircle, Calendar, Smartphone, Hash } from 'lucide-react';
import { getCachedSessions, setCachedSessions, mergeSessions, appendSessions } from '../utils/sessionCache';

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

interface SessionManagerProps {
  authSeed: string;
  onStatsChange?: (total: number, displayed: number) => void;
}

export interface SessionManagerRef {
  refresh: () => void;
}

const SessionManager = forwardRef<SessionManagerRef, SessionManagerProps>(({ authSeed, onStatsChange }, ref) => {
  const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
  const [message, setMessage] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [safetyFilter, setSafetyFilter] = useState<'all' | 'safe' | 'unsafe'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [limit] = useState(25);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [togglingSafety, setTogglingSafety] = useState<Set<string>>(new Set());
  const [deletingSessions, setDeletingSessions] = useState<Set<string>>(new Set());
  const isFetchingRef = useRef(false);

  const cursorRef = useRef<string | undefined>(undefined);
  const fetchSessionsRef = useRef<((isInitial?: boolean, background?: boolean) => Promise<void>) | null>(null);
  
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  const fetchSessions = useCallback(async (isInitial = false, background = false) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current && background) {
      return;
    }
    isFetchingRef.current = true;
    if (!background && isInitial) {
      setIsLoadingMore(false);
    } else if (!isInitial) {
      setIsLoadingMore(true);
    }
    
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
        }
        return;
      }

      const filters = {
        searchTerm,
        safetyFilter,
        fromDate,
        toDate,
        limit,
      };

      const params = new URLSearchParams({
        limit: String(limit),
      });
      if (searchTerm.trim() !== '') params.set('search', searchTerm);
      if (safetyFilter !== 'all') params.set('safety', safetyFilter === 'safe' ? '1' : '0');
      if (fromDate) params.set('from', `${fromDate} 00:00:00`);
      if (toDate) params.set('to', `${toDate} 23:59:59`);
      if (!isInitial && cursorRef.current) params.set('cursor', cursorRef.current);

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
        
        if (isInitial) {
          // Merge/update sessions without rebuilding components
          setSessions(prev => {
            const merged = mergeSessions(prev, sanitized);
            return merged;
          });
        } else {
          // Append for pagination
          setSessions(prev => {
            const appended = appendSessions(prev, sanitized);
            return appended;
          });
        }
        
        setTotal(data.total || 0);
        setHasMore(data.has_more || false);
        setCursor(data.next_cursor);
        
        // Update cache for initial load
        if (isInitial) {
          setCachedSessions(filters, {
            sessions: sanitized,
            total: data.total || 0,
            hasMore: data.has_more || false,
            nextCursor: data.next_cursor,
          });
        }
      } else {
        if (!background) {
          setMessage(data.message || 'Gagal memuat sesi');
        }
      }
    } catch (e) {
      if (!background) {
        setMessage('Gagal memuat sesi');
      }
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [searchTerm, safetyFilter, fromDate, toDate, limit, authSeed]);

  useEffect(() => {
    fetchSessionsRef.current = fetchSessions;
  }, [fetchSessions]);

  const lastFiltersRef = useRef<string>('');
  const isInitialMountRef = useRef(true);
  const filterEffectMountedRef = useRef(false);

  useEffect(() => {
    // Prevent running if already mounted and filters haven't changed
    const filterKey = `${searchTerm}_${safetyFilter}_${fromDate}_${toDate}_${limit}`;
    
    if (filterEffectMountedRef.current && lastFiltersRef.current === filterKey) {
      return;
    }
    
    filterEffectMountedRef.current = true;
    lastFiltersRef.current = filterKey;
    
    const filters = {
      searchTerm,
      safetyFilter,
      fromDate,
      toDate,
      limit,
    };
    
    // Load from cache immediately
    const cached = getCachedSessions(filters);
    if (cached) {
      // Use functional updates to avoid dependency issues
      setSessions(() => cached.sessions);
      setTotal(() => cached.total);
      setHasMore(() => cached.hasMore);
      setCursor(() => cached.nextCursor);
    } else if (!isInitialMountRef.current) {
      // Only clear state if not initial mount (filters changed)
      setSessions(() => []);
      setTotal(() => 0);
      setHasMore(() => false);
      setCursor(() => undefined);
    }
    
    // Fetch fresh data in background - use a longer delay to ensure state is settled
    const delay = isInitialMountRef.current ? 200 : 500;
    const timer = setTimeout(() => {
      if (!isFetchingRef.current && fetchSessionsRef.current) {
        fetchSessionsRef.current(true, true);
      }
    }, delay);
    
    isInitialMountRef.current = false;
    
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, safetyFilter, fromDate, toDate]);


  // Notify parent when sessions or total changes
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(total, sessions.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, sessions.length]);

  const refreshData = () => {
    setCursor(undefined);
    setSessions([]);
    fetchSessions(true, false);
  };

  useImperativeHandle(ref, () => ({
    refresh: refreshData,
  }));

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchSessions(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('id-ID');
    } catch {
      return dateString;
    }
  };

  const toggleSafetyCheck = async (sessionKey: string, currentSafety: number) => {
    setTogglingSafety(prev => new Set([...prev, sessionKey]));
    try {
      const sessionKeyAdmin = localStorage.getItem('adminSessionKey');
      if (!sessionKeyAdmin) {
        setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const apiUrl = await getApiUrl('/admin/toggle-safety');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKeyAdmin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          safety_status: currentSafety === 1 ? 0 : 1,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local list without refetch
        setSessions(prev => prev.map(s =>
          (s as any).session_key === sessionKey ? { ...s, safetycheck: currentSafety === 1 ? 0 : 1 } : s
        ));
        setMessage('Status keamanan berhasil diperbarui');
      } else {
        setMessage(data.message || 'Gagal memperbarui status');
      }
    } catch (e) {
      setMessage('Gagal memperbarui status');
    } finally {
      setTogglingSafety(prev => { const n = new Set(prev); n.delete(sessionKey); return n; });
    }
  };

  const deleteSession = async (sessionKey: string) => {
    setDeletingSessions(prev => new Set([...prev, sessionKey]));
    try {
      const sessionKeyAdmin = localStorage.getItem('adminSessionKey');
      if (!sessionKeyAdmin) {
        setMessage('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const apiUrl = await getApiUrl('/admin/delete-session');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKeyAdmin,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify({ session_key: sessionKey }),
      });

      const data = await response.json();
      if (data.success) {
        setSessions(prev => prev.filter(s => (s as any).session_key !== sessionKey));
        setTotal(t => Math.max(0, t - 1));
        setMessage('Sesi berhasil dihapus');
      } else {
        setMessage(data.message || 'Gagal menghapus sesi');
      }
    } catch (e) {
      setMessage('Gagal menghapus sesi');
    } finally {
      setDeletingSessions(prev => { const n = new Set(prev); n.delete(sessionKey); return n; });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSafetyFilter('all');
    setFromDate('');
    setToDate('');
    setCursor(undefined);
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">{message}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor/ perangkat/ IMEI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <select
            value={safetyFilter}
            onChange={(e) => setSafetyFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Semua Keamanan</option>
            <option value="safe">Aman</option>
            <option value="unsafe">Tidak Aman</option>
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Hapus Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <>
            <div className="overflow-x-auto">
              <div>
                {(() => {
                  // Proportional columns that fill available width without horizontal scroll
                  const columnsTemplate = '1fr 1.2fr 1.8fr 1.2fr 0.8fr 1fr 1fr';
                  return (
                    <>
                      <div
                        className="grid bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ gridTemplateColumns: columnsTemplate }}
                      >
                        <div className="px-2 py-2">ID</div>
                        <div className="px-2 py-2">Nomor</div>
                        <div className="px-2 py-2">Perangkat</div>
                        <div className="px-2 py-2">IMEI</div>
                        <div className="px-2 py-2">Keamanan</div>
                        <div className="px-2 py-2">Dibuat</div>
                        <div className="px-2 py-2">Aksi</div>
                      </div>
                      <div>
                        {sessions.map((s) => (
                          <div
                            key={s.session_key}
                            className="grid items-center border-b border-gray-200 hover:bg-gray-50 text-xs"
                            style={{ gridTemplateColumns: columnsTemplate }}
                          >
                            <div className="px-2 py-2 text-gray-900 min-w-0"><span className="truncate block">{s.id || '-'}</span></div>
                            <div className="px-2 py-2 text-gray-900 min-w-0 flex items-center">
                              <Hash className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                              <span className="truncate">{s.number}</span>
                            </div>
                            <div className="px-2 py-2 text-gray-900 min-w-0 flex items-center">
                              <Smartphone className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                              <span className="truncate">{s.device_model || '-'}</span>
                            </div>
                            <div className="px-2 py-2 text-gray-900 min-w-0"><span className="truncate block">{s.imei || '-'}</span></div>
                            <div className="px-2 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                s.safetycheck === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                <Shield className="h-3 w-3 mr-1" />
                                {s.safetycheck === 1 ? 'Aman' : 'Tidak Aman'}
                              </span>
                            </div>
                            <div className="px-2 py-2 text-gray-500 min-w-0"><span className="truncate block">{formatDate(s.created_at)}</span></div>
                            <div className="px-2 py-2 font-medium">
                              <div className="flex flex-col space-y-1">
                                <button
                                  onClick={() => toggleSafetyCheck(s.session_key, s.safetycheck)}
                                  disabled={togglingSafety.has(s.session_key)}
                                  className={`text-xs px-1.5 py-0.5 rounded w-full ${
                                    s.safetycheck === 1 ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {togglingSafety.has(s.session_key) ? (
                                    <Spinner size="sm" color="secondary" />
                                  ) : s.safetycheck === 1 ? (
                                    'Tandai Tidak Aman'
                                  ) : (
                                    'Tandai perangkat aman'
                                  )}
                                </button>
                                <button
                                  onClick={() => deleteSession(s.session_key)}
                                  disabled={deletingSessions.has(s.session_key)}
                                  className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                                >
                                  {deletingSessions.has(s.session_key) ? (
                                    <Spinner size="sm" color="secondary" />
                                  ) : (
                                    <div className="flex items-center justify-center"><XCircle className="h-3 w-3 mr-1" /> Keluar</div>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="bg-white px-4 py-3 flex items-center justify-center border-t border-gray-200 sm:px-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 min-w-[150px] justify-center"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center space-x-2">
                      <Spinner size="sm" color="secondary" />
                      <span>Memuat...</span>
                    </div>
                  ) : (
                    'Muat Lebih Banyak'
                  )}
                </button>
              </div>
            )}
        </>
      </div>
    </div>
  );
});

SessionManager.displayName = 'SessionManager';

export default SessionManager;


