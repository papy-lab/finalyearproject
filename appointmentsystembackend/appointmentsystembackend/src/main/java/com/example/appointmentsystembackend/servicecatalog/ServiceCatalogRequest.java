package com.example.appointmentsystembackend.servicecatalog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ServiceCatalogRequest(
		@NotBlank String name,
		String description,
		@NotBlank String departmentId,
		String requirements,
		@NotNull Boolean active) {
}
