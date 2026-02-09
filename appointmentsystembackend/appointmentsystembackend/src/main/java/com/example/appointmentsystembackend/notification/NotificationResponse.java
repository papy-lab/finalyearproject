package com.example.appointmentsystembackend.notification;

import java.time.OffsetDateTime;

public record NotificationResponse(
		String id,
		String type,
		String title,
		String message,
		boolean read,
		OffsetDateTime createdAt) {
	public static NotificationResponse from(Notification notification) {
		return new NotificationResponse(
				notification.getId().toString(),
				notification.getType().name().toLowerCase(),
				notification.getTitle(),
				notification.getMessage(),
				notification.isRead(),
				notification.getCreatedAt());
	}
}
