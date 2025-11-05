import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Gift, 
  Plus, 
  Trash2, 
  X,
  AlertCircle,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Upload
} from 'lucide-react';
import { X_TOKEN_VALUE, getApiUrl } from '../config/api';

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
}

export interface HadiahManagementRef {
  saveAllConfigurations: () => Promise<void>;
}

const HadiahManagement = forwardRef<HadiahManagementRef, HadiahManagementProps>(({ authSeed }, ref) => {
  const [hadiahConfig, setHadiahConfig] = useState<HadiahConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [expandedHadiah, setExpandedHadiah] = useState<Set<number>>(new Set());
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

  useEffect(() => {
    loadHadiahConfig();
  }, [authSeed]);

  const loadHadiahConfig = async () => {
    try {
      setLoading(true);
      const sessionKey = localStorage.getItem('adminSessionKey');
      
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'No admin session found' });
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
          setHadiahConfig(data.config);
        } else {
          setMessage({ type: 'error', text: data.message || 'Failed to load hadiah configuration' });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to load hadiah configuration' });
      }
    } catch (error) {
      console.error('Error loading hadiah config:', error);
      setMessage({ type: 'error', text: 'Error loading hadiah configuration' });
    } finally {
      setLoading(false);
    }
  };

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

  const toggleHadiah = (id: number) => {
    setExpandedHadiah(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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

  const getImageUrl = (hadiah: Hadiah) => {
    // Return preview if available, otherwise return the image_url
    return imagePreview[hadiah.id] || hadiah.image_url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Gift className="h-6 w-6 text-indigo-500" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Manajemen Hadiah</h1>
              <p className="text-xs text-gray-600">
                Kelola daftar hadiah yang dapat ditukar dengan poin ({hadiahConfig?.metadata.total_hadiah || 0} hadiah)
              </p>
            </div>
          </div>
        </div>
      </div>

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
      <div className="space-y-3">
        {filteredHadiah.map((hadiah) => (
          <div key={hadiah.id} className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 flex items-center justify-between">
              <button
                onClick={() => toggleHadiah(hadiah.id)}
                className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-md flex-1"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {getImageUrl(hadiah) ? (
                    <img 
                      src={getImageUrl(hadiah)} 
                      alt={hadiah.nama}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <Gift className={`h-6 w-6 text-indigo-500 ${getImageUrl(hadiah) ? 'hidden' : ''}`} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-semibold text-gray-900">{hadiah.nama}</h3>
                  <p className="text-xs text-gray-600">
                    {hadiah.poin} poin • {hadiah.kategori} • {hadiah.status}
                  </p>
                </div>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => removeHadiah(hadiah.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Hapus hadiah"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {expandedHadiah.has(hadiah.id) ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
            
            {expandedHadiah.has(hadiah.id) && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Nama:</label>
                    <input
                      type="text"
                      value={hadiah.nama}
                      onChange={(e) => updateHadiah(hadiah.id, 'nama', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Poin:</label>
                    <input
                      type="number"
                      value={hadiah.poin}
                      onChange={(e) => updateHadiah(hadiah.id, 'poin', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Kategori:</label>
                    <select
                      value={hadiah.kategori}
                      onChange={(e) => updateHadiah(hadiah.id, 'kategori', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {kategoriOptions.map(kategori => (
                        <option key={kategori} value={kategori}>
                          {kategori.charAt(0).toUpperCase() + kategori.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Status:</label>
                    <select
                      value={hadiah.status}
                      onChange={(e) => updateHadiah(hadiah.id, 'status', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="tidak aktif">Tidak Aktif</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-700">Deskripsi:</label>
                    <input
                      type="text"
                      value={hadiah.deskripsi}
                      onChange={(e) => updateHadiah(hadiah.id, 'deskripsi', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-700">Image:</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="url"
                          value={hadiah.image_url}
                          onChange={(e) => updateHadiah(hadiah.id, 'image_url', e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Image URL"
                        />
                        <label className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer flex items-center space-x-1">
                          <Upload className="h-3 w-3" />
                          <span>Upload</span>
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
                      </div>
                      {getImageUrl(hadiah) && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={getImageUrl(hadiah)} 
                            alt={hadiah.nama}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {uploadingImage === hadiah.id && (
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                          <span>Uploading image...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
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
