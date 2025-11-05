import React, { useState, useEffect, memo } from 'react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import { Spinner } from '../styles';

interface VerificationImageProps {
  imageUrl: string;
  type: string;
  onImageClick?: (imageUrl: string, type: string) => void;
}

const VerificationImage: React.FC<VerificationImageProps> = memo(({ 
  imageUrl, 
  type,
  onImageClick
}) => {
  const [fullImageUrl, setFullImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImageUrl = async () => {
      try {
        setLoading(true);
        setError(false);
        console.log('VerificationImage: Starting to load image:', { imageUrl, type });
        
        if (!imageUrl) {
          console.error('VerificationImage: No imageUrl provided');
          setError(true);
          setLoading(false);
          return;
        }
        
        const baseUrl = await getApiUrl('');
        const fullUrl = `${baseUrl}${imageUrl}`;
        console.log('VerificationImage: Loading image URL:', { baseUrl, imageUrl, fullUrl });
        
        // Fetch the image with X-Token header
        const response = await fetch(fullUrl, {
          headers: {
            'X-Token': X_TOKEN_VALUE,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        // Create blob URL from the response
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        setFullImageUrl(blobUrl);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load verification image:', err);
        setError(true);
        setLoading(false);
      }
    };

    loadImageUrl();
    
    // Cleanup blob URL when component unmounts or imageUrl changes
    return () => {
      if (fullImageUrl && fullImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fullImageUrl);
      }
    };
  }, [imageUrl, type]);

    const handleImageClick = () => {
    if (!fullImageUrl || error) return;
    
    if (onImageClick) {
      onImageClick(fullImageUrl, type);
    }
  };

  if (loading) {
    return (
      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
        <Spinner size="sm" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
        <span className="text-xs text-gray-400">Error</span>
      </div>
    );
  }

  if (!fullImageUrl) {
    return (
      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
        <Spinner size="sm" color="primary" />
      </div>
    );
  }

  return (
    <img
      src={fullImageUrl}
      alt={`${type} verification`}
      className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={handleImageClick}
      onError={(e) => {
        console.error('VerificationImage: Image failed to load:', fullImageUrl, e);
        setError(true);
      }}
      onLoad={() => {
        console.log('VerificationImage: Image loaded successfully:', fullImageUrl);
      }}
    />
  );
});

export default VerificationImage;
