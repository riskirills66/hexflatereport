import React from 'react';
import { NavigationItem, RouteArgs } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';

interface NavigationItemComponentProps {
  item: NavigationItem;
  className?: string;
  onClick?: (item: NavigationItem) => void;
  onNavigationError?: (error: string) => void;
  showValidationErrors?: boolean;
  compact?: boolean;
  showRouteInfo?: boolean;
}

const NavigationItemComponent: React.FC<NavigationItemComponentProps> = ({
  item,
  className = '',
  onClick,
  onNavigationError,
  showValidationErrors = false,
  compact = false,
  showRouteInfo = true
}) => {
  // Create navigation configuration using RouteArgsManager
  const navigationConfig = RouteArgsManager.createNavigationConfig({
    route: item.route,
    url: item.url,
    title: item.label,
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
      const errorMessage = `Navigation item validation failed: ${validation.errors.join(', ')}`;
      console.error('NavigationItemComponent validation error:', errorMessage);
      onNavigationError?.(errorMessage);
      return;
    }

    onClick?.(item);

    // In a real mobile app, this would trigger navigation
    console.log('Navigation item clicked:', {
      label: item.label,
      route: navigationConfig.route,
      url: navigationConfig.url,
      routeArgs: navigationConfig.routeArgs,
      active: item.active
    });
  };

  // Render icon
  const renderIcon = () => {
    if (!item.icon) return null;
    
    // Handle emoji icons
    if (item.icon.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)) {
      return <span className="text-lg">{item.icon}</span>;
    }
    
    // Handle URL icons
    if (item.icon.startsWith('http')) {
      return <img src={item.icon} alt={item.label} className="w-5 h-5" />;
    }
    
    // Handle other text icons
    return <span className="text-sm font-medium">{item.icon}</span>;
  };

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
        ${item.active 
          ? 'bg-blue-50 border border-blue-200 text-blue-700' 
          : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700'
        }
        ${hasValidationErrors && showValidationErrors 
          ? 'ring-2 ring-red-300 bg-red-50' 
          : ''
        }
        ${compact ? 'p-2' : 'p-3'}
        ${className}
      `}
      onClick={handleClick}
      title={hasValidationErrors && showValidationErrors 
        ? `Validation errors: ${validation.errors.join(', ')}` 
        : item.label
      }
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {renderIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {item.label}
        </div>
        
        {/* Show route/URL info */}
        {showRouteInfo && (navigationConfig.route || navigationConfig.url) && (
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

        {/* Show screen info */}
        {item.screen && (
          <div className="text-xs text-gray-500 mt-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
              Screen: {item.screen}
            </span>
          </div>
        )}

        {/* Show dynamic info */}
        {item.dynamic && (
          <div className="text-xs text-gray-500 mt-1">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
              Dynamic: {item.dynamic}
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

      {/* Active indicator */}
      {item.active && (
        <div className="flex-shrink-0">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      )}

      {/* Validation Error Indicator */}
      {hasValidationErrors && showValidationErrors && (
        <div className="flex-shrink-0 text-red-500">
          <span className="text-sm">⚠️</span>
        </div>
      )}
    </div>
  );
};

export default NavigationItemComponent;
