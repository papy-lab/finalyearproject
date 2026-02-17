import { Link, useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, X, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ClientLayout from "@/components/layout/ClientLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api, AppointmentResponse, NotificationResponse } from "@/lib/api";

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  newDate: string;
  newTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onSubmit: () => void;
}

interface CancelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAppointment: Appointment | null;
  onConfirm: () => void;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  title: string;
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
  officeName: string;
}

interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

function RescheduleModal({ open, onOpenChange, selectedAppointment, newDate, newTime, onDateChange, onTimeChange, onSubmit }: RescheduleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            {selectedAppointment && `Rescheduling: ${selectedAppointment.title}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-700">New Time</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
            />
          </div>
          <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
            <p className="font-medium mb-1">Current Details:</p>
            <p>{selectedAppointment?.date} at {selectedAppointment?.time}</p>
            <p>{selectedAppointment?.officeName}</p>
          </div>
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-rra-blue text-white rounded-lg font-medium hover:bg-rra-navy transition"
          >
            Reschedule
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelModal({ open, onOpenChange, selectedAppointment, onConfirm }: CancelModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-600" />
            Cancel Appointment
          </DialogTitle>
          <DialogDescription>
            {selectedAppointment && `Are you sure you want to cancel: ${selectedAppointment.title}?`}
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-gray-600 p-3 bg-red-50 rounded-lg">
          <p className="font-medium mb-1">Appointment Details:</p>
          <p>{selectedAppointment?.date} at {selectedAppointment?.time}</p>
          <p>{selectedAppointment?.officeName}</p>
          <p className="mt-2 text-red-700">This action cannot be undone.</p>
        </div>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Keep Appointment
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            Cancel Appointment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentStats, setAppointmentStats] = useState({ upcoming: 0, completed: 0, cancelled: 0 });
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const handleBookNew = () => {
    navigate("/schedule");
  };

  const handleRescheduleClick = () => {
    if (!selectedAppointment) {
      setSelectedAppointment(appointments[0]);
    }
    setRescheduleOpen(true);
  };

  const handleCancelClick = () => {
    if (!selectedAppointment) {
      setSelectedAppointment(appointments[0]);
    }
    setCancelOpen(true);
  };

  const handleRescheduleSubmit = () => {
    if (!newDate || !newTime) {
      toast({
        title: "Error",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return;
    }

    const submitReschedule = async () => {
      if (!selectedAppointment) {
        return;
      }
      try {
        await api.updateAppointment(selectedAppointment.id, {
          date: newDate,
          time: newTime,
          status: "pending",
        });
        setAppointments(appointments.map(apt =>
          apt.id === selectedAppointment.id
            ? { ...apt, date: formatDate(newDate), time: formatTime(newTime), status: "Pending" }
            : apt
        ));
        toast({
          title: "Success",
          description: `Appointment rescheduled to ${newDate} at ${newTime}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to reschedule appointment",
          variant: "destructive",
        });
      }
    };

    submitReschedule();

    setRescheduleOpen(false);
    setNewDate("");
    setNewTime("");
    setSelectedAppointment(null);
  };

  const handleCancelAppointment = () => {
    const submitCancel = async () => {
      if (!selectedAppointment) {
        return;
      }
      try {
        await api.updateAppointment(selectedAppointment.id, { status: "cancelled" });
        setAppointments(appointments.filter(apt => apt.id !== selectedAppointment.id));
        toast({
          title: "Success",
          description: `${selectedAppointment.title} appointment has been cancelled`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to cancel appointment",
          variant: "destructive",
        });
      }
    };

    submitCancel();

    setCancelOpen(false);
    setSelectedAppointment(null);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  };

  const mapStatus = (status: string): Appointment["status"] => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Pending";
    }
  };

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await api.listAppointments();
        let upcoming = 0;
        let completed = 0;
        let cancelled = 0;
        data.forEach((apt: AppointmentResponse) => {
          const status = (apt.status || "").toLowerCase();
          if (status === "completed") {
            completed += 1;
          } else if (status === "cancelled") {
            cancelled += 1;
          } else {
            upcoming += 1;
          }
        });
        setAppointments(data.map((apt: AppointmentResponse) => ({
          id: apt.id,
          date: formatDate(apt.date),
          time: formatTime(apt.time),
          title: apt.appointmentType,
          status: mapStatus(apt.status),
          officeName: apt.location,
        })));
        setAppointmentStats({ upcoming, completed, cancelled });
      } catch {
        setAppointments([]);
        setAppointmentStats({ upcoming: 0, completed: 0, cancelled: 0 });
      }
    };
    loadAppointments();
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await api.listNotifications();
        setNotifications(
          data.map((notif: NotificationResponse) => ({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            read: notif.read,
            createdAt: notif.createdAt,
          }))
        );
      } catch {
        setNotifications([]);
      }
    };
    loadNotifications();
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <ClientLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rra-navy mb-2">Welcome, {user?.fullName}</h2>
            <p className="text-gray-600">Manage your RRA appointments easily</p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Upcoming", value: appointmentStats.upcoming.toString(), color: "bg-blue-50 text-rra-blue" },
              { label: "Completed", value: appointmentStats.completed.toString(), color: "bg-green-50 text-rra-green" },
              { label: "Cancelled", value: appointmentStats.cancelled.toString(), color: "bg-red-50 text-red-600" }
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} rounded-xl p-6`}>
                <p className="text-sm font-medium opacity-75">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* My Appointments */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-rra-navy">Your Appointments</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-rra-navy">{apt.title}</p>
                          <div className="flex flex-col gap-1 mt-2 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {apt.date}, {apt.time}
                            </p>
                            <p className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {apt.officeName}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          apt.status === 'Confirmed'
                            ? 'bg-green-100 text-rra-green'
                            : apt.status === 'Completed'
                            ? 'bg-blue-100 text-rra-blue'
                            : apt.status === 'Pending'
                            ? 'bg-yellow-100 text-orange-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/appointments" className="inline-block mt-6 text-rra-blue font-medium hover:text-rra-navy transition">
                  View All Appointments →
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleBookNew}
                  className="block w-full bg-rra-blue text-white py-2 rounded-lg font-medium text-center hover:bg-rra-navy transition"
                >
                  + Book New
                </button>
                <button
                  onClick={handleRescheduleClick}
                  className="block w-full border-2 border-rra-blue text-rra-blue py-2 rounded-lg font-medium hover:bg-blue-50 transition"
                >
                  Reschedule
                </button>
                <button
                  onClick={handleCancelClick}
                  className="block w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel Appointment
                </button>
              </div>

              {/* Contact Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Need Help?</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>+250 788 123 456</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">support@rra.gov.rw</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-rra-navy">Recent Notifications</h3>
              <span className="text-sm font-medium text-gray-600">{unreadNotifications} unread</span>
            </div>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-gray-500">No notifications available.</p>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((notif) => (
                  <div key={notif.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="font-medium text-gray-900 text-sm">
                      {notif.title}
                      {!notif.read && <span className="inline-block ml-2 w-2 h-2 rounded-full bg-red-500" />}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <RescheduleModal
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        selectedAppointment={selectedAppointment}
        newDate={newDate}
        newTime={newTime}
        onDateChange={setNewDate}
        onTimeChange={setNewTime}
        onSubmit={handleRescheduleSubmit}
      />

      <CancelModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        selectedAppointment={selectedAppointment}
        onConfirm={handleCancelAppointment}
      />
    </ClientLayout>
  );
}

