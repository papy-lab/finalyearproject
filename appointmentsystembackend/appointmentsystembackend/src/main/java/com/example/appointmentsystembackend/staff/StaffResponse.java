package com.example.appointmentsystembackend.staff;

import com.example.appointmentsystembackend.user.User;

public record StaffResponse(
		String id,
		String fullName,
		String email,
		String departmentId,
		String department,
		String serviceId,
		String serviceName,
		String phone,
		String status,
		long appointmentsHandled) {
	public static StaffResponse from(User user, long appointmentsHandled) {
		return new StaffResponse(
				user.getId().toString(),
				user.getFullName(),
				user.getEmail(),
				user.getDepartmentId() != null ? user.getDepartmentId().toString() : null,
				user.getDepartment(),
				user.getServiceId() != null ? user.getServiceId().toString() : null,
				user.getServiceName(),
				user.getPhone(),
				user.isActive() ? "active" : "inactive",
				appointmentsHandled);
	}
}
