package com.example.appointmentsystembackend.schedule;

public record BlockedDateResponse(
		String id,
		String date,
		String reason) {
	public static BlockedDateResponse from(BlockedDate blockedDate) {
		return new BlockedDateResponse(
				blockedDate.getId().toString(),
				blockedDate.getDate().toString(),
				blockedDate.getReason());
	}
}
