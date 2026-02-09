const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

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
  department?: string | null;
  phone?: string | null;
  status: string;
  appointmentsHandled: number;
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
    completionRate: number;
    avgResponseTimeHours: number;
    activeUsers: number;
  };
  serviceTypes: Array<{ name: string; count: number; percentage: number }>;
  topStaff: Array<{ name: string; department: string; completed: number; rating: number }>;
  weeklyTrend: Array<{ day: string; value: number }>;
  departmentBreakdown: Array<{ name: string; count: number }>;
  systemHealth: Array<{ label: string; value: number; status: string }>;
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

const getAuthToken = () => localStorage.getItem("rra_token");

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
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
  register: (payload: {
    email: string;
    fullName: string;
    role: ApiUserRole;
    department?: string;
    phone?: string;
    password: string;
  }) =>
    apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        role: payload.role.toUpperCase(),
      }),
    }),
  me: () => apiFetch<UserProfile>("/api/auth/me"),

  listAppointments: () => apiFetch<AppointmentResponse[]>("/api/appointments"),
  createAppointment: (payload: {
    appointmentType: string;
    date: string;
    time: string;
    location: string;
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
    department?: string;
    phone?: string;
    password: string;
  }) =>
    apiFetch<StaffResponse>("/api/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getSettings: () => apiFetch<SystemSettingsResponse>("/api/settings"),
  updateSettings: (payload: Omit<SystemSettingsResponse, "updatedAt">) =>
    apiFetch<SystemSettingsResponse>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  getAdminReports: (range: string, department: string) =>
    apiFetch<AdminReportsResponse>(`/api/analytics/admin/reports?range=${range}&department=${department}`),
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
