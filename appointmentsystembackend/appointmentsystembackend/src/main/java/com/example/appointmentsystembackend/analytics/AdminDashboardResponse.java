package com.example.appointmentsystembackend.analytics;

import java.util.List;

public record AdminDashboardResponse(
		Metrics metrics,
		List<DayCount> weeklyTrend,
		List<SystemStatus> systemStatus,
		List<ActivityItem> recentActivity) {
	public record Metrics(long totalAppointments, long activeStaff, double avgWaitMinutes,
			double completionRate) {
	}

	public record DayCount(String day, long value) {
	}

	public record SystemStatus(String name, String status, String level) {
	}

	public record ActivityItem(String event, String user, String timeAgo) {
	}
}
