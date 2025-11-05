import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity, Shield, UserCheck, Settings, Users, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface DasborProps {
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

const Dasbor: React.FC<DasborProps> = ({ authSeed }) => {
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
      console.log('Admin activities response:', data); // Debug log

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
          <span className="ml-3 text-gray-600">Memuat aktivitas admin...</span>
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
            <p className="text-lg font-medium">Gagal Memuat Data</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Dasbor Admin</h2>
          <p className="text-gray-600">Aktivitas terbaru dan ringkasan sistem</p>
        </div>
        <button
          onClick={refreshData}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Aktivitas</p>
              <p className="text-2xl font-semibold text-gray-900">{activities.length.toLocaleString()}</p>
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
                {activities.filter(a => 
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
                {activities.filter(a => a.action_type.toLowerCase() === 'config').length}
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
                {activities.filter(a => a.action_type.toLowerCase() === 'verification').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Aktivitas Terbaru</h3>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Tidak ada aktivitas yang tersedia</p>
            </div>
          ) : (
            activities.map((activity) => (
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

export default Dasbor;
