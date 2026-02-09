import { Link } from "react-router-dom";
import { Trash2, Settings, Mail, MessageSquare, Phone, AlertCircle, CheckCircle2, Info, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ClientLayout from "@/components/layout/ClientLayout";
import { api, NotificationResponse } from "@/lib/api";

export default function ClientNotifications() {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState("all");

  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    icon: typeof Bell;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    color: string;
  }>>([]);

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
            const config = getNotificationConfig(notif.type);
            const createdAt = new Date(notif.createdAt);
            const timestamp = createdAt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return {
              id: notif.id,
              type: notif.type,
              icon: config.icon,
              title: notif.title,
              message: notif.message,
              timestamp,
              read: notif.read,
              color: config.color,
            };
          })
        );
      } catch {
        setNotifications([]);
      }
    };
    loadNotifications();
  }, []);

  const filteredNotifications = filterType === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      // no-op
    }
  };

  return (
    <ClientLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-rra-navy mb-2">Notifications</h2>
              <p className="text-gray-600">Stay updated with your appointment reminders and updates</p>
            </div>

            {/* Action Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === "all"
                      ? "bg-rra-blue text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All {notifications.length}
                </button>
                <button
                  onClick={() => setFilterType("reminder")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === "reminder"
                      ? "bg-rra-blue text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Reminders
                </button>
                <button
                  onClick={() => setFilterType("confirmation")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === "confirmation"
                      ? "bg-rra-blue text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Confirmations
                </button>
                <button
                  onClick={() => setFilterType("alert")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === "alert"
                      ? "bg-rra-blue text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Alerts
                </button>
              </div>
              <button className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition">
                <Settings className="h-5 w-5" />
                <span className="text-sm font-medium">Preferences</span>
              </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {filteredNotifications.length === 0 ? (
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
                                {!notif.read && (
                                  <span className="inline-block ml-2 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                )}
                              </h3>
                              <p className="text-gray-700 mb-2">{notif.message}</p>
                              <p className="text-sm text-gray-600">{notif.timestamp}</p>
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleDelete(notif.id)}
                                className="p-2 text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Action Button for Reminders */}
                          {notif.type === "reminder" && (
                            <Link
                              to="/appointments"
                              className="inline-block mt-3 text-sm font-medium text-rra-blue hover:text-rra-navy transition"
                            >
                              View Appointment →
                            </Link>
                          )}

                          {notif.type === "alert" && (
                            <button className="inline-block mt-3 text-sm font-medium text-rra-blue hover:text-rra-navy transition">
                              Provide Documents →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Notification Preferences */}
            <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-rra-navy mb-6">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { name: "Email Reminders", enabled: true, icon: Mail },
                  { name: "SMS Alerts", enabled: true, icon: MessageSquare },
                  { name: "Phone Calls", enabled: false, icon: Phone }
                ].map((pref, idx) => {
                  const PrefIcon = pref.icon;
                  return (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <PrefIcon className="h-5 w-5 text-rra-blue" />
                        <span className="font-medium text-gray-900">{pref.name}</span>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pref.enabled}
                          className="w-5 h-5 rounded border-gray-300 text-rra-blue focus:ring-rra-blue"
                          readOnly
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
              <button className="mt-6 bg-rra-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-rra-navy transition">
                Save Preferences
              </button>
            </div>
        </div>
      </div>
    </ClientLayout>
  );
}
