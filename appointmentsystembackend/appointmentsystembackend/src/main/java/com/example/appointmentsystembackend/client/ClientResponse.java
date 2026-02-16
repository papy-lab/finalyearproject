package com.example.appointmentsystembackend.client;

import com.example.appointmentsystembackend.user.User;

public record ClientResponse(
		String id,
		String fullName,
		String email,
		String phone,
		boolean active,
		String createdAt,
		long appointments) {
	public static ClientResponse from(User user, long appointments) {
		return new ClientResponse(
				user.getId().toString(),
				user.getFullName(),
				user.getEmail(),
				user.getPhone(),
				user.isActive(),
				user.getCreatedAt().toString(),
				appointments);
	}
}
