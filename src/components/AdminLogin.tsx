import React, { useState, useEffect } from 'react';
import { Shield, Phone, AlertCircle, Clock } from 'lucide-react';
import AdminOtpInput from './AdminOtpInput';
import { getApiUrl, X_TOKEN_VALUE } from '../config/api';

interface AdminLoginProps {
  onLoginSuccess: (authSeed: string) => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  session_key?: string;
  registered: boolean;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Rate limiting configuration
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
  const ATTEMPT_WINDOW = 60 * 1000; // 1 minute window for counting attempts

  // Check rate limiting on component mount
  useEffect(() => {
    checkRateLimit();
  }, []);

  // Countdown timer for rate limiting
  useEffect(() => {
    let interval: number;
    if (isRateLimited && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1000) {
            setIsRateLimited(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRateLimited, remainingTime]);

  const checkRateLimit = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('adminLoginAttempts') || '[]');
    
    // Filter attempts within the window
    const recentAttempts = attempts.filter((attempt: number) => now - attempt < ATTEMPT_WINDOW);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const lockoutEnd = oldestAttempt + LOCKOUT_DURATION;
      
      if (now < lockoutEnd) {
        setIsRateLimited(true);
        setRemainingTime(lockoutEnd - now);
        return true;
      } else {
        // Lockout period expired, clear old attempts
        localStorage.setItem('adminLoginAttempts', JSON.stringify([]));
      }
    }
    
    setIsRateLimited(false);
    setRemainingTime(0);
    return false;
  };

  const recordFailedAttempt = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem('adminLoginAttempts') || '[]');
    
    // Add current attempt
    attempts.push(now);
    
    // Keep only recent attempts
    const recentAttempts = attempts.filter((attempt: number) => now - attempt < ATTEMPT_WINDOW);
    
    localStorage.setItem('adminLoginAttempts', JSON.stringify(recentAttempts));
    
    // Check if we should be rate limited
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      setIsRateLimited(true);
      setRemainingTime(LOCKOUT_DURATION);
    }
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem('adminLoginAttempts');
    setIsRateLimited(false);
    setRemainingTime(0);
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if rate limited
    if (isRateLimited) {
      setError(`Terlalu banyak percobaan login. Silakan tunggu ${formatTime(remainingTime)} sebelum mencoba lagi.`);
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const apiUrl = await getApiUrl('/adminlogin');
      console.log('Making request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          number: phoneNumber,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        setError(`Server error: ${response.status} - ${errorText}`);
        return;
      }

      // Check if response has content
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!responseText.trim()) {
        setError('Server returned empty response');
        return;
      }

      let data: LoginResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setError(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        return;
      }

      if (data.success && data.session_key) {
        setSuccess('OTP berhasil dikirim! Silakan periksa telepon Anda.');
        setSessionKey(data.session_key);
        setShowOtpInput(true);
        // Clear failed attempts on successful login
        clearFailedAttempts();
      } else {
        setError(data.message || 'Login failed');
        // Record failed attempt
        recordFailedAttempt();
      }
    } catch (err) {
      setError('Kesalahan jaringan. Silakan periksa koneksi Anda.');
      console.error('Login error:', err);
      // Record failed attempt for network errors too
      recordFailedAttempt();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSuccess = (authSeed: string) => {
    onLoginSuccess(authSeed);
  };

  const handleBackToPhone = () => {
    setShowOtpInput(false);
    setSessionKey('');
    setError('');
    setSuccess('');
  };

  // Show OTP input if we have a session key
  if (showOtpInput && sessionKey) {
    return (
      <AdminOtpInput
        sessionKey={sessionKey}
        onOtpSuccess={handleOtpSuccess}
        onBack={handleBackToPhone}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Login Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Masukkan nomor telepon Anda untuk menerima OTP
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handlePhoneSubmit}>
          <div className="space-y-4">
            {/* Phone Number Field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Masukkan nomor telepon Anda"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Format: 08xxxxxxxxx atau +62xxxxxxxxx
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

          {/* Rate Limiting Warning */}
          {isRateLimited && (
            <div className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="h-5 w-5 text-orange-400 mr-2" />
              <span className="text-sm text-orange-700">
                Terlalu banyak percobaan login. Silakan tunggu {formatTime(remainingTime)} sebelum mencoba lagi.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isRateLimited}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Mengirim OTP...
              </div>
            ) : isRateLimited ? (
              `Tunggu ${formatTime(remainingTime)}`
            ) : (
              'Kirim OTP'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Hanya pengguna terdaftar dengan hak akses admin yang dapat mengakses sistem ini
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
