import React, { useState } from 'react';
import { ScreenConfig } from '../../types';
import { Plus, Trash2, Edit, Eye, EyeOff, Copy, Settings } from 'lucide-react';

interface ScreenEditorProps {
  screens: Record<string, ScreenConfig>;
  selectedScreen: string;
  onScreenChange: (screenName: string) => void;
  onUpdateScreens: (screens: Record<string, ScreenConfig>) => void;
}

const ScreenEditor: React.FC<ScreenEditorProps> = ({
  screens,
  selectedScreen,
  onScreenChange,
  onUpdateScreens
}) => {
  const [editingScreen, setEditingScreen] = useState<string | null>(null);
  const [newScreenName, setNewScreenName] = useState('');

  const addScreen = () => {
    if (!newScreenName.trim()) return;
    
    const screenName = newScreenName.trim();
    if (screens[screenName]) {
      alert('Screen name already exists!');
      return;
    }

    const newScreen: ScreenConfig = {
      screen: screenName,
      balance_card: false,
      balance_card_variant: 1,
      headerFade: true,
      content: []
    };

    const updatedScreens = { ...screens, [screenName]: newScreen };
    onUpdateScreens(updatedScreens);
    onScreenChange(screenName);
    setNewScreenName('');
  };

  const deleteScreen = (screenName: string) => {
    if (Object.keys(screens).length <= 1) {
      alert('Cannot delete the last screen!');
      return;
    }

    if (confirm(`Are you sure you want to delete the screen "${screenName}"?`)) {
      const updatedScreens = { ...screens };
      delete updatedScreens[screenName];
      onUpdateScreens(updatedScreens);
      
      if (selectedScreen === screenName) {
        const remainingScreens = Object.keys(updatedScreens);
        if (remainingScreens.length > 0) {
          onScreenChange(remainingScreens[0]);
        }
      }
    }
  };

  const duplicateScreen = (screenName: string) => {
    const originalScreen = screens[screenName];
    const newScreenName = `${screenName}_copy`;
    
    const duplicatedScreen: ScreenConfig = {
      ...originalScreen,
      screen: newScreenName,
      content: originalScreen.content.map(item => ({
        ...item,
        instanceId: `${item.id}_${Date.now()}_${Math.random()}`
      }))
    };

    const updatedScreens = { ...screens, [newScreenName]: duplicatedScreen };
    onUpdateScreens(updatedScreens);
    onScreenChange(newScreenName);
  };

  const updateScreen = (screenName: string, updates: Partial<ScreenConfig>) => {
    const updatedScreens = {
      ...screens,
      [screenName]: { ...screens[screenName], ...updates }
    };
    onUpdateScreens(updatedScreens);
  };

  const ScreenConfigEditor: React.FC<{ screenName: string; screen: ScreenConfig }> = ({ screenName, screen }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Screen: {screenName}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setEditingScreen(editingScreen === screenName ? null : screenName)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => duplicateScreen(screenName)}
            className="p-2 text-blue-500 hover:text-blue-700"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => deleteScreen(screenName)}
            className="p-2 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editingScreen === screenName && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Screen Title</label>
              <input
                type="text"
                value={screen.screenTitle || ''}
                onChange={(e) => updateScreen(screenName, { screenTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Screen Title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Carousel Height</label>
              <input
                type="number"
                value={screen.carouselHeight || 300}
                onChange={(e) => updateScreen(screenName, { carouselHeight: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="100"
                max="500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`balance_card_${screenName}`}
                checked={screen.balance_card || false}
                onChange={(e) => updateScreen(screenName, { balance_card: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`balance_card_${screenName}`} className="ml-2 text-sm text-gray-700">
                Show Balance Card
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`headerFade_${screenName}`}
                checked={screen.headerFade !== false}
                onChange={(e) => updateScreen(screenName, { headerFade: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`headerFade_${screenName}`} className="ml-2 text-sm text-gray-700">
                Header Fade
              </label>
            </div>
          </div>

          {screen.balance_card && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Balance Card Variant</label>
              <select
                value={screen.balance_card_variant || 1}
                onChange={(e) => updateScreen(screenName, { balance_card_variant: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6].map(variant => (
                  <option key={variant} value={variant}>Variant {variant}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Items</label>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">
                {screen.content.length} content items
              </div>
              <div className="mt-2 space-y-1">
                {screen.content.map((item, index) => (
                  <div key={item.instanceId} className="flex items-center justify-between bg-white px-2 py-1 rounded text-xs">
                    <span>{item.id} (Order: {item.order || index + 1})</span>
                    <span className="text-gray-500">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingScreen !== screenName && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Title:</span>
            <div className="font-medium">{screen.screenTitle || 'No title'}</div>
          </div>
          <div>
            <span className="text-gray-500">Balance Card:</span>
            <div className="font-medium">{screen.balance_card ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <span className="text-gray-500">Header Fade:</span>
            <div className="font-medium">{screen.headerFade !== false ? 'Yes' : 'No'}</div>
          </div>
          <div>
            <span className="text-gray-500">Content Items:</span>
            <div className="font-medium">{screen.content.length}</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Add New Screen */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Screen</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            value={newScreenName}
            onChange={(e) => setNewScreenName(e.target.value)}
            placeholder="Enter screen name (e.g., home, trending, profile)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyPress={(e) => e.key === 'Enter' && addScreen()}
          />
          <button
            onClick={addScreen}
            disabled={!newScreenName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Screen</span>
          </button>
        </div>
      </div>

      {/* Screen List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Screens ({Object.keys(screens).length})</h3>
        
        {Object.entries(screens).map(([screenName, screen]) => (
          <div
            key={screenName}
            className={`border rounded-lg transition-colors ${
              selectedScreen === screenName
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <ScreenConfigEditor screenName={screenName} screen={screen} />
          </div>
        ))}
      </div>

      {/* Screen Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Screen Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{Object.keys(screens).length}</div>
            <div className="text-sm text-gray-500">Total Screens</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(screens).filter(s => s.balance_card).length}
            </div>
            <div className="text-sm text-gray-500">With Balance Card</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Object.values(screens).reduce((total, screen) => total + screen.content.length, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Content Items</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => {
              const homeScreen = screens['home'];
              if (homeScreen) {
                onScreenChange('home');
              }
            }}
            disabled={!screens['home']}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Switch to Home Screen
          </button>
          <button
            onClick={() => {
              const firstScreen = Object.keys(screens)[0];
              if (firstScreen) {
                onScreenChange(firstScreen);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Switch to First Screen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenEditor;
