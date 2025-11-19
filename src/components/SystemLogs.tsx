import { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { 
  RefreshCw, 
  Activity, 
  Shield, 
  UserCheck, 
  Settings, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  X
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { getCachedSystemLogs, setCachedSystemLogs, getCachedUniqueValues, mergeSystemLogs } from '../utils/systemLogsCache';

interface SystemLogsProps {
  authSeed: string;
  onStatsChange?: (total: number) => void;
}

export interface SystemLogsRef {
  refresh: () => void;
  toggleFilter: () => void;
  showFilters: boolean;
}

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

interface AdminActivityResponse {
  success: boolean;
  message: string;
  activities?: AdminActivityLog[];
}

interface FilterState {
  searchTerm: string;
  actionType: string;
  adminUser: string;
  dateFrom: string;
  dateTo: string;
  showFilters: boolean;
}

const SystemLogs = forwardRef<SystemLogsRef, SystemLogsProps>(({ authSeed, onStatsChange }, ref) => {
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const prevActivitiesRef = useRef<AdminActivityLog[]>([]);
  const lastFiltersRef = useRef<FilterState | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    actionType: '',
    adminUser: '',
    dateFrom: '',
    dateTo: '',
    showFilters: false
  });

  const fetchRecentActivities = useCallback(async (background = false) => {
    if (!background) {
      setError(null);
    }
    
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setError('Kunci sesi tidak ditemukan. Silakan login lagi.');
        }
        return;
      }

      const filterParams = {
        searchTerm: filters.searchTerm,
        actionType: filters.actionType,
        adminUser: filters.adminUser,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };

      // Use the filtered endpoint with current filter state
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
          search_term: filterParams.searchTerm || null,
          action_type: filterParams.actionType || null,
          admin_user: filterParams.adminUser || null,
          date_from: filterParams.dateFrom || null,
          date_to: filterParams.dateTo || null,
          limit: 100,
          offset: 0,
        }),
      });

      const data: AdminActivityResponse = await response.json();

      if (data.success && data.activities) {
        const limitedActivities = (data.activities || []).slice(0, 100);
        setActivities(prev => {
          if (prev.length === 0) {
            return limitedActivities;
          }
          return mergeSystemLogs(prev, limitedActivities).slice(0, 100);
        });
        
        // Update cache
        const uniqueValues = getCachedUniqueValues();
        setCachedSystemLogs(
          filterParams,
          limitedActivities,
          uniqueValues?.uniqueActionTypes || [],
          uniqueValues?.uniqueAdminUsers || []
        );
      } else {
        if (!background) {
          setError(data.message || 'Gagal memuat aktivitas admin');
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin activities:', err);
      if (!background) {
        setError('Gagal memuat aktivitas admin dari backend');
      }
    }
  }, [authSeed, filters.searchTerm, filters.actionType, filters.adminUser, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    const currentFilters = {
      searchTerm: filters.searchTerm,
      actionType: filters.actionType,
      adminUser: filters.adminUser,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };
    
    const filtersChanged = 
      !lastFiltersRef.current ||
      lastFiltersRef.current.searchTerm !== currentFilters.searchTerm ||
      lastFiltersRef.current.actionType !== currentFilters.actionType ||
      lastFiltersRef.current.adminUser !== currentFilters.adminUser ||
      lastFiltersRef.current.dateFrom !== currentFilters.dateFrom ||
      lastFiltersRef.current.dateTo !== currentFilters.dateTo;

    if (filtersChanged) {
      lastFiltersRef.current = { ...filters };
      const cached = getCachedSystemLogs(currentFilters);
      if (cached) {
        prevActivitiesRef.current = cached;
        setActivities(cached);
      } else {
        setActivities([]);
      }
      fetchRecentActivities(true);
    }
  }, [fetchRecentActivities, filters.searchTerm, filters.actionType, filters.adminUser, filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    if (activities.length > 0 && prevActivitiesRef.current !== activities) {
      if (JSON.stringify(prevActivitiesRef.current) !== JSON.stringify(activities)) {
        const currentFilters = {
          searchTerm: filters.searchTerm,
          actionType: filters.actionType,
          adminUser: filters.adminUser,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        };
        const uniqueValues = getCachedUniqueValues();
        setCachedSystemLogs(
          currentFilters,
          activities,
          uniqueValues?.uniqueActionTypes || [],
          uniqueValues?.uniqueAdminUsers || []
        );
        prevActivitiesRef.current = activities;
      }
    }
  }, [activities, filters.searchTerm, filters.actionType, filters.adminUser, filters.dateFrom, filters.dateTo]);

  // Notify parent when activities change
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange(activities.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities.length]);

  const refreshData = () => {
    fetchRecentActivities(false);
  };

  const toggleFilterHandler = () => {
    setFilters(prev => ({ ...prev, showFilters: !prev.showFilters }));
  };

  useImperativeHandle(ref, () => ({
    refresh: refreshData,
    toggleFilter: toggleFilterHandler,
    showFilters: filters.showFilters,
  }));

  const applyFilters = () => {
    lastFiltersRef.current = null;
    fetchRecentActivities(false);
  };

  // Since we're doing server-side filtering, activities are already filtered
  // Limit to 100 for performance
  const filteredActivities = activities.slice(0, 100);

  // Get unique values for filter dropdowns - fetch from unfiltered data
  const [uniqueActionTypes, setUniqueActionTypes] = useState<string[]>([]);
  const [uniqueAdminUsers, setUniqueAdminUsers] = useState<string[]>([]);

  const fetchUniqueValues = useCallback(async () => {
    try {
      const cached = getCachedUniqueValues();
      if (cached) {
        setUniqueActionTypes(cached.uniqueActionTypes);
        setUniqueAdminUsers(cached.uniqueAdminUsers);
      }

      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) return;

      // Fetch unfiltered data to get unique values for dropdowns
      const apiUrl = await getApiUrl('/admin/activities');
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

      const data: AdminActivityResponse = await response.json();
      if (data.success && data.activities) {
        const types = [...new Set(data.activities.map(a => a.action_type))].sort();
        const users = [...new Set(data.activities.map(a => a.admin_username))].sort();
        setUniqueActionTypes(types);
        setUniqueAdminUsers(users);
        
        // Update cache
        localStorage.setItem('systemLogsUniqueValuesCache', JSON.stringify({
          uniqueActionTypes: types,
          uniqueAdminUsers: users,
          timestamp: Date.now(),
        }));
      }
    } catch (err) {
      console.error('Failed to fetch unique values:', err);
    }
  }, [authSeed]);

  useEffect(() => {
    fetchUniqueValues();
  }, [fetchUniqueValues]);

  const updateFilter = (key: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      actionType: '',
      adminUser: '',
      dateFrom: '',
      dateTo: '',
      showFilters: false
    });
  };

  const hasActiveFilters = filters.searchTerm || filters.actionType || filters.adminUser || filters.dateFrom || filters.dateTo;

  const getActionIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'login':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'verification':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unsafe':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'config':
        return <Settings className="h-4 w-4 text-purple-600" />;
      case 'admin':
        return <Users className="h-4 w-4 text-indigo-600" />;
      case 'transaction':
        return <Activity className="h-4 w-4 text-orange-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    // Parse the UTC timestamp - JavaScript Date automatically converts to local time
    const date = new Date(timestamp);
    const now = new Date();
    
    // Calculate difference in minutes
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam yang lalu`;
    
    // For older dates, show the local time in Indonesian format
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <Activity className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Gagal Memuat Log</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Panel - Compact */}
      {filters.showFilters && (
        <div className="bg-white p-3 border border-gray-200 rounded">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Filter</h3>
            <button
              onClick={() => updateFilter('showFilters', false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Pencarian</label>
              <input
                type="text"
                placeholder="Cari..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tipe</label>
              <select
                value={filters.actionType}
                onChange={(e) => updateFilter('actionType', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua</option>
                {uniqueActionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Admin</label>
              <select
                value={filters.adminUser}
                onChange={(e) => updateFilter('adminUser', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Semua</option>
                {uniqueAdminUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dari</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Sampai</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Hapus Filter
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => updateFilter('showFilters', false)}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Batal
              </button>
              <button
                onClick={applyFilters}
                className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Statistics - Compact */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-white p-2 border border-gray-200 rounded text-center">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg font-semibold">{filteredActivities.length}</p>
        </div>
        <div className="bg-white p-2 border border-gray-200 rounded text-center">
          <p className="text-xs text-gray-600">Login</p>
          <p className="text-lg font-semibold">
            {filteredActivities.filter(a => a.action_type.toLowerCase() === 'login').length}
          </p>
        </div>
        <div className="bg-white p-2 border border-gray-200 rounded text-center">
          <p className="text-xs text-gray-600">Config</p>
          <p className="text-lg font-semibold">
            {filteredActivities.filter(a => a.action_type.toLowerCase() === 'config').length}
          </p>
        </div>
        <div className="bg-white p-2 border border-gray-200 rounded text-center">
          <p className="text-xs text-gray-600">Verify</p>
          <p className="text-lg font-semibold">
            {filteredActivities.filter(a => a.action_type.toLowerCase() === 'verification').length}
          </p>
        </div>
      </div>

      {/* Activity Logs - Compact */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-medium">Log Aktivitas</h3>
          {hasActiveFilters && (
            <span className="text-xs text-gray-500">{filteredActivities.length} log</span>
          )}
        </div>
        <div className="divide-y divide-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-6 text-sm text-gray-500">
              {hasActiveFilters ? 'Tidak ada log yang sesuai' : 'Tidak ada log'}
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="px-3 py-2 hover:bg-gray-50">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActionIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-900 flex-1">
                        {activity.action_description}
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                      <span>{activity.admin_username}</span>
                      {activity.target_type && (
                        <span>{activity.target_type}: {activity.target_id || 'N/A'}</span>
                      )}
                      {activity.ip_address && (
                        <span className="text-gray-400">{activity.ip_address}</span>
                      )}
                    </div>
                    {activity.details && (
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

SystemLogs.displayName = 'SystemLogs';

export default SystemLogs;
