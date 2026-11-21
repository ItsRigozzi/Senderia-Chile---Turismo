import React, { useState, useEffect, type ReactNode } from 'react';
import { authService, api, SESSION_EXPIRED_EVENT } from '../services/api';
import { AuthContext, type User } from './AuthContextValue';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión desde localStorage al cargar
  useEffect(() => {
    const savedToken = localStorage.getItem('senderia_token');
    const restoreSession = async () => {
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        setToken(savedToken);
        const response = await api.get('/auth/me');
        setUser(response.data.usuario);
        localStorage.setItem('senderia_user', JSON.stringify(response.data.usuario));
      } catch {
        localStorage.removeItem('senderia_token');
        localStorage.removeItem('senderia_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void restoreSession();
  }, []);

  // Si la API responde 401 (sesión vencida o inválida), se limpia el estado sin recargar la app.
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    const { usuario, token: newToken } = response.data;
    persistSession(usuario, newToken);
  };

  const register = async (nombre: string, email: string, password: string) => {
    await authService.register(nombre, email, password);
  };

  const verifyEmail = async (email: string, codigo: string) => {
    const response = await authService.verifyEmail(email, codigo);
    const { usuario, token: newToken } = response.data;
    persistSession(usuario, newToken);
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await authService.loginWithGoogle(credential);
    const { usuario, token: newToken } = response.data;
    persistSession(usuario, newToken);
  };

  const persistSession = (usuario: User, newToken: string) => {
    setUser(usuario);
    setToken(newToken);
    localStorage.setItem('senderia_token', newToken);
    localStorage.setItem('senderia_user', JSON.stringify(usuario));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('senderia_token');
    localStorage.removeItem('senderia_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.rol === 'admin',
        login,
        register,
        verifyEmail,
        loginWithGoogle,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
