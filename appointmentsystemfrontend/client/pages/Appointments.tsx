import { useAuth } from "@/context/AuthContext";
import ClientAppointments from "./dashboards/ClientAppointments";
import PlaceholderPage from "./Placeholder";

export default function Appointments() {
  const { user } = useAuth();

  if (user?.role === "client") {
    return <ClientAppointments />;
  }

  return (
    <PlaceholderPage
      title="Appointments"
      description="View, manage, and track all your appointments"
      icon="📅"
    />
  );
}
