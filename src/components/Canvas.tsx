import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScreenConfig, ContentSection } from '../types';
import WidgetPreview from './WidgetPreview';
import { Copy, Trash2, GripVertical, X, CreditCard, Bell, HelpCircle, Settings, Image } from 'lucide-react';
import { ACTION_BUTTON_ICONS, getIconsByCategory, findIconByName, type ActionButtonIcon } from '../data/actionButtonIcons';
import { getActionButtonRoutesByCategory, findRouteByValue } from '../data/routeConfig';

interface CanvasProps {
  screen: ScreenConfig | undefined;
  selectedWidget: ContentSection | null;
  onWidgetSelect: (widget: ContentSection | null) => void;
  onUpdateWidget: (widgetId: string, updates: Partial<ContentSection>) => void;
  onDeleteWidget: (widgetId: string) => void;
  onDuplicateWidget: (widget: ContentSection) => void;
  onReorderWidgets: (newOrder: ContentSection[]) => void;
  onUpdateScreen?: (updates: Partial<ScreenConfig>) => void;
  showScreenConfig: boolean;
  onToggleScreenConfig: (show: boolean) => void;
  onDeleteScreen?: () => void;
}

// Sortable Widget Component
const SortableWidget: React.FC<{
  widget: ContentSection;
  isSelected: boolean;
  onSelect: (widget: ContentSection) => void;
  onDuplicate: (widget: ContentSection) => void;
  onDelete: (widgetId: string) => void;
}> = ({ widget, isSelected, onSelect, onDuplicate, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Widget Actions - Only show on hover/selection */}
      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => onDuplicate(widget)}
          className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
          title="Duplikat widget"
        >
          <Copy size={12} />
        </button>
        <button
          onClick={() => onDelete(widget.instanceId)}
          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          title="Hapus widget"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-grab active:cursor-grabbing"
      >
        <div className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center">
          <GripVertical size={12} />
        </div>
      </div>

      {/* Widget Preview */}
      <div
        onClick={() => onSelect(widget)}
        className="cursor-pointer"
      >
        <WidgetPreview
          widget={widget}
          isSelected={isSelected}
        />
      </div>
    </div>
  );
};

