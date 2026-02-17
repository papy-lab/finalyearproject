const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export type ApiUserRole = "client" | "staff" | "admin";

export interface AuthResponse {
  id: string;
  email: string;
  fullName: string;
  role: ApiUserRole;
  department?: string | null;
  phone?: string | null;
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: ApiUserRole;
  department?: string | null;
  phone?: string | null;
  active: boolean;
}

export interface AppointmentResponse {
  id: string;
  serviceId?: string | null;
  serviceName?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  appointmentType: string;
  date: string;
  time: string;
  location: string;
  status: string;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  staffName?: string | null;
  staffEmail?: string | null;
}

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface StaffResponse {
  id: string;
  fullName: string;
  email: string;
  departmentId?: string | null;
  department?: string | null;
  serviceId?: string | null;
  serviceName?: string | null;
  phone?: string | null;
  status: string;
  appointmentsHandled: number;
}

export interface DepartmentResponse {
  id: string;
  name: string;
  description?: string | null;
  type: "operational" | "support";
  active: boolean;
}

export interface ServiceCatalogResponse {
  id: string;
  name: string;
  description?: string | null;
  departmentId: string;
  departmentName?: string | null;
  requirements?: string | null;
  active: boolean;
}

export interface ClientResponse {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  active: boolean;
  createdAt: string;
  appointments: number;
}

export interface SystemSettingsResponse {
  systemName: string;
  supportEmail: string;
  maxAppointmentsPerDay: number;
  appointmentDuration: number;
  adminNotifications: boolean;
  staffNotifications: boolean;
  clientNotifications: boolean;
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupTime: string;
  twoFactorAuth: boolean;
  passwordExpiry: number;
  updatedAt: string;
}

