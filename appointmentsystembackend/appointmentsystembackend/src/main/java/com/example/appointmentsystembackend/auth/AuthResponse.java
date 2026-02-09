package com.example.appointmentsystembackend.auth;

import com.example.appointmentsystembackend.user.User;

public record AuthResponse(String id, String email, String fullName, String role, String department, String phone,
		String token) {
	public static AuthResponse from(User user, String token) {
		return new AuthResponse(user.getId().toString(), user.getEmail(), user.getFullName(),
				user.getRole().name().toLowerCase(), user.getDepartment(), user.getPhone(), token);
	}
}
