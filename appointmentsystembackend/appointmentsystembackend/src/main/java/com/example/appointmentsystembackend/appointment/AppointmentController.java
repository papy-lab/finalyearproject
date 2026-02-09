package com.example.appointmentsystembackend.appointment;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.appointmentsystembackend.user.User;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/appointments")
@Validated
public class AppointmentController {
	private final AppointmentService appointmentService;

	public AppointmentController(AppointmentService appointmentService) {
		this.appointmentService = appointmentService;
	}

	@GetMapping
	public ResponseEntity<List<AppointmentResponse>> list() {
		User user = currentUser();
		return ResponseEntity.ok(appointmentService.listForUser(user));
	}

	@PostMapping
	public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody AppointmentRequest request) {
		User user = currentUser();
		return new ResponseEntity<>(appointmentService.createAppointment(user, request), HttpStatus.CREATED);
	}

	@PatchMapping("/{id}")
	public ResponseEntity<AppointmentResponse> update(@PathVariable UUID id,
			@RequestBody AppointmentUpdateRequest request) {
		User user = currentUser();
		return ResponseEntity.ok(appointmentService.updateAppointment(user, id, request));
	}

	private User currentUser() {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return (User) authentication.getPrincipal();
	}
}
