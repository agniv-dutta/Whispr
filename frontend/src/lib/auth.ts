import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  phone: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  username: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  ready: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      ready: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Mark ready after hydration completes (may be sync with localStorage)
if (typeof window !== 'undefined' && useAuthStore.persist) {
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.setState({ ready: true });
  } else {
    useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.setState({ ready: true });
    });
  }
}
