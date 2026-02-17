import { Link, useNavigate } from "react-router-dom";
import { LogOut, Users, Calendar, BarChart3, Settings, Menu, ChevronDown, UserRound, Building2, Briefcase } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, logout, isReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, [isReady, user, navigate]);

  const handleConfirmLogout = () => {
    logout();
    navigate("/");
    setShowLogoutModal(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!isReady || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 inset-x-0 z-50">
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
              <h1 className="hidden sm:block text-lg font-bold text-rra-navy">RRA Admin Panel</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="hidden sm:flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-rra-navy text-white rounded-full text-xs font-bold">
                  {user?.fullName?.split(" ").map(n => n[0]).join("").toUpperCase() || "A"}
                </div>
                <span>{user?.fullName}</span>
                <span className="text-xs bg-blue-100 text-rra-blue px-2 py-1 rounded-full">Admin</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-xs text-gray-500 capitalize">Admin</p>
                  </div>
                  <nav className="py-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                      <Users className="h-4 w-4" />
                      Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                      <Calendar className="h-4 w-4" />
                      My Appointments
                    </button>
                  </nav>
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={() => {
                        setShowLogoutModal(true);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16 h-full">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-64px)] ${
            sidebarOpen ? "w-64" : "w-0"
          } hidden lg:block bg-rra-navy text-white transition-all duration-300 overflow-y-auto z-30`}
        >
          <nav className="p-6 space-y-2">
            <Link
              to="/admin-dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive("/admin-dashboard")
                  ? "bg-blue-900 text-white font-medium"
                  : "hover:bg-blue-900"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              to="/admin-appointments"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive("/admin-appointments")
                  ? "bg-blue-900 text-white font-medium"
                  : "hover:bg-blue-900"
              }`}
            >
              <Calendar className="h-5 w-5" />
              All Appointments
            </Link>
            <Link
              to="/admin-staff"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive("/admin-staff")
                  ? "bg-blue-900 text-white font-medium"
                  : "hover:bg-blue-900"
              }`}
            >
              <Users className="h-5 w-5" />
              Staff Management
            </Link>
            <Link
              to="/admin-departments"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive("/admin-departments")
                  ? "bg-blue-900 text-white font-medium"
                  : "hover:bg-blue-900"
              }`}
            >
              <Building2 className="h-5 w-5" />
              Departments
            </Link>
            <Link
              to="/admin-services"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive("/admin-services")
                  ? "bg-blue-900 text-white font-medium"
                  : "hover:bg-blue-900"
              }`}
            >
              <Briefcase className="h-5 w-5" />
              Services
            </Link>
            <Link
              to="/admin-clients"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive("/admin-clients")
                  ? "bg-blue-900 text-white font-medium"
                  : "hover:bg-blue-900"
              }`}
            >
              <UserRound className="h-5 w-5" />
              Client Management
            </Link>
            <Link
              to="/admin-reports"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive("/admin-reports")
                  ? "bg-blue-900 text-white font-medium"
                  : "hover:bg-blue-900"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              Reports & Analytics
            </Link>
            <div className="border-t border-blue-800 mt-6 pt-6">
              <Link
                to="/admin-settings"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive("/admin-settings")
                    ? "bg-blue-900 text-white font-medium"
                    : "hover:bg-blue-900"
                }`}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-64" : "lg:ml-0"} h-[calc(100vh-64px)] overflow-y-auto`}>
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to logout? Any unsaved changes will be lost.</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
