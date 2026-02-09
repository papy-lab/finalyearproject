package com.example.appointmentsystembackend.notification;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.user.User;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
	private final NotificationRepository notificationRepository;

	public NotificationController(NotificationRepository notificationRepository) {
		this.notificationRepository = notificationRepository;
	}

	@GetMapping
	public ResponseEntity<List<NotificationResponse>> list() {
		User user = currentUser();
		List<NotificationResponse> notifications = notificationRepository.findByUserId(user.getId()).stream()
				.map(NotificationResponse::from)
				.toList();
		return ResponseEntity.ok(notifications);
	}

	@PatchMapping("/{id}/read")
	public ResponseEntity<NotificationResponse> markRead(@PathVariable UUID id) {
		User user = currentUser();
		Notification notification = notificationRepository.findById(id)
				.filter(n -> n.getUser().getId().equals(user.getId()))
				.orElseThrow(() -> new IllegalArgumentException("Notification not found"));
		notification.setRead(true);
		return ResponseEntity.ok(NotificationResponse.from(notification));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		User user = currentUser();
		Notification notification = notificationRepository.findById(id)
				.filter(n -> n.getUser().getId().equals(user.getId()))
				.orElseThrow(() -> new IllegalArgumentException("Notification not found"));
		notificationRepository.delete(notification);
		return ResponseEntity.noContent().build();
	}

	private User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return (User) authentication.getPrincipal();
	}
}
