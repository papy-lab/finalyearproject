import { Search, Filter, MoreVertical } from "lucide-react";
import { useEffect, useState } from "react";
import StaffLayout from "@/components/layout/StaffLayout";
import { api, AppointmentResponse } from "@/lib/api";

interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  department: string;
  service: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
}

export default function StaffAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
          clientPhone: apt.clientPhone || "N/A",
          department: apt.location,
          service: apt.appointmentType,
          date: formatDate(apt.date),
          time: formatTime(apt.time),
          status: apt.status as Appointment["status"],
        })));
      } catch {
        setAppointments([]);
      }
    };
    loadAppointments();
  }, []);

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      apt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || apt.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-700 bg-green-100";
      case "pending":
        return "text-yellow-700 bg-yellow-100";
      case "completed":
        return "text-blue-700 bg-blue-100";
      case "cancelled":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <StaffLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Appointments Management</h2>
            <p className="text-gray-600">Manage your assigned appointments</p>
          </div>

          {/* Stats */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              All Appointments • <span className="font-semibold text-gray-900">{filteredAppointments.length} total appointments</span>
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by client, service, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Service</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">{apt.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{apt.clientName}</p>
                          <p className="text-xs text-gray-500">{apt.clientPhone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{apt.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{apt.service}</td>
                      <td className="px-6 py-4 text-sm">
                        <p className="font-medium text-gray-900">{apt.date}</p>
                        <p className="text-xs text-gray-500">{apt.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(apt.status)} capitalize`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                          <MoreVertical className="h-4 w-4" />
                        </button>
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
    </StaffLayout>
  );
}
