import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { parseJwt, type JwtPayload } from '../security/jwt';

const TOKEN_KEY = 'auth.accessToken';
const REFRESH_KEY = 'auth.refreshToken';

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string | number;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3010';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY));
  const profile = ref<JwtPayload | null>(parseJwt(accessToken.value));

  const isAuthed = computed(() => Boolean(accessToken.value));
  const permissions = computed(() => profile.value?.permissions ?? []);

  function persistTokens(result: LoginResult) {
    accessToken.value = result.accessToken;
    refreshToken.value = result.refreshToken;
    profile.value = parseJwt(result.accessToken);

    localStorage.setItem(TOKEN_KEY, result.accessToken);
    localStorage.setItem(REFRESH_KEY, result.refreshToken);
  }

  async function login(input: { email: string; password: string; tenantId: string }) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const result = (await response.json()) as LoginResult;
    persistTokens(result);
  }

  async function refresh() {
    if (!refreshToken.value) {
      throw new Error('Missing refresh token');
    }

    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshToken.value }),
    });

    if (!response.ok) {
      logout();
      throw new Error('Refresh failed');
    }

    const result = (await response.json()) as LoginResult;
    persistTokens(result);
  }

  function hasPermission(permission: string): boolean {
    return permissions.value.includes(permission);
  }

  function logout() {
    accessToken.value = null;
    refreshToken.value = null;
    profile.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  return {
    accessToken,
    refreshToken,
    profile,
    isAuthed,
    permissions,
    login,
    refresh,
    hasPermission,
    logout,
  };
});
