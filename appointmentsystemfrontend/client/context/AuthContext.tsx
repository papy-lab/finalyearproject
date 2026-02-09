import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiUserRole, AuthResponse, UserProfile } from "@/lib/api";

export type UserRole = ApiUserRole;

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

export interface DemoCredential {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  department?: string;
}

// Demo credentials for testing
export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: "client@rra.gov.rw",
    password: "demo123",
    fullName: "Jean Niyibizi",
    role: "client",
  },
  {
    email: "staff@rra.gov.rw",
    password: "demo123",
    fullName: "Marie Uwase",
    role: "staff",
    department: "Scheduling",
  },
  {
    email: "admin@rra.gov.rw",
    password: "demo123",
    fullName: "Director Admin",
    role: "admin",
    department: "Administration",
  },
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  userRole: UserRole | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("rra_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [initialized, setInitialized] = useState(false);

  const applyAuth = (response: AuthResponse) => {
    const newUser: User = {
      id: response.id,
      email: response.email,
      fullName: response.fullName,
      role: response.role,
      department: response.department ?? undefined,
      phone: response.phone ?? undefined,
    };
    setUser(newUser);
    localStorage.setItem("rra_user", JSON.stringify(newUser));
    localStorage.setItem("rra_token", response.token);
  };

  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const response = await api.login(email, password);
      applyAuth(response);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Login failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("rra_user");
    localStorage.removeItem("rra_token");
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const response = await api.register({ email, password, fullName, role });
      applyAuth(response);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Signup failed" };
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("rra_token");
    if (!token) {
      setInitialized(true);
      return;
    }

    api
      .me()
      .then((profile: UserProfile) => {
        const newUser: User = {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          role: profile.role,
          department: profile.department ?? undefined,
          phone: profile.phone ?? undefined,
        };
        setUser(newUser);
      })
      .catch(() => {
        logout();
      })
      .finally(() => setInitialized(true));
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isReady: initialized,
    userRole: user?.role || null,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
