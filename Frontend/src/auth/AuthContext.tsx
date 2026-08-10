import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout, signup as apiSignup, LoginPayload, SignupPayload } from '../api/api';

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  availability: string;
  interests: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser as User);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (payload: LoginPayload) => {
    const result = await apiLogin(payload);
    setUser(result.user as User);
  };

  const signup = async (payload: SignupPayload) => {
    const result = await apiSignup(payload);
    setUser(result.user as User);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
