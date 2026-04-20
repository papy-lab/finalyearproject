import {
  Filter,
  Search,
  Calendar,
  MapPin,
  Phone,
  Edit2,
  X,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, AppointmentResponse } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  clientName: string;
  clientEmail?: string;
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
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    appointmentId: string;
    action: "complete" | "cancel";
    appointmentType: string;
    clientName: string;
  }>({
    open: false,
    appointmentId: "",
    action: "complete",
    appointmentType: "",
    clientName: "",
  });

  const handleCancelAppointment = async () => {
    if (!confirmDialog.open) return;
    try {
      setUpdatingId(confirmDialog.appointmentId);
      setError("");
      console.log("Cancelling appointment:", confirmDialog.appointmentId);
      const updated = await api.updateAppointment(confirmDialog.appointmentId, {
        status: "cancelled",
      });
      console.log("Appointment cancelled:", updated);
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === updated.id
            ? {
                ...apt,
                status: "cancelled" as const,
              }
            : apt,
        ),
      );
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      const message =
        err instanceof Error && err.message.includes("403")
          ? "Access denied. Please login as admin."
          : err instanceof Error
            ? err.message
            : "Failed to cancel appointment";
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!confirmDialog.open) return;
    try {
      setUpdatingId(confirmDialog.appointmentId);
      setError("");
      console.log("Completing appointment:", confirmDialog.appointmentId);
      const updated = await api.updateAppointment(confirmDialog.appointmentId, {
        status: "completed",
      });
      console.log("Appointment completed:", updated);
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === updated.id
            ? {
                ...apt,
                status: "completed" as const,
              }
            : apt,
        ),
      );
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    } catch (err) {
      console.error("Error completing appointment:", err);
      const message =
        err instanceof Error && err.message.includes("403")
          ? "Access denied. Please login as admin."
          : err instanceof Error
            ? err.message
            : "Failed to complete appointment";
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const openConfirmDialog = (
    appointmentId: string,
    action: "complete" | "cancel",
    appointmentType: string,
    clientName: string,
  ) => {
    setConfirmDialog({
      open: true,
      appointmentId,
      action,
      appointmentType,
      clientName,
    });
  };

  const filteredAppointments = appointments.filter((apt) => {
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
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await api.listAppointments();
        setAppointments(
          data.map((apt: AppointmentResponse) => ({
            id: apt.id,
            clientName: apt.clientName || "Unknown",
            clientEmail: apt.clientEmail,
            phone: apt.clientPhone || "N/A",
            appointmentType: apt.appointmentType,
            date: apt.date,
            time: formatTime(apt.time),
            location: apt.location,
            status: apt.status as Appointment["status"],
          })),
        );
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
            <h2 className="text-3xl font-bold text-rra-navy mb-2">
              All Appointments
            </h2>
            <p className="text-gray-600">
              Manage all client appointments in the system
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total",
                value: appointments.length,
                color: "bg-blue-50 text-rra-blue",
              },
              {
                label: "Confirmed",
                value: appointments.filter((a) => a.status === "confirmed")
                  .length,
                color: "bg-green-50 text-rra-green",
              },
              {
                label: "Pending",
                value: appointments.filter((a) => a.status === "pending")
                  .length,
                color: "bg-yellow-50 text-orange-600",
              },
              {
                label: "Completed",
                value: appointments.filter((a) => a.status === "completed")
                  .length,
                color: "bg-purple-50 text-purple-600",
              },
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
                Showing {filteredAppointments.length} of {appointments.length}{" "}
                appointments
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Service
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {apt.clientName}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {apt.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {apt.appointmentType}
                      </td>
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
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(apt.status)} capitalize`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {apt.status !== "completed" &&
                            apt.status !== "cancelled" && (
                              <>
                                <button
                                  onClick={() =>
                                    openConfirmDialog(
                                      apt.id,
                                      "complete",
                                      apt.appointmentType,
                                      apt.clientName,
                                    )
                                  }
                                  disabled={updatingId === apt.id}
                                  className="p-2 text-rra-green hover:bg-green-100 rounded-lg transition disabled:opacity-60"
                                  title="Mark as Completed"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    openConfirmDialog(
                                      apt.id,
                                      "cancel",
                                      apt.appointmentType,
                                      apt.clientName,
                                    )
                                  }
                                  disabled={updatingId === apt.id}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition disabled:opacity-60"
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

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog
          open={confirmDialog.open}
          onOpenChange={(open) =>
            !open && setConfirmDialog((prev) => ({ ...prev, open: false }))
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmDialog.action === "complete"
                  ? "Complete Appointment"
                  : "Cancel Appointment"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.action === "complete" ? (
                  <div>
                    <p>
                      Are you sure you want to mark this appointment as{" "}
                      <span className="font-semibold text-green-600">
                        completed
                      </span>
                      ?
                    </p>
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg text-sm">
                      <p>
                        <strong>Client:</strong> {confirmDialog.clientName}
                      </p>
                      <p>
                        <strong>Service:</strong>{" "}
                        {confirmDialog.appointmentType}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p>
                      Are you sure you want to{" "}
                      <span className="font-semibold text-red-600">cancel</span>{" "}
                      this appointment?
                    </p>
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg text-sm">
                      <p>
                        <strong>Client:</strong> {confirmDialog.clientName}
                      </p>
                      <p>
                        <strong>Service:</strong>{" "}
                        {confirmDialog.appointmentType}
                      </p>
                    </div>
                    <p className="mt-3 text-amber-600 text-xs">
                      ⚠️ This action cannot be undone. A notification will be
                      sent to the client.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmDialog.action === "complete") {
                    handleCompleteAppointment();
                  } else {
                    handleCancelAppointment();
                  }
                }}
                disabled={updatingId === confirmDialog.appointmentId}
                className={`${
                  confirmDialog.action === "complete"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {updatingId === confirmDialog.appointmentId
                  ? "Processing..."
                  : confirmDialog.action === "complete"
                    ? "Complete"
                    : "Cancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
