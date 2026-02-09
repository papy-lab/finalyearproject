import { TrendingUp, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminDashboard() {
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
              { label: "Total Appointments", value: "248", change: "+12%", color: "bg-blue-50 text-rra-blue" },
              { label: "Active Staff", value: "24", change: "+3", color: "bg-green-50 text-rra-green" },
              { label: "Avg. Wait Time", value: "12 min", change: "-8%", color: "bg-purple-50 text-purple-600" },
              { label: "Completion Rate", value: "94%", change: "+5%", color: "bg-orange-50 text-rra-gold" }
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} rounded-xl p-6`}>
                <p className="text-sm font-medium opacity-75">{stat.label}</p>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">{stat.change}</span>
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
                  {[65, 78, 85, 92, 88, 95, 78].map((height, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-rra-blue to-rra-green rounded-t-lg"
                      style={{ height: `${(height / 100) * 100}%` }}
                      title={`${height} appointments`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-xs text-gray-600 px-4">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Database</span>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">Operational</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Email Service</span>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">SMS Gateway</span>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">Connected</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">Backups</span>
                  <span className="text-xs font-semibold text-orange-600 bg-yellow-100 px-2 py-1 rounded">Pending</span>
                </div>
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
                {[
                  { event: "New appointment booked", user: "Jean Niyibizi", time: "2 mins ago" },
                  { event: "Staff joined system", user: "Marie Uwase", time: "15 mins ago" },
                  { event: "Appointment completed", user: "Daniel Muhire", time: "1 hour ago" },
                  { event: "Report generated", user: "System", time: "2 hours ago" }
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{activity.event}</p>
                      <p className="text-sm text-gray-600">By {activity.user}</p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
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
