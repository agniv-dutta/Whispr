import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WhisprSocket } from "./websocket";

export interface User {
  id: string;
  phone: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string | null;
  is_online: boolean;
  created_at: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => {
        WhisprSocket.resetInstance();
        localStorage.removeItem("whispr-auth");
        set({ token: null, user: null });
      },
    }),
    { name: "whispr-auth" },
  ),
);
