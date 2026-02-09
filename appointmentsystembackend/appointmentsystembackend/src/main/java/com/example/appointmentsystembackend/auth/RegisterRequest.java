package com.example.appointmentsystembackend.auth;

import com.example.appointmentsystembackend.user.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
		@Email @NotBlank String email,
		@NotBlank String fullName,
		@NotNull Role role,
		String department,
		String phone,
		@NotBlank @Size(min = 8, max = 72) String password) {
}
