import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center max-w-md px-4">
        <div className="mb-8">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F2e01e69b3779464b92ed3fb015b92f56%2Fad1b5faec75e4f65a92433b7fe3f0202?format=webp&width=100"
            alt="RRA Logo"
            className="h-12 mx-auto mb-4"
          />
        </div>
        <h1 className="text-6xl font-bold text-rra-navy mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-2">Page Not Found</p>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="space-y-3">
          <Link
            to="/"
            className="inline-block w-full bg-rra-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-rra-navy transition"
          >
            Back to Home
          </Link>
          <Link
            to="/dashboard"
            className="inline-block w-full border-2 border-rra-blue text-rra-blue px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
