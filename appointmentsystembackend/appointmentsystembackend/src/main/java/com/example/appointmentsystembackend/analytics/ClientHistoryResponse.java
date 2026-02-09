package com.example.appointmentsystembackend.analytics;

import java.util.List;

public record ClientHistoryResponse(
		HistoryStats stats,
		List<CompletedAppointment> completedAppointments,
		List<CancelledAppointment> cancelledAppointments,
		List<MonthlyCount> monthlyBreakdown) {
	public record HistoryStats(
			long totalCompleted,
			long totalCancelled,
			double avgDurationMinutes,
			double avgRating) {
	}

	public record CompletedAppointment(
			String id,
			String date,
			String time,
			String title,
			String duration,
			String officer,
			String notes,
			int rating) {
	}

	public record CancelledAppointment(
			String id,
			String date,
			String title,
			String reason,
			boolean rescheduled) {
	}

	public record MonthlyCount(String month, long count) {
	}
}
