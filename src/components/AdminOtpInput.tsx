import React, { useState } from 'react';
import { Shield, Key, AlertCircle } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface AdminOtpInputProps {
  sessionKey: string;
  onOtpSuccess: (authSeed: string) => void;
  onBack: () => void;
}

interface AuthenticateResponse {
  success: boolean;
  message: string;
  auth_seed?: string;
  registered: boolean;
}

const AdminOtpInput: React.FC<AdminOtpInputProps> = ({ sessionKey, onOtpSuccess, onBack }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const apiUrl = await getApiUrl('/adminauthenticate');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          otp: otp,
          session_key: sessionKey,
          device_model: null,
          imei: null,
          safetycheck: 0,
        }),
      });

      const data: AuthenticateResponse = await response.json();

      if (data.success && data.auth_seed) {
        setSuccess('Autentikasi berhasil! Mengalihkan...');
        // Store both session_key and auth_seed in localStorage for persistence
        localStorage.setItem('adminSessionKey', sessionKey);
        localStorage.setItem('adminAuthSeed', data.auth_seed);
        
        // Call the success callback
        onOtpSuccess(data.auth_seed);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
              setError('Kesalahan jaringan. Silakan periksa koneksi Anda.');
      console.error('Authentication error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Masukkan OTP
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Periksa telepon Anda untuk pesan OTP
          </p>
        </div>

        {/* OTP Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* OTP Field */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Kode OTP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center text-lg font-mono"
                  placeholder="000000"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                                  Masukkan kode 6 digit yang dikirim ke telepon Anda
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="h-5 w-5 bg-green-400 rounded-full mr-2"></div>
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memverifikasi...
                </div>
              ) : (
                'Verifikasi OTP'
              )}
            </button>
            
            <button
              type="button"
              onClick={onBack}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Kembali ke Nomor Telepon
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            OTP berlaku selama 5 menit
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminOtpInput;
