import React, { useState, useEffect } from 'react';
import { ScreenConfig, ActionButton, HeaderBackground } from '../types';
import { Settings, Eye, EyeOff, Plus, X, Bell, HelpCircle, Image, CreditCard, Monitor, ChevronDown } from 'lucide-react';
import { ACTION_BUTTON_ICONS, getIconsByCategory, findIconByName, type ActionButtonIcon } from '../data/actionButtonIcons';

interface ScreenConfigPanelProps {
  screen: ScreenConfig;
  onUpdate: (updates: Partial<ScreenConfig>) => void;
}

const ScreenConfigPanel: React.FC<ScreenConfigPanelProps> = ({ screen, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingActionButton, setEditingActionButton] = useState<ActionButton | null>(null);
  const [editingHeaderBg, setEditingHeaderBg] = useState<HeaderBackground | null>(null);
    const [openIconDropdown, setOpenIconDropdown] = useState<number | null>(null);
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  
  // Close dropdown when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (openIconDropdown !== null) {
      setOpenIconDropdown(null);
    }
  };

  // Add click outside listener
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openIconDropdown]);
  
  const addActionButton = () => {
    const currentButtons = screen.action_buttons || [];
    if (currentButtons.length >= 2) {
      alert('Maximum 2 action buttons allowed');
      return;
    }
    
    const newButton: ActionButton = {
      icon: 'settings',
      route: '/settings',
      type: 'standard',
      tooltip: 'Settings'
    };
    
    onUpdate({
      action_buttons: [...currentButtons, newButton]
    });
  };

  const removeActionButton = (index: number) => {
    const currentButtons = screen.action_buttons || [];
    const newButtons = currentButtons.filter((_, i) => i !== index);
    onUpdate({ action_buttons: newButtons });
  };

  const updateActionButton = (index: number, updates: Partial<ActionButton>) => {
    const currentButtons = screen.action_buttons || [];
    const newButtons = [...currentButtons];
    newButtons[index] = { ...newButtons[index], ...updates };
    onUpdate({ action_buttons: newButtons });
  };

  const addHeaderBackground = () => {
    const currentBackgrounds = screen.headerBackgroundUrl || {};
    const newKey = `bg_${Object.keys(currentBackgrounds).length + 1}`;
    const newBackground: HeaderBackground = {
      imageUrl: '',
      title: '',
      route: ''
    };
    
    onUpdate({
      headerBackgroundUrl: { ...currentBackgrounds, [newKey]: newBackground }
    });
  };

  const removeHeaderBackground = (key: string) => {
    const currentBackgrounds = screen.headerBackgroundUrl || {};
    const newBackgrounds = { ...currentBackgrounds };
    delete newBackgrounds[key];
    onUpdate({ headerBackgroundUrl: newBackgrounds });
  };

  const updateHeaderBackground = (key: string, updates: Partial<HeaderBackground>) => {
    const currentBackgrounds = screen.headerBackgroundUrl || {};
    const newBackgrounds = { ...currentBackgrounds };
    newBackgrounds[key] = { ...newBackgrounds[key], ...updates };
    onUpdate({ headerBackgroundUrl: newBackgrounds });
  };

  return (
    <div className="flex-1 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Screen Configuration</h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Configure screen-level settings for: {screen.screen}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Basic Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Screen Title</label>
            <input
              type="text"
              value={screen.screenTitle || ''}
              onChange={(e) => onUpdate({ screenTitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Screen Title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Carousel Height</label>
            <input
              type="number"
              value={screen.carouselHeight || 300}
              onChange={(e) => onUpdate({ carouselHeight: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="100"
              max="500"
            />
          </div>

          {/* Toggle Settings */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="balance_card"
                checked={screen.balance_card || false}
                onChange={(e) => onUpdate({ balance_card: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="balance_card" className="ml-2 text-sm text-gray-700 flex items-center gap-2">
                <CreditCard size={16} className="text-blue-500" />
                Show Balance Card
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="headerFade"
                checked={screen.headerFade !== false}
                onChange={(e) => onUpdate({ headerFade: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="headerFade" className="ml-2 text-sm text-gray-700">
                Header Fade Effect
              </label>
            </div>
          </div>

          {/* Balance Card Variant */}
          {screen.balance_card && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Balance Card Variant</label>
              <select
                value={screen.balance_card_variant || 1}
                onChange={(e) => onUpdate({ balance_card_variant: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6].map(variant => (
                  <option key={variant} value={variant}>Variant {variant}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Bell size={16} className="text-blue-500" />
              Action Buttons
              <span className="text-xs text-gray-500">
                ({(screen.action_buttons || []).length}/2)
              </span>
            </label>
            
            <div className="space-y-2">
              {(screen.action_buttons || []).map((button, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenIconDropdown(openIconDropdown === index ? null : index)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
                      >
                        <span className="truncate">
                          {button.icon ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                                <span className="text-xs text-blue-600 font-medium">I</span>
                              </span>
                              {findIconByName(button.icon)?.displayName || button.icon}
                            </span>
                          ) : (
                            'Select icon'
                          )}
                        </span>
                        <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                      </button>
                      
                      {openIconDropdown === index && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2">
                            {/* Search input */}
                            <div className="mb-3">
                              <input
                                type="text"
                                placeholder="Search icons..."
                                value={iconSearchTerm}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onKeyDown={(e) => e.stopPropagation()}
                                onChange={(e) => setIconSearchTerm(e.target.value)}
                              />
                            </div>
                            
                            {Object.entries(getIconsByCategory())
                              .map(([category, icons]) => {
                                const filteredIcons = iconSearchTerm 
                                  ? icons.filter(icon => 
                                      icon.displayName.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
                                      icon.name.toLowerCase().includes(iconSearchTerm.toLowerCase())
                                    )
                                  : icons;
                                
                                if (filteredIcons.length === 0) return null;
                                
                                return (
                                  <div key={category} className="mb-3">
                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
                                      {category}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1">
                                      {filteredIcons.map((icon) => (
                                        <button
                                          key={icon.name}
                                          type="button"
                                          onClick={() => {
                                            updateActionButton(index, { icon: icon.name });
                                            setOpenIconDropdown(null);
                                            setIconSearchTerm('');
                                          }}
                                          className="flex items-center gap-2 px-2 py-1 text-xs text-left hover:bg-blue-50 rounded text-gray-700 hover:text-blue-700 transition-colors"
                                        >
                                          <span className="w-4 h-4 flex items-center justify-center">
                                            {/* Icon preview placeholder */}
                                            <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                                          </span>
                                          <span className="truncate">{icon.displayName}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* No results message */}
                              {iconSearchTerm && Object.entries(getIconsByCategory()).every(([category, icons]) => {
                                const filteredIcons = icons.filter(icon => 
                                  icon.displayName.toLowerCase().includes(iconSearchTerm.toLowerCase()) ||
                                  icon.name.toLowerCase().includes(iconSearchTerm.toLowerCase())
                                );
                                return filteredIcons.length === 0;
                              }) && (
                                <div className="text-center py-4 text-sm text-gray-500">
                                  No icons found for "{iconSearchTerm}"
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={button.route}
                      onChange={(e) => updateActionButton(index, { route: e.target.value })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Route"
                    />
                    <select
                      value={button.type}
                      onChange={(e) => updateActionButton(index, { type: e.target.value as 'standard' | 'notification' | 'help' })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="standard">Standard</option>
                      <option value="notification">Notification</option>
                      <option value="help">Help</option>
                    </select>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {button.type === 'notification' && <Bell size={14} className="text-blue-500" />}
                      {button.type === 'help' && <HelpCircle size={14} className="text-blue-500" />}
                      {button.type === 'standard' && <Settings size={14} className="text-gray-500" />}
                      <span className="text-xs text-gray-500">{button.type}</span>
                    </div>
                    <button
                      onClick={() => removeActionButton(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              {(screen.action_buttons || []).length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500">
                  No action buttons configured
                </div>
              )}
              
              {(screen.action_buttons || []).length >= 2 && (
                <div className="text-center py-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded">
                  Maximum 2 action buttons reached
                </div>
              )}
              
              <button
                onClick={addActionButton}
                disabled={(screen.action_buttons || []).length >= 2}
                className={`w-full py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                  (screen.action_buttons || []).length >= 2
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                }`}
                title={(screen.action_buttons || []).length >= 2 ? 'Maximum 2 action buttons allowed' : 'Add new action button'}
              >
                Add Button
              </button>
            </div>
          </div>

          {/* Header Backgrounds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Image size={16} className="text-blue-500" />
              Header Backgrounds
            </label>
            
            <div className="space-y-2">
              {Object.entries(screen.headerBackgroundUrl || {}).map(([key, bg]) => (
                <div key={key} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={bg.imageUrl}
                      onChange={(e) => updateHeaderBackground(key, { imageUrl: e.target.value })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Image URL"
                    />
                    <input
                      type="text"
                      value={bg.title}
                      onChange={(e) => updateHeaderBackground(key, { title: e.target.value })}
                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Title"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Key: {key}</span>
                    </div>
                    <button
                      onClick={() => removeHeaderBackground(key)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addHeaderBackground}
                className="w-full py-2 px-3 text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
              >
                Add Background
              </button>
            </div>
          </div>

          {/* Screen Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <Monitor size={16} className="text-blue-500" />
              Screen Preview
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 space-y-1">
              <div>Screen: <span className="font-medium">{screen.screen}</span></div>
              <div>Title: <span className="font-medium">{screen.screenTitle || 'Not set'}</span></div>
              <div>Balance Card: <span className="font-medium">{screen.balance_card ? 'ON' : 'OFF'}</span></div>
              {screen.balance_card && (
                <div>Variant: <span className="font-medium">{screen.balance_card_variant || 1}</span></div>
              )}
              <div>Action Buttons: <span className="font-medium">{(screen.action_buttons || []).length}/2</span></div>
              <div>Header Backgrounds: <span className="font-medium">{Object.keys(screen.headerBackgroundUrl || {}).length}</span></div>
              <div>Content Items: <span className="font-medium">{screen.content?.length || 0}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenConfigPanel;
