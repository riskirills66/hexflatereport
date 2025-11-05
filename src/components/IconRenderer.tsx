import React, { useState } from 'react';

interface IconRendererProps {
  iconUrl?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const IconRenderer: React.FC<IconRendererProps> = ({ 
  iconUrl, 
  fallback = '📱', 
  size = 'md',
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // If no iconUrl or image failed to load, show fallback emoji
  if (!iconUrl || imageError) {
    return (
      <span className={`inline-block ${className}`}>
        {fallback}
      </span>
    );
  }

  // Check if it's an emoji (simple check for non-URL strings)
  if (!iconUrl.startsWith('http') && !iconUrl.startsWith('data:')) {
    return (
      <span className={`inline-block ${className}`}>
        {iconUrl}
      </span>
    );
  }

  // If URL is too long, it might be invalid - show fallback
  if (iconUrl.length > 500) {
    return (
      <span className={`inline-block ${className}`}>
        {fallback}
      </span>
    );
  }

  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className} icon-renderer`}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 rounded animate-pulse loading-placeholder" />
      )}
      <img
        src={iconUrl}
        alt="Icon"
        className={`w-full h-full object-contain ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        onLoadStart={() => setImageLoading(true)}
      />
    </div>
  );
};

export default IconRenderer;
