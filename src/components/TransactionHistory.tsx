import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Search, X, Eye, Download } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import CSVExportModal from './CSVExportModal';
import { 
  convertToCSV, 
  downloadCSV, 
  formatTransactionForCSV, 
  generateFilename,
  TransactionCSVData 
} from '../utils/csvUtils';

interface TransactionHistoryProps {
  authSeed: string;
}

interface Transaction {
  kode: number;
  tgl_entri: string;
  kode_produk: string;
  tujuan: string;
  harga: number;
  status: number;
  tgl_status?: string;
  sn?: string;
  poin?: number;
  saldo_awal?: number;
}

interface TransactionDetails {
  kode: number;
  tgl_entri: string;
  kode_reseller: string;
  kode_produk: string;
  tujuan: string;
  harga: number;
  kode_inbox: number;
  status: number;
  tgl_status: string;
  saldo_awal: number;
  sn: string;
  is_voucher: any;
  poin: any;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ authSeed }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize, setPageSize] = useState(30);
  const [pagination, setPagination] = useState({
    current_cursor: null as number | null,
    last_cursor: null as number | null,
    per_page: 30,
    current_count: 0,
    has_next: false
  });
  
  // Modal and transaction details state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  
  // CSV export state
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  useEffect(() => {
    fetchTransactionHistory();
  }, [authSeed]);

  const fetchTransactionHistory = async (cursor?: number | null, append: boolean = false) => {
    try {
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        setError('Session tidak valid');
        return;
      }

      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor.toString());
      params.append('page_size', pageSize.toString());
      if (startDate) params.append('tgl_start', startDate);
      if (endDate) params.append('tgl_end', endDate);
      if (searchTerm) params.append('dest', searchTerm);
      if (statusFilter) {
        // Map frontend status values to backend expected values
        const backendStatus = statusFilter === 'berhasil' ? 'sukses' : statusFilter;
        params.append('status', backendStatus);
      }

      const apiUrl = await getApiUrl(`/history?${params.toString()}`);
      console.log('Fetching transaction history with:', {
        sessionKey,
        authSeed,
        apiUrl,
        params: params.toString()
      });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Transaction history response:', data);
        if (data.success && data.transactions) {
          if (append) {
            setTransactions(prev => [...prev, ...data.transactions]);
          } else {
            setTransactions(data.transactions);
          }
          setPagination(data.pagination);
        } else if (data.success && !data.transactions) {
          // No transactions found, but API call was successful
          if (!append) {
            setTransactions([]);
          }
          setPagination(data.pagination);
        } else {
          setError(data.message || 'Gagal memuat riwayat transaksi');
        }
      } else {
        const errorText = await response.text();
        console.error('HTTP error:', response.status, errorText);
        setError('Gagal memuat riwayat transaksi');
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (pagination.has_next && pagination.last_cursor) {
      fetchTransactionHistory(pagination.last_cursor, true);
    }
  };

  const fetchTransactionDetails = async (kode: number) => {
    try {
      setIsLoadingDetails(true);
      setDetailsError('');
      
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        setDetailsError('Session tidak valid');
        return;
      }

      const apiUrl = await getApiUrl(`/details_trx?kode=${kode}`);
      console.log('Fetching transaction details for kode:', kode);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Transaction details response:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setSelectedTransaction(data[0]);
          setIsModalOpen(true);
        } else {
          setDetailsError('Detail transaksi tidak ditemukan');
        }
      } else {
        const errorText = await response.text();
        console.error('HTTP error:', response.status, errorText);
        setDetailsError('Gagal memuat detail transaksi');
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      setDetailsError('Terjadi kesalahan saat memuat detail transaksi');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSearch = () => {
    setTransactions([]);
    setPagination({
      current_cursor: null,
      last_cursor: null,
      per_page: pageSize,
      current_count: 0,
      has_next: false
    });
    fetchTransactionHistory();
  };

  const handleViewDetails = (kode: number) => {
    fetchTransactionDetails(kode);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    setDetailsError('');
  };

  const handleCSVExport = async (startDate: string, endDate: string) => {
    try {
      setIsExportingCSV(true);
      
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        throw new Error('Session tidak valid');
      }

      // Fetch all transactions for the date range with large page size
      const params = new URLSearchParams();
      params.append('page_size', '50000'); // Large number to get all data at once
      params.append('tgl_start', startDate);
      params.append('tgl_end', endDate);
      if (searchTerm) params.append('dest', searchTerm);
      if (statusFilter) {
        // Map frontend status values to backend expected values
        const backendStatus = statusFilter === 'berhasil' ? 'sukses' : statusFilter;
        params.append('status', backendStatus);
      }

      const apiUrl = await getApiUrl(`/history?${params.toString()}`);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.transactions) {
          // Format data for CSV
          const csvData = data.transactions.map((transaction: Transaction) => 
            formatTransactionForCSV(transaction as TransactionCSVData)
          );
          
          // Generate CSV content
          const headers = [
            'Kode Transaksi',
            'Tanggal Entri', 
            'Kode Produk',
            'Tujuan',
            'Harga',
            'Status',
            'Tanggal Status',
            'Serial Number',
            'Poin',
            'Saldo Awal'
          ];
          
          const csvContent = convertToCSV(csvData, headers);
          
          // Download CSV file
          const filename = generateFilename('transactions', startDate, endDate);
          downloadCSV(csvContent, filename);
          
          setIsCSVModalOpen(false);
        } else {
          throw new Error(data.message || 'Tidak ada data transaksi untuk diekspor');
        }
      } else {
        throw new Error('Gagal mengambil data transaksi');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Gagal mengekspor data: ' + (error as Error).message);
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Use transactions directly since backend filtering is already applied
  const filteredTransactions = transactions;

  const getStatusText = (status: number) => {
    switch (status) {
      case 20:
      case 21:
      case 22:
      case 23:
        return 'berhasil';
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return 'menunggu';
      case 40:
      case 41:
      case 42:
      case 43:
      case 44:
      case 45:
      case 46:
      case 47:
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
      case 58:
      case 59:
      case 60:
      case 61:
      case 62:
        return 'gagal';
      default:
        return 'gagal';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 20:
      case 21:
      case 22:
      case 23:
        return 'bg-green-100 text-green-800';
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return 'bg-yellow-100 text-yellow-800';
      case 40:
      case 41:
      case 42:
      case 43:
      case 44:
      case 45:
      case 46:
      case 47:
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
      case 58:
      case 59:
      case 60:
      case 61:
      case 62:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getTypeColor = (kode_produk: string) => {
    const product = kode_produk.toLowerCase();
    if (product.includes('pulsa')) {
      return 'bg-blue-100 text-blue-800';
    } else if (product.includes('data') || product.includes('internet')) {
      return 'bg-purple-100 text-purple-800';
    } else if (product.includes('token')) {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari nomor tujuan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              placeholder="Tanggal Mulai"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              placeholder="Tanggal Akhir"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Semua Status</option>
              <option value="berhasil">Berhasil</option>
              <option value="gagal">Gagal</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value={10}>10 per halaman</option>
              <option value={20}>20 per halaman</option>
              <option value={30}>30 per halaman</option>
              <option value={50}>50 per halaman</option>
              <option value={100}>100 per halaman</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <Search className="h-4 w-4 mr-2" />
              Cari
            </button>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Riwayat Transaksi ({filteredTransactions.length})
          </h3>
          <button
            onClick={() => setIsCSVModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat riwayat transaksi...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm font-medium">!</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada transaksi</h3>
            <p className="text-gray-500">
              {searchTerm || startDate || endDate || statusFilter 
                ? 'Tidak ada transaksi yang sesuai dengan filter yang dipilih.'
                : 'Belum ada riwayat transaksi untuk ditampilkan.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => {
              const transactionDate = new Date(transaction.tgl_entri);
              const dateStr = transactionDate.toLocaleDateString('id-ID');
              const timeStr = transactionDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={transaction.kode} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.kode_produk)}`}>
                          {transaction.kode_produk}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusText(transaction.status)}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        {transaction.kode_produk}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Ke: {transaction.tujuan}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {dateStr}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {timeStr}
                        </div>
                        {transaction.sn && (
                          <div className="flex items-center">
                            <span className="mr-1">•</span>
                            SN: {transaction.sn}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        Rp {transaction.harga.toLocaleString('id-ID')}
                      </div>
                      {transaction.poin && (
                        <div className="text-sm text-gray-500 mt-1">
                          +{transaction.poin} poin
                        </div>
                      )}
                      <button
                        onClick={() => handleViewDetails(transaction.kode)}
                        disabled={isLoadingDetails}
                        className="mt-2 flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingDetails ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Detail
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Load More Button */}
        {pagination.has_next && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memuat...
                </>
              ) : (
                'Muat Lebih Banyak'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Detail Transaksi
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {detailsError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 text-sm font-medium">!</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <p className="text-sm text-red-700 mt-1">{detailsError}</p>
                    </div>
                  </div>
                </div>
              ) : selectedTransaction ? (
                <div className="space-y-6">
                  {/* Transaction Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Kode Transaksi</h4>
                      <p className="text-lg font-semibold text-gray-900">{selectedTransaction.kode}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Kode Reseller</h4>
                      <p className="text-lg font-semibold text-gray-900">{selectedTransaction.kode_reseller}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Kode Produk</h4>
                      <p className="text-lg font-semibold text-gray-900">{selectedTransaction.kode_produk}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tujuan</h4>
                      <p className="text-lg font-semibold text-gray-900">{selectedTransaction.tujuan}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Harga</h4>
                      <p className="text-lg font-semibold text-green-600">
                        Rp {selectedTransaction.harga.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                        {getStatusText(selectedTransaction.status)}
                      </span>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tanggal Entri</h4>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedTransaction.tgl_entri).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tanggal Status</h4>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedTransaction.tgl_status).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Kode Inbox</h4>
                      <p className="text-sm text-gray-900">{selectedTransaction.kode_inbox}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Saldo Awal</h4>
                      <p className="text-sm text-gray-900">
                        Rp {selectedTransaction.saldo_awal.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* SN/Receipt Info */}
                  {selectedTransaction.sn && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Serial Number / Receipt</h4>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedTransaction.sn}</p>
                    </div>
                  )}

                  {/* Voucher and Points Info */}
                  {(selectedTransaction.is_voucher !== null || selectedTransaction.poin !== null) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedTransaction.is_voucher !== null && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Voucher</h4>
                          <p className="text-sm text-gray-900">
                            {selectedTransaction.is_voucher ? 'Ya' : 'Tidak'}
                          </p>
                        </div>
                      )}
                      {selectedTransaction.poin !== null && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Poin</h4>
                          <p className="text-sm text-gray-900">{selectedTransaction.poin}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">Memuat detail transaksi...</span>
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Export Modal */}
      <CSVExportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onExport={handleCSVExport}
        title="Riwayat Transaksi"
        isLoading={isExportingCSV}
      />
    </div>
  );
};

export default TransactionHistory;
