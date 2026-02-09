package com.example.appointmentsystembackend.staff;

import com.example.appointmentsystembackend.user.User;

public record StaffResponse(
		String id,
		String fullName,
		String email,
		String department,
		String phone,
		String status,
		long appointmentsHandled) {
	public static StaffResponse from(User user, long appointmentsHandled) {
		return new StaffResponse(
				user.getId().toString(),
				user.getFullName(),
				user.getEmail(),
				user.getDepartment(),
				user.getPhone(),
				user.isActive() ? "active" : "inactive",
				appointmentsHandled);
	}
}
