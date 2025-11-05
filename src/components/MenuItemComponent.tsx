import React from 'react';
import { MenuItem, RouteArgs } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';
import IconRenderer from './IconRenderer';

interface MenuItemComponentProps {
  item: MenuItem;
  className?: string;
  onClick?: (item: MenuItem) => void;
  onNavigationError?: (error: string) => void;
  showValidationErrors?: boolean;
  compact?: boolean;
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({
  item,
  className = '',
  onClick,
  onNavigationError,
  showValidationErrors = false,
  compact = false
}) => {
  // Create navigation configuration using RouteArgsManager
  const navigationConfig = RouteArgsManager.createNavigationConfig({
    route: item.route,
    url: item.url,
    title: item.title,
    sourceData: item.routeArgs?._bannerData,
    fromWebView: item.routeArgs?.__fromWebView || false,
    customArgs: item.routeArgs
  });

  // Validate navigation configuration
  const validation = RouteArgsManager.validateNavigationConfig(navigationConfig);
  const hasValidationErrors = !validation.isValid;

  // Handle click
  const handleClick = () => {
    if (hasValidationErrors) {
      const errorMessage = `Menu item validation failed: ${validation.errors.join(', ')}`;
      console.error('MenuItemComponent validation error:', errorMessage);
      onNavigationError?.(errorMessage);
      return;
    }

    onClick?.(item);

    // In a real mobile app, this would trigger navigation
    console.log('Menu item clicked:', {
      menuId: item.menu_id,
      title: item.title,
      route: navigationConfig.route,
      url: navigationConfig.url,
      routeArgs: navigationConfig.routeArgs
    });
  };

  // Check if this is a submenu
  const isSubmenu = !!(item.submenu || item.submenuTitle || item.submenuStyle || item.submenuLayout);

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
        ${hasValidationErrors && showValidationErrors 
          ? 'border border-red-300 bg-red-50 hover:bg-red-100' 
          : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
        }
        ${compact ? 'p-2' : 'p-3'}
        ${className}
      `}
      onClick={handleClick}
      title={hasValidationErrors && showValidationErrors 
        ? `Validation errors: ${validation.errors.join(', ')}` 
        : item.title
      }
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <IconRenderer iconUrl={item.iconUrl} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div 
          className="font-medium text-gray-800 truncate"
          style={{
            fontSize: `${item.textSize || 11}px`,
            color: item.textColor || '#000000'
          }}
        >
          {item.title}
        </div>
        
        {/* Show route/URL info */}
        {!isSubmenu && (navigationConfig.route || navigationConfig.url) && (
          <div className="text-xs text-gray-500 mt-1">
            {navigationConfig.route && (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                {navigationConfig.route}
                {navigationConfig.routeArgs && Object.keys(navigationConfig.routeArgs).length > 0 && (
                  <span className="text-gray-400">(args)</span>
                )}
              </span>
            )}
            {navigationConfig.url && (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                External URL
              </span>
            )}
          </div>
        )}

        {/* Show submenu info */}
        {isSubmenu && (
          <div className="text-xs text-blue-600 mt-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              Submenu ({item.submenu?.submenuLayout || item.submenuLayout || 'grid'})
            </span>
          </div>
        )}

        {/* Show validation errors */}
        {hasValidationErrors && showValidationErrors && (
          <div className="text-xs text-red-600 mt-1">
            ⚠️ {validation.errors.join(', ')}
          </div>
        )}
      </div>

      {/* Submenu indicator */}
      {isSubmenu && (
        <div className="flex-shrink-0 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default MenuItemComponent;
