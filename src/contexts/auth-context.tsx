import type { ReactNode } from 'react';
import type { UserProfile } from 'src/api/auth';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { authApi } from 'src/api/auth';

// ----------------------------------------------------------------------

type AuthState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type AuthContextType = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// ----------------------------------------------------------------------

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 初始化：检查是否已登录
  const initialize = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const { user } = await authApi.getProfile();
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        // token 无效，清除
        localStorage.removeItem('token');
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 登录
  const login = useCallback(async (username: string, password: string) => {
    const { token } = await authApi.login({ username, password });
    localStorage.setItem('token', token);

    const { user } = await authApi.getProfile();
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  // 退出登录
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  // 刷新用户信息
  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const { user } = await authApi.getProfile();
        setState((prev) => ({
          ...prev,
          user,
        }));
      } catch (error) {
        console.error('Failed to refresh profile:', error);
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      refreshProfile,
    }),
    [state, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ----------------------------------------------------------------------

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

