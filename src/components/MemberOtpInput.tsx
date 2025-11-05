import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface MemberOtpInputProps {
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

const MemberOtpInput: React.FC<MemberOtpInputProps> = ({ sessionKey, onOtpSuccess, onBack }) => {
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
      const apiUrl = await getApiUrl('/authenticate');
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
        localStorage.setItem('memberSessionKey', sessionKey);
        localStorage.setItem('memberAuthSeed', data.auth_seed);
        
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifikasi OTP</h1>
          <p className="text-gray-600">Masukkan kode OTP yang dikirim ke nomor Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
              Kode OTP
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-center text-lg tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke input nomor</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Tidak menerima OTP?{' '}
            <button className="text-green-600 hover:text-green-700 font-medium">
              Kirim ulang
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MemberOtpInput;

