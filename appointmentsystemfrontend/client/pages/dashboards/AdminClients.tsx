import { useEffect, useMemo, useState } from "react";
import { Search, UserCheck, UserX } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, ClientResponse } from "@/lib/api";

type StatusFilter = "all" | "active" | "inactive";

export default function AdminClients() {
  const [clients, setClients] = useState<ClientResponse[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingClientId, setUpdatingClientId] = useState<string | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await api.listClients();
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray((data as { value?: ClientResponse[] }).value)
          ? (data as { value: ClientResponse[] }).value
          : [];
        setClients(normalized);
        setError("");
      } catch (err) {
        const message =
          err instanceof Error && err.message.includes("403")
            ? "Access denied. Please login as admin to view clients."
            : err instanceof Error
            ? err.message
            : "Failed to load clients";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const term = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesQuery =
        !term ||
        client.fullName.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        (client.phone ?? "").toLowerCase().includes(term);
      const matchesStatus =
        filter === "all" || (filter === "active" ? client.active : !client.active);
      return matchesQuery && matchesStatus;
    });
  }, [clients, query, filter]);

  const handleToggleStatus = async (client: ClientResponse) => {
    const nextActive = !client.active;
    try {
      setUpdatingClientId(client.id);
      setError("");
      const updated = await api.updateClientStatus(client.id, nextActive);
      setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("403")
          ? "Access denied. Please login as admin to update client status."
          : err instanceof Error
          ? err.message
          : "Failed to update status";
      setError(message);
    } finally {
      setUpdatingClientId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-rra-navy mb-2">Client Management</h2>
            <p className="text-gray-600">Manage client accounts and activity</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, email, phone..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none transition"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as StatusFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none transition bg-white"
              >
                <option value="all">All Clients</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-rra-navy">Clients</p>
                <p className="text-sm text-gray-500">
                  Showing {filteredClients.length} of {clients.length}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Appointments
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">
                        Loading clients...
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-sm text-gray-500">
                        No clients found.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900">{client.fullName}</p>
                          <p className="text-xs text-gray-500">{client.email}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {client.phone || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {(client.appointments ?? 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                              client.active
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {client.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(client)}
                            disabled={updatingClientId === client.id}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-60 whitespace-nowrap ${
                              client.active
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {updatingClientId === client.id ? null : client.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            {updatingClientId === client.id ? "Updating..." : client.active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
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
