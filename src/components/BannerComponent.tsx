import React from 'react';
import { Banner, RouteArgs } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';

interface BannerComponentProps {
  banner: Banner;
  className?: string;
  onClick?: (banner: Banner) => void;
  onNavigationError?: (error: string) => void;
  showValidationErrors?: boolean;
  height?: number;
  borderRadius?: number;
}

const BannerComponent: React.FC<BannerComponentProps> = ({
  banner,
  className = '',
  onClick,
  onNavigationError,
  showValidationErrors = false,
  height = 200,
  borderRadius = 8
}) => {
  // Create navigation configuration using RouteArgsManager
  const navigationConfig = RouteArgsManager.createNavigationConfig({
    route: banner.route,
    url: banner.url,
    title: banner.title,
    sourceData: banner.routeArgs?._bannerData,
    fromWebView: banner.routeArgs?.__fromWebView || false,
    customArgs: banner.routeArgs
  });

  // Validate navigation configuration
  const validation = RouteArgsManager.validateNavigationConfig(navigationConfig);
  const hasValidationErrors = !validation.isValid;

  // Handle click
  const handleClick = () => {
    if (hasValidationErrors) {
      const errorMessage = `Banner validation failed: ${validation.errors.join(', ')}`;
      console.error('BannerComponent validation error:', errorMessage);
      onNavigationError?.(errorMessage);
      return;
    }

    onClick?.(banner);

    // In a real mobile app, this would trigger navigation
    console.log('Banner clicked:', {
      title: banner.title,
      route: navigationConfig.route,
      url: navigationConfig.url,
      routeArgs: navigationConfig.routeArgs,
      clonedFromMenuId: banner.clonedFromMenuId
    });
  };

  // Calculate title position styles
  const getTitlePositionStyles = () => {
    if (!banner.titlePosition) return {};
    
    const { top, bottom, left, right, center } = banner.titlePosition;
    const styles: React.CSSProperties = {};
    
    if (center) {
      styles.display = 'flex';
      styles.alignItems = 'center';
      styles.justifyContent = 'center';
    } else {
      if (top !== undefined) styles.top = `${top}px`;
      if (bottom !== undefined) styles.bottom = `${bottom}px`;
      if (left !== undefined) styles.left = `${left}px`;
      if (right !== undefined) styles.right = `${right}px`;
    }
    
    return styles;
  };

  // Calculate title text shadow
  const getTitleTextShadow = () => {
    if (!banner.titleTextShadow) return 'none';
    
    const color = banner.titleTextShadowColor || '#000000';
    const opacity = banner.titleTextShadowOpacity || 0.5;
    const shadowColor = `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
    
    return `0 2px 4px ${shadowColor}`;
  };

  return (
    <div
      className={`
        relative overflow-hidden cursor-pointer transition-all
        ${hasValidationErrors && showValidationErrors 
          ? 'ring-2 ring-red-300' 
          : 'hover:shadow-lg'
        }
        ${className}
      `}
      style={{
        height: `${height}px`,
        borderRadius: `${borderRadius}px`
      }}
      onClick={handleClick}
      title={hasValidationErrors && showValidationErrors 
        ? `Validation errors: ${validation.errors.join(', ')}` 
        : banner.title || 'Banner'
      }
    >
      {/* Banner Image */}
      <img
        src={banner.imageUrl}
        alt={banner.title || 'Banner'}
        className="w-full h-full object-cover"
      />

      {/* Title Overlay */}
      {banner.title && (
        <div
          className="absolute text-white font-semibold"
          style={{
            fontSize: `${banner.titleFontSize || 18}px`,
            textShadow: getTitleTextShadow(),
            ...getTitlePositionStyles(),
            padding: banner.padding ? `${banner.padding.all || 0}px` : '16px'
          }}
        >
          {banner.title}
        </div>
      )}

      {/* Navigation Indicator */}
      {(navigationConfig.route || navigationConfig.url) && (
        <div className="absolute top-2 right-2">
          <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {navigationConfig.route ? 'Route' : 'URL'}
          </div>
        </div>
      )}

      {/* Validation Error Indicator */}
      {hasValidationErrors && showValidationErrors && (
        <div className="absolute top-2 left-2">
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">
            ⚠️ Error
          </div>
        </div>
      )}

      {/* Cloned from Menu Indicator */}
      {banner.clonedFromMenuId && (
        <div className="absolute bottom-2 left-2">
          <div className="bg-blue-500 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            Cloned from Menu
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerComponent;
