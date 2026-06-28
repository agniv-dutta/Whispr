'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Pencil, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import apiClient from '@/lib/api';

export default function SetupProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    
    setLoading(true);
    try {
      const res = await apiClient.put('/users/me', {
        display_name: displayName,
        bio: bio
      });
      setUser(res.data);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark relative flex flex-col items-center justify-center px-4">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-[480px] flex flex-col items-center z-10 relative">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-black text-[#B53E17] tracking-tight mb-2">
            Setup Profile
          </h1>
          <p className="text-[15px] text-text-secondary">
            Personalize your identity on Whispr.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-[24px] border border-neutral-200 dark:border-neutral-700 shadow-dark p-8 w-full mb-6">
          <form onSubmit={handleComplete} className="space-y-6">
            
            {/* Photo Upload area */}
            <div className="flex flex-col items-center justify-center mb-8">
              <button 
                type="button"
                className="relative group flex flex-col items-center"
              >
                <div className="h-20 w-20 rounded-[20px] border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 group-hover:border-primary transition-colors mb-2">
                  <Camera className="h-8 w-8 text-neutral-400 group-hover:text-primary transition-colors" />
                  {/* Pencil badge */}
                  <div className="absolute bottom-6 -right-2 h-7 w-7 bg-primary rounded-full border-2 border-surface-light dark:border-surface-dark flex items-center justify-center shadow-sm">
                    <Pencil className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-text-secondary">
                  UPLOAD PHOTO
                </span>
                <span className="text-[11px] text-text-secondary mt-1">
                  Drag and drop or click to upload
                </span>
              </button>
            </div>

            {/* Display Name Input */}
            <div>
              <label className="block text-[12px] font-mono tracking-widest text-text-secondary uppercase mb-2">
                DISPLAY NAME
              </label>
              <input
                type="text"
                placeholder="How others will see you"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={cn(
                  'w-full px-4 py-3.5 rounded-[12px] border border-neutral-200 dark:border-neutral-700 text-[15px]',
                  'bg-neutral-50 dark:bg-neutral-800/50',
                  'text-text-primary dark:text-text-invert',
                  'placeholder:text-text-secondary/60',
                  'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                  'transition-all duration-200'
                )}
              />
            </div>

            {/* Bio Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[12px] font-mono tracking-widest text-text-secondary uppercase">
                  BIO (OPTIONAL)
                </label>
                <span className="text-[10px] font-mono text-text-secondary">
                  {bio.length}/140
                </span>
              </div>
              <textarea
                placeholder="Tell the world something about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 140))}
                rows={3}
                className={cn(
                  'w-full px-4 py-3.5 rounded-[12px] border border-neutral-200 dark:border-neutral-700 text-[15px] resize-none',
                  'bg-neutral-50 dark:bg-neutral-800/50',
                  'text-text-primary dark:text-text-invert',
                  'placeholder:text-text-secondary/60',
                  'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                  'transition-all duration-200'
                )}
              />
            </div>

            {error && (
              <p className="text-sm text-error font-medium flex items-center justify-center gap-1.5">
                <span>⚠</span> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className={cn(
                'w-full py-4 rounded-[12px] font-bold text-white text-[16px] flex items-center justify-center gap-2',
                'bg-primary hover:bg-[#E65A1E] active:bg-[#D94E12]',
                'shadow-lg shadow-primary/20',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-2'
              )}
            >
              {loading ? 'Saving...' : (
                <>
                  Create Account
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="text-[14px] font-medium text-text-secondary hover:text-text-primary dark:hover:text-text-invert transition-colors"
        >
          Skip for now, I'll do this later
        </button>
      </div>
    </div>
  );
}
