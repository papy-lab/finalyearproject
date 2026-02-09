package com.example.appointmentsystembackend.schedule;

import jakarta.validation.constraints.NotBlank;

public record WorkScheduleRequest(
		@NotBlank String day,
		@NotBlank String startTime,
		@NotBlank String endTime,
		boolean isWorking) {
}
