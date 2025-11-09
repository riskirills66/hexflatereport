import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';
import RouteArgsEditor from './RouteArgsEditor';
import { RouteArgs } from '../types';

interface BroadcastCenterProps {
  authSeed: string;
  onStateChange?: (canSend: boolean, isSending: boolean) => void;
}

export interface BroadcastCenterRef {
  sendBroadcast: () => Promise<void>;
  isSending: boolean;
  canSend: boolean;
}

interface BroadcastResult {
  success: boolean;
  message: string;
  sent_tokens?: number;
  failed_tokens?: number;
  failed_token_list?: string[];
}

const BroadcastCenter = forwardRef<BroadcastCenterRef, BroadcastCenterProps>(({ authSeed, onStateChange }, ref) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [route, setRoute] = useState('');
  const [url, setUrl] = useState('');
  const [routeArgs, setRouteArgs] = useState<RouteArgs | undefined>(undefined);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  const canSend = Boolean(title.trim() && message.trim() && !isSending);

  useImperativeHandle(ref, () => ({
    sendBroadcast: handleSendBroadcast,
    isSending,
    canSend
  }));

  useEffect(() => {
    loadAvailableClasses();
  }, []);

  // Notify parent component of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(canSend, isSending);
    }
  }, [canSend, isSending, onStateChange]);

  const loadAvailableClasses = async () => {
    setIsLoading(true);
    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        console.error('No session key found');
        return;
      }

      const apiUrl = await getApiUrl('/admin/reseller-classes');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
      });

      const data = await response.json();
      if (data.success && data.classes) {
        setAvailableClasses(data.classes);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleNavigationChange = (config: { route?: string; url?: string; routeArgs?: RouteArgs }) => {
    setRoute(config.route || '');
    setUrl(config.url || '');
    setRouteArgs(config.routeArgs);
  };


  const handleSendBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      setResult({
        success: false,
        message: 'Judul dan pesan harus diisi'
      });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const sessionKey = localStorage.getItem('adminSessionKey');
      if (!sessionKey) {
        setResult({
          success: false,
          message: 'Kunci sesi tidak ditemukan'
        });
        return;
      }

      const apiUrl = await getApiUrl('/admin/message/broadcast');
      console.log('Broadcast API URL:', apiUrl);

      const requestBody: any = {
        title: title.trim(),
        message: message.trim(),
        class: selectedClasses.length > 0 ? selectedClasses : null,
        image_url: imageUrl.trim() || null,
        session_key: sessionKey,
        auth_seed: authSeed,
      };

      if (route.trim()) requestBody.route = route.trim();
      if (url.trim()) requestBody.url = url.trim();
      if (routeArgs) requestBody.route_args = routeArgs;
      console.log('Broadcast request body:', requestBody);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
          'Session-Key': sessionKey,
          'Auth-Seed': authSeed,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Broadcast response status:', response.status, response.statusText);

      let data;
      try {
        const responseText = await response.text();
        console.log('Broadcast response text:', responseText);
        
        if (!responseText.trim()) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(responseText);
        console.log('Broadcast parsed data:', data);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        setResult({
          success: false,
          message: `Error server: ${response.status} ${response.statusText}. Silakan periksa apakah endpoint broadcast tersedia.`
        });
        return;
      }
      
      setResult(data);

      if (data.success) {
        setTitle('');
        setMessage('');
        setImageUrl('');
        setRoute('');
        setUrl('');
        setRouteArgs(undefined);
        setSelectedClasses([]);
      }
    } catch (error) {
      console.error('Failed to send broadcast:', error);
      let errorMessage = 'Gagal mengirim broadcast. Silakan coba lagi.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Error jaringan: Tidak dapat terhubung ke server. Silakan periksa koneksi Anda.';
      } else if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      setResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col space-y-3">
          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-xs font-medium text-gray-700 mb-1">
              Judul *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="judul notifikasi"
              maxLength={100}
            />
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-xs font-medium text-gray-700 mb-1">
              Pesan *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="masukkan pesan notifikasi"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{message.length}/500 karakter</p>
          </div>

          {/* Image URL Input */}
          <div>
            <label htmlFor="imageUrl" className="block text-xs font-medium text-gray-700 mb-1">
              URL Gambar (Opsional)
            </label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500">
              URL yang dapat diakses publik, maksimal 1MB, format: JPEG, PNG, BMP, WebP
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              ⚠️ Gambar lebih dari 1MB tidak akan ditampilkan dalam notifikasi
            </p>
          </div>

          {/* Navigation Configuration */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Konfigurasi Navigasi (Opsional)
            </label>
            <RouteArgsEditor
              route={route}
              url={url}
              routeArgs={routeArgs}
              onChange={handleNavigationChange}
              showValidation={true}
              allowUrlMode={true}
              allowRouteMode={true}
              className="border border-gray-200 rounded p-3 bg-gray-50"
            />
          </div>

          {/* Kode Level Reseller Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Target Kode Level Reseller (Opsional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Pilih kode level reseller tertentu, atau kosongkan untuk mengirim ke semua reseller
            </p>
            
            {isLoading ? (
              <div className="text-xs text-gray-500">Memuat kode level...</div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                {availableClasses.map((className) => (
                  <label
                    key={className}
                    className="flex items-center space-x-1.5 px-2 py-1.5 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(className)}
                      onChange={() => handleClassToggle(className)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3 flex-shrink-0"
                    />
                    <span className="text-gray-700 truncate">{className}</span>
                  </label>
                ))}
              </div>
            )}
            
            {selectedClasses.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-600">
                  Terpilih: {selectedClasses.join(', ')}
                </p>
              </div>
            )}
            
            {availableClasses.length === 0 && !isLoading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                <p className="text-xs text-yellow-700">
                  Tidak ada kode level reseller ditemukan. Broadcast akan dikirim ke semua reseller.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`p-3 rounded ${
          result.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {result.success ? (
                <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-2">
              <h3 className={`text-xs font-medium ${
                result.success ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {result.success ? 'Broadcast Terkirim' : 'Broadcast Sebagian Terkirim'}
              </h3>
              <div className={`mt-1 text-xs ${
                result.success ? 'text-green-700' : 'text-yellow-700'
              }`}>
                <p>{result.message}</p>
                {result.sent_tokens !== undefined && (
                  <div className="mt-1 space-y-0.5">
                    <p className="font-medium">Ringkasan Pengiriman:</p>
                    <p>✅ Terkirim ke: {result.sent_tokens} penerima</p>
                    {result.failed_tokens && result.failed_tokens > 0 && (
                      <p>⚠️ Sebagian gagal: {result.failed_tokens} penerima</p>
                    )}
                    {result.failed_tokens && result.failed_tokens > 0 && result.failed_token_list && result.failed_token_list.length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                          Lihat token yang gagal ({result.failed_token_list.length})
                        </summary>
                        <div className="mt-1 text-xs text-gray-600 max-h-16 overflow-y-auto">
                          {result.failed_token_list.slice(0, 3).map((token, index) => (
                            <div key={index} className="truncate">
                              {token.substring(0, 30)}...
                            </div>
                          ))}
                          {result.failed_token_list.length > 3 && (
                            <div>... dan {result.failed_token_list.length - 3} lainnya</div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

BroadcastCenter.displayName = 'BroadcastCenter';

export default BroadcastCenter;
