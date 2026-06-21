import { create } from 'zustand';

// 1. Define what a User looks like
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | null; // Adjust these if your backend uses different names
}

// 2. Define what the Store can hold and do
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuthUser: (user: User) => void;
  logout: () => void;
}

// 3. Create the actual store (with the TypeScript fix applied!)
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  
  // Action to save the user after a successful login
  setAuthUser: (user) => set({ user, isAuthenticated: true }),
  
  // Action to clear the vault when they log out
  logout: () => set({ user: null, isAuthenticated: false }),
}));