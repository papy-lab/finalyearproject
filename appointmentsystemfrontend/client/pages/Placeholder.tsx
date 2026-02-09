import { Link } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F2e01e69b3779464b92ed3fb015b92f56%2Fad1b5faec75e4f65a92433b7fe3f0202?format=webp&width=100"
                alt="RRA Logo"
                className="h-8"
              />
              <h1 className="hidden sm:block text-lg font-bold text-rra-navy">RRA Appointments</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-0"
          } hidden lg:block bg-rra-navy text-white transition-all duration-300`}
        >
          <nav className="p-6 space-y-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-900 transition"
            >
              <span>📊</span>
              Dashboard
            </Link>
            <Link
              to="/appointments"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-900 transition"
            >
              <span>📅</span>
              Appointments
            </Link>
            <Link
              to="/schedule"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-900 transition"
            >
              <span>⏰</span>
              Schedule
            </Link>
            <Link
              to="/notifications"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-900 transition"
            >
              <span>🔔</span>
              Notifications
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-900 transition"
            >
              <span>📈</span>
              Reports
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">{icon || "📋"}</div>
                <h1 className="text-3xl font-bold text-rra-navy mb-3">{title}</h1>
                <p className="text-gray-600 mb-8">{description}</p>
                <div className="bg-blue-50 border-l-4 border-rra-blue p-4 rounded text-left">
                  <p className="text-sm text-gray-700">
                    <strong>This page is coming soon!</strong> Continue prompting to fill in this page's content.
                  </p>
                </div>
                <Link
                  to="/dashboard"
                  className="inline-block mt-8 bg-rra-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-rra-navy transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
