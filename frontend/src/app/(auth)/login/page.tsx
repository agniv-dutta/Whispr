'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    console.log('Phone:', phone);
    setStep('otp');
    setError('');
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(err.detail);
      }

      const data = await res.json();
      console.log('Token:', data.access_token?.substring(0, 30) + '…');

      setToken(data.access_token);
      setUser(data.user);
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-black text-white">W</span>
          </div>
          <h1 className="text-[32px] font-black text-white mb-1">Whispr</h1>
          <p className="text-gray-400 text-sm">Secure · Private · Real-time</p>
        </div>

        {step === 'phone' ? (
          /* ── PHONE STEP ── */
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <label className="block text-gray-300 text-sm font-medium">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
            <button
              type="submit"
              disabled={!phone.trim()}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-orange-600 transition"
            >
              Next
            </button>
          </form>
        ) : (
          /* ── OTP STEP ── */
          <form onSubmit={handleOTPSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="text-orange-400 text-sm hover:underline"
            >
              ← Back
            </button>

            <label className="block text-gray-300 text-sm font-medium">
              Verification Code
            </label>
            <p className="text-gray-400 text-xs mb-2">
              Enter the 6-digit code sent to {phone}
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-2xl tracking-widest font-mono text-center"
            />
            <p className="text-xs text-gray-500 text-center">
              Demo OTP: <span className="font-mono font-bold text-orange-400">123456</span>
            </p>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-lg disabled:opacity-50 hover:bg-orange-600 transition"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
