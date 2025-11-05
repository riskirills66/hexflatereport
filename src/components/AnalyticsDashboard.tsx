import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Package } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface AnalyticsDashboardProps {
  authSeed: string;
}

interface DailyTransactionData {
  date: string;
  total_transactions: number;
  success_count: number;
  failed_count: number;
}

interface TransactionTrends {
  total_7_days: number;
  success_rate: number;
  failure_rate: number;
  avg_daily_transactions: number;
  daily_data: DailyTransactionData[];
}

interface ProductData {
  kode_produk: string;
  nama_produk: string;
  total_transactions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
}

interface ProductTrends {
  total_products: number;
  top_products: ProductData[];
  product_categories: ProductCategoryData[];
}

interface ProductCategoryData {
  category: string;
  total_transactions: number;
  percentage: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899', '#84CC16', '#6366F1'];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ authSeed }) => {
  const [trendsData, setTrendsData] = useState<TransactionTrends | null>(null);
  const [productTrendsData, setProductTrendsData] = useState<ProductTrends | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
    fetchProductAnalyticsData();
  }, [refreshKey]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setError('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const apiUrl = await getApiUrl('/admin/transactions/trends');
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

      const data = await response.json();

      if (data.success && data.analytics) {
        setTrendsData(data.analytics);
      } else {
        setError(data.message || 'Gagal memuat data analitik');
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Gagal memuat data analitik dari backend');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductAnalyticsData = async () => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        return;
      }

      const apiUrl = await getApiUrl('/admin/transactions/product-trends');
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

      const data = await response.json();

      if (data.success && data.analytics) {
        // Validate and transform data
        const validatedData = {
          ...data.analytics,
          top_products: data.analytics.top_products.map((product: any) => ({
            ...product,
            total_transactions: Number(product.total_transactions) || 0,
            success_count: Number(product.success_count) || 0,
            failed_count: Number(product.failed_count) || 0,
            success_rate: Number(product.success_rate) || 0,
          }))
        };
        setProductTrendsData(validatedData);
      }
    } catch (err) {
      console.error('Failed to fetch product analytics:', err);
    }
  };

  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Memuat data analitik...</span>
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

  if (!trendsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Tidak ada data analitik yang tersedia</p>
      </div>
    );
  }

  // Prepare data for charts
  const chartData = trendsData.daily_data.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));

  const pieData = [
    { name: 'Sukses', value: trendsData.daily_data.reduce((sum, item) => sum + item.success_count, 0), color: '#10B981' },
    { name: 'Gagal', value: trendsData.daily_data.reduce((sum, item) => sum + item.failed_count, 0), color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Analitik</h2>
          <p className="text-gray-600">Analisis transaksi 7 hari terakhir</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transaksi</p>
              <p className="text-2xl font-semibold text-gray-900">{trendsData.total_7_days.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tingkat Sukses</p>
              <p className="text-2xl font-semibold text-gray-900">{trendsData.success_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tingkat Kegagalan</p>
              <p className="text-2xl font-semibold text-gray-900">{trendsData.failure_rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>


      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Volume Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Volume Transaksi Harian</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  value.toLocaleString(), 
                  name === 'total_transactions' ? 'Total Transaksi' : 
                  name === 'success_count' ? 'Sukses' : 
                  name === 'failed_count' ? 'Gagal' : name
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total_transactions" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Total Transaksi"
              />
              <Line 
                type="monotone" 
                dataKey="success_count" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Sukses"
              />
              <Line 
                type="monotone" 
                dataKey="failed_count" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Gagal"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribusi Status Transaksi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Jumlah']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Trends Charts */}
      {productTrendsData && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-indigo-600" />
            <h3 className="text-xl font-semibold text-gray-900">Analitik Tren Produk</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products Bar Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Top 10 Produk Berdasarkan Volume Transaksi</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={productTrendsData.top_products.slice(0, 10)} 
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nama_produk" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      value.toLocaleString(), 
                      name === 'total_transactions' ? 'Total Transaksi' : 
                      name === 'success_count' ? 'Sukses' : 
                      name === 'failed_count' ? 'Gagal' : name
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="total_transactions" fill="#3B82F6" name="Total Transaksi" />
                  <Bar dataKey="success_count" fill="#10B981" name="Sukses" />
                  <Bar dataKey="failed_count" fill="#EF4444" name="Gagal" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Product Success Rate Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Distribusi Produk Berdasarkan Volume Transaksi</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productTrendsData.top_products.slice(0, 8).map((product, index) => ({
                      name: product.nama_produk.length > 20 
                        ? product.nama_produk.substring(0, 20) + '...' 
                        : product.nama_produk,
                      value: product.total_transactions,
                      color: COLORS[index % COLORS.length]
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productTrendsData.top_products.slice(0, 8).map((product, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Jumlah Transaksi']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Performa Produk Detail</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Transaksi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sukses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gagal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tingkat Sukses</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productTrendsData.top_products.map((product, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.nama_produk}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.total_transactions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {product.success_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {product.failed_count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {product.success_rate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Data Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Detail Harian</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sukses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gagal</th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trendsData.daily_data.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(item.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.total_transactions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {item.success_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {item.failed_count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
