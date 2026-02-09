package com.example.appointmentsystembackend.analytics;

import java.util.List;

public record AdminReportsResponse(
		Metrics metrics,
		List<ServiceCount> serviceTypes,
		List<StaffSummary> topStaff,
		List<DayCount> weeklyTrend,
		List<DepartmentCount> departmentBreakdown,
		List<HealthMetric> systemHealth) {
	public record Metrics(
			long totalAppointments,
			double completionRate,
			double avgResponseTimeHours,
			long activeUsers) {
	}

	public record ServiceCount(String name, long count, int percentage) {
	}

	public record StaffSummary(String name, String department, long completed, double rating) {
	}

	public record DayCount(String day, long value) {
	}

	public record DepartmentCount(String name, long count) {
	}

	public record HealthMetric(String label, double value, String status) {
	}
}
