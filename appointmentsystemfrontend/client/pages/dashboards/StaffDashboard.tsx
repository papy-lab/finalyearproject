import { TrendingUp, Clock, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import StaffLayout from "@/components/layout/StaffLayout";
import { useAuth } from "@/context/AuthContext";
import { api, AppointmentResponse } from "@/lib/api";

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  dateIso: string;
  time: string;
  status: "confirmed" | "pending" | "completed";
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  };

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await api.listAppointments();
        setAppointments(data.map((apt: AppointmentResponse) => ({
          id: apt.id,
          clientName: apt.clientName || "Unknown",
          service: apt.appointmentType,
          date: formatDate(apt.date),
          dateIso: apt.date,
          time: formatTime(apt.time),
          status: apt.status === "confirmed" ? "confirmed" : apt.status === "completed" ? "completed" : "pending",
        })));
      } catch {
        setAppointments([]);
      }
    };
    loadAppointments();
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const appointmentsToday = appointments.filter((apt) => {
      const date = new Date(apt.dateIso);
      return date >= startOfToday && date < new Date(startOfToday.getTime() + 86400000);
    }).length;
    const appointmentsWeek = appointments.filter((apt) => {
      const date = new Date(apt.dateIso);
      return date >= startOfToday && date <= endOfWeek;
    }).length;
    const completed = appointments.filter((apt) => apt.status === "completed").length;
    return {
      appointmentsToday,
      appointmentsWeek,
      completed,
    };
  }, [appointments]);

  const statsCards = [
    {
      label: "Today's Appointments",
      value: stats.appointmentsToday.toString(),
      change: "+2 from last month",
      icon: Clock,
      color: "bg-blue-50 text-blue-600"
    },
    {
      label: "This Week",
      value: stats.appointmentsWeek.toString(),
      change: "+5 from last month",
      icon: Calendar,
      color: "bg-yellow-50 text-yellow-600"
    },
    {
      label: "Completed",
      value: stats.completed.toString(),
      change: "+12 from last month",
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600"
    },
    {
      label: "Avg. Rating",
      value: "4.7",
      change: "+0.2 from last month",
      icon: TrendingUp,
      color: "bg-purple-50 text-purple-600"
    }
  ];

  return (
    <StaffLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">Dashboard Overview</h2>
            <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {statsCards.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className={`${stat.color} rounded-xl p-6`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium opacity-75">{stat.label}</p>
                    <Icon className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="text-3xl font-bold mb-2">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.change}</p>
                </div>
              );
            })}
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
              <p className="text-sm text-gray-600 mt-1">Next scheduled appointments</p>
            </div>

            <div className="p-6 space-y-4">
              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
                  >
                    <div className="flex gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg flex-shrink-0">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{apt.clientName}</p>
                        <p className="text-sm text-gray-600">{apt.service}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{apt.date}</p>
                      <p className="text-sm text-gray-600">{apt.time}</p>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          apt.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {apt.status === "confirmed" ? "confirmed" : "pending"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No upcoming appointments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
