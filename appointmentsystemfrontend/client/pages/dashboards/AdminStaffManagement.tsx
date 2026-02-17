import { Plus, Search, Filter, Mail, Phone, UserCheck, UserX, Edit2, Trash2, MoreVertical } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { api, DepartmentResponse, ServiceCatalogResponse, StaffResponse } from "@/lib/api";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  departmentId?: string;
  service: string;
  serviceId?: string;
  position: string;
  status: "active" | "inactive";
  appointmentsHandled: number;
}

export default function AdminStaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [services, setServices] = useState<ServiceCatalogResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    serviceId: "",
    position: "",
    password: "",
  });
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    serviceId: "",
    position: "",
    active: true,
  });

  const serviceOptions = useMemo(
    () => services.filter((service) => !formData.departmentId || service.departmentId === formData.departmentId),
    [services, formData.departmentId]
  );
  const editServiceOptions = useMemo(
    () => services.filter((service) => !editFormData.departmentId || service.departmentId === editFormData.departmentId),
    [services, editFormData.departmentId]
  );

  const departmentOptions = departments.map((dept) => dept.name);

  const filteredStaff = staff.filter((member) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      member.name.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q) ||
      member.phone.toLowerCase().includes(q) ||
      member.service.toLowerCase().includes(q);
    const matchesDepartment = filterDepartment === "all" || member.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const activeStaff = staff.filter((s) => s.status === "active").length;
  const totalAppointments = staff.reduce((sum, s) => sum + s.appointmentsHandled, 0);
  const avgAppointments = staff.length > 0 ? Math.round(totalAppointments / staff.length) : 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [staffData, departmentData, serviceData] = await Promise.all([
          api.listStaff(),
          api.listDepartments(),
          api.listServices(),
        ]);
        setDepartments(departmentData);
        setServices(serviceData);
        setFormData((prev) => ({
          ...prev,
          departmentId: departmentData[0]?.id || "",
        }));
        setStaff(
          staffData.map((member: StaffResponse) => ({
            id: member.id,
            name: member.fullName,
            email: member.email,
            phone: member.phone || "N/A",
            department: member.department || "General",
            departmentId: member.departmentId || undefined,
            service: member.serviceName || "Not assigned",
            serviceId: member.serviceId || undefined,
            position: "Staff Member",
            status: member.status === "active" ? "active" : "inactive",
            appointmentsHandled: member.appointmentsHandled ?? 0,
          }))
        );
      } catch {
        setStaff([]);
        setDepartments([]);
        setServices([]);
      }
    };
    loadData();
  }, []);

  const handleAddStaff = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.position) {
      setAddError("Please fill in all required fields.");
      return;
    }
    if (formData.password.length < 8) {
      setAddError("Password must be at least 8 characters.");
      return;
    }
    try {
      setAddLoading(true);
      setAddError(null);
      const selectedDepartment = departments.find((d) => d.id === formData.departmentId);
      const selectedService = services.find((s) => s.id === formData.serviceId);
      const created = await api.createStaff({
        email: formData.email,
        fullName: formData.name,
        phone: formData.phone,
        password: formData.password,
        departmentId: formData.departmentId || undefined,
        department: selectedDepartment?.name,
        serviceId: formData.serviceId || undefined,
      });
      setStaff((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.fullName,
          email: created.email,
          phone: created.phone || formData.phone,
          department: created.department || selectedDepartment?.name || "General",
          departmentId: created.departmentId || formData.departmentId || undefined,
          service: created.serviceName || selectedService?.name || "Not assigned",
          serviceId: created.serviceId || formData.serviceId || undefined,
          position: formData.position,
          status: created.status === "active" ? "active" : "inactive",
          appointmentsHandled: created.appointmentsHandled ?? 0,
        },
      ]);
      setFormData({
        name: "",
        email: "",
        phone: "",
        departmentId: departments[0]?.id || "",
        serviceId: "",
        position: "",
        password: "",
      });
      setAddModalOpen(false);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "Failed to add staff member");
    } finally {
      setAddLoading(false);
    }
  };

  const openEdit = (member: StaffMember) => {
    setEditError(null);
    setEditFormData({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone === "N/A" ? "" : member.phone,
      departmentId: member.departmentId || "",
      serviceId: member.serviceId || "",
      position: member.position,
      active: member.status === "active",
    });
    setEditModalOpen(true);
  };

  const handleEditStaff = async () => {
    if (!editFormData.name || !editFormData.email) {
      setEditError("Name and email are required.");
      return;
    }
    try {
      setEditLoading(true);
      setEditError(null);
      const selectedDepartment = departments.find((d) => d.id === editFormData.departmentId);
      const selectedService = services.find((s) => s.id === editFormData.serviceId);
      const updated = await api.updateStaff(editFormData.id, {
        fullName: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone || undefined,
        departmentId: editFormData.departmentId || undefined,
        department: selectedDepartment?.name,
        serviceId: editFormData.serviceId || undefined,
        active: editFormData.active,
      });
      setStaff((prev) =>
        prev.map((s) =>
          s.id === updated.id
            ? {
                ...s,
                name: updated.fullName,
                email: updated.email,
                phone: updated.phone || "N/A",
                department: updated.department || selectedDepartment?.name || "General",
                departmentId: updated.departmentId || editFormData.departmentId || undefined,
                service: updated.serviceName || selectedService?.name || "Not assigned",
                serviceId: updated.serviceId || editFormData.serviceId || undefined,
                position: editFormData.position,
                status: updated.status === "active" ? "active" : "inactive",
              }
            : s
        )
      );
      setEditModalOpen(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : "Failed to update staff member");
    } finally {
      setEditLoading(false);
    }
  };

  const requestDeleteStaff = (member: StaffMember) => {
    setOpenActionMenuId(null);
    setDeleteTarget(member);
  };

  const handleDeleteStaff = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      setDeleteError(null);
      setDeletingStaffId(deleteTarget.id);
      await api.deleteStaff(deleteTarget.id);
      setStaff((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("403")
          ? "Access denied. Please login as admin to delete staff."
          : error instanceof Error
          ? error.message
          : "Failed to delete staff member";
      setDeleteError(message);
    } finally {
      setDeletingStaffId(null);
    }
  };

  const handleToggleStatus = async (member: StaffMember) => {
    setOpenActionMenuId(null);
    const nextActive = member.status !== "active";
    try {
      setStatusError(null);
      setUpdatingStatusId(member.id);
      const updated = await api.updateStaff(member.id, {
        fullName: member.name,
        email: member.email,
        phone: member.phone === "N/A" ? undefined : member.phone,
        departmentId: member.departmentId,
        department: member.department,
        serviceId: member.serviceId,
        active: nextActive,
      });
      setStaff((prev) =>
        prev.map((s) =>
          s.id === member.id
            ? {
                ...s,
                name: updated.fullName,
                email: updated.email,
                phone: updated.phone || "N/A",
                department: updated.department || s.department,
                departmentId: updated.departmentId || s.departmentId,
                service: updated.serviceName || s.service,
                serviceId: updated.serviceId || s.serviceId,
                status: updated.status === "active" ? "active" : "inactive",
              }
            : s
        )
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("403")
          ? "Access denied. Please login as admin to update staff status."
          : error instanceof Error
          ? error.message
          : "Failed to update staff status";
      setStatusError(message);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const openEditFromMenu = (member: StaffMember) => {
    setOpenActionMenuId(null);
    openEdit(member);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-staff-action-menu]")) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-rra-navy mb-2">Staff Management</h2>
              <p className="text-gray-600">Manage staff department and service assignments</p>
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

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Staff", value: staff.length, color: "bg-blue-50 text-rra-blue" },
              { label: "Active", value: activeStaff, color: "bg-green-50 text-rra-green" },
              { label: "Total Appointments", value: totalAppointments, color: "bg-purple-50 text-purple-600" },
              { label: "Avg per Staff", value: avgAppointments, color: "bg-orange-50 text-rra-gold" },
            ].map((stat) => (
              <div key={stat.label} className={`${stat.color} rounded-xl p-6`}>
                <p className="text-sm font-medium opacity-75">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {statusError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {statusError}
              </div>
            )}
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {deleteError}
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, service..."
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
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-end">
                Showing {filteredStaff.length} of {staff.length} staff members
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
            <div className="md:hidden p-4 space-y-3">
              {filteredStaff.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{member.position}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        member.status === "active" ? "bg-green-100 text-rra-green" : "bg-red-100 text-red-600"
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      {member.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-gray-700">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="truncate">{member.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      {member.phone}
                    </p>
                    <p>Department: {member.department}</p>
                    <p>Service: {member.service}</p>
                    <p>Appointments: {member.appointmentsHandled}</p>
                  </div>

                  <div className="mt-4 flex justify-end relative" data-staff-action-menu>
                    <button
                      onClick={() => setOpenActionMenuId((prev) => (prev === member.id ? null : member.id))}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="Open actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openActionMenuId === member.id && (
                      <div className="absolute right-0 top-10 z-30 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                        <button
                          onClick={() => handleToggleStatus(member)}
                          disabled={updatingStatusId === member.id}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 flex items-center gap-2"
                        >
                          {member.status === "active" ? <UserX className="h-4 w-4 text-red-600" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                          {updatingStatusId === member.id ? "Updating..." : member.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => openEditFromMenu(member)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit2 className="h-4 w-4 text-rra-blue" />
                          Edit
                        </button>
                        <button
                          onClick={() => requestDeleteStaff(member)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[14%]" />
                  <col className="w-[20%]" />
                  <col className="w-[12%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[8%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 lg:px-4 py-4 text-left text-xs lg:text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-3 lg:px-4 py-4 text-left text-xs lg:text-sm font-semibold text-gray-900">Contact</th>
                    <th className="px-3 lg:px-4 py-4 text-left text-xs lg:text-sm font-semibold text-gray-900">Department</th>
                    <th className="px-3 lg:px-4 py-4 text-left text-xs lg:text-sm font-semibold text-gray-900">Service</th>
                    <th className="px-3 lg:px-4 py-4 text-left text-xs lg:text-sm font-semibold text-gray-900">Position</th>
                    <th className="px-3 lg:px-4 py-4 text-left text-xs lg:text-sm font-semibold text-gray-900">Appointments</th>
                    <th className="px-3 lg:px-4 py-4 text-left text-xs lg:text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-3 lg:px-4 py-4 text-left text-xs lg:text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-3 lg:px-4 py-4 align-top">
                        <p className="font-medium text-gray-900 text-sm break-words">{member.name}</p>
                      </td>
                      <td className="px-3 lg:px-4 py-4 align-top">
                        <p className="flex items-start gap-2 text-gray-600 text-xs lg:text-sm">
                          <Mail className="h-4 w-4" />
                          <span className="break-all">{member.email}</span>
                        </p>
                        <p className="flex items-start gap-2 text-gray-600 text-xs lg:text-sm mt-1">
                          <Phone className="h-4 w-4" />
                          <span className="break-all">{member.phone}</span>
                        </p>
                      </td>
                      <td className="px-3 lg:px-4 py-4 text-gray-700 text-xs lg:text-sm break-words align-top">{member.department}</td>
                      <td className="px-3 lg:px-4 py-4 text-gray-700 text-xs lg:text-sm break-words align-top">{member.service}</td>
                      <td className="px-3 lg:px-4 py-4 text-gray-700 text-xs lg:text-sm break-words align-top">{member.position}</td>
                      <td className="px-3 lg:px-4 py-4 text-gray-700 text-xs lg:text-sm align-top">{member.appointmentsHandled}</td>
                      <td className="px-3 lg:px-4 py-4 align-top">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            member.status === "active" ? "bg-green-100 text-rra-green" : "bg-red-100 text-red-600"
                          }`}
                        >
                          <UserCheck className="h-4 w-4" />
                          {member.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 lg:px-4 py-4 align-top">
                        <div className="relative" data-staff-action-menu>
                          <button
                            onClick={() => setOpenActionMenuId((prev) => (prev === member.id ? null : member.id))}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Open actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openActionMenuId === member.id && (
                            <div className="absolute right-0 top-10 z-30 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                              <button
                                onClick={() => handleToggleStatus(member)}
                                disabled={updatingStatusId === member.id}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 flex items-center gap-2"
                              >
                                {member.status === "active" ? <UserX className="h-4 w-4 text-red-600" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                                {updatingStatusId === member.id ? "Updating..." : member.status === "active" ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => openEditFromMenu(member)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit2 className="h-4 w-4 text-rra-blue" />
                                Edit
                              </button>
                              <button
                                onClick={() => requestDeleteStaff(member)}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          {filteredStaff.length === 0 && (
              <div className="p-8 text-center text-gray-500">No staff members found matching your criteria.</div>
            )}
          </div>

          {deleteTarget && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-2xl font-bold text-rra-navy mb-3">Confirm Delete</h3>
                <p className="text-gray-600 text-base leading-relaxed mb-6">
                  Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This action cannot be undone.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deletingStaffId === deleteTarget.id}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-lg font-semibold disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteStaff}
                    disabled={deletingStaffId === deleteTarget.id}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-lg font-semibold disabled:opacity-60"
                  >
                    {deletingStaffId === deleteTarget.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {addModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-rra-navy">Add Staff Member</h2>
                  <button onClick={() => setAddModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                    <Plus className="h-5 w-5 rotate-45 text-gray-600" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {addError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {addError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@rra.gov.rw"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+250 788 123 456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Position"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, serviceId: "" })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.serviceId}
                      onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    >
                      <option value="">Select Service (Optional)</option>
                      {serviceOptions.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Temporary password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none md:col-span-2"
                    />
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

          {editModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-rra-navy">Edit Staff Member</h2>
                  <button onClick={() => setEditModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                    <Plus className="h-5 w-5 rotate-45 text-gray-600" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {editError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {editError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      placeholder="Full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="name@rra.gov.rw"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="+250 788 123 456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                    <input
                      type="text"
                      value={editFormData.position}
                      onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                      placeholder="Position"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                    <select
                      value={editFormData.departmentId}
                      onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value, serviceId: "" })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editFormData.serviceId}
                      onChange={(e) => setEditFormData({ ...editFormData, serviceId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    >
                      <option value="">Select Service</option>
                      {editServiceOptions.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editFormData.active ? "active" : "inactive"}
                      onChange={(e) => setEditFormData({ ...editFormData, active: e.target.value === "active" })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none md:col-span-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 bg-rra-blue text-white rounded-lg hover:opacity-90 disabled:opacity-60 transition font-medium"
                  >
                    {editLoading ? "Saving..." : "Save Changes"}
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
