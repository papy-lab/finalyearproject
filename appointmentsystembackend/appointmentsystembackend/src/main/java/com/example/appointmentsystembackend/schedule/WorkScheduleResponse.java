package com.example.appointmentsystembackend.schedule;

public record WorkScheduleResponse(
		String day,
		String startTime,
		String endTime,
		boolean isWorking) {
	public static WorkScheduleResponse from(WorkSchedule schedule) {
		return new WorkScheduleResponse(
				schedule.getDayOfWeek(),
				schedule.getStartTime().toString(),
				schedule.getEndTime().toString(),
				schedule.isWorking());
	}
}
