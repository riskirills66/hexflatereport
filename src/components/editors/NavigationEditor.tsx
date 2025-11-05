import React, { useEffect, useState, useRef } from 'react';
import { NavigationConfig, NavigationItem, MoreMenu } from '../../types';
import TagInput from '../TagInput';
import { getRoutesByCategory, getDefaultArgsForRoute } from '../../data/routeConfig';
import RouteArgsEditor from '../RouteArgsEditor';
import { Plus, Trash2, Edit, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

interface NavigationEditorProps {
  navigation?: NavigationConfig;
  onUpdate: (navigation: NavigationConfig) => void;
  availableScreens?: string[];
  staticScreenNames?: string[];
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
}> = ({ item, index, onUpdate, onRemove, title, availableScreens = [], staticScreenNames = [] }) => {
  const navType = item.route ? 'route' : item.url ? 'url' : item.screen ? 'screen' : 'dynamic';
  const groupName = `navType_${title.replace(/\s+/g, '_')}_${index}`;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
          <input
            type="url"
            value={item.icon}
            onChange={(e) => onUpdate(index, { icon: e.target.value })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="https://example.com/icon.svg"
          />
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
  staticScreenNames = []
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
            {config.mainMenu.map((item, index) => (
              <NavigationItemEditor
                key={index}
                item={item}
                index={index}
                onUpdate={updateMainMenuItem}
                onRemove={removeMainMenuItem}
                title="Item Menu Utama"
                availableScreens={availableScreens}
                staticScreenNames={staticScreenNames}
              />
            ))}
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
                  <input
                    ref={moreMenuIconRef}
                    type="url"
                    value={config.moreMenu.icon}
                    onChange={(e) => updateConfig({ moreMenu: { ...config.moreMenu, icon: e.target.value } })}
                    className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
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
              {config.moreMenu.items.map((item, index) => (
                <NavigationItemEditor
                  key={index}
                  item={item}
                  index={index}
                  onUpdate={updateMoreMenuItem}
                  onRemove={removeMoreMenuItem}
                  title="Item Menu Lainnya"
                  availableScreens={availableScreens}
                  staticScreenNames={staticScreenNames}
                />
              ))}
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
    </div>
  );
};

export default NavigationEditor;