package com.example.appointmentsystembackend.servicecatalog;

import com.example.appointmentsystembackend.department.Department;

public record ServiceCatalogResponse(
		String id,
		String name,
		String description,
		String departmentId,
		String departmentName,
		String requirements,
		boolean active) {
	public static ServiceCatalogResponse from(ServiceCatalog service, Department department) {
		return new ServiceCatalogResponse(
				service.getId().toString(),
				service.getName(),
				service.getDescription(),
				service.getDepartmentId().toString(),
				department != null ? department.getName() : null,
				service.getRequirements(),
				service.isActive());
	}
}
