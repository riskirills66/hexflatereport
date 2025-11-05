import React, { useState, useEffect } from 'react';
import { RouteArgs } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';
import { getRoutesByCategory } from '../data/routeConfig';
import RouteArgsConfig from './RouteArgsConfig';

interface RouteArgsEditorProps {
  route?: string;
  url?: string;
  routeArgs?: RouteArgs;
  onChange: (config: { route?: string; url?: string; routeArgs?: RouteArgs }) => void;
  className?: string;
  showValidation?: boolean;
  allowUrlMode?: boolean;
  allowRouteMode?: boolean;
}

const RouteArgsEditor: React.FC<RouteArgsEditorProps> = ({
  route,
  url,
  routeArgs,
  onChange,
  className = '',
  showValidation = true,
  allowUrlMode = true,
  allowRouteMode = true
}) => {
  const [navigationType, setNavigationType] = useState<'route' | 'url' | 'none'>('none');
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({
    isValid: true,
    errors: []
  });

  // Determine initial navigation type
  useEffect(() => {
    if (route) {
      setNavigationType('route');
    } else if (url) {
      setNavigationType('url');
    } else {
      setNavigationType('none');
    }
  }, [route, url]);

  // Validate navigation configuration
  useEffect(() => {
    if (showValidation && navigationType !== 'none') {
      const config = { route, url, routeArgs };
      const validationResult = RouteArgsManager.validateNavigationConfig(config);
      setValidation(validationResult);
    } else if (navigationType === 'none') {
      // No validation needed when no navigation is selected
      setValidation({ isValid: true, errors: [] });
    }
  }, [route, url, routeArgs, showValidation, navigationType]);

  // Handle navigation type change
  const handleNavigationTypeChange = (type: 'route' | 'url' | 'none') => {
    setNavigationType(type);
    
    if (type === 'route') {
      onChange({
        route: route || '/product',
        url: undefined,
        routeArgs: routeArgs || {}
      });
    } else if (type === 'url') {
      onChange({
        route: undefined,
        url: url || 'https://example.com',
        routeArgs: undefined // External URLs don't need route arguments
      });
    } else {
      onChange({
        route: undefined,
        url: undefined,
        routeArgs: undefined
      });
    }
  };

  // Handle route change
  const handleRouteChange = (newRoute: string) => {
    const defaultArgs = RouteArgsManager.getDefaultArgsForRoute(newRoute);
    onChange({
      route: newRoute,
      url: undefined,
      routeArgs: defaultArgs || {}
    });
  };

  // Handle URL change
  const handleUrlChange = (newUrl: string) => {
    onChange({
      route: undefined,
      url: newUrl,
      routeArgs: undefined // External URLs don't need route arguments
    });
  };

  // Handle route args change
  const handleRouteArgsChange = (newRouteArgs: RouteArgs | undefined) => {
    onChange({
      route,
      url,
      routeArgs: newRouteArgs
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Navigation Type Selection */}
      <div className="form-group">
        <label className="form-label text-sm">Jenis Navigasi</label>
        <div className="flex gap-3">
          {allowRouteMode && (
            <label className="checkbox-label text-sm">
              <input
                type="radio"
                name="navigationType"
                value="route"
                checked={navigationType === 'route'}
                onChange={() => handleNavigationTypeChange('route')}
                className="form-checkbox"
              />
              <span className="ml-2">Rute Internal</span>
            </label>
          )}
          {allowUrlMode && (
            <label className="checkbox-label text-sm">
              <input
                type="radio"
                name="navigationType"
                value="url"
                checked={navigationType === 'url'}
                onChange={() => handleNavigationTypeChange('url')}
                className="form-checkbox"
              />
              <span className="ml-2">URL Eksternal</span>
            </label>
          )}
          <label className="checkbox-label text-sm">
            <input
              type="radio"
              name="navigationType"
              value="none"
              checked={navigationType === 'none'}
              onChange={() => handleNavigationTypeChange('none')}
              className="form-checkbox"
            />
            <span className="ml-2">Tidak Ada Navigasi</span>
          </label>
        </div>
      </div>

      {/* Route Selection */}
      {navigationType === 'route' && (
        <div className="form-group">
          <label className="form-label text-sm">Rute</label>
          <select
            className="form-select text-sm py-2 w-full"
            value={route || ''}
            onChange={(e) => handleRouteChange(e.target.value)}
          >
            <option value="">Pilih rute...</option>
            {Object.entries(getRoutesByCategory()).map(([category, routes]) => (
              <optgroup key={category} label={category}>
                {routes.map(routeInfo => (
                  <option key={routeInfo.value} value={routeInfo.value}>
                    {routeInfo.label} - {routeInfo.description}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      {/* URL Input */}
      {navigationType === 'url' && (
        <div className="form-group">
          <label className="form-label text-sm">URL Eksternal</label>
          <input
            type="text"
            className="form-input text-sm py-2 w-full"
            value={url || ''}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      )}

      {/* Route Arguments Configuration - only for internal routes */}
      {navigationType === 'route' && routeArgs && (
        <div className="form-group">
          <label className="form-label text-sm">Konfigurasi Argumen</label>
          <div className="p-3 bg-gray-50 rounded border">
            <RouteArgsConfig
              route={route || '/webview'}
              routeArgs={routeArgs}
              onChange={handleRouteArgsChange}
            />
          </div>
        </div>
      )}

      {/* External URL Info */}
      {navigationType === 'url' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center gap-2">
            <span className="text-blue-500">ℹ️</span>
            <span className="text-sm text-blue-800">
              URL eksternal akan dibuka di browser dan tidak memerlukan konfigurasi argumen tambahan.
            </span>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {showValidation && !validation.isValid && navigationType !== 'none' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-sm font-medium text-red-800">Validation Errors</span>
          </div>
          <ul className="text-xs text-red-700 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Success */}
      {showValidation && validation.isValid && navigationType !== 'none' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span className="text-sm font-medium text-green-800">Navigation configuration is valid</span>
          </div>
        </div>
      )}

      {/* No Navigation Info */}
      {navigationType === 'none' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">ℹ️</span>
            <span className="text-sm text-gray-700">
              Tidak ada navigasi yang dikonfigurasi. Notifikasi akan ditampilkan tanpa aksi navigasi.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteArgsEditor;