const Canvas: React.FC<CanvasProps> = ({
  screen,
  selectedWidget,
  onWidgetSelect,
  onUpdateWidget,
  onDeleteWidget,
  onDuplicateWidget,
  onReorderWidgets,
  onUpdateScreen,
  showScreenConfig,
  onToggleScreenConfig,
  onDeleteScreen,
}) => {

  

  
  // Helper functions for screen configuration
  const addActionButton = () => {
    if (!screen) return;
    const currentButtons = screen.action_buttons || [];
    if (currentButtons.length >= 2) {
      alert('Maximum 2 action buttons allowed');
      return;
    }
    
    const newButton = {
      icon: 'settings',
      route: '/pusat_bantuan',
      type: 'standard',
      tooltip: 'Help Center'
    };
    
    // Force a complete screen update to ensure React detects the change
    const updatedScreen = {
      ...screen,
      action_buttons: [...currentButtons, newButton]
    };
    onUpdateScreen?.(updatedScreen);
  };

  const removeActionButton = (index: number) => {
    if (!screen) return;
    const currentButtons = screen.action_buttons || [];
    const newButtons = currentButtons.filter((_, i) => i !== index);
    
    // Force a complete screen update to ensure React detects the change
    const updatedScreen = {
      ...screen,
      action_buttons: newButtons
    };
    onUpdateScreen?.(updatedScreen);
  };

  const updateActionButton = (index: number, updates: any) => {
    if (!screen) return;
    const currentButtons = screen.action_buttons || [];
    const newButtons = [...currentButtons];
    newButtons[index] = { ...newButtons[index], ...updates };
    
    // Force a complete screen update to ensure React detects the change
    const updatedScreen = {
      ...screen,
      action_buttons: newButtons
    };
    onUpdateScreen?.(updatedScreen);
  };

  const addHeaderBackground = () => {
    if (!screen) return;
    
    const newKey = 'bg_1';
    const newBackground = {
      imageUrl: '',
      title: '',
      route: ''
    };
    
    onUpdateScreen?.({
      headerBackgroundUrl: { [newKey]: newBackground }
    });
  };

  const removeHeaderBackground = (key: string) => {
    if (!screen) return;
    onUpdateScreen?.({ headerBackgroundUrl: {} });
  };

  const updateHeaderBackground = (key: string, updates: any) => {
    if (!screen) return;
    const currentBackgrounds = screen.headerBackgroundUrl || {};
    const newBackgrounds = { ...currentBackgrounds };
    newBackgrounds[key] = { ...newBackgrounds[key], ...updates };
    onUpdateScreen?.({ headerBackgroundUrl: newBackgrounds });
  };
  
  // Get widgets from screen content
  const widgets = screen?.content || [];
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex(w => w.instanceId === active.id);
      const newIndex = widgets.findIndex(w => w.instanceId === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(widgets, oldIndex, newIndex);
        onReorderWidgets(newOrder);
      }
    }
  };

  if (!screen) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Tidak Ada Layar Dipilih</h2>
          <p className="text-gray-500">Pilih layar dari sidebar untuk mulai mengedit</p>
        </div>
      </div>
    );
  }



  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      {/* Screen Configuration Panel - Full Canvas */}
      {showScreenConfig ? (
        <div className="h-full bg-white overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Screen Configuration</h2>
              <button
                onClick={() => onToggleScreenConfig(false)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close screen configuration and return to canvas"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Basic Settings */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Screen Title</label>
                    <input
                      type="text"
                      value={screen?.screenTitle || ''}
                      onChange={(e) => onUpdateScreen?.({ screenTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter screen title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Carousel Height</label>
                    <input
                      type="number"
                      value={screen?.carouselHeight || 300}
                      onChange={(e) => onUpdateScreen?.({ carouselHeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="100"
                      max="500"
                    />
                  </div>
                </div>
              </div>

              {/* Toggle Settings */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="balance_card"
                      checked={screen?.balance_card || false}
                      onChange={(e) => onUpdateScreen?.({ balance_card: e.target.checked })}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="balance_card" className="ml-3 text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CreditCard size={18} className="text-blue-500" />
                      Show Balance Card
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="headerFade"
                      checked={screen?.headerFade !== false}
                      onChange={(e) => onUpdateScreen?.({ headerFade: e.target.checked })}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="headerFade" className="ml-3 text-sm font-medium text-gray-700">
                      Header Fade Effect
                    </label>
                  </div>
                </div>

                {/* Balance Card Variant */}
                {screen?.balance_card && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Balance Card Variant</label>
                    <select
                      value={screen.balance_card_variant || 1}
                      onChange={(e) => onUpdateScreen?.({ balance_card_variant: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map(variant => (
                        <option key={variant} value={variant}>Variant {variant}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Bell size={18} className="text-blue-500" />
                  Action Buttons
                  <span className="text-sm font-normal text-gray-500 bg-white px-2 py-1 rounded-full">
                    {(screen?.action_buttons || []).length}/2
                  </span>
                </h3>
                
                <div className="space-y-4">
                  {(screen?.action_buttons || []).map((button, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                          <select
                            value={button.icon || ''}
                            onChange={(e) => updateActionButton(index, { icon: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select icon</option>
                            {Object.entries(getIconsByCategory()).map(([category, icons]) => (
                              <optgroup key={category} label={category}>
                                {icons.map((icon) => (
                                  <option key={icon.name} value={icon.name}>
                                    {icon.displayName}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Route</label>
                          <select
                            value={button.route || ''}
                            onChange={(e) => updateActionButton(index, { route: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                          >
                            <option value="">Select route</option>
                            {Object.entries(getActionButtonRoutesByCategory()).map(([category, routes]) => (
                              <optgroup key={category} label={category}>
                                {routes.map((route) => (
                                  <option key={route.value} value={route.value}>
                                    {route.label}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                          <select
                            value={button.type}
                            onChange={(e) => updateActionButton(index, { type: e.target.value as 'standard' | 'notification' | 'help' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="standard">Standard</option>
                            <option value="notification">Notification</option>
                            <option value="help">Help</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {button.type === 'notification' && <Bell size={14} className="text-blue-500" />}
                          {button.type === 'help' && <HelpCircle size={14} className="text-blue-500" />}
                          {button.type === 'standard' && <Settings size={14} className="text-gray-500" />}
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{button.type}</span>
                        </div>
                        <button
                          onClick={() => removeActionButton(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {(screen?.action_buttons || []).length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <Bell size={24} className="mx-auto mb-2 text-gray-400" />
                      <div className="text-sm">No action buttons configured</div>
                      <div className="text-xs text-gray-400 mt-1">Add up to 2 action buttons for quick access</div>
                    </div>
                  )}
                  

                  
                  <button
                    onClick={addActionButton}
                    disabled={(screen?.action_buttons || []).length >= 2}
                    className={`w-full py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
                      (screen?.action_buttons || []).length >= 2
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 hover:border-blue-300'
                    }`}
                    title={(screen?.action_buttons || []).length >= 2 ? 'Maximum 2 action buttons allowed' : 'Add new action button'}
                  >
                    Add Action Button
                  </button>
                </div>
              </div>

              {/* Header Background */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Image size={18} className="text-blue-500" />
                  Header Background
                </h3>
                
                <div className="space-y-4">
                  {Object.keys(screen?.headerBackgroundUrl || {}).length > 0 ? (
                    Object.entries(screen?.headerBackgroundUrl || {}).map(([key, bg]) => (
                    <div key={key} className="p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                          <input
                            type="text"
                            value={bg.imageUrl}
                            onChange={(e) => updateHeaderBackground(key, { imageUrl: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                          <input
                            type="text"
                            value={bg.title}
                            onChange={(e) => updateHeaderBackground(key, { title: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Background title"
                          />
                        </div>
                      </div>
                      
                      {/* Navigation Configuration */}
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-600 mb-2">Navigation Type</label>
                        <div className="grid grid-cols-3 gap-4">
                          {/* Display Only Option */}
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`nav-type-${key}`}
                              value="display"
                              checked={!bg.route && !bg.url}
                              onChange={() => {
                                updateHeaderBackground(key, { 
                                  route: undefined, 
                                  url: undefined 
                                });
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">Display Only</span>
                          </label>
                          
                          {/* Route Option */}
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`nav-type-${key}`}
                              value="route"
                              checked={!!bg.route}
                              onChange={() => {
                                if (!bg.route) {
                                  updateHeaderBackground(key, { 
                                    route: '/pusat_bantuan',
                                    url: undefined 
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">Internal Route</span>
                          </label>
                          
                          {/* External URL Option */}
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={`nav-type-${key}`}
                              value="url"
                              checked={!!bg.url}
                              onChange={() => {
                                if (!bg.url) {
                                  updateHeaderBackground(key, { 
                                    route: undefined, 
                                    url: 'https://example.com' 
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">External URL</span>
                          </label>
                        </div>
                        
                        {/* Route Dropdown - Shows below when route is selected */}
                        {bg.route && (
                          <div className="mt-3">
                            <select
                              value={bg.route}
                              onChange={(e) => updateHeaderBackground(key, { route: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                              <option value="/product">Product Lookup</option>
                              <option value="/webview">WebView</option>
                              {Object.entries(getActionButtonRoutesByCategory()).map(([category, routes]) => (
                                <optgroup key={category} label={category}>
                                  {routes.map((route) => (
                                    <option key={route.value} value={route.value}>
                                      {route.label}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        {/* URL Input - Shows below when URL is selected */}
                        {bg.url && (
                          <div className="mt-3">
                            <input
                              type="text"
                              value={bg.url}
                              onChange={(e) => updateHeaderBackground(key, { url: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="https://example.com"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Advanced Route Arguments */}
                      {bg.route === '/product' && (
                        <div className="mt-4">
                          <label className="block text-xs font-medium text-gray-600 mb-2">Product Route Arguments</label>
                          <div className="space-y-3 p-3 bg-gray-50 rounded border">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Operators</label>
                                <div className="space-y-2">
                                  {/* Tags Display */}
                                  {bg.routeArgs?.operators && bg.routeArgs.operators.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {bg.routeArgs.operators.map((operator: string, opIndex: number) => (
                                        <span
                                          key={opIndex}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                        >
                                          {operator}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newOperators = (bg.routeArgs?.operators || []).filter((_: string, i: number) => i !== opIndex);
                                              updateHeaderBackground(key, { 
                                                routeArgs: { 
                                                  ...bg.routeArgs, 
                                                  operators: newOperators.length > 0 ? newOperators : undefined 
                                                } 
                                              });
                                            }}
                                            className="text-blue-600 hover:text-blue-800 ml-1"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Input Field */}
                                  <input
                                    type="text"
                                    value={bg.routeArgs?.operatorInput || ''}
                                    onChange={(e) => {
                                      updateHeaderBackground(key, { 
                                        routeArgs: { 
                                          ...bg.routeArgs, 
                                          operatorInput: e.target.value 
                                        } 
                                      });
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === ' ' || e.key === 'Enter') {
                                        e.preventDefault();
                                        const inputValue = e.currentTarget.value.trim();
                                        if (inputValue) {
                                          const currentOperators = bg.routeArgs?.operators || [];
                                          if (!currentOperators.includes(inputValue)) {
                                            const newOperators = [...currentOperators, inputValue];
                                            updateHeaderBackground(key, { 
                                              routeArgs: { 
                                                ...bg.routeArgs, 
                                                operators: newOperators,
                                                operatorInput: ''
                                              } 
                                            });
                                          } else {
                                            // Clear input if operator already exists
                                            updateHeaderBackground(key, { 
                                              routeArgs: { 
                                                ...bg.routeArgs, 
                                                operatorInput: ''
                                              } 
                                            });
                                          }
                                        }
                                      }
                                    }}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Type operator and press space or enter..."
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Hint Text</label>
                                <input
                                  type="text"
                                  value={bg.routeArgs?.hintText || ''}
                                  onChange={(e) => updateHeaderBackground(key, { 
                                    routeArgs: { 
                                      ...bg.routeArgs, 
                                      hintText: e.target.value || undefined 
                                    } 
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Nomor HP Pelanggan"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Alphanumeric</label>
                                <select
                                  value={bg.routeArgs?.alphanumeric?.toString() || 'false'}
                                  onChange={(e) => updateHeaderBackground(key, { 
                                    routeArgs: { 
                                      ...bg.routeArgs, 
                                      alphanumeric: e.target.value === 'true' 
                                    } 
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="false">Numbers Only</option>
                                  <option value="true">Letters & Numbers</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Trailing Numbers</label>
                                <select
                                  value={bg.routeArgs?.trailingNumbers?.toString() || 'false'}
                                  onChange={(e) => updateHeaderBackground(key, { 
                                    routeArgs: { 
                                      ...bg.routeArgs, 
                                      trailingNumbers: e.target.value === 'true' 
                                    } 
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="false">Single Number</option>
                                  <option value="true">Number Range</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* WebView Arguments */}
                      {bg.route === '/webview' && (
                        <div className="mt-4">
                          <label className="block text-xs font-medium text-gray-600 mb-2">WebView Arguments</label>
                          <div className="space-y-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">WebView URL</label>
                                <input
                                  type="text"
                                  value={bg.routeArgs?.url || ''}
                                  onChange={(e) => updateHeaderBackground(key, { 
                                    routeArgs: { 
                                      ...bg.routeArgs, 
                                      url: e.target.value || undefined 
                                    } 
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="https://example.com/webview-content"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">WebView Title</label>
                                <input
                                  type="text"
                                  value={bg.routeArgs?.title || ''}
                                  onChange={(e) => updateHeaderBackground(key, { 
                                    routeArgs: { 
                                      ...bg.routeArgs, 
                                      title: e.target.value || undefined 
                                    } 
                                  })}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="WebView Content"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="checkbox-label text-xs">
                                <input
                                  type="checkbox"
                                  checked={bg.routeArgs?.includeAuth || false}
                                  onChange={(e) => updateHeaderBackground(key, { 
                                    routeArgs: { 
                                      ...bg.routeArgs, 
                                      includeAuth: e.target.checked 
                                    } 
                                  })}
                                  className="mr-2"
                                />
                                Include Authentication Headers
                              </label>
                              <div className="text-xs text-gray-500 mt-1 ml-6">
                                Automatically adds User-ID, Session-Key, Auth-Seed, and X-Token headers
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Custom Headers (JSON)</label>
                              <textarea
                                value={bg.routeArgs?.headers ? JSON.stringify(bg.routeArgs.headers, null, 2) : ''}
                                onChange={(e) => {
                                  try {
                                    const headers = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                                    updateHeaderBackground(key, { 
                                      routeArgs: { 
                                        ...bg.routeArgs,
                                        headers
                                      } 
                                    });
                                  } catch (error) {
                                    // Don't update if JSON is invalid
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder='{"Custom-Header": "value123", "x-token": "1234"}'
                                rows={3}
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                Add custom HTTP headers for the WebView request
                              </div>
                            </div>
                            <div className="pt-2 border-t border-blue-200">
                              <div className="text-xs font-medium text-blue-700 mb-2">Payment Setup (Optional)</div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Product Code</label>
                                  <input
                                    type="text"
                                    value={bg.routeArgs?.productKode || ''}
                                    onChange={(e) => updateHeaderBackground(key, { 
                                      routeArgs: { 
                                        ...bg.routeArgs, 
                                        productKode: e.target.value || undefined 
                                      } 
                                    })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="TDOMQ"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 mb-1">Operator</label>
                                  <input
                                    type="text"
                                    value={bg.routeArgs?.operator || ''}
                                    onChange={(e) => updateHeaderBackground(key, { 
                                      routeArgs: { 
                                        ...bg.routeArgs, 
                                        operator: e.target.value || undefined 
                                      } 
                                    })}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="TDOMQ"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Single Background</span>
                        </div>
                        <button
                          onClick={() => removeHeaderBackground(key)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <Image size={24} className="mx-auto mb-2 text-gray-400" />
                      <div className="text-sm">No header background configured</div>
                      <div className="text-xs text-gray-400 mt-1">Add one background image for the header</div>
                    </div>
                  )}
                  
                  {Object.keys(screen?.headerBackgroundUrl || {}).length === 0 && (
                    <button
                      onClick={addHeaderBackground}
                      className="w-full py-3 px-4 text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
                    >
                      Add Header Background
                    </button>
                  )}
                </div>
              </div>

              {/* Content Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Summary</h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">{screen?.content.length || 0}</span> content items configured
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {screen?.content.map((item, index) => (
                      <div key={item.instanceId} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                        <span className="font-medium">{item.id}</span>
                        <span className="text-gray-500 bg-white px-2 py-1 rounded text-xs">#{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Screen Preview */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Screen Configuration Preview</h3>
                <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Screen Title:</span>
                        <span className="font-medium">{screen?.screenTitle || 'Not set'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Balance Card:</span>
                        <span className={`font-medium ${screen?.balance_card ? 'text-green-600' : 'text-red-600'}`}>
                          {screen?.balance_card ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {screen?.balance_card && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Variant:</span>
                          <span className="font-medium">{screen.balance_card_variant || 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Action Buttons:</span>
                        <span className="font-medium">
                          {screen?.action_buttons?.length || 0}/2
                          {screen?.action_buttons?.length === 2 && (
                            <span className="text-blue-600 ml-1">(Max)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Header Backgrounds:</span>
                        <span className="font-medium">{Object.keys(screen?.headerBackgroundUrl || {}).length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Carousel Height:</span>
                        <span className="font-medium">{screen?.carouselHeight || 300}px</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Header Fade:</span>
                        <span className={`font-medium ${screen?.headerFade !== false ? 'text-green-600' : 'text-blue-600'}`}>
                          {screen?.headerFade !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Screen Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    if (confirm('Delete this screen?')) {
                      onDeleteScreen?.();
                    }
                  }}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Screen
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Canvas Content - Only show when screen config is closed */
        <div className="h-full overflow-auto p-6">
        {widgets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Kanvas Kosong</h3>
            <p className="text-gray-500 mb-3">Mulai membangun layar Anda dengan menambahkan widget</p>
            <div className="text-sm text-gray-400">
              Gunakan tombol "Tambah Widget" di sidebar untuk memulai
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={widgets.map(w => w.instanceId)}
              strategy={verticalListSortingStrategy}
            >
              {/* Compact Mobile-Style Content */}
              <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-4">
                <div className="space-y-3">
                  {widgets.map((widget) => (
                    <SortableWidget
                      key={widget.instanceId}
                      widget={widget}
                      isSelected={selectedWidget?.instanceId === widget.instanceId}
                      onSelect={onWidgetSelect}
                      onDuplicate={onDuplicateWidget}
                      onDelete={onDeleteWidget}
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      )}


    </div>
  );
};

export default Canvas;
