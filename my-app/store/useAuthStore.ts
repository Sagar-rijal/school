import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  setAuthUser: (user: AuthUser) => void;
  clearAuthUser: () => void;
}

// Persisted so the sidebar still knows who is signed in after a refresh.
// The access-token cookie remains the source of truth for authentication.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuthUser: (user) => set({ user }),
      clearAuthUser: () => set({ user: null }),
    }),
    { name: "auth-user" }
  )
);
