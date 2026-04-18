import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, KeyRound, Mail } from "lucide-react";
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
            },
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
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const {
    signup,
    loginWithGoogle,
    pendingSignupUser,
    verifySignupOtp,
    resendSignupOtp,
    clearPendingSignup,
  } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const isOtpStep = !!pendingSignupUser;

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-google-identity='true']",
    );

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
            if (result.requiresOtp) {
              setError("");
              setSuccess(
                result.message || "Verification code sent to your email.",
              );
              return;
            }
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
    setError("");
    setSuccess("");

    if (isOtpStep) {
      if (!otpCode.trim()) {
        setError("Please enter the verification code.");
        return;
      }

      setSubmitting(true);
      const result = await verifySignupOtp(otpCode.trim());
      setSubmitting(false);
      if (result.ok) {
        navigate("/dashboard");
      } else {
        setError(result.error || "Verification failed. Please try again.");
      }
      return;
    }

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
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

    setSubmitting(true);
    const result = await signup(
      formData.email,
      formData.password,
      formData.fullName,
    );
    setSubmitting(false);
    if (result.ok) {
      if (result.requiresOtp) {
        setOtpCode("");
        setSuccess(result.message || "Verification code sent to your email.");
        return;
      }
      navigate("/dashboard");
    } else {
      setError(result.error || "Signup failed. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setResendingOtp(true);
    const result = await resendSignupOtp();
    setResendingOtp(false);
    if (result.ok) {
      setSuccess(result.message || "A new verification code has been sent.");
    } else {
      setError(result.error || "Failed to resend verification code.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
      <div className="mx-auto w-full max-w-4xl">
        {!isOtpStep ? (
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl md:grid md:grid-cols-2">
            <div className="hidden md:flex flex-col justify-between bg-rra-navy px-7 py-8 text-white">
              <div>
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F2e01e69b3779464b92ed3fb015b92f56%2Fad1b5faec75e4f65a92433b7fe3f0202?format=webp&width=100"
                  alt="RRA Logo"
                  className="h-12"
                />
                <h2 className="mt-6 text-2xl font-bold leading-tight">
                  Client Registration
                </h2>
              </div>
              <p className="text-sm text-blue-100">
                Only client accounts can be created from this page.
              </p>
            </div>

            <div className="p-4 sm:p-5 md:p-6">
              <div className="mb-3 text-center md:text-left">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F2e01e69b3779464b92ed3fb015b92f56%2Fad1b5faec75e4f65a92433b7fe3f0202?format=webp&width=100"
                  alt="RRA Logo"
                  className="mx-auto h-10 md:hidden"
                />
                <h1 className="mt-2 text-2xl font-bold text-rra-navy sm:text-[1.7rem]">
                  Create Client Account
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Join RRA's appointment system
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2.5">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
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
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
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
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Password
                    </label>
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
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
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
                  disabled={submitting}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-rra-blue py-2.5 font-semibold text-white transition hover:bg-rra-navy disabled:opacity-70"
                >
                  <UserPlus className="h-5 w-5" />
                  {submitting ? "Creating Account..." : "Create Account"}
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
                <Link
                  to="/login"
                  className="font-semibold text-rra-blue transition hover:text-rra-navy"
                >
                  Sign in
                </Link>
              </p>

              <div className="mt-2 text-center md:text-left">
                <Link
                  to="/"
                  className="text-gray-600 transition hover:text-rra-blue"
                >
                  &lt;- Back to Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="p-6">
              <div className="text-center mb-4">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F2e01e69b3779464b92ed3fb015b92f56%2Fad1b5faec75e4f65a92433b7fe3f0202?format=webp&width=100"
                  alt="RRA Logo"
                  className="h-10 mx-auto mb-2"
                />
                <h1 className="text-xl font-bold text-rra-navy">
                  Verify Your Email
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Enter the 6-digit code sent to {pendingSignupUser?.email}.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                    {success}
                  </div>
                )}

                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-900">
                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Verify your email to activate your account.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="6-digit code"
                    inputMode="numeric"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg tracking-[0.35em] text-center text-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none transition"
                  />
                </div>

                <div className="flex justify-between items-center pt-1 text-sm">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendingOtp}
                    className="text-rra-blue hover:text-rra-navy transition disabled:opacity-70"
                  >
                    {resendingOtp ? "Sending..." : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCode("");
                      setError("");
                      setSuccess("");
                      clearPendingSignup();
                    }}
                    className="text-gray-600 hover:text-rra-blue transition"
                  >
                    Start over
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-rra-blue text-white py-2 rounded-lg font-semibold hover:bg-rra-navy transition flex items-center justify-center gap-2 mt-3 disabled:opacity-70"
                >
                  <KeyRound className="h-5 w-5" />
                  {submitting ? "Verifying..." : "Verify Email"}
                </button>
              </form>

              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="text-xs text-gray-600 hover:text-rra-blue transition"
                >
                  Already verified? Sign in
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
