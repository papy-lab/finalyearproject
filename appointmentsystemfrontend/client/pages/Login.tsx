import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GOOGLE_CLIENT_ID } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            }
          ) => void;
        };
      };
    };
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const handleMissingGoogleConfig = () => {
    setError("Google sign-in is not configured yet. Add VITE_GOOGLE_CLIENT_ID in appointmentsystemfrontend/.env");
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-google-identity='true']");

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) {
        return;
      }
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          if (!credential) {
            setError("Google login failed. Please try again.");
            return;
          }
          const result = await loginWithGoogle(credential);
          if (result.ok) {
            navigate("/dashboard");
          } else {
            if ((result.error || "").toLowerCase().includes("staff/admin")) {
              setError("Clients can sign in with Google or email/password.");
            } else {
              setError(result.error || "Google login failed");
            }
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 360,
        text: "continue_with",
      });
    };

    if (existingScript) {
      initializeGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = initializeGoogle;
    document.body.appendChild(script);
  }, [loginWithGoogle, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    const result = await login(email, password);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid email or password. Please try again or use demo credentials below.");
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F2e01e69b3779464b92ed3fb015b92f56%2Fad1b5faec75e4f65a92433b7fe3f0202?format=webp&width=100"
              alt="RRA Logo"
              className="h-12 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-rra-navy">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none transition"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-rra-blue hover:text-rra-navy transition">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-rra-blue text-white py-2 rounded-lg font-semibold hover:bg-rra-navy transition flex items-center justify-center gap-2 mt-6"
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </button>

            <div className="pt-2 flex justify-center">
              {GOOGLE_CLIENT_ID ? (
                <div ref={googleButtonRef} />
              ) : (
                <button
                  type="button"
                  onClick={handleMissingGoogleConfig}
                  className="w-full max-w-[360px] rounded-lg border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  aria-label="Sign in with Google (Clients only)"
                >
                  Sign in with Google (Clients only)
                </button>
              )}
            </div>
            <p className="text-center text-xs text-gray-500">
              Clients can sign in with Google or email/password.
            </p>
          </form>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-rra-blue font-semibold hover:text-rra-navy transition">
              Sign up
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-600 hover:text-rra-blue transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
