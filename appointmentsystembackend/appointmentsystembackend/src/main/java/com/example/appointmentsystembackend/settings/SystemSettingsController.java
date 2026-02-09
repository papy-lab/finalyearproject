package com.example.appointmentsystembackend.settings;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/settings")
@Validated
public class SystemSettingsController {
	private final SystemSettingsService service;

	public SystemSettingsController(SystemSettingsService service) {
		this.service = service;
	}

	@GetMapping
	public ResponseEntity<SystemSettingsResponse> getSettings() {
		requireAdmin();
		return ResponseEntity.ok(SystemSettingsResponse.from(service.getSettings()));
	}

	@PutMapping
	public ResponseEntity<SystemSettingsResponse> update(@Valid @RequestBody SystemSettingsUpdateRequest request) {
		requireAdmin();
		SystemSettings updated = service.update(service.getSettings(), request);
		return ResponseEntity.ok(SystemSettingsResponse.from(updated));
	}

	private void requireAdmin() {
		User user = currentUser();
		if (user.getRole() != Role.ADMIN) {
			throw new AccessDeniedException("Admin role required");
		}
	}

	private User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return (User) authentication.getPrincipal();
	}
}
