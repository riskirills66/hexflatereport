import React from 'react';
import { ActionButton, RouteArgs } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';

interface ActionButtonComponentProps {
  button: ActionButton;
  className?: string;
  onClick?: (button: ActionButton) => void;
  onNavigationError?: (error: string) => void;
  showValidationErrors?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
}

const ActionButtonComponent: React.FC<ActionButtonComponentProps> = ({
  button,
  className = '',
  onClick,
  onNavigationError,
  showValidationErrors = false,
  size = 'medium',
  variant = 'primary'
}) => {
  // Create navigation configuration using RouteArgsManager
  const navigationConfig = RouteArgsManager.createNavigationConfig({
    route: button.route,
    title: button.tooltip || 'Action',
    sourceData: button.routeArgs?._bannerData,
    fromWebView: button.routeArgs?.__fromWebView || false,
    customArgs: button.routeArgs
  });

  // Validate navigation configuration
  const validation = RouteArgsManager.validateNavigationConfig(navigationConfig);
  const hasValidationErrors = !validation.isValid;

  // Handle click
  const handleClick = () => {
    if (hasValidationErrors) {
      const errorMessage = `Action button validation failed: ${validation.errors.join(', ')}`;
      console.error('ActionButtonComponent validation error:', errorMessage);
      onNavigationError?.(errorMessage);
      return;
    }

    onClick?.(button);

    // In a real mobile app, this would trigger navigation
    console.log('Action button clicked:', {
      icon: button.icon,
      route: navigationConfig.route,
      routeArgs: navigationConfig.routeArgs,
      type: button.type
    });
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8 p-1';
      case 'large':
        return 'w-12 h-12 p-3';
      default:
        return 'w-10 h-10 p-2';
    }
  };

  // Get variant classes
  const getVariantClasses = () => {
    const baseClasses = 'rounded-lg transition-all duration-200 flex items-center justify-center';
    
    if (hasValidationErrors && showValidationErrors) {
      return `${baseClasses} bg-red-100 border-2 border-red-300 text-red-600 hover:bg-red-200`;
    }
    
    switch (variant) {
      case 'secondary':
        return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300`;
      case 'outline':
        return `${baseClasses} bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50`;
      default:
        return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md`;
    }
  };

  // Render icon
  const renderIcon = () => {
    if (!button.icon) return null;
    
    // Handle emoji icons
    if (button.icon.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)) {
      return <span className="text-lg">{button.icon}</span>;
    }
    
    // Handle URL icons
    if (button.icon.startsWith('http')) {
      return <img src={button.icon} alt={button.tooltip || 'Action'} className="w-full h-full object-contain" />;
    }
    
    // Handle other text icons
    return <span className="text-sm font-medium">{button.icon}</span>;
  };

  return (
    <button
      onClick={handleClick}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        ${className}
      `}
      title={hasValidationErrors && showValidationErrors 
        ? `Validation errors: ${validation.errors.join(', ')}` 
        : button.tooltip || 'Action Button'
      }
    >
      {renderIcon()}
      
      {/* Validation Error Indicator */}
      {hasValidationErrors && showValidationErrors && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      )}
    </button>
  );
};

export default ActionButtonComponent;
