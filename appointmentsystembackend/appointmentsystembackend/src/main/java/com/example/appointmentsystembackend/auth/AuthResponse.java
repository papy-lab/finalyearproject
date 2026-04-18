package com.example.appointmentsystembackend.auth;

import com.example.appointmentsystembackend.user.User;

public record AuthResponse(String id, String email, String fullName, String role, String department, String phone,
		String token, boolean requiresOtp, String challengeId, String message) {
	public static AuthResponse from(User user, String token) {
		return new AuthResponse(user.getId().toString(), user.getEmail(), user.getFullName(),
				user.getRole().name().toLowerCase(), user.getDepartment(), user.getPhone(), token, false, null, null);
	}

	public static AuthResponse otpRequired(User user, String challengeId, String message) {
		return new AuthResponse(user.getId().toString(), user.getEmail(), user.getFullName(),
				user.getRole().name().toLowerCase(), user.getDepartment(), user.getPhone(), null, true, challengeId,
				message);
	}

	public static AuthResponse signupOtpRequired(String email, String fullName, String challengeId, String message) {
		return new AuthResponse(null, email, fullName, "client", null, null, null, true, challengeId, message);
	}
}
