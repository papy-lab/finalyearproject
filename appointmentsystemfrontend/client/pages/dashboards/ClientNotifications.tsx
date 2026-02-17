import { Link } from "react-router-dom";
import { Trash2, Settings, AlertCircle, CheckCircle2, Info, Bell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ClientLayout from "@/components/layout/ClientLayout";
import { api, NotificationResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type UiNotification = {
  id: string;
  type: string;
  icon: typeof Bell;
  title: string;
  message: string;
  timestamp: string;
  createdAt: string;
  read: boolean;
  color: string;
};

export default function ClientNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [notifications, setNotifications] = useState<UiNotification[]>([]);

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "reminder":
        return { icon: Bell, color: "bg-blue-50 text-rra-blue" };
      case "confirmation":
        return { icon: CheckCircle2, color: "bg-green-50 text-rra-green" };
      case "alert":
        return { icon: AlertCircle, color: "bg-orange-50 text-orange-600" };
      case "info":
        return { icon: Info, color: "bg-purple-50 text-purple-600" };
      default:
        return { icon: Info, color: "bg-gray-50 text-gray-600" };
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await api.listNotifications();
        setNotifications(
          data.map((notif: NotificationResponse) => {
            const normalizedType = (notif.type || "info").toLowerCase();
            const config = getNotificationConfig(normalizedType);
            const createdAt = new Date(notif.createdAt);
            const timestamp = createdAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return {
              id: notif.id,
              type: normalizedType,
              icon: config.icon,
              title: notif.title,
              message: notif.message,
              timestamp,
              createdAt: notif.createdAt,
              read: notif.read,
              color: config.color,
            };
          })
        );
        setError("");
      } catch {
        setError("Failed to load notifications.");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();
  }, []);

  const filteredNotifications = filterType === "all" ? notifications : notifications.filter((n) => n.type === filterType);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const remindersCount = useMemo(() => notifications.filter((n) => n.type === "reminder").length, [notifications]);
  const confirmationsCount = useMemo(() => notifications.filter((n) => n.type === "confirmation").length, [notifications]);
  const alertsCount = useMemo(() => notifications.filter((n) => n.type === "alert").length, [notifications]);
  const lastNotificationDate = useMemo(() => {
    if (notifications.length === 0) {
      return "N/A";
    }
    const latest = notifications.reduce((acc, cur) =>
      new Date(cur.createdAt).getTime() > new Date(acc.createdAt).getTime() ? cur : acc
    );
    return new Date(latest.createdAt).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [notifications]);

  const handleDelete = async (id: string) => {
    try {
      setActionLoadingId(id);
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete notification",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      setActionLoadingId(id);
      const updated = await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: updated.read } : n)));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to mark notification as read",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) {
      return;
    }
    try {
      setBulkLoading(true);
      await Promise.all(unread.map((n) => api.markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to mark all as read",
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!notifications.length) {
      return;
    }
    try {
      setBulkLoading(true);
      await Promise.all(notifications.map((n) => api.deleteNotification(n.id)));
      setNotifications([]);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to clear notifications",
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rra-navy mb-2">Notifications</h2>
            <p className="text-gray-600">Stay updated with your appointment reminders and updates</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "all", label: `All ${notifications.length}` },
                { id: "reminder", label: "Reminders" },
                { id: "confirmation", label: "Confirmations" },
                { id: "alert", label: "Alerts" },
                { id: "info", label: "Info" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterType(filter.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === filter.id ? "bg-rra-blue text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleMarkAllRead}
                disabled={bulkLoading || unreadCount === 0}
                className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60 transition"
              >
                Mark all read
              </button>
              <button
                onClick={handleClearAll}
                disabled={bulkLoading || notifications.length === 0}
                className="px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60 transition"
              >
                Clear all
              </button>
              <button className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition">
                <Settings className="h-5 w-5" />
                <span className="text-sm font-medium">Preferences</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600 font-medium">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">{error}</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No notifications</p>
                <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const NotifIcon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className={`${notif.color} rounded-xl shadow-sm border border-current border-opacity-20 p-6 transition hover:shadow-md ${
                      !notif.read ? "ring-2 ring-rra-blue ring-opacity-50" : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-current bg-opacity-20">
                          <NotifIcon className="h-6 w-6" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {notif.title}
                              {!notif.read && <span className="inline-block ml-2 w-2.5 h-2.5 bg-red-500 rounded-full" />}
                            </h3>
                            <p className="text-gray-700 mb-2">{notif.message}</p>
                            <p className="text-sm text-gray-600">{notif.timestamp}</p>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            {!notif.read && (
                              <button
                                onClick={() => handleMarkRead(notif.id)}
                                disabled={actionLoadingId === notif.id}
                                className="px-3 py-2 text-xs font-medium text-rra-blue hover:bg-blue-100 bg-blue-50 rounded-lg transition disabled:opacity-60"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notif.id)}
                              disabled={actionLoadingId === notif.id}
                              className="p-2 text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition disabled:opacity-60"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {notif.type === "reminder" && (
                          <Link to="/appointments" className="inline-block mt-3 text-sm font-medium text-rra-blue hover:text-rra-navy transition">
                            View Appointment ?
                          </Link>
                        )}

                        {notif.type === "alert" && (
                          <button className="inline-block mt-3 text-sm font-medium text-rra-blue hover:text-rra-navy transition">
                            Provide Documents ?
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-rra-navy mb-6">Notification Insights</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs uppercase text-gray-500">Total Notifications</p>
                <p className="text-2xl font-bold text-rra-navy mt-1">{notifications.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs uppercase text-gray-500">Unread</p>
                <p className="text-2xl font-bold text-rra-navy mt-1">{unreadCount}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs uppercase text-gray-500">Reminders</p>
                <p className="text-2xl font-bold text-rra-navy mt-1">{remindersCount}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs uppercase text-gray-500">Alerts</p>
                <p className="text-2xl font-bold text-rra-navy mt-1">{alertsCount}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700">
                Latest notification date: <span className="font-semibold text-rra-navy">{lastNotificationDate}</span>
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Confirmations: <span className="font-semibold text-rra-navy">{confirmationsCount}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
