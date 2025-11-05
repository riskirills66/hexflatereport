import React, { useState, useEffect } from "react";
import { User, Phone, AlertCircle, Hash, Clock } from "lucide-react";
import MemberOtpInput from "./MemberOtpInput";
import { getApiUrl, X_TOKEN_VALUE } from "../config/api";

interface MemberLoginProps {
  onLoginSuccess: (authSeed: string) => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  session_key?: string;
  registered: boolean;
}

const MemberLogin: React.FC<MemberLoginProps> = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
    const attempts = JSON.parse(localStorage.getItem("loginAttempts") || "[]");

    // Filter attempts within the window
    const recentAttempts = attempts.filter(
      (attempt: number) => now - attempt < ATTEMPT_WINDOW,
    );

    if (recentAttempts.length >= MAX_ATTEMPTS) {
      const oldestAttempt = Math.min(...recentAttempts);
      const lockoutEnd = oldestAttempt + LOCKOUT_DURATION;

      if (now < lockoutEnd) {
        setIsRateLimited(true);
        setRemainingTime(lockoutEnd - now);
        return true;
      } else {
        // Lockout period expired, clear old attempts
        localStorage.setItem("loginAttempts", JSON.stringify([]));
      }
    }

    setIsRateLimited(false);
    setRemainingTime(0);
    return false;
  };

  const recordFailedAttempt = () => {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem("loginAttempts") || "[]");

    // Add current attempt
    attempts.push(now);

    // Keep only recent attempts
    const recentAttempts = attempts.filter(
      (attempt: number) => now - attempt < ATTEMPT_WINDOW,
    );

    localStorage.setItem("loginAttempts", JSON.stringify(recentAttempts));

    // Check if we should be rate limited
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      setIsRateLimited(true);
      setRemainingTime(LOCKOUT_DURATION);
    }
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem("loginAttempts");
    setIsRateLimited(false);
    setRemainingTime(0);
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if rate limited
    if (isRateLimited) {
      setError(
        `Terlalu banyak percobaan login. Silakan tunggu ${formatTime(remainingTime)} sebelum mencoba lagi.`,
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiUrl = await getApiUrl("/webreport-login");
      console.log("Making request to:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token": X_TOKEN_VALUE,
        },
        body: JSON.stringify({
          id: userId,
          number: phoneNumber,
        }),
      });

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        setError(`Server error: ${response.status} - ${errorText}`);
        return;
      }

      // Check if response has content
      const responseText = await response.text();
      console.log("Response text:", responseText);

      if (!responseText.trim()) {
        setError("Server returned empty response");
        return;
      }

      let data: LoginResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        setError(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        return;
      }

      if (data.success && data.session_key) {
        setSuccess("OTP berhasil dikirim! Silakan periksa telepon Anda.");
        setSessionKey(data.session_key);
        setShowOtpInput(true);
        // Clear failed attempts on successful login
        clearFailedAttempts();
      } else {
        setError(data.message || "Login failed");
        // Record failed attempt
        recordFailedAttempt();
      }
    } catch (err) {
      setError("Kesalahan jaringan. Silakan periksa koneksi Anda.");
      console.error("Login error:", err);
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
    setSessionKey("");
    setError("");
    setSuccess("");
  };

  // Show OTP input if we have a session key
  if (showOtpInput && sessionKey) {
    return (
      <MemberOtpInput
        sessionKey={sessionKey}
        onOtpSuccess={handleOtpSuccess}
        onBack={handleBackToPhone}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Web Report</h1>
          <p className="text-gray-600">
            Masuk untuk melihat laporan transaksi Anda
          </p>
        </div>

        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ID Pengguna
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Masukkan ID pengguna"
                required
                minLength={3}
                maxLength={20}
                title="Masukkan ID pengguna yang valid"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nomor Telepon
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="08xxxxxxxxxx"
                required
                pattern="08[0-9]{8,11}"
                title="Masukkan nomor telepon yang valid (08xxxxxxxxxx)"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {isRateLimited && (
            <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 p-3 rounded-lg">
              <Clock className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">
                Terlalu banyak percobaan login. Silakan tunggu{" "}
                {formatTime(remainingTime)} sebelum mencoba lagi.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isRateLimited}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Mengirim OTP..."
              : isRateLimited
                ? `Tunggu ${formatTime(remainingTime)}`
                : "Kirim OTP"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MemberLogin;
