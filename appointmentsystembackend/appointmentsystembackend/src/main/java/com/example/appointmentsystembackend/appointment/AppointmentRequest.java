package com.example.appointmentsystembackend.appointment;

import jakarta.validation.constraints.NotBlank;

public record AppointmentRequest(
		String serviceId,
		@NotBlank String date,
		@NotBlank String time,
		String location,
		String notes,
		String staffId) {
}
