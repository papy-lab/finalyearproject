import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, DepartmentResponse, ServiceCatalogResponse } from "@/lib/api";

export default function AdminServices() {
  const [services, setServices] = useState<ServiceCatalogResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCatalogResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceCatalogResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    departmentId: "",
    requirements: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [servicesData, departmentsData] = await Promise.all([api.listServices(), api.listDepartments()]);
        setServices(servicesData);
        setDepartments(departmentsData);
        setForm((prev) => ({ ...prev, departmentId: departmentsData[0]?.id || "" }));
      } catch {
        setServices([]);
        setDepartments([]);
      }
    };
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.departmentId) {
      setError("Service name and department are required.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const created = await api.createService(form);
      setServices((prev) => [...prev, created]);
      setForm({ name: "", description: "", departmentId: departments[0]?.id || "", requirements: "" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) {
      return;
    }
    if (!form.name.trim() || !form.departmentId) {
      setError("Service name and department are required.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const updated = await api.updateService(editing.id, form);
      setServices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditing(null);
      setOpen(false);
      setForm({ name: "", description: "", departmentId: departments[0]?.id || "", requirements: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      setDeletingId(deleteTarget.id);
      await api.deleteService(deleteTarget.id);
      setServices((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-rra-navy mb-2">Services</h2>
              <p className="text-gray-600">Create and manage services offered to clients</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                setEditing(null);
                setForm({ name: "", description: "", departmentId: departments[0]?.id || "", requirements: "" });
                setOpen(true);
              }}
              className="bg-rra-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Service
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Requirements</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-gray-200">
                    <td className="px-6 py-4 text-gray-900 font-medium">{service.name}</td>
                    <td className="px-6 py-4 text-gray-700">{service.departmentName || "-"}</td>
                    <td className="px-6 py-4 text-gray-700">{service.requirements || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditing(service);
                            setForm({
                              name: service.name,
                              description: service.description || "",
                              departmentId: service.departmentId,
                              requirements: service.requirements || "",
                            });
                            setError(null);
                            setOpen(true);
                          }}
                          className="p-2 text-rra-blue hover:bg-blue-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setError(null);
                            setDeleteTarget(service);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {services.length === 0 && <div className="p-8 text-center text-gray-500">No services found.</div>}
          </div>

          {open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-rra-navy">{editing ? "Update Service" : "Add Service"}</h3>
                </div>
                <div className="p-6 space-y-4">
                  {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Service name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={form.requirements}
                    onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    placeholder="Requirements"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setEditing(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editing ? handleUpdate : handleCreate}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-rra-blue text-white rounded-lg disabled:opacity-60"
                  >
                    {loading ? (editing ? "Updating..." : "Creating...") : editing ? "Update Service" : "Create Service"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {deleteTarget && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-2xl font-bold text-rra-navy mb-3">Confirm Delete</h3>
                <p className="text-gray-600 text-base leading-relaxed mb-6">
                  Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This action
                  cannot be undone.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deletingId === deleteTarget.id}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-lg font-semibold disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deletingId === deleteTarget.id}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-lg font-semibold disabled:opacity-60"
                  >
                    {deletingId === deleteTarget.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
