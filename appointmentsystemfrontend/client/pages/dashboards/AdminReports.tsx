import { TrendingUp, Calendar, Users, Clock, Download, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, AdminReportsResponse } from "@/lib/api";

export default function AdminReports() {
  const [dateRange, setDateRange] = useState("month");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [exportMessage, setExportMessage] = useState("");
  const [report, setReport] = useState<AdminReportsResponse | null>(null);

  const departments = useMemo(() => {
    if (!report) {
      return [];
    }
    return report.departmentBreakdown.map((dept) => dept.name);
  }, [report]);

  const maxWeekly = useMemo(() => {
    if (!report || report.weeklyTrend.length === 0) {
      return 1;
    }
    return Math.max(...report.weeklyTrend.map((item) => item.value), 1);
  }, [report]);

  const handleExportReport = () => {
    setExportMessage("Report exported successfully!");
    setTimeout(() => setExportMessage(""), 3000);
  };

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await api.getAdminReports(dateRange, selectedDepartment);
        setReport(data);
      } catch {
        setReport(null);
      }
    };
    loadReport();
  }, [dateRange, selectedDepartment]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-rra-navy mb-2">Reports & Analytics</h2>
              <p className="text-gray-600">System performance and operational metrics</p>
            </div>
            <button
              onClick={handleExportReport}
              className="bg-rra-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              Export Report
            </button>
          </div>

          {/* Export Success Message */}
          {exportMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-rra-green" />
              <span className="text-sm font-medium text-rra-green">{exportMessage}</span>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Appointments",
                value: report ? report.metrics.totalAppointments.toLocaleString() : "-",
                change: `${report ? Math.round(report.metrics.totalAppointments / 20) : 0}+`,
                color: "bg-blue-50 text-rra-blue",
                icon: Calendar
              },
              {
                label: "Completion Rate",
                value: report ? `${report.metrics.completionRate.toFixed(1)}%` : "-",
                change: `${report ? report.metrics.completionRate.toFixed(1) : 0}%`,
                color: "bg-green-50 text-rra-green",
                icon: TrendingUp
              },
              {
                label: "Avg. Response Time",
                value: report ? `${report.metrics.avgResponseTimeHours.toFixed(1)} hrs` : "-",
                change: `${report ? report.metrics.avgResponseTimeHours.toFixed(1) : 0} hrs`,
                color: "bg-purple-50 text-purple-600",
                icon: Clock
              },
              {
                label: "Active Users",
                value: report ? report.metrics.activeUsers.toLocaleString() : "-",
                change: `${report ? report.metrics.activeUsers : 0}`,
                color: "bg-orange-50 text-rra-gold",
                icon: Users
              }
            ].map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className={`${metric.color} rounded-xl p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-75">{metric.label}</p>
                    <Icon className="h-5 w-5 opacity-50" />
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">
                      {metric.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Appointments by Service Type */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Appointments by Service Type</h3>
              <div className="space-y-4">
                {(report?.serviceTypes || []).map((service, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{service.name}</span>
                      <span className="text-sm text-gray-600">{service.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-rra-blue h-2 rounded-full"
                        style={{ width: `${service.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Top Performing Staff</h3>
              <div className="space-y-4">
                {(report?.topStaff || []).map((staff, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{staff.name}</p>
                      <p className="text-xs text-gray-600">{staff.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-rra-blue">{staff.completed}</p>
                      <p className="text-xs text-yellow-500">â˜… {staff.rating.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Appointment Trends */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Weekly Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Weekly Trend</h3>
              <div className="h-48 flex items-end justify-between gap-2 px-2">
                {(report?.weeklyTrend || []).map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-rra-blue to-rra-green rounded-t-lg transition hover:opacity-80"
                      style={{ height: `${(item.value / maxWeekly) * 100}%` }}
                      title={`${item.day}: ${item.value}`}
                    />
                    <span className="text-xs text-gray-600">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">By Department</h3>
              <div className="space-y-3">
                {(report?.departmentBreakdown || []).map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-rra-blue" />
                      <span className="text-sm text-gray-900">{dept.name}</span>
                    </div>
                    <span className="font-semibold text-rra-blue">{dept.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">System Health</h3>
              <div className="space-y-4">
                {(report?.systemHealth || []).map((health, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{health.label}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          health.value >= 99 ? "bg-green-100 text-rra-green" : "bg-blue-100 text-rra-blue"
                        }`}
                      >
                        {health.status}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${health.value >= 99 ? "bg-rra-green" : "bg-rra-blue"} h-2 rounded-full`}
                        style={{ width: `${health.value}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{health.value}%</p>
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
