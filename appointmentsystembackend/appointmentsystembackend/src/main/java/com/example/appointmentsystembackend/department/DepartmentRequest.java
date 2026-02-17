package com.example.appointmentsystembackend.department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DepartmentRequest(
		@NotBlank String name,
		String description,
		@NotNull DepartmentType type) {
}