export interface AdminReportsResponse {
  metrics: {
    totalAppointments: number;
    approvedAppointments: number;
    rejectedAppointments: number;
    pendingAppointments: number;
    approvedRate: number;
    assignedAppointments: number;
    unassignedAppointments: number;
  };
  systemSnapshot: {
    totalUsers: number;
    totalClients: number;
    totalStaff: number;
    totalAdmins: number;
    activeUsers: number;
    totalDepartments: number;
    activeDepartments: number;
    totalServices: number;
    activeServices: number;
    totalNotifications: number;
    unreadNotifications: number;
    averageFeedbackRating: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  weeklyTrend: Array<{ day: string; value: number }>;
  departmentBreakdown: Array<{ name: string; count: number }>;
  staffWorkload: Array<{
    name: string;
    department: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  appointments: Array<{
    appointmentId: string;
    date: string;
    time: string;
    status: string;
    serviceType: string;
    department: string;
    clientName: string;
    clientEmail: string;
    staffName: string;
    staffEmail: string;
  }>;
}

export interface AdminDashboardResponse {
  metrics: {
    totalAppointments: number;
    activeStaff: number;
    avgWaitMinutes: number;
    completionRate: number;
  };
  weeklyTrend: Array<{ day: string; value: number }>;
  systemStatus: Array<{ name: string; status: string; level: "good" | "warn" | "bad" }>;
  recentActivity: Array<{ event: string; user: string; timeAgo: string }>;
}

export interface StaffPerformanceResponse {
  metrics: {
    totalAppointments: number;
    completionRate: number;
    avgRating: number;
    onTimeRate: number;
  };
  appointmentsByMonth: Array<{ month: string; value: number }>;
  feedbackDistribution: Array<{ rating: number; count: number }>;
  serviceBreakdown: Array<{ name: string; count: number; percentage: number }>;
  achievements: Array<{ badge: string; date: string; description: string }>;
  comparisons: Array<{ metric: string; yours: number; average: number }>;
  recentFeedback: Array<{ client: string; rating: number; comment: string; date: string }>;
}

export interface ClientHistoryResponse {
  stats: {
    totalCompleted: number;
    totalCancelled: number;
    avgDurationMinutes: number;
    avgRating: number;
  };
  completedAppointments: Array<{
    id: string;
    date: string;
    time: string;
    title: string;
    duration: string;
    officer: string;
    notes: string;
    rating: number;
  }>;
  cancelledAppointments: Array<{
    id: string;
    date: string;
    title: string;
    reason: string;
    rescheduled: boolean;
  }>;
  monthlyBreakdown: Array<{ month: string; count: number }>;
}

export interface StaffHoursResponse {
  schedule: Array<{ day: string; startTime: string; endTime: string; isWorking: boolean }>;
  blockedDates: Array<{ id: string; date: string; reason?: string | null }>;
  appointments: Array<{
    id: string;
    clientName: string;
    serviceType: string;
    date: string;
    time: string;
    location: string;
    status: "today" | "upcoming" | "completed";
    description?: string | null;
  }>;
  stats: {
    today: number;
    upcoming: number;
    completed: number;
  };
}

export interface ApiError {
  error?: string;
}

export interface MessageResponse {
  message: string;
}

const getAuthToken = () => localStorage.getItem("rra_token");

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const isPublicAuthPath =
    path === "/api/auth/login" ||
    path === "/api/auth/register" ||
    path === "/api/auth/google" ||
    path === "/api/auth/forgot-password" ||
    path === "/api/auth/reset-password";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token && !isPublicAuthPath) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  googleLogin: (idToken: string) =>
    apiFetch<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),
  register: (payload: {
    email: string;
    fullName: string;
    department?: string;
    phone?: string;
    password: string;
  }) =>
    apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        role: "CLIENT",
      }),
    }),
  me: () => apiFetch<UserProfile>("/api/auth/me"),
  forgotPassword: (email: string) =>
    apiFetch<MessageResponse>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    apiFetch<MessageResponse>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    }),

  listAppointments: () => apiFetch<AppointmentResponse[]>("/api/appointments"),
  createAppointment: (payload: {
    serviceId: string;
    date: string;
    time: string;
    location?: string;
    notes?: string;
    staffId?: string;
  }) =>
    apiFetch<AppointmentResponse>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAppointment: (id: string, payload: Partial<{
    status: string;
    date: string;
    time: string;
    location: string;
    notes: string;
    staffId: string;
  }>) =>
    apiFetch<AppointmentResponse>(`/api/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  listNotifications: () => apiFetch<NotificationResponse[]>("/api/notifications"),
  markNotificationRead: (id: string) =>
    apiFetch<NotificationResponse>(`/api/notifications/${id}/read`, {
      method: "PATCH",
    }),
  deleteNotification: (id: string) =>
    apiFetch<void>(`/api/notifications/${id}`, { method: "DELETE" }),

  listStaff: () => apiFetch<StaffResponse[]>("/api/staff"),
  createStaff: (payload: {
    email: string;
    fullName: string;
    departmentId?: string;
    serviceId?: string;
    department?: string;
    phone?: string;
    password: string;
  }) =>
    apiFetch<StaffResponse>("/api/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStaff: (
    id: string,
    payload: {
      email: string;
      fullName: string;
      departmentId?: string;
      serviceId?: string;
      department?: string;
      phone?: string;
      active?: boolean;
    }
  ) =>
    apiFetch<StaffResponse>(`/api/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteStaff: (id: string) =>
    apiFetch<void>(`/api/staff/${id}`, {
      method: "DELETE",
    }),
  listDepartments: () => apiFetch<DepartmentResponse[]>("/api/departments"),
  createDepartment: (payload: {
    name: string;
    description?: string;
    type: "OPERATIONAL" | "SUPPORT";
  }) =>
    apiFetch<DepartmentResponse>("/api/departments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDepartment: (
    id: string,
    payload: {
      name: string;
      description?: string;
      type: "OPERATIONAL" | "SUPPORT";
    }
  ) =>
    apiFetch<DepartmentResponse>(`/api/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteDepartment: (id: string) =>
    apiFetch<void>(`/api/departments/${id}`, {
      method: "DELETE",
    }),
  listServices: () => apiFetch<ServiceCatalogResponse[]>("/api/services"),
  createService: (payload: {
    name: string;
    description?: string;
    departmentId: string;
    requirements?: string;
    active?: boolean;
  }) =>
    apiFetch<ServiceCatalogResponse>("/api/services", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        active: payload.active ?? true,
      }),
    }),
  updateService: (
    id: string,
    payload: {
      name: string;
      description?: string;
      departmentId: string;
      requirements?: string;
      active?: boolean;
    }
  ) =>
    apiFetch<ServiceCatalogResponse>(`/api/services/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...payload,
        active: payload.active ?? true,
      }),
    }),
  deleteService: (id: string) =>
    apiFetch<void>(`/api/services/${id}`, {
      method: "DELETE",
    }),

  listClients: () => apiFetch<ClientResponse[]>("/api/clients"),
  updateClientStatus: (id: string, active: boolean) =>
    apiFetch<ClientResponse>(`/api/clients/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),

  getSettings: () => apiFetch<SystemSettingsResponse>("/api/settings"),
  updateSettings: (payload: Omit<SystemSettingsResponse, "updatedAt">) =>
    apiFetch<SystemSettingsResponse>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getAdminReports: (range: string, department: string) =>
    apiFetch<AdminReportsResponse>(`/api/analytics/admin/reports?range=${range}&department=${department}`),
  getAdminDashboard: () => apiFetch<AdminDashboardResponse>("/api/analytics/admin/dashboard"),
  getStaffPerformance: () => apiFetch<StaffPerformanceResponse>("/api/analytics/staff/performance"),
  getClientHistory: (year: number) =>
    apiFetch<ClientHistoryResponse>(`/api/analytics/client/history?year=${year}`),
  getStaffHours: () => apiFetch<StaffHoursResponse>("/api/analytics/staff/hours"),

  getStaffSchedule: () => apiFetch<StaffHoursResponse["schedule"]>("/api/staff/schedule"),
  updateStaffSchedule: (payload: StaffHoursResponse["schedule"]) =>
    apiFetch<StaffHoursResponse["schedule"]>("/api/staff/schedule", {
      method: "PUT",
      body: JSON.stringify(
        payload.map((entry) => ({
          day: entry.day,
          startTime: entry.startTime,
          endTime: entry.endTime,
          isWorking: entry.isWorking,
        }))
      ),
    }),
  listBlockedDates: () => apiFetch<StaffHoursResponse["blockedDates"]>("/api/staff/schedule/blocked"),
  addBlockedDate: (payload: { date: string; reason?: string }) =>
    apiFetch<StaffHoursResponse["blockedDates"][number]>("/api/staff/schedule/blocked", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteBlockedDate: (id: string) =>
    apiFetch<void>(`/api/staff/schedule/blocked/${id}`, { method: "DELETE" }),
};
