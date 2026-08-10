import { create } from "zustand";
import {
  authApi,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
  type AuthUser,
  type ProfileUpdate,
} from "../api/client";
import { syncThemeFromUser } from "../services/themeSync";

const USER_CACHE_KEY = "tori_user_cache";

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function cacheUser(user: AuthUser): void {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
}

interface AuthState {
  user: AuthUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  signOut: () => Promise<void>;
  bootstrap: () => Promise<void>;
  updateProfile: (body: ProfileUpdate) => Promise<AuthUser>;
  deleteAccount: () => Promise<void>;
}

const token = typeof localStorage !== "undefined" ? getAccessToken() : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: token ? readCachedUser() : null,
  isSignedIn: !!token,
  isLoading: !!token,

  signIn: (user, accessToken, refreshToken) => {
    setTokens(accessToken, refreshToken);
    cacheUser(user);
    set({ user, isSignedIn: true, isLoading: false });
    void syncThemeFromUser(user.theme);
  },

  signOut: async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        /* ignore logout network errors */
      }
    }
    clearTokens();
    localStorage.removeItem(USER_CACHE_KEY);
    set({ user: null, isSignedIn: false, isLoading: false });
  },

  bootstrap: async () => {
    if (!getAccessToken()) {
      set({ user: null, isSignedIn: false, isLoading: false });
      return;
    }
    try {
      const user = await authApi.me();
      cacheUser(user);
      set({ user, isSignedIn: true, isLoading: false });
      await syncThemeFromUser(user.theme);
    } catch {
      clearTokens();
      localStorage.removeItem(USER_CACHE_KEY);
      set({ user: null, isSignedIn: false, isLoading: false });
    }
  },

  updateProfile: async (body) => {
    const user = await authApi.updateProfile(body);
    cacheUser(user);
    set({ user });
    return user;
  },

  deleteAccount: async () => {
    await authApi.deleteAccount();
    clearTokens();
    localStorage.removeItem(USER_CACHE_KEY);
    set({ user: null, isSignedIn: false, isLoading: false });
  },
}));

export function bootstrapAuthSession(): Promise<void> {
  return useAuthStore.getState().bootstrap();
}
