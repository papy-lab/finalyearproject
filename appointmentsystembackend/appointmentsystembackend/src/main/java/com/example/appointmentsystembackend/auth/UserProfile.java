package com.example.appointmentsystembackend.auth;

import com.example.appointmentsystembackend.user.User;

public record UserProfile(String id, String email, String fullName, String role, String department, String phone,
		boolean active) {
	public static UserProfile from(User user) {
		return new UserProfile(user.getId().toString(), user.getEmail(), user.getFullName(),
				user.getRole().name().toLowerCase(), user.getDepartment(), user.getPhone(), user.isActive());
	}
}
