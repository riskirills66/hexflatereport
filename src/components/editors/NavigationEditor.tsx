import React, { useEffect, useState, useRef } from 'react';
import { NavigationConfig, NavigationItem, MoreMenu } from '../../types';
import TagInput from '../TagInput';
import { getRoutesByCategory, getDefaultArgsForRoute } from '../../data/routeConfig';
import RouteArgsEditor from '../RouteArgsEditor';
import { Plus, Trash2, Edit, Eye, EyeOff, ChevronDown, ChevronUp, Upload, Image as ImageIcon, X } from 'lucide-react';
import AssetsManager from '../AssetsManager';
import { getApiUrl, X_TOKEN_VALUE } from '../../config/api';

interface NavigationEditorProps {
  navigation?: NavigationConfig;
  onUpdate: (navigation: NavigationConfig) => void;
  availableScreens?: string[];
  staticScreenNames?: string[];
  authSeed?: string;
}

// Move NavigationItemEditor outside of the main component
const NavigationItemEditor: React.FC<{
  item: NavigationItem;
  index: number;
  onUpdate: (index: number, updates: Partial<NavigationItem>) => void;
  onRemove: (index: number) => void;
  title: string;
  availableScreens?: string[];
  staticScreenNames?: string[];
  onOpenAssetPicker?: (index: number) => void;
  onFileSelect?: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  fileInputRef?: (el: HTMLInputElement | null) => void;
}> = ({ item, index, onUpdate, onRemove, title, availableScreens = [], staticScreenNames = [], onOpenAssetPicker, onFileSelect, fileInputRef }) => {
  const navType = item.route ? 'route' : item.url ? 'url' : item.screen ? 'screen' : 'dynamic';
  const groupName = `navType_${title.replace(/\s+/g, '_')}_${index}`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">{title} #{index + 1}</h4>
        <button
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">URL Ikon</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={item.icon}
              onChange={(e) => onUpdate(index, { icon: e.target.value })}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="https://example.com/icon.svg"
            />
            {onFileSelect && (
              <>
                <input
                  ref={(el) => {
                    localFileInputRef.current = el;
                    if (fileInputRef) fileInputRef(el);
                  }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFileSelect(e, index)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => localFileInputRef.current?.click()}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                  title="Upload icon"
                >
                  <Upload size={12} />
                </button>
                {onOpenAssetPicker && (
                  <button
                    type="button"
                    onClick={() => onOpenAssetPicker(index)}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                    title="Select from assets"
                  >
                    <ImageIcon size={12} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={item.label}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Label Menu"
          />
        </div>
        {/* Navigation type selector */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Jenis Navigasi</label>
          <div className="flex gap-3 mb-2">
            <label className="checkbox-label text-xs">
              <input
                type="radio"
                name={groupName}
                value="dynamic"
                checked={navType === 'dynamic'}
                onChange={() => onUpdate(index, { dynamic: item.dynamic || 'home', screen: undefined, route: undefined, url: undefined, routeArgs: undefined })}
                className="form-radio"
              />
              <span className="ml-2">Dinamis</span>
            </label>
            <label className="checkbox-label text-xs">
              <input
                type="radio"
                name={groupName}
                value="screen"
                checked={navType === 'screen'}
                onChange={() => onUpdate(index, { screen: item.screen || 'history', dynamic: undefined, route: undefined, url: undefined, routeArgs: undefined })}
                className="form-radio"
              />
              <span className="ml-2">Layar</span>
            </label>
            <label className="checkbox-label text-xs">
              <input
                type="radio"
                name={groupName}
                value="route"
                checked={navType === 'route'}
                onChange={() => onUpdate(index, { route: item.route || '/product', url: undefined, dynamic: undefined, screen: undefined })}
                className="form-radio"
              />
              <span className="ml-2">Rute</span>
            </label>
            <label className="checkbox-label text-xs">
              <input
                type="radio"
                name={groupName}
                value="url"
                checked={navType === 'url'}
                onChange={() => onUpdate(index, { url: item.url || 'https://example.com', route: undefined, dynamic: undefined, screen: undefined, routeArgs: undefined })}
                className="form-radio"
              />
              <span className="ml-2">URL Eksternal</span>
            </label>
          </div>
        </div>

        {/* Dynamic and Screen fields */}
        {/* Dynamic or Static screen input based on navType */}
        {!item.route && !item.url && navType === 'dynamic' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Layar Dinamis</label>
            {availableScreens.length > 0 ? (
              <select
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={item.dynamic || ''}
                onChange={(e) => onUpdate(index, { dynamic: e.target.value || undefined })}
              >
                <option value="">Pilih screen...</option>
                {availableScreens.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={item.dynamic || ''}
                onChange={(e) => onUpdate(index, { dynamic: e.target.value || undefined })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="home, trending, dll."
              />
            )}
          </div>
        )}
        {!item.route && !item.url && navType === 'screen' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Layar</label>
            {staticScreenNames.length > 0 ? (
              <select
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={item.screen || ''}
                onChange={(e) => onUpdate(index, { screen: e.target.value || undefined })}
              >
                <option value="">Pilih screen...</option>
                {staticScreenNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={item.screen || ''}
                onChange={(e) => onUpdate(index, { screen: e.target.value || undefined })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="history, profile, dll."
              />
            )}
          </div>
        )}

        {/* Route and URL configuration */}
        {(item.route !== undefined || item.url !== undefined) && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Konfigurasi Navigasi</label>
            <div className="p-2 bg-gray-50 rounded border">
              <RouteArgsEditor
                route={item.route}
                url={item.url}
                routeArgs={item.routeArgs}
                onChange={(config) => {
                  onUpdate(index, {
                    route: config.route,
                    url: config.url,
                    routeArgs: config.routeArgs
                  });
                }}
                showValidation={true}
                allowUrlMode={true}
                allowRouteMode={true}
              />
            </div>
          </div>
        )}
        <div className="flex items-center">
          <label className="flex items-center text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={item.active}
              onChange={(e) => onUpdate(index, { active: e.target.checked })}
              className="mr-2 h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            Aktif
          </label>
        </div>
      </div>
    </div>
  );
};

const NavigationEditor: React.FC<NavigationEditorProps> = ({
  navigation,
  onUpdate,
  availableScreens = [],
  staticScreenNames = [],
  authSeed = ''
}) => {
  const defaultNavigation: NavigationConfig = {
    menuStyle: 3,
    mainMenu: [],
    moreMenu: {
      icon: "https://www.svgrepo.com/download/511077/more-grid-big.svg",
      label: "Lainnya",
      active: true,
      items: []
    }
  };

  const [config, setConfig] = useState<NavigationConfig>(navigation || defaultNavigation);

  // Keep local state in sync with parent-provided navigation from backend
  useEffect(() => {
    console.log('NavigationEditor: Received navigation prop:', navigation);
    setConfig(navigation || defaultNavigation);
  }, [navigation]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['mainMenu', 'moreMenu']));

  // Refs for more menu header inputs
  const moreMenuIconRef = useRef<HTMLInputElement>(null);
  const moreMenuLabelRef = useRef<HTMLInputElement>(null);

  // Asset picker/uploader state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [currentItemType, setCurrentItemType] = useState<'mainMenu' | 'moreMenu' | 'moreMenuHeader' | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const moreMenuHeaderFileInputRef = useRef<HTMLInputElement>(null);

  const getPublicUrl = async (filename: string) => {
    // Strip any leading /assets/ or / from the filename
    const cleanFilename = filename.replace(/^\/assets\//, '').replace(/^\//, '');
    const apiUrl = await getApiUrl('');
    return `${apiUrl}/assets/${cleanFilename}`;
  };

  const handleUploadFile = async (file: File) => {
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        console.error('Session key not found');
        return null;
      }

      const formData = new FormData();
      formData.append('session_key', sessionKey);
      formData.append('auth_seed', authSeed || localStorage.getItem('adminAuthSeed') || '');
      formData.append('file', file);

      const apiUrl = await getApiUrl('/admin/assets/upload');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'X-Token': X_TOKEN_VALUE,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Upload response:', data);
      
      if (data.success) {
        // Try different response formats
        let filename = null;
        let publicUrl = null;
        
        // Check for filename in various places
        if (data.filename) {
          filename = data.filename;
        } else if (data.asset?.filename) {
          filename = data.asset.filename;
        } else if (data.file_url) {
          // Extract filename from file_url
          const urlParts = data.file_url.split('/');
          filename = urlParts[urlParts.length - 1];
        }
        
        // Check for public_url or file_url (might be full URL or relative)
        if (data.public_url) {
          publicUrl = data.public_url;
        } else if (data.asset?.public_url) {
          publicUrl = data.asset.public_url;
        } else if (data.file_url) {
          publicUrl = data.file_url;
        }
        
        // If we have a URL but it's relative (starts with /), make it absolute
        if (publicUrl && publicUrl.startsWith('/')) {
          const baseUrl = await getApiUrl('');
          publicUrl = `${baseUrl}${publicUrl}`;
        }
        
        // If we still don't have a URL but have a filename, construct it
        if (!publicUrl && filename) {
          publicUrl = await getPublicUrl(filename);
        }
        
        console.log('Extracted filename:', filename);
        console.log('Constructed publicUrl:', publicUrl);
        
        if (publicUrl) {
          setAssetsRefreshTrigger(prev => prev + 1);
          return publicUrl;
        } else {
          console.error('Upload succeeded but no URL found in response:', data);
          return null;
        }
      } else {
        console.error('Upload failed:', data.message || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, itemType: 'mainMenu' | 'moreMenu', index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Starting file upload for navigation item', itemType, index);
    const url = await handleUploadFile(file);
    console.log('Upload completed, URL:', url);
    
    if (url) {
      console.log('Setting icon to:', url);
      if (itemType === 'mainMenu') {
        updateMainMenuItem(index, { icon: url });
      } else {
        updateMoreMenuItem(index, { icon: url });
      }
    } else {
      console.error('Failed to get URL from upload');
    }

    const refKey = `${itemType}_${index}`;
    if (fileInputRefs.current[refKey]) {
      fileInputRefs.current[refKey]!.value = '';
    }
  };

  const handleMoreMenuHeaderFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Starting file upload for more menu header');
    const url = await handleUploadFile(file);
    console.log('Upload completed, URL:', url);
    
    if (url) {
      console.log('Setting more menu header icon to:', url);
      updateConfig({ moreMenu: { ...config.moreMenu, icon: url } });
    } else {
      console.error('Failed to get URL from upload');
    }

    if (moreMenuHeaderFileInputRef.current) {
      moreMenuHeaderFileInputRef.current.value = '';
    }
  };

  const handleAssetSelect = (url: string) => {
    if (url && currentItemIndex !== null && currentItemType) {
      console.log('Asset selected, setting icon to:', url);
      if (currentItemType === 'mainMenu') {
        updateMainMenuItem(currentItemIndex, { icon: url });
      } else if (currentItemType === 'moreMenu') {
        updateMoreMenuItem(currentItemIndex, { icon: url });
      } else if (currentItemType === 'moreMenuHeader') {
        updateConfig({ moreMenu: { ...config.moreMenu, icon: url } });
      }
      setShowAssetPicker(false);
      setCurrentItemIndex(null);
      setCurrentItemType(null);
    }
  };

  const openAssetPicker = (itemType: 'mainMenu' | 'moreMenu' | 'moreMenuHeader', index: number) => {
    setCurrentItemType(itemType);
    setCurrentItemIndex(index);
    setShowAssetPicker(true);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateConfig = (updates: Partial<NavigationConfig>) => {
    const updatedConfig = { ...config, ...updates };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const addMainMenuItem = () => {
    const newItem: NavigationItem = {
      icon: "https://www.svgrepo.com/download/529026/home.svg",
      label: "Item Menu Baru",
      active: true
    };
    const updatedConfig = {
      ...config,
      mainMenu: [...config.mainMenu, newItem]
    };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const updateMainMenuItem = (index: number, updates: Partial<NavigationItem>) => {
    const updatedMainMenu = [...config.mainMenu];
    updatedMainMenu[index] = { ...updatedMainMenu[index], ...updates };
    const updatedConfig = { ...config, mainMenu: updatedMainMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const removeMainMenuItem = (index: number) => {
    const updatedMainMenu = config.mainMenu.filter((_, i) => i !== index);
    const updatedConfig = { ...config, mainMenu: updatedMainMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const addMoreMenuItem = () => {
    const newItem: NavigationItem = {
      icon: "https://www.svgrepo.com/download/529867/settings.svg",
      label: "Item Lainnya Baru",
      active: true
    };
    const updatedMoreMenu = {
      ...config.moreMenu,
      items: [...config.moreMenu.items, newItem]
    };
    const updatedConfig = { ...config, moreMenu: updatedMoreMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const updateMoreMenuItem = (index: number, updates: Partial<NavigationItem>) => {
    const updatedItems = [...config.moreMenu.items];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    const updatedMoreMenu = { ...config.moreMenu, items: updatedItems };
    const updatedConfig = { ...config, moreMenu: updatedMoreMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const removeMoreMenuItem = (index: number) => {
    const updatedItems = config.moreMenu.items.filter((_, i) => i !== index);
    const updatedMoreMenu = { ...config.moreMenu, items: updatedItems };
    const updatedConfig = { ...config, moreMenu: updatedMoreMenu };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Menu Style */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Gaya Menu</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: 1, label: 'Floating Dock', description: 'Floating dock dengan sembunyi/tampil' },
            { value: 2, label: 'Bar Bawah Statis', description: 'Navigasi bawah tradisional' },
            { value: 3, label: 'Bar Bawah Geser', description: 'Geser untuk menampilkan menu lebih banyak' }
          ].map((style) => (
            <div
              key={style.value}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                config.menuStyle === style.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => updateConfig({ menuStyle: style.value })}
            >
              <div className="font-medium text-sm">{style.label}</div>
              <div className="text-xs text-gray-500 mt-1">{style.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Menu */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div
          className="p-6 cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection('mainMenu')}
        >
          <h3 className="text-lg font-medium text-gray-900">Menu Utama</h3>
          {expandedSections.has('mainMenu') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
        {expandedSections.has('mainMenu') && (
          <div className="px-6 pb-6 space-y-4">
            {config.mainMenu.map((item, index) => {
              const refKey = `mainMenu_${index}`;
              return (
                <NavigationItemEditor
                  key={index}
                  item={item}
                  index={index}
                  onUpdate={updateMainMenuItem}
                  onRemove={removeMainMenuItem}
                  title="Item Menu Utama"
                  availableScreens={availableScreens}
                  staticScreenNames={staticScreenNames}
                  onOpenAssetPicker={(idx) => openAssetPicker('mainMenu', idx)}
                  onFileSelect={(e, idx) => handleFileSelect(e, 'mainMenu', idx)}
                  fileInputRef={(el) => { fileInputRefs.current[refKey] = el; }}
                />
              );
            })}
            <button
              onClick={addMainMenuItem}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Item Menu Utama
            </button>
          </div>
        )}
      </div>

      {/* More Menu */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div
          className="p-6 cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection('moreMenu')}
        >
          <h3 className="text-lg font-medium text-gray-900">Menu Lainnya</h3>
          {expandedSections.has('moreMenu') ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </div>
        {expandedSections.has('moreMenu') && (
          <div className="px-6 pb-6 space-y-4">
            {/* More Menu Header */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Header Menu Lainnya</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">URL Ikon</label>
                  <div className="flex gap-2">
                    <input
                      ref={moreMenuIconRef}
                      type="url"
                      value={config.moreMenu.icon}
                      onChange={(e) => updateConfig({ moreMenu: { ...config.moreMenu, icon: e.target.value } })}
                      className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      ref={moreMenuHeaderFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMoreMenuHeaderFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => moreMenuHeaderFileInputRef.current?.click()}
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                      title="Upload icon"
                    >
                      <Upload size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssetPicker('moreMenuHeader', 0)}
                      className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                      title="Select from assets"
                    >
                      <ImageIcon size={12} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">Label</label>
                  <input
                    ref={moreMenuLabelRef}
                    type="text"
                    value={config.moreMenu.label}
                    onChange={(e) => updateConfig({ moreMenu: { ...config.moreMenu, label: e.target.value } })}
                    className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center text-xs font-medium text-blue-700">
                    <input
                      type="checkbox"
                      checked={config.moreMenu.active}
                      onChange={(e) => updateConfig({ moreMenu: { ...config.moreMenu, active: e.target.checked } })}
                      className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                    />
                    Aktif
                  </label>
                </div>
              </div>
            </div>

            {/* More Menu Items */}
            <div className="space-y-3">
              {config.moreMenu.items.map((item, index) => {
                const refKey = `moreMenu_${index}`;
                return (
                  <NavigationItemEditor
                    key={index}
                    item={item}
                    index={index}
                    onUpdate={updateMoreMenuItem}
                    onRemove={removeMoreMenuItem}
                    title="Item Menu Lainnya"
                    availableScreens={availableScreens}
                    staticScreenNames={staticScreenNames}
                    onOpenAssetPicker={(idx) => openAssetPicker('moreMenu', idx)}
                    onFileSelect={(e, idx) => handleFileSelect(e, 'moreMenu', idx)}
                    fileInputRef={(el) => { fileInputRefs.current[refKey] = el; }}
                  />
                );
              })}
              <button
                onClick={addMoreMenuItem}
                className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item Menu Lainnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pratinjau Navigasi</h3>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Gaya Menu: {config.menuStyle}</div>
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Menu Utama ({config.mainMenu.filter(item => item.active).length} aktif):</div>
            <div className="flex flex-wrap gap-2">
              {config.mainMenu.filter(item => item.active).map((item, index) => (
                <div key={index} className="bg-white px-2 py-1 rounded text-xs border">
                  {item.label}
                </div>
              ))}
            </div>
            {config.moreMenu.active && (
              <>
                <div className="text-xs text-gray-600 mt-3">Menu Lainnya ({config.moreMenu.items.filter(item => item.active).length} item):</div>
                <div className="flex flex-wrap gap-2">
                  {config.moreMenu.items.filter(item => item.active).map((item, index) => (
                    <div key={index} className="bg-blue-100 px-2 py-1 rounded text-xs border border-blue-200">
                      {item.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Pilih atau Upload Asset</h3>
              <button
                onClick={() => {
                  setShowAssetPicker(false);
                  setCurrentItemIndex(null);
                  setCurrentItemType(null);
                }}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AssetsManager 
                authSeed={authSeed || localStorage.getItem('adminAuthSeed') || ''}
                refreshTrigger={assetsRefreshTrigger}
                onAssetSelect={handleAssetSelect}
              />
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Petunjuk:</strong> Klik langsung pada gambar untuk memilih dan menerapkan ke field URL Ikon secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationEditor;