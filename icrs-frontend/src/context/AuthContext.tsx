import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import axios from 'axios';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const TOKEN_KEY = 'icrs_token';
  const USER_KEY = 'icrs_user';

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  // 🔥 Always attach token to axios
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${token}`;
    }
  }, [token]);

  const login = async (
    email: string,
    password: string
  ): Promise<User> => {
    // 1️⃣ Login → get raw JWT
    const loginResponse = await axios.post(
      'http://localhost:8080/api/auth/login',
      { email, password }
    );

    const receivedToken = loginResponse.data;

    if (!receivedToken || typeof receivedToken !== 'string') {
      throw new Error('Invalid token received');
    }

    localStorage.setItem(TOKEN_KEY, receivedToken);
    setToken(receivedToken);

    axios.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${receivedToken}`;

    // 2️⃣ Fetch profile
    const profileResponse = await axios.get(
      'http://localhost:8080/api/users/me'
    );

    const fullUser: User = profileResponse.data;

    localStorage.setItem(USER_KEY, JSON.stringify(fullUser));
    setUser(fullUser);

    return fullUser;
  };

  const register = async (data: any): Promise<void> => {
    // 1️⃣ Register → usually backend creates a user and optionally returns a JWT or success message
    const registerResponse = await axios.post(
      'http://localhost:8080/api/auth/register',
      data
    );

    // If the backend requires a login after registration, we just return void.
    // If it returns a token upon registration, we can login the user immediately here.
    // For now, let's assume it returns a successful response message, and the user must login.
    return registerResponse.data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};