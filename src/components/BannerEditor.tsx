import React, { useState, useEffect, useRef } from 'react';
import { ContentSection, MenuItem } from '../types';
import { Plus, Trash2, ChevronDown, ChevronRight, Save, AlertTriangle, Copy } from 'lucide-react';
import { getRoutesByCategory, getDefaultArgsForRoute } from '../data/routeConfig';
import RouteArgsConfig from './RouteArgsConfig';
import RouteArgsEditor from './RouteArgsEditor';

interface BannerEditorProps {
  widget: ContentSection;
  onSave: (updates: Partial<ContentSection>) => void;
  onClose: () => void;
  menuItems?: MenuItem[]; // Available menu items for cloning
}

const BannerEditor: React.FC<BannerEditorProps> = ({ widget, onSave, onClose, menuItems = [] }) => {
  const [localWidget, setLocalWidget] = useState<ContentSection>(widget);
  const [expandedBanners, setExpandedBanners] = useState<Set<number>>(new Set()); // Start with all collapsed
  const [bannerColors, setBannerColors] = useState<string[]>([]);
  const [navigationTypes, setNavigationTypes] = useState<Record<number, 'none' | 'internal' | 'external' | 'clone'>>({});
  
  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | null>(null);
  const originalWidgetRef = useRef<ContentSection>(widget);

  // Get routes grouped by category for the select dropdown
  const routesByCategory = getRoutesByCategory();

  // Generate random colors for banners
  useEffect(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    setBannerColors(shuffledColors);
  }, []);

  // Check if there are unsaved changes
  const checkForUnsavedChanges = () => {
    const hasChanges = JSON.stringify(localWidget) !== JSON.stringify(originalWidgetRef.current);
    setHasUnsavedChanges(hasChanges);
    return hasChanges;
  };

  // Check for changes whenever localWidget changes
  useEffect(() => {
    checkForUnsavedChanges();
  }, [localWidget]);

  // Auto-sync cloned banners with menu changes
  useEffect(() => {
    if (!localWidget.banners) return;
    
    const updatedBanners = localWidget.banners.map(banner => {
      if (banner.clonedFromMenuId) {
        const menuItem = findMenuItemById(menuItems, banner.clonedFromMenuId);
        if (menuItem) {
          return {
            ...banner,
            route: menuItem.route,
            routeArgs: menuItem.routeArgs,
            url: menuItem.url
            // Don't sync title - keep banner's own title
          };
        }
      }
      return banner;
    });
    
    if (JSON.stringify(updatedBanners) !== JSON.stringify(localWidget.banners)) {
      setLocalWidget({ ...localWidget, banners: updatedBanners });
    }
  }, [menuItems, localWidget.banners]);

  // Initialize navigation types when banners are loaded
  useEffect(() => {
    if (localWidget.banners) {
      const initialNavigationTypes: Record<number, 'none' | 'internal' | 'external' | 'clone'> = {};
      localWidget.banners.forEach((banner, index) => {
        if (banner.clonedFromMenuId) {
          initialNavigationTypes[index] = 'clone';
        } else if (banner.url) {
          initialNavigationTypes[index] = 'external';
        } else if (banner.route) {
          initialNavigationTypes[index] = 'internal';
        } else {
          initialNavigationTypes[index] = 'none';
        }
      });
      setNavigationTypes(initialNavigationTypes);
    }
  }, [localWidget.banners]);

  // Handle beforeunload event (tab/browser close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const toggleBannerExpansion = (index: number) => {
    const newExpanded = new Set(expandedBanners);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedBanners(newExpanded);
  };

  const addBanner = () => {
    const newBanner = {
      imageUrl: 'https://example.com/banner1.jpg',
      title: 'Banner Baru',
      titleFontSize: 14.0,
      titlePosition: { bottom: 8.0, left: 16.0 },
      titleTextShadow: false,
      titleTextShadowColor: '#000000',
      titleTextShadowOpacity: 0.5,
      padding: { top: 8.0, bottom: 60.0, left: 8.0, right: 8.0 },
      borderRadius: 12.0,
      route: '/product',
      routeArgs: getDefaultArgsForRoute('/product') || {
        operators: ['TSELREG'],
        hintText: 'Nomor HP Pelanggan'
      }
    };

    const newBanners = [...(localWidget.banners || []), newBanner];
    setLocalWidget({ ...localWidget, banners: newBanners });
    
    // Don't auto-expand the new banner - keep it collapsed
  };

  const removeBanner = (index: number) => {
    const newBanners = localWidget.banners?.filter((_, i) => i !== index) || [];
    setLocalWidget({ ...localWidget, banners: newBanners });
    
    // Remove from expanded set
    setExpandedBanners(prev => {
      const newExpanded = new Set(prev);
      newExpanded.delete(index);
      // Adjust indices for banners after the removed one
      const adjustedExpanded = new Set<number>();
      prev.forEach(i => {
        if (i < index) {
          adjustedExpanded.add(i);
        } else if (i > index) {
          adjustedExpanded.add(i - 1);
        }
      });
      return adjustedExpanded;
    });
  };

  const duplicateBanner = (index: number) => {
    const bannerToDuplicate = localWidget.banners?.[index];
    if (!bannerToDuplicate) return;

    // Create a copy of the banner with all its configuration
    const duplicatedBanner = {
      ...bannerToDuplicate,
      title: `${bannerToDuplicate.title || 'Banner'} (Copy)`, // Add "(Copy)" to the title
      // Keep all other properties including route, routeArgs, url, clonedFromMenuId, etc.
    };

    // Insert the duplicated banner right after the original
    const newBanners = [...(localWidget.banners || [])];
    newBanners.splice(index + 1, 0, duplicatedBanner);
    setLocalWidget({ ...localWidget, banners: newBanners });

    // Update navigation types for the new banner
    const newNavigationType = bannerToDuplicate.clonedFromMenuId ? 'clone' : 
                             bannerToDuplicate.url ? 'external' : 
                             bannerToDuplicate.route ? 'internal' : 'none';
    
    setNavigationTypes(prev => {
      const newTypes = { ...prev };
      // Shift existing navigation types for banners after the insertion point
      Object.keys(newTypes).forEach(key => {
        const idx = parseInt(key);
        if (idx > index) {
          newTypes[idx + 1] = newTypes[idx];
        }
      });
      newTypes[index + 1] = newNavigationType;
      return newTypes;
    });
  };

  const updateBanner = (index: number, updates: any) => {
    const newBanners = [...(localWidget.banners || [])];
    newBanners[index] = { ...newBanners[index], ...updates };
    setLocalWidget({ ...localWidget, banners: newBanners });
  };

  const handleSave = () => {
    onSave(localWidget);
    // Update the original widget reference after successful save
    originalWidgetRef.current = localWidget;
    setHasUnsavedChanges(false);
  };

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction('close');
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  // Confirm action (discard changes)
  const confirmAction = () => {
    setShowUnsavedChangesDialog(false);
    setPendingAction(null);
    onClose();
  };

  // Cancel action (stay in editor)
  const cancelAction = () => {
    setShowUnsavedChangesDialog(false);
    setPendingAction(null);
  };

  const getBannerColor = (index: number) => {
    return bannerColors[index % bannerColors.length] || '#E5E7EB';
  };

  // Find menu item by ID (recursive search)
  const findMenuItemById = (items: MenuItem[], targetId: string): MenuItem | null => {
    for (const item of items) {
      if (item.menu_id === targetId) {
        return item;
      }
      if (item.submenu?.items) {
        const found = findMenuItemById(item.submenu.items, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Clone menu item data to banner
  const cloneMenuItemToBanner = (menuItem: MenuItem) => {
    return {
      route: menuItem.route,
      routeArgs: menuItem.routeArgs,
      url: menuItem.url,
      clonedFromMenuId: menuItem.menu_id // Track the source menu ID
    };
  };

  // Handle menu cloning
  const handleMenuClone = (index: number, menuId: string) => {
    const menuItem = findMenuItemById(menuItems, menuId);
    if (menuItem) {
      const clonedData = cloneMenuItemToBanner(menuItem);
      // Merge cloned data with existing banner properties
      updateBanner(index, clonedData);
      // Ensure navigation type is set to clone
      setNavigationTypes(prev => ({ ...prev, [index]: 'clone' }));
    }
  };

  // Handle route change with default args
  const handleRouteChange = (index: number, newRoute: string) => {
    const defaultArgs = getDefaultArgsForRoute(newRoute);
    updateBanner(index, { 
      route: newRoute, 
      routeArgs: defaultArgs || {},
      url: undefined // Clear external URL when setting internal route
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-10/12 max-w-5xl h-4/5 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Kelola Banner</h2>
              <p className="text-sm text-gray-600">Tambah, edit, dan hapus banner individual</p>
              {hasUnsavedChanges && (
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                  <AlertTriangle size={12} />
                  <span>Anda memiliki perubahan yang belum disimpan</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Batal
              </button>
              
              <button
                onClick={handleSave}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  hasUnsavedChanges 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <Save size={16} className="inline mr-2" />
                {hasUnsavedChanges ? 'Simpan Perubahan*' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-3">
              <button
                onClick={addBanner}
                className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus size={16} />
                Tambah Banner
              </button>
            </div>

            {localWidget.banners && localWidget.banners.length > 0 ? (
              <div className="space-y-3">
                {localWidget.banners.map((banner, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Banner Header - Always Visible */}
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ backgroundColor: getBannerColor(index) + '20' }} // 20% opacity
                      onClick={() => toggleBannerExpansion(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getBannerColor(index) }}
                        ></div>
                        <h4 className="text-sm font-medium text-gray-800">Banner {index + 1}</h4>
                        <span className="text-xs text-gray-500">
                          {banner.title || 'Untitled Banner'}
                          {banner.clonedFromMenuId && (
                            <span className="ml-2 text-blue-600 flex items-center gap-1">
                              <Copy size={10} />
                              <span>Cloned</span>
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateBanner(index);
                          }}
                          className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Duplikat banner"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBanner(index);
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Hapus banner"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expandedBanners.has(index) ? (
                          <ChevronDown size={16} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-500" />
                        )}
                      </div>
                    </div>

                    {/* Banner Content - Expandable */}
                    {expandedBanners.has(index) && (
                      <div className="p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Left Column - Basic Settings */}
                          <div className="space-y-3">
                            {/* Basic Banner Info */}
                            <div className="space-y-2">
                              <div className="form-group">
                                <label className="form-label text-xs">URL Gambar</label>
                                <input
                                  type="url"
                                  className="form-input text-sm py-1 w-full"
                                  value={banner.imageUrl || ''}
                                  onChange={(e) => updateBanner(index, { imageUrl: e.target.value })}
                                  placeholder="https://example.com/image.jpg"
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label text-xs">Judul</label>
                                <textarea
                                  className="form-input text-sm py-1 w-full resize-none"
                                  value={banner.title || ''}
                                  onChange={(e) => updateBanner(index, { title: e.target.value })}
                                  placeholder="Judul banner (tekan Enter untuk baris baru)"
                                  rows={2}
                                />
                              </div>
                            </div>

                            {/* Title Styling */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="form-group">
                                  <label className="form-label text-xs">Font Size</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    value={banner.titleFontSize?.toString() || '14.0'}
                                    onChange={(e) => updateBanner(index, { titleFontSize: parseFloat(e.target.value) })}
                                    min="8"
                                    max="32"
                                    step="0.5"
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label text-xs">Border Radius</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    value={banner.borderRadius?.toString() || '12'}
                                    onChange={(e) => updateBanner(index, { borderRadius: parseFloat(e.target.value) })}
                                    min="0"
                                    max="50"
                                    step="0.1"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <label className="checkbox-label text-xs">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox"
                                    checked={banner.titleTextShadow || false}
                                    onChange={(e) => updateBanner(index, { titleTextShadow: e.target.checked })}
                                  />
                                  <span className="ml-1">Text Shadow</span>
                                </label>
                                <label className="checkbox-label text-xs">
                                  <input
                                    type="checkbox"
                                    className="form-checkbox"
                                    checked={banner.titlePosition?.center || false}
                                    onChange={(e) => updateBanner(index, {
                                      titlePosition: {
                                        ...banner.titlePosition,
                                        center: e.target.checked
                                      }
                                    })}
                                  />
                                  <span className="ml-1">Center Position</span>
                                </label>
                              </div>
                            </div>

                            {/* Text Shadow Options */}
                            {banner.titleTextShadow && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="form-group">
                                  <label className="form-label text-xs">Shadow Color</label>
                                  <input
                                    type="color"
                                    className="form-input h-8 w-full"
                                    value={banner.titleTextShadowColor || '#000000'}
                                    onChange={(e) => updateBanner(index, { titleTextShadowColor: e.target.value })}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label text-xs">Opacity</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    value={banner.titleTextShadowOpacity?.toString() || '0.5'}
                                    onChange={(e) => updateBanner(index, { titleTextShadowOpacity: parseFloat(e.target.value) })}
                                    min="0"
                                    max="1"
                                    step="0.1"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Navigation */}
                            <div className="space-y-2">
                              <div className="form-group">
                                <label className="form-label text-xs">Konfigurasi Navigasi</label>
                                <div className="p-2 bg-gray-50 rounded border">
                                  <RouteArgsEditor
                                    route={banner.route}
                                    url={banner.url}
                                    routeArgs={banner.routeArgs}
                                    onChange={(config) => {
                                      updateBanner(index, {
                                        route: config.route,
                                        url: config.url,
                                        routeArgs: config.routeArgs,
                                        clonedFromMenuId: undefined // Clear clone when using direct config
                                      });
                                    }}
                                    showValidation={true}
                                    allowUrlMode={true}
                                    allowRouteMode={true}
                                  />
                                </div>
                              </div>

                              {/* Clone from Menus - separate section */}
                              <div className="form-group">
                                <label className="form-label text-xs">Clone dari Menu Item (Opsional)</label>
                                <select
                                  className="form-select text-sm py-1 w-full"
                                  value={banner.clonedFromMenuId || ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleMenuClone(index, e.target.value);
                                    } else {
                                      updateBanner(index, { clonedFromMenuId: undefined });
                                    }
                                  }}
                                >
                                  <option value="">Tidak ada clone</option>
                                  {menuItems
                                    .filter(item => item.route && (item.route === '/product' || item.route === '/webview'))
                                    .map((item) => (
                                      <option key={item.menu_id || item.id} value={item.menu_id || item.id}>
                                        {item.title} - {item.route}
                                      </option>
                                    ))}
                                </select>
                                {banner.clonedFromMenuId && (
                                  <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                    <Copy size={12} />
                                    <span>Cloned from: {banner.clonedFromMenuId}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Column - Position & Padding */}
                          <div className="space-y-3">
                            {/* Title Position */}
                            <div className="space-y-2">
                              <label className="form-label text-xs">Title Position</label>
                              <div className="grid grid-cols-4 gap-2">
                                <div className="form-group">
                                  <label className="form-label text-xs">Top</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    placeholder="0"
                                    value={banner.titlePosition?.top?.toString() || ''}
                                    onChange={(e) => updateBanner(index, {
                                      titlePosition: {
                                        ...banner.titlePosition,
                                        top: e.target.value ? parseFloat(e.target.value) : undefined
                                      }
                                    })}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label text-xs">Bottom</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    placeholder="0"
                                    value={banner.titlePosition?.bottom?.toString() || ''}
                                    onChange={(e) => updateBanner(index, {
                                      titlePosition: {
                                        ...banner.titlePosition,
                                        bottom: e.target.value ? parseFloat(e.target.value) : undefined
                                      }
                                    })}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label text-xs">Left</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    placeholder="0"
                                    value={banner.titlePosition?.left?.toString() || ''}
                                    onChange={(e) => updateBanner(index, {
                                      titlePosition: {
                                        ...banner.titlePosition,
                                        left: e.target.value ? parseFloat(e.target.value) : undefined
                                      }
                                    })}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label text-xs">Right</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    placeholder="0"
                                    value={banner.titlePosition?.right?.toString() || ''}
                                    onChange={(e) => updateBanner(index, {
                                      titlePosition: {
                                        ...banner.titlePosition,
                                        right: e.target.value ? parseFloat(e.target.value) : undefined
                                      }
                                    })}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Banner Padding */}
                            <div className="space-y-2">
                              <label className="form-label text-xs">Banner Padding</label>
                              <div className="grid grid-cols-4 gap-2">
                                <div className="form-group">
                                  <label className="form-label text-xs">Top</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    placeholder="0"
                                    value={banner.padding?.top?.toString() || ''}
                                    onChange={(e) => updateBanner(index, {
                                      padding: {
                                        ...banner.padding,
                                        top: e.target.value ? parseFloat(e.target.value) : undefined
                                      }
                                    })}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label text-xs">Bottom</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    placeholder="0"
                                    value={banner.padding?.bottom?.toString() || ''}
                                    onChange={(e) => updateBanner(index, {
                                      padding: {
                                        ...banner.padding,
                                        bottom: e.target.value ? parseFloat(e.target.value) : undefined
                                      }
                                    })}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label text-xs">Left</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    placeholder="0"
                                    value={banner.padding?.left?.toString() || ''}
                                    onChange={(e) => updateBanner(index, {
                                      padding: {
                                        ...banner.padding,
                                        left: e.target.value ? parseFloat(e.target.value) : undefined
                                      }
                                    })}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label text-xs">Right</label>
                                  <input
                                    type="number"
                                    className="form-input text-sm py-1 w-full"
                                    placeholder="0"
                                    value={banner.padding?.right?.toString() || ''}
                                    onChange={(e) => updateBanner(index, {
                                      padding: {
                                        ...banner.padding,
                                        right: e.target.value ? parseFloat(e.target.value) : undefined
                                      }
                                    })}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Banner</h3>
                <p className="text-sm text-gray-500 mb-4">Mulai dengan menambahkan banner pertama</p>
                <button
                  onClick={addBanner}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto"
                >
                  <Plus size={16} />
                  Tambah Banner Pertama
                </button>
              </div>
            )}
          </div>

          {/* Footer - Removed since buttons are now in header */}
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      {showUnsavedChangesDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-96 max-w-[90vw] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Perubahan Belum Disimpan</h3>
                <p className="text-sm text-gray-600">Anda memiliki perubahan yang belum disimpan yang akan hilang.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Apakah Anda yakin ingin menutup editor? Semua perubahan yang belum disimpan akan hilang.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelAction}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Lanjutkan Mengedit
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Buang Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BannerEditor;
