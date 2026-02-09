import { Filter, Search, Calendar, MapPin, Phone, Edit2, X } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, AppointmentResponse } from "@/lib/api";

interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  appointmentType: string;
  date: string;
  time: string;
  location: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleCancelAppointment = async (id: string) => {
    await api.updateAppointment(id, { status: "cancelled" });
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === id ? { ...apt, status: "cancelled" as const } : apt
      )
    );
  };

  const handleCompleteAppointment = async (id: string) => {
    await api.updateAppointment(id, { status: "completed" });
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === id ? { ...apt, status: "completed" as const } : apt
      )
    );
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.phone.includes(searchTerm) ||
      apt.appointmentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || apt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-rra-green";
      case "pending":
        return "bg-yellow-100 text-orange-600";
      case "completed":
        return "bg-blue-100 text-rra-blue";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

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
          phone: apt.clientPhone || "N/A",
          appointmentType: apt.appointmentType,
          date: apt.date,
          time: formatTime(apt.time),
          location: apt.location,
          status: apt.status as Appointment["status"],
        })));
      } catch {
        setAppointments([]);
      }
    };
    loadAppointments();
  }, []);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rra-navy mb-2">All Appointments</h2>
            <p className="text-gray-600">Manage all client appointments in the system</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: appointments.length, color: "bg-blue-50 text-rra-blue" },
              { label: "Confirmed", value: appointments.filter(a => a.status === "confirmed").length, color: "bg-green-50 text-rra-green" },
              { label: "Pending", value: appointments.filter(a => a.status === "pending").length, color: "bg-yellow-50 text-orange-600" },
              { label: "Completed", value: appointments.filter(a => a.status === "completed").length, color: "bg-purple-50 text-purple-600" }
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} rounded-xl p-6`}>
                <p className="text-sm font-medium opacity-75">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-end">
                Showing {filteredAppointments.length} of {appointments.length} appointments
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Client</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Service</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{apt.clientName}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {apt.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{apt.appointmentType}</td>
                      <td className="px-6 py-4">
                        <p className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {apt.date}
                        </p>
                        <p className="text-sm text-gray-500">{apt.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {apt.location}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(apt.status)} capitalize`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {apt.status !== "completed" && apt.status !== "cancelled" && (
                            <>
                              <button
                                onClick={() => handleCompleteAppointment(apt.id)}
                                className="p-2 text-rra-green hover:bg-green-100 rounded-lg transition"
                                title="Mark as Completed"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(apt.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                                title="Cancel Appointment"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAppointments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No appointments found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
