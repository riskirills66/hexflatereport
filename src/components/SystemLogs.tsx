import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Activity, 
  Shield, 
  UserCheck, 
  Settings, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Filter,
  Search,
  Calendar,
  X,
  ChevronDown
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface SystemLogsProps {
  authSeed: string;
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

const SystemLogs: React.FC<SystemLogsProps> = ({ authSeed }) => {
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    actionType: '',
    adminUser: '',
    dateFrom: '',
    dateTo: '',
    showFilters: false
  });

  // Initial load and refresh
  useEffect(() => {
    fetchRecentActivities();
  }, [refreshKey]);

  const fetchRecentActivities = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setError('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

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
          search_term: filters.searchTerm || null,
          action_type: filters.actionType || null,
          admin_user: filters.adminUser || null,
          date_from: filters.dateFrom || null,
          date_to: filters.dateTo || null,
          limit: 1000, // Get more records for better filtering
          offset: 0,
        }),
      });

      const data: AdminActivityResponse = await response.json();
      console.log('Filtered admin activities response:', data); // Debug log

      if (data.success && data.activities) {
        // Debug: Log first few activities to check timestamps
        if (data.activities.length > 0) {
          console.log('First activity timestamp:', data.activities[0].timestamp);
          console.log('Current browser time:', new Date().toISOString());
        }
        setActivities(data.activities);
      } else {
        setError(data.message || 'Gagal memuat aktivitas admin');
      }
    } catch (err) {
      console.error('Failed to fetch admin activities:', err);
      setError('Gagal memuat aktivitas admin dari backend');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  const applyFilters = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Since we're doing server-side filtering, activities are already filtered
  const filteredActivities = activities;

  // Get unique values for filter dropdowns - fetch from unfiltered data
  const [uniqueActionTypes, setUniqueActionTypes] = useState<string[]>([]);
  const [uniqueAdminUsers, setUniqueAdminUsers] = useState<string[]>([]);

  const fetchUniqueValues = async () => {
    try {
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
      }
    } catch (err) {
      console.error('Failed to fetch unique values:', err);
    }
  };

  useEffect(() => {
    fetchUniqueValues();
  }, []);

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

  const getActionColor = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'login':
        return 'bg-blue-50 border-blue-200';
      case 'verification':
        return 'bg-green-50 border-green-200';
      case 'safe':
        return 'bg-green-50 border-green-200';
      case 'unsafe':
        return 'bg-red-50 border-red-200';
      case 'config':
        return 'bg-purple-50 border-purple-200';
      case 'admin':
        return 'bg-indigo-50 border-indigo-200';
      case 'transaction':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Memuat log sistem...</span>
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Log Sistem</h2>
          <p className="text-gray-600">
            {hasActiveFilters 
              ? `Menampilkan ${filteredActivities.length} dari ${activities.length} aktivitas admin`
              : `Aktivitas admin dan log sistem (${activities.length} total)`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateFilter('showFilters', !filters.showFilters)}
            className={`inline-flex items-center px-4 py-2 rounded-md transition-colors ${
              filters.showFilters || hasActiveFilters
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {hasActiveFilters && (
              <span className="ml-2 bg-white text-indigo-600 text-xs px-2 py-0.5 rounded-full">
                {[filters.searchTerm, filters.actionType, filters.adminUser, filters.dateFrom, filters.dateTo].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {filters.showFilters && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filter Log</h3>
            <button
              onClick={() => updateFilter('showFilters', false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pencarian
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari dalam log..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Action Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Aksi
              </label>
              <div className="relative">
                <select
                  value={filters.actionType}
                  onChange={(e) => updateFilter('actionType', e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                >
                  <option value="">Semua Tipe</option>
                  {uniqueActionTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Admin User Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin User
              </label>
              <div className="relative">
                <select
                  value={filters.adminUser}
                  onChange={(e) => updateFilter('adminUser', e.target.value)}
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                >
                  <option value="">Semua Admin</option>
                  {uniqueAdminUsers.map(user => (
                    <option key={user} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dari Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sampai Tanggal
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-end">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    updateFilter('dateFrom', today);
                    updateFilter('dateTo', today);
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    updateFilter('dateFrom', weekAgo.toISOString().split('T')[0]);
                    updateFilter('dateTo', today.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  7 Hari
                </button>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Hapus Filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateFilter('showFilters', false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={applyFilters}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                {hasActiveFilters ? 'Log Tersaring' : 'Total Log'}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredActivities.length.toLocaleString()}
                {hasActiveFilters && (
                  <span className="text-sm text-gray-500 ml-1">
                    / {activities.length.toLocaleString()}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Login Hari Ini</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredActivities.filter(a => 
                  a.action_type.toLowerCase() === 'login' && 
                  new Date(a.timestamp).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Settings className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Konfigurasi</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredActivities.filter(a => a.action_type.toLowerCase() === 'config').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verifikasi</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredActivities.filter(a => a.action_type.toLowerCase() === 'verification').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Log Aktivitas Admin</h3>
          {hasActiveFilters && (
            <div className="text-sm text-gray-500">
              Menampilkan {filteredActivities.length} dari {activities.length} log
            </div>
          )}
        </div>
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>
                {hasActiveFilters 
                  ? 'Tidak ada log yang sesuai dengan filter yang dipilih'
                  : 'Tidak ada log aktivitas yang tersedia'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm"
                >
                  Hapus filter untuk melihat semua log
                </button>
              )}
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 rounded-lg border ${getActionColor(activity.action_type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action_description}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {activity.admin_username}
                      </span>
                      {activity.target_type && (
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {activity.target_type}: {activity.target_id || 'N/A'}
                        </span>
                      )}
                      {activity.ip_address && (
                        <span className="flex items-center">
                          <Activity className="h-3 w-3 mr-1" />
                          {activity.ip_address}
                        </span>
                      )}
                    </div>
                    {activity.details && (
                      <p className="mt-2 text-sm text-gray-700 bg-white bg-opacity-50 p-2 rounded">
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
};

export default SystemLogs;
