import { Edit2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, DepartmentResponse } from "@/lib/api";

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentResponse | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "OPERATIONAL" as "OPERATIONAL" | "SUPPORT",
  });

  const fetchDepartments = async () => {
    try {
      setLoadError(null);
      const data = await api.listDepartments();
      setDepartments(data);
    } catch (err) {
      setDepartments([]);
      setLoadError(err instanceof Error ? err.message : "Failed to load departments");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError("Department name is required.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const created = await api.createDepartment(form);
      setDepartments((prev) => [...prev, created]);
      await fetchDepartments();
      setForm({ name: "", description: "", type: "OPERATIONAL" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create department");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) {
      return;
    }
    if (!form.name.trim()) {
      setError("Department name is required.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const updated = await api.updateDepartment(editing.id, form);
      setDepartments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      await fetchDepartments();
      setEditing(null);
      setOpen(false);
      setForm({ name: "", description: "", type: "OPERATIONAL" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update department");
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
      await api.deleteDepartment(deleteTarget.id);
      setDepartments((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      await fetchDepartments();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete department");
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
              <h2 className="text-3xl font-bold text-rra-navy mb-2">Departments</h2>
              <p className="text-gray-600">Create and manage department catalog</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                setEditing(null);
                setForm({ name: "", description: "", type: "OPERATIONAL" });
                setOpen(true);
              }}
              className="bg-rra-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Department
            </button>
          </div>

          {loadError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <button
                onClick={fetchDepartments}
                className="px-3 py-1.5 bg-white border border-red-200 rounded-md hover:bg-red-50 transition"
              >
                Retry
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialLoading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Loading departments...
                    </td>
                  </tr>
                )}
                {departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-gray-200">
                    <td className="px-6 py-4 text-gray-900 font-medium">{dept.name}</td>
                    <td className="px-6 py-4 text-gray-700 capitalize">{dept.type}</td>
                    <td className="px-6 py-4 text-gray-700">{dept.description || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditing(dept);
                            setForm({
                              name: dept.name,
                              description: dept.description || "",
                              type: dept.type.toUpperCase() as "OPERATIONAL" | "SUPPORT",
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
                            setDeleteTarget(dept);
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
            {!initialLoading && departments.length === 0 && (
              <div className="p-8 text-center text-gray-500">No departments found.</div>
            )}
          </div>

          {open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-rra-navy">
                    {editing ? "Update Department" : "Add Department"}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Department name"
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
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "OPERATIONAL" | "SUPPORT" })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                  >
                    <option value="OPERATIONAL">Operational</option>
                    <option value="SUPPORT">Support</option>
                  </select>
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
                    {loading ? (editing ? "Updating..." : "Creating...") : editing ? "Update Department" : "Create Department"}
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
