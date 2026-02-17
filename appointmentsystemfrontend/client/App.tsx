import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Schedule from "./pages/Schedule";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import AdminAppointments from "./pages/dashboards/AdminAppointments";
import AdminStaffManagement from "./pages/dashboards/AdminStaffManagement";
import AdminClients from "./pages/dashboards/AdminClients";
import AdminReports from "./pages/dashboards/AdminReports";
import AdminSettings from "./pages/dashboards/AdminSettings";
import AdminDepartments from "./pages/dashboards/AdminDepartments";
import AdminServices from "./pages/dashboards/AdminServices";
import StaffDashboard from "./pages/dashboards/StaffDashboard";
import StaffAppointments from "./pages/dashboards/StaffAppointments";
import StaffHours from "./pages/dashboards/StaffHours";
import StaffPerformance from "./pages/dashboards/StaffPerformance";
import StaffFeedback from "./pages/dashboards/StaffFeedback";

const queryClient = new QueryClient();

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin-appointments" element={<AdminAppointments />} />
              <Route path="/admin-staff" element={<AdminStaffManagement />} />
              <Route path="/admin-clients" element={<AdminClients />} />
              <Route path="/admin-reports" element={<AdminReports />} />
              <Route path="/admin-departments" element={<AdminDepartments />} />
              <Route path="/admin-services" element={<AdminServices />} />
              <Route path="/admin-settings" element={<AdminSettings />} />
              <Route path="/staff-dashboard" element={<StaffDashboard />} />
              <Route path="/staff-appointments" element={<StaffAppointments />} />
              <Route path="/staff-hours" element={<StaffHours />} />
              <Route path="/staff-performance" element={<StaffPerformance />} />
              <Route path="/staff-feedback" element={<StaffFeedback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
