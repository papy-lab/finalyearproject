import { Link } from "react-router-dom";
import { MapPin, Plus, Filter, Search, Edit2, X, CheckCircle2, AlertCircle, Clock, Phone, Mail, Calendar, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ClientLayout from "@/components/layout/ClientLayout";
import { api, AppointmentResponse } from "@/lib/api";

export default function ClientAppointments() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");


  const [appointments, setAppointments] = useState<Array<{
    id: string;
    date: string;
    time: string;
    title: string;
    status: string;
    office: string;
    officer?: string;
  }>>([]);

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
        setAppointments(
          data.map((apt: AppointmentResponse) => ({
            id: apt.id,
            date: formatDate(apt.date),
            time: formatTime(apt.time),
            title: apt.appointmentType,
            status: apt.status.charAt(0).toUpperCase() + apt.status.slice(1),
            office: apt.location,
            officer: apt.staffName ?? "TBD",
          }))
        );
      } catch {
        setAppointments([]);
      }
    };
    loadAppointments();
  }, []);

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         apt.office.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || apt.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Confirmed":
        return "bg-green-100 text-rra-green";
      case "Pending":
        return "bg-yellow-100 text-orange-600";
      case "Scheduled":
        return "bg-blue-100 text-rra-blue";
      case "Completed":
        return "bg-purple-100 text-purple-600";
      case "Cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "Confirmed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "Pending":
        return <AlertCircle className="h-4 w-4" />;
      case "Cancelled":
        return <X className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <ClientLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-rra-navy mb-2">My Appointments</h2>
              <p className="text-gray-600">View and manage all your scheduled appointments</p>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search appointments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                {/* Book Button */}
                <Link
                  to="/schedule"
                  className="bg-rra-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-rra-navy transition flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Book New
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 text-rra-blue rounded-xl p-4">
                <p className="text-sm font-medium opacity-75">Total</p>
                <p className="text-2xl font-bold mt-1">{appointments.length}</p>
              </div>
              <div className="bg-green-50 text-rra-green rounded-xl p-4">
                <p className="text-sm font-medium opacity-75">Confirmed</p>
                <p className="text-2xl font-bold mt-1">{appointments.filter(a => a.status === "Confirmed").length}</p>
              </div>
              <div className="bg-yellow-50 text-orange-600 rounded-xl p-4">
                <p className="text-sm font-medium opacity-75">Pending</p>
                <p className="text-2xl font-bold mt-1">{appointments.filter(a => a.status === "Pending").length}</p>
              </div>
              <div className="bg-blue-50 text-rra-blue rounded-xl p-4">
                <p className="text-sm font-medium opacity-75">Scheduled</p>
                <p className="text-2xl font-bold mt-1">{appointments.filter(a => a.status === "Scheduled").length}</p>
              </div>
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {filteredAppointments.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No appointments found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAppointments.map((apt) => (
                    <div key={apt.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="grid md:grid-cols-3 gap-6 items-start">
                        {/* Left - Date & Time */}
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="bg-rra-blue text-white p-3 rounded-lg">
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{apt.date}</p>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Clock className="h-4 w-4" />
                                {apt.time}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Center - Details */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">{apt.title}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {apt.office}
                            </p>
                            <p className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {apt.officer}
                            </p>
                          </div>
                        </div>

                        {/* Right - Status & Actions */}
                        <div className="flex flex-col items-end gap-3">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${getStatusColor(apt.status)}`}>
                            {getStatusIcon(apt.status)}
                            {apt.status}
                          </span>
                          <div className="flex gap-2">
                            <button className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition" title="Edit">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Cancel">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-rra-navy mb-3">Need Help?</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-rra-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Call Us</p>
                    <p className="text-sm text-gray-600">+250 788 123 456</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-rra-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">support@rra.gov.rw</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-rra-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Hours</p>
                    <p className="text-sm text-gray-600">Mon-Fri, 8AM-5PM</p>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </ClientLayout>
  );
}
