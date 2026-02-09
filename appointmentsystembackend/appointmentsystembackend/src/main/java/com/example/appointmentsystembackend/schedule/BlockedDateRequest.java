package com.example.appointmentsystembackend.schedule;

import jakarta.validation.constraints.NotBlank;

public record BlockedDateRequest(
		@NotBlank String date,
		String reason) {
}
