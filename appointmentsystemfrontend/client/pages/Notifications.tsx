import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ClientNotifications from "./dashboards/ClientNotifications";
import PlaceholderPage from "./Placeholder";

export default function Notifications() {
  const { user } = useAuth();

  if (user?.role === "client") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PlaceholderPage
      title="Notifications"
      description="Manage your appointment reminders and alerts"
      icon="🔔"
    />
  );
}
