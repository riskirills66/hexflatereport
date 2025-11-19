import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  Gift, 
  Plus, 
  X,
  AlertCircle,
  CheckCircle,
  Search,
  Upload
} from 'lucide-react';
import { X_TOKEN_VALUE, getApiUrl } from '../config/api';
import { getCachedHadiahConfig, setCachedHadiahConfig, mergeHadiahConfig } from '../utils/hadiahCache';

// Types for hadiah management
interface Hadiah {
  id: number;
  nama: string;
  poin: number;
  kategori: string;
  deskripsi: string;
  image_url: string;
  status: string;
}

interface HadiahMetadata {
  total_hadiah: number;
  kategori_tersedia: string[];
  poin_minimum: number;
  poin_maksimum: number;
  tanggal_update: string;
  versi: string;
}

interface HadiahConfig {
  hadiah: Hadiah[];
  metadata: HadiahMetadata;
}

interface HadiahManagementProps {
  authSeed: string;
  onStatsChange?: (total: number) => void;
}

export interface HadiahManagementRef {
  saveAllConfigurations: () => Promise<void>;
}

const HadiahManagement = forwardRef<HadiahManagementRef, HadiahManagementProps>(({ authSeed, onStatsChange }, ref) => {
  const [hadiahConfig, setHadiahConfig] = useState<HadiahConfig | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [newHadiah, setNewHadiah] = useState<Partial<Hadiah>>({
    nama: '',
    poin: 100,
    kategori: 'pulsa',
    deskripsi: '',
    image_url: 'https://pixabay.com/images/download/gift-1420830_640.jpg',
    status: 'aktif'
  });
  const [imagePreview, setImagePreview] = useState<{ [key: number]: string }>({});
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);

  const loadHadiahConfig = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'No admin session found' });
        }
        return;
      }

      const apiUrl = await getApiUrl('/admin/hadiah-config');
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
          setHadiahConfig(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(data.config)) {
              return prev;
            }
            return mergeHadiahConfig(prev, data.config);
          });
        } else {
          if (!background) {
            setMessage({ type: 'error', text: data.message || 'Failed to load hadiah configuration' });
          }
        }
      } else {
        if (!background) {
          setMessage({ type: 'error', text: 'Failed to load hadiah configuration' });
        }
      }
    } catch (error) {
      console.error('Error loading hadiah config:', error);
      if (!background) {
        setMessage({ type: 'error', text: 'Error loading hadiah configuration' });
      }
    }
  }, [authSeed]);

  const prevHadiahConfigRef = useRef<HadiahConfig | null>(null);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Load from cache immediately
    const cached = getCachedHadiahConfig();
    if (cached) {
      prevHadiahConfigRef.current = cached;
      setHadiahConfig(cached);
    }

    // Fetch from API in background
    loadHadiahConfig(true);
  }, [loadHadiahConfig]);

  // Update cache when hadiahConfig changes (but not if it's the same as previous)
  useEffect(() => {
    if (hadiahConfig && prevHadiahConfigRef.current !== hadiahConfig) {
      // Only update cache if config actually changed
      if (!prevHadiahConfigRef.current || 
          JSON.stringify(prevHadiahConfigRef.current) !== JSON.stringify(hadiahConfig)) {
        setCachedHadiahConfig(hadiahConfig);
        prevHadiahConfigRef.current = hadiahConfig;
      }
    }
  }, [hadiahConfig]);

  // Notify parent when hadiahConfig changes
  useEffect(() => {
    if (onStatsChange && hadiahConfig) {
      onStatsChange(hadiahConfig.metadata.total_hadiah || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hadiahConfig?.metadata.total_hadiah]);

  const saveHadiahConfig = async () => {
    if (!hadiahConfig) return;
    
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'No admin session found' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/hadiah-config/save');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
          config: hadiahConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessage({ type: 'success', text: 'Hadiah configuration saved successfully!' });
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to save hadiah configuration' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to save hadiah configuration' });
      }
    } catch (error) {
      console.error('Error saving hadiah config:', error);
      setMessage({ type: 'error', text: 'Error saving hadiah configuration' });
    }
  };

  // Expose saveAllConfigurations function to parent component
  useImperativeHandle(ref, () => ({
    saveAllConfigurations: saveHadiahConfig
  }));

  const updateHadiah = (id: number, field: keyof Hadiah, value: any) => {
    if (!hadiahConfig) return;
    
    setHadiahConfig(prev => {
      if (!prev) return prev;
      const newHadiah = prev.hadiah.map(h => 
        h.id === id ? { ...h, [field]: value } : h
      );
      return { ...prev, hadiah: newHadiah };
    });
  };

  const addNewHadiah = () => {
    if (!hadiahConfig) return;
    
    const maxId = Math.max(...hadiahConfig.hadiah.map(h => h.id), 0);
    const newHadiahItem: Hadiah = {
      id: maxId + 1,
      nama: newHadiah.nama || 'Hadiah Baru',
      poin: newHadiah.poin || 100,
      kategori: newHadiah.kategori || 'pulsa',
      deskripsi: newHadiah.deskripsi || '',
      image_url: newHadiah.image_url || 'https://pixabay.com/images/download/gift-1420830_640.jpg',
      status: newHadiah.status || 'aktif'
    };

    setHadiahConfig(prev => {
      if (!prev) return prev;
      const newHadiah = [...prev.hadiah, newHadiahItem];
      const newMetadata = {
        ...prev.metadata,
        total_hadiah: newHadiah.length,
        tanggal_update: new Date().toISOString().split('T')[0]
      };
      return { ...prev, hadiah: newHadiah, metadata: newMetadata };
    });

    // Reset new hadiah form
    setNewHadiah({
      nama: '',
      poin: 100,
      kategori: 'pulsa',
      deskripsi: '',
      image_url: 'https://pixabay.com/images/download/gift-1420830_640.jpg',
      status: 'aktif'
    });
  };

  const removeHadiah = (id: number) => {
    if (!hadiahConfig) return;
    
    setHadiahConfig(prev => {
      if (!prev) return prev;
      const newHadiah = prev.hadiah.filter(h => h.id !== id);
      const newMetadata = {
        ...prev.metadata,
        total_hadiah: newHadiah.length,
        tanggal_update: new Date().toISOString().split('T')[0]
      };
      return { ...prev, hadiah: newHadiah, metadata: newMetadata };
    });
  };

  const renderHadiahRow = (hadiah: Hadiah) => {
    return (
      <div
        key={hadiah.id}
        className="flex gap-3 p-2 bg-white rounded border border-gray-200 hover:bg-gray-50"
      >
        {/* ID */}
        <div className="flex-shrink-0 w-16 flex items-start">
          <span className="text-xs font-mono text-gray-500">{hadiah.id}</span>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Nama */}
        <div className="flex-shrink-0 w-1/6 flex items-start">
          <input
            type="text"
            value={hadiah.nama}
            onChange={(e) => updateHadiah(hadiah.id, 'nama', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Nama hadiah"
          />
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Poin */}
        <div className="flex-shrink-0 w-20 flex items-start">
          <input
            type="number"
            value={hadiah.poin}
            onChange={(e) => updateHadiah(hadiah.id, 'poin', parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            min="1"
          />
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Kategori */}
        <div className="flex-shrink-0 w-24 flex items-start">
          <select
            value={hadiah.kategori}
            onChange={(e) => updateHadiah(hadiah.id, 'kategori', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {kategoriOptions.map(kategori => (
              <option key={kategori} value={kategori}>
                {kategori.charAt(0).toUpperCase() + kategori.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Deskripsi */}
        <div className="flex-1 min-w-0 flex items-start">
          <input
            type="text"
            value={hadiah.deskripsi}
            onChange={(e) => updateHadiah(hadiah.id, 'deskripsi', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Deskripsi"
          />
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Image */}
        <div className="flex-shrink-0 w-32 flex items-start">
          <div className="w-full space-y-1">
            <input
              type="url"
              value={imagePreview[hadiah.id] || hadiah.image_url}
              onChange={(e) => updateHadiah(hadiah.id, 'image_url', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Image URL"
            />
            <label className="block px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer text-center">
              <Upload className="h-3 w-3 inline mr-1" />
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file, hadiah.id);
                  }
                }}
              />
            </label>
            {uploadingImage === hadiah.id && (
              <div className="text-xs text-gray-600 text-center">
                Uploading...
              </div>
            )}
          </div>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Status */}
        <div className="flex-shrink-0 w-24 flex items-start">
          <select
            value={hadiah.status}
            onChange={(e) => updateHadiah(hadiah.id, 'status', e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="aktif">Aktif</option>
            <option value="tidak aktif">Tidak Aktif</option>
          </select>
        </div>
        
        {/* Separator */}
        <div className="flex-shrink-0 text-gray-400 flex items-start pt-0.5">|</div>
        
        {/* Actions */}
        <div className="flex-shrink-0 w-20 flex items-start">
          <button
            onClick={() => removeHadiah(hadiah.id)}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            title="Hapus hadiah"
          >
            Hapus
          </button>
        </div>
      </div>
    );
  };

  const filteredHadiah = hadiahConfig?.hadiah.filter(hadiah => {
    const matchesSearch = hadiah.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hadiah.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKategori = filterKategori === 'all' || hadiah.kategori === filterKategori;
    return matchesSearch && matchesKategori;
  }) || [];

  const kategoriOptions = hadiahConfig?.metadata.kategori_tersedia || [];

  const handleImageUpload = async (file: File, hadiahId: number) => {
    setUploadingImage(hadiahId);
    try {
      // For now, we'll convert the image to a data URL and use it directly
      // In a real implementation, you would upload to a server and get a URL back
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreview(prev => ({ ...prev, [hadiahId]: dataUrl }));
        updateHadiah(hadiahId, 'image_url', dataUrl);
        setUploadingImage(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
      setUploadingImage(null);
    }
  };


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
                placeholder="Cari hadiah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              {kategoriOptions.map(kategori => (
                <option key={kategori} value={kategori}>
                  {kategori.charAt(0).toUpperCase() + kategori.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add New Hadiah */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Tambah Hadiah Baru</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Nama Hadiah:</label>
            <input
              type="text"
              value={newHadiah.nama || ''}
              onChange={(e) => setNewHadiah(prev => ({ ...prev, nama: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Nama hadiah"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Poin:</label>
            <input
              type="number"
              value={newHadiah.poin || 100}
              onChange={(e) => setNewHadiah(prev => ({ ...prev, poin: parseInt(e.target.value) || 100 }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              min="1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Kategori:</label>
            <select
              value={newHadiah.kategori || 'pulsa'}
              onChange={(e) => setNewHadiah(prev => ({ ...prev, kategori: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {kategoriOptions.map(kategori => (
                <option key={kategori} value={kategori}>
                  {kategori.charAt(0).toUpperCase() + kategori.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Deskripsi:</label>
            <input
              type="text"
              value={newHadiah.deskripsi || ''}
              onChange={(e) => setNewHadiah(prev => ({ ...prev, deskripsi: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Deskripsi hadiah"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Status:</label>
            <select
              value={newHadiah.status || 'aktif'}
              onChange={(e) => setNewHadiah(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="aktif">Aktif</option>
              <option value="tidak aktif">Tidak Aktif</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-700">Image URL:</label>
            <input
              type="url"
              value={newHadiah.image_url || ''}
              onChange={(e) => setNewHadiah(prev => ({ ...prev, image_url: e.target.value }))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Image URL"
            />
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={addNewHadiah}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Hadiah</span>
          </button>
        </div>
      </div>

      {/* Hadiah List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
              <div className="flex-shrink-0 w-16">ID</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-shrink-0 w-1/6">Nama</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-shrink-0 w-20">Poin</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-shrink-0 w-24">Kategori</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-1 min-w-0">Deskripsi</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-shrink-0 w-32">Image</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-shrink-0 w-24">Status</div>
              <div className="flex-shrink-0 text-gray-400">|</div>
              <div className="flex-shrink-0 w-20">Aksi</div>
            </div>
          </div>
          <div className="space-y-2">
            {filteredHadiah.map((hadiah) => renderHadiahRow(hadiah))}
          </div>
        </div>
      </div>

      {filteredHadiah.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Hadiah</h3>
          <p className="text-gray-600">Tidak ada hadiah yang sesuai dengan filter pencarian</p>
        </div>
      )}
    </div>
  );
});

HadiahManagement.displayName = 'HadiahManagement';

export default HadiahManagement;
