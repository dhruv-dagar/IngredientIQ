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

  const updateUser = (patch) => {
    if (!patch) return;
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async (activeToken = token) => {
    if (!activeToken) {
      setUser(null);
      return false;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (!res.ok) throw new Error('Authentication session expired.');
      const data = await res.json();
      if (!data.success || !data.user) throw new Error('Could not load user profile.');
      
      saveUser(data.user);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const initGuest = async () => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        saveUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.error("Auto guest session failed:", err);
    }
    return null;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        const ok = await refreshUser(token);
        if (!ok) {
          await initGuest();
        }
      } else {
        await initGuest();
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const currentGuestId = user?.isGuest ? (user.id || user._id) : undefined;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          username, 
          password,
          guestUserId: currentGuestId,
          guestToken: user?.isGuest ? token : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        saveUser(data.user);
        try {
          Object.keys(sessionStorage).forEach((k) => {
            if (k.startsWith('streak_notified_')) sessionStorage.removeItem(k);
          });
        } catch (e) {}
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Could not connect to the backend server. Is it running?' };
    }
  };

  const register = async (username, password) => {
    try {
      const currentGuestId = user?.isGuest ? (user.id || user._id) : undefined;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          username, 
          password,
          guestUserId: currentGuestId,
          guestToken: user?.isGuest ? token : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.token && data.user) {
          setToken(data.token);
          localStorage.setItem('token', data.token);
          saveUser(data.user);
        }
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Could not connect to the backend server. Is it running?' };
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const currentGuestId = user?.isGuest ? (user.id || user._id) : undefined;
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          token: googleToken,
          guestUserId: currentGuestId,
          guestToken: user?.isGuest ? token : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        saveUser(data.user);
        try {
          Object.keys(sessionStorage).forEach((k) => {
            if (k.startsWith('streak_notified_')) sessionStorage.removeItem(k);
          });
        } catch (e) {}
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error(error);
      return { success: false, message: 'Could not connect to the backend server. Is it running?' };
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('streak_notified_')) sessionStorage.removeItem(k);
      });
    } catch (e) {}
    // Automatically reinitialize a clean guest session for seamless anonymous play
    await initGuest();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, googleLogin, logout, refreshUser, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
