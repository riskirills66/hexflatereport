import React, { useState, useEffect } from 'react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

const ImageTest: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testImage = async () => {
      try {
        const baseUrl = await getApiUrl('');
        const fullUrl = `${baseUrl}/verification/image/APPS0119_ktp.jpg`;
        console.log('Test image URL:', fullUrl);
        
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
        
        setImageUrl(blobUrl);
      } catch (error) {
        console.error('Error getting image URL:', error);
      } finally {
        setLoading(false);
      }
    };

    testImage();
    
    // Cleanup blob URL when component unmounts
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2>Image Test</h2>
      <p>Image URL: {imageUrl}</p>
      <img 
        src={imageUrl} 
        alt="Test" 
        className="w-32 h-32 object-cover border"
        onLoad={() => console.log('Image loaded successfully')}
        onError={(e) => console.error('Image failed to load:', e)}
      />
    </div>
  );
};

export default ImageTest;
