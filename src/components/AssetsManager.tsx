import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trash2, 
  Copy, 
  Search, 
  File, 
  Image, 
  Video, 
  FileText, 
  Archive,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
  Grid,
  List,
  Check
} from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import Modal from '../styles/Modal';
import { getCachedAssets, setCachedAssets, mergeAssets } from '../utils/assetsCache';

interface AssetInfo {
  id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  upload_date: string;
  uploader_id: string;
  uploader_name: string;
  public_url: string;
}

interface AssetsManagerProps {
  authSeed: string;
  refreshTrigger?: number;
}

const AssetsManager: React.FC<AssetsManagerProps> = ({ authSeed, refreshTrigger }) => {
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showPreview, setShowPreview] = useState<AssetInfo | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [baseUrl, setBaseUrl] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<{ id: string; filename: string; originalName: string } | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const itemsPerPage = 20;
  const hasLoadedRef = useRef(false);
  const prevAssetsRef = useRef<AssetInfo[]>([]);
  const prevTotalCountRef = useRef<number>(0);

  const loadAssets = useCallback(async (background = false) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        if (!background) {
          setMessage({ type: 'error', text: 'Session key not found. Please login again.' });
        }
        return;
      }

      const filters = {
        page: currentPage,
        searchTerm: searchTerm || '',
      };

      const apiUrl = await getApiUrl('/admin/assets/list');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAssets(prev => {
          if (prev.length === 0 || filters.page === 1 || filters.searchTerm !== '') {
            // Replace for first page or new search
            return data.assets || [];
          } else {
            // Merge for pagination
            return mergeAssets(prev, data.assets || [], false);
          }
        });
        setTotalCount(data.total_count || 0);
        setCachedAssets(filters, {
          success: true,
          assets: data.assets || [],
          total_count: data.total_count || 0,
          page: currentPage,
          limit: itemsPerPage,
        });
      } else {
        if (!background) {
          setMessage({ type: 'error', text: data.message || 'Failed to load assets' });
        }
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
      if (!background) {
        setMessage({ type: 'error', text: 'Failed to load assets' });
      }
    }
  }, [authSeed, currentPage, searchTerm, itemsPerPage]);

  useEffect(() => {
    // Load from cache immediately when filters change
    const filters = {
      page: currentPage,
      searchTerm: searchTerm || '',
    };
    const cached = getCachedAssets(filters);
    if (cached) {
      prevAssetsRef.current = cached.assets;
      prevTotalCountRef.current = cached.total_count;
      setAssets(cached.assets);
      setTotalCount(cached.total_count);
    } else if (hasLoadedRef.current) {
      // Clear assets if no cache for new filters (but not on initial load)
      setAssets([]);
      setTotalCount(0);
    }

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
    }

    // Fetch from API in background
    loadAssets(true);
  }, [loadAssets, currentPage, searchTerm]);

  // Watch for refresh trigger from parent component
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadAssets(false);
    }
  }, [refreshTrigger, loadAssets]);

  useEffect(() => {
    // Get the base URL for asset serving
    const getBaseUrl = async () => {
      try {
        const url = await getApiUrl('');
        setBaseUrl(url);
      } catch (error) {
        console.error('Failed to get base URL:', error);
        // baseUrl will remain empty string if API endpoint fails
      }
    };
    getBaseUrl();
  }, []);

  useEffect(() => {
    if (showPreview) {
      getPublicUrl(showPreview.filename).then(setPreviewUrl);
    } else {
      setPreviewUrl('');
    }
  }, [showPreview]);






  const handleDelete = (assetId: string, filename: string, originalName: string) => {
    setAssetToDelete({ id: assetId, filename, originalName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'Session key not found. Please login again.' });
        return;
      }

      const apiUrl = await getApiUrl('/admin/assets/delete');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          session_key: sessionKey,
          auth_seed: authSeed,
          asset_id: assetToDelete.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove the deleted asset from the local state instead of refreshing
        const updatedAssets = assets.filter(asset => asset.filename !== assetToDelete.filename);
        setAssets(updatedAssets);
        setTotalCount(prevCount => prevCount - 1);
        
        // Update cache
        const filters = {
          page: currentPage,
          searchTerm: searchTerm || '',
        };
        setCachedAssets(filters, {
          success: true,
          assets: updatedAssets,
          total_count: totalCount - 1,
          page: currentPage,
          limit: itemsPerPage,
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Delete failed' });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setMessage({ type: 'error', text: 'Delete failed' });
    } finally {
      setShowDeleteModal(false);
      setAssetToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAssetToDelete(null);
  };

  // Multi-selection functions
  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const selectAllAssets = () => {
    setSelectedAssets(new Set(assets.map(asset => asset.filename)));
  };

  const clearSelection = () => {
    setSelectedAssets(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedAssets.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedAssets.size === 0) return;

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setMessage({ type: 'error', text: 'Session key not found. Please login again.' });
        return;
      }

      const deletePromises = Array.from(selectedAssets).map(async (assetId) => {
        const apiUrl = await getApiUrl('/admin/assets/delete');
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Token': X_TOKEN_VALUE,
          },
          body: JSON.stringify({
            session_key: sessionKey,
            auth_seed: authSeed,
            asset_id: assetId,
          }),
        });
        return response.json();
      });

      await Promise.all(deletePromises);

      // Remove deleted assets from local state
      const updatedAssets = assets.filter(asset => !selectedAssets.has(asset.filename));
      const deletedCount = selectedAssets.size;
      setAssets(updatedAssets);
      setTotalCount(prevCount => prevCount - deletedCount);
      
      // Update cache
      const filters = {
        page: currentPage,
        searchTerm: searchTerm || '',
      };
      setCachedAssets(filters, {
        success: true,
        assets: updatedAssets,
        total_count: totalCount - deletedCount,
        page: currentPage,
        limit: itemsPerPage,
      });
      
      clearSelection();

    } catch (error) {
      console.error('Bulk delete failed:', error);
      setMessage({ type: 'error', text: 'Bulk delete failed' });
    } finally {
      setShowBulkDeleteModal(false);
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false);
  };

  const copyToClipboard = async (filename: string) => {
    try {
      const url = await getPublicUrl(filename);
      await navigator.clipboard.writeText(url);
      setMessage({ type: 'success', text: 'URL copied to clipboard!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to copy URL' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000);
    return date.toLocaleString();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-500" />;
    if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-5 w-5 text-orange-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getPublicUrl = async (filename: string) => {
    // Get the API base URL instead of the frontend URL
    const apiUrl = await getApiUrl('');
    return `${apiUrl}/assets/${filename}`;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="space-y-6">

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedAssets.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedAssets.size} file{selectedAssets.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllAssets}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 inline mr-1" />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Assets ({totalCount} total)
          </h3>
        </div>

        {assets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No assets found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {assets.map((asset) => (
              <div key={asset.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <button
                    onClick={() => toggleAssetSelection(asset.filename)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedAssets.has(asset.filename)
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {selectedAssets.has(asset.filename) && <Check className="h-3 w-3" />}
                  </button>
                </div>

                {/* Thumbnail/Preview */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {asset.mime_type.startsWith('image/') ? (
                    <img
                      src={`${baseUrl}/assets/${asset.filename}`}
                      alt={asset.original_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to file icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : asset.mime_type.startsWith('video/') ? (
                    <video
                      src={`${baseUrl}/assets/${asset.filename}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback icon for non-image/video files or failed loads */}
                  <div className={`absolute inset-0 flex items-center justify-center ${asset.mime_type.startsWith('image/') || asset.mime_type.startsWith('video/') ? 'hidden' : ''}`}>
                    <div className="text-gray-400">
                      {getFileIcon(asset.mime_type)}
                    </div>
                  </div>

                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPreview(asset)}
                        className="p-2 bg-white bg-opacity-90 text-gray-700 rounded-full hover:bg-opacity-100 transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => copyToClipboard(asset.filename)}
                        className="p-2 bg-white bg-opacity-90 text-gray-700 rounded-full hover:bg-opacity-100 transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={async () => {
                          const url = await getPublicUrl(asset.filename);
                          window.open(url, '_blank');
                        }}
                        className="p-2 bg-white bg-opacity-90 text-gray-700 rounded-full hover:bg-opacity-100 transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(asset.filename, asset.filename, asset.original_name)}
                        className="p-2 bg-white bg-opacity-90 text-red-600 rounded-full hover:bg-opacity-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* File info */}
                <div className="p-3">
                  <div className="mb-2">
                    <p className="font-medium text-gray-900 text-sm truncate" title={asset.original_name}>
                      {asset.original_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={asset.filename}>
                      {asset.filename}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatFileSize(asset.file_size)}</span>
                    <span>{formatDate(asset.upload_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {assets.map((asset) => (
              <div key={asset.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Selection Checkbox */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => toggleAssetSelection(asset.filename)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedAssets.has(asset.filename)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {selectedAssets.has(asset.filename) && <Check className="h-3 w-3" />}
                    </button>
                  </div>
                  
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    {asset.mime_type.startsWith('image/') ? (
                      <img
                        src={`${baseUrl}/assets/${asset.filename}`}
                        alt={asset.original_name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`text-gray-400 ${asset.mime_type.startsWith('image/') ? 'hidden' : ''}`}>
                      {getFileIcon(asset.mime_type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {asset.original_name}
                      </p>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {asset.filename}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>{formatFileSize(asset.file_size)}</span>
                      <span>•</span>
                      <span>{formatDate(asset.upload_date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPreview(asset)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => copyToClipboard(asset.filename)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={async () => {
                        const url = await getPublicUrl(asset.filename);
                        window.open(url, '_blank');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(asset.filename, asset.filename, asset.original_name)}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{showPreview.original_name}</h3>
              <button
                onClick={() => setShowPreview(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-auto">
              {showPreview.mime_type.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt={showPreview.original_name}
                  className="max-w-full h-auto rounded"
                />
              ) : showPreview.mime_type.startsWith('video/') ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full h-auto rounded"
                />
              ) : (
                <div className="text-center py-8">
                  <File className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                  <button
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>Size: {formatFileSize(showPreview.file_size)}</p>
                  <p>Uploaded: {formatDate(showPreview.upload_date)}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(showPreview.filename)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        title="Delete Asset"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete Asset
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete <strong>"{assetToDelete?.originalName}"</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={cancelDelete}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={cancelBulkDelete}
        title="Delete Multiple Assets"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete {selectedAssets.size} Asset{selectedAssets.size !== 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Are you sure you want to delete <strong>{selectedAssets.size} file{selectedAssets.size !== 1 ? 's' : ''}</strong>? 
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={cancelBulkDelete}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete {selectedAssets.size} File{selectedAssets.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssetsManager;
