import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { Spinner, Button, Table } from '../styles';

interface TransactionManagementProps {
  authSeed: string;
}

interface Transaction {
  kode: string;
  tgl_entri: string;
  kode_produk: string;
  tujuan: string;
  kode_reseller: string;
  harga: number;
  status: string;
}

interface TransactionAnalytics {
  total_today: number;
  success_count: number;
  process_count: number;
  failed_count: number;
}

const TransactionManagement: React.FC<TransactionManagementProps> = ({ authSeed }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchTransactions();
    fetchAnalytics();
  }, [refreshKey]);

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        return;
      }

      const apiUrl = await getApiUrl('/admin/transactions/analytics');
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
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setError('Kunci sesi tidak ditemukan. Silakan login lagi.');
        return;
      }

      const apiUrl = await getApiUrl('/admin/transactions');
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

      if (data.success && data.transactions) {
        setTransactions(data.transactions);
      } else {
        setError(data.message || 'Gagal memuat data transaksi');
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError('Gagal memuat data transaksi dari backend');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTransactions = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sukses':
        return 'bg-green-100 text-green-800';
      case 'Gagal':
        return 'bg-red-100 text-red-800';
      case 'Dalam Proses':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Prepare table data for the Table component
  const tableColumns = [
    { key: 'kode', label: 'Kode', width: '120px' },
    { key: 'tgl_entri', label: 'Tanggal', width: '180px' },
    { key: 'kode_produk', label: 'Produk', width: '120px' },
    { key: 'tujuan', label: 'Tujuan', width: '150px' },
    { key: 'kode_reseller', label: 'Reseller', width: '120px' },
    { key: 'harga', label: 'Harga', width: '120px', align: 'right' as const },
    { key: 'status', label: 'Status', width: '100px' }
  ];

  const tableData = transactions.map(transaction => ({
    kode: transaction.kode,
    tgl_entri: formatDate(transaction.tgl_entri),
    kode_produk: transaction.kode_produk,
    tujuan: transaction.tujuan,
    kode_reseller: transaction.kode_reseller,
    harga: formatCurrency(transaction.harga),
    status: (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
        {transaction.status}
      </span>
    )
  }));

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" color="primary" />
          <span className="ml-3 text-gray-600">Memuat data transaksi...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Gagal Memuat Data</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={refreshTransactions}
            variant="primary"
            size="md"
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Manajemen Transaksi</h3>
            <p className="text-sm text-gray-600">Lihat dan kelola transaksi terbaru</p>
          </div>
          <Button
            onClick={refreshTransactions}
            variant="primary"
            size="md"
            icon={<RefreshCw className="h-4 w-4" />}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {isLoadingAnalytics ? (
                <Spinner size="sm" color="primary" />
              ) : (
                analytics?.total_today || 0
              )}
            </div>
            <div className="text-sm text-blue-700">Total Transaksi Hari Ini</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {isLoadingAnalytics ? (
                <Spinner size="sm" color="primary" />
              ) : (
                analytics?.success_count || 0
              )}
            </div>
            <div className="text-sm text-green-700">Sukses Hari Ini</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">
              {isLoadingAnalytics ? (
                <Spinner size="sm" color="primary" />
              ) : (
                analytics?.process_count || 0
              )}
            </div>
            <div className="text-sm text-yellow-700">Dalam Proses Hari Ini</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {isLoadingAnalytics ? (
                <Spinner size="sm" color="primary" />
              ) : (
                analytics?.failed_count || 0
              )}
            </div>
            <div className="text-sm text-red-700">Gagal Hari Ini</div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Daftar Transaksi Terbaru</h4>
          <p className="text-sm text-gray-600">Menampilkan 100 transaksi terbaru</p>
        </div>
        
        {transactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-lg font-medium">Tidak Ada Transaksi</p>
            <p className="text-sm">Belum ada data transaksi yang tersedia</p>
          </div>
        ) : (
          <Table
            columns={tableColumns}
            data={tableData}
            variant="default"
            emptyMessage="Tidak ada transaksi yang tersedia"
          />
        )}
      </div>
    </div>
  );
};

export default TransactionManagement;
