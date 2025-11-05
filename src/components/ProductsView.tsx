import React, { useState, useEffect } from 'react';
import { Package, Search, Download, AlertTriangle, XCircle } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { convertToCSV, downloadCSV } from '../utils/csvUtils';

interface ProductsViewProps {
  authSeed: string;
}

interface Product {
  kode: string;
  nama: string;
  harga_jual: number;
  harga_final: number;
  aktif: number;
  gangguan: number;
  kode_operator: string;
  kosong: number;
  harga_tetap: number;
  sms_end_user: number;
  postpaid: number;
  poin: number;
  rumus_harga: number;
  qty: string;
  operator_nama: string;
}

interface Operator {
  kode: string;
  nama: string;
  gangguan: number;
  kosong: number;
}

const ProductsView: React.FC<ProductsViewProps> = ({ authSeed }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');
  const [limit, setLimit] = useState(500);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchOperators();
  }, [authSeed]);

  useEffect(() => {
    fetchProducts();
  }, [limit, searchTerm, operatorFilter]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        setError('Session tidak valid');
        return;
      }

      const params = new URLSearchParams();
      params.append('operators', ''); // Empty to get all products
      if (limit > 0) params.append('limit', limit.toString());
      if (searchTerm.trim()) params.append('search_term', searchTerm.trim());
      if (operatorFilter) params.append('operator_filter', operatorFilter);

      const apiUrl = await getApiUrl(`/products?${params.toString()}`);
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
        console.log('Products response:', data);
        // Backend returns array directly, not wrapped in success/error object
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setError('Format response tidak valid');
        }
      } else {
        setError('Gagal memuat daftar produk');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOperators = async () => {
    try {
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        return;
      }

      const apiUrl = await getApiUrl('/operator-list');
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
        console.log('Operator list response:', data);
        // Backend returns array directly
        if (Array.isArray(data)) {
          setOperators(data);
        }
      }
    } catch (error) {
      console.error('Error fetching operator list:', error);
    }
  };

  const handleCSVExport = async () => {
    try {
      setIsExportingCSV(true);
      
      const sessionKey = localStorage.getItem('memberSessionKey');
      if (!sessionKey) {
        throw new Error('Session tidak valid');
      }

      // Fetch all products for CSV export (no limit)
      const params = new URLSearchParams();
      params.append('operators', ''); // Empty to get all products

      const apiUrl = await getApiUrl(`/products?${params.toString()}`);
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
        if (Array.isArray(data)) {
          // Format data for CSV
          const csvData = data.map((product: Product) => ({
            'Kode': product.kode,
            'Nama': product.nama,
            'Harga Final': `Rp ${product.harga_final.toLocaleString('id-ID')}`,
            'Gangguan': product.gangguan ? 'Ya' : 'Tidak',
            'Operator': product.operator_nama,
            'Kosong': product.kosong ? 'Ya' : 'Tidak',
            'Poin': product.poin || ''
          }));
          
          // Generate CSV content
          const headers = [
            'Kode',
            'Nama',
            'Harga Final',
            'Gangguan',
            'Operator',
            'Kosong',
            'Poin'
          ];
          
          const csvContent = convertToCSV(csvData, headers);
          
          // Download CSV file
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const filename = `daftar_produk_${dateStr}.csv`;
          downloadCSV(csvContent, filename);
        } else {
          throw new Error('Format response tidak valid');
        }
      } else {
        throw new Error('Gagal mengambil data produk');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Gagal mengekspor data: ' + (error as Error).message);
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Group products by operator (backend already provides sorted data)
  const groupedProducts = products.reduce((groups: Record<string, { products: Product[], operatorName: string }>, product: Product) => {
    const operatorCode = product.kode_operator;
    if (!groups[operatorCode]) {
      // Use operator_nama from backend response
      groups[operatorCode] = { products: [], operatorName: product.operator_nama || operatorCode };
    }
    groups[operatorCode].products.push(product);
    return groups;
  }, {} as Record<string, { products: Product[], operatorName: string }>);

  // Convert to array for rendering (backend already sorted)
  const sortedGroupedProducts = Object.entries(groupedProducts).map(([operatorCode, group]) => ({
    operatorCode,
    group
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Semua Operator</option>
            {operators.map((operator) => (
              <option key={operator.kode} value={operator.kode}>
                {operator.nama}
              </option>
            ))}
          </select>
        </div>
        
        {/* Additional Options */}
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-2">
            <label htmlFor="limit" className="text-sm text-gray-700">
              Tampilkan:
            </label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={0}>Tampilkan Semua</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Daftar Produk ({products.length})
            {limit > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (dari {limit} teratas)
              </span>
            )}
            {limit === 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (semua produk)
              </span>
            )}
          </h3>
          <button
            onClick={handleCSVExport}
            disabled={isExportingCSV}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingCSV ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat daftar produk...</p>
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
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada produk</h3>
            <p className="text-gray-500">
              {searchTerm || operatorFilter
                ? 'Tidak ada produk yang sesuai dengan filter yang dipilih.'
                : 'Belum ada produk untuk ditampilkan.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Harga Final
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedGroupedProducts.map(({ operatorCode, group }) => {
                  // Find operator data to check for issues
                  const operatorData = operators.find(op => op.kode === operatorCode);
                  const hasOperatorIssue = operatorData && (operatorData.gangguan === 1 || operatorData.kosong === 1);
                  
                  return (
                    <React.Fragment key={operatorCode}>
                      {/* Operator Header Row */}
                      <tr className={hasOperatorIssue ? "bg-red-200" : "bg-gray-100"}>
                        <td colSpan={3} className={`px-6 py-3 text-sm font-semibold text-center ${hasOperatorIssue ? 'text-red-900' : 'text-gray-900'}`}>
                          {group.operatorName}
                        </td>
                      </tr>
                    {/* Products for this operator */}
                    {group.products.map((product: Product) => {
                      const hasProductIssue = product.gangguan === 1 || product.kosong === 1;
                      // Use operator issue styling if operator has issues, otherwise use product-specific styling
                      const shouldUseRedStyling = hasOperatorIssue || hasProductIssue;
                      
                      return (
                        <tr 
                          key={product.kode} 
                          className={`${shouldUseRedStyling ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                        >
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${shouldUseRedStyling ? 'text-red-900' : 'text-gray-900'}`}>
                            {product.kode}
                          </td>
                          <td className={`px-6 py-4 text-sm max-w-xs ${shouldUseRedStyling ? 'text-red-900' : 'text-gray-900'}`}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="truncate cursor-help flex-1" 
                                title={product.nama}
                              >
                                {product.nama}
                              </div>
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                {product.gangguan === 1 && (
                                  <div 
                                    className="flex items-center justify-center w-5 h-5 bg-orange-100 rounded-full"
                                    title="Gangguan"
                                  >
                                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                                  </div>
                                )}
                                {product.kosong === 1 && (
                                  <div 
                                    className="flex items-center justify-center w-5 h-5 bg-red-100 rounded-full"
                                    title="Kosong"
                                  >
                                    <XCircle className="w-3 h-3 text-red-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${shouldUseRedStyling ? 'text-red-600' : 'text-green-600'}`}>
                            Rp {product.harga_final.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsView;

