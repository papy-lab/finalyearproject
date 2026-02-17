import { Download, CheckCircle2, Clock as ClockIcon, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ClientLayout from "@/components/layout/ClientLayout";
import { api, ClientHistoryResponse } from "@/lib/api";

export default function ClientHistory() {
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear.toString());
  const [history, setHistory] = useState<ClientHistoryResponse | null>(null);
  const [exportMessage, setExportMessage] = useState("");

  const years = useMemo(() => {
    return [currentYear, currentYear - 1, currentYear - 2].map(String);
  }, [currentYear]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await api.getClientHistory(parseInt(filterYear, 10));
        setHistory(data);
      } catch {
        setHistory(null);
      }
    };
    loadHistory();
  }, [filterYear]);

  const showTemporaryMessage = (message: string, ms = 3000) => {
    setExportMessage(message);
    setTimeout(() => setExportMessage(""), ms);
  };

  const handleExportCsv = () => {
    if (!history) {
      showTemporaryMessage("No history data to export.");
      return;
    }
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const lines = [
      ["Section", "Field", "Value"].map(escapeCsv).join(","),
      ["Stats", "Total Completed", String(history.stats.totalCompleted)].map(escapeCsv).join(","),
      ["Stats", "Total Cancelled", String(history.stats.totalCancelled)].map(escapeCsv).join(","),
      ["Stats", "Average Duration (min)", String(history.stats.avgDurationMinutes)].map(escapeCsv).join(","),
      ["", "", ""].map(escapeCsv).join(","),
      ["Completed", "Date", "Time", "Title", "Duration", "Officer", "Notes"].map(escapeCsv).join(","),
      ...history.completedAppointments.map((apt) =>
        ["Completed", apt.date, apt.time, apt.title, apt.duration, apt.officer, apt.notes]
          .map(escapeCsv)
          .join(",")
      ),
      ["", "", "", "", "", "", ""].map(escapeCsv).join(","),
      ["Cancelled", "Date", "Title", "Reason", "Rescheduled"].map(escapeCsv).join(","),
      ...history.cancelledAppointments.map((apt) =>
        ["Cancelled", apt.date, apt.title, apt.reason, apt.rescheduled ? "Yes" : "No"]
          .map(escapeCsv)
          .join(",")
      ),
      ["", "", "", "", ""].map(escapeCsv).join(","),
      ["Monthly Breakdown", "Month", "Count"].map(escapeCsv).join(","),
      ...history.monthlyBreakdown.map((item) => ["Monthly Breakdown", item.month, String(item.count)].map(escapeCsv).join(",")),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `client-history-${filterYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showTemporaryMessage("CSV exported successfully.");
  };

  const handleExportPdf = () => {
    if (!history) {
      showTemporaryMessage("No history data to export.");
      return;
    }
    const popup = window.open("", "_blank", "width=1100,height=750");
    if (!popup) {
      showTemporaryMessage("Popup blocked. Allow popups to export PDF.", 4000);
      return;
    }

    const completedRows = history.completedAppointments
      .map(
        (apt) =>
          `<tr><td>${apt.date}</td><td>${apt.time}</td><td>${apt.title}</td><td>${apt.duration}</td><td>${apt.officer}</td></tr>`
      )
      .join("");
    const cancelledRows = history.cancelledAppointments
      .map(
        (apt) =>
          `<tr><td>${apt.date}</td><td>${apt.title}</td><td>${apt.reason}</td><td>${apt.rescheduled ? "Yes" : "No"}</td></tr>`
      )
      .join("");

    popup.document.write(`
      <html>
        <head>
          <title>Client History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            h1, h2 { margin: 0 0 8px 0; }
            p { margin: 0 0 12px 0; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Client Appointment History Report</h1>
          <p>Year: ${filterYear} | Generated: ${new Date().toLocaleString()}</p>
          <p>
            Completed: ${history.stats.totalCompleted} |
            Cancelled: ${history.stats.totalCancelled} |
            Avg Duration: ${history.stats.avgDurationMinutes} min
          </p>
          <h2>Completed Appointments</h2>
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Title</th><th>Duration</th><th>Officer</th></tr></thead>
            <tbody>${completedRows || "<tr><td colspan='5'>No completed appointments</td></tr>"}</tbody>
          </table>
          <h2>Cancelled Appointments</h2>
          <table>
            <thead><tr><th>Date</th><th>Title</th><th>Reason</th><th>Rescheduled</th></tr></thead>
            <tbody>${cancelledRows || "<tr><td colspan='4'>No cancelled appointments</td></tr>"}</tbody>
          </table>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
    showTemporaryMessage("PDF export dialog opened.");
  };

  return (
    <ClientLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rra-navy mb-2">Appointment History</h2>
            <p className="text-gray-600">View your past appointments and performance statistics</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Completed</p>
                <CheckCircle2 className="h-5 w-5 text-rra-green" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{history?.stats.totalCompleted ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{history?.stats.totalCancelled ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <ClockIcon className="h-5 w-5 text-rra-blue" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{history?.stats.avgDurationMinutes ?? 0} min</p>
              <p className="text-xs text-gray-500 mt-1">Per appointment</p>
            </div>

          </div>

          {/* Filter and Export */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex gap-4">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportCsv}
              className="ml-auto flex items-center gap-2 bg-rra-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-rra-navy transition"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 bg-rra-navy text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
            >
              Export PDF
            </button>
          </div>

          {exportMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm font-medium text-rra-green">{exportMessage}</span>
            </div>
          )}

          {/* Completed Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-rra-navy">Completed Appointments</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {(history?.completedAppointments || []).map((apt) => (
                <div key={apt.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="grid md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{apt.date}</p>
                      <p className="text-sm text-gray-600">{apt.time}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{apt.title}</p>
                      <p className="text-sm text-gray-600">{apt.officer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{apt.duration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{apt.notes}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {[...Array(apt.rating || 0)].map((_, i) => (
                          <span key={i} className="text-rra-gold">â˜…</span>
                        ))}
                        {[...Array(5 - (apt.rating || 0))].map((_, i) => (
                          <span key={i} className="text-gray-300">â˜…</span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{apt.rating || 0}/5</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancelled Appointments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-rra-navy">Cancelled Appointments</h3>
            </div>
            {(history?.cancelledAppointments || []).length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No cancelled appointments</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {(history?.cancelledAppointments || []).map((apt) => (
                  <div key={apt.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{apt.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{apt.date}</p>
                        <p className="text-sm text-gray-600">Reason: {apt.reason}</p>
                      </div>
                      {apt.rescheduled ? (
                        <span className="inline-block bg-green-100 text-rra-green text-xs font-semibold px-3 py-1 rounded-full">
                          âœ“ Rescheduled
                        </span>
                      ) : (
                        <button className="text-rra-blue font-medium text-sm hover:text-rra-navy transition">
                          Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Breakdown Chart */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-rra-navy mb-6">Monthly Appointments ({filterYear})</h3>
            <div className="space-y-4">
              {(history?.monthlyBreakdown || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="w-20 text-sm font-medium text-gray-700">{item.month}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-8 flex items-center relative">
                    <div
                      className="bg-rra-blue h-full rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{
                        width: `${history && history.stats.totalCompleted > 0 ? (item.count / history.stats.totalCompleted) * 100 : 0}%`,
                      }}
                    >
                      {item.count > 0 && item.count}
                    </div>
                  </div>
                  <span className="w-10 text-right text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
