import React from 'react';
import { RouteArgs } from '../types';
import { RouteArgsManager } from '../utils/routeArgsManager';
import { AVAILABLE_ROUTES } from '../data/routeConfig';
import TagInput from './TagInput';

interface RouteArgsConfigProps {
  route: string;
  routeArgs: RouteArgs | undefined;
  onChange: (routeArgs: RouteArgs | undefined) => void;
  className?: string;
}

const RouteArgsConfig: React.FC<RouteArgsConfigProps> = ({
  route,
  routeArgs,
  onChange,
  className = ''
}) => {
  const currentArgs = routeArgs || {} as RouteArgs;

  // Check if the current URL is a markdown file
  const isMarkdownUrl = (currentArgs as any).url?.toLowerCase().endsWith('.md') || false;

  // Helper function to get routes for webview below button (include product, exclude webview)
  const getWebViewBelowButtonRoutes = () => {
    const filtered = AVAILABLE_ROUTES.filter(route => route.value !== '/webview');
    const grouped: Record<string, typeof filtered> = {};
    filtered.forEach(route => {
      if (!grouped[route.category]) {
        grouped[route.category] = [];
      }
      grouped[route.category].push(route);
    });
    return grouped;
  };

  const handleProductArgsChange = (updates: Partial<RouteArgs>) => {
    const newArgs = RouteArgsManager.createProductArgs({
      ...currentArgs,
      ...updates
    });
    onChange(newArgs);
  };

  const handleWebViewArgsChange = (updates: Partial<RouteArgs>) => {
    const newArgs = RouteArgsManager.createWebViewArgs({
      url: currentArgs.url || '',
      title: currentArgs.title,
      headers: currentArgs.headers,
      includeAuth: currentArgs.includeAuth,
      enableJavaScript: currentArgs.enableJavaScript,
      enableScrolling: currentArgs.enableScrolling,
      ...updates
    });
    onChange(newArgs);
  };

  const handleGenericArgsChange = (updates: Partial<RouteArgs>) => {
    const newArgs = {
      ...currentArgs,
      ...updates
    };
    onChange(newArgs);
  };

  const handleWebViewBelowButtonRouteArgsChange = (updates: Record<string, any>) => {
    const currentRouteArgs = (currentArgs as any).webviewBelowButton?.routeArgs || {};
    const newRouteArgs = {
      ...currentRouteArgs,
      ...updates
    };
    
    handleGenericArgsChange({
      webviewBelowButton: {
        ...(currentArgs as any).webviewBelowButton,
        routeArgs: newRouteArgs
      }
    } as any);
  };

  const _renderAdvancedRouteArgs = () => {
    const selectedRoute = (currentArgs as any).webviewBelowButton?.route;
    const routeArgs = (currentArgs as any).webviewBelowButton?.routeArgs || {};

    if (!selectedRoute) {
      return (
        <div className="text-xs text-gray-500 italic">
          Pilih route terlebih dahulu untuk mengkonfigurasi arguments
        </div>
      );
    }

    // Product route specific args
    if (selectedRoute === '/product') {
      return (
        <div className="space-y-3 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs font-medium text-blue-700">Product Route Configuration</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label text-xs">Operators</label>
              <TagInput
                value={routeArgs.operators || []}
                onChange={(operators) => handleWebViewBelowButtonRouteArgsChange({
                  operators: operators.length > 0 ? operators : undefined
                })}
                placeholder="Type operator and press space..."
                className="text-xs"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label text-xs">Hint Text</label>
              <input
                type="text"
                className="form-input text-xs py-1 w-full"
                value={routeArgs.hintText || ''}
                onChange={(e) => handleWebViewBelowButtonRouteArgsChange({
                  hintText: e.target.value || undefined
                })}
                placeholder="Nomor HP Pelanggan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label text-xs">Alphanumeric</label>
              <select
                className="form-input text-xs py-1 w-full"
                value={routeArgs.alphanumeric?.toString() || 'false'}
                onChange={(e) => handleWebViewBelowButtonRouteArgsChange({
                  alphanumeric: e.target.value === 'true'
                })}
              >
                <option value="false">Hanya Angka</option>
                <option value="true">Huruf & Angka</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label text-xs">Trailing Numbers</label>
              <select
                className="form-input text-xs py-1 w-full"
                value={routeArgs.trailingNumbers?.toString() || 'false'}
                onChange={(e) => handleWebViewBelowButtonRouteArgsChange({
                  trailingNumbers: e.target.value === 'true'
                })}
              >
                <option value="false">Angka Tunggal</option>
                <option value="true">Rentang Angka</option>
              </select>
            </div>
          </div>

          {routeArgs.trailingNumbers && (
            <div className="form-group">
              <label className="form-label text-xs">Trailing Numbers Hint Text</label>
              <input
                type="text"
                className="form-input text-xs py-1 w-full"
                value={routeArgs.hintLastDestination || ''}
                onChange={(e) => handleWebViewBelowButtonRouteArgsChange({
                  hintLastDestination: e.target.value || undefined
                })}
                placeholder="Nomor Voucher Akhir"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label text-xs">Info Box</label>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="form-input text-xs py-1 w-full"
                value={routeArgs.infoBox?.type || 'none'}
                onChange={(e) => {
                  const type = e.target.value === 'none' ? undefined : e.target.value;
                  handleWebViewBelowButtonRouteArgsChange({
                    infoBox: type ? { 
                      type: type as 'info' | 'warning' | 'error',
                      message: routeArgs.infoBox?.message || ''
                    } : undefined 
                  });
                }}
              >
                <option value="none">Tidak Ada Info Box</option>
                <option value="info">Informasi</option>
                <option value="warning">Peringatan</option>
                <option value="error">Error</option>
              </select>
              
              <input
                type="text"
                className="form-input text-xs py-1 w-full"
                value={routeArgs.infoBox?.message || ''}
                onChange={(e) => handleWebViewBelowButtonRouteArgsChange({
                  infoBox: { 
                    type: routeArgs.infoBox?.type || 'info',
                    message: e.target.value || '' 
                  }
                })}
                placeholder="Info message"
                disabled={!routeArgs.infoBox?.type}
              />
            </div>
          </div>
        </div>
      );
    }

    // WebView route specific args
    if (selectedRoute === '/webview') {
      return (
        <div className="space-y-3 p-3 bg-green-50 rounded border border-green-200">
          <div className="text-xs font-medium text-green-700">WebView Route Configuration</div>
          
          <div className="form-group">
            <label className="form-label text-xs">WebView URL</label>
            <input
              type="text"
              className="form-input text-xs py-1 w-full"
              value={routeArgs.url || ''}
              onChange={(e) => handleWebViewBelowButtonRouteArgsChange({
                url: e.target.value || undefined
              })}
              placeholder="https://example.com/webview-content"
            />
          </div>

          <div className="form-group">
            <label className="form-label text-xs">WebView Title</label>
            <input
              type="text"
              className="form-input text-xs py-1 w-full"
              value={routeArgs.title || ''}
              onChange={(e) => handleWebViewBelowButtonRouteArgsChange({
                title: e.target.value || undefined
              })}
              placeholder="WebView Title"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label text-xs">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={routeArgs.includeAuth || false}
                onChange={(e) => handleWebViewBelowButtonRouteArgsChange({
                  includeAuth: e.target.checked
                })}
              />
              <span className="ml-2">Sertakan Header Autentikasi</span>
            </label>
          </div>
        </div>
      );
    }

    // For other routes, return null to hide the section entirely
    return null;
  };

  const renderProductArgs = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
        Product Route Configuration
      </div>
      
      {/* Common Product Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label text-xs">Operators</label>
          <TagInput
            value={currentArgs.operators || []}
            onChange={(operators) => handleProductArgsChange({
              operators: operators.length > 0 ? operators : undefined
            })}
            placeholder="Type operator and press space..."
            className="text-xs"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label text-xs">Hint Text</label>
          <input
            type="text"
            className="form-input text-xs py-1 w-full"
            value={currentArgs.hintText || ''}
            onChange={(e) => handleProductArgsChange({
              hintText: e.target.value || undefined
            })}
            placeholder="Nomor HP Pelanggan"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="form-group">
          <label className="form-label text-xs">Alphanumeric</label>
          <select
            className="form-input text-xs py-1 w-full"
            value={currentArgs.alphanumeric?.toString() || 'false'}
            onChange={(e) => handleProductArgsChange({
              alphanumeric: e.target.value === 'true'
            })}
          >
            <option value="false">Hanya Angka</option>
            <option value="true">Huruf & Angka</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label text-xs">Trailing Numbers</label>
          <select
            className="form-input text-xs py-1 w-full"
            value={currentArgs.trailingNumbers?.toString() || 'false'}
            onChange={(e) => handleProductArgsChange({
              trailingNumbers: e.target.value === 'true'
            })}
          >
            <option value="false">Angka Tunggal</option>
            <option value="true">Rentang Angka</option>
          </select>
        </div>
      </div>

      {/* Trailing Numbers Hint Text - only show when trailingNumbers is enabled */}
      {currentArgs.trailingNumbers && (
        <div className="form-group">
          <label className="form-label text-xs">Trailing Numbers Hint Text</label>
          <input
            type="text"
            className="form-input text-xs py-1 w-full"
            value={currentArgs.hintLastDestination || ''}
            onChange={(e) => handleProductArgsChange({
              hintLastDestination: e.target.value || undefined
            })}
            placeholder="Nomor Voucher Akhir"
          />
          <div className="text-xs text-gray-500 mt-1">
            Teks petunjuk untuk input nomor voucher akhir
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="form-group">
        <label className="form-label text-xs">Info Box</label>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="form-input text-xs py-1 w-full"
            value={currentArgs.infoBox?.type || 'none'}
            onChange={(e) => {
              const type = e.target.value === 'none' ? undefined : e.target.value;
              handleProductArgsChange({
                infoBox: type ? { 
                  type: type as 'info' | 'warning' | 'error',
                  message: currentArgs.infoBox?.message || ''
                } : undefined 
              });
            }}
          >
            <option value="none">Tidak Ada Info Box</option>
            <option value="info">Informasi</option>
            <option value="warning">Peringatan</option>
            <option value="error">Error</option>
          </select>
          
          <input
            type="text"
            className="form-input text-xs py-1 w-full"
            value={currentArgs.infoBox?.message || ''}
            onChange={(e) => handleProductArgsChange({
              infoBox: { 
                type: currentArgs.infoBox?.type || 'info',
                message: e.target.value || '' 
              }
            })}
            placeholder="Info message"
            disabled={!currentArgs.infoBox?.type}
          />
        </div>
      </div>
    </div>
  );

  const renderWebViewArgs = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
        WebView Configuration
      </div>
      
      {/* WebView URL */}
      <div className="form-group">
        <label className="form-label text-xs">WebView URL</label>
        <input
          type="text"
          className="form-input text-xs py-1 w-full"
          value={currentArgs.url || ''}
          onChange={(e) => handleWebViewArgsChange({
            url: e.target.value || ''
          })}
          placeholder="https://example.com/webview-content"
        />
      </div>

      {/* WebView Title */}
      <div className="form-group">
        <label className="form-label text-xs">WebView Title</label>
        <input
          type="text"
          className="form-input text-xs py-1 w-full"
          value={currentArgs.title || ''}
          onChange={(e) => handleWebViewArgsChange({
            title: e.target.value || undefined
          })}
          placeholder="WebView Title"
        />
      </div>

      {/* Include Auth - hidden for markdown URLs */}
      {!isMarkdownUrl && (
        <div className="form-group">
          <label className="checkbox-label text-xs">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={currentArgs.includeAuth || false}
              onChange={(e) => handleWebViewArgsChange({
                includeAuth: e.target.checked
              })}
            />
            <span className="ml-2">Sertakan Header Autentikasi</span>
          </label>
          <div className="text-xs text-gray-500 mt-1 ml-6">
            Secara otomatis menambahkan header User-ID, Session-Key, Auth-Seed, dan X-Token
          </div>
        </div>
      )}

      {/* Custom Headers - hidden for markdown URLs */}
      {!isMarkdownUrl && (
        <div className="form-group">
          <label className="form-label text-xs">Custom Headers (JSON)</label>
          <textarea
            className="form-input text-xs py-1 w-full"
            value={currentArgs.headers ? JSON.stringify(currentArgs.headers, null, 2) : ''}
            onChange={(e) => {
              try {
                const headers = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
                handleWebViewArgsChange({ headers });
              } catch (error) {
                // Don't update if JSON is invalid
              }
            }}
            placeholder='{"Custom-Header": "value123", "x-token": "1234"}'
            rows={3}
          />
          <div className="text-xs text-gray-500 mt-1">
            Add custom HTTP headers for the WebView request
          </div>
        </div>
      )}

      {/* Payment Setup Fields - hidden for markdown URLs */}
      {!isMarkdownUrl && (
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs font-medium text-blue-700 mb-2">Pengaturan Pembayaran (Opsional)</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label text-xs">Kode Produk</label>
              <input
                type="text"
                className="form-input text-xs py-1 w-full"
                value={currentArgs.productKode || ''}
                onChange={(e) => handleGenericArgsChange({
                  productKode: e.target.value || undefined
                })}
                placeholder="TDOMQ"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label text-xs">Operator</label>
              <input
                type="text"
                className="form-input text-xs py-1 w-full"
                value={currentArgs.operator || ''}
                onChange={(e) => handleGenericArgsChange({
                  operator: e.target.value || undefined
                })}
                placeholder="TDOMQ"
              />
            </div>
          </div>
          
          <div className="mt-3">
            <label className="form-label text-xs">Pola URL Tujuan</label>
            <input
              type="text"
              className="form-input text-xs py-1 w-full"
              value={currentArgs.destUrl || ''}
              onChange={(e) => handleGenericArgsChange({
                destUrl: e.target.value || undefined
              })}
              placeholder="https://example.com/payment/{}/success"
            />
            <div className="text-xs text-gray-500 mt-1">
              Gunakan {} sebagai placeholder untuk nomor tujuan pembayaran
            </div>
          </div>
        </div>
      )}

      {/* WebView Below Button Configuration */}
      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs font-medium text-green-700 mb-2">Tombol Aksi di Bawah Markdown (Opsional)</div>
        
        {/* Enable/Disable Button */}
        <div className="form-group">
          <label className="checkbox-label text-xs">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={!!(currentArgs as any).webviewBelowButton}
              onChange={(e) => {
                if (e.target.checked) {
                  handleGenericArgsChange({
                    webviewBelowButton: {
                      text: 'Action Button',
                      icon: 'arrow_forward',
                      style: 'gradient',
                      route: '/home',
                      routeArgs: {},
                      dontShowAgain: false
                    }
                  } as any);
                } else {
                  handleGenericArgsChange({
                    webviewBelowButton: undefined
                  } as any);
                }
              }}
            />
            <span className="ml-2">Tampilkan Tombol Aksi di Bawah Markdown</span>
          </label>
          <div className="text-xs text-gray-500 mt-1 ml-6">
            Tombol ini hanya muncul saat menampilkan konten markdown (.md)
          </div>
        </div>

        {/* Button Configuration */}
        {(currentArgs as any).webviewBelowButton && (
          <div className="ml-4 space-y-3 border-l-2 border-green-200 pl-4">
            {/* Button Text */}
            <div className="form-group">
              <label className="form-label text-xs">Teks Tombol</label>
              <input
                type="text"
                className="form-input text-xs py-1 w-full"
                value={(currentArgs as any).webviewBelowButton?.text || ''}
                onChange={(e) => handleGenericArgsChange({
                  webviewBelowButton: {
                    ...(currentArgs as any).webviewBelowButton,
                    text: e.target.value || 'Action Button'
                  }
                } as any)}
                placeholder="Go to Settings"
              />
            </div>

            {/* Button Icon */}
            <div className="form-group">
              <label className="form-label text-xs">Icon</label>
              <select
                className="form-input text-xs py-1 w-full"
                value={(currentArgs as any).webviewBelowButton?.icon || 'arrow_forward'}
                onChange={(e) => handleGenericArgsChange({
                  webviewBelowButton: {
                    ...(currentArgs as any).webviewBelowButton,
                    icon: e.target.value
                  }
                } as any)}
              >
                <option value="">Tidak Ada Icon</option>
                <option value="home">Home</option>
                <option value="settings">Settings</option>
                <option value="profile">Profile</option>
                <option value="history">History</option>
                <option value="webview">WebView</option>
                <option value="product">Product</option>
                <option value="notification">Notification</option>
                <option value="help">Help</option>
                <option value="info">Info</option>
                <option value="arrow_forward">Arrow Forward</option>
                <option value="arrow_back">Arrow Back</option>
                <option value="refresh">Refresh</option>
                <option value="open_in_browser">Open in Browser</option>
                <option value="download">Download</option>
                <option value="share">Share</option>
                <option value="favorite">Favorite</option>
                <option value="star">Star</option>
                <option value="add">Add</option>
                <option value="edit">Edit</option>
                <option value="delete">Delete</option>
                <option value="search">Search</option>
                <option value="menu">Menu</option>
                <option value="close">Close</option>
                <option value="check">Check</option>
                <option value="cancel">Cancel</option>
                <option value="save">Save</option>
                <option value="send">Send</option>
                <option value="back">Back</option>
                <option value="forward">Forward</option>
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>

            {/* Button Style */}
            <div className="form-group">
              <label className="form-label text-xs">Style Tombol</label>
              <select
                className="form-input text-xs py-1 w-full"
                value={(currentArgs as any).webviewBelowButton?.style || 'gradient'}
                onChange={(e) => handleGenericArgsChange({
                  webviewBelowButton: {
                    ...(currentArgs as any).webviewBelowButton,
                    style: e.target.value
                  }
                } as any)}
              >
                <option value="gradient">Gradient (Primary)</option>
                <option value="outlined">Outlined (Secondary)</option>
              </select>
            </div>

            {/* Don't Show Again Option */}
            <div className="form-group">
              <label className="checkbox-label text-xs">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={(currentArgs as any).webviewBelowButton?.dontShowAgain || false}
                  onChange={(e) => handleGenericArgsChange({
                    webviewBelowButton: {
                      ...(currentArgs as any).webviewBelowButton,
                      dontShowAgain: e.target.checked
                    }
                  } as any)}
                />
                <span className="ml-2">Tampilkan Opsi "Jangan Tampilkan Lagi"</span>
              </label>
              <div className="text-xs text-gray-500 mt-1 ml-6">
                Menambahkan checkbox untuk melewatkan konten dan langsung ke tujuan
              </div>
            </div>

            {/* Target Route */}
            <div className="form-group">
              <label className="form-label text-xs">Route Tujuan</label>
              <select
                className="form-input text-xs py-1 w-full"
                value={(currentArgs as any).webviewBelowButton?.route || ''}
                onChange={(e) => handleGenericArgsChange({
                  webviewBelowButton: {
                    ...(currentArgs as any).webviewBelowButton,
                    route: e.target.value || '/home'
                  }
                } as any)}
              >
                <option value="">Pilih Route...</option>
                {Object.entries(getWebViewBelowButtonRoutes()).map(([category, routes]) => (
                  <optgroup key={category} label={category}>
                    {routes.map((route) => (
                      <option key={route.value} value={route.value}>
                        {route.label} - {route.description}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="text-xs text-gray-500 mt-1">
                Route yang akan dibuka saat tombol diklik
              </div>
            </div>

            {/* Route Arguments - only show if there's content */}
            {_renderAdvancedRouteArgs() && (
              <div className="space-y-3">
                <div className="text-xs font-medium text-gray-600">Route Arguments</div>
                
                {/* Advanced Route Args based on selected route */}
                {_renderAdvancedRouteArgs()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderGenericArgs = () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
        Route Arguments
      </div>
      
      <div className="form-group">
        <label className="form-label text-xs">Route Args (JSON)</label>
        <textarea
          className="form-input text-sm py-1 w-full"
          rows={4}
          value={JSON.stringify(currentArgs, null, 2)}
          onChange={(e) => {
            try {
              const routeArgs = JSON.parse(e.target.value);
              onChange(routeArgs);
            } catch (error) {
              // Invalid JSON, ignore
            }
          }}
          placeholder='{"key": "value"}'
        />
        <div className="text-xs text-gray-500 mt-1">
          Enter custom route arguments as JSON
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {route === '/product' && renderProductArgs()}
      {route === '/webview' && renderWebViewArgs()}
      {route && route !== '/product' && route !== '/webview' && renderGenericArgs()}
    </div>
  );
};

export default RouteArgsConfig;
