import React, { useState } from 'react';
import { MenuItem, ActionButton, Banner, NavigationItem } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';
import NavigationButton from './NavigationButton';
import MenuItemComponent from './MenuItemComponent';
import BannerComponent from './BannerComponent';
import ActionButtonComponent from './ActionButtonComponent';
import NavigationItemComponent from './NavigationItemComponent';
import RouteArgsEditor from './RouteArgsEditor';

/**
 * Example component demonstrating the centralized navigation system
 * This shows how all navigation components work together with consistent route arguments
 */
const NavigationSystemExample: React.FC = () => {
  const [showValidationErrors, setShowValidationErrors] = useState(true);
  const [navigationErrors, setNavigationErrors] = useState<string[]>([]);

  // Example menu items with different navigation types
  const exampleMenuItems: MenuItem[] = [
    {
      menu_id: 'menu_pulsa',
      iconUrl: '📱',
      title: 'Pulsa',
      textSize: 12,
      route: '/product',
      routeArgs: RouteArgsManager.createProductArgs({
        operators: ['TSELREG', 'INDOSAT'],
        hintText: 'Nomor HP Pelanggan',
        alphanumeric: false,
        trailingNumbers: false
      })
    },
    {
      menu_id: 'menu_webview',
      iconUrl: '🌐',
      title: 'WebView',
      textSize: 12,
      route: '/webview',
      routeArgs: RouteArgsManager.createWebViewArgs({
        url: 'https://example.com/webview',
        title: 'WebView Example',
        includeAuth: true,
        enableJavaScript: true,
        enableScrolling: true
      })
    },
    {
      menu_id: 'menu_external',
      iconUrl: '🔗',
      title: 'External URL',
      textSize: 12,
      url: 'https://external-site.com'
      // External URLs don't need routeArgs
    },
    {
      menu_id: 'menu_submenu',
      iconUrl: '📁',
      title: 'Submenu Example',
      textSize: 12,
      submenu: {
        id: 'submenu_example',
        submenuTitle: 'Example Submenu',
        submenuStyle: 'fullScreen',
        submenuLayout: 'grid',
        items: [
          {
            menu_id: 'submenu_item_1',
            iconUrl: '⚙️',
            title: 'Settings',
            textSize: 11,
            route: '/settings',
            routeArgs: RouteArgsManager.getDefaultArgsForRoute('/settings')
          }
        ]
      }
    }
  ];

  // Example action buttons
  const exampleActionButtons: ActionButton[] = [
    {
      icon: '🔔',
      route: '/inbox_notification',
      tooltip: 'Notifications',
      routeArgs: RouteArgsManager.getDefaultArgsForRoute('/inbox_notification')
    },
    {
      icon: '💰',
      route: '/poin_exchange',
      tooltip: 'Exchange Points',
      routeArgs: RouteArgsManager.getDefaultArgsForRoute('/poin_exchange')
    },
    {
      icon: '❓',
      route: '/pusat_bantuan',
      tooltip: 'Help Center',
      routeArgs: RouteArgsManager.getDefaultArgsForRoute('/pusat_bantuan')
    }
  ];

  // Example banners
  const exampleBanners: Banner[] = [
    {
      imageUrl: 'https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=Product+Banner',
      title: 'Special Offer!',
      titleFontSize: 18,
      titlePosition: { bottom: 16, left: 16 },
      titleTextShadow: true,
      titleTextShadowColor: '#000000',
      titleTextShadowOpacity: 0.7,
      padding: { top: 8, bottom: 60, left: 8, right: 8 },
      borderRadius: 12,
      route: '/product',
      routeArgs: RouteArgsManager.createProductArgs({
        operators: ['TSELREG'],
        hintText: 'Nomor HP Pelanggan',
        infoBox: {
          type: 'info',
          message: 'Promo khusus untuk pelanggan baru!'
        }
      })
    },
    {
      imageUrl: 'https://via.placeholder.com/400x200/10B981/FFFFFF?text=External+Banner',
      title: 'Learn More',
      titleFontSize: 16,
      titlePosition: { center: true },
      titleTextShadow: false,
      padding: { all: 16 },
      borderRadius: 8,
      url: 'https://example.com/learn-more'
      // External URLs don't need routeArgs
    }
  ];

  // Example navigation items
  const exampleNavigationItems: NavigationItem[] = [
    {
      icon: '🏠',
      label: 'Home',
      route: '/product',
      active: true,
      routeArgs: RouteArgsManager.getDefaultArgsForRoute('/product')
    },
    {
      icon: '📊',
      label: 'History',
      route: '/history',
      active: true,
      routeArgs: RouteArgsManager.getDefaultArgsForRoute('/history')
    },
    {
      icon: '👤',
      label: 'Profile',
      route: '/profile',
      active: true,
      routeArgs: RouteArgsManager.getDefaultArgsForRoute('/profile')
    },
    {
      icon: '🌐',
      label: 'External',
      url: 'https://example.com',
      active: false
      // External URLs don't need routeArgs
    }
  ];

  // Handle navigation errors
  const handleNavigationError = (error: string) => {
    setNavigationErrors(prev => [...prev, error]);
    setTimeout(() => {
      setNavigationErrors(prev => prev.slice(1));
    }, 5000);
  };

  // Example route args configuration
  const [exampleRouteArgs, setExampleRouteArgs] = useState({
    route: '/product' as string | undefined,
    url: undefined as string | undefined,
    routeArgs: RouteArgsManager.getDefaultArgsForRoute('/product')
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Centralized Navigation System Example
        </h1>
        <p className="text-gray-600">
          Demonstrating consistent route arguments configuration across all UI components
        </p>
      </div>

      {/* Error Display */}
      {navigationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-2">Navigation Errors:</h3>
          <ul className="text-xs text-red-700 space-y-1">
            {navigationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Controls</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showValidationErrors}
              onChange={(e) => setShowValidationErrors(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-sm text-gray-700">Show Validation Errors</span>
          </label>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation Buttons</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NavigationButton
            route="/product"
            routeArgs={RouteArgsManager.createProductArgs({
              operators: ['TSELREG'],
              hintText: 'Nomor HP'
            })}
            icon="📱"
            title="Product"
            onNavigationError={handleNavigationError}
            showValidationErrors={showValidationErrors}
          />
          <NavigationButton
            route="/webview"
            routeArgs={RouteArgsManager.createWebViewArgs({
              url: 'https://example.com',
              title: 'WebView'
            })}
            icon="🌐"
            title="WebView"
            onNavigationError={handleNavigationError}
            showValidationErrors={showValidationErrors}
          />
          <NavigationButton
            url="https://external.com"
            icon="🔗"
            title="External"
            onNavigationError={handleNavigationError}
            showValidationErrors={showValidationErrors}
          />
          <NavigationButton
            route="/invalid-route"
            icon="❌"
            title="Invalid"
            onNavigationError={handleNavigationError}
            showValidationErrors={showValidationErrors}
          />
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exampleMenuItems.map((item, index) => (
            <MenuItemComponent
              key={item.menu_id || index}
              item={item}
              onNavigationError={handleNavigationError}
              showValidationErrors={showValidationErrors}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Action Buttons</h2>
        <div className="flex flex-wrap gap-4">
          {exampleActionButtons.map((button, index) => (
            <ActionButtonComponent
              key={index}
              button={button}
              onNavigationError={handleNavigationError}
              showValidationErrors={showValidationErrors}
              size="medium"
              variant="primary"
            />
          ))}
        </div>
      </div>

      {/* Banners */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Banners</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exampleBanners.map((banner, index) => (
            <BannerComponent
              key={index}
              banner={banner}
              onNavigationError={handleNavigationError}
              showValidationErrors={showValidationErrors}
              height={200}
              borderRadius={12}
            />
          ))}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exampleNavigationItems.map((item, index) => (
            <NavigationItemComponent
              key={index}
              item={item}
              onNavigationError={handleNavigationError}
              showValidationErrors={showValidationErrors}
              showRouteInfo={true}
            />
          ))}
        </div>
      </div>

      {/* Route Args Editor Example */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Args Editor</h2>
        <div className="max-w-2xl">
          <RouteArgsEditor
            route={exampleRouteArgs.route}
            url={exampleRouteArgs.url}
            routeArgs={exampleRouteArgs.routeArgs}
            onChange={(config) => setExampleRouteArgs(config)}
            showValidation={true}
            allowUrlMode={true}
            allowRouteMode={true}
          />
        </div>
      </div>

      {/* Route Args Manager Examples */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Args Manager Examples</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Product Args:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(
                RouteArgsManager.createProductArgs({
                  operators: ['TSELREG', 'INDOSAT'],
                  hintText: 'Nomor HP Pelanggan',
                  alphanumeric: true,
                  trailingNumbers: true,
                  hintLastDestination: 'Nomor Voucher Akhir',
                  infoBox: {
                    type: 'info',
                    message: 'Informasi penting untuk pengguna'
                  }
                }),
                null,
                2
              )}
            </pre>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">WebView Args:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(
                RouteArgsManager.createWebViewArgs({
                  url: 'https://example.com/webview',
                  title: 'WebView Example',
                  headers: { 'Custom-Header': 'value123' },
                  includeAuth: true,
                  enableJavaScript: true,
                  enableScrolling: true
                }),
                null,
                2
              )}
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Navigation Config:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(
                RouteArgsManager.createNavigationConfig({
                  route: '/product',
                  title: 'Product Page',
                  sourceData: { fromBanner: true },
                  customArgs: { specialFlag: true }
                }),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>

      {/* Validation Examples */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Validation Examples</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Valid Configuration:</h3>
            <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(
                RouteArgsManager.validateNavigationConfig({
                  route: '/product',
                  routeArgs: RouteArgsManager.getDefaultArgsForRoute('/product')
                }),
                null,
                2
              )}
            </pre>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Invalid Configuration:</h3>
            <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(
                RouteArgsManager.validateNavigationConfig({
                  route: '/webview',
                  routeArgs: {} // Missing required URL
                }),
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationSystemExample;
