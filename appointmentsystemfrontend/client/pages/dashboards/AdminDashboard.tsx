import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, AdminDashboardResponse } from "@/lib/api";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await api.getAdminDashboard();
        setDashboard(data);
      } catch {
        setDashboard(null);
      }
    };
    loadDashboard();
  }, []);

  const maxWeekly = useMemo(() => {
    if (!dashboard || dashboard.weeklyTrend.length === 0) {
      return 1;
    }
    return Math.max(...dashboard.weeklyTrend.map((item) => item.value), 1);
  }, [dashboard]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rra-navy mb-2">Admin Dashboard</h2>
            <p className="text-gray-600">System overview and management control</p>
          </div>

          {/* KPI Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Appointments",
                value: dashboard ? dashboard.metrics.totalAppointments.toLocaleString() : "-",
                change: dashboard ? `${Math.round(dashboard.metrics.totalAppointments / 10)}+` : "-",
                color: "bg-blue-50 text-rra-blue",
                badgeColor: "text-rra-blue bg-blue-100"
              },
              {
                label: "Active Staff",
                value: dashboard ? dashboard.metrics.activeStaff.toLocaleString() : "-",
                change: dashboard ? `${dashboard.metrics.activeStaff}` : "-",
                color: "bg-green-50 text-rra-green",
                badgeColor: "text-rra-green bg-green-100"
              },
              {
                label: "Avg. Wait Time",
                value: dashboard ? `${dashboard.metrics.avgWaitMinutes.toFixed(1)} min` : "-",
                change: dashboard ? `${dashboard.metrics.avgWaitMinutes.toFixed(1)} min` : "-",
                color: "bg-red-50 text-red-600",
                badgeColor: "text-red-600 bg-red-100"
              },
              {
                label: "Completion Rate",
                value: dashboard ? `${dashboard.metrics.completionRate.toFixed(1)}%` : "-",
                change: dashboard ? `${dashboard.metrics.completionRate.toFixed(1)}%` : "-",
                color: "bg-blue-50 text-rra-blue",
                badgeColor: "text-rra-blue bg-blue-100"
              }
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} rounded-xl p-6`}>
                <p className="text-sm font-medium opacity-75">{stat.label}</p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${stat.badgeColor}`}>{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* System Overview */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-rra-navy">Appointment Trends (This Week)</h3>
              </div>
              <div className="p-6">
                <div className="h-64 flex items-end justify-between gap-2 px-4">
                  {(dashboard?.weeklyTrend || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-rra-blue to-rra-green rounded-t-lg"
                      style={{ height: `${(item.value / maxWeekly) * 100}%` }}
                      title={`${item.day}: ${item.value}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-gray-600 px-4">
                  {(dashboard?.weeklyTrend || []).map((item) => (
                    <span key={item.day}>{item.day}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-4">System Status</h3>
              <div className="space-y-3">
                {(dashboard?.systemStatus || []).map((status) => {
                  const isWarn = status.level === "warn";
                  const bg = isWarn ? "bg-yellow-50" : "bg-green-50";
                  const badge = isWarn
                    ? "text-orange-600 bg-yellow-100"
                    : "text-green-600 bg-green-100";
                  return (
                    <div key={status.name} className={`flex items-center justify-between p-3 ${bg} rounded-lg`}>
                      <span className="text-sm font-medium text-gray-900">{status.name}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${badge}`}>{status.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-rra-navy">Recent Activity</h3>
                <AlertCircle className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {(dashboard?.recentActivity || []).map((activity, idx) => (
                  <div key={idx} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{activity.event}</p>
                      <p className="text-sm text-gray-600">By {activity.user}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{activity.timeAgo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
