package com.example.appointmentsystembackend.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record StaffUpdateRequest(
		@Email @NotBlank String email,
		@NotBlank String fullName,
		String departmentId,
		String serviceId,
		String department,
		String phone,
		Boolean active) {
}
