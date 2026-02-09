package com.example.appointmentsystembackend.analytics;

import java.util.List;

public record StaffPerformanceResponse(
		StaffMetrics metrics,
		List<MonthlyCount> appointmentsByMonth,
		List<RatingCount> feedbackDistribution,
		List<ServiceCount> serviceBreakdown,
		List<Achievement> achievements,
		List<PerformanceComparison> comparisons,
		List<RecentFeedback> recentFeedback) {
	public record StaffMetrics(
			long totalAppointments,
			double completionRate,
			double avgRating,
			double onTimeRate) {
	}

	public record MonthlyCount(String month, long value) {
	}

	public record RatingCount(int rating, long count) {
	}

	public record ServiceCount(String name, long count, int percentage) {
	}

	public record Achievement(String badge, String date, String description) {
	}

	public record PerformanceComparison(String metric, double yours, double average) {
	}

	public record RecentFeedback(String client, int rating, String comment, String date) {
	}
}
