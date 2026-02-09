import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ClientDashboard from "./dashboards/ClientDashboard";
import StaffDashboard from "./dashboards/StaffDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

export default function Dashboard() {
  const { user, isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isReady, navigate]);

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!user) {
    return null;
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case "client":
      return <ClientDashboard />;
    case "staff":
      return <StaffDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <ClientDashboard />;
  }
}
