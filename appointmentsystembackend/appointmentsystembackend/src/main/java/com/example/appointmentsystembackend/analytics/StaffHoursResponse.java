package com.example.appointmentsystembackend.analytics;

import java.util.List;

public record StaffHoursResponse(
		List<ScheduleEntry> schedule,
		List<BlockedEntry> blockedDates,
		List<StaffAppointment> appointments,
		StaffAppointmentStats stats) {
	public record ScheduleEntry(String day, String startTime, String endTime, boolean isWorking) {
	}

	public record BlockedEntry(String id, String date, String reason) {
	}

	public record StaffAppointment(
			String id,
			String clientName,
			String serviceType,
			String date,
			String time,
			String location,
			String status,
			String description) {
	}

	public record StaffAppointmentStats(
			long today,
			long upcoming,
			long completed) {
	}
}
