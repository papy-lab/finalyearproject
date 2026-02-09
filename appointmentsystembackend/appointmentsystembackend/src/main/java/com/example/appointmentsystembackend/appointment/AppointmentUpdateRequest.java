package com.example.appointmentsystembackend.appointment;

public record AppointmentUpdateRequest(
		String status,
		String date,
		String time,
		String location,
		String notes,
		String staffId) {
}
