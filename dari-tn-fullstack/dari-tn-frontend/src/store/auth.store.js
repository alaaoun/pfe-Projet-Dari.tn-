import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      token:        null,
      refreshToken: null,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, token: accessToken, refreshToken }),

      setTokens: (token, refreshToken) =>
        set({ token, refreshToken }),

      setUser: (user) => set({ user }),

      logout: () => set({ user: null, token: null, refreshToken: null }),

      isAuthenticated: () => !!get().token,

      isAdmin:  () => get().user?.role === 'admin',
      isAgent:  () => ['agent', 'admin'].includes(get().user?.role),
    }),
    {
      name: 'dari-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
