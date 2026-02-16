import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const result = await api.forgotPassword(email);
      setSuccess(result.message || "If that email exists, a verification code has been sent.");
      navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-rra-navy">Forgot Password</h1>
            <p className="text-gray-600 mt-2">Enter your email and we will send you a verification code.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rra-blue text-white py-2 rounded-lg font-semibold hover:bg-rra-navy transition disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-600">
            Got a code?{" "}
            <Link to="/reset-password" className="text-rra-blue font-semibold hover:text-rra-navy transition">
              Verify and reset
            </Link>
          </p>

          <p className="text-center mt-6 text-gray-600">
            Remember your password?{" "}
            <Link to="/login" className="text-rra-blue font-semibold hover:text-rra-navy transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
