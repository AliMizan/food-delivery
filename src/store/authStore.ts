import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'customer' | 'restaurant' | 'rider';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string, role?: UserRole) => {
        // Mock authentication - in real app, this would call an API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user: User = {
          id: '1',
          email,
          name: email.split('@')[0],
          role: role || 'customer'
        };

        set({ user, isAuthenticated: true });
      },

      signup: async (email: string, password: string, name: string, role: UserRole) => {
        // Mock signup - in real app, this would call an API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user: User = {
          id: '1',
          email,
          name,
          role
        };

        set({ user, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);