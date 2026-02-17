import { Calendar, Download, FileText, Filter, CheckCircle2, XCircle, Clock3, Link2Off, Link2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, AdminReportsResponse, DepartmentResponse } from "@/lib/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminReports() {
  const [dateRange, setDateRange] = useState("month");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [report, setReport] = useState<AdminReportsResponse | null>(null);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentResponse[]>([]);

  const pieColors = ["#0052A5", "#0EA5E9", "#22C55E", "#F59E0B", "#EF4444", "#14B8A6"];

  const departmentNames = useMemo(() => {
    const fromApi = departmentOptions.map((dept) => dept.name);
    const fromReport = report ? report.departmentBreakdown.map((dept) => dept.name) : [];
    return Array.from(new Set([...fromApi, ...fromReport]));
  }, [departmentOptions, report]);

  const filteredAppointments = useMemo(() => {
    if (!report) {
      return [];
    }
    const query = searchTerm.trim().toLowerCase();
    return report.appointments.filter((row) => {
      const statusOk = selectedStatus === "all" || row.status.toLowerCase() === selectedStatus;
      if (!statusOk) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        row.appointmentId.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query) ||
        row.serviceType.toLowerCase().includes(query) ||
        row.department.toLowerCase().includes(query) ||
        row.clientName.toLowerCase().includes(query) ||
        row.clientEmail.toLowerCase().includes(query) ||
        row.staffName.toLowerCase().includes(query) ||
        row.staffEmail.toLowerCase().includes(query) ||
        row.date.toLowerCase().includes(query) ||
        row.time.toLowerCase().includes(query)
      );
    });
  }, [report, searchTerm, selectedStatus]);

  const filteredSummary = useMemo(() => {
    const approved = filteredAppointments.filter((row) => row.status.toLowerCase() === "approved").length;
    const rejected = filteredAppointments.filter((row) => row.status.toLowerCase() === "rejected").length;
    const pending = filteredAppointments.filter((row) => row.status.toLowerCase() === "pending").length;
    return { approved, rejected, pending };
  }, [filteredAppointments]);

  const toReportRef = (id: string) => `APT-${id.slice(0, 8).toUpperCase()}`;

  const formatDateTime = (date: string, time: string) => {
    const parsed = new Date(`${date}T${time}`);
    if (Number.isNaN(parsed.getTime())) {
      return `${date} ${time}`;
    }
    return parsed.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusClasses = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "approved") {
      return "bg-green-100 text-green-700";
    }
    if (normalized === "rejected") {
      return "bg-red-100 text-red-700";
    }
    return "bg-yellow-100 text-yellow-700";
  };

  const showTemporaryMessage = (message: string, ms = 3000) => {
    setExportMessage(message);
    setTimeout(() => setExportMessage(""), ms);
  };

  const handleExportCsv = () => {
    if (!filteredAppointments.length) {
      showTemporaryMessage("No report data to export.");
      return;
    }

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [
      ["Appointment ID", "Date", "Time", "Status", "Service", "Department", "Client", "Client Email", "Staff", "Staff Email"]
        .map(escapeCsv)
        .join(","),
      ...filteredAppointments.map((row) =>
        [
          row.appointmentId,
          row.date,
          row.time,
          row.status,
          row.serviceType,
          row.department,
          row.clientName,
          row.clientEmail,
          row.staffName,
          row.staffEmail,
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    link.href = url;
    link.download = `appointments-report-${dateRange}-${selectedDepartment}-${selectedStatus}-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showTemporaryMessage("CSV exported successfully.");
  };

  const handleExportPdf = () => {
    if (!filteredAppointments.length) {
      showTemporaryMessage("No report data to export.");
      return;
    }

    const popup = window.open("", "_blank", "width=1200,height=750");
    if (!popup) {
      showTemporaryMessage("Popup blocked. Allow popups to export PDF.", 4000);
      return;
    }

    const rowsHtml = filteredAppointments
      .map(
        (row) =>
          `<tr><td>${row.appointmentId}</td><td>${row.date}</td><td>${row.time}</td><td>${row.status}</td><td>${row.serviceType}</td><td>${row.department}</td><td>${row.clientName}</td><td>${row.staffName}</td></tr>`
      )
      .join("");

    popup.document.write(`
      <html>
        <head>
          <title>Appointment Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1 { margin: 0 0 6px 0; font-size: 24px; }
            p { margin: 0 0 12px 0; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>Appointment Report</h1>
          <p>Range: ${dateRange} | Department: ${selectedDepartment} | Status: ${selectedStatus} | Rows: ${filteredAppointments.length} | Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Service</th>
                <th>Department</th>
                <th>Client</th>
                <th>Staff</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);

    popup.document.close();
    popup.focus();
    popup.print();
    showTemporaryMessage("PDF export dialog opened.");
  };

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await api.getAdminReports(dateRange, selectedDepartment);
        setReport(data);
        setLoadError("");
      } catch (err) {
        setReport(null);
        setLoadError(err instanceof Error ? err.message : "Failed to load report data.");
      }
    };
    loadReport();
  }, [dateRange, selectedDepartment]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await api.listDepartments();
        setDepartmentOptions(data);
      } catch {
        setDepartmentOptions([]);
      }
    };
    loadDepartments();
  }, []);

  const metricCards = [
    {
      label: "All Appointments",
      value: report ? report.metrics.totalAppointments.toLocaleString() : "-",
      color: "bg-blue-50 text-rra-blue",
      icon: Calendar,
    },
    {
      label: "Approved",
      value: report ? report.metrics.approvedAppointments.toLocaleString() : "-",
      color: "bg-green-50 text-rra-green",
      icon: CheckCircle2,
    },
    {
      label: "Rejected",
      value: report ? report.metrics.rejectedAppointments.toLocaleString() : "-",
      color: "bg-red-50 text-red-600",
      icon: XCircle,
    },
    {
      label: "Pending",
      value: report ? report.metrics.pendingAppointments.toLocaleString() : "-",
      color: "bg-yellow-50 text-yellow-700",
      icon: Clock3,
    },
    {
      label: "Assigned",
      value: report ? report.metrics.assignedAppointments.toLocaleString() : "-",
      color: "bg-emerald-50 text-emerald-700",
      icon: Link2,
    },
    {
      label: "Unassigned",
      value: report ? report.metrics.unassignedAppointments.toLocaleString() : "-",
      color: "bg-orange-50 text-orange-700",
      icon: Link2Off,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-rra-navy mb-2">Reports & Analytics</h2>
              <p className="text-gray-600">Meaningful appointment reporting with status, client, and assigned staff</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="bg-rra-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
              <button
                onClick={handleExportPdf}
                className="bg-rra-navy text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Export PDF
              </button>
            </div>
          </div>

          {exportMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm font-medium text-rra-green">{exportMessage}</span>
            </div>
          )}

          {loadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm font-medium text-red-700">{loadError}</span>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
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
                  {departmentNames.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search client, staff, service..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className={`${metric.color} rounded-xl p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium opacity-75">{metric.label}</p>
                    <Icon className="h-5 w-5 opacity-50" />
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-rra-navy mb-4">System-Wide Database Snapshot</h3>
            {!report ? (
              <p className="text-sm text-gray-500">No snapshot data available.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs uppercase text-gray-500">Users</p>
                  <p className="text-xl font-semibold text-rra-navy">{report.systemSnapshot.totalUsers}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Clients {report.systemSnapshot.totalClients} | Staff {report.systemSnapshot.totalStaff} | Admins {report.systemSnapshot.totalAdmins}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs uppercase text-gray-500">Active Users</p>
                  <p className="text-xl font-semibold text-rra-navy">{report.systemSnapshot.activeUsers}</p>
                  <p className="text-xs text-gray-600 mt-1">From users table</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs uppercase text-gray-500">Departments</p>
                  <p className="text-xl font-semibold text-rra-navy">{report.systemSnapshot.totalDepartments}</p>
                  <p className="text-xs text-gray-600 mt-1">Active: {report.systemSnapshot.activeDepartments}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs uppercase text-gray-500">Services</p>
                  <p className="text-xl font-semibold text-rra-navy">{report.systemSnapshot.totalServices}</p>
                  <p className="text-xs text-gray-600 mt-1">Active: {report.systemSnapshot.activeServices}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs uppercase text-gray-500">Notifications</p>
                  <p className="text-xl font-semibold text-rra-navy">{report.systemSnapshot.totalNotifications}</p>
                  <p className="text-xs text-gray-600 mt-1">Unread: {report.systemSnapshot.unreadNotifications}</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-xs uppercase text-gray-500">Avg Feedback Rating</p>
                  <p className="text-xl font-semibold text-rra-navy">{report.systemSnapshot.averageFeedbackRating.toFixed(1)} / 5.0</p>
                  <p className="text-xs text-gray-600 mt-1">From feedback table</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Appointments by Status</h3>
              {!report || report.statusBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500">No data for current filters.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.statusBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Appointments" fill="#0052A5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Completed Appointments by Date</h3>
              {!report || report.weeklyTrend.length === 0 ? (
                <p className="text-sm text-gray-500">No data for current filters.</p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" name="Completed" stroke="#0EA5E9" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Staff Workload</h3>
              {!report || report.staffWorkload.length === 0 ? (
                <p className="text-sm text-gray-500">No staff assignment data for current filters.</p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.staffWorkload.slice(0, 8)} layout="vertical" margin={{ left: 20, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="approved" stackId="a" name="Approved" fill="#22C55E" />
                      <Bar dataKey="pending" stackId="a" name="Pending" fill="#F59E0B" />
                      <Bar dataKey="rejected" stackId="a" name="Rejected" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-rra-navy mb-6">Appointments by Department</h3>
              {!report || report.departmentBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500">No data for current filters.</p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.departmentBreakdown}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={2}
                      >
                        {report.departmentBreakdown.map((_, idx) => (
                          <Cell key={`dept-${idx}`} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-rra-navy">Appointment Report Table</h3>
              <p className="text-sm text-gray-600 mt-1">
                {filteredAppointments.length} appointment record(s) from the database showing status, client, and assigned staff
              </p>
              <p className="text-xs text-gray-500 mt-1">Generated: {new Date().toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 border-b border-gray-200 bg-gray-50">
              <div className="rounded-lg bg-white border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">Total Rows</p>
                <p className="text-lg font-semibold text-rra-navy">{filteredAppointments.length}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">Approved</p>
                <p className="text-lg font-semibold text-green-700">{filteredSummary.approved}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">Rejected</p>
                <p className="text-lg font-semibold text-red-700">{filteredSummary.rejected}</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-3">
                <p className="text-xs uppercase text-gray-500">Pending</p>
                <p className="text-lg font-semibold text-yellow-700">{filteredSummary.pending}</p>
              </div>
            </div>

            <div className="md:hidden p-4 space-y-3">
              {filteredAppointments.length === 0 ? (
                <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500 text-center">
                  No appointment report rows match the selected filters.
                </div>
              ) : (
                filteredAppointments.map((row) => (
                  <div key={row.appointmentId} className="rounded-lg border border-gray-200 p-4 bg-white">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-rra-navy">{toReportRef(row.appointmentId)}</p>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${statusClasses(row.status)}`}>
                        {row.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{formatDateTime(row.date, row.time)}</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium text-gray-700">Client:</span> <span className="break-words">{row.clientName}</span></p>
                      <p className="text-xs text-gray-500 break-all">{row.clientEmail}</p>
                      <p><span className="font-medium text-gray-700">Staff:</span> <span className="break-words">{row.staffName}</span></p>
                      <p className="text-xs text-gray-500 break-all">{row.staffEmail}</p>
                      <p><span className="font-medium text-gray-700">Department:</span> <span className="break-words">{row.department}</span></p>
                      <p><span className="font-medium text-gray-700">Service:</span> <span className="break-words">{row.serviceType}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block">
              <table className="w-full table-fixed divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-[12%] px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Report Ref</th>
                    <th className="w-[16%] px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Booked On</th>
                    <th className="w-[12%] px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Decision</th>
                    <th className="w-[20%] px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="w-[20%] px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned Staff</th>
                    <th className="w-[10rem] px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                    <th className="w-[14%] px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-center text-sm text-gray-500">
                        No appointment report rows match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((row) => (
                      <tr key={row.appointmentId} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-3 text-sm font-medium text-rra-navy whitespace-nowrap">{toReportRef(row.appointmentId)}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDateTime(row.date, row.time)}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${statusClasses(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                          <div className="font-medium text-gray-900 break-words">{row.clientName}</div>
                          <div className="text-xs text-gray-500 break-all">{row.clientEmail}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-700">
                          <div className="font-medium text-gray-900 break-words">{row.staffName}</div>
                          <div className="text-xs text-gray-500 break-all">{row.staffEmail}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-700 whitespace-normal break-words leading-snug align-top">{row.department}</td>
                        <td className="px-4 sm:px-6 py-3 text-sm text-gray-700 break-words">{row.serviceType}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
