package com.example.appointmentsystembackend.analytics;

import java.util.List;

public record AdminReportsResponse(
		Metrics metrics,
		SystemSnapshot systemSnapshot,
		List<StatusCount> statusBreakdown,
		List<DayCount> weeklyTrend,
		List<DepartmentCount> departmentBreakdown,
		List<StaffWorkload> staffWorkload,
		List<AppointmentReportItem> appointments) {
	public record Metrics(
			long totalAppointments,
			long approvedAppointments,
			long rejectedAppointments,
			long pendingAppointments,
			double approvedRate,
			long assignedAppointments,
			long unassignedAppointments) {
	}

	public record SystemSnapshot(
			long totalUsers,
			long totalClients,
			long totalStaff,
			long totalAdmins,
			long activeUsers,
			long totalDepartments,
			long activeDepartments,
			long totalServices,
			long activeServices,
			long totalNotifications,
			long unreadNotifications,
			double averageFeedbackRating) {
	}

	public record StatusCount(String status, long count) {
	}

	public record DayCount(String day, long value) {
	}

	public record DepartmentCount(String name, long count) {
	}

	public record StaffWorkload(String name, String department, long total, long approved, long rejected, long pending) {
	}

	public record AppointmentReportItem(
			String appointmentId,
			String date,
			String time,
			String status,
			String serviceType,
			String department,
			String clientName,
			String clientEmail,
			String staffName,
			String staffEmail) {
	}
}
