import { AuthState, AuthActions, User, UserPreferences } from '../types';

export interface AuthSlice extends AuthState, AuthActions {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authSlice = (set: any, get: any) => ({
  // Initial auth state
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  preferences: {
    theme: 'system',
    language: 'en',
    autoplay: false,
    notifications: true,
  },

  // Auth actions
  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  setSession: (session: AuthState['session']) => {
    set({ session });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  updatePreferences: (preferences: Partial<UserPreferences>) => {
    const currentPrefs = get().preferences;
    set({
      preferences: {
        ...currentPrefs,
        ...preferences,
      },
    });
  },

  logout: () => {
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
});