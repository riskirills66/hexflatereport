import React, { useState } from 'react';
import { DynamicScreenConfig } from '../types';
import { WIDGET_TYPES } from '../data/widgetTypes';
import { Plus, Check, ChevronDown, Settings } from 'lucide-react';

interface SidebarProps {
  config: DynamicScreenConfig;
  selectedScreen: string;
  availableScreens: string[];
  onScreenChange: (screenName: string) => void;
  onAddWidgetType: (widgetType: string) => void;
  onOpenScreenConfig: () => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  config,
  selectedScreen,
  availableScreens,
  onScreenChange,
  onAddWidgetType,
  onOpenScreenConfig,
  onClose,
}) => {
  const [addedWidget, setAddedWidget] = useState<string | null>(null);

  const handleCreateNewScreen = () => {
    const screenName = prompt('Masukkan nama layar:');
    if (screenName && screenName.trim()) {
      const newScreenName = screenName.trim();
      if (!config.screens[newScreenName]) {
        const updatedConfig = { ...config };
        updatedConfig.screens[newScreenName] = {
          screen: newScreenName,
          content: [],
        };
        // Update the config (you'll need to implement this)
        onScreenChange(newScreenName);
      } else {
        alert('Layar sudah ada!');
      }
    }
  };

  const handleWidgetClick = (widgetType: string) => {
    const widgetName = WIDGET_TYPES.find(w => w.id === widgetType)?.name || widgetType;
    setAddedWidget(widgetName);
    
    // Add the widget
    onAddWidgetType(widgetType);
    
    // Close sidebar on mobile after adding widget
    if (onClose) {
      onClose();
    }
    
    // Show success message for 2 seconds
    setTimeout(() => {
      setAddedWidget(null);
    }, 2000);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">

      {/* Screen Selection */}
      <div className="p-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Layar</h2>
          <button
            onClick={handleCreateNewScreen}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Buat layar baru"
          >
            <Plus size={14} />
          </button>
        </div>
        
        {/* Screen Dropdown */}
        <div className="relative">
          <select
            value={selectedScreen}
            onChange={(e) => onScreenChange(e.target.value)}
            className="w-full p-1.5 pr-6 border border-gray-300 rounded bg-white text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
          >
            {availableScreens.map((screenName) => (
              <option key={screenName} value={screenName}>
                {screenName} ({config.screens[screenName]?.content?.length || 0} widget)
              </option>
            ))}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>
        
        {/* Screen Configuration Button */}
        <div className="mt-2">
          <button
            onClick={onOpenScreenConfig}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-xs font-medium"
            title="Configure screen settings"
          >
            <Settings size={14} />
            Screen Configuration
          </button>
        </div>
      </div>

      {/* Widget Palette */}
      <div className="flex-1 p-2 sidebar-scrollable">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">Widget</h2>
        </div>

        {/* Success Message */}
        {addedWidget && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-1.5 text-green-700">
            <Check size={14} className="text-green-600" />
            <span className="text-xs font-medium">{addedWidget} berhasil ditambahkan!</span>
          </div>
        )}

        {/* Available Widget Types - Now Clickable! */}
        <div className="space-y-1.5">
          <div className="text-xs text-gray-500 mb-1.5 font-medium">
            💡 Klik widget di bawah untuk menambahkannya secara instan
          </div>
          {WIDGET_TYPES.map((widgetType) => (
            <div
              key={widgetType.id}
              onClick={() => handleWidgetClick(widgetType.id)}
              className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm transition-all cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{widgetType.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 group-hover:text-blue-700 transition-colors">{widgetType.name}</div>
                <div className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">{widgetType.description}</div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={14} className="text-blue-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
};

export default Sidebar;
