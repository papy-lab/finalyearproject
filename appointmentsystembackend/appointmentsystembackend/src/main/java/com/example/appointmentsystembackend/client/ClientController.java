package com.example.appointmentsystembackend.client;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.appointment.AppointmentRepository;
import com.example.appointmentsystembackend.user.Role;
import com.example.appointmentsystembackend.user.User;
import com.example.appointmentsystembackend.user.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clients")
@Validated
public class ClientController {
	private final UserRepository userRepository;
	private final AppointmentRepository appointmentRepository;

	public ClientController(UserRepository userRepository, AppointmentRepository appointmentRepository) {
		this.userRepository = userRepository;
		this.appointmentRepository = appointmentRepository;
	}

	@GetMapping
	public ResponseEntity<List<ClientResponse>> list() {
		List<ClientResponse> clients = userRepository.findAll().stream()
				.filter(user -> user.getRole() == Role.CLIENT)
				.map(user -> ClientResponse.from(user, appointmentRepository.countByClientId(user.getId())))
				.toList();
		return ResponseEntity.ok(clients);
	}

	@PatchMapping("/{id}/status")
	public ResponseEntity<ClientResponse> updateStatus(@PathVariable UUID id,
			@Valid @RequestBody ClientStatusRequest request) {
		requireAdmin();
		User user = userRepository.findById(id).orElseThrow();
		if (user.getRole() != Role.CLIENT) {
			throw new IllegalArgumentException("User is not a client");
		}
		user.setActive(Boolean.TRUE.equals(request.active()));
		userRepository.save(user);
		return ResponseEntity.ok(ClientResponse.from(user, appointmentRepository.countByClientId(user.getId())));
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
