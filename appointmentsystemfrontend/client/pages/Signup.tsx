import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
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

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [error, setError] = useState("");
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

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
            setError("Google signup failed. Please try again.");
            return;
          }
          const result = await loginWithGoogle(credential);
          if (result.ok) {
            navigate("/dashboard");
          } else {
            setError(result.error || "Google signup failed");
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.terms) {
      setError("You must accept the terms and conditions");
      return;
    }

    const result = await signup(formData.email, formData.password, formData.fullName);
    if (result.ok) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
      <div className="mx-auto w-full max-w-4xl">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl md:grid md:grid-cols-2">
          <div className="hidden md:flex flex-col justify-between bg-rra-navy px-7 py-8 text-white">
            <div>
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F2e01e69b3779464b92ed3fb015b92f56%2Fad1b5faec75e4f65a92433b7fe3f0202?format=webp&width=100"
                alt="RRA Logo"
                className="h-12"
              />
              <h2 className="mt-6 text-2xl font-bold leading-tight">Client Registration</h2>
            </div>
            <p className="text-sm text-blue-100">Only client accounts can be created from this page.</p>
          </div>

          <div className="p-4 sm:p-5 md:p-6">
            <div className="mb-3 text-center md:text-left">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F2e01e69b3779464b92ed3fb015b92f56%2Fad1b5faec75e4f65a92433b7fe3f0202?format=webp&width=100"
                alt="RRA Logo"
                className="mx-auto h-10 md:hidden"
              />
              <h1 className="mt-2 text-2xl font-bold text-rra-navy sm:text-[1.7rem]">Create Client Account</h1>
              <p className="mt-1 text-sm text-gray-600">Join RRA's appointment system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base outline-none transition focus:border-transparent focus:ring-2 focus:ring-rra-blue"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base outline-none transition focus:border-transparent focus:ring-2 focus:ring-rra-blue"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base outline-none transition focus:border-transparent focus:ring-2 focus:ring-rra-blue"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="********"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base outline-none transition focus:border-transparent focus:ring-2 focus:ring-rra-blue"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="mt-1 rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{" "}
                  <a href="#" className="text-rra-blue hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-rra-blue hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </div>

              <button
                type="submit"
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-rra-blue py-2.5 font-semibold text-white transition hover:bg-rra-navy"
              >
                <UserPlus className="h-5 w-5" />
                Create Account
              </button>
            </form>

            <div className="mt-2 text-center text-sm text-gray-600">
              <p className="mb-2">Prefer Google?</p>
              {GOOGLE_CLIENT_ID ? (
                <div className="flex justify-center">
                  <div ref={googleButtonRef} />
                </div>
              ) : null}
            </div>

            <p className="mt-3 text-center text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-rra-blue transition hover:text-rra-navy">
                Sign in
              </Link>
            </p>

            <div className="mt-2 text-center md:text-left">
              <Link to="/" className="text-gray-600 transition hover:text-rra-blue">
                &lt;- Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
