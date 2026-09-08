import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const saveUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const refreshUser = async (activeToken = token) => {
    if (!activeToken) {
      setUser(null);
      return false;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });

      if (!res.ok) {
        throw new Error('Authentication session expired.');
      }

      const data = await res.json();

      if (!data.success || !data.user) {
        throw new Error('Could not load user profile.');
      }

      saveUser(data.user);
      return true;
    } catch (error) {
      console.error(error);
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        await refreshUser(token);
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        saveUser(data.user);
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Could not connect to the backend server. Is it running?'
      };
    }
  };

  const register = async (username, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: 'Could not connect to the backend server. Is it running?'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, refreshUser, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
