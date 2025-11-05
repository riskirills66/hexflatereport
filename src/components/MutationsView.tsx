import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Search, Download } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import CSVExportModal from './CSVExportModal';
import { 
  convertToCSV, 
  downloadCSV, 
  formatMutationForCSV, 
  generateFilename,
  MutationCSVData 
} from '../utils/csvUtils';

interface MutationsViewProps {
  authSeed: string;
}

interface Mutation {
  kode: number;
  kode_reseller: string;
  tanggal: string;
  jumlah: number;
  keterangan?: string;
  saldo_akhir?: number;
}

const MutationsView: React.FC<MutationsViewProps> = ({ authSeed }) => {
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pageSize, setPageSize] = useState(30);
  const [pagination, setPagination] = useState({
    current_cursor: null as number | null,
    last_cursor: null as number | null,
    per_page: 30,
    current_count: 0,
    has_next: false
  });
  
  // CSV export state
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  useEffect(() => {
    fetchMutations();
  }, [authSeed]);

  const fetchMutations = async (cursor?: number | null, append: boolean = false) => {
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
      if (searchTerm) params.append('keterangan', searchTerm);

      const apiUrl = await getApiUrl(`/estatement?${params.toString()}`);
      console.log('Fetching mutations with:', {
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
        console.log('Mutations response:', data);
        if (data.success && data.mutasi) {
          if (append) {
            setMutations(prev => [...prev, ...data.mutasi]);
          } else {
            setMutations(data.mutasi);
          }
          setPagination(data.pagination);
        } else if (data.success && !data.mutasi) {
          // No mutations found, but API call was successful
          if (!append) {
            setMutations([]);
          }
          setPagination(data.pagination);
        } else {
          setError(data.message || 'Gagal memuat mutasi saldo');
        }
      } else {
        const errorText = await response.text();
        console.error('HTTP error:', response.status, errorText);
        setError('Gagal memuat mutasi saldo');
      }
    } catch (error) {
      console.error('Error fetching mutations:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (pagination.has_next && pagination.last_cursor) {
      fetchMutations(pagination.last_cursor, true);
    }
  };

  const handleSearch = () => {
    setMutations([]);
    setPagination({
      current_cursor: null,
      last_cursor: null,
      per_page: pageSize,
      current_count: 0,
      has_next: false
    });
    fetchMutations();
  };

  const handleCSVExport = async (startDate: string, endDate: string) => {
    try {
      setIsExportingCSV(true);
      
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        throw new Error('Session tidak valid');
      }

      // Fetch all mutations for the date range with large page size
      const params = new URLSearchParams();
      params.append('page_size', '50000'); // Large number to get all data at once
      params.append('tgl_start', startDate);
      params.append('tgl_end', endDate);
      if (searchTerm) params.append('keterangan', searchTerm);

      const apiUrl = await getApiUrl(`/estatement?${params.toString()}`);
      
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
        if (data.success && data.mutasi) {
          // Format data for CSV
          const csvData = data.mutasi.map((mutation: Mutation) => 
            formatMutationForCSV(mutation as MutationCSVData)
          );
          
          // Generate CSV content
          const headers = [
            'Kode',
            'Kode Reseller',
            'Tanggal',
            'Jumlah',
            'Tipe',
            'Keterangan',
            'Saldo Akhir'
          ];
          
          const csvContent = convertToCSV(csvData, headers);
          
          // Download CSV file
          const filename = generateFilename('mutations', startDate, endDate);
          downloadCSV(csvContent, filename);
          
          setIsCSVModalOpen(false);
        } else {
          throw new Error(data.message || 'Tidak ada data mutasi untuk diekspor');
        }
      } else {
        throw new Error('Gagal mengambil data mutasi');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Gagal mengekspor data: ' + (error as Error).message);
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Since we're using backend filtering, we only need to filter by type on the frontend
  const filteredMutations = mutations.filter(mutation => {
    const matchesType = !typeFilter || (typeFilter === 'credit' ? mutation.jumlah > 0 : mutation.jumlah < 0);
    return matchesType;
  });

  const getTotalCredit = () => {
    return filteredMutations
      .filter(m => m.jumlah > 0)
      .reduce((sum, m) => sum + m.jumlah, 0);
  };

  const getTotalDebit = () => {
    return filteredMutations
      .filter(m => m.jumlah < 0)
      .reduce((sum, m) => sum + Math.abs(m.jumlah), 0);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Kredit</p>
              <p className="text-2xl font-bold text-green-600">
                Rp {getTotalCredit().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Debit</p>
              <p className="text-2xl font-bold text-red-600">
                Rp {getTotalDebit().toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari keterangan..."
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Semua Tipe</option>
              <option value="credit">Kredit</option>
              <option value="debit">Debit</option>
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

      {/* Mutations List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Mutasi Saldo ({filteredMutations.length})
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
              <p className="mt-4 text-gray-600">Memuat mutasi saldo...</p>
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
        ) : filteredMutations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada mutasi</h3>
            <p className="text-gray-500">
              {searchTerm || startDate || endDate || typeFilter 
                ? 'Tidak ada mutasi yang sesuai dengan filter yang dipilih.'
                : 'Belum ada mutasi saldo untuk ditampilkan.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMutations.map((mutation) => {
              const isCredit = mutation.jumlah > 0;
              const dateTime = new Date(mutation.tanggal);
              const dateStr = dateTime.toLocaleDateString('id-ID');
              const timeStr = dateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={mutation.kode} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {isCredit ? (
                          <div className="flex items-center text-green-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">Kredit</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <TrendingDown className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">Debit</span>
                          </div>
                        )}
                      </div>
                      
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        {mutation.keterangan || 'Mutasi Saldo'}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        Kode: {mutation.kode}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {dateStr}
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1">•</span>
                          {timeStr}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        isCredit ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isCredit ? '+' : ''}Rp {mutation.jumlah.toLocaleString('id-ID')}
                      </div>
                      {mutation.saldo_akhir && (
                        <div className="text-sm text-gray-500 mt-1">
                          Saldo: Rp {mutation.saldo_akhir.toLocaleString('id-ID')}
                        </div>
                      )}
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

      {/* CSV Export Modal */}
      <CSVExportModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onExport={handleCSVExport}
        title="Mutasi Saldo"
        isLoading={isExportingCSV}
      />
    </div>
  );
};

export default MutationsView;

