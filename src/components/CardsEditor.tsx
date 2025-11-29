import React, { useState, useEffect, useRef } from 'react';
import { ContentSection, Card, CardButton, CardTextElement, MenuItem } from '../types';
import { Plus, Trash2, ChevronDown, ChevronRight, Save, AlertTriangle, Copy, Upload, Image as ImageIcon, X } from 'lucide-react';
import { getRoutesByCategory, getDefaultArgsForRoute } from '../data/routeConfig';
import RouteArgsConfig from './RouteArgsConfig';
import RouteArgsEditor from './RouteArgsEditor';
import AssetsManager from './AssetsManager';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface CardsEditorProps {
  widget: ContentSection;
  onSave: (updates: Partial<ContentSection>) => void;
  onClose: () => void;
  menuItems?: MenuItem[]; // Available menu items for cloning
  authSeed?: string;
}

const CardsEditor: React.FC<CardsEditorProps> = ({ widget, onSave, onClose, menuItems = [], authSeed = '' }) => {
  const [localWidget, setLocalWidget] = useState<ContentSection>(widget);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set()); // Start with all collapsed
  const [cardColors, setCardColors] = useState<string[]>([]);
  const [navigationTypes, setNavigationTypes] = useState<Record<number, 'none' | 'internal' | 'external' | 'clone'>>({});
  
  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | null>(null);
  const originalWidgetRef = useRef<ContentSection>(widget);

  // Asset picker/uploader state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetsRefreshTrigger, setAssetsRefreshTrigger] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Get routes grouped by category for the select dropdown
  const routesByCategory = getRoutesByCategory();

  // Generate random colors for cards
  useEffect(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    setCardColors(shuffledColors);
  }, []);

  // Initialize navigation types when cards change
  useEffect(() => {
    if (localWidget.cards) {
      const initialNavTypes: Record<number, 'none' | 'internal' | 'external' | 'clone'> = {};
      localWidget.cards.forEach((card, index) => {
        if (card.route) {
          if (card.url) {
            initialNavTypes[index] = 'external';
          } else {
            initialNavTypes[index] = 'internal';
          }
        } else {
          initialNavTypes[index] = 'none';
        }
      });
      setNavigationTypes(initialNavTypes);
    }
  }, [localWidget.cards]);

  // Check for unsaved changes
  const updateLocalWidget = (updates: Partial<ContentSection>) => {
    const updated = { ...localWidget, ...updates };
    setLocalWidget(updated);
    
    // Check if there are changes
    const hasChanges = JSON.stringify(updated) !== JSON.stringify(originalWidgetRef.current);
    setHasUnsavedChanges(hasChanges);
  };

  // Update card
  const updateCard = (index: number, updates: Partial<Card>) => {
    const updatedCards = [...(localWidget.cards || [])];
    updatedCards[index] = { ...updatedCards[index], ...updates };
    updateLocalWidget({ cards: updatedCards });
  };

  // Add new card
  const addCard = () => {
    const newCard: Card = {
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      backgroundColor: '#f3f4f6',
      borderRadius: 12,
      buttons: [],
      textElements: []
    };
    
    const updatedCards = [...(localWidget.cards || []), newCard];
    updateLocalWidget({ cards: updatedCards });
  };

  // Remove card
  const removeCard = (index: number) => {
    const updatedCards = [...(localWidget.cards || [])];
    updatedCards.splice(index, 1);
    updateLocalWidget({ cards: updatedCards });
  };

  // Duplicate card
  const duplicateCard = (index: number) => {
    const cards = localWidget.cards || [];
    const cardToDuplicate = cards[index];
    
    const duplicatedCard: Card = {
      ...cardToDuplicate,
      title: cardToDuplicate.title ? `${cardToDuplicate.title} (Copy)` : undefined,
      subtitle: cardToDuplicate.subtitle ? `${cardToDuplicate.subtitle} (Copy)` : undefined,
    };
    
    const updatedCards = [...cards];
    updatedCards.splice(index + 1, 0, duplicatedCard);
    updateLocalWidget({ cards: updatedCards });
  };

  // Toggle card expansion
  const toggleCardExpansion = (index: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Handle navigation type change
  const handleNavigationTypeChange = (index: number, type: 'none' | 'internal' | 'external' | 'clone') => {
    setNavigationTypes(prev => ({ ...prev, [index]: type }));
    
    if (type === 'none') {
      updateCard(index, { route: undefined, url: undefined, routeArgs: undefined });
    } else if (type === 'internal') {
      updateCard(index, { route: '/home', url: undefined, routeArgs: {} });
    } else if (type === 'external') {
      updateCard(index, { route: undefined, url: 'https://', routeArgs: undefined });
    } else if (type === 'clone') {
      updateCard(index, { route: undefined, url: undefined, routeArgs: undefined });
    }
  };

  // Handle clone selection
  const handleCloneChange = (index: number, menuId: string) => {
    const menuItem = menuItems.find(item => item.menu_id === menuId);
    if (menuItem) {
      updateCard(index, {
        title: menuItem.title,
        route: menuItem.route,
        routeArgs: menuItem.routeArgs,
        url: menuItem.url,
        clonedFromMenuId: menuId
      });
    }
  };

  // Handle file upload for background image
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, cardIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        console.error('Session key not found');
        return;
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
      
      if (data.success) {
        let filename = null;
        let publicUrl = null;
        
        if (data.filename) {
          filename = data.filename;
        } else if (data.asset?.filename) {
          filename = data.asset.filename;
        } else if (data.file_url) {
          const urlParts = data.file_url.split('/');
          filename = urlParts[urlParts.length - 1];
        }
        
        if (data.public_url) {
          publicUrl = data.public_url;
        } else if (data.asset?.public_url) {
          publicUrl = data.asset.public_url;
        } else if (data.file_url) {
          publicUrl = data.file_url;
        }
        
        if (publicUrl && publicUrl.startsWith('/')) {
          const baseUrl = await getApiUrl('');
          publicUrl = `${baseUrl}${publicUrl}`;
        }
        
        if (!publicUrl && filename) {
          const baseUrl = await getApiUrl('');
          publicUrl = `${baseUrl}/assets/${filename.replace(/^\/assets\//, '').replace(/^\//, '')}`;
        }
        
        if (publicUrl) {
          updateCard(cardIndex, { backgroundImage: publicUrl });
          setAssetsRefreshTrigger(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }

    // Clear the file input
    if (fileInputRefs.current[cardIndex]) {
      fileInputRefs.current[cardIndex].value = '';
    }
  };

  // Handle asset selection
  const handleAssetSelect = (url: string) => {
    if (url && currentCardIndex !== null) {
      updateCard(currentCardIndex, { backgroundImage: url });
      setShowAssetPicker(false);
      setCurrentCardIndex(null);
    }
  };

  // Add button to card
  const addButtonToCard = (cardIndex: number) => {
    const card = localWidget.cards?.[cardIndex];
    if (!card) return;
    
    const newButton: CardButton = {
      label: 'Button',
      route: '/home',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: 8
    };
    
    updateCard(cardIndex, {
      buttons: [...(card.buttons || []), newButton]
    });
  };

  // Update button in card
  const updateButtonInCard = (cardIndex: number, buttonIndex: number, updates: Partial<CardButton>) => {
    const card = localWidget.cards?.[cardIndex];
    if (!card) return;
    
    const updatedButtons = [...(card.buttons || [])];
    updatedButtons[buttonIndex] = { ...updatedButtons[buttonIndex], ...updates };
    updateCard(cardIndex, { buttons: updatedButtons });
  };

  // Remove button from card
  const removeButtonFromCard = (cardIndex: number, buttonIndex: number) => {
    const card = localWidget.cards?.[cardIndex];
    if (!card) return;
    
    const updatedButtons = [...(card.buttons || [])];
    updatedButtons.splice(buttonIndex, 1);
    updateCard(cardIndex, { buttons: updatedButtons });
  };

  // Add text element to card
  const addTextElementToCard = (cardIndex: number) => {
    const card = localWidget.cards?.[cardIndex];
    if (!card) return;
    
    const newTextElement: CardTextElement = {
      type: 'label',
      text: 'Text Element'
    };
    
    updateCard(cardIndex, {
      textElements: [...(card.textElements || []), newTextElement]
    });
  };

  // Update text element in card
  const updateTextElementInCard = (cardIndex: number, elementIndex: number, updates: Partial<CardTextElement>) => {
    const card = localWidget.cards?.[cardIndex];
    if (!card) return;
    
    const updatedElements = [...(card.textElements || [])];
    updatedElements[elementIndex] = { ...updatedElements[elementIndex], ...updates };
    updateCard(cardIndex, { textElements: updatedElements });
  };

  // Remove text element from card
  const removeTextElementFromCard = (cardIndex: number, elementIndex: number) => {
    const card = localWidget.cards?.[cardIndex];
    if (!card) return;
    
    const updatedElements = [...(card.textElements || [])];
    updatedElements.splice(elementIndex, 1);
    updateCard(cardIndex, { textElements: updatedElements });
  };

  // Get card color
  const getCardColor = (index: number) => {
    return cardColors[index % cardColors.length] || '#E5E7EB';
  };

  // Save changes
  const saveChanges = () => {
    onSave(localWidget);
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

  // Render card content
  const renderCardContent = (card: Card, index: number) => {
    const isExpanded = expandedCards.has(index);
    const navType = navigationTypes[index] || 'none';
    const isInExternalMode = navType === 'external';

    return (
      <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Card Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ backgroundColor: getCardColor(index) + '20' }}
          onClick={() => toggleCardExpansion(index)}
        >
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCardColor(index) }}></div>
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="font-medium text-gray-800">Card {index + 1}</span>
            {card.title && (
              <span className="text-sm text-gray-600"> - {card.title}</span>
            )}
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
              {isInExternalMode ? 'External' : navType === 'none' ? 'None' : 'Internal'}
            </span>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateCard(index);
              }}
              className="p-1 text-gray-500 hover:text-purple-600 rounded"
              title="Duplicate card"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeCard(index);
              }}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
              title="Delete card"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Card Content */}
        {isExpanded && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            {/* Basic Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={card.title || ''}
                  onChange={(e) => updateCard(index, { title: e.target.value })}
                  placeholder="Card Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={card.subtitle || ''}
                  onChange={(e) => updateCard(index, { subtitle: e.target.value })}
                  placeholder="Card Subtitle"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={card.description || ''}
                  onChange={(e) => updateCard(index, { description: e.target.value })}
                  placeholder="Card Description"
                  rows={3}
                />
              </div>
            </div>

            {/* Navigation Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Navigation Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={navType}
                  onChange={(e) => handleNavigationTypeChange(index, e.target.value as any)}
                >
                  <option value="none">None</option>
                  <option value="internal">Internal Route</option>
                  <option value="external">External URL</option>
                  <option value="clone">Clone from Menu</option>
                </select>
              </div>
              
              {navType === 'clone' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clone from Menu</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={card.clonedFromMenuId || ''}
                    onChange={(e) => handleCloneChange(index, e.target.value)}
                  >
                    <option value="">Select menu item</option>
                    {menuItems.map((item) => (
                      <option key={item.menu_id} value={item.menu_id || item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(navType === 'internal' || navType === 'external') && (
                <RouteArgsEditor
                  route={card.route}
                  url={card.url}
                  routeArgs={card.routeArgs}
                  onChange={(config) => updateCard(index, {
                    route: config.route,
                    url: config.url,
                    routeArgs: config.routeArgs
                  })}
                  showValidation={true}
                  allowUrlMode={navType === 'external'}
                  allowRouteMode={navType === 'internal'}
                />
              )}
            </div>

            {/* Background Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={card.backgroundImage || ''}
                    onChange={(e) => updateCard(index, { backgroundImage: e.target.value })}
                    placeholder="Image URL"
                  />
                  <input
                    ref={(el) => fileInputRefs.current[index] = el}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, index)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                    title="Upload image"
                  >
                    <Upload size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentCardIndex(index);
                      setShowAssetPicker(true);
                    }}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                    title="Select from assets"
                  >
                    <ImageIcon size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <input
                  type="color"
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  value={card.backgroundColor || '#f3f4f6'}
                  onChange={(e) => updateCard(index, { backgroundColor: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={card.borderRadius || 12}
                  onChange={(e) => updateCard(index, { borderRadius: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="50"
                />
              </div>
            </div>

            {/* Text Elements */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Text Elements</label>
                <button
                  type="button"
                  onClick={() => addTextElementToCard(index)}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Text Element
                </button>
              </div>
              
              <div className="space-y-2">
                {card.textElements?.map((element, elementIndex) => (
                  <div key={elementIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <select
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={element.type}
                        onChange={(e) => updateTextElementInCard(index, elementIndex, { type: e.target.value as any })}
                      >
                        <option value="label">Label</option>
                        <option value="profile_name">Profile Name</option>
                        <option value="balance">Balance</option>
                        <option value="commission">Commission</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeTextElementFromCard(index, elementIndex)}
                        className="p-1 text-red-500 hover:text-red-700 rounded"
                        title="Remove text element"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={element.text}
                      onChange={(e) => updateTextElementInCard(index, elementIndex, { text: e.target.value })}
                      placeholder="Text content"
                    />
                    
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                        <input
                          type="number"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={element.textStyle?.fontSize || 14}
                          onChange={(e) => updateTextElementInCard(index, elementIndex, {
                            textStyle: {
                              ...element.textStyle,
                              fontSize: parseInt(e.target.value) || 14
                            }
                          })}
                          min="10"
                          max="24"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Font Weight</label>
                        <select
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={element.textStyle?.fontWeight || 'normal'}
                          onChange={(e) => updateTextElementInCard(index, elementIndex, {
                            textStyle: {
                              ...element.textStyle,
                              fontWeight: e.target.value
                            }
                          })}
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                          <option value="w500">Medium</option>
                          <option value="w600">Semibold</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                          value={element.textStyle?.color || '#000000'}
                          onChange={(e) => updateTextElementInCard(index, elementIndex, {
                            textStyle: {
                              ...element.textStyle,
                              color: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Buttons</label>
                <button
                  type="button"
                  onClick={() => addButtonToCard(index)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Button
                </button>
              </div>
              
              <div className="space-y-2">
                {card.buttons?.map((button, buttonIndex) => (
                  <div key={buttonIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
                        <input
                          type="text"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={button.label}
                          onChange={(e) => updateButtonInCard(index, buttonIndex, { label: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                        <input
                          type="color"
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                          value={button.backgroundColor || '#3b82f6'}
                          onChange={(e) => updateButtonInCard(index, buttonIndex, { backgroundColor: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Text</label>
                        <input
                          type="color"
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                          value={button.textColor || '#ffffff'}
                          onChange={(e) => updateButtonInCard(index, buttonIndex, { textColor: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <RouteArgsEditor
                          route={button.route}
                          url={button.url}
                          routeArgs={button.routeArgs}
                          onChange={(config) => updateButtonInCard(index, buttonIndex, {
                            route: config.route,
                            url: config.url,
                            routeArgs: config.routeArgs
                          })}
                          showValidation={false}
                          allowUrlMode={true}
                          allowRouteMode={true}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeButtonFromCard(index, buttonIndex)}
                        className="p-1 text-red-500 hover:text-red-700 rounded"
                        title="Remove button"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Cards Editor</h2>
            <p className="text-xs text-gray-600">Configure customizable cards widget</p>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                <AlertTriangle size={12} />
                <span>You have unsaved changes</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={saveChanges}
              className={`px-6 py-2 rounded-lg transition-colors ${
                hasUnsavedChanges 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Save size={16} className="inline mr-2" />
              {hasUnsavedChanges ? 'Save Changes*' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Widget Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Widget Settings</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={localWidget.layout || 'grid'}
                  onChange={(e) => updateLocalWidget({ layout: e.target.value as any })}
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
              
              {localWidget.layout === 'grid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cross Axis Count</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={localWidget.crossAxisCount || 2}
                    onChange={(e) => updateLocalWidget({ crossAxisCount: parseInt(e.target.value) || 2 })}
                    min="1"
                    max="4"
                  />
                </div>
              )}
              
              {localWidget.layout === 'grid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={localWidget.aspectRatio || 1.6}
                    onChange={(e) => updateLocalWidget({ aspectRatio: parseFloat(e.target.value) || 1.6 })}
                    min="0.5"
                    max="3"
                    step="0.1"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spacing</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={localWidget.spacing || 16}
                  onChange={(e) => updateLocalWidget({ spacing: parseInt(e.target.value) || 16 })}
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>

          {/* Add Card Button */}
          <div className="mb-4">
            <button
              onClick={addCard}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus size={16} />
              Add Card
            </button>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            {localWidget.cards?.map((card, index) => renderCardContent(card, index))}
          </div>

          {(!localWidget.cards || localWidget.cards.length === 0) && (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-4xl mb-4">🃏</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Cards</h3>
              <p className="text-sm text-gray-500 mb-4">Add cards to create your customizable widget</p>
              <button
                onClick={addCard}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mx-auto"
              >
                <Plus size={16} />
                Add First Card
              </button>
            </div>
          )}
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
                <h3 className="text-lg font-semibold text-gray-800">Unsaved Changes</h3>
                <p className="text-sm text-gray-600">You have unsaved changes that will be lost.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to close the editor? All unsaved changes will be discarded.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={cancelAction}
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Continue Editing
              </button>
              <button
                onClick={confirmAction}
                className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Picker Modal */}
      {showAssetPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Select or Upload Asset</h3>
              <button
                onClick={() => setShowAssetPicker(false)}
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
                  <strong>Hint:</strong> Click directly on an image to select and automatically apply it to the background image field.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardsEditor;
