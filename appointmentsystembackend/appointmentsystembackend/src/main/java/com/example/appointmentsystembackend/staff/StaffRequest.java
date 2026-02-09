package com.example.appointmentsystembackend.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StaffRequest(
		@Email @NotBlank String email,
		@NotBlank String fullName,
		String department,
		String phone,
		@NotBlank @Size(min = 8, max = 72) String password) {
}
