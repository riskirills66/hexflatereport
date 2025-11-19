import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  Tag, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle,
  Search
} from 'lucide-react';
import { X_TOKEN_VALUE, getApiUrl } from '../config/api';
import { getCachedPromoConfig, setCachedPromoConfig, mergePromoConfig } from '../utils/promoCache';

// Types for promo management
interface PromoItem {
  code: string;
  value: PromoValue;
}

type PromoValue = 
  | { type: 'price_cut'; amount: number }
  | { type: 'new_product'; isNew: boolean };

interface PromoMetadata {
  total_promos: number;
  price_cut_promos: number;
  new_product_promos: number;
  tanggal_update: string;
  versi: string;
}

interface PromoConfig {
  promos: PromoItem[];
  metadata: PromoMetadata;
}

interface PromoManagementProps {
  authSeed: string;
  onStatsChange?: (total: number) => void;
}

export interface PromoManagementRef {
  saveAllConfigurations: () => Promise<void>;
}

const PromoManagement = forwardRef<PromoManagementRef, PromoManagementProps>(({ authSeed, onStatsChange }, ref) => {
  const [promoConfig, setPromoConfig] = useState<PromoConfig | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [newPromo, setNewPromo] = useState<Partial<PromoItem>>({
    code: '',
    value: { type: 'price_cut', amount: 100 }
  });

  const hasLoadedRef = useRef(false);
  const prevPromoConfigRef = useRef<PromoConfig | null>(null);

  const loadPromoConfig = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'No admin session found' });
        }
        return;
      }

      const apiUrl = await getApiUrl('/admin/promo-config');
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

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          // Convert the backend format to frontend format
          const convertedConfig = convertBackendToFrontend(data.config);
          setPromoConfig(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(convertedConfig)) {
              return prev;
            }
            return mergePromoConfig(prev, convertedConfig);
          });
        } else {
          if (!background) {
            setMessage({ type: 'error', text: data.message || 'Failed to load promo configuration' });
          }
        }
      } else {
        if (!background) {
          setMessage({ type: 'error', text: 'Failed to load promo configuration' });
        }
      }
    } catch (error) {
      console.error('Error loading promo config:', error);
      if (!background) {
        setMessage({ type: 'error', text: 'Error loading promo configuration' });
      }
    }
  }, [authSeed]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Load from cache immediately
    const cached = getCachedPromoConfig();
    if (cached) {
      prevPromoConfigRef.current = cached;
      setPromoConfig(cached);
    }

    // Fetch from API in background
    loadPromoConfig(true);
  }, [loadPromoConfig]);

  // Update cache when promoConfig changes (but not if it's the same as previous)
  useEffect(() => {
    if (promoConfig && prevPromoConfigRef.current !== promoConfig) {
      // Only update cache if config actually changed
      if (!prevPromoConfigRef.current || 
          JSON.stringify(prevPromoConfigRef.current) !== JSON.stringify(promoConfig)) {
        setCachedPromoConfig(promoConfig);
        prevPromoConfigRef.current = promoConfig;
      }
    }
  }, [promoConfig]);

  // Notify parent when promoConfig changes
  useEffect(() => {
    if (onStatsChange && promoConfig) {
      onStatsChange(promoConfig.metadata.total_promos || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoConfig?.metadata.total_promos]);

  const convertBackendToFrontend = (backendConfig: any): PromoConfig => {
    const convertedPromos = backendConfig.promos.map((promo: any) => {
      let value: PromoValue;
      if (promo.value.PriceCut !== undefined) {
        value = { type: 'price_cut', amount: promo.value.PriceCut };
      } else if (promo.value.NewProduct !== undefined) {
        value = { type: 'new_product', isNew: promo.value.NewProduct };
      } else {
        // Fallback
        value = { type: 'price_cut', amount: 100 };
      }
      
      return {
        code: promo.code,
        value
      };
    });

    return {
      promos: convertedPromos,
      metadata: backendConfig.metadata
    };
  };

  const convertFrontendToBackend = (frontendConfig: PromoConfig): any => {
    const convertedPromos = frontendConfig.promos.map((promo) => {
      let value: any;
      if (promo.value.type === 'price_cut') {
        value = { PriceCut: promo.value.amount };
      } else {
        value = { NewProduct: promo.value.isNew };
      }
      
      return {
        code: promo.code,
        value
      };
    });

    return {
      promos: convertedPromos,
      metadata: frontendConfig.metadata
    };
  };

  const savePromoConfig = async () => {
    if (!promoConfig) return;
    
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'No admin session found' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/promo-config/save');
      const backendConfig = convertFrontendToBackend(promoConfig);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
          config: backendConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Promo configuration saved successfully!' });
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to save promo configuration' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to save promo configuration' });
      }
    } catch (error) {
      console.error('Error saving promo config:', error);
      setMessage({ type: 'error', text: 'Error saving promo configuration' });
    }
  };

  // Expose saveAllConfigurations function to parent component
  useImperativeHandle(ref, () => ({
    saveAllConfigurations: savePromoConfig
  }));

  const updatePromo = (code: string, field: keyof PromoItem, value: any) => {
    if (!promoConfig) return;
    
    setPromoConfig(prev => {
      if (!prev) return prev;
      const newPromos = prev.promos.map(p => 
        p.code === code ? { ...p, [field]: value } : p
      );
      return { ...prev, promos: newPromos };
    });
  };

  const addNewPromo = () => {
    if (!promoConfig || !newPromo.code) return;
    
    // Check if code already exists
    if (promoConfig.promos.some(p => p.code === newPromo.code)) {
      setMessage({ type: 'error', text: 'Promo code already exists' });
      return;
    }

    const newPromoItem: PromoItem = {
      code: newPromo.code,
      value: newPromo.value || { type: 'price_cut', amount: 100 }
    };

    setPromoConfig(prev => {
      if (!prev) return prev;
      const newPromos = [...prev.promos, newPromoItem];
      const priceCutCount = newPromos.filter(p => p.value.type === 'price_cut').length;
      const newProductCount = newPromos.filter(p => p.value.type === 'new_product').length;
      
      const newMetadata = {
        ...prev.metadata,
        total_promos: newPromos.length,
        price_cut_promos: priceCutCount,
        new_product_promos: newProductCount,
        tanggal_update: new Date().toISOString().split('T')[0]
      };
      return { ...prev, promos: newPromos, metadata: newMetadata };
    });

    // Reset new promo form
    setNewPromo({
      code: '',
      value: { type: 'price_cut', amount: 100 }
    });
  };

  const removePromo = (code: string) => {
    if (!promoConfig) return;
    
    setPromoConfig(prev => {
      if (!prev) return prev;
      const newPromos = prev.promos.filter(p => p.code !== code);
      const priceCutCount = newPromos.filter(p => p.value.type === 'price_cut').length;
      const newProductCount = newPromos.filter(p => p.value.type === 'new_product').length;
      
      const newMetadata = {
        ...prev.metadata,
        total_promos: newPromos.length,
        price_cut_promos: priceCutCount,
        new_product_promos: newProductCount,
        tanggal_update: new Date().toISOString().split('T')[0]
      };
      return { ...prev, promos: newPromos, metadata: newMetadata };
    });
  };

  const renderPromoRow = (promo: PromoItem) => {
    return (
      <div
        key={promo.code}
        className="flex gap-3 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
      >
        {/* Code */}
        <div className="flex-shrink-0 w-1/4 flex items-start">
          <input
            type="text"
            value={promo.code}
            onChange={(e) => updatePromo(promo.code, 'code', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Kode promo"
          />
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Type */}
        <div className="flex-shrink-0 w-1/4 flex items-start">
          <select
            value={promo.value.type}
            onChange={(e) => {
              const type = e.target.value as 'price_cut' | 'new_product';
              const newValue = type === 'price_cut' 
                ? { type: 'price_cut', amount: promo.value.type === 'price_cut' ? promo.value.amount : 100 }
                : { type: 'new_product', isNew: true };
              updatePromo(promo.code, 'value', newValue);
            }}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="price_cut">Price Cut</option>
            <option value="new_product">New Product</option>
          </select>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Value */}
        <div className="flex-1 min-w-0 flex items-start">
          {promo.value.type === 'price_cut' ? (
            <input
              type="number"
              value={promo.value.amount}
              onChange={(e) => updatePromo(promo.code, 'value', { 
                type: 'price_cut', 
                amount: parseInt(e.target.value) || 0 
              })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              min="1"
              placeholder="Jumlah diskon"
            />
          ) : (
            <div className="px-2 py-1 text-sm text-gray-600">
              Produk Baru
            </div>
          )}
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Actions */}
        <div className="flex-shrink-0 w-20 flex items-start">
          <button
            onClick={() => removePromo(promo.code)}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Hapus promo"
          >
            Hapus
          </button>
        </div>
      </div>
    );
  };

  const filteredPromos = promoConfig?.promos.filter(promo => {
    const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
                       (filterType === 'price_cut' && promo.value.type === 'price_cut') ||
                       (filterType === 'new_product' && promo.value.type === 'new_product');
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari promo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Tipe</option>
              <option value="price_cut">Price Cut</option>
              <option value="new_product">New Product</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add New Promo */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Tambah Promo Baru</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Kode Promo:</label>
            <input
              type="text"
              value={newPromo.code || ''}
              onChange={(e) => setNewPromo(prev => ({ ...prev, code: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Kode promo"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Tipe Promo:</label>
            <select
              value={newPromo.value?.type || 'price_cut'}
              onChange={(e) => {
                const type = e.target.value as 'price_cut' | 'new_product';
                setNewPromo(prev => ({
                  ...prev,
                  value: type === 'price_cut' 
                    ? { type: 'price_cut', amount: 100 }
                    : { type: 'new_product', isNew: true }
                }));
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="price_cut">Price Cut</option>
              <option value="new_product">New Product</option>
            </select>
          </div>
          {newPromo.value?.type === 'price_cut' && (
            <div>
              <label className="text-xs font-medium text-gray-700">Jumlah Diskon (Rp):</label>
              <input
                type="number"
                value={newPromo.value?.type === 'price_cut' ? newPromo.value.amount : 100}
                onChange={(e) => setNewPromo(prev => ({
                  ...prev,
                  value: { type: 'price_cut', amount: parseInt(e.target.value) || 100 }
                }))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                min="1"
              />
            </div>
          )}
        </div>
        <div className="mt-3">
          <button
            onClick={addNewPromo}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Promo</span>
          </button>
        </div>
      </div>

      {/* Promo List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
              <div className="flex-shrink-0 w-1/4">Kode Promo</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-shrink-0 w-1/4">Tipe Promo</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-1 min-w-0">Nilai</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-shrink-0 w-20">Aksi</div>
            </div>
          </div>
          <div className="space-y-2">
            {filteredPromos.map((promo) => renderPromoRow(promo))}
          </div>
        </div>
      </div>

      {filteredPromos.length === 0 && (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Promo</h3>
          <p className="text-gray-600">Tidak ada promo yang sesuai dengan filter pencarian</p>
        </div>
      )}
    </div>
  );
});

PromoManagement.displayName = 'PromoManagement';

export default PromoManagement;
