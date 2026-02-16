import { Plus, Search, Filter, Edit2, Trash2, CheckCircle2, AlertCircle, Mail, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, StaffResponse } from "@/lib/api";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: "active" | "inactive";
  joinDate: string;
  appointmentsHandled: number;
}

export default function AdminStaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "Tax Services",
    position: "",
    password: ""
  });
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    department: "Tax Services",
    position: "",
    status: "active" as StaffMember["status"],
  });

  const departments = Array.from(new Set(staff.map(s => s.department))).filter(Boolean);
  const departmentOptions = departments.length > 0
    ? departments
    : ["Tax Services", "License Management", "Compliance", "Filing Services", "Audit", "General"];

  const handleToggleStatus = (id: string) => {
    setStaff(prev =>
      prev.map(s =>
        s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s
      )
    );
  };

  const handleDeleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const openEditModal = (member: StaffMember) => {
    setEditError(null);
    setEditFormData({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      department: member.department,
      position: member.position,
      status: member.status,
    });
    setEditModalOpen(true);
  };

  const handleEditStaff = () => {
    if (!editFormData.name || !editFormData.email || !editFormData.phone || !editFormData.position) {
      setEditError("Please fill in all fields.");
      return;
    }
    setStaff(prev =>
      prev.map((s) =>
        s.id === editFormData.id
          ? {
              ...s,
              name: editFormData.name,
              email: editFormData.email,
              phone: editFormData.phone,
              department: editFormData.department,
              position: editFormData.position,
              status: editFormData.status,
            }
          : s
      )
    );
    setEditModalOpen(false);
    setSelectedStaff(null);
  };

  const openDeleteModal = (member: StaffMember) => {
    setSelectedStaff(member);
    setDeleteModalOpen(true);
  };

  const handleAddStaff = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.position || !formData.password) {
      setAddError("Please fill in all fields.");
      return;
    }
    if (formData.password.length < 8) {
      setAddError("Password must be at least 8 characters.");
      return;
    }

    try {
      setAddLoading(true);
      setAddError(null);
      const created = await api.createStaff({
        email: formData.email,
        fullName: formData.name,
        department: formData.department,
        phone: formData.phone,
        password: formData.password,
      });
      const newStaff: StaffMember = {
        id: created.id,
        name: created.fullName,
        email: created.email,
        phone: created.phone || formData.phone,
        department: created.department || formData.department,
        position: formData.position,
        status: created.status === "active" ? "active" : "inactive",
        joinDate: new Date().toISOString().split('T')[0],
        appointmentsHandled: created.appointmentsHandled ?? 0
      };
      setStaff(prev => [...prev, newStaff]);
      setFormData({ name: "", email: "", phone: "", department: "Tax Services", position: "", password: "" });
      setAddModalOpen(false);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "Failed to add staff member");
    } finally {
      setAddLoading(false);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.includes(searchTerm) ||
      member.phone.includes(searchTerm);
    const matchesDepartment = filterDepartment === "all" || member.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const activeStaff = staff.filter(s => s.status === "active").length;
  const totalAppointments = staff.reduce((sum, s) => sum + s.appointmentsHandled, 0);
  const avgAppointments = staff.length > 0 ? Math.round(totalAppointments / staff.length) : 0;

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const data = await api.listStaff();
        setStaff(data.map((member: StaffResponse) => ({
          id: member.id,
          name: member.fullName,
          email: member.email,
          phone: member.phone || "N/A",
          department: member.department || "General",
          position: "Staff Member",
          status: member.status === "active" ? "active" : "inactive",
          joinDate: new Date().toISOString().split('T')[0],
          appointmentsHandled: member.appointmentsHandled ?? 0
        })));
      } catch {
        setStaff([]);
      }
    };
    loadStaff();
  }, []);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-rra-navy mb-2">Staff Management</h2>
              <p className="text-gray-600">Manage RRA staff members and their schedules</p>
            </div>
            <button
              onClick={() => {
                setAddError(null);
                setAddModalOpen(true);
              }}
              className="bg-rra-blue text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Staff Member
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Staff", value: staff.length, color: "bg-blue-50 text-rra-blue" },
              { label: "Active", value: activeStaff, color: "bg-green-50 text-rra-green" },
              { label: "Total Appointments", value: totalAppointments, color: "bg-purple-50 text-purple-600" },
              { label: "Avg per Staff", value: avgAppointments, color: "bg-orange-50 text-rra-gold" }
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.color} rounded-xl p-6`}>
                <p className="text-sm font-medium opacity-75">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-end">
                Showing {filteredStaff.length} of {staff.length} staff members
              </div>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="md:hidden p-4 space-y-4">
              {filteredStaff.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">Since {new Date(member.joinDate).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => handleToggleStatus(member.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                        member.status === "active"
                          ? "bg-green-100 text-rra-green hover:bg-green-200"
                          : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}
                    >
                      {member.status === "active" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {member.status === "active" ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {member.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {member.phone}
                    </p>
                    <p><span className="font-medium text-gray-700">Department:</span> {member.department}</p>
                    <p><span className="font-medium text-gray-700">Position:</span> {member.position}</p>
                    <p><span className="font-medium text-gray-700">Appointments:</span> {member.appointmentsHandled}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(member)}
                      className="flex-1 p-2 text-rra-blue border border-blue-200 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(member)}
                      className="flex-1 p-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Position</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Appointments</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[130px]">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">Since {new Date(member.joinDate).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="flex items-center gap-2 text-gray-600 text-sm">
                          <Mail className="h-4 w-4" />
                          {member.email}
                        </p>
                        <p className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                          <Phone className="h-4 w-4" />
                          {member.phone}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{member.department}</td>
                      <td className="px-6 py-4 text-gray-600">{member.position}</td>
                      <td className="px-6 py-4">
                        <div className="text-center">
                          <p className="font-bold text-rra-blue">{member.appointmentsHandled}</p>
                          <p className="text-xs text-gray-500">handled</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(member.id)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                            member.status === "active"
                              ? "bg-green-100 text-rra-green hover:bg-green-200"
                              : "bg-red-100 text-red-600 hover:bg-red-200"
                          }`}
                        >
                          {member.status === "active" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          {member.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 text-rra-blue hover:bg-blue-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(member)}
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
            </div>
            {filteredStaff.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No staff members found matching your criteria.
              </div>
            )}
          </div>

          {/* Edit Staff Modal */}
          {editModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-rra-navy">Edit Staff Member</h2>
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {editError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {editError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Department</label>
                      <select
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                      >
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Position</label>
                      <input
                        type="text"
                        value={editFormData.position}
                        onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as StaffMember["status"] })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditStaff}
                    className="flex-1 px-4 py-2 bg-rra-blue text-white rounded-lg hover:opacity-90 transition font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Staff Modal */}
          {deleteModalOpen && selectedStaff && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Staff Member</h2>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete <span className="font-medium text-gray-900">{selectedStaff.name}</span>?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteStaff(selectedStaff.id);
                        setDeleteModalOpen(false);
                        setSelectedStaff(null);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Staff Modal */}
          {addModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-rra-navy">Add Staff Member</h2>
                  <button
                    onClick={() => setAddModalOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {addError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {addError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                        placeholder="name@rra.gov.rw"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                        placeholder="+250 788 123 456"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Department</label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                      >
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Position</label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                        placeholder="e.g., Senior Officer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Temporary Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rra-blue focus:border-transparent outline-none"
                        placeholder="Set initial password"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setAddModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStaff}
                    disabled={addLoading}
                    className="flex-1 px-4 py-2 bg-rra-blue text-white rounded-lg hover:opacity-90 disabled:opacity-60 transition font-medium"
                  >
                    {addLoading ? "Adding..." : "Add Staff Member"}
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
