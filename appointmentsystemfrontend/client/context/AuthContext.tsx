import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  api,
  ApiRequestError,
  ApiUserRole,
  AuthResponse,
  UserProfile,
} from "@/lib/api";

export type UserRole = ApiUserRole;

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

export interface PendingOtpUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  phone?: string;
  challengeId: string;
  message?: string;
}

export interface PendingSignupUser {
  email: string;
  fullName: string;
  challengeId: string;
  message?: string;
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
  pendingOtpUser: PendingOtpUser | null;
  pendingSignupUser: PendingSignupUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  userRole: UserRole | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{
    ok: boolean;
    requiresOtp?: boolean;
    message?: string;
    error?: string;
  }>;
  loginWithGoogle: (
    idToken: string,
  ) => Promise<{
    ok: boolean;
    requiresOtp?: boolean;
    message?: string;
    error?: string;
  }>;
  verifyOtp: (code: string) => Promise<{ ok: boolean; error?: string }>;
  resendOtp: () => Promise<{ ok: boolean; message?: string; error?: string }>;
  clearPendingOtp: () => void;
  logout: () => void;
  signup: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{
    ok: boolean;
    requiresOtp?: boolean;
    message?: string;
    error?: string;
  }>;
  verifySignupOtp: (code: string) => Promise<{ ok: boolean; error?: string }>;
  resendSignupOtp: () => Promise<{
    ok: boolean;
    message?: string;
    error?: string;
  }>;
  clearPendingSignup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("rra_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [pendingOtpUser, setPendingOtpUser] = useState<PendingOtpUser | null>(
    null,
  );
  const [pendingSignupUser, setPendingSignupUser] =
    useState<PendingSignupUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  const applyAuth = (response: AuthResponse) => {
    if (!response.token) {
      throw new Error("Authentication token was not returned.");
    }
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

  const startOtpChallenge = (response: AuthResponse) => {
    if (!response.challengeId) {
      throw new Error("Login verification challenge was not created.");
    }
    setPendingOtpUser({
      id: response.id,
      email: response.email,
      fullName: response.fullName,
      role: response.role,
      department: response.department ?? undefined,
      phone: response.phone ?? undefined,
      challengeId: response.challengeId,
      message: response.message ?? undefined,
    });
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<{
    ok: boolean;
    requiresOtp?: boolean;
    message?: string;
    error?: string;
  }> => {
    try {
      const response = await api.login(email, password);
      if (response.requiresOtp) {
        startOtpChallenge(response);
        return {
          ok: true,
          requiresOtp: true,
          message: response.message ?? "Verification code sent.",
        };
      }
      applyAuth(response);
      setPendingOtpUser(null);
      return { ok: true, requiresOtp: false };
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const body = error.responseBody ? ` | body: ${error.responseBody}` : "";
        return {
          ok: false,
          error: `${error.message} | status: ${error.status} | url: ${error.url}${body}`,
        };
      }
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  };

  const loginWithGoogle = async (
    idToken: string,
  ): Promise<{
    ok: boolean;
    requiresOtp?: boolean;
    message?: string;
    error?: string;
  }> => {
    try {
      const response = await api.googleLogin(idToken);
      if (response.requiresOtp) {
        startOtpChallenge(response);
        return {
          ok: true,
          requiresOtp: true,
          message: response.message ?? "Verification code sent.",
        };
      }
      applyAuth(response);
      setPendingOtpUser(null);
      return { ok: true, requiresOtp: false };
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const body = error.responseBody ? ` | body: ${error.responseBody}` : "";
        return {
          ok: false,
          error: `${error.message} | status: ${error.status} | url: ${error.url}${body}`,
        };
      }
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Google login failed",
      };
    }
  };

  const verifyOtp = async (
    code: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!pendingOtpUser?.challengeId) {
      return {
        ok: false,
        error: "Your login session expired. Please sign in again.",
      };
    }

    try {
      const response = await api.verifyOtp(pendingOtpUser.challengeId, code);
      applyAuth(response);
      setPendingOtpUser(null);
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const body = error.responseBody ? ` | body: ${error.responseBody}` : "";
        return {
          ok: false,
          error: `${error.message} | status: ${error.status} | url: ${error.url}${body}`,
        };
      }
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "OTP verification failed",
      };
    }
  };

  const resendOtp = async (): Promise<{
    ok: boolean;
    message?: string;
    error?: string;
  }> => {
    if (!pendingOtpUser?.challengeId) {
      return {
        ok: false,
        error: "Your login session expired. Please sign in again.",
      };
    }

    try {
      const response = await api.resendOtp(pendingOtpUser.challengeId);
      return { ok: true, message: response.message };
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const body = error.responseBody ? ` | body: ${error.responseBody}` : "";
        return {
          ok: false,
          error: `${error.message} | status: ${error.status} | url: ${error.url}${body}`,
        };
      }
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to resend OTP",
      };
    }
  };

  const clearPendingOtp = () => {
    setPendingOtpUser(null);
  };

  const logout = () => {
    setUser(null);
    setPendingOtpUser(null);
    setPendingSignupUser(null);
    localStorage.removeItem("rra_user");
    localStorage.removeItem("rra_token");
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<{
    ok: boolean;
    requiresOtp?: boolean;
    message?: string;
    error?: string;
  }> => {
    try {
      const response = await api.register({ email, password, fullName });
      if (response.requiresOtp) {
        setPendingSignupUser({
          email: response.email,
          fullName: response.fullName,
          challengeId: response.challengeId!,
          message: response.message ?? undefined,
        });
        return {
          ok: true,
          requiresOtp: true,
          message: response.message ?? "Verification code sent.",
        };
      }
      applyAuth(response);
      setPendingSignupUser(null);
      return { ok: true, requiresOtp: false };
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const body = error.responseBody ? ` | body: ${error.responseBody}` : "";
        return {
          ok: false,
          error: `${error.message} | status: ${error.status} | url: ${error.url}${body}`,
        };
      }
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Signup failed",
      };
    }
  };

  const verifySignupOtp = async (
    code: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!pendingSignupUser?.challengeId) {
      return {
        ok: false,
        error: "Your signup session expired. Please sign up again.",
      };
    }

    try {
      const response = await api.verifySignupOtp(
        pendingSignupUser.challengeId,
        code,
      );
      applyAuth(response);
      setPendingSignupUser(null);
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const body = error.responseBody ? ` | body: ${error.responseBody}` : "";
        return {
          ok: false,
          error: `${error.message} | status: ${error.status} | url: ${error.url}${body}`,
        };
      }
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  };

  const resendSignupOtp = async (): Promise<{
    ok: boolean;
    message?: string;
    error?: string;
  }> => {
    if (!pendingSignupUser?.challengeId) {
      return {
        ok: false,
        error: "Your signup session expired. Please sign up again.",
      };
    }

    try {
      const response = await api.resendSignupOtp(pendingSignupUser.challengeId);
      return { ok: true, message: response.message };
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const body = error.responseBody ? ` | body: ${error.responseBody}` : "";
        return {
          ok: false,
          error: `${error.message} | status: ${error.status} | url: ${error.url}${body}`,
        };
      }
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to resend code",
      };
    }
  };

  const clearPendingSignup = () => {
    setPendingSignupUser(null);
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
    pendingOtpUser,
    pendingSignupUser,
    isAuthenticated: !!user,
    isReady: initialized,
    userRole: user?.role || null,
    login,
    loginWithGoogle,
    verifyOtp,
    resendOtp,
    clearPendingOtp,
    logout,
    signup,
    verifySignupOtp,
    resendSignupOtp,
    clearPendingSignup,
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
