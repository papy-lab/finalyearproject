package com.example.appointmentsystembackend.appointment;

import jakarta.validation.constraints.NotBlank;

public record AppointmentRequest(
		@NotBlank String appointmentType,
		@NotBlank String date,
		@NotBlank String time,
		@NotBlank String location,
		String notes,
		String staffId) {
}
