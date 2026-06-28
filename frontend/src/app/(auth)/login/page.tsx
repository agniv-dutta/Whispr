'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import type { User as AuthUser } from '@/lib/auth';
import { useAnalytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { ArrowLeft, Lock, Shield, Zap, Download } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const { trackLogin } = useAnalytics();
  const [error, setError] = useState('');
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    try {
      setStep('otp');
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return;
    
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { phone: `+91${phone.replace(/\D/g, '')}`, otp: code });
      setToken(res.data.access_token);
      setUser(res.data.user as AuthUser);
      trackLogin();
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark relative flex flex-col">
      {/* Background radial gradient similar to design */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {step === 'otp' && (
        <div className="absolute top-8 left-8 z-10">
          <button
            onClick={() => { setStep('phone'); setError(''); setOtp(['', '', '', '', '', '']); }}
            className="flex items-center gap-1.5 text-[15px] font-bold text-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-4 z-10 relative">
        {step === 'phone' ? (
          <div className="w-full max-w-[420px] flex flex-col items-center">
            {/* Brand */}
            <div className="text-center mb-8">
              <h1 className="text-[32px] font-black text-primary tracking-tight leading-[1.2]">
                Whispr
              </h1>
              <p className="text-[12px] text-text-secondary mt-0.5 font-medium tracking-[0.1em] uppercase">
                Secure Messaging
              </p>
            </div>

            {/* Form card */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-[24px] border border-neutral-200 dark:border-neutral-700 shadow-dark p-8 w-full">
              <h2 className="text-[14px] font-medium text-text-primary dark:text-text-invert mb-4">
                Enter your phone number
              </h2>

              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="relative flex items-center group">
                  <div className={cn(
                    "absolute left-0 inset-y-0 flex items-center pl-4 pr-3 border-r border-neutral-200 dark:border-neutral-700",
                    "text-[16px] font-semibold text-text-primary dark:text-text-invert bg-neutral-50 dark:bg-neutral-800/50 rounded-l-[12px]"
                  )}>
                    <span className="mr-2 text-[18px]">🇮🇳</span>
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="00000-00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={cn(
                      'w-full pl-[96px] pr-4 py-3.5 rounded-[12px] border-2 text-[16px] font-medium',
                      'bg-bg-light dark:bg-bg-dark',
                      'text-text-primary dark:text-text-invert',
                      'placeholder:text-text-secondary/50',
                      'border-primary', // Active typing state as per design
                      'focus:outline-none focus:border-primary focus:ring-0',
                      'transition-all duration-200'
                    )}
                  />
                </div>

                <p className="text-[13px] text-text-secondary leading-[1.6] text-center px-2">
                  Whispr will send a one-time verification code via SMS. Carrier rates may apply.
                </p>

                {error && (
                  <p className="text-sm text-error font-medium flex items-center justify-center gap-1.5">
                    <span>⚠</span> {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !phone.trim()}
                  className={cn(
                    'w-full py-3.5 rounded-[12px] font-bold text-white text-[16px]',
                    'bg-primary hover:bg-[#E65A1E] active:bg-[#D94E12]',
                    'shadow-lg shadow-primary/20',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
                  )}
                >
                  {loading ? 'Sending...' : 'Next'}
                </button>
              </form>
            </div>

            <button className="mt-8 flex items-center gap-2 text-[14px] font-medium text-secondary hover:text-primary transition-colors">
              Don't have Whispr? Download here
              <Download className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="w-full max-w-[480px] flex flex-col items-center">
            {/* Lock Icon */}
            <div className="h-16 w-16 bg-[#B53E17] rounded-[16px] flex items-center justify-center mb-6 shadow-lg">
              <Lock className="h-7 w-7 text-white" />
            </div>

            <h1 className="text-[32px] font-black text-text-primary dark:text-text-invert tracking-tight mb-2 text-center">
              Enter verification code
            </h1>
            <p className="text-[15px] text-text-secondary mb-10 text-center">
              We sent an SMS to <span className="font-bold text-text-primary dark:text-text-invert">+91 {phone || '98765 43210'}</span>
            </p>

            <form onSubmit={handleOTPSubmit} className="w-full flex flex-col items-center">
              <div className="flex items-center gap-3 md:gap-4 justify-center mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      if (el) otpRefs.current[index] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={cn(
                      'w-[48px] h-[56px] md:w-[56px] md:h-[64px] rounded-[12px] border-2 text-center text-[24px] font-bold',
                      'bg-bg-light dark:bg-bg-dark',
                      'text-text-primary dark:text-text-invert',
                      digit ? 'border-primary' : 'border-neutral-200 dark:border-neutral-700',
                      'focus:outline-none focus:border-primary focus:ring-0',
                      'transition-all duration-200'
                    )}
                  />
                ))}
              </div>

              <p className="text-[14px] text-text-secondary mb-6 text-center">
                Didn't receive the code? <button type="button" className="font-semibold text-[#8BB7D6] hover:text-secondary transition-colors">Resend code in 42s</button>
              </p>

              {error && (
                <p className="text-sm text-error font-medium flex items-center justify-center gap-1.5 mb-4">
                  <span>⚠</span> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className={cn(
                  'w-full max-w-[320px] py-3.5 rounded-[12px] font-bold text-white text-[16px] flex items-center justify-center gap-2',
                  'bg-primary hover:bg-[#E65A1E] active:bg-[#D94E12]',
                  'shadow-lg shadow-primary/20',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
                )}
              >
                {loading ? 'Verifying...' : (
                  <>
                    Verify
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </>
                )}
              </button>
            </form>
            
            {/* We omit the 3D illustration here but keep the layout ready */}
            <div className="mt-12 w-full max-w-[320px] h-[120px] bg-neutral-200 dark:bg-neutral-800 rounded-[16px] overflow-hidden flex items-center justify-center relative">
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
               <Shield className="h-16 w-16 text-white/50 relative z-10" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      {step === 'phone' && (
        <div className="pb-8 pt-4 flex flex-col items-center gap-2 z-10">
          <div className="flex items-center gap-4 text-neutral-400">
            <Lock className="h-4 w-4" />
            <Shield className="h-4 w-4" />
            <Zap className="h-4 w-4" />
          </div>
          <p className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
            WHISPR_PROTOCOL_v4.2
          </p>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-neutral-500">
            <span>5M+ users</span>
            <span className="w-1 h-1 rounded-full bg-neutral-600" />
            <span>2B+ messages daily</span>
            <span className="w-1 h-1 rounded-full bg-neutral-600" />
            <span>99.9% uptime</span>
          </div>
        </div>
      )}
    </div>
  );
}
