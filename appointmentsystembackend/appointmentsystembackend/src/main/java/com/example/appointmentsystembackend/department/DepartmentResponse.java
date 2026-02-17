package com.example.appointmentsystembackend.department;

public record DepartmentResponse(
		String id,
		String name,
		String description,
		String type,
		boolean active) {
	public static DepartmentResponse from(Department department) {
		return new DepartmentResponse(
				department.getId().toString(),
				department.getName(),
				department.getDescription(),
				department.getType().name().toLowerCase(),
				department.isActive());
	}
}
