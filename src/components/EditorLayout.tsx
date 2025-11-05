import React, { useState, useEffect } from 'react';
import { DynamicScreenConfig, ContentSection, NavigationConfig, GlobalTheming, MenuItem, ScreenConfig } from '../types';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import GlobalConfigEditor from './editors/GlobalConfigEditor';
import NavigationEditor from './editors/NavigationEditor';
import { WIDGET_TYPES } from '../data/widgetTypes';
import { Settings, Navigation, Monitor, Menu, X } from 'lucide-react';

interface EditorLayoutProps {
  config: DynamicScreenConfig;
  selectedScreen: string;
  onConfigChange: (config: DynamicScreenConfig) => void;
  onScreenChange: (screenName: string) => void;
  onImportJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExportJSON: () => void;
}

type EditorTab = 'canvas' | 'global' | 'navigation';

const EditorLayout: React.FC<EditorLayoutProps> = ({
  config,
  selectedScreen,
  onConfigChange,
  onScreenChange,
}) => {
  const [selectedWidget, setSelectedWidget] = useState<ContentSection | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('canvas');
  const [showScreenConfig, setShowScreenConfig] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint for editor
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Auto-hide sidebar on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedWidget) {
        setSelectedWidget(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWidget]);

  const handleAddWidget = (widgetType: string) => {
    const widgetTypeData = WIDGET_TYPES.find(w => w.id === widgetType);
    if (!widgetTypeData) return;

    // Generate unique instanceId for this specific widget instance
    const instanceId = `${widgetType}_${Date.now()}`;
    
    // Keep the semantic id for widget type identification
    const widgetId = widgetType;

    const newWidget: ContentSection = {
      ...widgetTypeData.defaultConfig,
      id: widgetId, // Widget type (e.g., "title", "banner_slider")
      instanceId: instanceId, // Unique instance identifier
    } as ContentSection;

    const updatedConfig = { ...config };
    if (!updatedConfig.screens[selectedScreen]) {
      updatedConfig.screens[selectedScreen] = {
        screen: selectedScreen,
        content: [],
      };
    }
    
    updatedConfig.screens[selectedScreen].content = [
      ...(updatedConfig.screens[selectedScreen].content || []),
      newWidget,
    ];

    onConfigChange(updatedConfig);
    setSelectedWidget(newWidget);
  };

  const handleUpdateWidget = (widgetId: string, updates: Partial<ContentSection>) => {
    console.log('EditorLayout: handleUpdateWidget called:', { widgetId, updates });
    
    const updatedConfig = { ...config };
    const screen = updatedConfig.screens[selectedScreen];
    if (!screen) return;

    // Find widget by instanceId for unique identification
    const widgetIndex = screen.content.findIndex(w => w.instanceId === widgetId);
    if (widgetIndex === -1) return;

    screen.content[widgetIndex] = { ...screen.content[widgetIndex], ...updates };
    console.log('EditorLayout: Updated widget:', screen.content[widgetIndex]);
    
    onConfigChange(updatedConfig);
    
    if (selectedWidget?.instanceId === widgetId) {
      setSelectedWidget(screen.content[widgetIndex]);
    }
  };

  const handleDeleteWidget = (widgetId: string) => {
    const updatedConfig = { ...config };
    const screen = updatedConfig.screens[selectedScreen];
    if (!screen) return;

    // Delete widget by instanceId
    screen.content = screen.content.filter(w => w.instanceId !== widgetId);
    
    onConfigChange(updatedConfig);
    
    if (selectedWidget?.instanceId === widgetId) {
      setSelectedWidget(null);
    }
  };

  const handleReorderWidgets = (newOrder: ContentSection[]) => {
    const updatedConfig = { ...config };
    const screen = updatedConfig.screens[selectedScreen];
    if (!screen) return;

    screen.content = newOrder;
    onConfigChange(updatedConfig);
  };

  const handleDuplicateWidget = (widget: ContentSection) => {
    const duplicatedWidget: ContentSection = {
      ...widget,
      instanceId: `${widget.id}_copy_${Date.now()}`, // New unique instanceId
    };

    const updatedConfig = { ...config };
    if (!updatedConfig.screens[selectedScreen]) {
      updatedConfig.screens[selectedScreen] = {
        screen: selectedScreen,
        content: [],
      };
    }
    
    updatedConfig.screens[selectedScreen].content = [
      ...(updatedConfig.screens[selectedScreen].content || []),
      duplicatedWidget,
    ];

    onConfigChange(updatedConfig);
    setSelectedWidget(duplicatedWidget);
  };

  // Extract menu items from all content sections across all screens
  const extractMenuItems = (): MenuItem[] => {
    const menuItems: MenuItem[] = [];
    
    Object.values(config.screens).forEach(screen => {
      screen.content?.forEach(contentSection => {
        if (contentSection.items && Array.isArray(contentSection.items)) {
          // Recursively extract menu items including submenu items
          const extractItems = (items: MenuItem[]): void => {
            items.forEach(item => {
              // Include items that have either menu_id or route
              if (item.menu_id || item.route) {
                // If no menu_id exists, generate one based on title and route
                const menuItem: MenuItem = {
                  ...item,
                  menu_id: item.menu_id || `${item.title?.toLowerCase().replace(/\s+/g, '_')}_${item.route?.replace('/', '')}_${Date.now()}`
                };
                menuItems.push(menuItem);
              }
              if (item.submenu?.items) {
                extractItems(item.submenu.items);
              }
            });
          };
          extractItems(contentSection.items);
        }
      });
    });
    
    return menuItems;
  };

  const handleUpdateGlobalConfig = (globalConfig: GlobalTheming) => {
    const updatedConfig = { ...config, globalTheming: globalConfig };
    onConfigChange(updatedConfig);
  };

  const handleUpdateNavigation = (navigation: NavigationConfig) => {
    const updatedConfig = { ...config, navigation };
    onConfigChange(updatedConfig);
  };

  const handleUpdateScreen = (updates: Partial<ScreenConfig>) => {
    const updatedConfig = { ...config };
    const screen = updatedConfig.screens[selectedScreen];
    if (!screen) return;

    // Create a completely new screen object to ensure React detects the change
    const updatedScreen = { ...screen, ...updates };
    updatedConfig.screens[selectedScreen] = updatedScreen;
    onConfigChange(updatedConfig);
  };

  const handleDeleteScreen = () => {
    if (!currentScreen) return;
    
    if (confirm(`Are you sure you want to delete the screen "${currentScreen.screen}"? This action cannot be undone.`)) {
      const updatedConfig = { ...config };
      delete updatedConfig.screens[currentScreen.screen];
      
      onConfigChange(updatedConfig);
      
      // Reset to first available screen or show empty state
      const remainingScreens = Object.keys(updatedConfig.screens);
      if (remainingScreens.length > 0) {
        onScreenChange(remainingScreens[0]);
      } else {
        onScreenChange('');
      }
      
      // Close screen configuration
      setShowScreenConfig(false);
    }
  };

  const currentScreen = config.screens[selectedScreen];
  const availableScreens = Object.keys(config.screens);

  const tabs = [
    {
      id: 'canvas' as EditorTab,
      name: 'Canvas',
      icon: <Monitor className="h-4 w-4" />,
      description: 'Visual screen editor'
    },

    {
      id: 'global' as EditorTab,
      name: 'Global Config',
      icon: <Settings className="h-4 w-4" />,
      description: 'Global theming and settings'
    },
    {
      id: 'navigation' as EditorTab,
      name: 'Navigation',
      icon: <Navigation className="h-4 w-4" />,
      description: 'Menu and navigation setup'
    },
  
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'canvas':
        return (
          <div className="flex h-full">
            <Canvas
              screen={currentScreen}
              selectedWidget={selectedWidget}
              onWidgetSelect={setSelectedWidget}
              onUpdateWidget={handleUpdateWidget}
              onDeleteWidget={handleDeleteWidget}
              onDuplicateWidget={handleDuplicateWidget}
              onReorderWidgets={handleReorderWidgets}
              onUpdateScreen={handleUpdateScreen}
              showScreenConfig={showScreenConfig}
              onToggleScreenConfig={setShowScreenConfig}
              onDeleteScreen={handleDeleteScreen}
            />
            {/* Show PropertyPanel when screen configuration is not active and widget is selected */}
            {!showScreenConfig && selectedWidget && (
              <>
                {/* Desktop PropertyPanel */}
                {!isMobile && (
                  <PropertyPanel
                    widget={selectedWidget}
                    onUpdateWidget={handleUpdateWidget}
                    screen={currentScreen}
                  />
                )}
                
                {/* Mobile PropertyPanel - Slide up modal */}
                {isMobile && (
                  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
                    <div className="bg-white w-full max-h-[80vh] rounded-t-lg shadow-lg">
                      <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Widget Properties</h3>
                        <button
                          onClick={() => setSelectedWidget(null)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                        <PropertyPanel
                          widget={selectedWidget}
                          onUpdateWidget={handleUpdateWidget}
                          screen={currentScreen}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      

      
      case 'global':
        return (
          <GlobalConfigEditor
            globalConfig={config.globalTheming}
            onUpdate={handleUpdateGlobalConfig}
            menuItems={extractMenuItems()}
          />
        );
      
      case 'navigation':
        return (
          <NavigationEditor
            navigation={config.navigation}
            onUpdate={handleUpdateNavigation}
            availableScreens={availableScreens}
            staticScreenNames={[
              'all_senders_screen',
              'deposit_history_screen',
              'downline_list',
              'mutasi',
              'history',
              'profile_screen',
              'profile',
            ]}
          />
        );
      
      
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Slim Top Tab Bar (spans full editor) */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4 px-3">
          {/* Mobile menu button for canvas tab */}
          {isMobile && activeTab === 'canvas' && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 py-2 px-1.5 border-b-2 font-medium text-xs transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && activeTab === 'canvas' && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Editor Body: Sidebar + Content below the tab bar */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Only show for canvas tab */}
        {activeTab === 'canvas' && (
          <div
            className={`${
              isMobile 
                ? `fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                  }`
                : 'flex-shrink-0'
            }`}
          >
            <Sidebar
              config={config}
              selectedScreen={selectedScreen}
              availableScreens={availableScreens}
              onScreenChange={onScreenChange}
              onAddWidgetType={handleAddWidget}
              onOpenScreenConfig={() => setShowScreenConfig(true)}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* Tab Content */}
        <div className={`flex-1 overflow-hidden ${isMobile && activeTab === 'canvas' ? 'ml-0' : ''}`}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default EditorLayout;
