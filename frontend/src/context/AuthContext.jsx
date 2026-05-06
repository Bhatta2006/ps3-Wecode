import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('tl_token'));

  // On mount, if we have a stored token, restore user info from it
  useEffect(() => {
    if (token) {
      try {
        // JWT payload is base64 url-encoded — decode to get email
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ email: payload.sub });
      } catch {
        // Token is invalid/expired, clear it
        logout();
      }
    }
  }, []);

  const login = (accessToken) => {
    localStorage.setItem('tl_token', accessToken);
    setToken(accessToken);
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    setUser({ email: payload.sub });
  };

  const logout = () => {
    localStorage.removeItem('tl_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
