import { useAuth } from "@/context/AuthContext";
import ClientHistory from "./dashboards/ClientHistory";
import PlaceholderPage from "./Placeholder";

export default function Reports() {
  const { user } = useAuth();

  if (user?.role === "client") {
    return <ClientHistory />;
  }

  return (
    <PlaceholderPage
      title="Reports & Analytics"
      description="View detailed statistics and performance analytics"
      icon="📈"
    />
  );
}
